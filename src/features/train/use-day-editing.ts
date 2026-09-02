import { clientId } from '../../data/client-id';
import type { CustomExercise, ExerciseOverride } from '../../data/entities';
import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useUserId } from '../../data/queries';
import type { ProgKind } from '../../content';
import type { DayEntry } from './day-entries';

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
      order.isError,

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

    saveCustom(row: CustomExercise, input: ExerciseInput): void {
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

    /** Back to what the programme prescribes. The row goes; nothing is nulled in place. */
    clearOverride(override: ExerciseOverride): void {
      removeOverride.remove({
        user_id: override.user_id,
        day_no: override.day_no,
        ex_key: override.ex_key,
      });
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

    /** Puts back everything hidden in this day, which is how the old app's link read. */
    restoreHidden(exKeys: readonly string[]): void {
      if (!userId) return;
      for (const exKey of exKeys) {
        unhide.remove({ user_id: userId, day_no: dayNo, ex_key: exKey });
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
