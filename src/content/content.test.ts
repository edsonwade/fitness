/**
 * The content test: schema, invariants and counts.
 *
 * This file used to carry a second half — `describe('port fidelity against
 * old/js/data.js')` — that loaded `old/js/data.js` at test time and asserted that
 * every exercise, video and day slot still matched it field for field. That half
 * was removed on 2026-09-21.
 *
 * Why: the app is new and `old/` is not the source of anything. The folder stays on
 * disk, but nothing reads it ("deixa a pasta aí e para de olhar nesta pasta"). A test
 * that pins the new content to the old file makes the old app the specification,
 * which is the opposite of the rule — see `.claude/memory/app-nova-old-nao-e-fonte`
 * and the *App nova* section of `CLAUDE.md`. What the app prescribes now comes from
 * the approved prototype in `proto/v2/`, so that is what a divergence must be checked
 * against, by eye, frame by frame.
 *
 * What stays here outlives the port and does not look at `old/`: the schema check,
 * the invariants, the counts, and the handful of product truths that a generated
 * progression would have got wrong.
 */

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

    // Exercises defined with videos and technique text that appear on no day. Two of
    // them (birddog, legcurl_l) were already here: they are named as swap alternatives
    // inside other exercises' notes. The other nine dropped out of the weekly plan on
    // 2026-09-21, when the shared week went from five training days to four plus the
    // Full Body. They stay in the catalogue and stay addable to any day; what they lost
    // is a prescribed slot — and with it the per-slot note some of them carried.
    const unprescribed = Object.keys(EXERCISES).filter((key) => !prescribed.has(key));
    expect(unprescribed.sort()).toEqual([
      'birddog',
      'cablecrunch',
      'dbrdl',
      'dip',
      'facepull',
      'kickback',
      'legcurl_l',
      'legpress_h',
      'legraise',
      'pallof',
      'plank',
    ]);
  });

  it('never prescribes an exercise it does not define', () => {
    const unknown = DAYS.flatMap((day) =>
      (day.items ?? []).map((item) => item.ex).filter((key) => !(key in EXERCISES)),
    );
    expect(unknown).toEqual([]);
  });

  it('keeps both rest days empty and the Full Body at eighteen slots', () => {
    // The shared week of 2026-09-21. Thursday joined Sunday as a rest day, and
    // Saturday became the Full Body, which is why the shape is so lopsided.
    expect(DAYS.map((day) => day.items?.length ?? 0)).toEqual([6, 6, 6, 0, 6, 18, 0]);
    for (const rest of [DAYS[3], DAYS[6]]) {
      expect(rest.type).toBe('rest');
      expect(rest.items).toBeUndefined();
    }
  });

  it('gives the Full Body six groups of three and sixty sets', () => {
    // His order, in two sentences of his own: "peito + costa + bíceps + shoulder +
    // triceps + legs, é combinação de todos" and "full body é 3 exercícios por grupo".
    // The sets are counted off the prescriptions rather than restated, so a changed
    // prescription cannot leave this number quietly wrong.
    const full = DAYS[5];
    expect(full.name.pt).toBe('Full Body');
    expect(full.items).toHaveLength(18);
    const sets = (full.items ?? []).reduce((total, item) => total + item.b1.s, 0);
    expect(sets).toBe(60);
  });

  it('keeps weight, reps and RPE as text, never coerced to numbers', () => {
    // "— preencher" is a real load in this programme: a lift whose working weight has
    // not been set yet. A numeric field would have destroyed it, which is why the
    // schema types these as strings. (The per-side rep count "10/lado" used to be the
    // example here; it belonged to the Pallof press, which the week of 2026-09-21
    // dropped from the plan.)
    const unset = DAYS.flatMap((day) => day.items ?? []).filter(
      (item) => item.b1.l === '— preencher',
    );
    expect(unset.length).toBeGreaterThan(0);
    for (const item of DAYS.flatMap((day) => day.items ?? [])) {
      expect(typeof item.b1.r).toBe('string');
      expect(typeof item.b1.l).toBe('string');
      expect(typeof item.b1.rpe).toBe('string');
    }
  });

  it('keeps the authored per-slot notes that a generator would not have written', () => {
    // This used to assert the Romanian deadlift's back caution — "RPE 8 max even in
    // the heavy block", where prog() would have written 8-9. That slot is gone: the
    // week of 2026-09-21 dropped dbrdl from the plan, and its prescription went with
    // it. The exercise and its technique text stay in the catalogue; the cap does not.
    // Worth saying out loud rather than deleting the test in silence.
    const noted = DAYS.flatMap((day) => day.items ?? []).filter((item) => item.note);
    // cablecurl carries its note twice: it is prescribed on Friday and again inside
    // Saturday's Full Body, and the note travels with the slot.
    expect([...new Set(noted.map((item) => item.ex))].sort()).toEqual([
      'cablecurl',
      'hack',
      'ohext',
    ]);
    for (const item of noted) {
      expect(item.note?.pt.length).toBeGreaterThan(0);
      expect(item.note?.en.length).toBeGreaterThan(0);
    }
  });
});
