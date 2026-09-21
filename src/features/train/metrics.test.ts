import { describe, expect, it } from 'vitest';

import type { Session, SessionEntry } from '../../data/entities';
import {
  consistency,
  parseLoadKg,
  parseReps,
  sessionLoad,
  trend,
  volume,
} from './metrics';

/**
 * The interpretation layer, proven without a browser — because there is no screen in this
 * phase to look at, and because the one thing worth proving is the rule that a metric with
 * no data says so instead of inventing a zero. Every number below is invented and neutral:
 * the plan's own "4.820 kg", "+8%" and "4/5" are examples (§14) and would be a lie if a
 * test pretended they were real, so none of them appears here.
 */

const USER = '00000000-0000-4000-8000-000000000001';

let entrySeq = 0;
function entry(over: Partial<SessionEntry> = {}): SessionEntry {
  entrySeq += 1;
  return {
    user_id: USER,
    updated_at: '2026-09-06T10:00:00Z',
    session_id: '22222222-2222-4222-8222-222222222222',
    idx: entrySeq,
    ex_key: 'legpress',
    name: 'Leg Press',
    target_sets: '3',
    target_reps: '10',
    target_raw: null,
    sets_done: 3,
    sets_total: 3,
    weight: '60',
    reps: '10',
    note: null,
    ...over,
  };
}

let sessionSeq = 0;
function session(over: Partial<Session> = {}): Session {
  sessionSeq += 1;
  return {
    user_id: USER,
    updated_at: '2026-09-06T10:00:00Z',
    id: `33333333-3333-4333-8333-00000000000${sessionSeq}`,
    performed_at: '2026-09-06T10:00:00Z',
    finished_at: null,
    day_no: 1,
    local_date: '2026-09-06',
    day_name: 'Perna',
    block: 'b1',
    ...over,
  };
}

describe('parseLoadKg', () => {
  it('reads a plain number', () => {
    expect(parseLoadKg('60')).toBe(60);
  });
  it('reads a comma as a decimal point', () => {
    expect(parseLoadKg('12,5')).toBe(12.5);
  });
  it('reads the number out of a unit', () => {
    expect(parseLoadKg('60 kg')).toBe(60);
  });
  it('refuses an ambiguous per-hand load', () => {
    expect(parseLoadKg('10/hand')).toBeNull();
  });
  it('refuses a word with no number', () => {
    expect(parseLoadKg('bodyweight')).toBeNull();
  });
  it('is null for empty and for null', () => {
    expect(parseLoadKg('')).toBeNull();
    expect(parseLoadKg('   ')).toBeNull();
    expect(parseLoadKg(null)).toBeNull();
  });
});

describe('parseReps', () => {
  it('reads a plain count', () => {
    expect(parseReps('10')).toBe(10);
  });
  it('reads the floor of a range', () => {
    expect(parseReps('8-10')).toBe(8);
  });
  it('refuses AMRAP', () => {
    expect(parseReps('AMRAP')).toBeNull();
  });
  it('is null for empty and for null', () => {
    expect(parseReps('')).toBeNull();
    expect(parseReps(null)).toBeNull();
  });
});

