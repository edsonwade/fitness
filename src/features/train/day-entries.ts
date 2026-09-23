import { useMemo } from 'react';

import {
  EXERCISES,
  prog,
  type BlockKey,
  type Day,
  type Exercise,
  type Localized,
  type Prescription,
  type ProgKind,
  type ResolvedPrescription,
} from '../../content';
import type {
  CatalogExercise,
  CustomExercise,
  DayAddition,
  ExerciseOrder,
  ExerciseOverride,
  HiddenItem,
} from '../../data/entities';
import { useRows } from '../../data/queries';
import type { Locale } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { clipFor, uploadedClip, type Clip } from './clips';
import {
  EQUIP_NAMES,
  chosenVariant,
  equipIdOf,
  variantExercise,
  variantLogKey,
  variantsOf,
  type EquipId,
} from './variants';

/**
 * What a day is actually made of, once people have had their say.
 *
 * The bundled programme is the baseline and nothing writes to it. On top of it sit five
 * tables, every one of them shared since `009`, and this module is the one place that
 * knows how they combine:
 *
 *  - `custom_exercises` adds an exercise to this day,
 *  - `catalog_exercises` + `day_additions` put a catalogue exercise on this day,
 *  - `exercise_overrides` changes the prescription of a baseline one,
 *  - `hidden_items` takes one out of the day,
 *  - `exercise_order` decides the sequence of what is left.
 *
 * Nothing here is filtered by who wrote it, and that is the point rather than an
 * oversight: the week is one week, so the answer this returns is the same answer on
 * every account. What differs between two accounts is what they logged against it,
 * which is a different table and is not read here.
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
  /** The key everything else is stored against: hiding, ordering, rest, overrides. */
  key: string;
  /**
   * The key the logged sets live under. The exercise's own key, except on a changed
   * equipment variant (`<key>@<equip>`): the barbell's sets are not the dumbbells' —
   * bug B3 of `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`. Absent means
   * `key`; read it through `entryLogKey`.
   */
  logKey?: string;
  /** The equipment variant on now, for a baseline exercise that has variants. */
  equip?: EquipId;
  kind: 'built' | 'custom' | 'shared';
  name: string;
  equipment: string | null;
  /** This block's target, after any override, with its load in the chosen language. */
  prescription: ResolvedPrescription;
  /** The authored aside under the name, already in the chosen language. */
  note?: string;
  /**
   * The local demonstration clip, or null — and null means the photo, with no play
   * button and no Vídeo chip. Baseline exercises only: a clip is ours, and a user's own
   * exercise showing one would be the app claiming a video the user never chose.
   */
  clip: Clip | null;
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
  /** The two rows behind a published exercise: what it is, and that it is on this day. */
  shared?: { catalog: CatalogExercise; addition: DayAddition };
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
 * One string, repeated into all four languages.
 *
 * Not a translation and not a fallback: this is for text a **person** typed. Somebody
 * who wrote "12 kg por mão" wrote it in their words, and an app that rewrote it in
 * French would be inventing what they meant. Repeating it is the honest shape, and
 * naming the function is what stops it being mistaken for `?? pt` creeping back in.
 */
