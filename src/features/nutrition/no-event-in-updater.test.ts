import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Guarda do B1 (.claude/skills/nutricao-sem-erros/PLANO.md): um updater de setState corre
 * depois de o evento acabar, e aí `e.currentTarget` já é null — o ecrã cai. O valor lê-se
 * para uma const antes do set. Isto varre src/ e falha se o padrão voltar.
 */
const SRC = join(__dirname, '..', '..');
const UPDATER_READS_EVENT = /\bset[A-Z]\w*\(\s*\(?\s*\w*\s*\)?\s*=>[^\n]*\b(?:e|ev|evt|event)\.currentTarget\b/;
/* Só o currentTarget: o React põe-no a null no fim do evento. O `e.target` fica a apontar
   para o elemento, e ler dele num updater não rebenta. */

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const path = join(dir, d.name);
    if (d.isDirectory()) return sources(path);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [path] : [];
  });
}

describe('nenhum updater de setState lê o evento (B1)', () => {
  it('o padrão apanha o bug original', () => {
    expect(UPDATER_READS_EVENT.test('onChange={(e) => setDraft((d) => ({ ...d, name: e.currentTarget.value }))}')).toBe(true);
    expect(UPDATER_READS_EVENT.test('onChange={(e) => setText(e.currentTarget.value)}')).toBe(false);
  });

  it('src/ está limpo', () => {
    const hits = sources(SRC).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => (UPDATER_READS_EVENT.test(line) ? [`${file.slice(SRC.length + 1)}:${i + 1}`] : [])),
    );
    expect(hits).toEqual([]);
  });
});
