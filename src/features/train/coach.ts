import { shiftDays } from './readiness';

/**
 * O Coach — fase 016, o cartão de `proto/v2/02-hoje.html` frame 1.
 *
 * Duas metades obrigatórias: **um facto** que a pessoa pode verificar no plano da semana e no
 * calendário ("fizeste 3 das últimas 4 sessões planeadas"), e **a decisão** que dele decorre.
 * Sem facto, não há cartão. Não é um modelo de linguagem: são três regras, aqui, testadas.
 *
 * O facto: das últimas `WINDOW` sessões de treino que o plano marcou antes de hoje (a contar só
 * a partir da primeira sessão gravada — antes disso não há registo), quantas se fizeram.
 */
export const WINDOW = 4;
export const MIN_PLANNED = 2;

export type CoachRead = {
  done: number;
  planned: number;
  /** full = todas feitas · most = falhou uma · low = metade ou menos. */
  kind: 'full' | 'most' | 'low';
};

export function coachRead(
  today: string,
  restSlots: ReadonlySet<number>,
  doneDates: ReadonlySet<string>,
  firstSession: string | null,
  weekdayOf: (date: string) => number,
): CoachRead | null {
  if (firstSession === null) return null;
  let planned = 0;
  let done = 0;
  let date = shiftDays(today, -1);
  while (planned < WINDOW && date >= firstSession) {
    if (!restSlots.has(weekdayOf(date))) {
      planned += 1;
      if (doneDates.has(date)) done += 1;
    }
    date = shiftDays(date, -1);
  }
  if (planned < MIN_PLANNED) return null;
  const kind = done === planned ? 'full' : done >= planned - 1 ? 'most' : 'low';
  return { done, planned, kind };
}
