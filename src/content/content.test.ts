/**
 * The preservation test (plan sections 7 and 12).
 *
 * D2 preserves the exercises and the videos; D3 preserves the photographs. This
 * file is what makes those promises checkable rather than stated. It asserts the
 * ported counts, then diffs the ported content field by field against the original
 * `old/js/data.js`, because a count can pass while a line of technique text has
 * silently changed.
 *
 * The diff half of this file stops being runnable when `old/` is deleted at cutover
 * (plan M4), which is the correct lifetime for it: it exists to prove the port, and
 * the port happens once. The count and schema assertions outlive it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  BLOCKS,
  CARDIO,
  CONTENT_INVARIANTS,
  DAYS,
  EXERCISES,
  MUSCLES,
  VIDEOS,
  countDaySlots,
  distinctPrescribedKeys,
  validateContent,
} from './index';

const OLD_DATA = join(process.cwd(), 'old', 'js', 'data.js');

/** Loads the original module, or null once `old/` has been removed at cutover. */
function loadOriginal(): Record<string, never> | null {
  if (!existsSync(OLD_DATA)) return null;
  const source = readFileSync(OLD_DATA, 'utf8');
  const names = ['EX', 'VIDEOS', 'CARDIO', 'DAYS', 'BLOCKS', 'MUSNAME', 'MUSNAME_EN'];
  return new Function(`${source}\nreturn {${names.join(',')}};`)();
}

describe('preserved content', () => {
  it('passes its own schema and invariant validation', () => {
    expect(() => validateContent()).not.toThrow();
  });

  it('holds exactly the counts the plan preserves', () => {
    expect(Object.keys(EXERCISES)).toHaveLength(CONTENT_INVARIANTS.exercises);
    expect(Object.keys(VIDEOS)).toHaveLength(CONTENT_INVARIANTS.videos);
    expect(Object.keys(CARDIO)).toHaveLength(CONTENT_INVARIANTS.cardio);
    expect(DAYS).toHaveLength(CONTENT_INVARIANTS.days);
    expect(countDaySlots()).toBe(CONTENT_INVARIANTS.daySlots);
    expect(BLOCKS).toHaveLength(CONTENT_INVARIANTS.blocks);
    expect(Object.keys(MUSCLES)).toHaveLength(CONTENT_INVARIANTS.muscles);
  });

  it('gives every exercise a video', () => {
    const missing = Object.keys(EXERCISES).filter((key) => !VIDEOS[key]);
    expect(missing).toEqual([]);
  });

  it('prescribes 34 distinct exercises and keeps the two documented swap alternatives', () => {
    const prescribed = distinctPrescribedKeys();
    expect(prescribed.size).toBe(CONTENT_INVARIANTS.distinctPrescribed);

    // legcurl_l and birddog are defined with videos and technique text but appear on
    // no day. They are referenced as swap alternatives inside other exercises' notes,
    // so they are preserved rather than pruned as dead content.
    const unprescribed = Object.keys(EXERCISES).filter((key) => !prescribed.has(key));
    expect(unprescribed.sort()).toEqual(['birddog', 'legcurl_l']);
  });

  it('never prescribes an exercise it does not define', () => {
    const unknown = DAYS.flatMap((day) =>
      (day.items ?? []).map((item) => item.ex).filter((key) => !(key in EXERCISES)),
    );
    expect(unknown).toEqual([]);
  });

  it('keeps the rest day empty and day 4 at eight slots', () => {
    expect(DAYS.map((day) => day.items?.length ?? 0)).toEqual([6, 6, 6, 8, 6, 4, 0]);
    expect(DAYS[6].type).toBe('rest');
    expect(DAYS[6].items).toBeUndefined();
  });

  it('keeps weight, reps and RPE as text, never coerced to numbers', () => {
    // "10/lado" and "—" are real values in this programme. A numeric field would
    // have destroyed both, which is why the schema types them as strings.
    const perSide = DAYS.flatMap((day) => day.items ?? []).filter((item) =>
      item.b1.r.includes('/'),
    );
    expect(perSide.length).toBeGreaterThan(0);
    for (const item of DAYS.flatMap((day) => day.items ?? [])) {
      expect(typeof item.b1.r).toBe('string');
      expect(typeof item.b1.l).toBe('string');
      expect(typeof item.b1.rpe).toBe('string');
    }
  });

  it('caps RPE on the Romanian deadlift even in the heavy block', () => {
    // Product truth, not a generated progression: the note reads "BACK CAUTION:
    // RPE 8 max even in the heavy block." prog() would have written 8-9 here.
    const dbrdl = DAYS.flatMap((day) => day.items ?? []).find((item) => item.ex === 'dbrdl');
    expect(dbrdl?.b3.rpe).toBe('7-8');
    expect(dbrdl?.note?.en).toContain('RPE 8 max');
  });
});

describe('port fidelity against old/js/data.js', () => {
  const original = loadOriginal();

  it.skipIf(!original)('carries every exercise field verbatim', () => {
    const { EX } = original as never as { EX: Record<string, unknown> };
    expect(Object.keys(EXERCISES).sort()).toEqual(Object.keys(EX).sort());
    for (const key of Object.keys(EX)) {
      expect(EXERCISES[key], `exercise ${key} diverged from the source`).toEqual(EX[key]);
    }
  });

  it.skipIf(!original)('carries videos, cardio, blocks and muscles verbatim', () => {
    const src = original as never as {
      VIDEOS: Record<string, string>;
      CARDIO: Record<string, unknown>;
      BLOCKS: unknown[];
      MUSNAME: Record<string, string>;
      MUSNAME_EN: Record<string, string>;
    };
    expect(VIDEOS).toEqual(src.VIDEOS);
    expect(CARDIO).toEqual(src.CARDIO);
    expect(BLOCKS).toEqual(src.BLOCKS);
    for (const key of Object.keys(src.MUSNAME)) {
      expect(MUSCLES[key]).toEqual({ pt: src.MUSNAME[key], en: src.MUSNAME_EN[key] });
    }
  });

  it.skipIf(!original)('re-expands every day slot to the exact source prescription', () => {
    const { DAYS: srcDays } = original as never as { DAYS: { id: number; items?: unknown[] }[] };
    expect(DAYS.map((d) => d.id)).toEqual(srcDays.map((d) => d.id));
    for (const [index, day] of DAYS.entries()) {
      expect(day, `day ${day.id} diverged from the source`).toEqual(srcDays[index]);
    }
  });
});
