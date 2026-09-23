import type { BlockKey } from '../../content';
import type { Session } from '../../data/entities';
import { daysBetween } from './readiness';
import { sessionDate } from './sessions';

/**
 * A fita da jornada de `proto/v2/03-treino.html` frame 1: quatro bandas tão largas quanto
 * longas — 4 · 4 · 3 · 1 semanas — e uma célula por semana.
 *
 * Em que semana dos doze se está sai do registo: conta-se desde a primeira sessão gravada, e
 * o ciclo recomeça depois da 12. Sem sessões não há semana nenhuma para marcar, e a fita não
 * pinta volt nenhum — não se inventa um "Semana 3 de 12".
 */
export const PHASES: readonly { k: BlockKey; weeks: number; first: number }[] = [
  { k: 'b1', weeks: 4, first: 1 },
  { k: 'b2', weeks: 4, first: 5 },
  { k: 'b3', weeks: 3, first: 9 },
  { k: 'dl', weeks: 1, first: 12 },
];

export const CYCLE_WEEKS = 12;

export function cycleWeek(sessions: readonly Session[], today: string): number | null {
  if (sessions.length === 0) return null;
  let first = sessionDate(sessions[0]);
  for (const s of sessions) {
    const d = sessionDate(s);
    if (d < first) first = d;
  }
  const elapsed = Math.max(0, daysBetween(first, today));
  return (Math.floor(elapsed / 7) % CYCLE_WEEKS) + 1;
}

export function phaseOfWeek(week: number): BlockKey {
  for (let i = PHASES.length - 1; i >= 0; i -= 1) {
    if (week >= PHASES[i].first) return PHASES[i].k;
  }
  return 'b1';
}

/** O estado de uma célula: semana cumprida, a de agora (meia), ou por vir. */
export function weekCell(week: number, current: number | null): 'done' | 'half' | 'todo' {
  if (current === null) return 'todo';
  if (week < current) return 'done';
  if (week === current) return 'half';
  return 'todo';
}
