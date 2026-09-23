import { describe, expect, it } from 'vitest';

import type { FoodEntry, WeightLog } from '../../data/entities';
import { byMeal, goalProgress, onDate, pctOf, sparkPoints, totalsOf, weightTrend } from './nutrition';

const F = (over: Partial<FoodEntry>): FoodEntry =>
  ({
    id: 'x',
    user_id: 'u',
    updated_at: '',
    local_date: '2026-09-12',
    meal: 'lunch',
    name: 'Frango',
    kcal: 500,
    protein_g: 40,
    carbs_g: 50,
    fat_g: 10,
    source: 'text',
    estimate: false,
    barcode: null,
    created_at: '2026-09-12T12:00:00Z',
    ...over,
  }) as FoodEntry;

const W = (local_date: string, kg: number) => ({ local_date, kg }) as WeightLog;

describe('a Nutrição', () => {
  it('soma o dia, e um macro em falta não inventa nada', () => {
    const t = totalsOf([F({}), F({ kcal: 300, protein_g: null, meal: 'breakfast' })]);
    expect(t).toEqual({ kcal: 800, protein: 40, carbs: 100, fat: 20, count: 2 });
  });

  it('agrupa por refeição e filtra a data', () => {
    const list = [F({ meal: 'dinner' }), F({ local_date: '2026-09-11' })];
    expect(byMeal(onDate(list, '2026-09-12')).dinner).toHaveLength(1);
    expect(byMeal(onDate(list, '2026-09-12')).lunch).toHaveLength(0);
  });

  it('percentagem só com meta', () => {
    expect(pctOf(1700, 1850)).toBe(92);
    expect(pctOf(1700, null)).toBeNull();
  });

  it('o peso: o mais recente, o delta, a série', () => {
    const t = weightTrend([W('2026-09-11', 68), W('2026-09-12', 67.8), W('2026-09-05', 68.4)]);
    expect(t?.latest).toEqual({ date: '2026-09-12', kg: 67.8 });
    expect(t?.delta).toBe(-0.2);
    expect(t?.series).toEqual([68.4, 68, 67.8]);
    expect(weightTrend([])).toBeNull();
  });

  it('o caminho até à meta', () => {
    expect(goalProgress(70, 68, 66)).toBe(50);
    expect(goalProgress(70, 68, null)).toBeNull();
  });

  it('a sparkline precisa de dois pontos', () => {
    expect(sparkPoints([1], 100, 40)).toBe('');
    expect(sparkPoints([1, 2], 100, 40)).toBe('0.0,36.0 100.0,4.0');
  });
});
