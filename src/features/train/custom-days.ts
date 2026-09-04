import { useMemo } from 'react';

import { DAYS, type Day } from '../../content';
import { clientId } from '../../data/client-id';
import { FIRST_CUSTOM_DAY, type CustomDay } from '../../data/entities';
import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useRows } from '../../data/queries';
import { pt } from '../../i18n/pt';

/**
 * The week, once days have been added to it.
 *
 * The programme ships seven days and they are not editable content: they live in
 * the bundle, so nothing in the database can rewrite them. An added day is a
 * `custom_days` row, and the only thing that makes it work everywhere is its
 * number. Plan decision D4: **1 to 7 is the programme, 101 up is added.**
 *
 * Since `009` a day belongs to everybody, exactly like the seven do. Somebody adds
 * "Caminhada" and it is in the other account's week before they have touched
 * anything, because the row is shared and realtime carries it. The number is what
 * makes that true and is why it is now unique across the database rather than within
 * an account: the same 101 has to mean the same day on both screens, or every table
 * that stores a `day_no` is storing an ambiguity.
 *
 * `day_no` is already a column on `exercise_logs`, `custom_exercises`,
 * `hidden_items`, `exercise_order` and `exercise_overrides`, so an exercise added
 * to day 101, a load logged against it, and the order it sits in all travel the
 * paths phase A already built and tested. No table changed to make this fit.
 *
 * 8 to 100 is left empty on purpose: it is the room for the bundled programme to
 * grow without colliding with days people have already created.
 *
 * The two shapes are unified here and nowhere else. A `DayRef` is what every
 * screen reads, so the week card, the day header and the day's own editing
 * controls cannot disagree about what a day is called or whether it is yours.
 */

/**
 * The first number an added day can take. Below it is the programme.
 *
 * Defined in the data layer and re-exported here, so there is one number rather than
 * two that have to agree.
 */
export { FIRST_CUSTOM_DAY };

const t = pt.days;

export type DayKind = 'built' | 'own';
export type DayType = 'strength' | 'cardio' | 'rest';

export type DayRef = {
  /** The number everything else stores against: logs, exercises, hiding, order. */
  no: number;
  kind: DayKind;
  /** The bundled day behind this one, or null for a day the user made. */
  day: Day | null;
  /**
   * The small line above the name. The weekday for a programme day, because the
   * programme pins those to one; a plain word for yours, because nothing pins it.
   */
  label: string;
  name: string;
  goal: string | null;
  warm: string | null;
  type: DayType;
  /** The row behind a day of the user's own, for the edit sheet. */
  custom?: CustomDay;
};

export type DayInput = {
  name: string;
  goal: string;
  warm: string;
  type: DayType;
};

const DAY_TYPES: readonly DayType[] = ['strength', 'cardio', 'rest'];

function isDayType(value: string): value is DayType {
  return (DAY_TYPES as readonly string[]).includes(value);
}