describe('sessionLoad', () => {
  it('sums load times reps times sets done, over legible entries', () => {
    const result = sessionLoad([
      entry({ weight: '50', reps: '10', sets_done: 3 }), // 1500
      entry({ weight: '20', reps: '12', sets_done: 4 }), // 960
    ]);
    expect(result).toEqual({ ok: true, value: 2460, excluded: [] });
  });

  it('leaves an exercise with no load out of the sum, with the reason', () => {
    const result = sessionLoad([
      entry({ name: 'Agachamento', weight: '40', reps: '10', sets_done: 5 }), // 2000
      entry({ name: 'Caminhada', weight: null, reps: null, sets_done: 2 }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(2000); // the walk did not count as 0 kg — it did not count
    expect(result.excluded).toEqual([{ name: 'Caminhada', reason: 'sem-peso' }]);
  });

  it('leaves an exercise with no set done out of the sum', () => {
    const result = sessionLoad([
      entry({ name: 'Supino', weight: '40', reps: '8', sets_done: 3 }), // 960
      entry({ name: 'Rosca', weight: '15', reps: '12', sets_done: 0 }),
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(960);
    expect(result.excluded).toEqual([{ name: 'Rosca', reason: 'sem-series' }]);
  });

  it('marks an unreadable load as illegible, not as zero', () => {
    const result = sessionLoad([
      entry({ name: 'Prancha', weight: 'bodyweight', reps: '30', sets_done: 3 }),
    ]);
    expect(result).toEqual({ ok: false, reason: 'sem-carga-legivel' });
  });

  it('has no load at all when not one entry contributes', () => {
    const result = sessionLoad([entry({ weight: null, reps: null, sets_done: 0 })]);
    expect(result).toEqual({ ok: false, reason: 'sem-carga-legivel' });
  });
});

describe('volume', () => {
  it('is sem-dados with no sessions at all', () => {
    const result = volume([], new Map(), '2026-09-01', '2026-09-07');
    expect(result).toEqual({ ok: false, reason: 'sem-dados' });
  });

  it('sums the loads of the sessions inside the window', () => {
    const a = session({ local_date: '2026-09-02' });
    const b = session({ local_date: '2026-09-05' });
    const map = new Map<string, SessionEntry[]>([
      [a.id, [entry({ weight: '50', reps: '10', sets_done: 3 })]], // 1500
      [b.id, [entry({ weight: '40', reps: '10', sets_done: 4 })]], // 1600
    ]);
    const result = volume([a, b], map, '2026-09-01', '2026-09-07');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(3100);
  });

  it('ignores a session outside the window', () => {
    const inside = session({ local_date: '2026-09-05' });
    const outside = session({ local_date: '2026-08-20' });
    const map = new Map<string, SessionEntry[]>([
      [inside.id, [entry({ weight: '50', reps: '10', sets_done: 3 })]], // 1500
      [outside.id, [entry({ weight: '99', reps: '99', sets_done: 9 })]],
    ]);
    const result = volume([inside, outside], map, '2026-09-01', '2026-09-07');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe(1500);
  });
});

describe('trend', () => {
  const legible = (n: number): { ok: true; value: number; excluded: [] } => ({
    ok: true,
    value: n,
    excluded: [],
  });

  it('never reports +0% from a single week of data', () => {
    // Only this week exists; there is no previous volume to compare against.
    const result = trend(legible(2000), { ok: false, reason: 'sem-dados' }, { currentComplete: true });
    expect(result).toEqual({ ok: false, reason: 'sem-dados' });
  });

  it('refuses to compare an incomplete period with a complete one', () => {
    const result = trend(legible(1200), legible(2000), { currentComplete: false });
    expect(result).toEqual({ ok: false, reason: 'periodo-incompleto' });
  });

  it('computes the fraction of change between two complete periods', () => {
    const result = trend(legible(2200), legible(2000), { currentComplete: true });
    expect(result).toEqual({ ok: true, value: 0.1, excluded: [] });
  });

  it('is sem-dados rather than infinity when the previous volume is zero', () => {
    const result = trend(legible(1500), legible(0), { currentComplete: true });
    expect(result).toEqual({ ok: false, reason: 'sem-dados' });
  });
});

describe('consistency', () => {
  it('counts the training days of the week, not seven', () => {
    // A week with rest days: four days are trained, three are rest.
    const result = consistency(3, 4);
    expect(result).toEqual({ ok: true, value: { done: 3, planned: 4 }, excluded: [] });
  });

  it('is sem-dados when nothing is planned, not 0/0', () => {
    expect(consistency(0, 0)).toEqual({ ok: false, reason: 'sem-dados' });
  });
});
