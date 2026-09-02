import { z } from 'zod';

/**
 * The v1 `user_state.data` blob, as it actually exists in production.
 *
 * This schema is DELIBERATELY PERMISSIVE. It is not a gate on whether a blob is
 * good; it is a description of what shapes are out there, and every one of them
 * belongs to a real person whose training history must survive. `old/js/store.js`
 * `normState()` shows what the old app tolerated: missing keys, wrong types, arrays
 * where objects were expected. It repaired all of that silently on every load, so
 * blobs carrying those faults were never fixed at rest and are still in the table.
 *
 * The rule here is: never reject, always coerce, and record what was coerced. A
 * strict schema would move that data into `migration_errors` instead of into the
 * new tables, which is data loss wearing a validation badge.
 */

/** Anything the old app would have shown in a text field. */
const loose = z.union([z.string(), z.number(), z.boolean()]).nullish();

/** Old ids are `Date.now() * 1000 + seq`, so they arrive as numbers or as strings. */
const legacyId = z.union([z.string(), z.number()]).nullish();

export const v1LogSchema = z
  .object({
    w: loose,
    r: loose,
    note: loose,
    /* Sparse in the wild: the old app writes `arr[i] = true` into a fresh array. */
    done: z.array(z.unknown()).nullish(),
  })
  .loose();

export const v1SessionEntrySchema = z
  .object({
    name: loose,
    alvo: loose,
    w: loose,
    reps: loose,
    done: loose,
    note: loose,
  })
  .loose();

export const v1SessionSchema = z
  .object({
    id: legacyId,
    date: loose,
    dayName: loose,
    block: loose,
    entries: z.array(z.unknown()).nullish(),
  })
  .loose();

export const v1GoalSchema = z
  .object({
    id: legacyId,
    title: loose,
    type: loose,
    unit: loose,
    start: loose,
    target: loose,
    current: loose,
    deadline: loose,
    photo: loose,
    notes: loose,
    createdAt: loose,
    hitAt: loose,
  })
  .loose();

export const v1TrainerSessionSchema = z
  .object({ id: legacyId, date: loose, note: loose })
  .loose();

export const v1TrainerSchema = z
  .object({
    id: legacyId,
    name: loose,
    photo: loose,
    specialty: loose,
    bio: loose,
    phone: loose,
    email: loose,
    instagram: loose,
    availability: loose,
    notes: loose,
    plans: z.array(z.unknown()).nullish(),
    preferredDays: z.array(z.unknown()).nullish(),
    sessions: z.array(z.unknown()).nullish(),
    active: z.boolean().nullish(),
    createdAt: loose,
  })
  .loose();

export const v1ProfileSchema = z
  .object({
    name: loose,
    photo: loose,
    heightCm: loose,
    weightStart: loose,
    weightCurrent: loose,
    weightTarget: loose,
    trainingDays: z.array(z.unknown()).nullish(),
    onboardedAt: loose,
  })
  .loose();

/** A user's own exercise, added to one day. Its id is referenced as `c<id>`. */
export const v1CustomSchema = z
  .object({
    id: legacyId,
    name: loose,
    eq: loose,
    s: loose,
    r: loose,
    l: loose,
    rest: loose,
    vid: loose,
    photo: loose,
  })
  .loose();

/** A per-day edit to one of the baseline exercises. Every field is optional. */
export const v1OverrideSchema = z
  .object({
    name: loose,
    eq: loose,
    s: loose,
    r: loose,
    l: loose,
    rest: loose,
    vid: loose,
    photo: loose,
  })
  .loose();

/**
 * The whole blob. Every key is optional because `normState()` defaulted every one
 * of them, so a blob written before a key existed simply does not carry it.
 */
export const v1BlobSchema = z
  .object({
    ex: z.record(z.string(), z.unknown()).nullish(),
    sessions: z.array(z.unknown()).nullish(),
    custom: z.record(z.string(), z.unknown()).nullish(),
    hidden: z.record(z.string(), z.unknown()).nullish(),
    ovr: z.record(z.string(), z.unknown()).nullish(),
    restNote: loose,
    theme: loose,
    lang: loose,
    profile: z.unknown().nullish(),
    trainers: z.array(z.unknown()).nullish(),
    goals: z.array(z.unknown()).nullish(),
    restSec: z.record(z.string(), z.unknown()).nullish(),
    order: z.record(z.string(), z.unknown()).nullish(),
  })
  .loose();

export type V1Blob = z.infer<typeof v1BlobSchema>;
