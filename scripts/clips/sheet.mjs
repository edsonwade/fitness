#!/usr/bin/env node
/**
 * A folha de conferência de cada clipe — skill clipes-como-a-ladder.
 *
 * Seis frames de public/video/ex-<stem>.mp4, inteiros. Um clipe só passa se o corpo
 * todo e a máquina estiverem à vista em todos os frames (skill
 * demonstracao-inteira-e-com-mostrador).
 *
 * Uso:   node scripts/clips/sheet.mjs [stem ...]    (sem argumentos: todos)
 * Grava  scripts/clips/.sheets/ex-<stem>.png  (fora do git)
 *
 * Com --src <ficheiro> <início> <fim>, faz em vez disso a folha de uma FONTE, com o
 * tempo em cada frame — é assim que se escolhem o start e o end do manifest.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const SHEETS = join(HERE, '.sheets');
mkdirSync(SHEETS, { recursive: true });

function duration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'csv=p=0', file]).toString().trim());
}

const args = process.argv.slice(2);
if (args[0] === '--src') {
  const [, file, from = '0', to] = args;
  const end = to ? Number(to) : duration(file);
  const n = 12;
  const out = join(SHEETS, `src-${file.split('/').pop()}-${from}-${end}.png`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', from, '-to', String(end), '-i', file, '-vf',
    `fps=${n}/${end - Number(from)},scale=320:-2,drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=18:` +
    `fontcolor=yellow:box=1:boxcolor=black,tile=4x3:padding=4`, '-frames:v', '1', out]);
  console.log(out);
} else {
  const manifest = JSON.parse(readFileSync(join(HERE, 'manifest.json'), 'utf8'));
  const wanted = new Set(args);
  for (const { stem } of manifest.clips) {
    if (wanted.size && !wanted.has(stem)) continue;
    const file = join(ROOT, `public/video/ex-${stem}.mp4`);
    const d = duration(file);
    const out = join(SHEETS, `ex-${stem}.png`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf',
      `fps=6/${d},scale=240:-2,tile=6x1:padding=4`, '-frames:v', '1', out]);
    console.log(out);
  }
}
