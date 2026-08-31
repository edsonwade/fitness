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

const nonEmpty = z.string().min(1);

/** A string authored in both languages. Portuguese is the source. */
export const bilingualSchema = z.object({
  pt: nonEmpty,
  en: nonEmpty,
});

/** Prose that exists in both languages, as a single string per locale. */
export const localizedTextSchema = bilingualSchema;

/** A list of lines authored in both languages, kept in step. */
export const localizedLinesSchema = z
  .object({
    pt: z.array(nonEmpty),
    en: z.array(nonEmpty),
  })
  .refine((v) => v.pt.length === v.en.length, {
    message: 'Portuguese and English line counts must match',
  });

/** An error paired with its correction. The pairing is the teaching. */
export const faultSchema = z.object({
  e: nonEmpty,
  c: nonEmpty,
});

export const localizedFaultsSchema = z
  .object({
    pt: z.array(faultSchema),
    en: z.array(faultSchema),
  })
  .refine((v) => v.pt.length === v.en.length, {
    message: 'Portuguese and English fault counts must match',
  });

export const exerciseSchema = z.object({
  nPT: nonEmpty,
  nEN: nonEmpty,
  eq: bilingualSchema,
  anim: nonEmpty,
  pri: z.array(nonEmpty),
  sec: z.array(nonEmpty),
  steps: localizedLinesSchema,
  errs: localizedFaultsSchema,
  safe: localizedLinesSchema,
  breath: localizedTextSchema,
});

export const cardioEntrySchema = z.object({
  nPT: nonEmpty,
  nEN: nonEmpty,
  anim: nonEmpty,
  dur: nonEmpty,
  intens: localizedTextSchema,
  obj: localizedTextSchema,
  tips: localizedLinesSchema,
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
  l: nonEmpty,
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
  note: localizedTextSchema.optional(),
});

export const blockSchema = z.object({
  k: blockKeySchema,
  t: bilingualSchema,
  s: bilingualSchema,
});

export const daySchema = z.object({
  id: z.number().int().min(1).max(7),
  wd: bilingualSchema,
  ic: z.string(),
  theme: nonEmpty,
  name: bilingualSchema,
  short: bilingualSchema,
  eyebrow: bilingualSchema,
  mus: z.object({
    pt: z.array(nonEmpty),
    en: z.array(nonEmpty),
  }),
  type: z.enum(['strength', 'cardio', 'rest']),
  warm: localizedTextSchema.optional(),
  goal: localizedTextSchema.optional(),
  /** Day 6 names the cardio entries it prescribes, keyed into CARDIO. */
  cardio: z.array(nonEmpty).optional(),
  /** The rest day carries no items at all, which is why this is optional. */
  items: z.array(dayItemSchema).optional(),
});

export type Bilingual = z.infer<typeof bilingualSchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type LocalizedLines = z.infer<typeof localizedLinesSchema>;
export type Fault = z.infer<typeof faultSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type CardioEntry = z.infer<typeof cardioEntrySchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type BlockKey = z.infer<typeof blockKeySchema>;
export type SlotPrescriptions = z.infer<typeof slotPrescriptionsSchema>;
export type ProgKind = z.infer<typeof progKindSchema>;
export type DayItem = z.infer<typeof dayItemSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Day = z.infer<typeof daySchema>;
