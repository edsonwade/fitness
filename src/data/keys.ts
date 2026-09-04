import type { RowOf, TableName } from './entities';
import { PRIMARY_KEYS } from './entities';

/**
 * Query keys, and the one place that decides how rows are grouped in the cache.
 *
 * Every key starts `['db', userId, table]`. The user id is in the key, not merely
 * in the fetch, because signing out and signing in as someone else must not serve
 * the first account's rows for the two frames before a refetch lands. Clearing the
 * cache on sign-out is also done, but a key that cannot collide is what makes that
 * a tidy-up rather than the only thing standing between two people's data.
 *
 * The realtime bridge and the mutations both derive their keys from here, so a row
 * arriving over the wire lands in the same cache entry a fetch would have filled.
 */

export type Scope = readonly (string | number)[];

/**
 * Tables cached per parent rather than as one list, with the column that says
 * which parent a row belongs to.
 *
 * `session_entries` is the only one. A user's whole history of logged sets is
 * unbounded and is never wanted at once: a session is opened and its entries are
 * read. Everything else is bounded by the programme — thirteen tables of at most a
 * few hundred rows each — and one list per table keeps the bridge simple.
 */
export const SCOPE_COLUMN: Partial<Record<TableName, string>> = {
  session_entries: 'session_id',
};

export const dbKeys = {
  /** Everything this user has cached. Used to clear on sign-out. */
  user: (userId: string) => ['db', userId] as const,

  /** Every scope of one table, for a broad invalidation. */
  table: (userId: string, table: TableName) => ['db', userId, table] as const,

  /** The exact list a fetch fills and realtime patches. */
  rows: (userId: string, table: TableName, scope: Scope = []) =>
    ['db', userId, table, ...scope] as const,
};

/** Which cache entry a given row belongs in. */
export function scopeOfRow<T extends TableName>(table: T, row: Partial<RowOf<T>>): Scope {
  const column = SCOPE_COLUMN[table];
  if (!column) return [];
  const value = (row as Record<string, unknown>)[column];
  return value == null ? [] : [value as string | number];
}

/**
 * A row's identity, as one string.
 *
 * Four of the tables have composite primary keys, so identity cannot be a single
 * `id` field, and comparing rows by object identity is wrong the moment a row has
 * been through the network. The separator is a character no key column contains:
 * `ex_key` is a slug and `block` is a short word, so a tab cannot appear in either
 * and cannot be smuggled in to make two different rows look like one.
 */
export function rowId<T extends TableName>(table: T, row: Partial<RowOf<T>>): string {
  const values = row as Record<string, unknown>;
  return PRIMARY_KEYS[table].map((column) => String(values[column])).join('\t');
}

/**
 * Mutation keys, which exist for one reason: the outbox.
 *
 * A write made offline is replayed after a reload, and by then the component that
 * called it is gone — with it, the closure that knew what the write meant. TanStack
 * Query recovers a paused mutation by looking its key up in the defaults registry,
 * so the key has to be a stable, serialisable name for the operation rather than
 * anything derived from a render.
 */
export const mutationKeys = {
  upsert: (table: TableName) => ['db', 'upsert', table] as const,
  remove: (table: TableName) => ['db', 'delete', table] as const,
  mergeLog: () => ['db', 'merge', 'exercise_logs'] as const,
  /**
   * Publishing, which is two tables and one key on purpose.
   *
   * A published exercise is a `catalog_exercises` row and a `day_additions` row, and
   * they are worthless apart: an addition with no exercise behind it is a card no
   * screen will draw. Two mutation keys would let the outbox replay one of them and
   * not the other, which is exactly the failure this key exists to make impossible.
   */
  publishShared: () => ['db', 'publish', 'shared_exercise'] as const,
};
