import { describe, expect, it } from 'vitest';

import {
  DICTIONARIES,
  FALLBACK,
  LOCALES,
  LOCALE_NAMES,
  detectLocale,
  isLocale,
  type Locale,
} from './index';

/**
 * The four dictionaries, held to the same shape and to being actually written.
 *
 * `satisfies Copy` already fails the build when a key goes missing or a key nobody
 * asked for appears, and that is the real guard. This file covers the two things a
 * type cannot see: a value that is present and EMPTY, and a nested object that has
 * the right keys in the wrong shape. A translator who leaves `errName: ''` ships a
 * form that refuses to save and says nothing about why, and the compiler is happy.
 *
 * The language chooser is here too, because "which language do we open in" is the one
 * piece of this that runs before anybody can see it go wrong.
 */

/** Every leaf path in a dictionary, as "train.readiness.kg". */
function paths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    paths(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

function leaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leaves(child, prefix === '' ? key : `${prefix}.${key}`),
  );
}

const reference = paths(DICTIONARIES[FALLBACK]).sort();

describe('os quatro dicionários', () => {
  it('são quatro, e o português é a origem', () => {
    expect(LOCALES).toEqual(['pt', 'en', 'es', 'fr']);
    expect(FALLBACK).toBe('pt');
  });

  it.each(LOCALES)('%s tem exatamente as mesmas chaves que o português', (locale: Locale) => {
    expect(paths(DICTIONARIES[locale]).sort()).toEqual(reference);
  });

  it.each(LOCALES)('%s não deixa nenhuma frase por escrever', (locale: Locale) => {
    const vazias = leaves(DICTIONARIES[locale])
      .filter(([, value]) => value.trim() === '')
      .map(([path]) => path);
    expect(vazias, `${locale} tem chaves vazias`).toEqual([]);
  });

  /*
   * O nome de cada língua escreve-se NA PRÓPRIA LÍNGUA, e é por isso que esta lista
   * existe fora dos dicionários: quem procura francês procura "Français", e não a
   * palavra "Francês" escrita em português.
   */
  it('nomeia cada língua na própria língua', () => {
    expect(LOCALE_NAMES).toEqual({
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
    });
  });
});

describe('escolher a língua de arranque', () => {
  it('aceita as quatro e recusa o resto', () => {
    expect(isLocale('pt')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  /* `pt-BR`, `pt-PT` e `pt` são todos português para esta app. Só o subtag conta. */
  it('lê só a primeira parte da etiqueta do browser', () => {
    expect(detectLocale(['pt-BR'])).toBe('pt');
    expect(detectLocale(['en-GB'])).toBe('en');
    expect(detectLocale(['FR-ca'])).toBe('fr');
  });

  /* Um browser posto em espanhol primeiro e inglês depois abre em espanhol. */
  it('respeita a ordem de preferência do browser', () => {
    expect(detectLocale(['es-ES', 'en-US'])).toBe('es');
    expect(detectLocale(['en-US', 'es-ES'])).toBe('en');
  });

  it('cai no português quando nenhuma das nossas aparece', () => {
    expect(detectLocale(['de-DE', 'it-IT'])).toBe('pt');
    expect(detectLocale([])).toBe('pt');
  });
});
