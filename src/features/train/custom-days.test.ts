import { describe, expect, it } from 'vitest';

import { DAYS } from '../../content';
import type { CustomDay } from '../../data/entities';
import { FIRST_CUSTOM_DAY, nextDayNo, refOfBuilt, resolveDays } from './custom-days';
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
