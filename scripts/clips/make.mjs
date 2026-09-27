#!/usr/bin/env node
/**
 * Os clipes de demonstração, todos no mesmo molde — skills clipes-como-a-ladder e
 * demonstracao-inteira-e-com-mostrador
 * (.claude/skills/demonstracao-inteira-e-com-mostrador/SKILL.md).
 *
 * Pedido dele, 2026-09-27: "tem que aparecer o corpo todo e a máquina de exercícios".
 *
 * O MOLDE (720×1280, sem som, em ciclo): a JANELA 9:16 que frame.py escolhe, cortada da
 * origem e posta de borda a borda. A janela tem a altura inteira da origem, por isso
 * nunca se corta nada que a origem mostre do corpo nem da máquina. Só quando a pessoa é
 * mais larga do que 9:16 (deitada, de lado) a janela sai da origem em cima e em baixo, e
 * essas faixas enchem-se com o próprio trecho desfocado — nunca escurecido (B1 de
 * .claude/skills/clipes-como-a-ladder/PLANO.md).
 *
 * Uso:  node scripts/clips/make.mjs [stem ...]          (sem argumentos: todos)
 *       node scripts/clips/make.mjs --frame [stem ...]  corre frame.py e grava a janela
 *       node scripts/clips/make.mjs --check             todos têm janela? quais chumbam?
 *       node scripts/clips/make.mjs --quality [stem ...] mede a nitidez sem refazer (T5)
 * Lê    scripts/clips/manifest.json (start/end, window, gate, quality)
 * Grava public/video/ex-<stem>.{mp4,webm,jpg}
 * Cache scripts/clips/.cache/ (as fontes descarregadas; fora do git)
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const CACHE = join(HERE, '.cache');
const OUT = join(ROOT, 'public/video');

export const FRAME = { w: 720, h: 1280 };
const PY = join(HERE, '.venv/bin/python');

const MANIFEST = join(HERE, 'manifest.json');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

/** A fonte no disco: descarregada do Pexels uma vez, ou a cópia do clipe antigo. */
function sourceFile(clip) {
  mkdirSync(CACHE, { recursive: true });
  const src = clip.source;
  if (src.kind === 'pexels') {
    const file = join(CACHE, `pexels-${src.id}.mp4`);
    if (!existsSync(file)) {
      // 1080p em vez da 4K (a 4K são ~100 MB por clipe): deitado é w=1920, ao alto w=1080.
      // O Pexels responde 404 à largura que não tem, e passa-se à seguinte.
      const ok = [1920, 1080, 1280, 720, 0].some((w) => {
        try {
          run('curl', ['-sSLf', '-A', 'Mozilla/5.0', '-o', file,
            `https://www.pexels.com/download/video/${src.id}/${w ? `?w=${w}` : ''}`]);
          return true;
        } catch {
          return false;
        }
      });
      if (!ok) throw new Error(`${clip.stem}: o Pexels ${src.id} não descarregou`);
    }
    return file;
  }
  if (src.kind === 'local') {
    // O clipe antigo guarda-se na cache ANTES de o novo lhe escrever por cima.
    const file = join(CACHE, `local-${clip.stem}.mp4`);
    if (!existsSync(file)) copyFileSync(join(ROOT, src.file), file);
    return file;
  }
  throw new Error(`${clip.stem}: fonte desconhecida ${src.kind}`);
}

