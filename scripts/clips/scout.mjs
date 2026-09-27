#!/usr/bin/env node
/**
 * Batedor de fontes novas — skill demonstracao-inteira-e-com-mostrador.
 *
 * Para cada id do Pexels: descarrega a versão baixa (?w=640) para .cache/low, passa os
 * primeiros 12 s pelo portão de frame.py (cabeça e pés à vista, nada fora da imagem) e
 * diz se passa. Os que passam ganham uma tira de 8 frames em .cache/low/<id>-strip.png,
 * para se ver com os olhos se é o exercício certo — o portão não sabe o que é um
 * exercício, só se o corpo está inteiro.
 *
 * Uso:  node scripts/clips/scout.mjs <stem> <id> [id ...]
 * Grava scripts/clips/.cache/scout/<stem>.json  ({ id: { dur, src, fails } })
 */
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOW = join(HERE, '.cache/low');
const OUT = join(HERE, '.cache/scout');
mkdirSync(LOW, { recursive: true });
mkdirSync(OUT, { recursive: true });
const run = promisify(execFile);

function probe(file) {
  try {
    return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'csv=p=0', file], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) || null;
  } catch {
    return null;
  }
}

function fetchLow(id) {
  const file = join(LOW, `${id}.mp4`);
  if (existsSync(file) && probe(file)) return file;
  for (const w of [640, 720, 960, 540, 1280, 1080]) {
    try {
      execFileSync('curl', ['-sSLf', '-A', 'Mozilla/5.0', '-o', file,
        `https://www.pexels.com/download/video/${id}/?w=${w}`]);
      if (probe(file)) return file;
    } catch {
      /* esta largura não existe: a seguinte */
    }
  }
  return null;
}

async function scout(id) {
  const file = fetchLow(id);
  if (!file) return { fails: ['não descarregou'] };
  const dur = probe(file);
  const { stdout } = await run(join(HERE, '.venv/bin/python'),
    [join(HERE, 'frame.py'), file, '0', String(Math.min(dur, 12))], { maxBuffer: 1 << 20 });
  const r = JSON.parse(stdout);
  {
    // A tira faz-se sempre: o portão chumba às vezes por um pé escondido atrás da
    // máquina, e a palavra final é a dos olhos.
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf',
      `fps=8/${dur},scale=200:200:force_original_aspect_ratio=decrease,pad=200:200:(ow-iw)/2:(oh-ih)/2,` +
      `drawtext=text='${id} %{pts\\:hms}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black,` +
      'tile=8x1:padding=2', '-frames:v', '1', join(LOW, `${id}-strip.png`)]);
  }
  return { dur: Math.round(dur * 10) / 10, src: r.src, cut: `${r.cut}/${r.frames}`, fails: r.fails };
}

const [stem, ...ids] = process.argv.slice(2);
const file = join(OUT, `${stem}.json`);
const found = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
const todo = ids.filter((id) => !found[id]);
// Três de cada vez: o modelo heavy da pose é pesado.
for (let i = 0; i < todo.length; i += 3) {
  const batch = todo.slice(i, i + 3);
  const res = await Promise.all(batch.map((id) => scout(id).catch((e) => ({ fails: [String(e.message).slice(0, 80)] }))));
  batch.forEach((id, k) => {
    found[id] = res[k];
  });
  writeFileSync(file, JSON.stringify(found, null, 1));
}
for (const [id, r] of Object.entries(found)) {
  console.log(`${r.fails.length ? 'chumba' : 'PASSA '} ${stem} ${id} ${r.dur ?? ''}s ${r.cut ?? ''} ${r.fails.join('; ')}`);
}
