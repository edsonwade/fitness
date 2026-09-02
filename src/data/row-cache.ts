import { TABLES, type RowOf, type TableName } from './entities';
import { rowId } from './keys';

/**
 * How a list of rows in the cache changes. Pure functions, no React, no network,
 * so the rules that decide whether a row wins can be tested directly rather than
 * inferred from a screen.
 *
 * Both writers use these: the optimistic path in `mutations.ts` and the realtime
 * bridge. That is deliberate. A cache patched one way by a local edit and another
 * way by a remote one drifts apart in exactly the case where a person has two
 * devices open and is watching both.
 */

/** Position is preserved on update and appended on insert; sorting is the screen's. */
export function upsertRow<T extends TableName>(
  rows: readonly RowOf<T>[],
  table: T,
  next: RowOf<T>,
): RowOf<T>[] {
  const id = rowId(table, next);
  const index = rows.findIndex((row) => rowId(table, row) === id);
  if (index === -1) return [...rows, next];
  const copy = rows.slice();
  copy[index] = next;
  return copy;
}

export function removeRow<T extends TableName>(
  rows: readonly RowOf<T>[],
  table: T,
  key: Partial<RowOf<T>>,
): RowOf<T>[] {
  const id = rowId(table, key);
  return rows.filter((row) => rowId(table, row) !== id);
}

export function findRow<T extends TableName>(
  rows: readonly RowOf<T>[],
  table: T,
  key: Partial<RowOf<T>>,
): RowOf<T> | undefined {
  const id = rowId(table, key);
  return rows.find((row) => rowId(table, row) === id);
}

/**
 * Applies a row that came from the server, unless the cache already holds
 * something newer.
 *
 * Realtime does not promise ordering across a reconnect: a socket that drops
 * mid-set can deliver a backlog after the refetch that replaced it, and applying
 * that backlog blindly would put a stale weight back on screen while the user is
 * looking at it. Comparing `updated_at` costs one string comparison — timestamptz
 * serialises to ISO 8601, which sorts lexicographically — and removes the class.
 *
 * Equal timestamps apply. The server row is the canonical spelling of a row the
 * cache already agrees with, and it may carry columns the optimistic patch had no
 * way to know, such as `field_updated_at` after a merge.
 */
export function applyIncoming<T extends TableName>(
  rows: readonly RowOf<T>[],
  table: T,
  incoming: RowOf<T>,
): RowOf<T>[] {
  const current = findRow(rows, table, incoming);
  if (current && current.updated_at > incoming.updated_at) return rows as RowOf<T>[];
  return upsertRow(rows, table, incoming);
}

/**
 * A local edit applied before the server has answered.
 *
 * `updated_at` is deliberately NOT advanced. The optimistic row keeps the last
 * timestamp the server gave it, so when the real row comes back — over realtime or
 * as the mutation's own response — it is strictly newer and `applyIncoming` takes
 * it. Stamping the local clock here would make a device with a fast clock reject
 * the server's version of its own write and hold the guess forever.
 *
 * The insert branch is where this used to be wrong, and the bug it caused is worth
 * recording. A patch is by definition partial. Appending one to the cache with a
 * cast produced an object that satisfied the row type only because the cast said
 * so, and a screen reading a column the patch had not mentioned crashed on it: a
 * load typed into an exercise with no log yet appended a row with no `sets_done`,
 * and the day's progress count died on `undefined.filter`. The user saw the route
 * error screen mid-session.
 *
 * So an insert now has to produce a row that is actually a row. `seed` supplies
 * what the patch leaves out, and the table's own schema is the judge: if the result
 * still does not parse, the cache is left untouched and the value appears when the
 * server answers. A round trip's delay is a far smaller failure than a crash on the
 * gym floor. On update the seed is not consulted at all, because those columns
 * already hold the user's values and a default would overwrite them.
 */
export function applyOptimistic<T extends TableName>(
  rows: readonly RowOf<T>[],
  table: T,
  patch: Partial<RowOf<T>>,
  seed?: Partial<RowOf<T>>,
): RowOf<T>[] {
  const current = findRow(rows, table, patch);
  if (current) return upsertRow(rows, table, { ...current, ...patch });

  const candidate = TABLES[table].safeParse({ ...seed, ...patch });
  if (!candidate.success) return rows as RowOf<T>[];
  return [...rows, candidate.data as RowOf<T>];
}
