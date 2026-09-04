import { clientId } from '../../data/client-id';
import type {
  CatalogExercise,
  CustomExercise,
  DayAddition,
  ExerciseOverride,
} from '../../data/entities';
import { useDeleteRow, usePublishShared, useUpsertRow } from '../../data/mutations';
import { useUserId } from '../../data/queries';
import type { ProgKind } from '../../content';
import { customKey, type DayEntry } from './day-entries';

/**
 * Composing a day: adding, changing, hiding and ordering.
 *
 * Every write here goes through the same optimistic path as a logged set, for the
 * same reason. A lifter who taps "add" between sets and watches a spinner decide
 * whether the exercise exists has been handed the network's problem. The row appears,
 * and the outbox carries it up whenever there is signal to carry it on.
 *
 * **Why each patch is a whole row.** `useUpsertRow`'s optimistic insert only lands if
 * the patch parses as a complete row of its table — a deliberate rule in
 * `row-cache.ts`, written after a partial row crashed the day view mid-session. So an
 * insert here states every column, including the nulls. An update states only what
 * changed, because there the patch is merged into the row that is already cached.
 *
 * `updated_at` is the epoch on purpose, and the reasoning is `applyOptimistic`'s: the
 * local guess must lose to the server's answer when it arrives, and a row stamped with
 * this device's clock would not.
 */

const EPOCH = new Date(0).toISOString();

/**
 * Where an exercise lives.
 *
 * Not who sees it: since `009` every exercise on a day is on everybody's day, because
 * there is one week. What is left to choose is whether it also goes into the shared
 * catalogue, where it can be picked up and put on another day without being written
 * out again — `'day'` is a `custom_exercises` row, `'catalog'` is the catalogue row
 * plus a day addition.
 *
 * Two values, not three. The third model the plan once described, public subject to
 * approval, is deferred to ten users by the user's decision of 2026-09-02: with two
 * people on the app a review queue has nobody to review it. The database carries no
 * `status` column for the same reason, so nothing here pretends a state exists.
 */
export type Visibility = 'day' | 'catalog';

export type ExerciseInput = {
  name: string;
  equipment: string;
  kind: ProgKind;
  sets: string;
  reps: string;
  load: string;
  rest: string;
  /** Already reduced to an id by `youtubeId`. Empty means no demonstration. */
  videoId: string;
  photoUrl: string | null;
  visibility: Visibility;
};

