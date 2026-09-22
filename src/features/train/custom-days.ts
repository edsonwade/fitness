import { useMemo } from 'react';

import { DAYS, type Day } from '../../content';
import { clientId } from '../../data/client-id';
import {
  FIRST_CUSTOM_DAY,
  type CustomDay,
  type CustomExercise,
  type DayAddition,
  type ExerciseOrder,
  type HiddenItem,
} from '../../data/entities';
import { firstFailure, useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useRows, useUserId } from '../../data/queries';
import type { Copy } from '../../i18n';
import { useT } from '../../i18n/locale-context';

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

/**
 * As palavras dos dias, passadas como argumento.
 *
 * `refOfCustom` e `resolveDays` são funções simples, não componentes nem hooks: não
 * podem chamar `useT()`. A alternativa era um `const t = pt.days` no topo do módulo,
 * e esse ficava preso em português para sempre, porque um módulo lê-se uma vez.
 * Receber o dicionário é a forma honesta — quem chama já o tem.
 */
type Days = Copy['days'];

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
 * the day that held it is gone. That is safe only because deleting a day empties it
 * first — `dayCleanup` below names everything that goes, and `deleteDay` sends it — so
 * the only rows a reused number can meet are `exercise_logs`, which are keyed by
 * exercise as well as by day, and whose exercise keys are uuids that cannot come back.
 *
 * That was a claim before it was true. Until this was fixed, `day_additions` survived a
 * deleted day, so the next day handed number 101 opened holding the previous 101's
 * published exercises.
 */
export function nextDayNo(customs: readonly CustomDay[]): number {
  let highest = FIRST_CUSTOM_DAY - 1;
  for (const row of customs) {
    if (row.day_no > highest) highest = row.day_no;
  }
  return highest + 1;
}

/** Everything in the database that a day can be holding. */
export type DayContents = {
  exercises: readonly CustomExercise[];
  hidden: readonly HiddenItem[];
  order: readonly ExerciseOrder[];
  additions: readonly DayAddition[];
};

/** What deleting a day has to take with it, one list per table. */
export type DayCleanup = {
  /** `custom_exercises` ids. */
  exercises: string[];
  /** `hidden_items` keys, as the delete wants them. */
  hidden: { day_no: number; ex_key: string }[];
  /** Whether this day has a saved order to remove. One row per day, so a boolean. */
  order: boolean;
  /** `day_additions` rows to retire with `deleted = true`. Never a hard delete. */
  additions: DayAddition[];
};

/**
 * Everything that only existed inside one day.
 *
 * Pure, and separate from the hook that sends it, because "what a delete takes" is the
 * part that was wrong and the part worth holding still: it is four tables, and the one
 * that was missing — `day_additions` — was missing silently, in a table no screen draws
 * a day from. A function that can be handed four lists and asked is a function a test
 * can ask.
 */
export function dayCleanup(dayNo: number, contents: DayContents): DayCleanup {
  return {
    exercises: contents.exercises.filter((row) => row.day_no === dayNo).map((row) => row.id),
    hidden: contents.hidden
      .filter((row) => row.day_no === dayNo)
      .map((row) => ({ day_no: dayNo, ex_key: row.ex_key })),
    order: contents.order.some((row) => row.day_no === dayNo),
    additions: contents.additions.filter((row) => row.day_no === dayNo && !row.deleted),
  };
}