/** Free text that is present and not just spaces, else null. */
function text(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

/** Empty strings become null, so "not set" is one value in the database, not two. */
const orNull = text;

/**
 * The number the next added day takes.
 *
 * One past the highest that exists, never below `FIRST_CUSTOM_DAY`. The list it counts
 * over is every day in the database, not this account's, which is what stops two people
 * from creating a day at the same time and both calling it 101 — the bug `008` was
 * written to contain and `009` removed the cause of. Two people creating a day in the
 * same second still collide, and the database refuses the second one rather than
 * accepting an ambiguity: the day's primary key is its number now.
 *
 * A gap left by a deleted day is not filled, but the highest number is taken again once
 * the day that held it is gone. That is safe for the same reason as before: deleting a
 * day takes its exercises, its hidden markers and its saved order with it (`deleteDay`
 * below), so the only rows a reused number can meet are `exercise_logs`, which are
 * keyed by exercise as well as by day, and whose exercise keys are uuids that cannot
 * come back.
 */
export function nextDayNo(customs: readonly CustomDay[]): number {
  let highest = FIRST_CUSTOM_DAY - 1;
  for (const row of customs) {
    if (row.day_no > highest) highest = row.day_no;
  }
  return highest + 1;
}

/** One `custom_days` row as the screens read it. */
export function refOfCustom(row: CustomDay): DayRef {
  return {
    no: row.day_no,
    kind: 'own',
    day: null,
    label: t.own,
    name: text(row.name) ?? t.untitled,
    goal: text(row.goal),
    warm: text(row.warm),
    type: isDayType(row.type) ? row.type : 'strength',
    custom: row,
  };
}

/** One bundled day as the screens read it. */
export function refOfBuilt(day: Day): DayRef {
  return {
    no: day.id,
    kind: 'built',
    day,
    label: day.wd.pt,
    name: day.name.pt,
    goal: day.goal?.pt ?? null,
    warm: day.warm?.pt ?? null,
    type: day.type,
  };
}

/**
 * The whole week: the programme's seven in their authored order, then the user's
 * own by number, which is the order they were created in.
 *
 * Sorting the user's days by number rather than by name is deliberate. A list that
 * re-sorts itself when a day is renamed moves a card out from under a thumb that
 * was already reaching for it, and the day after a rename is the day you are least
 * able to find it by looking.
 */
export function resolveDays(customs: readonly CustomDay[]): DayRef[] {
  const own = customs
    .filter((row) => row.day_no >= FIRST_CUSTOM_DAY)
    .slice()
    .sort((a, b) => a.day_no - b.day_no)
    .map(refOfCustom);

  return [...DAYS.map(refOfBuilt), ...own];
}

/* ---------- the hooks the screens use --------------------------------------- */

/**
 * Every day this account has, resolved.
 *
 * `isPending` matters more here than it usually does: a day of the user's own is
 * the only thing on this screen that does not ship in the bundle, so a deep link
 * to `/treino/102` arrives before the row does. A screen that read a missing day
 * as a missing day would tell a person their own training day does not exist,
 * every time they opened it cold.
 */
export function useDays() {
  const query = useRows('custom_days');
  const rows = query.data;

  const days = useMemo(() => resolveDays(rows ?? []), [rows]);

  return {
    days,
    customs: rows,
    isPending: query.isPending,
    isError: query.isError,
    /** One day by its number, or null when this account has no such day. */
    dayOf: (no: number): DayRef | null => days.find((day) => day.no === no) ?? null,
  };
}

/**
 * Creating, renaming and deleting a day of the user's own.
 *
 * Optimistic, like every other write in this app and for the same reason: someone
 * who taps "create day" in a changing room should be inside the new day before the
 * network has been consulted, and the outbox carries the row up when there is
 * signal to carry it on.
 *
 * `updated_at` is the epoch on purpose, as everywhere else here: the local guess
 * must lose to the server's answer when it lands, and a row stamped with this
 * device's clock would not.
 */
const EPOCH = new Date(0).toISOString();

export function useCustomDayEditing() {
  const days = useUpsertRow('custom_days');
  const removeDay = useDeleteRow('custom_days');
  const removeExercise = useDeleteRow('custom_exercises');
  const removeHidden = useDeleteRow('hidden_items');
  const removeOrder = useDeleteRow('exercise_order');

  const existing = useRows('custom_days').data;
  const exercises = useRows('custom_exercises').data;
  const hidden = useRows('hidden_items').data;
  const order = useRows('exercise_order').data;

  return {
    /**
     * Whether the last write to a day came back refused.
     *
     * Every write here is optimistic, so a rejected one leaves a day on screen that
     * the database never accepted, and without this the way you find out is opening
     * the app tomorrow and finding it gone. Offline is not this: a write with no
     * signal is paused, not failed, and the outbox sends it later.
     */
    saveFailed:
      days.isError ||
      removeDay.isError ||
      removeExercise.isError ||
      removeHidden.isError ||
      removeOrder.isError,

    /** A new day, at the next free number. Returns it, so the caller can open it. */
    createDay(input: DayInput): number {
      const dayNo = nextDayNo(existing ?? []);
      days.save({
        day_no: dayNo,
        name: input.name.trim(),
        goal: orNull(input.goal),
        warm: orNull(input.warm),
        type: input.type,
        created_at: new Date().toISOString(),
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
      return dayNo;
    },

    saveDay(row: CustomDay, input: DayInput): void {
      days.save({
        day_no: row.day_no,
        name: input.name.trim(),
        goal: orNull(input.goal),
        warm: orNull(input.warm),
        type: input.type,
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * Deletes a day, and everything that only existed inside it.
     *
     * The exercises of a day of your own are reachable through nothing else, so
     * leaving them would leave rows no screen can ever show and no person can ever
     * remove. Its saved order and its hidden markers go for the same reason.
     *
     * `exercise_logs` stay. They are the record of work actually done, and deleting
     * a day is a statement about the plan, not about last Tuesday. This is the same
     * rule an exercise of your own already follows.
     */
    deleteDay(dayNo: number): void {
      for (const row of exercises ?? []) {
        if (row.day_no === dayNo) removeExercise.remove({ id: row.id });
      }
      for (const row of hidden ?? []) {
        if (row.day_no === dayNo) removeHidden.remove({ day_no: dayNo, ex_key: row.ex_key });
      }
      if ((order ?? []).some((row) => row.day_no === dayNo)) {
        removeOrder.remove({ day_no: dayNo });
      }

      removeDay.remove({ day_no: dayNo });
    },
  };
}
