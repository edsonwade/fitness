/**
 * Zod schemas for the preserved training content.
 *
 * The content ships in the bundle rather than in the database (plan D4). That is
 * what makes preservation structural instead of a policy: a row that does not exist
 * in Postgres cannot be edited, deleted, soft-deleted or flipped by anyone.
 *
 * These schemas exist so the port validates itself. `index.ts` parses every module
 * against them at load, so a malformed port fails loudly at the first import rather
 * than as a blank card on a gym floor.
 */

import { z } from 'zod';

import { LOCALES } from '../i18n';

const nonEmpty = z.string().min(1);

/**
 * A string authored in all four languages. Portuguese is still the source.
 *
 * This is the shape the whole of `src/content/` is moving to, and the reason is a
 * screen: on 2026-09-22 the app was switched to Spanish and the day names stayed
 * Portuguese. The chrome in `src/i18n/` had four languages; the content had two, and
 * every reader was hard-wired to `.pt` — so even the English that WAS written never
 * reached a screen.
 *
 * There is deliberately no fallback branch anywhere below. `satisfies Copy` already
 * makes a missing key in the chrome a failed build; this does the same for content.
 * A half-translated card is not a state this type can express.
 */
export const localizedSchema = z.object({
  pt: nonEmpty,
  en: nonEmpty,
  es: nonEmpty,
  fr: nonEmpty,
});

/** A list of lines in all four languages, all four the same length. */
export const localizedListSchema = z
  .object({
    pt: z.array(nonEmpty),
    en: z.array(nonEmpty),
    es: z.array(nonEmpty),
    fr: z.array(nonEmpty),
  })
  .refine((v) => LOCALES.every((locale) => v[locale].length === v.pt.length), {
    message: 'every language must have the same number of lines as Portuguese',
  });

/** An error paired with its correction. The pairing is the teaching. */
export const faultSchema = z.object({
  e: nonEmpty,
  c: nonEmpty,
});

/** Errors and their corrections, in all four languages, all four the same length. */
export const localizedFaultsSchema = z
  .object({
    pt: z.array(faultSchema),
    en: z.array(faultSchema),
    es: z.array(faultSchema),
    fr: z.array(faultSchema),
  })
  .refine((v) => LOCALES.every((locale) => v[locale].length === v.pt.length), {
    message: 'every language must have the same number of faults as Portuguese',
  });

/**
 * One exercise: what it is called, what it needs, and how it is done.
 *
 * `n` was `nPT` + `nEN` until 2026-09-22. Two fields cannot hold four languages, and
 * the pair was also the reason nobody noticed the hole: a reader had to name one of
 * them, every reader named `nPT`, and so the English that WAS written never reached a
 * screen in four years of the app having an English toggle.
 */
export const exerciseSchema = z.object({
  n: localizedSchema,
  eq: localizedSchema,
  anim: nonEmpty,
  pri: z.array(nonEmpty),
  sec: z.array(nonEmpty),
  steps: localizedListSchema,
  errs: localizedFaultsSchema,
  safe: localizedListSchema,
  breath: localizedSchema,
});

export const cardioEntrySchema = z.object({
  n: localizedSchema,
  anim: nonEmpty,
  dur: nonEmpty,
  intens: localizedSchema,
  obj: localizedSchema,
  tips: localizedListSchema,
});

/**
 * Weight and reps are text, not numbers, everywhere in this product. The real
 * inputs accept `60`, `12,5` and `10/hand`, and that is a product decision rather
 * than a validation gap. Coercing these to numeric would silently destroy a
 * per-hand dumbbell load.
 */
export const prescriptionSchema = z.object({
  s: z.number().int().positive(),
  r: nonEmpty,
  rpe: nonEmpty,
  /**
   * The load, in all four languages.
   *
   * The numbers in a prescription are training data and are not copy — 4 sets is 4
   * sets in Paris. The load is the one field that carries words next to the number:
   * `10 kg/mão cal`, `— preencher`, and the `base + carga` / `pesada` / `carga B2`
   * that `prog()` generates. Those were Portuguese on every screen in every language,
   * which is the same bug the day names had, one column to the right.
   *
   * A load somebody typed themselves is their words and is never translated; it is
   * repeated into the four branches by `asTyped()` in `day-entries.ts`, which says so.
   */
  l: localizedSchema,
  rest: nonEmpty,
});

export const blockKeySchema = z.enum(['b1', 'b2', 'b3', 'dl']);

export const slotPrescriptionsSchema = z.object({
  b1: prescriptionSchema,
  b2: prescriptionSchema,
  b3: prescriptionSchema,
  dl: prescriptionSchema,
});

export const progKindSchema = z.enum(['comp', 'acc', 'iso', 'core']);

export const dayItemSchema = slotPrescriptionsSchema.extend({
  ex: nonEmpty,
  note: localizedSchema.optional(),
});

export const blockSchema = z.object({
  k: blockKeySchema,
  t: localizedSchema,
  s: localizedSchema,
});

export const daySchema = z.object({
  id: z.number().int().min(1).max(7),
  wd: localizedSchema,
  ic: z.string(),
  theme: nonEmpty,
  name: localizedSchema,
  short: localizedSchema,
  eyebrow: localizedSchema,
  mus: localizedListSchema,
  type: z.enum(['strength', 'cardio', 'rest']),
  warm: localizedSchema.optional(),
  goal: localizedSchema.optional(),
  /** Day 6 names the cardio entries it prescribes, keyed into CARDIO. */
  cardio: z.array(nonEmpty).optional(),
  /** The rest day carries no items at all, which is why this is optional. */
  items: z.array(dayItemSchema).optional(),
});

/** A string in the four languages. `value[locale]`, and nothing to fall back to. */
export type Localized = z.infer<typeof localizedSchema>;
export type LocalizedList = z.infer<typeof localizedListSchema>;
export type LocalizedFaults = z.infer<typeof localizedFaultsSchema>;

export type Fault = z.infer<typeof faultSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type CardioEntry = z.infer<typeof cardioEntrySchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
/**
 * A prescription whose load has been chosen for one language, which is what a screen
 * draws. `resolveDayEntries` is the only place that turns the first into the second,
 * for the same reason it is the only place that merges the five tables: one answer.
 */
export type ResolvedPrescription = Omit<Prescription, 'l'> & { l: string };
export type BlockKey = z.infer<typeof blockKeySchema>;
export type SlotPrescriptions = z.infer<typeof slotPrescriptionsSchema>;
export type ProgKind = z.infer<typeof progKindSchema>;
export type DayItem = z.infer<typeof dayItemSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Day = z.infer<typeof daySchema>;
