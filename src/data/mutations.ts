import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { clientId, stamp } from './client-id';
import { deleteRow as deleteRowFromDb, parseRow, upsertRow as upsertRowInDb } from './db';
import type { CatalogExercise, DayAddition, ExerciseLog, RowOf, TableName } from './entities';
import { AUTHORED_TABLES, isShared, PRIMARY_KEYS, TABLES } from './entities';
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

type Ctx = { key: readonly unknown[]; previous: unknown };
type AnyRow = Record<string, unknown>;

export type LogKey = { day_no: number; block: string; ex_key: string };
export type LogFields = Partial<Pick<ExerciseLog, 'weight' | 'reps' | 'sets_done' | 'note'>>;
export type MergeLogVars = LogKey & { user_id: string; fields: LogFields; changedAt: string };

/** What the optimistic copy of a row says about itself until the server answers. */
type RowIdentity = { id: string; created_by: string; created_at: string };

/**
 * One publication: what the exercise is, and which day prescribes it.
 *
 * Everything the two rows need is here rather than derived at send time, because a
 * write made with no signal is replayed out of IndexedDB after a reload, and by then
 * there is no hook to ask.
 */
export type PublishSharedVars = {
  /**
   * Whose cache these rows belong in — the signed-in account, not the author.
   * The two differ whenever somebody edits an exercise another person published,
   * and keying the cache by the author would file the stored row where nothing reads.
   */
  owner_id: string;
  client: string;
  ex_key: string;
  day_no: number;
  /** True unpublishes: `deleted = true` on both rows, in the same transaction. */
  deleted: boolean;
  name_pt: string;
  kind: string;
  equipment: string | null;
  sets: string | null;
  reps: string | null;
  load: string | null;
  rest: string | null;
  video_id: string | null;
  photo_url: string | null;
  catalog: RowIdentity;
  addition: RowIdentity;
};

export type PublishedPair = { catalog: CatalogExercise; addition: DayAddition };

/** The moment a row was written locally must lose to the server's. See `applyOptimistic`. */
const OPTIMISTIC_AT = new Date(0).toISOString();

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

  client.setMutationDefaults<PublishedPair, Error, PublishSharedVars>(
    mutationKeys.publishShared(),
    {
      mutationFn: publishShared,
      onSuccess: (pair, variables) => {
        writePublished(client, variables.owner_id, 'catalog_exercises', variables.catalog.id, pair.catalog);
        writePublished(client, variables.owner_id, 'day_additions', variables.addition.id, pair.addition);
      },
    },
  );
}

/**
 * Publishing, as one call.
 *
 * `publish_shared_exercise` (`007`) writes both rows inside one transaction and hands
 * back what it stored. The two rows are worthless apart — `resolveDayEntries` refuses
 * to draw an addition with no exercise behind it — and before this existed the client
 * sent them as two independent upserts, so a refused catalogue write left an invisible
 * orphan in a table every account reads. Four of those are still in day 1.
 */
async function publishShared(variables: PublishSharedVars): Promise<PublishedPair> {
  const { data, error } = await supabase.rpc('publish_shared_exercise', {
    p_ex_key: variables.ex_key,
    p_day_no: variables.day_no,
    p_name_pt: variables.name_pt,
    p_kind: variables.kind,
    p_equipment: variables.equipment,
    p_sets: variables.sets,
    p_reps: variables.reps,
    p_load: variables.load,
    p_rest: variables.rest,
    p_video_id: variables.video_id,
    p_photo_url: variables.photo_url,
    p_deleted: variables.deleted,
    p_client: variables.client,
  });
  if (error) throw error;

  const pair = data as { catalog: unknown; addition: unknown } | null;
  if (!pair) throw new Error('publish_shared_exercise devolveu vazio');
  return {
    catalog: parseRow('catalog_exercises', pair.catalog),
    addition: parseRow('day_additions', pair.addition),
  };
}

/**
 * Puts one stored half of a publication in the cache.
 *
 * Two things make this more than `writeStored`. First the key: these rows are keyed by
 * the account reading them, and `created_by` is the author, who may be somebody else.
 *
 * Second the id. The optimistic row carries an id this device invented, and the server
 * may well have updated a row that already existed under a different one — republishing
 * something that was removed reuses the old `day_additions` row on purpose, to keep the
 * id stable. When the two disagree, the guess is taken out before the real row goes in,
 * or the day would draw the same exercise twice until the next reload.
 *
 * A stored row that comes back `deleted` is removed rather than applied, for the reason
 * `applyChange` gives: the cache holds what the screens can show, and `fetchRows`
 * defines that as `deleted = false`.
 */