/** frame.py sobre o trecho: a janela e o portão, gravados no manifest. */
export function frame(clip) {
  const out = JSON.parse(execFileSync(PY, [join(HERE, 'frame.py'), sourceFile(clip),
    String(clip.start), String(clip.end)], { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  if (!out.window) throw new Error(`${clip.stem}: ${out.fails.join('; ') || 'sem corpo'}`);
  clip.window = out.window;
  clip.gate = out.fails.length ? out.fails.join('; ') : 'ok';
  return out;
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

/*
 * O portão de qualidade (T5 da skill demonstracao-inteira-e-com-mostrador; ele, 2026-09-27
 * 21:30: "não podemos ter vídeos com má qualidade"). Chumba o clipe que amplia a origem
 * mais de 1,5× ou cuja parte que vem da origem é mole. Calibrado a olho, a 1:1: hammer
 * (45), dbcurl (34) e legraise (1,78×) moles; pulldown (66), csrow, lateral e strarm
 * nítidos. As origens 606×1080 ampliadas 1,19× passam quando são nítidas.
 */
export const QUALITY = { maxUpscale: 1.5, minSharp: 50 };

function sourceHeight(file) {
  return parseInt(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=height', '-of', 'csv=p=0', file]).toString(), 10);
}

/** A parte do 720×1280 que vem da origem, em píxeis: o resto é fundo desfocado. */
function sourceRect(clip) {
  const [wx, wy, ww, wh] = clip.window;
  const ix0 = Math.max(wx, 0), iy0 = Math.max(wy, 0);
  const ix1 = Math.min(wx + ww, 1), iy1 = Math.min(wy + wh, 1);
  return [((ix0 - wx) / ww) * FRAME.w, ((iy0 - wy) / wh) * FRAME.h,
    ((ix1 - ix0) / ww) * FRAME.w, ((iy1 - iy0) / wh) * FRAME.h].map((n) => Math.round(n));
}

/** Mede o clipe feito e grava `quality` no manifest: ampliação, nitidez e veredicto. */
export function quality(clip) {
  const upscale = +(FRAME.h / (clip.window[3] * sourceHeight(sourceFile(clip)))).toFixed(2);
  const sharp = Number(execFileSync(PY, [join(HERE, 'quality.py'), join(OUT, `ex-${clip.stem}.mp4`),
    ...sourceRect(clip).map(String)], { stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim());
  const fails = [];
  if (upscale > QUALITY.maxUpscale) fails.push(`amplia a origem ${upscale}×`);
  if (sharp < QUALITY.minSharp) fails.push(`mole (nitidez ${sharp} < ${QUALITY.minSharp})`);
  clip.quality = { upscale, sharp, verdict: fails.length ? fails.join('; ') : 'ok' };
  return clip.quality;
}

function filter(clip) {
  // A janela é em FRAÇÕES da origem [x, y, largura, altura], e pode sair de [0, 1].
  const [wx, wy, ww, wh] = clip.window;
  const ix0 = Math.max(wx, 0), iy0 = Math.max(wy, 0);
  const ix1 = Math.min(wx + ww, 1), iy1 = Math.min(wy + wh, 1);
  const crop = `crop=iw*${ix1 - ix0}:ih*${iy1 - iy0}:iw*${ix0}:ih*${iy0}`;
  const speed = clip.speed ?? 1;
  // Fontes filmadas num ginásio escuro levantam-se com gama (B1).
  const lift = clip.gamma ? `,eq=gamma=${clip.gamma}:saturation=1.05` : '';
  const head = `[0:v]trim=start=${clip.start}:end=${clip.end},setpts=(PTS-STARTPTS)/${speed},fps=30,${crop}${lift}`;
  const eps = 0.002;
  const pad = { l: wx < -eps, t: wy < -eps, r: wx + ww > 1 + eps, b: wy + wh > 1 + eps };
  if (!pad.l && !pad.t && !pad.r && !pad.b) {
    return `${head},scale=${FRAME.w}:${FRAME.h}:flags=lanczos,setsar=1,format=yuv420p[v]`;
  }
  const pw = even(((ix1 - ix0) / ww) * FRAME.w), ph = even(((iy1 - iy0) / wh) * FRAME.h);
  const px = Math.round(((ix0 - wx) / ww) * FRAME.w), py = Math.round(((iy0 - wy) / wh) * FRAME.h);
  // Só as bordas que dão para o fundo desfocado se esbatem, para não parecer um cartão.
  const d = [pad.l && 'X', pad.r && '(W-1-X)', pad.t && 'Y', pad.b && '(H-1-Y)'].filter(Boolean);
  const dist = d.reduce((acc, e) => (acc ? `min(${acc},${e})` : e), '');
  return [
    `${head},split=2[a][b]`,
    `[a]scale=${pw}:${ph}:flags=lanczos,setsar=1,format=yuva420p,` +
      `geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='255*clip(${dist}/28,0,1)'[fg]`,
    `[b]scale=${FRAME.w}:${FRAME.h}:force_original_aspect_ratio=increase,crop=${FRAME.w}:${FRAME.h},` +
      `boxblur=20:2,eq=brightness=0:saturation=0.9,setsar=1[bg]`,
    `[bg][fg]overlay=x=${px}:y=${py},format=yuv420p[v]`,
  ].join(';');
}

function make(clip) {
  const src = sourceFile(clip);
  const base = join(OUT, `ex-${clip.stem}`);
  const common = ['-v', 'error', '-y', '-i', src, '-filter_complex', filter(clip), '-map', '[v]', '-an'];
  // Um keyframe por segundo (T5): o loop e os saltos não esperam pela descodificação do
  // clipe todo desde o princípio.
  run('ffmpeg', [...common, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-g', '30',
    '-movflags', '+faststart', `${base}.mp4`]);
  run('ffmpeg', [...common, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-row-mt', '1', '-g', '30',
    '-deadline', 'good', '-cpu-used', '4',
    `${base}.webm`]);
  // O poster é o primeiro frame do próprio clipe: é o que se vê durante a contagem.
  run('ffmpeg', ['-v', 'error', '-y', '-i', `${base}.mp4`, '-frames:v', '1', '-q:v', '2', `${base}.jpg`]);
  const q = quality(clip);
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`ex-${clip.stem}  ${(clip.end - clip.start) / (clip.speed ?? 1)}s  qualidade ${q.verdict}`);
}

const args = process.argv.slice(2);
const mode = args[0]?.startsWith('--') ? args.shift() : null;
const wanted = new Set(args);
const picked = manifest.clips.filter((c) => !wanted.size || wanted.has(c.stem));

if (mode === '--check') {
  const missing = manifest.clips.filter((c) => !c.window);
  // `seen`: conferido com os olhos na folha de frames — o corpo está inteiro, e o portão
  // chumbava por um pé escondido atrás da máquina. A folha é a última palavra.
  const cut = manifest.clips.filter((c) => c.gate && c.gate !== 'ok' && !c.seen);
  for (const c of cut) console.log(`CHUMBA ${c.stem}: ${c.gate}`);
  for (const c of missing) console.log(`SEM JANELA ${c.stem}`);
  const soft = manifest.clips.filter((c) => c.quality?.verdict !== 'ok');
  for (const c of soft) console.log(`QUALIDADE ${c.stem}: ${c.quality?.verdict ?? 'nunca medido'}`);
  const bad = new Set([...missing, ...cut, ...soft]);
  console.log(`${manifest.clips.length - bad.size}/${manifest.clips.length} passam`);
  process.exit(bad.size ? 1 : 0);
}
if (mode === '--quality') {
  for (const clip of picked) console.log(`${clip.stem.padEnd(12)} ${JSON.stringify(quality(clip))}`);
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
  process.exit(0);
}
for (const clip of picked) {
  if (mode === '--frame' || !clip.window) {
    frame(clip);
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`);
    console.log(`${clip.stem}  janela ${clip.window.join(' ')}  ${clip.gate}`);
  }
  if (mode !== '--frame') make(clip);
}
