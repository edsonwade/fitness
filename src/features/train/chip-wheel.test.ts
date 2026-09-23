import { describe, expect, it } from 'vitest';

import { ITEM_H, centred, dragPos, tapResult, wheelStep } from './chip-wheel';

/*
 * Os mesmos casos de `.claude/skills/executar-quatro-erros-do-browser/teste-roda.cjs`,
 * que provou a roda no protótipo (bug B1): a roda do rato, o trackpad, o clique, o
 * arrasto e as pontas.
 */
describe('a roda do equipamento', () => {
  it('a roda do rato +100 avança uma', () => {
    expect(wheelStep(0, 100, 0)).toEqual({ acc: 0, step: 1 });
  });

  it('o trackpad com 20px ainda não mexe, e acumulado a −40 recua uma', () => {
    const a = wheelStep(0, 20, 0);
    expect(a).toEqual({ acc: 20, step: 0 });
    expect(wheelStep(a.acc, -60, 0)).toEqual({ acc: 0, step: -1 });
  });

  it('a roda por linhas (deltaMode 1) recua uma', () => {
    expect(wheelStep(0, -1, 1)).toEqual({ acc: 0, step: -1 });
  });

  it('um clique numa candidata escolhe-a', () => {
    expect(tapResult(1, 0, 3)).toEqual({ pick: 1 });
  });

  it('um clique sem candidata avança uma, e da última volta à primeira', () => {
    expect(tapResult(1, 1, 3)).toEqual({ go: 2 });
    expect(tapResult(3, 3, 3)).toEqual({ go: 0 });
  });

  it('arrastar 52px para baixo recua duas', () => {
    expect(centred(dragPos(2, 2 * ITEM_H, 3), 3)).toBe(0);
  });

  it('nas pontas só há um pouco de folga, e o centro nunca sai das opções', () => {
    expect(dragPos(0, 500, 3)).toBe(-0.4);
    expect(dragPos(3, -500, 3)).toBe(3.4);
    expect(centred(-0.4, 3)).toBe(0);
    expect(centred(3.4, 3)).toBe(3);
  });
});
