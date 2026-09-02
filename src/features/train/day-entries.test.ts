import { describe, expect, it } from 'vitest';

import { DAYS, EXERCISES } from '../../content';
import type {
  CustomExercise,
  ExerciseLog,
  ExerciseOrder,
  ExerciseOverride,
  HiddenItem,
} from '../../data/entities';
import { customKey, resolveDayEntries } from './day-entries';
import { dayProgress, logId } from './logs';

/**
 * The day the user actually has.
 *
 * These are the rules that used to live in a screen, where they could only be checked
 * by opening the app and counting: which exercises are in a day, in what order, with
 * whose numbers. The reason they are tested here rather than through a render is that
 * three surfaces read them — the card, the day's progress bar and the week's rings —
 * and a disagreement between those three is exactly the bug this resolver exists to
 * make impossible.
 */

const DAY = DAYS.find((d) => d.id === 1)!;
const USER = '00000000-0000-4000-8000-000000000001';

function custom(over: Partial<CustomExercise> = {}): CustomExercise {
  return {
    user_id: USER,
    updated_at: '2026-01-01T00:00:00Z',
    id: '11111111-1111-4111-8111-111111111111',
    day_no: 1,
    legacy_key: null,
    kind: 'acc',
    name: 'Remada baixa',
    equipment: 'Máquina',
    sets: '3',
    reps: null,
    load: '40 kg',
    rest: '90 s',
    video_id: null,
    photo_url: null,
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function override(over: Partial<ExerciseOverride> = {}): ExerciseOverride {
  return {
    user_id: USER,
    updated_at: '2026-01-01T00:00:00Z',
    day_no: 1,
    ex_key: 'legpress',
    name: null,
    equipment: null,
    sets: null,
    reps: null,
    load: null,
    rest: null,
    video_id: null,
    photo_url: null,
    ...over,
  };
}

function hidden(exKey: string, dayNo = 1): HiddenItem {
  return { user_id: USER, updated_at: '2026-01-01T00:00:00Z', day_no: dayNo, ex_key: exKey };
}

function order(keys: string[], dayNo = 1): ExerciseOrder {
  return {
    user_id: USER,
    updated_at: '2026-01-01T00:00:00Z',
    day_no: dayNo,
    ordered_keys: keys,
  };
}

function resolve(input: Partial<Parameters<typeof resolveDayEntries>[0]> = {}) {
  return resolveDayEntries({
    day: DAY,
    dayNo: 1,
    block: 'b1',
    customs: [],
    overrides: [],
    hidden: [],
    order: [],
    ...input,
  });
}

describe('customKey', () => {
  it('keeps the key a migrated exercise already has', () => {
    // The v1 mapper wrote `c<id>` into `legacy_key`, and that string is what the logs,
    // the personal order and the rest preference of that exercise all point at.
    expect(customKey({ id: 'ignored', legacy_key: 'c12' })).toBe('c12');
  });

  it('cannot collide with any exercise in the programme', () => {
    const shapes = [customKey({ id: 'abc', legacy_key: null }), 'c12'];
    for (const key of shapes) {
      expect(key in EXERCISES).toBe(false);
    }
    // And the reverse: nothing in the bundle is shaped like a custom key.
    for (const key of Object.keys(EXERCISES)) {
      expect(/^c(:|\d)/.test(key)).toBe(false);
    }
  });
});

describe('resolveDayEntries', () => {
  it('gives the authored day back untouched when the user has changed nothing', () => {
    const { entries, hiddenCount } = resolve();
    expect(entries.map((e) => e.key)).toEqual(DAY.items!.map((i) => i.ex));
    expect(hiddenCount).toBe(0);
    expect(entries[0].prescription).toEqual(DAY.items![0].b1);
    expect(entries[0].exercise).toBe(EXERCISES.legpress);
  });

  it('takes hidden exercises out and reports how many', () => {
    const { entries, hiddenCount } = resolve({ hidden: [hidden('legpress'), hidden('plank')] });
    expect(entries.map((e) => e.key)).not.toContain('legpress');
    expect(hiddenCount).toBe(2);
  });

  it('ignores a hidden row belonging to another day', () => {
    const { entries, hiddenCount } = resolve({ hidden: [hidden('legpress', 2)] });
    expect(entries.map((e) => e.key)).toContain('legpress');
    expect(hiddenCount).toBe(0);
  });

  it('applies an override field by field and leaves the rest of the prescription alone', () => {
    const base = DAY.items![0].b1;
    const { entries } = resolve({ overrides: [override({ sets: '5', load: '80 kg' })] });
    const entry = entries.find((e) => e.key === 'legpress')!;

    expect(entry.prescription.s).toBe(5);
    expect(entry.prescription.l).toBe('80 kg');
    // Untouched fields keep the programme's values, including RPE, which the form
    // deliberately does not offer.
    expect(entry.prescription.r).toBe(base.r);
    expect(entry.prescription.rpe).toBe(base.rpe);
    expect(entry.prescription.rest).toBe(base.rest);
    expect(entry.override).toBeDefined();
  });

  it('renames a baseline exercise without losing its technique text', () => {
    const { entries } = resolve({ overrides: [override({ name: 'Leg press meu' })] });
    const entry = entries.find((e) => e.key === 'legpress')!;
    expect(entry.name).toBe('Leg press meu');
    expect(entry.exercise).toBe(EXERCISES.legpress);
  });

  it('refuses a blank override field rather than blanking the card', () => {
    const { entries } = resolve({ overrides: [override({ name: '   ', sets: '' })] });
    const entry = entries.find((e) => e.key === 'legpress')!;
    expect(entry.name).toBe(EXERCISES.legpress.nPT);
    expect(entry.prescription.s).toBe(DAY.items![0].b1.s);
  });

  it("adds the user's own exercises at the end of the day", () => {
    const row = custom();
    const { entries } = resolve({ customs: [row] });
    expect(entries).toHaveLength(DAY.items!.length + 1);
    expect(entries.at(-1)!.key).toBe(customKey(row));
    expect(entries.at(-1)!.kind).toBe('custom');
  });

  it('never gives a custom exercise a baseline video or photo', () => {
    const { entries } = resolve({ customs: [custom({ name: 'Leg Press 45°' })] });
    const entry = entries.at(-1)!;
    expect(entry.videoId).toBeNull();
    expect(entry.photo).toBeNull();
    expect(entry.exercise).toBeUndefined();
  });

  it('periodizes a custom exercise across the blocks', () => {
    const row = custom({ sets: '3', kind: 'comp' });
    const b1 = resolve({ customs: [row], block: 'b1' }).entries.at(-1)!;
    const b3 = resolve({ customs: [row], block: 'b3' }).entries.at(-1)!;
    const dl = resolve({ customs: [row], block: 'dl' }).entries.at(-1)!;

    // `prog()` gives a compound an extra set in block 3 and takes one off at deload,
    // which is the whole reason the movement type is asked for.
    expect(b1.prescription.s).toBe(3);
    expect(b3.prescription.s).toBe(4);
    expect(dl.prescription.s).toBe(2);
    expect(b1.prescription.r).not.toBe(b3.prescription.r);
  });

  it("lets the user's own reps win in every block", () => {
    const row = custom({ reps: '8/lado' });
    for (const block of ['b1', 'b2', 'b3', 'dl'] as const) {
      const entry = resolve({ customs: [row], block }).entries.at(-1)!;
      expect(entry.prescription.r).toBe('8/lado');
    }
  });

  it('falls back rather than rendering nothing when the numbers are unusable', () => {
    const entry = resolve({ customs: [custom({ sets: 'três', kind: 'nonsense' })] }).entries.at(-1)!;
    expect(entry.prescription.s).toBe(3);
    expect(entry.prescription.rpe).toBeTruthy();
  });

  it('applies the personal order across baseline and own exercises alike', () => {
    const row = custom();
    const key = customKey(row);
    const { entries } = resolve({
      customs: [row],
      order: [order([key, 'plank', 'legpress'])],
    });
    expect(entries.slice(0, 3).map((e) => e.key)).toEqual([key, 'plank', 'legpress']);
  });

  it('puts a key with no saved position at the end, in natural order', () => {
    // The case this rule exists for: an exercise added after the order was last saved
    // must appear at the bottom of the day rather than disappear from it.
    const row = custom();
    const { entries } = resolve({
      customs: [row],
      order: [order(['plank', 'legpress'])],
    });
    expect(entries[0].key).toBe('plank');
    expect(entries[1].key).toBe('legpress');
    expect(entries.at(-1)!.key).toBe(customKey(row));
    expect(entries).toHaveLength(DAY.items!.length + 1);
  });

  it('ignores an order saved for another day', () => {
    const { entries } = resolve({ order: [order(['plank', 'legpress'], 2)] });
    expect(entries.map((e) => e.key)).toEqual(DAY.items!.map((i) => i.ex));
  });

  it('resolves a day that is not part of the bundled programme', () => {
    // What a user's own day will be: no baseline behind it, only their exercises.
    const row = custom({ day_no: 101 });
    const { entries } = resolve({ day: null, dayNo: 101, customs: [row] });
    expect(entries.map((e) => e.key)).toEqual([customKey(row)]);
  });
});

describe('dayProgress over a composed day', () => {
  function log(exKey: string, setsDone: boolean[]): ExerciseLog {
    return {
      user_id: USER,
      updated_at: '2026-01-01T00:00:00Z',
      day_no: 1,
      block: 'b1',
      ex_key: exKey,
      weight: null,
      reps: null,
      sets_done: setsDone,
      note: null,
      field_updated_at: {},
    };
  }

  function byKey(rows: ExerciseLog[]) {
    return new Map(rows.map((row) => [logId(row.day_no, 'b1', row.ex_key), row]));
  }

  it('counts sets on an exercise the user added', () => {
    const row = custom({ sets: '3' });
    const { entries } = resolve({ customs: [row] });
    const before = dayProgress(1, 'b1', entries, new Map());
    const after = dayProgress(1, 'b1', entries, byKey([log(customKey(row), [true, true, false])]));

    expect(after.total).toBe(before.total);
    expect(after.done).toBe(2);
    expect(before.total).toBeGreaterThan(DAY.items!.reduce((n, i) => n + i.b1.s, 0));
  });

  it('measures against the set count the user changed, not the one that shipped', () => {
    const { entries } = resolve({ overrides: [override({ sets: '2' })] });
    const progress = dayProgress(1, 'b1', entries, byKey([log('legpress', [true, true, true, true])]));
    // Four sets ticked under a prescription of two counts as two. The cap is what stops
    // a deload reading 120 percent.
    expect(progress.done).toBe(2);
  });

  it('drops a hidden exercise out of the total', () => {
    const full = dayProgress(1, 'b1', resolve().entries, new Map());
    const less = dayProgress(1, 'b1', resolve({ hidden: [hidden('legpress')] }).entries, new Map());
    expect(less.total).toBe(full.total - DAY.items![0].b1.s);
  });
});
