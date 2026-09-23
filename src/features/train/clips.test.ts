import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { distinctPrescribedKeys } from '../../content';
import { CLIP_STEMS, STAND_INS, clipFor } from './clips';

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
    const missing = [...distinctPrescribedKeys()].filter((key) => clipFor(key) === null).sort();
    expect(missing, `sem clipe: ${missing.join(', ')}`).toEqual([]);
  });

  it('borrows only clips that exist, and never for an exercise that has its own', () => {
    for (const [stem, borrowed] of Object.entries(STAND_INS)) {
      expect(CLIP_STEMS.has(borrowed), borrowed).toBe(true);
      expect(CLIP_STEMS.has(stem), `${stem} já tem clipe: tira a linha`).toBe(false);
    }
  });
});
