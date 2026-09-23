import { weekdayIndex } from '../calendar/calendar';
import { shiftDays } from '../train/readiness';
import type { ExerciseLine } from './progress';

/**
 * A Evolução — fase 017, `proto/v2/05-progresso.html` frame 4: meses, não hoje.
 *
 * A carga de um exercício mês a mês é a mais alta registada nesse mês. Só entra no gráfico o
 * exercício com pelo menos dois meses de registo: um mês é um ponto, e um ponto não é uma
 * evolução. Os marcos são factos com data — a primeira sessão, a carga mais alta, e a maior
 * sequência de semanas seguidas com treino.
 */
export const MIN_MONTHS = 2;

export type MonthPoint = { month: string; kg: number };

export function monthly(line: ExerciseLine): MonthPoint[] {
  const best = new Map<string, number>();
  for (const p of line.points) {
    if (p.kg === null || p.kg <= 0) continue;
    const month = p.date.slice(0, 7);
    best.set(month, Math.max(best.get(month) ?? 0, p.kg));
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, kg]) => ({ month, kg }));
}

/** Os exercícios com meses que cheguem, o que tem mais meses primeiro. */
export function evolving(lines: readonly ExerciseLine[]): { line: ExerciseLine; months: MonthPoint[] }[] {
  return lines
    .map((line) => ({ line, months: monthly(line) }))
    .filter((x) => x.months.length >= MIN_MONTHS)
    .sort((a, b) => b.months.length - a.months.length || b.line.points.length - a.line.points.length);
}

/** A maior sequência de semanas (segunda a domingo) seguidas com pelo menos uma sessão. */
export function longestWeekStreak(dates: readonly string[]): number {
  const weeks = [...new Set(dates.map((d) => shiftDays(d, -weekdayIndex(d))))].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const w of weeks) {
    run = prev !== null && shiftDays(prev, 7) === w ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  return best;
}
