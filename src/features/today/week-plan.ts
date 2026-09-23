import type { Session } from '../../data/entities';
import { shiftDays } from '../train/readiness';
import { sessionDate, sessionsBetween } from '../train/sessions';

/**
 * O "Plano da semana" de `proto/v2/02-hoje.html` frame 1: sete linhas, Seg a Dom, e três
 * estados — feito (visto a volt), hoje (o chip), e o resto por vir ou de descanso.
 *
 * "Feito" é haver uma sessão desse dia do plano na data dessa ranhura desta semana. Não é
 * "o dia foi aberto": o registo só nasce com uma série marcada, e é isso que se lê aqui.
 */
export type PlanState = 'done' | 'today' | 'rest' | 'todo';

export type PlanRow = { slot: number; date: string; state: PlanState };

/** A Segunda da semana de `date`, que é onde a semana partilhada começa. */
export function mondayOf(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDays(date, -((weekday + 6) % 7));
}

export function weekPlan(
  slots: readonly { no: number; rest: boolean }[],
  sessions: readonly Session[],
  today: string,
  /** Um dia da semana a mostrar, se não for a de hoje — a tira anda entre semanas (B7). */
  anchor: string = today,
): PlanRow[] {
  const monday = mondayOf(anchor);
  return slots.slice(0, 7).map((slot, index) => {
    const date = shiftDays(monday, index);
    const done = sessions.some((s) => s.day_no === slot.no && sessionDate(s) === date);
    const state: PlanState = done
      ? 'done'
      : date === today
        ? 'today'
        : slot.rest
          ? 'rest'
          : 'todo';
    return { slot: index, date, state };
  });
}

/**
 * A consistência da semana: sessões feitas contra dias de treino planeados **até hoje**.
 * Os dias que ainda não chegaram não contam como falhados.
 */
export function weekConsistency(
  slots: readonly { no: number; rest: boolean }[],
  sessions: readonly Session[],
  today: string,
): { done: number; planned: number } {
  const rows = weekPlan(slots, sessions, today);
  let done = 0;
  let planned = 0;
  rows.forEach((row, index) => {
    if (row.date > today || slots[index].rest) return;
    planned += 1;
    if (row.state === 'done') done += 1;
  });
  return { done, planned };
}

/** As sessões da semana de `today` e as da anterior, para o volume e a tendência. */
export function weekWindows(sessions: readonly Session[], today: string) {
  const monday = mondayOf(today);
  return {
    thisWeek: { from: monday, to: shiftDays(monday, 6) },
    lastWeek: { from: shiftDays(monday, -7), to: shiftDays(monday, -1) },
    weekBefore: { from: shiftDays(monday, -14), to: shiftDays(monday, -8) },
    recent: sessionsBetween(sessions, shiftDays(monday, -14), shiftDays(monday, 6)),
  };
}

/**
 * A sequência da barra de topo (frame 1, o chip com o raio): quantos dias de treino
 * planeados seguidos tiveram sessão, a contar de hoje (se já treinou) ou de ontem para trás.
 * Os dias de descanso não partem a sequência. Abaixo de 2, não há chip.
 */
export function dayStreak(
  today: string,
  restSlots: ReadonlySet<number>,
  doneDates: ReadonlySet<string>,
  weekdayOf: (date: string) => number,
): number {
  let date = doneDates.has(today) ? today : shiftDays(today, -1);
  let streak = 0;
  for (let guard = 0; guard < 400; guard += 1) {
    if (doneDates.has(date)) streak += 1;
    else if (!restSlots.has(weekdayOf(date))) break;
    date = shiftDays(date, -1);
  }
  return streak;
}
