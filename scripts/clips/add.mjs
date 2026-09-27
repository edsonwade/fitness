#!/usr/bin/env node
/**
 * Um vídeo novo de demonstração, de uma vez — skill demonstracao-inteira-e-com-mostrador
 * (.claude/skills/demonstracao-inteira-e-com-mostrador/SKILL.md).
 *
 * Pedido dele, 2026-09-27: "quando eu colocar novos vídeos que os mesmos aparecem
 * completos". O vídeo nunca entra à mão: entra por aqui, e passa pelo mesmo portão que
 * os outros.
 *
 *   1. acrescenta-o a manifest.json (fonte local, trecho start–end);
 *   2. frame.py encontra o corpo e escolhe a janela 9:16 com a origem inteira;
 *   3. se a própria origem corta o corpo, CHUMBA — diz porquê e sai do manifest;
 *   4. senão make.mjs faz public/video/ex-<stem>.{mp4,webm,jpg} e sheet.mjs a folha.
 *
 * Uso:  npm run clips:add -- <ficheiro> <stem> [start] [end]
 *       (sem start/end: o vídeo todo)
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const MANIFEST = join(HERE, 'manifest.json');

const [file, stem, from, to] = process.argv.slice(2);
if (!file || !stem || !/^[a-z0-9]+$/.test(stem)) {
  console.error('uso: npm run clips:add -- <ficheiro> <stem> [start] [end]   (stem: a-z0-9)');
  process.exit(2);
}
const path = resolve(process.cwd(), file);
if (!existsSync(path)) {
  console.error(`não existe: ${path}`);
  process.exit(2);
}
const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
  '-of', 'csv=p=0', path]).toString().trim());

const read = () => JSON.parse(readFileSync(MANIFEST, 'utf8'));
const write = (m) => writeFileSync(MANIFEST, `${JSON.stringify(m, null, 1)}\n`);

const manifest = read();
const clip = {
  stem,
  source: { kind: 'local', file: relative(ROOT, path) },
  start: from ? Number(from) : 0,
  end: to ? Number(to) : Math.floor(duration * 10) / 10,
};
manifest.clips = manifest.clips.filter((c) => c.stem !== stem).concat(clip);
// A cópia na cache é a que make.mjs lê: um vídeo novo com o mesmo stem substitui-a.
mkdirSync(join(HERE, '.cache'), { recursive: true });
copyFileSync(path, join(HERE, '.cache', `local-${stem}.mp4`));
write(manifest);

const node = (script, ...args) =>
  execFileSync(process.execPath, [join(HERE, script), ...args], { stdio: 'inherit' });

node('make.mjs', '--frame', stem);
const gate = read().clips.find((c) => c.stem === stem).gate;
if (gate !== 'ok') {
  const m = read();
  m.clips = m.clips.filter((c) => c.stem !== stem);
  write(m);
  console.error(`\nCHUMBA ${stem}: ${gate}\nO vídeo não entrou. Precisa de outro em que o corpo todo esteja na imagem.`);
  process.exit(1);
}
node('make.mjs', stem);
node('sheet.mjs', stem);
console.log(`\nex-${stem} feito. Confere a folha em scripts/clips/.sheets/ex-${stem}.png e liga-o em src/features/train/clips.ts.`);
