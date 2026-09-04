import { useMemo } from 'react';

import { clientId } from '../../data/client-id';
import type { CatalogExercise, DayAddition } from '../../data/entities';
import { usePublishShared, useUpsertRow } from '../../data/mutations';
import { useRows } from '../../data/queries';
import type { ExerciseInput } from '../train/use-day-editing';

/**
 * The shared catalogue: everything any account has published.
 *
 * Two tables and one rule. `catalog_exercises` is the exercise, and it is the single
 * copy: name, equipment, movement type, numbers, video and photo all live there, so
 * every account draws the same card from the same row. `day_additions` says which
 * days prescribe it, and nothing else.
 *
 * Nobody owns a published exercise. Anyone may change it and anyone may remove it,
 * which is the user's decision of 2026-09-02 and the reason this module has no notion
 * of a creator anywhere in its writes. `created_by` is still carried on the row,
 * because a row should be able to say who wrote it even when anyone can edit it.
 *
 * Removing is `deleted = true` on the exercise and on every day that prescribes it.
 * A real delete would leave another person's day pointing at a row that is gone.
 */

const EPOCH = new Date(0).toISOString();

export type CatalogItem = {
  row: CatalogExercise;
  /** The live additions of this exercise, in day order. Empty is a real state. */
  days: DayAddition[];
};

/**
 * The catalogue, with each exercise's days attached.
 *
 * Sorted by name rather than by date, because this is a list someone reads looking
 * for a particular exercise, not a feed of what happened lately. `localeCompare`
 * with the Portuguese collation puts the accented names where a Portuguese reader
 * expects them instead of after Z.
 */
export function useCatalog() {
  const catalog = useRows('catalog_exercises');
  const additions = useRows('day_additions');

  const items = useMemo<CatalogItem[]>(() => {
    const byKey = new Map<string, DayAddition[]>();
    for (const row of additions.data ?? []) {
      const list = byKey.get(row.ex_key) ?? [];
      list.push(row);
      byKey.set(row.ex_key, list);
    }

    return (catalog.data ?? [])
      .slice()
      .sort((a, b) => a.name_pt.localeCompare(b.name_pt, 'pt'))
      .map((row) => ({
        row,
        days: (byKey.get(row.ex_key) ?? []).slice().sort((a, b) => a.day_no - b.day_no),
      }));
  }, [catalog.data, additions.data]);

  return {
    items,
    isPending: catalog.isPending || additions.isPending,
    isError: catalog.isError || additions.isError,
  };
}

/**
 * Changing and removing what is published, from the catalogue rather than from a day.
 *
 * Editing here writes only the exercise, because that is the only thing this screen
 * is looking at. Which days prescribe it is decided in the days, and a screen with no
 * day open has no business adding or removing one.
 */
export function useCatalogEditing() {
  const catalog = useUpsertRow('catalog_exercises');
  const additions = useUpsertRow('day_additions');

  return {
    saveFailed: catalog.isError || additions.isError,

    /**
     * Saves the shared exercise, for everybody.
     *
     * The whole row goes up, not a patch. PostgREST's upsert is
     * `insert ... on conflict do update`, so Postgres builds the candidate tuple
     * before deciding to update it, and a patch without `ex_key`, `name_pt` or
     * `created_by` is refused by a not-null constraint on a row that already exists.
     *
     * `created_by` and `created_at` are carried from the row being edited. Anyone may
     * change a published exercise; nobody may end up recorded as having written one
     * they did not.
     */
    save(row: CatalogExercise, input: ExerciseInput): void {
      catalog.save({
        ...row,
        name_pt: input.name.trim(),
        kind: input.kind,
        equipment: nullable(input.equipment),
        sets: nullable(input.sets),
        reps: nullable(input.reps),
        load: nullable(input.load),
        rest: nullable(input.rest),
        video_id: nullable(input.videoId),
        photo_url: input.photoUrl,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * Removes it from everybody's app: the exercise, and every day that prescribes it.
     *
     * Leaving the additions behind would leave a card that resolves to nothing on
     * every day it was on, in every account. `resolveDayEntries` already refuses to
     * draw an addition with no exercise behind it, so the day would silently lose a
     * card without anything saying why.
     *
     * Logged sets are not touched. They are what somebody actually did.
     */
    remove(item: CatalogItem): void {
      catalog.save({
        ...item.row,
        deleted: true,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
      for (const addition of item.days) {
        additions.save({
          ...addition,
          deleted: true,
          updated_at: EPOCH,
          updated_by_client: clientId(),
        });
      }
    },
  };
}

/**
 * Putting a published exercise into one of your days, and taking it out again.
 *
 * This is the other half of the catalogue, and without it the catalogue led nowhere: it
 * listed exercises with no way to actually train them.
 *
 * Which day it goes into no longer decides who sees it — since `009` there is one week
 * and every day in it is everybody's, so this decides when it is trained and nothing
 * else. Placing is the whole operation, and it needs no notion of scope at all.
 *
 * The write goes through `publish_shared_exercise` rather than a plain upsert, for the
 * reason `use-day-editing.ts` gives: the exercise row and the addition are worthless
 * apart, and one transaction is also one entry in the outbox when this is done with no
 * signal.
 */
export function useCatalogPlacement() {
  const publish = usePublishShared();

  /** The one live addition of this exercise on that day, if it is already there. */
  function additionOn(item: CatalogItem, dayNo: number): DayAddition | undefined {
    return item.days.find((row) => row.day_no === dayNo);
  }

  return {
    saveFailed: publish.isError,
    additionOn,

    /**
     * Adds it to a day, or removes it from one.
     *
     * `deleted` carries straight through to both rows, which is why removing from a
     * day is this same call: the transaction that writes a pair is the transaction
     * that retires a pair, and a second path would be a second chance to leave half
     * of one behind.
     *
     * The exercise's own fields are copied from the row as it stands, unchanged. This
     * places an exercise; it does not edit one, and sending the current values is how
     * it says so — the `on conflict` in `008` §6 writes them back identical.
     */
    place(item: CatalogItem, dayNo: number, userId: string, remove = false): void {
      const { row } = item;
      const existing = additionOn(item, dayNo);
      const now = new Date().toISOString();

      publish.write({
        ex_key: row.ex_key,
        day_no: dayNo,
        deleted: remove,
        name_pt: row.name_pt,
        kind: row.kind,
        equipment: row.equipment,
        sets: row.sets,
        reps: row.reps,
        load: row.load,
        rest: row.rest,
        video_id: row.video_id,
        photo_url: row.photo_url,
        catalog: { id: row.id, created_by: row.created_by, created_at: row.created_at },
        /*
         * A day this exercise has been on before keeps its addition row, id included.
         * The server reuses it too (`008` §6), and the two agreeing is what stops the
         * optimistic copy and the stored one from drawing the same card twice.
         */
        addition: {
          id: existing?.id ?? crypto.randomUUID(),
          created_by: existing?.created_by ?? userId,
          created_at: existing?.created_at ?? now,
        },
      });
    },
  };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