export function asTyped(value: string): Localized {
  return { pt: value, en: value, es: value, fr: value };
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
export function customPrescription(
  row: CustomExercise,
  block: BlockKey,
  locale: Locale,
): ResolvedPrescription {
  return derivePrescription(row, row.kind, block, locale);
}

/** The four numbers an authored or published exercise is written with. */
type Numbers = {
  sets: string | null;
  reps: string | null;
  load: string | null;
  rest: string | null;
};

/**
 * One set of figures plus a movement type, through `prog()`, for one block.
 *
 * Shared by a user's own exercise and by a published one, because they are written
 * with the same four fields and must periodize the same way. A published exercise
 * that behaved differently from a private one with identical numbers would be a
 * second prescription model nobody asked for.
 */
export function derivePrescription(
  numbers: Numbers,
  kindValue: string | null | undefined,
  block: BlockKey,
  locale: Locale,
): ResolvedPrescription {
  const kind: ProgKind = isProgKind(String(kindValue ?? '')) ? (kindValue as ProgKind) : 'acc';
  /*
   * The block 1 load is what the person typed, so it goes in as `same()` and comes
   * out unchanged in whatever language they are reading. The other three blocks are
   * written by `prog()` itself — "base + carga", "pesada", "carga B2" — and those are
   * the app's words, so those do translate.
   */
  const slots = prog(
    setCount(numbers.sets, 3),
    asTyped(text(numbers.load) ?? '—'),
    text(numbers.rest) ?? '90 s',
    kind,
  );
  const base = slots[block];
  const reps = text(numbers.reps);
  return { ...base, l: base.l[locale], ...(reps ? { r: reps } : {}) };
}

/*
 * `day_additions.block_config` is deliberately left empty.
 *
 * Everything about a published exercise, the numbers and the movement type
 * included, lives on its catalog row, so a day addition says one thing only: this
 * exercise belongs on this day. Splitting the prescription across the two would give
 * the same exercise different targets on different days, which is the opposite of
 * the rule this feature is built to keep.
 */

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
  locale: Locale,
): ResolvedPrescription {
  /*
   * The authored load carries four languages and the overriding one carries none: a
   * load somebody typed into the edit sheet is their words, so it is shown back to
   * them exactly as written, in every language. The choice of language only reaches
   * the authored side.
   */
  if (!override) return { ...base, l: base.l[locale] };
  return {
    s: setCount(override.sets, base.s),
    r: text(override.reps) ?? base.r,
    rpe: base.rpe,
    l: text(override.load) ?? base.l[locale],
    rest: text(override.rest) ?? base.rest,
  };
}

