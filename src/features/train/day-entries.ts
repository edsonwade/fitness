import { useMemo } from 'react';

import {
  EXERCISES,
  VIDEOS,
  prog,
  type BlockKey,
  type Day,
  type Exercise,
  type LocalizedText,
  type Prescription,
  type ProgKind,
} from '../../content';
import type {
  CustomExercise,
  ExerciseOrder,
  ExerciseOverride,
  HiddenItem,
} from '../../data/entities';
import { useRows } from '../../data/queries';

/**
 * What a day is actually made of, once the user has had their say.
 *
 * The bundled programme is the baseline and nothing writes to it. On top of it sit
 * four private tables, and this module is the one place that knows how they combine:
 *
 *  - `custom_exercises` adds exercises of the user's own,
 *  - `exercise_overrides` changes the prescription of a baseline one,
 *  - `hidden_items` takes one out of the day,
 *  - `exercise_order` decides the sequence of what is left.
 *
 * Every screen reads the result, never the raw content: the card, the set tracker,
 * the day's progress bar and the week's rings all have to agree, and they only agree
 * if there is a single answer to "what is in this day". `resolveDayEntries` is pure
 * and is tested directly, because that answer is now the difference between a
 * progress ring that means something and one that ignores half the session.
 */

/** The four periodization blocks, in the order the chips show them. */
export const BLOCK_KEYS = ['b1', 'b2', 'b3', 'dl'] as const;

export type DayEntry = {
  /** The key everything else is stored against: logs, hiding, ordering, rest. */
  key: string;
  kind: 'built' | 'custom';
  name: string;
  equipment: string | null;
  /** This block's target, after any override. */
  prescription: Prescription;
  note?: LocalizedText;
  videoId: string | null;
  /** The card's image, or null for the neutral tile. Never another exercise's photo. */
  photo: string | null;
  /** Used only when `photo` is a bundled path that turns out not to exist. */
  fallbackPhoto: string | null;
  /** The authored technique text. Baseline exercises only; nothing else has one. */
  exercise?: Exercise;
  /** The row behind a user's own exercise, for the edit sheet. */
  custom?: CustomExercise;
  /** The row behind a changed baseline exercise, for the edit sheet and the badge. */
  override?: ExerciseOverride;
};

export type ResolvedDay = {
  entries: DayEntry[];
  /** How many baseline exercises the user has taken out of this day. */
  hiddenCount: number;
};

const PROG_KINDS: readonly ProgKind[] = ['comp', 'acc', 'iso', 'core'];

/**
 * The key a user's own exercise is known by.
 *
 * A migrated one keeps `c<id>`, because its logs, its position in the personal order
 * and its rest preference were all written against that string by the v1 mapper
 * (`migration/v1-mapper.ts`), and a new key would orphan every one of them. A new one
 * is `c:<uuid>`. Neither shape can collide with a baseline key, and a test asserts
 * that against `EXERCISES` rather than trusting the eye.
 */
export function customKey(row: Pick<CustomExercise, 'id' | 'legacy_key'>): string {
  return row.legacy_key ?? `c:${row.id}`;
}

export function isProgKind(value: string): value is ProgKind {
  return (PROG_KINDS as readonly string[]).includes(value);
}

/** A set count out of free text, falling back rather than rendering nothing. */
function setCount(value: string | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 12) : fallback;
}

