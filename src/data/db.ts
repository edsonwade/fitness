import {
  AUTHORED_TABLES,
  isShared,
  PRIMARY_KEYS,
  TABLES,
  type RowOf,
  type TableName,
} from './entities';
import { SCOPE_COLUMN, type Scope } from './keys';
import { supabase } from './supabase';

/**
 * Reads and writes against the tables `003` creates. One layer, so nothing above
 * it builds a query string by hand or trusts a row it has not checked.
 *
 * Everything that leaves this module has been through its Zod schema. The cost is
 * one parse per fetch on lists of a few hundred rows; what it buys is that a
 * database whose migration has not been run fails here, with the table and the
 * column named, instead of three screens later as `undefined`.
 */

/**
 * A published row this account is not allowed to change, or that is no longer there.
 *
 * Thrown instead of letting a `PATCH` that matched nothing look like a success. The two
 * causes are worth telling apart by the reader and cannot be told apart by the client:
 * PostgREST answers an update the policy filtered out exactly as it answers an update of
 * a row that has been removed — zero rows, no error. Naming both is honest; guessing one
 * would not be.
 */
export class SharedRowUnreachableError extends Error {
  readonly table: TableName;

  constructor(table: TableName) {
    super(
      `${table}: a linha não foi alterada — ou já não existe, ou a política de escrita ` +
        `desta base de dados não deixa esta conta mexer no que a outra publicou ` +
        `(é o que a migração 006 abre; ver supabase/006_shared_catalog.sql)`,
    );
    this.name = 'SharedRowUnreachableError';
    this.table = table;
  }
}

export class SchemaDriftError extends Error {
  readonly table: TableName;
  readonly detail: string;

  constructor(table: TableName, detail: string) {
    super(`${table}: the database returned a row this build does not understand — ${detail}`);
    this.name = 'SchemaDriftError';
    this.table = table;
    this.detail = detail;
  }
}

export function parseRows<T extends TableName>(table: T, data: unknown[]): RowOf<T>[] {
  const schema = TABLES[table];
  const out: RowOf<T>[] = [];
  for (const raw of data) {
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new SchemaDriftError(table, `${issue.path.join('.') || '(root)'} ${issue.message}`);
    }
    out.push(result.data as RowOf<T>);
  }
  return out;
}

export function parseRow<T extends TableName>(table: T, data: unknown): RowOf<T> {
  return parseRows(table, [data])[0];
}

/**
 * One cache entry's worth of rows.
 *
 * **A shared table is read whole and a private one is read by owner**, and this is the
 * one place that difference is applied. On a private table the `user_id` filter is
 * redundant with RLS and is sent anyway: RLS is what makes it safe, the filter is what
 * makes it correct if a future policy ever widens the row set, and it costs the index
 * lookup that would happen regardless.
 *
 * On a shared table that same filter would have been the bug the whole of `009` is
 * about — the database serving everybody's week and the client asking only for the
 * rows it wrote — so it is not sent. `SHARED_TABLES` is the single list, in
 * `entities.ts`, and the reason it is there rather than here is that the realtime
 * bridge has to draw the line in exactly the same place.
 *
 * Soft-deleted catalogue rows are dropped here rather than at each call site.
 * `deleted = true` is how the additive catalogue removes something without leaving
 * another person's day pointing at nothing, and no screen wants those rows.
 */
export async function fetchRows<T extends TableName>(
  table: T,
  userId: string,
  scope: Scope = [],
): Promise<RowOf<T>[]> {
  let query = supabase.from(table).select('*');

  if (AUTHORED_TABLES.has(table)) {
    query = query.eq('deleted', false);
  } else if (!isShared(table)) {
    query = query.eq('user_id', userId);
  }

  const column: string | undefined = SCOPE_COLUMN[table];
  if (column) {
    if (scope.length === 0) {
      throw new Error(`${table} is cached per ${column}; fetchRows needs one in its scope`);
    }
    // `filter` rather than `eq`: the column is decided at runtime from SCOPE_COLUMN,
    // and `eq` is typed against a literal column name of the row.
    query = query.filter(column, 'eq', scope[0]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return parseRows(table, data ?? []);
}

/**
 * Upsert, returning what the database actually stored.
 *
 * `.select().single()` is not decoration: defaults, triggers and the server clock
 * mean the stored row differs from the payload, and the cache must end up holding
 * the stored one. Without it, `updated_at` in the cache stays whatever the client
 * guessed, and the freshness comparison in `row-cache.ts` has nothing real to
 * compare against.
 *
 * **The two shared catalogue tables are updated, never upserted**, and that difference
 * is the whole of this function. See `updateAuthoredRow`.
 */
export async function upsertRow<T extends TableName>(
  table: T,
  payload: Record<string, unknown>,
): Promise<RowOf<T>> {
  if (AUTHORED_TABLES.has(table)) return updateAuthoredRow(table, payload);

  const { data, error } = await supabase.from(table).upsert(payload).select().single();
  if (error) throw error;
  return parseRow(table, data);
}

/**
 * Changes one row of the shared catalogue, as an update and not as an upsert.
 *
 * **Why this is not `upsert`.** PostgREST sends an upsert as
 * `insert ... on conflict do update`, and Postgres checks the *insert* policy's
 * `with check` against the row it is offered — before, and regardless of, taking the
 * update branch. The insert policy on both these tables is `created_by = auth.uid()`
 * (`003` §12, kept deliberately by `006` §1: a row must tell the truth about who wrote
 * it). The payload carries the original author, on purpose, for that same reason.
 *
 * Put together, those two correct decisions made a third thing that was not correct:
 * every edit or removal of an exercise **published by the other account** was refused
 * with `42501 new row violates row-level security policy`, no matter what the update
 * policy said. `006` widened the update policy to `using (true) with check (true)` and
 * that changed nothing, because the write never reached it. Proved against a throwaway
 * Postgres 18 with these exact policies: own row passes, other account's row is refused
 * under `006` exactly as it is without it.
 *
 * An update has no insert branch, so it is judged by the update policy alone, which is
 * the policy that was written to answer this question.
 *
 * Nothing is lost by refusing to insert here: rows in these two tables are only ever
 * created by `publish_shared_exercise` (`009` §6), which is `security invoker` and gets
 * past the same insert policy honestly, by offering a new row stamped with the caller.
 */
async function updateAuthoredRow<T extends TableName>(
  table: T,
  payload: Record<string, unknown>,
): Promise<RowOf<T>> {
  // The key is read out whole before anything is built, so that a payload missing one
  // is refused here rather than sent as an update with no `where` — which PostgREST
  // rejects, but only after the request has left, and only after every row in the
  // table has been considered.
  const key = PRIMARY_KEYS[table].map((column) => {
    const value = payload[column];
    if (value === undefined || value === null) {
      throw new Error(`${table}: uma edição precisa de ${column}, e o pedido não o traz`);
    }
    return [column, value] as const;
  });

  let query = supabase.from(table).update(payload);
  for (const [column, value] of key) query = query.eq(column, value as string);

  // `maybeSingle`, not `single`: zero rows is the case this has to report itself,
  // and `single` would report it as a parse failure with nothing useful in it.
  const { data, error } = await query.select().maybeSingle();
  if (error) throw error;
  if (!data) throw new SharedRowUnreachableError(table);
  return parseRow(table, data);
}

export async function deleteRow<T extends TableName>(
  table: T,
  key: Record<string, string | number>,
): Promise<void> {
  let query = supabase.from(table).delete();
  for (const [column, value] of Object.entries(key)) query = query.eq(column, value);
  const { error } = await query;
  if (error) throw error;
}
