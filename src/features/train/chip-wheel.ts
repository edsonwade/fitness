/**
 * A roda do equipamento dentro do chip, em números.
 *
 * Portada de `wheelSetup` em `proto/v2/04-executar.html`, que é a construção corrigida
 * pelo bug B1 de `.claude/skills/executar-quatro-erros-do-browser/PLANO.md`: nada de
 * scroll nativo nem de `scroll-snap`. As opções vivem numa fita movida com `transform`,
 * e a posição é um índice que pode ter fração.
 */

/** A altura de uma opção dentro do chip, em px — `.chip-wheel .wheel-opt`. */
export const ITEM_H = 26;
/** A roda do rato e o trackpad avançam um passo por cada ~40px acumulados. */
export const STEP_PX = 40;
/** Menos do que isto, entre o pousar e o levantar, é um toque e não um arrasto. */
export const DRAG_SLOP = 5;
/** Quanto tempo a roda fica "a rolar" depois do último movimento, antes de assentar. */
export const SETTLE_MS = 260;

export function clampIndex(i: number, last: number): number {
  return Math.max(0, Math.min(last, i));
}

/** A opção ao centro para uma posição com fração. */
export function centred(pos: number, last: number): number {
  return clampIndex(Math.round(pos), last);
}

/**
 * Um evento da roda do rato. `deltaMode` 1 são linhas e 2 são páginas. Devolve o que
 * sobra acumulado e quantos passos dar agora (−1, 0 ou 1).
 */
export function wheelStep(acc: number, deltaY: number, deltaMode: number): { acc: number; step: -1 | 0 | 1 } {
  const dy = deltaMode === 1 ? deltaY * 40 : deltaMode === 2 ? deltaY * 400 : deltaY;
  const next = acc + dy;
  if (Math.abs(next) < STEP_PX) return { acc: next, step: 0 };
  return { acc: 0, step: next > 0 ? 1 : -1 };
}

/** A posição a meio de um arrasto: puxar para cima avança, com um pouco de folga nas pontas. */
export function dragPos(startPos: number, dy: number, last: number): number {
  return Math.max(-0.4, Math.min(last + 0.4, startPos - dy / ITEM_H));
}

/**
 * Um toque sem arrasto. Se a opção ao centro ainda não é a escolhida, escolhe-a; se já é,
 * a fita avança uma (e depois da última volta à primeira), para o toque responder sempre.
 */
export function tapResult(centre: number, chosen: number, last: number): { pick: number } | { go: number } {
  if (centre !== chosen) return { pick: centre };
  return { go: centre === last ? 0 : centre + 1 };
}
