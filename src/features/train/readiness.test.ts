import { describe, expect, it } from 'vitest';

import type { Session, SessionEntry } from '../../data/entities';
import { daysBetween, readiness, recoveryReading, shiftDays } from './readiness';

/**
 * A prontidão, provada sem browser — mas a prova verdadeira é o utilizador ver o número no
 * ecrã com os dados dele. Aqui prova-se a regra que importa: **sem sessões não há prontidão**,
 * e o número sai do intervalo real, não de um valor por omissão. Todos os números abaixo são
 * inventados e neutros; o 72 e o 82 do plano são exemplos (§14) e não aparecem como se fossem
 * reais.
 */

const USER = '00000000-0000-4000-8000-000000000001';
const TODAY = '2026-09-10';

let entrySeq = 0;
function entry(over: Partial<SessionEntry> = {}): SessionEntry {
  entrySeq += 1;
  return {
    user_id: USER,
    updated_at: '2026-09-10T10:00:00Z',
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
    updated_at: '2026-09-10T10:00:00Z',
    id: `33333333-3333-4333-8333-00000000000${sessionSeq}`,
    performed_at: '2026-09-10T10:00:00Z',
    finished_at: null,
    day_no: 1,
    local_date: '2026-09-10',
    day_name: 'Perna',
    block: 'b1',
    ...over,
  };
}

describe('daysBetween / shiftDays', () => {
  it('counts whole days across a month boundary', () => {
    expect(daysBetween('2026-08-30', '2026-09-02')).toBe(3);
  });
  it('shifts a date back over a month boundary', () => {
    expect(shiftDays('2026-09-02', -6)).toBe('2026-08-27');
  });
});

describe('recoveryReading', () => {
  it('names the interval, not a diagnosis', () => {
    expect(recoveryReading(0)).toBe('treino-hoje');
    expect(recoveryReading(1)).toBe('recente');
    expect(recoveryReading(2)).toBe('boa');
    expect(recoveryReading(3)).toBe('boa');
    expect(recoveryReading(5)).toBe('completa');
    expect(recoveryReading(9)).toBe('pausa-longa');
  });
});

describe('readiness', () => {
  it('has no readiness at all with no history — not 50, not a zero ring', () => {
    expect(readiness([], null, TODAY)).toEqual({ ok: false, reason: 'sem-dados' });
  });

  it('reads a workout yesterday as recovery on its way, load carried through', () => {
    const yesterday = session({ local_date: shiftDays(TODAY, -1) });
    const result = readiness(
      [yesterday],
      [entry({ weight: '60', reps: '10', sets_done: 3 })], // 1800
      TODAY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.daysSinceLast).toBe(1);
    expect(result.value.recovery).toBe('recente');
    expect(result.value.score).toBe(80); // recoveryBase(1), no density penalty
    expect(result.value.load).toEqual({ ok: true, value: 1800, excluded: [] });
  });

  it('reads a workout two weeks ago as a long pause, score floored', () => {
    const twoWeeks = session({ local_date: shiftDays(TODAY, -14) });
    const result = readiness([twoWeeks], null, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.daysSinceLast).toBe(14);
    expect(result.value.recovery).toBe('pausa-longa');
    expect(result.value.score).toBe(40); // 100 - (14-3)*8 = 12, floored at 40
    /* No entries fetched yet: the load has no value, and the number does not depend on it. */
    expect(result.value.load.ok).toBe(false);
  });

  it('drops the score for a dense week, even when the interval is ideal', () => {
    /* Last session two days ago (ideal window), but five sessions in the last seven days. */
    const sessions = [
      session({ local_date: shiftDays(TODAY, -2) }),
      session({ local_date: shiftDays(TODAY, -3) }),
      session({ local_date: shiftDays(TODAY, -4) }),
      session({ local_date: shiftDays(TODAY, -5) }),
      session({ local_date: shiftDays(TODAY, -6) }),
    ];
    const result = readiness(sessions, null, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.daysSinceLast).toBe(2);
    expect(result.value.recovery).toBe('boa');
    expect(result.value.sessionsLast7).toBe(5);
    expect(result.value.score).toBe(85); // recoveryBase(2)=100, densityPenalty(5)=15
  });

  it('counts only the sessions inside the last seven days for density', () => {
    const sessions = [
      session({ local_date: shiftDays(TODAY, -2) }),
      session({ local_date: shiftDays(TODAY, -3) }),
      session({ local_date: shiftDays(TODAY, -4) }),
      session({ local_date: shiftDays(TODAY, -4) }),
      session({ local_date: shiftDays(TODAY, -30) }), // outside the window
    ];
    const result = readiness(sessions, null, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.sessionsLast7).toBe(4);
    expect(result.value.score).toBe(90); // recoveryBase(2)=100, densityPenalty(4)=10
  });
});