function writePublished<T extends 'catalog_exercises' | 'day_additions'>(
  client: QueryClient,
  ownerId: string,
  table: T,
  optimisticId: string,
  stored: RowOf<T>,
): void {
  const key = dbKeys.rows(ownerId, table);
  client.setQueryData<RowOf<T>[]>(key, (rows = []) => {
    const cleaned =
      optimisticId === stored.id
        ? (rows as RowOf<T>[])
        : removeRow(rows, table, { id: optimisticId } as Partial<RowOf<T>>);
    return stored.deleted
      ? removeRow(cleaned, table, stored)
      : applyIncoming(cleaned, table, stored);
  });
}

/**
 * Puts the stored row in the cache.
 *
 * The user id is read off the row rather than out of a hook, because this also runs
 * for a replayed write, where there is no hook to ask. On a private table the row says
 * whose it is, and its owner and its reader are the same person.
 *
 * On a shared table they are not: `user_id` there is whoever wrote it last, so filing
 * the row under it would file another account's edit where nothing reads. Every shared
 * table goes through `writeSharedStored`, which files by table instead.
 */
function writeStored<T extends TableName>(client: QueryClient, table: T, stored: RowOf<T>): void {
  if (isShared(table)) {
    writeSharedStored(client, table, stored);
    return;
  }

  const userId = (stored as AnyRow).user_id as string | undefined;
  if (!userId) return;
  const key = dbKeys.rows(userId, table, scopeOfRow(table, stored));
  client.setQueryData<RowOf<T>[]>(key, (rows = []) => applyIncoming(rows, table, stored));
}

/**
 * Puts a stored row of a shared table in the cache.
 *
 * Two things separate this from `writeStored`, and both come from one fact: on a
 * shared table the owner column names the **writer** — `created_by` on the catalogue,
 * `user_id` on the rest — while the cache is keyed by the account **reading** it.
 * Anyone may change anything in the shared week, so those are two different people the
 * moment a second account edits something.
 * Keying the stored row by the author filed it where nothing reads, and the symptom
 * hid well: the optimistic row stays on screen and realtime carries the truth to
 * everybody else, so the only person left holding a guess was the one who pressed
 * save, until their next reload.
 *
 * There is no hook here to ask who is signed in — this also runs for a write replayed
 * out of IndexedDB after a reload — so the row goes into the lists of this table the
 * cache already holds. A browser holds one signed-in account and `dbKeys.user` is
 * cleared on sign-out, so that is the reader's list and no other.
 *
 * A stored row that comes back `deleted` is removed rather than applied, for the
 * reason `applyChange` gives: the cache holds what the screens can show, and
 * `fetchRows` defines that as `deleted = false`. Realtime cannot cover for this,
 * because the echo of our own write is dropped on purpose.
 */
