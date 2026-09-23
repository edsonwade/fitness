import { describe, expect, it } from 'vitest';

import { DAYS, EXERCISES } from '../../content';
import type { ExerciseOverride } from '../../data/entities';
import { entryLogKey, resolveDayEntries } from './day-entries';
import { clipFor } from './clips';
import { EQUIP_IDS, VARIANTS, chosenVariant, equipIdOf, variantLogKey } from './variants';

/**
 * Trocar o equipamento é trocar de exercício — B2, B3 e B4 de
 * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`.
 */

const DAY = DAYS.find((d) => d.id === 1)!;

function override(equipment: string | null): ExerciseOverride {
  return {
    user_id: '00000000-0000-4000-8000-000000000001',
    updated_at: '2026-01-01T00:00:00Z',
    day_no: 1,
    ex_key: 'dbbench',
    name: null,
    equipment,
    sets: null,
    reps: null,
    load: null,
    rest: null,
    video_id: null,
    photo_url: null,
  };
}

function bench(equipment: string | null) {
  const { entries } = resolveDayEntries({
    day: DAY,
    dayNo: 1,
    block: 'b1',
    locale: 'pt',
    customs: [],
    overrides: equipment === null ? [] : [override(equipment)],
    hidden: [],
    order: [],
  });
  return entries.find((e) => e.key === 'dbbench')!;
}

describe('variants', () => {
  it('names only exercises of the programme, with no equipment twice', () => {
    for (const [key, list] of Object.entries(VARIANTS)) {
      expect(EXERCISES[key], key).toBeDefined();
      expect(new Set(list.map((v) => v.equip)).size, key).toBe(list.length);
      for (const v of list) {
        if (v.ex) expect(EXERCISES[v.ex], `${key} → ${v.ex}`).toBeDefined();
        /* A variante que não é outro exercício tem de ter nome — senão chamava-se como a de origem. */
        if (!v.ex && v !== list[0]) expect(v.name, `${key}@${v.equip}`).toBeDefined();
      }
    }
  });

  it('does not offer dumbbells on the leg press', () => {
    expect(VARIANTS.legpress).toBeUndefined();
  });

  it('reads the id and the old translated labels alike', () => {
    expect(equipIdOf('barbell')).toBe('barbell');
    expect(equipIdOf('Halteres')).toBe('dumbbells');
    expect(equipIdOf('Dumbbells')).toBe('dumbbells');
    expect(equipIdOf('Máquina de remo')).toBeNull();
    expect(EQUIP_IDS).toHaveLength(5);
  });

  it('treats the origin and unknown equipment as no variant', () => {
    expect(chosenVariant('dbbench', 'dumbbells')).toBeNull();
    expect(chosenVariant('dbbench', 'bodyweight')).toBeNull();
    expect(chosenVariant('legpress', 'barbell')).toBeNull();
    expect(chosenVariant('dbbench', 'barbell')?.equip).toBe('barbell');
  });

  it('keeps the origin sets under the exercise key and a variant under its own', () => {
    expect(variantLogKey('dbbench', null)).toBe('dbbench');
    expect(variantLogKey('dbbench', chosenVariant('dbbench', 'barbell'))).toBe('dbbench@barbell');
  });
});

describe('a day entry on a variant', () => {
  it('is the authored exercise with no override', () => {
    const entry = bench(null);
    expect(entry.equip).toBe('dumbbells');
    expect(entryLogKey(entry)).toBe('dbbench');
    expect(entry.clip).toEqual(clipFor('dbbench'));
  });

  it('on the barbell has its own name, its own sets and never the dumbbell video', () => {
    const entry = bench('barbell');
    expect(entry.equip).toBe('barbell');
    expect(entry.name).toBe('Supino com barra');
    expect(entry.equipment).toBe('Barra');
    expect(entryLogKey(entry)).toBe('dbbench@barbell');
    expect(entry.clip).toBeNull();
    expect(entry.photo).toBeNull();
  });

  it('back on the dumbbells, via an old translated label, is the origin again', () => {
    const entry = bench('Halteres');
    expect(entry.equip).toBe('dumbbells');
    expect(entryLogKey(entry)).toBe('dbbench');
    expect(entry.clip).toEqual(clipFor('dbbench'));
    expect(entry.equipment).toBe(EXERCISES.dbbench.eq.pt);
  });

  it('pointing at another exercise of the programme takes its clip', () => {
    const cable = VARIANTS.dbcurl.find((v) => v.equip === 'cable')!;
    expect(cable.ex).toBe('cablecurl');
    expect(clipFor(cable.ex!)).not.toEqual(clipFor('dbcurl'));
  });
});
