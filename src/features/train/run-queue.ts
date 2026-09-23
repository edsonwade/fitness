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

/**
 * Os nomes dos exercícios do dia para a roda (B3 de
 * `.claude/skills/folha-series-e-seletor/PLANO.md`). A roda escolhe pelo texto, por isso
 * dois exercícios com o mesmo nome levam o número da posição: nunca se escolhe o errado.
 */
export function wheelNames(names: readonly string[]): string[] {
  const seen = new Map<string, number>();
  for (const name of names) seen.set(name, (seen.get(name) ?? 0) + 1);
  return names.map((name, i) => ((seen.get(name) ?? 0) > 1 ? `${name} · ${i + 1}` : name));
}
