import { describe, expect, it } from 'vitest';

import type { Session } from '../../data/entities';
import { dayStreak, mondayOf, weekConsistency, weekPlan } from './week-plan';

/** A semana partilhada: Seg…Dom, com Qui e Dom de descanso. */
const SLOTS = [1, 2, 3, 4, 5, 6, 7].map((no) => ({ no, rest: no === 4 || no === 7 }));

function session(day_no: number, local_date: string): Session {
  return {
    id: `00000000-0000-4000-8000-00000000000${day_no}`,
    user_id: '00000000-0000-4000-8000-000000000001',
    performed_at: `${local_date}T10:00:00Z`,
    finished_at: null,
    day_no,
    local_date,
    day_name: null,
    block: 'b1',
  } as Session;
}

describe('o plano da semana do HOJE', () => {
  it('começa a semana na Segunda', () => {
    expect(mondayOf('2026-09-12')).toBe('2026-09-07'); // sábado
    expect(mondayOf('2026-09-07')).toBe('2026-09-07'); // segunda
    expect(mondayOf('2026-09-13')).toBe('2026-09-07'); // domingo
  });

  it('marca feito, hoje, descanso e por vir — o frame 1', () => {
    const rows = weekPlan(
      SLOTS,
      [session(1, '2026-09-07'), session(2, '2026-09-08'), session(3, '2026-09-09'), session(5, '2026-09-11')],
      '2026-09-12',
    );
    expect(rows.map((r) => r.state)).toEqual(['done', 'done', 'done', 'rest', 'done', 'today', 'rest']);
  });

  it('não conta uma sessão da semana passada, nem de outro dia do plano', () => {
    const rows = weekPlan(SLOTS, [session(1, '2026-08-31'), session(2, '2026-09-07')], '2026-09-12');
    expect(rows[0].state).toBe('todo');
  });

  it('a consistência só conta dias de treino que já chegaram', () => {
    const c = weekConsistency(SLOTS, [session(1, '2026-09-07'), session(3, '2026-09-09')], '2026-09-10');
    expect(c).toEqual({ done: 2, planned: 3 });
  });
});

describe('a sequência do topo', () => {
  const wd = (d: string) => (new Date(`${d}T12:00:00`).getDay() + 6) % 7;
  const rest = new Set([3, 6]);
  it('conta os dias de treino seguidos, sem os descansos partirem', () => {
    // sex 11, qua 9, ter 8, seg 7 feitos; qui 10 descanso; hoje sáb 12 por fazer
    const done = new Set(['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-11']);
    expect(dayStreak('2026-09-12', rest, done, wd)).toBe(4);
  });
  it('um dia de treino falhado corta', () => {
    expect(dayStreak('2026-09-12', rest, new Set(['2026-09-07', '2026-09-11']), wd)).toBe(1);
  });
});
