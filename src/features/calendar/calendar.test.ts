import { describe, expect, it } from 'vitest';

import { daySheet, dayState, daysInMonth, monthGrid, monthSummary, weekdayIndex, yearMap } from './calendar';

const REST = new Set([3, 6]); // Qui e Dom
describe('o calendário', () => {
  it('setembro de 2026 começa à terça, tem 30 dias, e a semana começa à segunda', () => {
    const cells = monthGrid(2026, 9);
    expect(cells[0]).toEqual({ date: '2026-08-31', day: 31, inMonth: false });
    expect(cells[1].date).toBe('2026-09-01');
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30);
    expect(cells.length % 7).toBe(0);
    expect(weekdayIndex('2026-09-01')).toBe(1);
  });

  it('fevereiro bissexto e não bissexto', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });

  it('feito, descanso, planeado, falhado, e nada antes do histórico', () => {
    const done = new Set(['2026-09-01']);
    const first = '2026-09-01';
    expect(dayState('2026-09-01', '2026-09-12', REST, done, first)).toBe('done');
    expect(dayState('2026-09-03', '2026-09-12', REST, done, first)).toBe('rest');
    expect(dayState('2026-09-02', '2026-09-12', REST, done, first)).toBe('missed');
    expect(dayState('2026-09-12', '2026-09-12', REST, done, first)).toBe('planned');
    expect(dayState('2026-08-25', '2026-09-12', REST, done, first)).toBe('none');
    expect(dayState('2026-09-02', '2026-09-12', REST, new Set(), null)).toBe('none');
  });

  it('o resumo do mês conta até hoje', () => {
    const cells = monthGrid(2026, 9);
    const s = monthSummary(cells, '2026-09-05', REST, new Set(['2026-09-01', '2026-09-02']), '2026-09-01');
    expect(s).toEqual({ done: 2, planned: 4, missed: ['2026-09-04'] });
  });

  it('o mapa do ano começa na semana da primeira sessão', () => {
    const weeks = yearMap('2026-09-09', '2026-09-20');
    expect(weeks).toHaveLength(2);
    expect(weeks[0][0]).toBe('2026-09-07');
    expect(yearMap(null, '2026-09-20')).toEqual([]);
  });
});

// B2 de .claude/skills/calendario-ir-para-hoje/PLANO.md: tocar num dia abre a folha, nunca o Treino.
describe('a folha do dia', () => {
  it('um dia feito mostra a sessão', () => {
    expect(daySheet('done', true)).toBe('session');
  });
  it('planeado, falhado e sem registo mostram o treino do plano, sem sair do Calendário', () => {
    expect(daySheet('planned', false)).toBe('plan');
    expect(daySheet('missed', false)).toBe('plan');
    expect(daySheet('none', false)).toBe('plan');
  });
  it('descanso diz que é descanso', () => {
    expect(daySheet('rest', false)).toBe('rest');
  });
  it('feito mas com a sessão ainda a carregar cai no plano, e não numa folha vazia', () => {
    expect(daySheet('done', false)).toBe('plan');
  });
});
