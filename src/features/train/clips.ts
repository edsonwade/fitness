/**
 * The demonstration clips that ship with the app, and nothing else.
 *
 * A demonstration is a local clip in `public/video/ex-<stem>.{webm,mp4}` with its first
 * frame as `ex-<stem>.jpg`. There is no YouTube anywhere any more — his words,
 * 2026-09-22: "se à partida escolhes o exercício e aparece demonstração, não faz mais
 * sentido ter vídeo do link do YouTube". An exercise without a clip shows its photo,
 * with no play button and no Vídeo chip.
 *
 * The list is written out instead of guessed so the app never asks for a file that
 * 404s; `clips.test.ts` holds it against the folder in both directions.
 */
export const CLIP_STEMS: ReadonlySet<string> = new Set([
  'cablecurl',
  'calfs',
  'cgbench',
  'csrow',
  'dbbench',
  'dbcurl',
  'dbohp',
  'dbrdl',
  'dip',
  'hack',
  'hammer',
  'hipthrust',
  'incldb',
  'kickback',
  'lateral',
  'legext',
  'legpress',
  'legpressh',
  'legraise',
  'lunge',
  'ohext',
  'pallof',
  'pecdeck',
  'plank',
  'pulldown',
  'pushdown',
  'reardelt',
  'seatedrow',
  'skull',
  'strarm',
]);

/**
 * Clips the quality gate of `scripts/clips/make.mjs` failed — upscaled more than 1.5× or
 * soft (skill `demonstracao-inteira-e-com-mostrador`, T5; his words, 2026-09-27 21:30:
 * "não podemos ter vídeos com má qualidade"). They stay in the folder but are never
 * offered: the exercise shows its photo, with no play button and no demonstration chip,
 * until a replacement he approves passes the gate. `clips.test.ts` holds this list
 * against the manifest.
 */
export const HELD_FOR_QUALITY: ReadonlySet<string> = new Set([
  'cablecurl',
  'calfs',
  'cgbench',
  'dbbench',
  'dbcurl',
  'incldb',
  'ohext',
  'seatedrow',
  'skull',
]);

/**
 * A velocidade a que passa a demonstração: metade da real. T6 da skill
 * `demonstracao-inteira-e-com-mostrador` (ele, 2026-09-27): "não podem ser muito rápidos
 * porque senão não se aprende nada". Os clipes não são recodificados — é o leitor que
 * abranda, por isso a qualidade da imagem não muda.
 */
export const DEMO_RATE = 0.5;

export type Clip = {
  webm: string;
  mp4: string;
  /** The clip's first frame, which is what shows while the count runs. */
  poster: string;
};

/**
 * Provisional stand-ins, his order of 2026-09-23: every exercise gets a clip now, and the
 * ones that borrow the closest movement get their own recording later. Each line here is
 * a demonstration that is not quite the exercise; when `ex-<stem>` lands in
 * `public/video/`, the line goes.
 */
export const STAND_INS: Readonly<Record<string, string>> = {
  calfseat: 'calfs', // gémeos sentado ← gémeos em pé
  legcurlseat: 'legext', // flexora sentado ← extensora (a mesma máquina sentada)
};

/** The same stem convention `builtinPoster` uses for `public/img/`. */
export function clipStem(exKey: string): string {
  const stem = exKey.replace('_', '');
  return CLIP_STEMS.has(stem) ? stem : (STAND_INS[stem] ?? stem);
}

export function clipFor(exKey: string): Clip | null {
  const stem = clipStem(exKey);
  if (!CLIP_STEMS.has(stem) || HELD_FOR_QUALITY.has(stem)) return null;
  const base = `${import.meta.env.BASE_URL}video/ex-${stem}`;
  return { webm: `${base}.webm`, mp4: `${base}.mp4`, poster: `${base}.jpg` };
}

/**
 * A clip the person uploaded from the exercise sheet (`uploadExerciseVideo`).
 *
 * Its public URL is kept in `video_id`, the column that used to hold a YouTube id. Only a
 * full `https://` URL is a clip: a leftover YouTube id is not a file this app can play,
 * so it stays ignored exactly as it was. The file is whatever the phone recorded, mp4 or
 * mov, so it travels in `mp4` with no `webm` twin and no poster of its own — the
 * exercise photo stands in when there is one.
 */
export function uploadedClip(videoId: string | null | undefined, poster: string | null): Clip | null {
  const url = videoId?.trim();
  if (!url || !/^https:\/\//i.test(url)) return null;
  return { webm: '', mp4: url, poster: poster ?? '' };
}