/** The bundled poster for a baseline exercise, by the convention `public/img/` uses. */
/** The key an entry's sets are logged under — see `DayEntry.logKey`. */
export function entryLogKey(entry: Pick<DayEntry, 'key' | 'logKey'>): string {
  return entry.logKey ?? entry.key;
}

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
  /**
   * The language the answer comes back in.
   *
   * An argument and not a `useT()` call, because this function is pure and is tested
   * directly. It is also why there is no default: a default would be a language
   * nobody chose, quietly winning on a screen, which is the whole shape of the bug
   * this was written to close.
   */
  locale: Locale;
  customs: readonly CustomExercise[];
  overrides: readonly ExerciseOverride[];
  hidden: readonly HiddenItem[];
  order: readonly ExerciseOrder[];
  /** Everything anyone has published. Read by every account, identically. */
  catalog?: readonly CatalogExercise[];
  /**
   * Which of those are prescribed on which day.
   *
   * Every one of them is everybody's, because every day is: `009` made the day number
   * unique across the database, so matching on `dayNo` alone below is enough. It was
   * not before, when 101 named a different day in each account, and `008` had to give
   * those rows an owner to tell them apart.
   */
  additions?: readonly DayAddition[];
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
  const { day, dayNo, block, locale, customs, overrides, hidden, order } = input;
  const catalog = input.catalog ?? [];
  const additions = input.additions ?? [];

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
    /*
     * The equipment variant (B2 and B4): another name, another clip, another photo and
     * other sets. A variant with no clip of its own shows none — never another
     * exercise's video.
     */
    const variants = variantsOf(item.ex);
    const variant = chosenVariant(item.ex, override?.equipment);
    const vex = variantExercise(variant);
    const knownEquip = equipIdOf(override?.equipment) !== null;
    entries.push({
      key: item.ex,
      logKey: variantLogKey(item.ex, variant),
      equip: variants.length > 0 ? (variant?.equip ?? variants[0].equip) : undefined,
      kind: 'built',
      /*
       * A name somebody typed over the authored one wins, in every language: it is
       * their word for this exercise and is not ours to translate. Under it, the
       * authored name in the language being read. The key is the last resort and
       * means the content and the day disagree, which a test would have caught.
       */
      name:
        text(override?.name) ??
        (variant ? (vex?.n[locale] ?? variant.name?.[locale]) : undefined) ??
        exercise?.n[locale] ??
        item.ex,
      equipment: variant
        ? (vex?.eq[locale] ?? EQUIP_NAMES[variant.equip][locale])
        : ((knownEquip ? null : text(override?.equipment)) ?? exercise?.eq[locale] ?? null),
      prescription: overriddenPrescription(item[block], override, locale),
      note: item.note?.[locale],
      // A video someone put on this exercise wins over the bundled one: it is the
      // demonstration they chose, and the sheet is where they chose it.
      clip: variant
        ? variant.ex
          ? clipFor(variant.ex)
          : null
        : (uploadedClip(override?.video_id, text(override?.photo_url)) ?? clipFor(item.ex)),
      photo: variant
        ? variant.ex
          ? builtinPoster(variant.ex)
          : null
        : (text(override?.photo_url) ?? builtinPoster(item.ex)),
      fallbackPhoto: variant ? null : dayPoster(dayNo),
      exercise: variant ? vex : exercise,
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
      prescription: customPrescription(row, block, locale),
      // No name matching, ever. A user's own exercise showing a baseline
      // demonstration would be the app claiming a video the user never chose; the
      // only clip it has is the one they uploaded.
      clip: uploadedClip(row.video_id, text(row.photo_url)),
      photo: text(row.photo_url),
      fallbackPhoto: null,
      custom: row,
    });
  }

  /*
   * What everyone else added to this day.
   *
   * The catalog row is the exercise and the addition is the fact that it belongs
   * here, so an addition whose catalog row is missing draws nothing at all: that
   * pairing is broken data, and inventing a card named after a key would be the app
   * making up an exercise. Soft-deleted rows never reach here, because `fetchRows`
   * filters `deleted = false` for everyone before they are cached.
   */
  const byKey = new Map(catalog.map((row) => [row.ex_key, row]));
  /*
   * `user_id` is not tested here, and since `009` there is nothing to test: it is null
   * on every addition, because no day belongs to one account. The day number is the
   * whole of the match, and the database is what keeps that true — `check (user_id is
   * null)`, `009` §5 — rather than a rule this file would have to remember.
   */
  const shared = additions
    .filter((row) => row.day_no === dayNo && byKey.has(row.ex_key))
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  for (const addition of shared) {
    if (hiddenKeys.has(addition.ex_key)) {
      hiddenCount += 1;
      continue;
    }
    const row = byKey.get(addition.ex_key)!;
    entries.push({
      key: addition.ex_key,
      kind: 'shared',
      name: text(row.name_pt) ?? addition.ex_key,
      equipment: text(row.equipment),
      prescription: derivePrescription(row, row.kind, block, locale),
      clip: uploadedClip(row.video_id, text(row.photo_url)),
      photo: text(row.photo_url),
      fallbackPhoto: null,
      shared: { catalog: row, addition },
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
 * The six tables that shape a day, read once for the whole app.
 *
 * One read each, not one per day and not one per card. All six are bounded by the
 * programme — a few dozen rows between them — and a query per day would be seven
 * subscriptions to lists that are already in memory.
 */
export function useProgrammeState() {
  const customs = useRows('custom_exercises');
  const overrides = useRows('exercise_overrides');
  const hidden = useRows('hidden_items');
  const order = useRows('exercise_order');
  const catalog = useRows('catalog_exercises');
  const additions = useRows('day_additions');

  return {
    customs: customs.data,
    overrides: overrides.data,
    hidden: hidden.data,
    order: order.data,
    catalog: catalog.data,
    additions: additions.data,
    isPending:
      customs.isPending ||
      overrides.isPending ||
      hidden.isPending ||
      order.isPending ||
      catalog.isPending ||
      additions.isPending,
    isError:
      customs.isError ||
      overrides.isError ||
      hidden.isError ||
      order.isError ||
      catalog.isError ||
      additions.isError,
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
 *
 * `resolveIn` is the same answer for a block that is not the selected one, which the
 * block rail needs: it prints what each of the four phases costs on this day, and a
 * resolver that only knew the current block could not tell it. It is the general
 * function and `resolve` is it with the screen's block already applied, so there is
 * still one merge rule and not two.
 */
export function useProgramme(block: BlockKey) {
  const { locale } = useLocale();
  const state = useProgrammeState();
  const { customs, overrides, hidden, order, catalog, additions } = state;

  const resolveIn = useMemo(
    () =>
      (blockKey: BlockKey, day: Day | null, dayNo: number): ResolvedDay =>
        resolveDayEntries({
          day,
          dayNo,
          block: blockKey,
          locale,
          customs: customs ?? EMPTY,
          overrides: overrides ?? EMPTY,
          hidden: hidden ?? EMPTY,
          order: order ?? EMPTY,
          catalog: catalog ?? EMPTY,
          additions: additions ?? EMPTY,
        }),
    [locale, customs, overrides, hidden, order, catalog, additions],
  );

  const resolve = useMemo(
    () => (day: Day | null, dayNo: number): ResolvedDay => resolveIn(block, day, dayNo),
    [resolveIn, block],
  );

  return { ...state, resolve, resolveIn };
}
