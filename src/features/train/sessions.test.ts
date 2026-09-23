import { describe, expect, it } from 'vitest';

import type { ExerciseLog, Session } from '../../data/entities';
import type { DayEntry } from './day-entries';
import { logId } from './logs';
import {
  buildSessionEntries,
  localDate,
  sessionDate,
  sessionFor,
  sessionsBetween,
  totalSetsDone,
  workoutState,
} from './sessions';

/**
 * The record, and the one rule that decides whether it is written at all.
 *
 * This is tested away from a browser because the rule is a product decision the user
 * made in words, not a rendering detail: a workout happened when a set was ticked, and
 * nothing else counts. Every streak, trend and calendar built after this reads the rows
 * this rule lets through, so it is checked here rather than by opening the app and
 * hoping.
 */

const USER = '00000000-0000-4000-8000-000000000001';

function entry(over: Partial<DayEntry> = {}): DayEntry {
  return {
    key: 'legpress',
    kind: 'built',
    name: 'Leg Press',
    equipment: 'Máquina',
    prescription: { s: 3, r: '10', rpe: '8', l: '60 kg', rest: '90 s' },
    clip: null,
    photo: null,
    fallbackPhoto: null,
    ...over,
  };
}

function log(over: Partial<ExerciseLog> = {}): ExerciseLog {
  return {
    user_id: USER,
    updated_at: '2026-09-06T10:00:00Z',
    day_no: 1,
    block: 'b1',
    ex_key: 'legpress',
    weight: null,
    reps: null,
    sets_done: [],
    note: null,
    field_updated_at: {},
    ...over,
  };
}

function logsOf(...rows: ExerciseLog[]): Map<string, ExerciseLog> {
  const map = new Map<string, ExerciseLog>();
  for (const row of rows) map.set(logId(row.day_no, row.block as 'b1', row.ex_key), row);
  return map;
}

function session(over: Partial<Session> = {}): Session {
  return {
    user_id: USER,
    updated_at: '2026-09-06T10:00:00Z',
    id: '22222222-2222-4222-8222-222222222222',
    performed_at: '2026-09-06T10:00:00Z',
    finished_at: null,
    day_no: 1,
    local_date: '2026-09-06',
    day_name: 'Perna',
    block: 'b1',
    ...over,
  };
}

describe('what counts as a workout', () => {
  it('counts nothing when a load was written and no set was ticked', () => {
    const snapshot = buildSessionEntries(1, 'b1', [entry()], logsOf(log({ weight: '80' })));
    expect(totalSetsDone(snapshot)).toBe(0);
  });

  it('counts the workout as soon as one set is ticked', () => {
    const snapshot = buildSessionEntries(
      1,
      'b1',
      [entry()],
      logsOf(log({ sets_done: [true, false, false] })),
    );
    expect(totalSetsDone(snapshot)).toBe(1);
  });

  it('does not let a log from a longer block report more sets than this one asks for', () => {
    // The deload prescribes two; a log carried over from a four-set block holds four.
    const snapshot = buildSessionEntries(
      1,
      'dl',
      [entry({ prescription: { s: 2, r: '10', rpe: '6', l: '40 kg', rest: '90 s' } })],
      logsOf(log({ block: 'dl', sets_done: [true, true, true, true] })),
    );
    expect(snapshot[0].sets_done).toBe(2);
    expect(snapshot[0].sets_total).toBe(2);
  });
});

