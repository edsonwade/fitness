import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { PRIMARY_KEYS, TABLES, type TableName } from './entities';

/**
 * The migrations and the client schemas are two descriptions of the same tables,
 * written in two languages, and nothing but discipline keeps them in step. This
 * reads the SQL and checks them against each other, so a column added to one and
 * forgotten in the other fails here instead of rendering `undefined` on a screen.
 *
 * It reads every migration from `003` onward, in the order Postgres runs them, and
 * replays both `create table` and `alter table ... add column`. That is not tidiness:
 * `004` adds `custom_exercises.kind` with an `alter`, and a check that only read the
 * file where a table was first created would have said the client had a column the
 * database does not. `001` and `002` are deliberately out of scope — they build the
 * old shared catalogue, which this registry does not describe.
 */

/** Migration file name to its SQL, in run order. */
const MIGRATIONS = readdirSync('supabase')
  .filter((file) => /^\d{3}_.+\.sql$/.test(file))
  .sort()
  .map((file) => ({ file, sql: readFileSync(`supabase/${file}`, 'utf8') }))
  .filter(({ file }) => Number(file.slice(0, 3)) >= 3);

/** The migration that introduced the private schema, still checked on its own below. */
const SQL = MIGRATIONS.find(({ file }) => file.startsWith('003'))!.sql;

const withoutComments = (sql: string) => sql.replace(/--[^\n]*/g, '');

/** Adds the `create table` bodies of one migration to the running picture. */
function readCreates(sql: string, into: Map<string, Set<string>>): void {
  const re = /create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/g;
  for (const [, name, body] of sql.matchAll(re)) {
    const columns = into.get(name) ?? new Set<string>();
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      // Skip comments, and the table constraints that share the body.
      if (!trimmed || trimmed.startsWith('--')) continue;
      if (/^(primary key|unique|constraint|check|foreign key)\b/i.test(trimmed)) continue;
      const match = /^(\w+)\s+\S/.exec(trimmed);
      if (match) columns.add(match[1]);
    }
    into.set(name, columns);
  }
}

/**
 * Replays `alter table ... add column` onto tables already seen.
 *
 * A table this registry does not describe is skipped rather than created: `003`
 * itself alters `community_posts`, which `002` owns, and inventing an entry for it
 * here would make the registry look incomplete for a table it never claimed.
 */
function readAdds(sql: string, into: Map<string, Set<string>>): void {
  const re = /alter\s+table\s+(?:only\s+)?public\.(\w+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)/gi;
  for (const [, table, column] of withoutComments(sql).matchAll(re)) {
    into.get(table)?.add(column);
  }
}

const parsed = new Map<string, Set<string>>();
for (const { sql } of MIGRATIONS) {
  readCreates(sql, parsed);
  readAdds(sql, parsed);
}

/** Which tables `003` itself creates, for the checks that are about that file. */
const createdIn003 = new Map<string, Set<string>>();
readCreates(SQL, createdIn003);

/**
 * `migration_errors` is deliberately absent from the client registry: it has no RLS
 * policy, only the service role reads it, and giving it a client schema would imply
 * the app is meant to.
 */
const SERVER_ONLY = new Set(['migration_errors']);

/** Read by everyone, owned by their author, so `user_id` is not their owner column. */
const AUTHORED = new Set(['catalog_exercises', 'day_additions']);

describe('the migrations against the client entities', () => {
  it('finds every table in the SQL', () => {
    expect(parsed.size).toBeGreaterThan(0);
  });

  it('registers every table the migrations create, and no table they do not', () => {
    const inSql = [...parsed.keys()].filter((t) => !SERVER_ONLY.has(t)).sort();
    const registered = (Object.keys(TABLES) as TableName[]).sort();
    expect(registered).toEqual(inSql);
  });

  it('gives every table the plan promises a schema', () => {
    // The thirteen private tables from plan section 8.1, plus the two additive
    // catalogue tables from 8.3.
    const promised = [
      'exercise_logs', 'sessions', 'session_entries', 'goals', 'trainers',
      'trainer_sessions', 'user_profiles', 'user_settings', 'custom_exercises',
      'exercise_overrides', 'hidden_items', 'rest_preferences', 'exercise_order',
      'catalog_exercises', 'day_additions',
    ];
    for (const table of promised) {
      expect(parsed.has(table), `${table} missing from the migrations`).toBe(true);
      expect(TABLES).toHaveProperty(table);
    }
  });

  it('matches every column, in both directions', () => {
    for (const [table, schema] of Object.entries(TABLES)) {
      const sqlColumns = parsed.get(table);
      expect(sqlColumns, `${table} missing from the SQL`).toBeDefined();

      const schemaKeys = new Set(Object.keys(schema.shape));
      const missingInSchema = [...sqlColumns!].filter((c) => !schemaKeys.has(c));
      const missingInSql = [...schemaKeys].filter((c) => !sqlColumns!.has(c));

      expect(missingInSchema, `${table}: in SQL but not in the client schema`).toEqual([]);
      expect(missingInSql, `${table}: in the client schema but not in SQL`).toEqual([]);
    }
  });

  it('sees the column 004 adds by an alter rather than a create', () => {
    // The regression this file grew for. Without `readAdds`, `kind` is a client
    // column with no database behind it.
    expect(parsed.get('custom_exercises')!.has('kind')).toBe(true);
  });

  it('names a primary key that the table actually has', () => {
    for (const [table, keys] of Object.entries(PRIMARY_KEYS)) {
      const columns = parsed.get(table)!;
      for (const key of keys) {
        expect(columns.has(key), `${table}: primary key column ${key} is not declared`).toBe(true);
      }
    }
  });

  it('puts RLS and an updated_at trigger on every private table', () => {
    // The migration does this in a loop over a literal array, so the check is that
    // the array covers the private tables rather than that N statements exist.
    const loop = /foreach t in array array\[([\s\S]*?)\]\s*\n\s*loop\s*\n\s*execute format\('alter table public\.%I enable row level security/.exec(SQL);
    expect(loop, 'the RLS loop was not found in 003').not.toBeNull();
    const covered = [...loop![1].matchAll(/'(\w+)'/g)].map((m) => m[1]);
    const privateTables = [...createdIn003.keys()].filter(
      (t) => !AUTHORED.has(t) && !SERVER_ONLY.has(t),
    );
    expect(covered.sort()).toEqual(privateTables.sort());
  });

  it('carries updated_by_client everywhere, so realtime echoes can be dropped', () => {
    for (const [table, columns] of parsed) {
      if (SERVER_ONLY.has(table)) continue;
      expect(columns.has('updated_by_client'), `${table} cannot suppress its own echo`).toBe(true);
    }
  });

  it('never touches user_state', () => {
    // The whole migration's safety rests on this. M4 is what changes user_state.
    for (const { file, sql } of MIGRATIONS) {
      const statements = withoutComments(sql);
      expect(
        /\b(drop|truncate|delete\s+from|update|insert\s+into)\b[^;]*user_state/i.test(statements),
        `${file} writes to user_state`,
      ).toBe(false);
    }
  });
});
