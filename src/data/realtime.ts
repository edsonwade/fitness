import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { isOwnEcho } from './client-id';
import { parseRow, SchemaDriftError } from './db';
import type { RowOf, TableName } from './entities';
import { TABLES } from './entities';
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
 * Postgres Changes applies RLS per subscriber, so a user is sent only their own
 * rows and the filter below is belt to that braces.
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

const AUTHORED_TABLES: readonly TableName[] = ['catalog_exercises', 'day_additions'];
const PRIVATE_TABLES = (Object.keys(TABLES) as TableName[]).filter(
  (table) => !AUTHORED_TABLES.includes(table),
);

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
 * Subscribes the signed-in user to their own rows and to the shared catalogue.
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

    for (const table of PRIVATE_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        handler(table) as never,
      );
    }
    for (const table of AUTHORED_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handler(table) as never);
    }

    channel.subscribe();

    return () => {
      stopListening();
      void supabase.removeChannel(channel);
    };
  }, [client, userId]);
}
