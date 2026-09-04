import { AUTHORED_TABLES, isShared, TABLES, type RowOf, type TableName } from './entities';
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
 */
export async function upsertRow<T extends TableName>(
  table: T,
  payload: Record<string, unknown>,
): Promise<RowOf<T>> {
  const { data, error } = await supabase.from(table).upsert(payload).select().single();
  if (error) throw error;
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
