import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { clientId, stamp } from './client-id';
import { deleteRow as deleteRowFromDb, parseRow, upsertRow as upsertRowInDb } from './db';
import type { ExerciseLog, RowOf, TableName } from './entities';
import { PRIMARY_KEYS, TABLES } from './entities';
import { dbKeys, mutationKeys, scopeOfRow } from './keys';
import { useUserId } from './queries';
import { applyIncoming, applyOptimistic, removeRow } from './row-cache';
import { supabase } from './supabase';

/**
 * Writing.
 *
 * Every mutation here is optimistic, and that is a product decision before it is a
 * technical one: a set chip that waits for a round trip before it fills in is a set
 * chip that gets tapped twice in a gym with bad signal.
 *
 * Three rules hold for all of them:
 *
 *  - the payload is stamped with this tab's client id, so the realtime echo of our
 *    own write is recognised and dropped rather than applied on top of what the
 *    user has typed since;
 *  - the row the server actually stored is written back into the cache, because
 *    defaults and triggers mean it differs from what was sent;
 *  - nothing is invalidated on success. A refetch of the whole table after every
 *    tick would be the same traffic the old app's `cloudPush` made, on the same
 *    wifi. The server's own answer plus realtime is what keeps the cache true.
 *
 * **The work is split in two on purpose.** What a write DOES lives in
 * `registerMutationDefaults`, keyed by a serialisable mutation key and closed over
 * nothing but the query client. What a write LOOKS like while it is in flight — the
 * optimistic patch and its rollback — lives in the hooks. That split is what makes
 * the outbox possible: a write made in the changing room is replayed an hour later,
 * out of a reload, with no component left alive to remember what it was for.
 */

/** The two tables where authorship, not ownership, is the column. */
const AUTHORED_TABLES = new Set<TableName>(['catalog_exercises', 'day_additions']);

type Ctx = { key: readonly unknown[]; previous: unknown };
type AnyRow = Record<string, unknown>;

export type LogKey = { day_no: number; block: string; ex_key: string };
export type LogFields = Partial<Pick<ExerciseLog, 'weight' | 'reps' | 'sets_done' | 'note'>>;
export type MergeLogVars = LogKey & { user_id: string; fields: LogFields; changedAt: string };

function ownerColumn(table: TableName): 'created_by' | 'user_id' {
  return AUTHORED_TABLES.has(table) ? 'created_by' : 'user_id';
}

/* ---------- what the writes actually do ------------------------------------- */

/**
 * Teaches the query client every write this application can make.
 *
 * Called once at startup, before the outbox is restored. A paused mutation read
 * back from IndexedDB is nothing but a key and its variables; this is where the key
 * turns back into an action.
 */
export function registerMutationDefaults(client: QueryClient): void {
  for (const table of Object.keys(TABLES) as TableName[]) {
    client.setMutationDefaults<RowOf<TableName>, Error, AnyRow>(mutationKeys.upsert(table), {
      mutationFn: (patch) => upsertRowInDb(table, stamp(patch)),
      onSuccess: (stored) => writeStored(client, table, stored),
    });

    client.setMutationDefaults<void, Error, Partial<RowOf<TableName>>>(mutationKeys.remove(table), {
      mutationFn: async (key) => {
        if (AUTHORED_TABLES.has(table)) {
          // No delete policy exists for these, by design: removing a published
          // exercise is `deleted = true`, so nobody else's day is left pointing at a
          // row that is gone. Failing here says why; the database would only say no.
          throw new Error(`${table} is soft-deleted: upsert deleted = true instead`);
        }
        await deleteRowFromDb(table, primaryKeyOf(table, key));
      },
    });
  }

  client.setMutationDefaults<ExerciseLog, Error, MergeLogVars>(mutationKeys.mergeLog(), {
    mutationFn: async (variables) => {
      const { day_no, block, ex_key, fields, changedAt } = variables;
      const { data, error } = await supabase.rpc('merge_exercise_log', {
        p_day_no: day_no,
        p_block: block,
        p_ex_key: ex_key,
        p_fields: fields,
        p_at: changedAt,
        p_client: clientId(),
      });
      if (error) throw error;
      return parseRow('exercise_logs', data);
    },
    onSuccess: (stored) => writeStored(client, 'exercise_logs', stored),
  });
}

/**
 * Puts the stored row in the cache.
 *
 * The user id is read off the row rather than out of a hook, because this also runs
 * for a replayed write, where there is no hook to ask.
 */
function writeStored<T extends TableName>(client: QueryClient, table: T, stored: RowOf<T>): void {
  const row = stored as AnyRow;
  const userId = (row.user_id ?? row.created_by) as string | undefined;
  if (!userId) return;
  const key = dbKeys.rows(userId, table, scopeOfRow(table, stored));
  client.setQueryData<RowOf<T>[]>(key, (rows = []) => applyIncoming(rows, table, stored));
}

/* ---------- what the writes look like while in flight ----------------------- */

/** Cancels in-flight fetches for a key before patching it, and remembers the old list. */
async function beginOptimistic(client: QueryClient, key: readonly unknown[]): Promise<Ctx> {
  await client.cancelQueries({ queryKey: key });
  return { key, previous: client.getQueryData(key) };
}

