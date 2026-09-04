import { describe, expect, it } from 'vitest';

import { DAYS, EXERCISES } from '../../content';
import type {
  CatalogExercise,
  CustomExercise,
  DayAddition,
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
/** The other account. On a shared table `user_id` says who wrote a row, not whose it is. */
const OTHER = '00000000-0000-4000-8000-000000000002';

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

function hidden(exKey: string, dayNo = 1, by = USER): HiddenItem {
  return { user_id: by, updated_at: '2026-01-01T00:00:00Z', day_no: dayNo, ex_key: exKey };
}

function order(keys: string[], dayNo = 1): ExerciseOrder {
  return {
    user_id: USER,
    updated_at: '2026-01-01T00:00:00Z',
    day_no: dayNo,
    ordered_keys: keys,
  };
}

function published(over: Partial<CatalogExercise> = {}): CatalogExercise {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    ex_key: 's:44444444-4444-4444-8444-444444444444',
    name_pt: 'Caminhada inclinada',
    name_en: null,
    kind: 'acc',
    equipment: 'Passadeira',
    sets: '3',
    reps: '10',
    load: null,
    rest: '60 s',
    video_id: null,
    photo_url: null,
    deleted: false,
    created_by: USER,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function addition(over: Partial<DayAddition> = {}): DayAddition {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    day_no: 1,
    // Null on every addition, because every day is everybody's. See `009` §5.
    user_id: null,
    ex_key: 's:44444444-4444-4444-8444-444444444444',
    block_config: {},
    deleted: false,
    created_by: USER,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
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

describe('exercises published to the shared catalogue', () => {
  /**
   * The bug these cover, in one sentence: an exercise published inside a day of
   * somebody's own never reached the other account, because the day number it was
   * filed under — 101 — names a different day in every account that has one.
   *
   * The resolver's half of the fix is small, and that is the point: `008` puts the
   * owner on the addition and refuses to serve another account's, so what is left here
   * is that a personal day draws a published exercise at all. That path had no test,
   * which is why it was possible to ship a chip offering to publish into a day where
   * publishing produced nothing anyone could see.
   */

  it('draws a published exercise on a day of the programme', () => {
    const { entries } = resolve({ catalog: [published()], additions: [addition()] });
    const entry = entries.find((row) => row.kind === 'shared');

    expect(entry?.name).toBe('Caminhada inclinada');
    expect(entry?.prescription.s).toBe(3);
  });

  it('draws a published exercise on a day somebody added to the week', () => {
    // `day: null` is a day with no bundled programme behind it, which is what an added
    // day is. It draws by day number alone: since `009` the number is unique across the
    // database, so 101 is one day and the addition on it is everybody's. The `user_id`
    // is null here because the database allows nothing else.
    const { entries } = resolve({
      day: null,
      dayNo: 101,
      catalog: [published()],
      additions: [addition({ day_no: 101 })],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('shared');
    expect(entries[0].shared?.addition.user_id).toBeNull();
  });

  it('leaves an addition from another day alone', () => {
    // An addition names one day and appears on that day. This used to be the collision
    // that put an exercise inside an unrelated day in another account, because 101 was
    // a different day in each; the number is unique now, so this is what it looks like
    // when the resolver is simply asked about a day the addition is not on.
    const { entries } = resolve({
      catalog: [published()],
      additions: [addition({ day_no: 101 })],
    });

    expect(entries.some((row) => row.kind === 'shared')).toBe(false);
  });

  it('draws what another account added, and hides what another account hid', () => {
    // The whole point of `009`, at the level this file can prove it: nothing in the
    // resolver looks at who wrote a row, so one day reads the same on both screens.
    // Before it, this test was unwritable — the other account's rows never arrived.
    const { entries, hiddenCount } = resolve({
      customs: [custom({ user_id: OTHER, name: 'Remada dela' })],
      hidden: [hidden('legpress', 1, OTHER)],
    });

    expect(entries.map((row) => row.name)).toContain('Remada dela');
    expect(entries.some((row) => row.key === 'legpress')).toBe(false);
    expect(hiddenCount).toBe(1);
  });

  it('refuses to draw an addition with no exercise behind it', () => {
    // The four orphans `008` §2b retires looked exactly like this. Drawing a card named
    // after a key would be the app inventing an exercise out of broken data.
    const { entries } = resolve({ catalog: [], additions: [addition()] });
    expect(entries.some((row) => row.kind === 'shared')).toBe(false);
  });
});