function writeSharedStored<T extends TableName>(
  client: QueryClient,
  table: T,
  stored: RowOf<T>,
): void {
  client.setQueriesData<RowOf<T>[]>(
    { predicate: (query) => query.queryKey[0] === 'db' && query.queryKey[2] === table },
    (rows = []) =>
      (stored as AnyRow).deleted === true
        ? removeRow(rows, table, stored)
        : applyIncoming(rows, table, stored),
  );
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
      client.setQueryData<RowOf<T>[]>(key, (rows = []) =>
        /*
         * A soft delete is an upsert on the wire and a removal on screen. On the two
         * shared tables removing is `deleted = true`, so that nobody else's day is
         * left pointing at a row that is gone — but the cache holds only what the
         * screens can show, and leaving the row in it with a flag set meant the
         * exercise the user had just removed stayed on their own screen. Nothing else
         * would have taken it off: `fetchRows` filters on the next read, and the
         * realtime echo of our own write is dropped by design.
         */
        (patch as AnyRow).deleted === true
          ? removeRow(rows, table, patch)
          : applyOptimistic(rows, table, patch),
      );
      return ctx;
    },
    onError: (_error, _patch, ctx) => {
      if (ctx) client.setQueryData(ctx.key, ctx.previous);
    },
  });

  return {
    ...mutation,
    /**
     * Stamps the row with its owner and sends it.
     *
     * The stamp is a default, not an override: a patch that already names its owner
     * keeps it. That matters on the shared catalogue, where anyone may edit anyone's
     * exercise. Overwriting `created_by` with whoever happened to press save would
     * quietly transfer authorship on every edit, so the row would stop being able to
     * say who wrote it. RLS is what stops a forged owner on a private table, not this.
     */
    save(patch: Partial<RowOf<T>>) {
      if (!userId) throw new Error('sem sessão: a escrita não tem dono');
      mutation.mutate({ [owner]: userId, ...patch } as Partial<RowOf<T>>);
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

/**
 * Publishing an exercise to everybody, or taking it back.
 *
 * The write is one transaction on the server; what it looks like here is two rows
 * appearing at once, and on a failure both going away again. That pairing is the whole
 * point: the previous version applied and rolled back the two halves independently,
 * so a refused catalogue write left the day addition on screen and in the database.
 *
 * Offline this behaves like every other write in the app. The two rows land in the
 * cache immediately, the call is paused rather than failed, and the outbox replays it
 * as the single unit it is — which a sequential `await` of two upserts could not do,
 * because the second one would exist only in a closure that a reload throws away.
 */
export function usePublishShared() {
  const client = useQueryClient();
  const userId = useUserId();

  type Ctx2 = { keys: readonly [readonly unknown[], readonly unknown[]]; previous: [unknown, unknown] };

  const mutation = useMutation<PublishedPair, Error, PublishSharedVars, Ctx2>({
    mutationKey: mutationKeys.publishShared(),
    onMutate: async (variables) => {
      const catalogKey = dbKeys.rows(variables.owner_id, 'catalog_exercises');
      const additionKey = dbKeys.rows(variables.owner_id, 'day_additions');
      await client.cancelQueries({ queryKey: catalogKey });
      await client.cancelQueries({ queryKey: additionKey });

      const ctx: Ctx2 = {
        keys: [catalogKey, additionKey],
        previous: [client.getQueryData(catalogKey), client.getQueryData(additionKey)],
      };

      if (variables.deleted) {
        client.setQueryData<CatalogExercise[]>(catalogKey, (rows = []) =>
          removeRow(rows, 'catalog_exercises', { id: variables.catalog.id }),
        );
        client.setQueryData<DayAddition[]>(additionKey, (rows = []) =>
          removeRow(rows, 'day_additions', { id: variables.addition.id }),
        );
        return ctx;
      }

      client.setQueryData<CatalogExercise[]>(catalogKey, (rows = []) =>
        applyOptimistic(
          rows,
          'catalog_exercises',
          {
            id: variables.catalog.id,
            ex_key: variables.ex_key,
            name_pt: variables.name_pt,
            kind: variables.kind,
            equipment: variables.equipment,
            sets: variables.sets,
            reps: variables.reps,
            load: variables.load,
            rest: variables.rest,
            video_id: variables.video_id,
            photo_url: variables.photo_url,
            deleted: false,
            created_by: variables.catalog.created_by,
            created_at: variables.catalog.created_at,
            updated_at: OPTIMISTIC_AT,
            updated_by_client: variables.client,
          },
          /*
           * `name_en` is seeded rather than patched, and the difference matters. It
           * belongs to the exercises carried over from the old app, no form on this
           * screen edits it, and putting it in the patch would blank it on every edit
           * of a row that has one. The seed is consulted only when the row is new.
           */
          { name_en: null },
        ),
      );

      client.setQueryData<DayAddition[]>(additionKey, (rows = []) =>
        applyOptimistic(rows, 'day_additions', {
          id: variables.addition.id,
          day_no: variables.day_no,
          /*
           * Null, always: an addition has no owner since `009`, because no day has one.
           * It is stated rather than omitted only because `applyOptimistic` refuses a
           * patch that does not parse as a complete row, by `row-cache.ts`'s rule. The
           * server writes the same null and `writePublished` replaces this with what it
           * actually stored.
           */
          user_id: null,
          ex_key: variables.ex_key,
          block_config: {},
          deleted: false,
          created_by: variables.addition.created_by,
          created_at: variables.addition.created_at,
          updated_at: OPTIMISTIC_AT,
          updated_by_client: variables.client,
        }),
      );

      return ctx;
    },
    onError: (_error, _variables, ctx) => {
      if (!ctx) return;
      client.setQueryData(ctx.keys[0], ctx.previous[0]);
      client.setQueryData(ctx.keys[1], ctx.previous[1]);
    },
  });

  return {
    ...mutation,
    /**
     * Sends it, filling in the two things only a live session knows.
     *
     * `owner_id` is the reader and `catalog.created_by` is the author, and they are
     * asked for separately on purpose: anyone may change a published exercise, and
     * nobody may end up recorded as having written one they did not.
     */
    write(input: Omit<PublishSharedVars, 'owner_id' | 'client'>) {
      if (!userId) throw new Error('sem sessão: a escrita não tem dono');
      mutation.mutate({ ...input, owner_id: userId, client: clientId() });
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