/** Empty strings become null, so "not set" is one value in the database and not two. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function useDayEditing(dayNo: number) {
  const userId = useUserId();
  const customs = useUpsertRow('custom_exercises');
  const removeCustom = useDeleteRow('custom_exercises');
  const overrides = useUpsertRow('exercise_overrides');
  const removeOverride = useDeleteRow('exercise_overrides');
  const hidden = useUpsertRow('hidden_items');
  const unhide = useDeleteRow('hidden_items');
  const order = useUpsertRow('exercise_order');
  const publish = usePublishShared();

  /**
   * Writes the two rows that make an exercise public: what it is, and that it is on
   * this day.
   *
   * One call, not two upserts, and that is the whole point of it. The two rows are
   * worthless apart — `resolveDayEntries` will not draw an addition with no exercise
   * behind it — and while they went up independently a refused catalogue write left
   * the addition behind, in a table every account reads, invisible to every screen.
   * `publish_shared_exercise` (`007`) writes both inside one transaction, so either
   * both land or neither does, offline included: the outbox replays one call.
   *
   * `created_at` and `created_by` are carried from the existing row when there is
   * one, so editing someone else's published exercise does not quietly rewrite it
   * into yours. Anyone may change it; nobody may claim to have written it. The
   * server enforces that too — its `on conflict` leaves both columns alone — and
   * these values are what the optimistic copy shows until the stored row arrives.
   */
  function writeShared(
    exKey: string,
    input: ExerciseInput,
    existing?: { catalog?: CatalogExercise; addition?: DayAddition },
  ): void {
    const now = new Date().toISOString();
    const author = userId ?? '';

    publish.write({
      ex_key: exKey,
      day_no: dayNo,
      deleted: false,
      name_pt: input.name.trim(),
      kind: input.kind,
      equipment: orNull(input.equipment),
      sets: orNull(input.sets),
      reps: orNull(input.reps),
      load: orNull(input.load),
      rest: orNull(input.rest),
      video_id: orNull(input.videoId),
      photo_url: input.photoUrl,
      catalog: {
        id: existing?.catalog?.id ?? crypto.randomUUID(),
        created_by: existing?.catalog?.created_by ?? author,
        created_at: existing?.catalog?.created_at ?? now,
      },
      addition: {
        id: existing?.addition?.id ?? crypto.randomUUID(),
        created_by: existing?.addition?.created_by ?? author,
        created_at: existing?.addition?.created_at ?? now,
      },
    });
  }

  return {
    /**
     * Whether the last composing write came back as a failure.
     *
     * Not cosmetic. Every write here is optimistic, so a rejected one leaves the card
     * on screen until the next reload takes it away, and the user finds out that the
     * exercise they added never existed by opening the day again later. Offline is not
     * this: a write with no signal is paused rather than failed, and the outbox carries
     * it up, so this stays quiet exactly when it should.
     */
    saveFailed:
      customs.isError ||
      removeCustom.isError ||
      overrides.isError ||
      removeOverride.isError ||
      hidden.isError ||
      unhide.isError ||
      order.isError ||
      publish.isError,

    /**
     * A new exercise of the user's own.
     *
     * The id is generated here rather than by the database default, because the
     * optimistic row needs its own key before the server has seen it, and because a
     * write made with no signal has to keep the same identity when it replays an hour
     * later. `legacy_key` stays null: that column belongs to exercises carried over
     * from the old app, and writing anything into it here would claim a history this
     * row does not have.
     */
    addCustom(input: ExerciseInput): string {
      if (input.visibility === 'catalog') {
        // A brand-new catalogue exercise has no private history to keep, so it gets a
        // key of its own. `s:` cannot collide with a baseline key, which has no
        // colon, nor with a private one, which is `c:`.
        const key = `s:${crypto.randomUUID()}`;
        writeShared(key, input);
        return key;
      }

      const id = crypto.randomUUID();
      customs.save({
        id,
        day_no: dayNo,
        legacy_key: null,
        kind: input.kind,
        name: input.name.trim(),
        equipment: orNull(input.equipment),
        sets: orNull(input.sets),
        reps: orNull(input.reps),
        load: orNull(input.load),
        rest: orNull(input.rest),
        video_id: orNull(input.videoId),
        photo_url: input.photoUrl,
        created_at: new Date().toISOString(),
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
      return id;
    },

    /**
     * Saves an exercise of the user's own, or publishes it.
     *
     * Publishing an exercise that already exists **keeps its key**. Its
     * `exercise_logs`, its place in `exercise_order` and any `hidden_items` row all
     * refer to it by that string, and minting a new one would orphan every set the
     * user has logged against it. The private row then goes, because two rows under
     * one key would draw the card twice.
     *
     * The consequence is worth stating rather than discovering: once published, the
     * exercise belongs to everyone, and anyone may remove it. That is the decision of
     * 2026-09-02, not an accident of this function.
     */
    saveCustom(row: CustomExercise, input: ExerciseInput): void {
      if (input.visibility === 'catalog') {
        writeShared(customKey(row), input);
        removeCustom.remove({ id: row.id });
        return;
      }

      customs.save({
        id: row.id,
        day_no: row.day_no,
        kind: input.kind,
        name: input.name.trim(),
        equipment: orNull(input.equipment),
        sets: orNull(input.sets),
        reps: orNull(input.reps),
        load: orNull(input.load),
        rest: orNull(input.rest),
        video_id: orNull(input.videoId),
        photo_url: input.photoUrl,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * Removes a user's own exercise.
     *
     * The logs written against it are left alone. They are the user's record of work
     * they actually did, and deleting a card is not a statement about last Tuesday.
     */
    deleteCustom(row: CustomExercise): void {
      removeCustom.remove({ id: row.id });
    },

    /**
     * Changes a published exercise, for everybody.
     *
     * There is no per-user copy to change instead. That is the point of publishing,
     * and it is why the form for a shared exercise says who it will change.
     */
    saveShared(entry: DayEntry, input: ExerciseInput): void {
      if (!entry.shared) return;
      writeShared(entry.key, input, entry.shared);
    },

    /**
     * Removes a published exercise from everybody's app.
     *
     * Soft, not hard: `deleted = true` on both rows. A real delete would leave
     * another person's day pointing at a row that is gone, and their screen would
     * have to invent something to draw. `fetchRows` filters `deleted = false` for
     * every account, and the realtime bridge drops a row that arrives soft-deleted,
     * so this reaches the other person's open app rather than waiting for a reload.
     *
     * Through the same transaction as publishing, and for the same reason: half a
     * removal is the worse state of the two. The exercise gone and the addition left
     * behind is precisely the orphan that made a day silently lose a card.
     */
    removeShared(entry: DayEntry): void {
      if (!entry.shared) return;
      const { catalog: row, addition } = entry.shared;

      publish.write({
        ex_key: row.ex_key,
        day_no: addition.day_no,
        deleted: true,
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
        addition: {
          id: addition.id,
          created_by: addition.created_by,
          created_at: addition.created_at,
        },
      });
    },

    /**
     * Changes a baseline exercise for this user, in this day.
     *
     * Every field is written, including the ones that came back unchanged, because the
     * form prefills from the current values: a field the user cleared has to become
     * null rather than keep what the row held before.
     */
    saveOverride(exKey: string, input: ExerciseInput): void {
      overrides.save({
        day_no: dayNo,
        ex_key: exKey,
        name: orNull(input.name),
        equipment: orNull(input.equipment),
        sets: orNull(input.sets),
        reps: orNull(input.reps),
        load: orNull(input.load),
        rest: orNull(input.rest),
        video_id: orNull(input.videoId),
        photo_url: input.photoUrl,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * Back to what the programme prescribes, for everybody. The row goes; nothing is
     * nulled in place.
     *
     * Keyed by the day and the exercise and not by who wrote it: since `009` there is
     * one row per exercise per day, not one per account, and `user_id` on it says who
     * touched it last. Sending that as part of the key would have deleted nothing on
     * the rows somebody else had edited since.
     */
    clearOverride(override: ExerciseOverride): void {
      removeOverride.remove({ day_no: override.day_no, ex_key: override.ex_key });
    },

    /**
     * Takes an exercise out of the day.
     *
     * The presence of the row is the whole meaning, which is why there is no boolean
     * to set false: an absent row and a false one would say the same thing twice.
     */
    hide(exKey: string): void {
      hidden.save({
        day_no: dayNo,
        ex_key: exKey,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * Puts back everything hidden in this day, which is how the old app's link read.
     *
     * For everybody, like the hiding was. The old key included `user_id`, which meant
     * restoring deleted only the row this account had written: an exercise hidden by
     * the other person came back on nobody's screen, and there was nothing to show why.
     */
    restoreHidden(exKeys: readonly string[]): void {
      for (const exKey of exKeys) {
        unhide.remove({ day_no: dayNo, ex_key: exKey });
      }
    },

    /**
     * Moves one exercise up or down, and stores the whole sequence.
     *
     * The sequence written is every visible key in this day, not a pair of positions,
     * so the saved order and what is on screen cannot drift apart. Baseline and own
     * exercises move through the same list, which is the point: the day is one
     * sequence, not two lists that happen to be drawn together.
     */
    move(entries: readonly DayEntry[], key: string, direction: 'up' | 'down'): void {
      const keys = entries.map((entry) => entry.key);
      const index = keys.indexOf(key);
      if (index < 0) return;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= keys.length) return;
      [keys[index], keys[target]] = [keys[target], keys[index]];
      order.save({
        day_no: dayNo,
        ordered_keys: keys,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },
  };
}
