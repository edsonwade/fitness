/**
 * The content test: schema, invariants and counts.
 *
 * This file used to carry a second half — `describe('port fidelity against
 * old/js/data.js')` — that loaded `old/js/data.js` at test time and asserted that
 * every exercise, video and day slot still matched it field for field. That half
 * was removed on 2026-09-21.
 *
 * Why: the app is new and `old/` is not the source of anything. The folder stays on
 * disk, but nothing reads it ("deixa a pasta aí e para de olhar nesta pasta"). A test
 * that pins the new content to the old file makes the old app the specification,
 * which is the opposite of the rule — see `.claude/memory/app-nova-old-nao-e-fonte`
 * and the *App nova* section of `CLAUDE.md`. What the app prescribes now comes from
 * the approved prototype in `proto/v2/`, so that is what a divergence must be checked
 * against, by eye, frame by frame.
 *
 * What stays here outlives the port and does not look at `old/`: the schema check,
 * the invariants, the counts, and the handful of product truths that a generated
 * progression would have got wrong.
 */

import { describe, expect, it } from 'vitest';

import { LOCALES, type Locale } from '../i18n';
import {
  BLOCKS,
  CARDIO,
  CONTENT,
  CONTENT_INVARIANTS,
  DAYS,
  EXERCISES,
  MUSCLES,
  countDaySlots,
  distinctPrescribedKeys,
  validateContent,
} from './index';


describe('preserved content', () => {
  it('passes its own schema and invariant validation', () => {
    expect(() => validateContent()).not.toThrow();
  });

  it('holds exactly the counts the plan preserves', () => {
    expect(Object.keys(EXERCISES)).toHaveLength(CONTENT_INVARIANTS.exercises);
    expect(Object.keys(CARDIO)).toHaveLength(CONTENT_INVARIANTS.cardio);
    expect(DAYS).toHaveLength(CONTENT_INVARIANTS.days);
    expect(countDaySlots()).toBe(CONTENT_INVARIANTS.daySlots);
    expect(BLOCKS).toHaveLength(CONTENT_INVARIANTS.blocks);
    expect(Object.keys(MUSCLES)).toHaveLength(CONTENT_INVARIANTS.muscles);
  });

  it('prescribes 34 distinct exercises and keeps the two documented swap alternatives', () => {
    const prescribed = distinctPrescribedKeys();
    expect(prescribed.size).toBe(CONTENT_INVARIANTS.distinctPrescribed);

    // Exercises defined with videos and technique text that appear on no day. Two of
    // them (birddog, legcurl_l) were already here: they are named as swap alternatives
    // inside other exercises' notes. The other nine dropped out of the weekly plan on
    // 2026-09-21, when the shared week went from five training days to four plus the
    // Full Body. They stay in the catalogue and stay addable to any day; what they lost
    // is a prescribed slot — and with it the per-slot note some of them carried.
    const unprescribed = Object.keys(EXERCISES).filter((key) => !prescribed.has(key));
    expect(unprescribed.sort()).toEqual([
      'birddog',
      'cablecrunch',
      'dbrdl',
      'dip',
      'facepull',
      'kickback',
      'legcurl_l',
      'legpress_h',
      'legraise',
      'pallof',
      'plank',
    ]);
  });

  it('never prescribes an exercise it does not define', () => {
    const unknown = DAYS.flatMap((day) =>
      (day.items ?? []).map((item) => item.ex).filter((key) => !(key in EXERCISES)),
    );
    expect(unknown).toEqual([]);
  });

  it('keeps both rest days empty and the Full Body at eighteen slots', () => {
    // The shared week of 2026-09-21. Thursday joined Sunday as a rest day, and
    // Saturday became the Full Body, which is why the shape is so lopsided.
    expect(DAYS.map((day) => day.items?.length ?? 0)).toEqual([6, 6, 6, 0, 6, 18, 0]);
    for (const rest of [DAYS[3], DAYS[6]]) {
      expect(rest.type).toBe('rest');
      expect(rest.items).toBeUndefined();
    }
  });

  it('gives the Full Body six groups of three and sixty sets', () => {
    // His order, in two sentences of his own: "peito + costa + bíceps + shoulder +
    // triceps + legs, é combinação de todos" and "full body é 3 exercícios por grupo".
    // The sets are counted off the prescriptions rather than restated, so a changed
    // prescription cannot leave this number quietly wrong.
    const full = DAYS[5];
    expect(full.name.pt).toBe('Full Body');
    expect(full.items).toHaveLength(18);
    const sets = (full.items ?? []).reduce((total, item) => total + item.b1.s, 0);
    expect(sets).toBe(60);
  });

  it('keeps weight, reps and RPE as text, never coerced to numbers', () => {
    // "— preencher" is a real load in this programme: a lift whose working weight has
    // not been set yet. A numeric field would have destroyed it, which is why the
    // schema types these as strings. (The per-side rep count "10/lado" used to be the
    // example here; it belonged to the Pallof press, which the week of 2026-09-21
    // dropped from the plan.)
    const unset = DAYS.flatMap((day) => day.items ?? []).filter(
      (item) => item.b1.l.pt === '— preencher',
    );
    expect(unset.length).toBeGreaterThan(0);
    for (const item of DAYS.flatMap((day) => day.items ?? [])) {
      expect(typeof item.b1.r).toBe('string');
      expect(typeof item.b1.rpe).toBe('string');
      // The load is the one field of a prescription that carries words next to the
      // number, so since Passo F it carries four of them. Still text, never coerced.
      for (const locale of LOCALES) expect(typeof item.b1.l[locale]).toBe('string');
    }
  });

  it('keeps the authored per-slot notes that a generator would not have written', () => {
    // This used to assert the Romanian deadlift's back caution — "RPE 8 max even in
    // the heavy block", where prog() would have written 8-9. That slot is gone: the
    // week of 2026-09-21 dropped dbrdl from the plan, and its prescription went with
    // it. The exercise and its technique text stay in the catalogue; the cap does not.
    // Worth saying out loud rather than deleting the test in silence.
    const noted = DAYS.flatMap((day) => day.items ?? []).filter((item) => item.note);
    // cablecurl carries its note twice: it is prescribed on Friday and again inside
    // Saturday's Full Body, and the note travels with the slot.
    expect([...new Set(noted.map((item) => item.ex))].sort()).toEqual([
      'cablecurl',
      'hack',
      'ohext',
    ]);
    for (const item of noted) {
      for (const locale of LOCALES) expect(item.note?.[locale].length).toBeGreaterThan(0);
    }
  });
});

