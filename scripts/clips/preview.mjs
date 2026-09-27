#!/usr/bin/env node
/**
 * Escolher a fonte de um exercício — skill clipes-como-a-ladder.
 *
 * Descarrega cada candidato do Pexels em baixa resolução (?w=640) e empilha, numa só
 * imagem, uma tira de 8 frames de cada um, com o id e o tempo escritos. É por esta folha
 * que se escolhe o clipe, o start/end e o recorte do manifest.
 *
 * Uso:   node scripts/clips/preview.mjs <nome> <id> [id ...]
 * Grava  scripts/clips/.sheets/pick-<nome>.png
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOW = join(HERE, '.cache/low');
const SHEETS = join(HERE, '.sheets');
mkdirSync(LOW, { recursive: true });
mkdirSync(SHEETS, { recursive: true });

/** A primeira largura que o Pexels tiver (responde 404 quando não a tem); 0 = a original. */
function fetchPexels(id, widths, file) {
  for (const w of widths) {
    try {
      execFileSync('curl', ['-sSLf', '-A', 'Mozilla/5.0', '-o', file,
        `https://www.pexels.com/download/video/${id}/${w ? `?w=${w}` : ''}`]);
      return;
    } catch {
      /* esta largura não existe: a seguinte */
    }
  }
}

function probe(file) {
  try {
    return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'csv=p=0', file], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()) || null;
  } catch {
    return null;
  }
}

const [name, ...ids] = process.argv.slice(2);
const strips = [];
for (const id of ids) {
  const file = join(LOW, `${id}.mp4`);
  // Um ficheiro que não abre (um 404 gravado) volta a descarregar-se por cima.
  let d = existsSync(file) ? probe(file) : null;
  if (!d) {
    fetchPexels(id, [640, 720, 960, 540, 1280, 1080, 1920, 0], file);
    d = probe(file);
  }
  if (!d) {
    console.error(`${id}: não descarregou`);
    continue;
  }
  const strip = join(LOW, `${id}-strip.png`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf',
    `fps=8/${d},scale=200:200:force_original_aspect_ratio=decrease,pad=200:200:(ow-iw)/2:(oh-ih)/2,` +
    `drawtext=text='${id} %{pts\\:hms}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black,` +
    `tile=8x1:padding=2`, '-frames:v', '1', strip]);
  strips.push(strip);
  console.log(`${id}  ${d.toFixed(1)}s`);
}
if (strips.length) {
  const out = join(SHEETS, `pick-${name}.png`);
  const inputs = strips.flatMap((s) => ['-i', s]);
  const vf = strips.length > 1 ? `vstack=inputs=${strips.length}` : 'null';
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', vf, out]);
  console.log(out);
}