/**
 * Insert or update one row.
 *
 * `patch` carries the primary key and the columns that changed. Columns left out
 * are left alone on an update and take their database default on an insert, which
 * is what `upsert` already means and what the screens want: a rest preference
 * changing does not restate the exercise it belongs to.
 */
export function useUpsertRow<T extends TableName>(table: T) {
  const client = useQueryClient();
  const userId = useUserId();
  const owner = ownerColumn(table);

  const mutation = useMutation<RowOf<T>, Error, Partial<RowOf<T>>, Ctx>({
    mutationKey: mutationKeys.upsert(table),
    onMutate: async (patch) => {
      const key = dbKeys.rows(userId ?? 'anon', table, scopeOfRow(table, patch));
      const ctx = await beginOptimistic(client, key);
      client.setQueryData<RowOf<T>[]>(key, (rows = []) => applyOptimistic(rows, table, patch));
      return ctx;
    },
    onError: (_error, _patch, ctx) => {
      if (ctx) client.setQueryData(ctx.key, ctx.previous);
    },
  });

  return {
    ...mutation,
    /** Stamps the row with its owner and sends it. */
    save(patch: Partial<RowOf<T>>) {
      if (!userId) throw new Error('sem sessão: a escrita não tem dono');
      mutation.mutate({ ...patch, [owner]: userId } as Partial<RowOf<T>>);
    },
  };
}

/** Delete by primary key. */
export function useDeleteRow<T extends TableName>(table: T) {
  const client = useQueryClient();
  const userId = useUserId();

  const mutation = useMutation<void, Error, Partial<RowOf<T>>, Ctx>({
    mutationKey: mutationKeys.remove(table),
    onMutate: async (key) => {
      const cacheKey = dbKeys.rows(userId ?? 'anon', table, scopeOfRow(table, key));
      const ctx = await beginOptimistic(client, cacheKey);
      client.setQueryData<RowOf<T>[]>(cacheKey, (rows = []) => removeRow(rows, table, key));
      return ctx;
    },
    onError: (_error, _key, ctx) => {
      if (ctx) client.setQueryData(ctx.key, ctx.previous);
    },
  });

  return {
    ...mutation,
    remove(key: Partial<RowOf<T>>) {
      mutation.mutate(key);
    },
  };
}

/**
 * The write path for logged sets, and the only one that is not a plain upsert.
 *
 * It sends the changed fields and the moment the user changed them, and the database
 * merges field by field (`merge_exercise_log`, section 15 of `003`). The case this
 * exists for: a phone with no signal ticks a set while a laptop writes a note on the
 * same row. Whichever arrives second, both survive.
 *
 * `changedAt` is taken when the user acts, not when the request leaves. Online those
 * are the same instant; through the outbox they are an hour apart, and the one the
 * merge has to compare is the first.
 */
export function useMergeExerciseLog() {
  const client = useQueryClient();
  const userId = useUserId();

  const mutation = useMutation<ExerciseLog, Error, MergeLogVars, Ctx>({
    mutationKey: mutationKeys.mergeLog(),
    onMutate: async (variables) => {
      const key = dbKeys.rows(variables.user_id, 'exercise_logs');
      const ctx = await beginOptimistic(client, key);
      client.setQueryData<ExerciseLog[]>(
        key,
        (rows = []) =>
          applyOptimistic(
            rows,
            'exercise_logs',
            {
              user_id: variables.user_id,
              day_no: variables.day_no,
              block: variables.block,
              ex_key: variables.ex_key,
              ...variables.fields,
            },
            /*
             * What the row is worth the first time it is written. An exercise gets
             * its log row on the edit that creates it, and until the server answers
             * the only version of it that exists is this one, so it has to be
             * complete. `updated_at` is the epoch rather than now: the point of the
             * comment above is that the server's row must win, and a row stamped
             * with the local clock would not lose to it.
             */
            {
              weight: null,
              reps: null,
              note: null,
              sets_done: [],
              field_updated_at: {},
              updated_at: new Date(0).toISOString(),
              updated_by_client: clientId(),
            },
          ),
      );
      return ctx;
    },
    onError: (_error, _variables, ctx) => {
      if (ctx) client.setQueryData(ctx.key, ctx.previous);
    },
  });

  return {
    ...mutation,
    log(where: LogKey, fields: LogFields) {
      if (!userId) throw new Error('sem sessão: a escrita não tem dono');
      mutation.mutate({ ...where, user_id: userId, fields, changedAt: new Date().toISOString() });
    },
  };
}

/* ---------- odds and ends --------------------------------------------------- */

function primaryKeyOf<T extends TableName>(
  table: T,
  row: Partial<RowOf<T>>,
): Record<string, string | number> {
  const values = row as AnyRow;
  const out: Record<string, string | number> = {};
  for (const column of PRIMARY_KEYS[table]) {
    const value = values[column];
    if (value === undefined || value === null) {
      throw new Error(`${table}: ${column} is part of the primary key and was not given`);
    }
    out[column] = value as string | number;
  }
  return out;
}
