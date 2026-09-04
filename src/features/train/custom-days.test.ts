import { describe, expect, it } from 'vitest';

import { DAYS } from '../../content';
import type { CustomDay, CustomExercise, DayAddition } from '../../data/entities';
import { dayCleanup, FIRST_CUSTOM_DAY, nextDayNo, refOfBuilt, resolveDays } from './custom-days';
import { resolveDayEntries } from './day-entries';

/**
 * Days added to the week.
 *
 * The whole feature rests on one number. `day_no` decides which rows in five other
 * tables belong to a day, so the rules about that number are the rules that keep an
 * exercise, a logged load and a saved order attached to the right day. Since `009` the
 * number is also unique across the database rather than within an account, which is
 * what makes an added day the same day on both screens. They are checked here rather
 * than by opening eight days in a browser and counting.
 *
 * The last test is the one that matters most: it asserts against the bundled
 * programme itself that nothing a user creates can ever take a number the programme
 * uses, which is what makes the seven authored days untouchable by construction
 * rather than by care.
 */

const USER = '00000000-0000-4000-8000-000000000001';
/** The other account. On `custom_days` the column says who wrote the row, not whose day it is. */
const OTHER = '00000000-0000-4000-8000-000000000002';

function day(over: Partial<CustomDay> = {}): CustomDay {
  return {
    user_id: USER,
    updated_at: '2026-01-01T00:00:00Z',
    day_no: FIRST_CUSTOM_DAY,
    name: 'Braço e ombro',
    goal: null,
    warm: null,
    type: 'strength',
    created_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('numbering a day added to the week', () => {
  it('starts at 101, clear of the seven the programme ships', () => {
    expect(nextDayNo([])).toBe(101);
  });

  it('takes the number after the highest one already used', () => {
    expect(nextDayNo([day({ day_no: 101 }), day({ day_no: 102 })])).toBe(103);
  });

  it('does not fill a gap left by a deleted day', () => {
    // Reusing 102 here would hand the new day the deleted one's number while its
    // exercise_logs are still in the table. Counting from the highest avoids that
    // without needing to remember what was deleted.
    expect(nextDayNo([day({ day_no: 101 }), day({ day_no: 103 })])).toBe(104);
  });

  it('counts the days the other account created too', () => {
    // The collision `008` was written to contain, removed at its source. `custom_days`
    // is shared since `009`, so this list is every day there is: numbering from it is
    // what stops two people from both calling their new day 101 and then watching each
    // other's exercises appear inside it.
    expect(nextDayNo([day({ day_no: 101, user_id: OTHER })])).toBe(102);
  });

  it('never returns a number the bundled programme uses', () => {
    const programmeNumbers = new Set(DAYS.map((d) => d.id));
    for (const rows of [[], [day({ day_no: 101 })], [day({ day_no: 140 })]]) {
      expect(programmeNumbers.has(nextDayNo(rows))).toBe(false);
    }
  });
});

describe('the week', () => {
  it('is the programme’s seven when the user has made none', () => {
    const week = resolveDays([]);
    expect(week).toHaveLength(DAYS.length);
    expect(week.every((d) => d.kind === 'built')).toBe(true);
    expect(week.map((d) => d.no)).toEqual(DAYS.map((d) => d.id));
  });

  it('puts the added days after the programme, in the order they were created', () => {
    const week = resolveDays([
      day({ day_no: 103, name: 'Terceiro' }),
      day({ day_no: 101, name: 'Primeiro' }),
      day({ day_no: 102, name: 'Segundo' }),
    ]);

    expect(week.slice(0, DAYS.length).every((d) => d.kind === 'built')).toBe(true);
    expect(week.slice(DAYS.length).map((d) => d.name)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('ignores a row that claims a number inside the programme’s range', () => {
    // Postgres refuses this with a check constraint, so it can only arrive from a
    // hand-edited row or a future migration. Reading it would draw a second card
    // over an authored day, which is the one outcome the preservation rule forbids.
    const week = resolveDays([day({ day_no: 3, name: 'Não é meu' })]);
    expect(week).toHaveLength(DAYS.length);
    expect(week.map((d) => d.name)).not.toContain('Não é meu');
  });

  it('names a day the user left unnamed rather than drawing an empty heading', () => {
    const [own] = resolveDays([day({ name: null })]).slice(DAYS.length);
    expect(own.name.trim().length).toBeGreaterThan(0);
  });

  it('reads a type it does not recognise as a training day', () => {
    const [own] = resolveDays([day({ type: 'nonsense' })]).slice(DAYS.length);
    expect(own.type).toBe('strength');
  });

  it('carries the goal and the warm-up a programme day carries', () => {
    const [own] = resolveDays([day({ goal: 'Bíceps e deltoide', warm: '5 min bike' })]).slice(
      DAYS.length,
    );
    expect(own.goal).toBe('Bíceps e deltoide');
    expect(own.warm).toBe('5 min bike');
    // Whitespace is not content: a field the user opened and closed is still empty.
    const [blank] = resolveDays([day({ goal: '   ', warm: '' })]).slice(DAYS.length);
    expect(blank.goal).toBeNull();
    expect(blank.warm).toBeNull();
  });

  it('reads a programme day without changing a word of it', () => {
    const first = DAYS[0];
    const ref = refOfBuilt(first);
    expect(ref.name).toBe(first.name.pt);
    expect(ref.label).toBe(first.wd.pt);
    expect(ref.day).toBe(first);
    expect(ref.custom).toBeUndefined();
  });
});

describe('deleting an added day', () => {
  /**
   * The state this was written against, read out of the live database on 2026-09-04:
   * day 101 "Caminhada", an exercise published to the catalogue and added to it, and a
   * hidden marker on that same exercise. Deleting the day used to take the day and the
   * marker and leave the addition, so the exercise stayed in the plan on a day that no
   * longer existed, and the next day handed 101 opened holding it.
   */
  function exercise(over: Partial<CustomExercise> = {}): CustomExercise {
    return {
      user_id: USER,
      updated_at: '2026-01-01T00:00:00Z',
      id: '00000000-0000-4000-8000-00000000000a',
      day_no: 101,
      legacy_key: null,
      kind: 'acc',
      name: 'Passeio',
      equipment: null,
      sets: null,
      reps: null,
      load: null,
      rest: null,
      video_id: null,
      photo_url: null,
      created_at: '2026-01-01T00:00:00Z',
      ...over,
    };
  }

  function addition(over: Partial<DayAddition> = {}): DayAddition {
    return {
      created_by: USER,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      deleted: false,
      id: '00000000-0000-4000-8000-00000000000b',
      day_no: 101,
      user_id: null,
      ex_key: 's:e2cc7dc5-161b-4e28-b8c4-fb16121fc2de',
      block_config: {},
      ...over,
    };
  }

  const hidden = [
    { user_id: USER, updated_at: '2026-01-01T00:00:00Z', day_no: 101, ex_key: 's:e2cc7dc5' },
    { user_id: OTHER, updated_at: '2026-01-01T00:00:00Z', day_no: 2, ex_key: 'legpress' },
  ];
  const order = [
    { user_id: USER, updated_at: '2026-01-01T00:00:00Z', day_no: 101, ordered_keys: ['a', 'b'] },
  ];

  it('takes the day’s published additions with it', () => {
    const going = dayCleanup(101, {
      exercises: [],
      hidden: [],
      order: [],
      additions: [addition()],
    });

    expect(going.additions.map((row) => row.id)).toEqual([
      '00000000-0000-4000-8000-00000000000b',
    ]);
  });

  it('empties every table the day writes into', () => {
    const going = dayCleanup(101, {
      exercises: [exercise()],
      hidden,
      order,
      additions: [addition()],
    });

    expect(going.exercises).toEqual(['00000000-0000-4000-8000-00000000000a']);
    expect(going.hidden).toEqual([{ day_no: 101, ex_key: 's:e2cc7dc5' }]);
    expect(going.order).toBe(true);
    expect(going.additions).toHaveLength(1);
  });

  it('touches nothing belonging to another day', () => {
    const going = dayCleanup(101, {
      exercises: [exercise({ id: '00000000-0000-4000-8000-00000000000c', day_no: 3 })],
      hidden,
      order: [],
      additions: [addition({ id: '00000000-0000-4000-8000-00000000000d', day_no: 6 })],
    });

    expect(going.exercises).toEqual([]);
    expect(going.hidden).toEqual([{ day_no: 101, ex_key: 's:e2cc7dc5' }]);
    expect(going.order).toBe(false);
    expect(going.additions).toEqual([]);
  });

  it('does not retire an addition that is already retired', () => {
    // A second `deleted = true` is a write that changes nothing and still travels to
    // the other account over realtime. Deleting a day twice is one tap and a retry.
    const going = dayCleanup(101, {
      exercises: [],
      hidden: [],
      order: [],
      additions: [addition({ deleted: true })],
    });

    expect(going.additions).toEqual([]);
  });

  it('has nothing to do for a day that holds nothing', () => {
    const going = dayCleanup(102, { exercises: [], hidden: [], order: [], additions: [] });
    expect(going).toEqual({ exercises: [], hidden: [], order: false, additions: [] });
  });
});

describe('an added day, opened', () => {
  it('starts empty and fills through the same resolver a programme day uses', () => {
    const { entries, hiddenCount } = resolveDayEntries({
      day: null,
      dayNo: 101,
      block: 'b1',
      customs: [],
      overrides: [],
      hidden: [],
      order: [],
    });

    expect(entries).toEqual([]);
    expect(hiddenCount).toBe(0);
  });
});