/**
 * A rede que impede o buraco de voltar.
 *
 * A 2026-09-22 ele mudou a app para espanhol e os nomes dos dias continuaram em
 * português. A casca tinha quatro línguas desde o Passo B e o conteúdo tinha duas —
 * e mesmo o inglês, que ESTAVA escrito, nunca chegava a um ecrã porque todos os
 * leitores estavam cravados em `.pt`.
 *
 * O tipo já impede metade disso: `localizedSchema` exige os quatro ramos, e um deles
 * em falta não compila. O que o tipo não vê é uma frase escrita em branco, uma lista
 * de passos com quatro linhas em português e três em francês, ou um ramo novo que
 * alguém acrescente sem tradutor. É isso que este teste percorre — `CONTENT` inteiro,
 * todos os nós, não uma amostra —, e é o irmão de `src/i18n/i18n.test.ts:44`, que faz
 * o mesmo à casca.
 */

/** Um nó localizado: um objeto com exatamente os quatro ramos e mais nada. */
function isLocalizedNode(value: unknown): value is Record<Locale, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === LOCALES.length && LOCALES.every((locale) => keys.includes(locale));
}

/** Todos os nós localizados de uma árvore, com a morada de cada um para o relatório. */
function localizedNodes(value: unknown, path = ''): [string, Record<Locale, unknown>][] {
  if (value === null || typeof value !== 'object') return [];
  if (isLocalizedNode(value)) return [[path, value]];
  const children = Array.isArray(value)
    ? value.map((child, i) => [`${path}[${i}]`, child] as const)
    : Object.entries(value).map(([key, child]) => [path === '' ? key : `${path}.${key}`, child] as const);
  return children.flatMap(([childPath, child]) => localizedNodes(child, childPath));
}

const NODES = localizedNodes(CONTENT);

describe('o conteúdo nas quatro línguas', () => {
  it('tem nós localizados em número que vale a pena percorrer', () => {
    // Uma guarda contra o próprio teste: se um dia `localizedNodes` deixar de
    // encontrar nada, os três testes abaixo passam sem verificar coisa nenhuma.
    expect(NODES.length).toBeGreaterThan(200);
  });

  it.each(LOCALES)('%s não deixa nenhuma frase do conteúdo por escrever', (locale: Locale) => {
    const vazios = NODES.filter(([, node]) => {
      const branch = node[locale];
      if (typeof branch === 'string') return branch.trim() === '';
      if (Array.isArray(branch)) {
        return branch.some((line) =>
          typeof line === 'string'
            ? line.trim() === ''
            : Object.values(line as Record<string, unknown>).some(
                (field) => typeof field === 'string' && field.trim() === '',
              ),
        );
      }
      return true;
    }).map(([path]) => path);

    expect(vazios, `${locale} tem conteúdo por escrever`).toEqual([]);
  });

  it.each(LOCALES)('%s tem listas do mesmo comprimento que o português', (locale: Locale) => {
    const desiguais = NODES.filter(([, node]) => {
      const source = node.pt;
      return Array.isArray(source) && (node[locale] as unknown[]).length !== source.length;
    }).map(([path]) => path);

    expect(desiguais, `${locale} tem listas de comprimento diferente`).toEqual([]);
  });

  it('não repete o português nas outras línguas onde devia traduzir', () => {
    /*
     * Repetir é legítimo: "Cardio", "Deload", "Plancha"/"Plancha" e os nomes próprios
     * de exercícios são iguais em mais do que uma língua, e `kg` é `kg` em todo o
     * lado. O que este teste apanha é o caso em que TODAS as quatro são a mesma
     * frase E essa frase é longa o suficiente para ser uma instrução — um passo de
     * técnica, um erro, um aviso. Isso não é uma palavra que coincide; é uma
     * tradução que não foi feita.
     */
    const porTraduzir = NODES.filter(([, node]) => {
      const source = node.pt;
      if (typeof source !== 'string' || source.length < 25) return false;
      return LOCALES.every((locale) => node[locale] === source);
    }).map(([path]) => path);

    expect(porTraduzir, 'frases longas iguais nas quatro línguas').toEqual([]);
  });
});
