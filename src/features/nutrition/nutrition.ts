import type { FoodEntry, WeightLog } from '../../data/entities';

/**
 * As contas da Nutrição — fase 020, `proto/v2/06-nutricao.html`.
 *
 * Tudo sai do que a pessoa registou. Um macro que não foi dado não conta como zero na
 * soma de outro — conta só o que existe —, e sem registos o dia é o frame 4: vazio, e dito.
 */
export const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
export type Meal = (typeof MEALS)[number];

export type Totals = { kcal: number; protein: number; carbs: number; fat: number; count: number };

const n = (v: number | string | null | undefined) => (v === null || v === undefined ? 0 : Number(v) || 0);

export function totalsOf(entries: readonly FoodEntry[]): Totals {
  return entries.reduce<Totals>(
    (t, e) => ({
      kcal: t.kcal + n(e.kcal),
      protein: t.protein + n(e.protein_g),
      carbs: t.carbs + n(e.carbs_g),
      fat: t.fat + n(e.fat_g),
      count: t.count + 1,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
  );
}

export function onDate(entries: readonly FoodEntry[], date: string): FoodEntry[] {
  return entries.filter((e) => e.local_date === date);
}

export function byMeal(entries: readonly FoodEntry[]): Record<Meal, FoodEntry[]> {
  const out = { breakfast: [], lunch: [], snack: [], dinner: [] } as Record<Meal, FoodEntry[]>;
  for (const e of [...entries].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    out[e.meal].push(e);
  }
  return out;
}

/** A percentagem da meta, arredondada; sem meta, não há percentagem. */
export function pctOf(value: number, target: number | null | undefined): number | null {
  if (!target || target <= 0) return null;
  return Math.round((value / target) * 100);
}

export type WeightTrend = {
  latest: { date: string; kg: number };
  /** Contra o registo anterior; null com um registo só. */
  delta: number | null;
  /** Os últimos registos, do mais antigo ao mais recente, para a sparkline. */
  series: number[];
};

export function weightTrend(logs: readonly WeightLog[], last = 7): WeightTrend | null {
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) => a.local_date.localeCompare(b.local_date));
  const kg = sorted.map((l) => Number(l.kg));
  const latest = sorted[sorted.length - 1];
  return {
    latest: { date: latest.local_date, kg: Number(latest.kg) },
    delta: kg.length >= 2 ? Math.round((kg[kg.length - 1] - kg[kg.length - 2]) * 10) / 10 : null,
    series: kg.slice(-last),
  };
}

/** Quanto do caminho até à meta de peso já se fez, desde o primeiro registo. */
export function goalProgress(start: number, current: number, target: number | null): number | null {
  if (target === null || start === target) return null;
  const pct = ((start - current) / (start - target)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}

/** Os pontos da sparkline num viewBox de `w` × `h`, com 4px de folga em cima e em baixo. */
export function sparkPoints(series: readonly number[], w: number, h: number): string {
  if (series.length < 2) return '';
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = 4 + (1 - (v - min) / span) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
