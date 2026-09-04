import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { isOwnEcho } from './client-id';
import { parseRow, SchemaDriftError } from './db';
import type { RowOf, TableName } from './entities';
import { isShared, TABLES } from './entities';
import { dbKeys, rowId, scopeOfRow } from './keys';
import { useUserId } from './queries';
import { applyIncoming, removeRow } from './row-cache';
import { held, onFree } from './repaint-guard';
import { supabase } from './supabase';

/**
 * Realtime, bridged into the query cache.
 *
 * This is new capability: in the old app, private state had no realtime at all, and
 * a set ticked on the phone stayed invisible on the tablet until something pulled.
 * Postgres Changes applies RLS per subscriber, so what a subscription may deliver is
 * decided in the database and not here: a private table is filtered to its owner on
 * both sides, and a shared one is filtered on neither, because the point of a shared
 * table is that somebody else's write is news.
 *
 * Three things have to be true for this to be an improvement rather than a source
 * of flicker:
 *
 *  1. **A device must not receive its own write as news.** Every mutation is stamped
 *     with `updated_by_client`, and an echo carrying this tab's id is dropped.
 *  2. **A change must never repaint over an open sheet or a focused input.** It is
 *     held, not discarded, and applied when the guard lifts.
 *  3. **A late change must not beat a newer one.** `applyIncoming` compares
 *     `updated_at` before it writes.
 */

export type DbChange = {
  table: TableName;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  row: Record<string, unknown>;
};

/**
 * Subscribed whole, because every account is meant to see them: the week itself.
 * Subscribed by owner, because they are one person's: what that person did.
 */
const SHARED = (Object.keys(TABLES) as TableName[]).filter(isShared);
const PRIVATE = (Object.keys(TABLES) as TableName[]).filter((table) => !isShared(table));

/**
 * Writes one change into the cache.
 *
 * A payload this build cannot parse is not thrown away and not thrown either: the
 * cache entry is marked stale so the next read refetches it. That case means the
 * database is ahead of the deployed bundle — someone has a tab open from before a
 * release — and the right behaviour there is to go and ask, not to crash a screen
 * mid-set.
 */
export function applyChange(client: QueryClient, userId: string, change: DbChange): void {
  const { table, row } = change;
  const key = dbKeys.rows(userId, table, scopeOfRow(table, row as Partial<RowOf<TableName>>));

  /*
   * A shared row is never really deleted. Removing one is `deleted = true`, so that
   * nobody else's day is left pointing at a row that is gone, which means the change
   * arrives here as an UPDATE and not as a DELETE.
   *
   * The cache holds what the screens can show, and `fetchRows` defines that as
   * `deleted = false`. Applying a soft-deleted row instead of removing it left the
   * cache and a refetch disagreeing, and the visible symptom was the one thing this
   * feature must not do: an exercise deleted on one account stayed on screen on every
   * other account until someone reloaded.
   */
  if (change.eventType !== 'DELETE' && (row as { deleted?: boolean }).deleted === true) {
    client.setQueryData<RowOf<TableName>[]>(key, (rows = []) =>
      removeRow(rows, table, row as Partial<RowOf<TableName>>),
    );
    return;
  }

  if (change.eventType === 'DELETE') {
    client.setQueryData<RowOf<TableName>[]>(key, (rows = []) =>
      removeRow(rows, table, row as Partial<RowOf<TableName>>),
    );
    return;
  }

  let parsed: RowOf<TableName>;
  try {
    parsed = parseRow(table, row);
  } catch (error) {
    if (!(error instanceof SchemaDriftError)) throw error;
    void client.invalidateQueries({ queryKey: key });
    return;
  }

  client.setQueryData<RowOf<TableName>[]>(key, (rows = []) => applyIncoming(rows, table, parsed));
}

/**
 * Holds changes while the guard is up, and coalesces them per row.
 *
 * Coalescing matters more than it looks: a set of eight chips ticked on another
 * device while a sheet is open arrives as eight updates to one row, and applying
 * all eight when the sheet closes would be seven repaints of a row that is already
 * right. The last one carries the final state, because these are whole rows and not
 * deltas.
 *
 * Order between different rows is kept. A `Map` preserves insertion order, and
 * re-setting an existing key does not move it.
 */
export function createChangeQueue(apply: (change: DbChange) => void) {
  const pending = new Map<string, DbChange>();

  const flush = () => {
    if (held() || pending.size === 0) return;
    const changes = [...pending.values()];
    pending.clear();
    for (const change of changes) apply(change);
  };

  return {
    push(change: DbChange) {
      pending.set(`${change.table}\t${rowId(change.table, change.row as never)}`, change);
      flush();
    },
    flush,
    get size() {
      return pending.size;
    },
  };
}

/**
 * Subscribes the signed-in user to their own rows and to everybody's week.
 *
 * Mounted once, near the root. One channel carries every table: a channel per table
 * would be fifteen websocket subscriptions for one person, and Supabase charges
 * connections, not messages.
 */
export function useRealtimeSync(): void {
  const client = useQueryClient();
  const userId = useUserId();

  useEffect(() => {
    if (!userId) return;

    const queue = createChangeQueue((change) => applyChange(client, userId, change));
    const stopListening = onFree(queue.flush);

    const channel = supabase.channel(`db:${userId}`);

    const handler = (table: TableName) => (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      const eventType = payload.eventType as DbChange['eventType'];

      // A delete carries no `updated_by_client` of its own — the column on the old
      // row records whoever last wrote it, which is not necessarily whoever deleted
      // it. Removing a row that is already gone is a no-op, so deletes are applied
      // without an echo check rather than guessing.
      if (eventType !== 'DELETE' && isOwnEcho(payload.new as { updated_by_client?: string | null })) {
        return;
      }

      const row = eventType === 'DELETE' ? payload.old : payload.new;
      if (!row || Object.keys(row).length === 0) return;

      queue.push({ table, eventType, row });
    };

    for (const table of PRIVATE) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        handler(table) as never,
      );
    }
    /*
     * No filter, and that is what makes the other account's screen change while they
     * are looking at it. A `user_id=eq.<me>` filter here would have been the exact
     * inverse of the promise: the row is written for everybody and delivered to
     * nobody but its writer. RLS still decides what may arrive — `009` §4 opens the
     * read on precisely these tables and no others.
     */
    for (const table of SHARED) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handler(table) as never);
    }

    channel.subscribe();

    return () => {
      stopListening();
      void supabase.removeChannel(channel);
    };
  }, [client, userId]);
}