describe('the snapshot of a day', () => {
  it('keeps the prescription beside what was done', () => {
    const snapshot = buildSessionEntries(
      1,
      'b1',
      [entry()],
      logsOf(log({ sets_done: [true, true, false], weight: '80', reps: '9', note: 'pesado' })),
    );

    expect(snapshot).toEqual([
      {
        ex_key: 'legpress',
        name: 'Leg Press',
        target_sets: '3',
        target_reps: '10',
        target_raw: null,
        sets_done: 2,
        sets_total: 3,
        weight: '80',
        reps: '9',
        note: 'pesado',
      },
    ]);
  });

  it('includes the edit being made now, which is not in the fetched logs yet', () => {
    // The tick that opens a session is exactly the write that has not come back from
    // the server, so without the patch the session would be created without it.
    const snapshot = buildSessionEntries(1, 'b1', [entry()], logsOf(), {
      exKey: 'legpress',
      fields: { sets_done: [true, false, false] },
    });
    expect(totalSetsDone(snapshot)).toBe(1);
  });

  it('leaves the other exercises alone when one is edited', () => {
    const snapshot = buildSessionEntries(
      1,
      'b1',
      [entry(), entry({ key: 'legext', name: 'Extensão' })],
      logsOf(log({ ex_key: 'legext', weight: '30' })),
      { exKey: 'legpress', fields: { weight: '80' } },
    );
    expect(snapshot.map((row) => row.weight)).toEqual(['80', '30']);
  });

  it('holds every exercise the day has, in the order it is drawn in', () => {
    const snapshot = buildSessionEntries(
      1,
      'b1',
      [entry({ key: 'legext', name: 'Extensão' }), entry()],
      logsOf(),
    );
    expect(snapshot.map((row) => row.ex_key)).toEqual(['legext', 'legpress']);
  });
});

describe('the calendar day a session belongs to', () => {
  it('is the local day, not the UTC one', () => {
    // 23:30 local. In any timezone ahead of UTC this is already tomorrow in an ISO
    // string, and slicing one would file the end of an evening workout as a second
    // session on the next day.
    const at = new Date(2026, 8, 6, 23, 30, 0);
    expect(localDate(at)).toBe('2026-09-06');
  });

  it('pads the month and the day', () => {
    expect(localDate(new Date(2026, 0, 4, 9, 0, 0))).toBe('2026-01-04');
  });

  it('falls back to performed_at for the rows carried over from the old app', () => {
    expect(sessionDate(session({ local_date: null, performed_at: '2025-03-02T18:00:00Z' })))
      .toBe('2025-03-02');
  });
});

describe('reading sessions by date range', () => {
  const rows = [
    session({ id: 'a', local_date: '2026-09-01' }),
    session({ id: 'b', local_date: '2026-09-06' }),
    session({ id: 'c', local_date: '2026-09-09' }),
  ];

  it('includes both ends of the range', () => {
    expect(sessionsBetween(rows, '2026-09-01', '2026-09-09').map((r) => r.id)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('leaves out what falls outside it', () => {
    expect(sessionsBetween(rows, '2026-09-02', '2026-09-08').map((r) => r.id)).toEqual(['b']);
  });
});

describe('finding the session of one training day', () => {
  const rows = [
    session({ id: 'a', day_no: 1, local_date: '2026-09-06' }),
    session({ id: 'b', day_no: 2, local_date: '2026-09-06' }),
    session({ id: 'c', day_no: 1, local_date: '2026-09-05' }),
  ];

  it('matches the day and the date together', () => {
    expect(sessionFor(rows, 1, '2026-09-06')?.id).toBe('a');
    expect(sessionFor(rows, 2, '2026-09-06')?.id).toBe('b');
    expect(sessionFor(rows, 1, '2026-09-05')?.id).toBe('c');
  });

  it('finds nothing for a day that was not trained on that date', () => {
    expect(sessionFor(rows, 3, '2026-09-06')).toBeUndefined();
    expect(sessionFor(rows, 1, '2026-09-04')).toBeUndefined();
  });
});

/**
 * The third level, which is a decision and not a count.
 *
 * These four tests are the whole correction the user asked for: a workout is finished
 * when he finishes it. No arrangement of ticked sets can produce `done` here, because
 * this function is not given any sets to look at.
 */
describe('the state of a workout', () => {
  it('is none when no session was ever recorded for that day', () => {
    expect(workoutState(undefined)).toBe('none');
  });

  it('is open while the session has no end', () => {
    expect(workoutState(session({ finished_at: null }))).toBe('open');
  });

  it('is done once the user finished it', () => {
    expect(workoutState(session({ finished_at: '2026-09-06T19:42:00Z' }))).toBe('done');
  });

  it('stays done after more sets are recorded, because the end is kept', () => {
    // The server keeps `finished_at` on every later write (012 §2), so what comes back
    // still carries it, and the screen still says concluído. His rule: finishing again
    // or logging afterwards updates the finished workout, it does not reopen it.
    const later = session({
      finished_at: '2026-09-06T19:42:00Z',
      performed_at: '2026-09-06T19:55:00Z',
    });
    expect(workoutState(later)).toBe('done');
  });
});