/** Free text that is present and not just spaces, else null. */
function text(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * The four block prescriptions of a user's own exercise.
 *
 * The user writes one set of numbers and picks a movement type; `prog()` — the
 * author's own generator, the same one that wrote the baseline days — turns that into
 * the four blocks. This is what makes an exercise you added behave like one of the
 * programme's when you switch to the deload, instead of being the single card on the
 * screen that ignores the block chips.
 *
 * Reps you typed win in every block. `prog()` has a rep range per block per type, and
 * that is the right default, but a number a person deliberately wrote is not a
 * default to be improved on.
 */
export function customPrescription(row: CustomExercise, block: BlockKey): Prescription {
  const kind: ProgKind = isProgKind(row.kind) ? row.kind : 'acc';
  const slots = prog(setCount(row.sets, 3), text(row.load) ?? '—', text(row.rest) ?? '90 s', kind);
  const base = slots[block];
  const reps = text(row.reps);
  return reps ? { ...base, r: reps } : base;
}

/**
 * A baseline prescription with the user's changes applied.
 *
 * `exercise_overrides` has one nullable column per field and no notion of a block,
 * so a change applies to the exercise in every block. That is what the old app did
 * (`exCard()` reading `o.s || b.s`) and it is what the table can express; an override
 * per block would be a different table and a product decision nobody has taken.
 *
 * RPE is deliberately not overridable. It is the one figure in the prescription that
 * is about effort rather than equipment, and the form has no field for it.
 */
export function overriddenPrescription(
  base: Prescription,
  override: ExerciseOverride | undefined,
): Prescription {
  if (!override) return base;
  return {
    s: setCount(override.sets, base.s),
    r: text(override.reps) ?? base.r,
    rpe: base.rpe,
    l: text(override.load) ?? base.l,
    rest: text(override.rest) ?? base.rest,
  };
}

/** The bundled poster for a baseline exercise, by the convention `public/img/` uses. */
export function builtinPoster(exKey: string): string {
  return `${import.meta.env.BASE_URL}img/ex-${exKey.replace('_', '')}.jpg`;
}

export function dayPoster(dayNo: number): string {
  return `${import.meta.env.BASE_URL}img/day-${dayNo}.jpg`;
}

export type ResolveInput = {
  /** The bundled day, or null for a day that is not part of the baseline programme. */
  day: Day | null;
  dayNo: number;
  block: BlockKey;
  customs: readonly CustomExercise[];
  overrides: readonly ExerciseOverride[];
  hidden: readonly HiddenItem[];
  order: readonly ExerciseOrder[];
};

/**
 * The day, resolved.
 *
 * Order of operations matters and is the same one the old app used
 * (`orderedEntries`, `ui.js:1091`): baseline first in its authored sequence, then the
 * user's own in the order they were created, then the personal order applied over the
 * whole merged list. A key with no saved position falls to the end in natural order,
 * so an exercise added today appears at the bottom of the day rather than vanishing
 * into a sequence that was written before it existed.
 */
export function resolveDayEntries(input: ResolveInput): ResolvedDay {
  const { day, dayNo, block, customs, overrides, hidden, order } = input;

  const hiddenKeys = new Set(
    hidden.filter((row) => row.day_no === dayNo).map((row) => row.ex_key),
  );
  const overrideBy = new Map(
    overrides.filter((row) => row.day_no === dayNo).map((row) => [row.ex_key, row]),
  );

  const entries: DayEntry[] = [];
  let hiddenCount = 0;

  for (const item of day?.items ?? []) {
    if (hiddenKeys.has(item.ex)) {
      hiddenCount += 1;
      continue;
    }
    const exercise = EXERCISES[item.ex];
    const override = overrideBy.get(item.ex);
    entries.push({
      key: item.ex,
      kind: 'built',
      name: text(override?.name) ?? exercise?.nPT ?? item.ex,
      equipment: text(override?.equipment) ?? exercise?.eq.pt ?? null,
      prescription: overriddenPrescription(item[block], override),
      note: item.note,
      videoId: text(override?.video_id) ?? VIDEOS[item.ex] ?? null,
      photo: text(override?.photo_url) ?? builtinPoster(item.ex),
      fallbackPhoto: dayPoster(dayNo),
      exercise,
      override,
    });
  }

  const own = customs
    .filter((row) => row.day_no === dayNo)
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  for (const row of own) {
    const key = customKey(row);
    if (hiddenKeys.has(key)) {
      hiddenCount += 1;
      continue;
    }
    entries.push({
      key,
      kind: 'custom',
      name: text(row.name) ?? key,
      equipment: text(row.equipment),
      prescription: customPrescription(row, block),
      // No name matching, ever. A user's own exercise showing a baseline
      // demonstration would be the app claiming a video the user never chose.
      videoId: text(row.video_id),
      photo: text(row.photo_url),
      fallbackPhoto: null,
      custom: row,
    });
  }

  const saved = order.find((row) => row.day_no === dayNo)?.ordered_keys ?? [];
  const position = new Map(saved.map((key, index) => [key, index]));
  const natural = new Map(entries.map((entry, index) => [entry.key, index]));

  entries.sort((a, b) => {
    const pa = position.get(a.key) ?? saved.length + natural.get(a.key)!;
    const pb = position.get(b.key) ?? saved.length + natural.get(b.key)!;
    return pa - pb;
  });

  return { entries, hiddenCount };
}

/* ---------- the hooks the screens use --------------------------------------- */

/**
 * The four tables that shape a day, read once for the whole app.
 *
 * One read each, not one per day and not one per card. All four are bounded by the
 * programme — a few dozen rows between them — and a query per day would be seven
 * subscriptions to lists that are already in memory.
 */
export function useProgrammeState() {
  const customs = useRows('custom_exercises');
  const overrides = useRows('exercise_overrides');
  const hidden = useRows('hidden_items');
  const order = useRows('exercise_order');

  return {
    customs: customs.data,
    overrides: overrides.data,
    hidden: hidden.data,
    order: order.data,
    isPending: customs.isPending || overrides.isPending || hidden.isPending || order.isPending,
    isError: customs.isError || overrides.isError || hidden.isError || order.isError,
  };
}

const EMPTY: never[] = [];

/**
 * A resolver bound to the current block, for one screen's worth of days.
 *
 * Returned as a function rather than a map so the week can ask for its seven days and
 * the day view for one, off the same four reads. It is recomputed rather than cached
 * per day: a day is a handful of entries and one sort, and a memo keyed by day number
 * would be mutable state living across renders to save work that costs nothing.
 */
export function useProgramme(block: BlockKey) {
  const state = useProgrammeState();
  const { customs, overrides, hidden, order } = state;

  const resolve = useMemo(
    () =>
      (day: Day | null, dayNo: number): ResolvedDay =>
        resolveDayEntries({
          day,
          dayNo,
          block,
          customs: customs ?? EMPTY,
          overrides: overrides ?? EMPTY,
          hidden: hidden ?? EMPTY,
          order: order ?? EMPTY,
        }),
    [block, customs, overrides, hidden, order],
  );

  return { ...state, resolve };
}
