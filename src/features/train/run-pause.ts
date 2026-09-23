/**
 * A pausa do ecrã Executar e o "Terminar e guardar", em números.
 *
 * Bug B4 de `.claude/skills/executar-quatro-erros-do-browser/PLANO.md`: com "Terminar
 * treino?" aberto a sessão fica parada por trás, e "Continuar a treinar" retoma-a onde
 * estava — a contagem continua do algarismo em que ia, e o mostrador não conta o tempo
 * da pausa. "Terminar e guardar" grava e sai, e nunca volta ao vídeo.
 */
import type { DialAnchor } from './run-dial';

/** A contagem 3 · 2 · 1 inteira, e os 240 ms finais em que o véu dissolve. */
export const COUNT_MS = 3000;
export const GO_MS = 240;

export type CountStep = { delay: number; step: 2 | 1 | 'go' };

/**
 * O que falta da contagem depois de `spent` ms já contados: o algarismo à vista e os
 * passos que ainda não aconteceram, cada um com o atraso a partir de agora.
 */
export function countFrom(spent: number): { digit: 3 | 2 | 1; next: CountStep[] } {
  const digit = spent < 1000 ? 3 : spent < 2000 ? 2 : 1;
  const steps: { at: number; step: CountStep['step'] }[] = [
    { at: 1000, step: 2 },
    { at: 2000, step: 1 },
    { at: COUNT_MS - GO_MS, step: 'go' },
  ];
  return {
    digit,
    next: steps.filter((s) => s.at > spent).map((s) => ({ delay: s.at - spent, step: s.step })),
  };
}

/** A âncora do mostrador empurrada para a frente pelo tempo que a pausa durou. */
export function shiftAnchor(anchor: DialAnchor, ms: number): DialAnchor {
  return { ...anchor, since: anchor.since + Math.max(0, ms) };
}

/**
 * "Terminar e guardar": com pelo menos uma série feita, grava a sessão como terminada;
 * sem nenhuma, não houve treino e só se sai — a regra dele que o dia já segue
 * (`finishHint`).
 */
export function finishAction(setsDone: number): 'record' | 'leave' {
  return setsDone > 0 ? 'record' : 'leave';
}
