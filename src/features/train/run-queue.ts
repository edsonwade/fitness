/**
 * O que aparece por baixo das séries, na folha do ecrã Executar.
 *
 * Erro 4 de `.claude/skills/executar-quatro-erros-do-browser/PLANO.md`: a fila só mostrava
 * os exercícios não feitos DEPOIS do atual, e no último ficava vazia. Agora são os outros
 * exercícios do dia todos: primeiro os que faltam — os seguintes e depois os de trás —, e
 * a seguir os já feitos, sob "Já feitos" (frame 4c de `proto/v2/04-executar.html`). A
 * lista só fica vazia num dia com um exercício só.
 */
export function sheetQueue(
  done: readonly boolean[],
  index: number,
): { next: number[]; finished: number[] } {
  const others = done.map((_, i) => i).filter((i) => i !== index);
  const open = others.filter((i) => !done[i]);
  return {
    next: [...open.filter((i) => i > index), ...open.filter((i) => i < index)],
    finished: others.filter((i) => done[i]),
  };
}
