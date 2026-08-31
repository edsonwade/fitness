/**
 * The preserved training programme.
 *
 * This content ships inside the bundle, not in the database (plan D4). Two things
 * follow from that, and both are the point:
 *
 *  1. Preservation is structural. There is no row for anyone to edit, delete,
 *     soft-delete or flip, so "remove a preserved exercise for everyone" is not a
 *     permission to get right, it is an operation that does not exist.
 *  2. A cold start with no network still shows every exercise, every line of
 *     technique text and every poster. The gym basement is a working session.
 *
 * User-published exercises and day additions live in Supabase and are merged over
 * this baseline at read time. They never replace it.
 */

import { CARDIO } from './cardio';
import { BLOCKS, prog } from './blocks';
import { DAYS } from './days';
import { EXERCISES } from './exercises';
import { MUSCLES } from './muscles';
import { VIDEOS } from './videos';
import { blockSchema, cardioEntrySchema, daySchema, exerciseSchema } from './schema';

/** What the port is required to contain. Asserted here and in the content test. */
export const CONTENT_INVARIANTS = {
  exercises: 36,
  videos: 38,
  cardio: 2,
  days: 7,
  daySlots: 36,
  blocks: 4,
  muscles: 17,
  distinctPrescribed: 34,
} as const;

export function countDaySlots(): number {
  return DAYS.reduce((total, day) => total + (day.items?.length ?? 0), 0);
}

export function distinctPrescribedKeys(): Set<string> {
  return new Set(DAYS.flatMap((day) => (day.items ?? []).map((item) => item.ex)));
}

/**
 * Validates the ported content against its schemas and its own invariants.
 *
 * Called at import in development and from the content test. Production skips it:
 * the content is frozen at build time, so paying a full Zod parse on every cold
 * start would buy nothing and cost the first paint on a phone.
 */
export function validateContent(): void {
  const problems: string[] = [];

  for (const [key, exercise] of Object.entries(EXERCISES)) {
    const result = exerciseSchema.safeParse(exercise);
    if (!result.success) problems.push(`exercise ${key}: ${result.error.message}`);
    if (!VIDEOS[key]) problems.push(`exercise ${key}: has no video`);
  }

  for (const [key, entry] of Object.entries(CARDIO)) {
    const result = cardioEntrySchema.safeParse(entry);
    if (!result.success) problems.push(`cardio ${key}: ${result.error.message}`);
  }

  for (const day of DAYS) {
    const result = daySchema.safeParse(day);
    if (!result.success) problems.push(`day ${day.id}: ${result.error.message}`);
    for (const item of day.items ?? []) {
      if (!(item.ex in EXERCISES)) {
        problems.push(`day ${day.id}: prescribes unknown exercise "${item.ex}"`);
      }
    }
  }

  for (const block of BLOCKS) {
    const result = blockSchema.safeParse(block);
    if (!result.success) problems.push(`block ${block.k}: ${result.error.message}`);
  }

  const counted: Record<keyof typeof CONTENT_INVARIANTS, number> = {
    exercises: Object.keys(EXERCISES).length,
    videos: Object.keys(VIDEOS).length,
    cardio: Object.keys(CARDIO).length,
    days: DAYS.length,
    daySlots: countDaySlots(),
    blocks: BLOCKS.length,
    muscles: Object.keys(MUSCLES).length,
    distinctPrescribed: distinctPrescribedKeys().size,
  };

  for (const [name, expected] of Object.entries(CONTENT_INVARIANTS)) {
    const actual = counted[name as keyof typeof CONTENT_INVARIANTS];
    if (actual !== expected) problems.push(`${name}: expected ${expected}, found ${actual}`);
  }

  if (problems.length) {
    throw new Error(`Preserved content failed validation:\n  ${problems.join('\n  ')}`);
  }
}

if (import.meta.env?.DEV) validateContent();

export const CONTENT = Object.freeze({
  EXERCISES,
  VIDEOS,
  CARDIO,
  DAYS,
  BLOCKS,
  MUSCLES,
});

export { BLOCKS, CARDIO, DAYS, EXERCISES, MUSCLES, VIDEOS, prog };
export * from './schema';
export type { ExerciseKey } from './exercises';
export type { MuscleKey } from './muscles';
