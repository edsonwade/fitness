import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { distinctPrescribedKeys } from '../../content';
import { CLIP_STEMS, HELD_FOR_QUALITY, STAND_INS, clipFor, clipStem } from './clips';

/**
 * The clip list and `public/video/` must say the same thing, in both directions: a stem
 * the list names without its three files is a 404 on his screen, and a clip in the
 * folder the list forgets is a demonstration he never sees.
 */
const folder = fileURLToPath(new URL('../../../public/video/', import.meta.url));
const files = new Set(readdirSync(folder));

describe('clips', () => {
  it('names only stems whose webm, mp4 and first frame all exist', () => {
    for (const stem of CLIP_STEMS) {
      for (const ext of ['webm', 'mp4', 'jpg']) {
        expect(files.has(`ex-${stem}.${ext}`), `ex-${stem}.${ext}`).toBe(true);
      }
    }
  });

  it('forgets no clip that is in the folder', () => {
    const stems = [...files]
      .filter((name) => /^ex-.+\.webm$/.test(name))
      .map((name) => name.slice(3, -5));
    expect(stems.sort()).toEqual([...CLIP_STEMS].sort());
  });

  it('turns an exercise key into its clip, and a key without one into null', () => {
    expect(clipFor('dbohp')?.webm).toMatch(/video\/ex-dbohp\.webm$/);
    expect(clipFor('dbohp')?.mp4).toMatch(/video\/ex-dbohp\.mp4$/);
    expect(clipFor('dbohp')?.poster).toMatch(/video\/ex-dbohp\.jpg$/);
    expect(clipFor('no_such_exercise')).toBeNull();
  });

  /*
   * Correção dele, 2026-09-22: "another froze imagem and not video run demostrate". A
   * tarefa 5 foi dada como feita com 14 clipes e o resto do programa em foto parada.
   * Este teste é o que teria apanhado isso: cada exercício do programa partilhado tem
   * a sua demonstração, e a mensagem de falha diz quais faltam.
   */
  it('gives every exercise of the shared programme a clip', () => {
    const missing = [...distinctPrescribedKeys()]
      .filter((key) => clipFor(key) === null && !HELD_FOR_QUALITY.has(clipStem(key)))
      .sort();
    expect(missing, `sem clipe: ${missing.join(', ')}`).toEqual([]);
  });

  /*
   * Ele, 2026-09-27: "tem que aparecer o corpo todo e a máquina de exercícios". Cada
   * clipe sai da janela que scripts/clips/frame.py escolheu (a origem inteira, nunca
   * apertada ao corpo) e leva o veredicto do portão. Um clipe feito à mão, sem janela,
   * ou que ninguém mediu, falha aqui.
   */
  it('cuts every clip from the window frame.py chose, with the gate recorded', () => {
    const manifest = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../../scripts/clips/manifest.json', import.meta.url)), 'utf8'),
    ) as { clips: { stem: string; window?: number[]; gate?: string }[] };
    const byStem = new Map(manifest.clips.map((c) => [c.stem, c]));
    for (const stem of CLIP_STEMS) {
      const clip = byStem.get(stem);
      expect(clip?.window, `${stem}: sem janela no manifest`).toHaveLength(4);
      expect(clip?.gate, `${stem}: sem portão`).toBeTruthy();
    }
  });

  /*
   * Ele, 2026-09-27 21:30: "não podemos ter vídeos com má qualidade". O portão de
   * qualidade de scripts/clips/make.mjs (ampliação e nitidez) decide; um clipe chumbado
   * não se oferece — o exercício fica com a foto, sem ▶ e sem "Ver demonstração", até
   * haver substituto aprovado por ele. A lista e o manifest dizem o mesmo.
   */
  it('holds back exactly the clips the quality gate failed, and offers none of them', () => {
    const manifest = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../../scripts/clips/manifest.json', import.meta.url)), 'utf8'),
    ) as { clips: { stem: string; quality?: { verdict?: string } }[] };
    const failed = manifest.clips.filter((c) => c.quality?.verdict !== 'ok').map((c) => c.stem);
    expect([...HELD_FOR_QUALITY].sort()).toEqual(failed.sort());
    for (const stem of HELD_FOR_QUALITY) expect(clipFor(stem), stem).toBeNull();
  });

  it('borrows only clips that exist, and never for an exercise that has its own', () => {
    for (const [stem, borrowed] of Object.entries(STAND_INS)) {
      expect(CLIP_STEMS.has(borrowed), borrowed).toBe(true);
      expect(CLIP_STEMS.has(stem), `${stem} já tem clipe: tira a linha`).toBe(false);
    }
  });
});
