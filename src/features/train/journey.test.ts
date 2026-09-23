import { describe, expect, it } from 'vitest';

import type { Session } from '../../data/entities';
import { PHASES, cycleWeek, phaseOfWeek, weekCell } from './journey';

function at(local_date: string): Session {
  return { id: local_date, local_date, performed_at: `${local_date}T09:00:00Z` } as Session;
}

describe('a jornada', () => {
  it('as bandas têm 4 · 4 · 3 · 1 semanas, doze ao todo', () => {
    expect(PHASES.map((p) => p.weeks)).toEqual([4, 4, 3, 1]);
    expect(PHASES.reduce((n, p) => n + p.weeks, 0)).toBe(12);
  });

  it('sem sessões não há semana nenhuma', () => {
    expect(cycleWeek([], '2026-09-12')).toBeNull();
    expect(weekCell(1, null)).toBe('todo');
  });

  it('conta a semana desde a primeira sessão e recomeça depois da 12', () => {
    expect(cycleWeek([at('2026-09-20'), at('2026-08-29')], '2026-09-12')).toBe(3);
    expect(cycleWeek([at('2026-01-01')], '2026-03-26')).toBe(1); // 84 dias: semana 13 → 1
  });

  it('a fase sai da semana', () => {
    expect([1, 4, 5, 8, 9, 11, 12].map(phaseOfWeek)).toEqual(['b1', 'b1', 'b2', 'b2', 'b3', 'b3', 'dl']);
  });

  it('as células antes da de agora estão cumpridas, a de agora a meio', () => {
    expect([1, 2, 3, 4].map((w) => weekCell(w, 3))).toEqual(['done', 'done', 'half', 'todo']);
  });
});