/** One `custom_days` row as the screens read it. */
export function refOfCustom(d: Days, row: CustomDay): DayRef {
  return {
    no: row.day_no,
    kind: 'own',
    day: null,
    label: d.own,
    name: text(row.name) ?? d.untitled,
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
 * The seven weekday names, in authored order (Seg…Dom), taken from the bundle so
 * there is one source for them and not a second list to keep in step.
 *
 * Since `010` the weekday is the **slot, not the content**: it comes from the
 * position a day sits in, not from the day itself. Segunda is whatever day is first,
 * be it the programme's Leg day, a rest, or one you made. `resolveDays` stamps these
 * onto the first seven positions; anything past the seventh is an extra day with no
 * weekday, and keeps the plain "own" label it had before drag ordering existed.
 */
const WEEKDAYS: readonly string[] = DAYS.map((day) => day.wd.pt);

/**
 * Where the drag settled, as the whole new sequence — the day-reorder rule of `004`.
 *
 * The rule is **not** the direct insertion the exercises use (Cenário 0). It is the
 * asymmetric one the interaction spec writes in Cenários 1 and 2, read here as
 * "Leitura A", confirmed with the user on 2026-09-05 ("saltar para qualquer posição,
 * sem barreira"):
 *
 *   - **up, and any jump longer than one slot down → direct insertion.** The day
 *     lands exactly where it is dropped and the rest close the gap. This reaches
 *     every position and is what Cenário 2 asks for.
 *   - **the one case of dropping a single slot down → Cenário 1's wrap:** the day at
 *     `to + 1` comes round to the origin. Dragging Pernas from Segunda onto Terça
 *     puts **Ombros** on Segunda, not Descanso — the assimetria the spec states on
 *     purpose and forbids "correcting". When `to` is the last slot there is no
 *     `to + 1`, so this degenerates to a swap, which direct insertion gives anyway.
 *
 * Pure, and given `from`/`to` as indices into the original sequence, because that is
 * what a drop knows and what a test can ask. `motion`'s live reflow is direct
 * insertion, so its preview matches this in every case but the single-slot-down one,
 * where the card settles on the wrap when released.
 */
export function applyDayDrag(order: readonly number[], from: number, to: number): number[] {
  const n = order.length;
  if (from === to || from < 0 || to < 0 || from >= n || to >= n) return order.slice();

  const next = order.slice();
  if (to === from + 1 && to + 1 < n) {
    // The window [s, t, t+1], rotated right by one: the day at t+1 gives the turn
    // and takes the vacated origin, the other two step down.
    const window = next.slice(from, to + 2);
    const rotated = [window[window.length - 1], ...window.slice(0, -1)];
    next.splice(from, window.length, ...rotated);
    return next;
  }

  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * The whole week: the programme's seven in their authored order, then the user's
 * own by number, which is the order they were created in — unless a stored day-drag
 * order (`010`) rearranges it.
 *
 * Sorting the user's days by number rather than by name is deliberate. A list that
 * re-sorts itself when a day is renamed moves a card out from under a thumb that
 * was already reaching for it, and the day after a rename is the day you are least
 * able to find it by looking.
 *
 * `order` is a sequence of `day_no`. A number in it that no longer names a day is
 * skipped, and a day that exists but is not in the order goes to the end, so a day
 * created after the order was saved appears rather than vanishing. The weekday label
 * is assigned last, by final position, which is the whole point of drag ordering.
 */
export function resolveDays(
  d: Days,
  customs: readonly CustomDay[],
  order?: readonly number[],
): DayRef[] {
  const own = customs
    .filter((row) => row.day_no >= FIRST_CUSTOM_DAY)
    .slice()
    .sort((a, b) => a.day_no - b.day_no)
    .map((row) => refOfCustom(d, row));

  const base = [...DAYS.map(refOfBuilt), ...own];

  let sequenced = base;
  if (order && order.length > 0) {
    const byNo = new Map(base.map((ref) => [ref.no, ref]));
    const seen = new Set<number>();
    const out: DayRef[] = [];
    for (const no of order) {
      const ref = byNo.get(no);
      if (ref && !seen.has(no)) {
        out.push(ref);
        seen.add(no);
      }
    }
    for (const ref of base) if (!seen.has(ref.no)) out.push(ref);
    sequenced = out;
  }

  return sequenced.map((ref, index) => ({
    ...ref,
    label: index < WEEKDAYS.length ? WEEKDAYS[index] : d.own,
  }));
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
/**
 * The active day-drag order, and whose it is.
 *
 * RLS on `day_order` (`010`) returns at most two rows: the shared week (`user_id`
 * null) and this account's own (`user_id = auth.uid()`). The own one wins when it
 * exists — otherwise the first arrangement anybody made would erase everyone's the
 * moment a second person dragged a card. `hasShared`/`hasOwn` are what the screen
 * needs to say whose week is on show and to offer the way back to the shared one.
 */
export function useDayOrder() {
  const query = useRows('day_order');
  const rows = query.data;

  const own = rows?.find((row) => row.user_id !== null) ?? null;
  const shared = rows?.find((row) => row.user_id === null) ?? null;
  const active = own ?? shared;

  return {
    /** The order that wins by precedence — own if it exists, else shared. */
    order: active?.ordered_day_nos ?? null,
    ownOrder: own?.ordered_day_nos ?? null,
    sharedOrder: shared?.ordered_day_nos ?? null,
    isOwn: own !== null,
    hasOwn: own !== null,
    hasShared: shared !== null,
    isPending: query.isPending,
  };
}

export function useDays() {
  const d = useT().days;
  const query = useRows('custom_days');
  const rows = query.data;
  const { order } = useDayOrder();

  const days = useMemo(() => resolveDays(d, rows ?? [], order ?? undefined), [d, rows, order]);

  return {
    days,
    customs: rows,
    order,
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

/**
 * The id of the shared `day_order` row. Fixed, so the upsert of the shared week
 * always lands on the one row rather than inserting a second — the unique-scope
 * index of `010` would refuse it, but a deterministic id means it never tries. An
 * own row uses its `user_id` as its id, for the same reason.
 */
const SHARED_ORDER_ID = '00000000-0000-0000-0000-000000000000';

export function useCustomDayEditing() {
  const t = useT().days;
  const days = useUpsertRow('custom_days');
  const removeDay = useDeleteRow('custom_days');
  const removeExercise = useDeleteRow('custom_exercises');
  const removeHidden = useDeleteRow('hidden_items');
  const removeOrder = useDeleteRow('exercise_order');
  const retireAddition = useUpsertRow('day_additions');

  const existing = useRows('custom_days').data;
  const exercises = useRows('custom_exercises').data;
  const hidden = useRows('hidden_items').data;
  const order = useRows('exercise_order').data;
  const additions = useRows('day_additions').data;

  return {
    /**
     * The write that came back refused, if one did, and how to send it again.
     *
     * Every write here is optimistic, so a rejected one leaves a day on screen that the
     * database never accepted, and without this the way you find out is opening the app
     * tomorrow and finding it gone. Offline is not this: a write with no signal is
     * paused, not failed, and the outbox sends it later.
     *
     * The order is the order of the telling, and it is not arbitrary. Deleting a day is
     * five writes, and the one whose failure changes what the user is looking at — the
     * day itself — is named first; the leftovers inside a day that did go are true but
     * secondary, and a person only needs to be told about them once the day is gone.
     */
    failure: firstFailure([
      /*
       * Creating and changing a day are the same upsert, and they are not the same
       * sentence: one lost a day that never existed, the other lost an edit to a day
       * that is still there. `created_at` is only ever sent by `createDay`, so the
       * payload itself says which one this was.
       */
      [days, (days.variables as { created_at?: unknown } | undefined)?.created_at
        ? t.failCreate
        : t.failSave],
      [removeDay, t.failDelete],
      [removeExercise, t.failExercises],
      [removeHidden, t.failHidden],
      [removeOrder, t.failOrder],
      [retireAddition, t.failAddition],
    ]),

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
     * **A day's `day_additions` go too, and that is what this used to leave behind.**
     * An addition says "this published exercise is trained on day 101"; once 101 is
     * gone the sentence has no subject, and the row was unreachable from every screen
     * — no day drew it, and the catalogue lists days, not orphans. Worse, `nextDayNo`
     * hands the number out again, so the next day created inherited the deleted day's
     * exercises. The comment above `nextDayNo` claims that cannot happen; until now it
     * only held for the four tables listed there.
     *
     * The removal is `deleted = true` rather than a delete, because `day_additions` is
     * one of the two additive tables: a hard delete has no policy and, more to the
     * point, the realtime bridge carries a flagged row to the other account's open app
     * where a vanished row would arrive as nothing at all.
     *
     * `catalog_exercises` stay, deliberately. The catalogue is a library, not this
     * day's contents: an exercise published from here can be on other days and can be
     * put on a day again tomorrow, and emptying the library because one day was
     * deleted would take it out of somebody else's week too. Removing it from the
     * catalogue is its own control, on the catalogue screen, and it says so.
     *
     * `exercise_logs` stay. They are the record of work actually done, and deleting
     * a day is a statement about the plan, not about last Tuesday. This is the same
     * rule an exercise of your own already follows.
     */
    deleteDay(dayNo: number): void {
      const going = dayCleanup(dayNo, {
        exercises: exercises ?? [],
        hidden: hidden ?? [],
        order: order ?? [],
        additions: additions ?? [],
      });

      for (const id of going.exercises) removeExercise.remove({ id });
      for (const key of going.hidden) removeHidden.remove(key);
      if (going.order) removeOrder.remove({ day_no: dayNo });
      for (const row of going.additions) {
        /*
         * The whole row goes up, not a patch: `day_additions` is upserted, so Postgres
         * builds the candidate tuple before deciding to update it and a patch missing
         * `ex_key` or `created_by` is refused by a not-null constraint. The same reason
         * `useCatalogEditing.save` states.
         */
        retireAddition.save({
          ...row,
          deleted: true,
          updated_at: EPOCH,
          updated_by_client: clientId(),
        });
      }

      removeDay.remove({ day_no: dayNo });
    },
  };
}

/**
 * Writing the week's day-drag order, in its two scopes.
 *
 * Both are real, by the user's decision on 2026-09-05: the **shared** week that is
 * everybody's, exactly like the rest of the plan since `009`, and an account's
 * **own** arrangement. `saveShared` writes the first, `saveOwn` the second, and
 * `resetToShared` drops the own one so the shared week shows through again — the way
 * back that stops a personal order from making the shared one invisible for good.
 *
 * Optimistic like every write here; `updated_at` is the epoch on purpose, so the
 * server's real timestamp (stamped by the `010` trigger) wins when it lands.
 */
export function useDayOrderEditing() {
  const t = useT().days;
  const order = useUpsertRow('day_order');
  const removeOrder = useDeleteRow('day_order');
  const userId = useUserId();

  return {
    failure: firstFailure([
      [order, t.failWeekOrder],
      [removeOrder, t.failWeekOrder],
    ]),

    /** The shared week, for everybody. The fixed id keeps it to the one shared row. */
    saveShared(orderedDayNos: readonly number[]): void {
      order.save({
        id: SHARED_ORDER_ID,
        user_id: null,
        ordered_day_nos: [...orderedDayNos],
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /**
     * This account's own arrangement. The id is the user id, so the upsert lands on
     * the one own row; `user_id` is filled in by `save()`'s owner default.
     */
    saveOwn(orderedDayNos: readonly number[]): void {
      if (!userId) return;
      order.save({
        id: userId,
        ordered_day_nos: [...orderedDayNos],
        updated_at: EPOCH,
        updated_by_client: clientId(),
      });
    },

    /** Drops this account's own order, so the shared week shows through again. */
    resetToShared(): void {
      if (!userId) return;
      removeOrder.remove({ id: userId });
    },

    /**
     * Drops the shared week itself, so the programme's original order shows through
     * again — the factory state. `resolveDays()` with no stored order returns the
     * bundle's own sequence (`[...DAYS, ...own]`), so deleting the one shared row is
     * the whole reset: there is nothing to write, only a row to remove. This is the
     * way back the shared scope was missing — once dragged, the shared week had no
     * path home to the order the plan ships. It writes everyone's week, so the screen
     * asks first.
     */
    resetToDefault(): void {
      removeOrder.remove({ id: SHARED_ORDER_ID });
    },
  };
}
