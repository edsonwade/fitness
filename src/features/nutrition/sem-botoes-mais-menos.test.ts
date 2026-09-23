import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Guarda do B4 (.claude/skills/nutricao-sem-erros/PLANO.md). Palavras dele: "esta app não
 * tem que ter botão para adicionar ou tirar; tem que ter os valores já definidos e a pessoa
 * faz scroll e seleciona". Nenhum ecrã volta a usar o Stepper (− valor +).
 */
const SRC = join(__dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const path = join(dir, d.name);
    if (d.isDirectory()) return sources(path);
    return /\.tsx$/.test(d.name) && !/\.test\.tsx$/.test(d.name) ? [path] : [];
  });
}

describe('nenhum número se muda com − / + (B4)', () => {
  it('nenhum ecrã usa o Stepper', () => {
    const hits = sources(SRC).filter((file) => /<Stepper\b|from '.*\/Stepper'/.test(readFileSync(file, 'utf8')));
    expect(hits.map((f) => f.slice(SRC.length + 1))).toEqual([]);
  });
});
