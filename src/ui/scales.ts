/**
 * As escalas dos valores de treino, e como se escrevem.
 *
 * Portado de `proto/v2/proto.js` (skill `porte-do-sistema-premium-v2`), sem mudar um
 * número: cada escala é a escala REAL da coisa. O peso anda de disco em disco e não
 * de um em um — 2,5 kg é o par de 1,25 que se põe na barra —, o esforço anda de meio
 * em meio, e o descanso de cinco em cinco segundos.
 *
 * É esta tabela que torna possível a regra de 2026-09-12: **métrica de treino nunca
 * se escreve**. Um teclado numérico deixa escrever 61 kg num sítio onde não há disco
 * que o faça; uma escala não deixa. Peso, reps, esforço, tempo e séries entram por
 * seleção — roda ou chip de valor — e o teclado fica para texto livre.
 *
 * Aqui não há React, nem rede, nem estado: só a aritmética das escalas, para poder
 * ser testada sozinha.
 */

export type ScaleKey =
  | 'kg'
  | 'kgfino'
  | 'reps'
  | 'rpe'
  | 'pct'
  | 'seg'
  | 'min'
  | 'kcal'
  | 'grams'
  | 'body'
  | 'kcalGoal'
  | 'proteinGoal'
  | 'height'
  | 'goalKg'
  | 'count'
  | 'cm'
  | 'sets'
  | 'rest';

export type Scale = {
  min: number;
  max: number;
  /** O degrau real: 2,5 kg de disco, 1 repetição, meio ponto de RPE. */
  step: number;
  /** O sufixo pequeno que acompanha o número. Vazio quando o número fala sozinho. */
  unit: string;
  /** Casas decimais a mostrar, antes de se cortarem os zeros à direita. */
  dec: number;
};

export const SCALES: Record<ScaleKey, Scale> = {
  kg: { min: 0, max: 200, step: 2.5, unit: 'kg', dec: 1 },
  /** Halteres e cabos, onde 1,25 kg ainda é um degrau que existe. */
  kgfino: { min: 0, max: 60, step: 1.25, unit: 'kg', dec: 2 },
  reps: { min: 1, max: 40, step: 1, unit: '', dec: 0 },
  rpe: { min: 5, max: 10, step: 0.5, unit: 'RPE', dec: 1 },
  pct: { min: 40, max: 100, step: 5, unit: '%', dec: 0 },
  seg: { min: 0, max: 300, step: 5, unit: 's', dec: 0 },
  min: { min: 5, max: 180, step: 5, unit: 'min', dec: 0 },
  /** Nutrição (fase 020): as calorias de uma refeição, de 10 em 10. */
  kcal: { min: 0, max: 3000, step: 10, unit: 'kcal', dec: 0 },
  /** Gramas de um macro, de 1 em 1. */
  grams: { min: 0, max: 300, step: 1, unit: 'g', dec: 0 },
  /** O peso do corpo, de 100 g em 100 g. */
  body: { min: 30, max: 250, step: 0.1, unit: 'kg', dec: 1 },
  /** As metas do dia. */
  kcalGoal: { min: 800, max: 6000, step: 50, unit: 'kcal', dec: 0 },
  proteinGoal: { min: 20, max: 400, step: 5, unit: 'g', dec: 0 },
  /** Perfil (fase 023): a altura, de centímetro em centímetro. */
  height: { min: 1.2, max: 2.3, step: 0.01, unit: 'm', dec: 2 },
  /** Metas de peso e de carga, de meio quilo em meio quilo. */
  goalKg: { min: 0, max: 300, step: 0.5, unit: 'kg', dec: 1 },
  /** Metas contadas: sessões por semana, repetições. */
  count: { min: 0, max: 100, step: 1, unit: '', dec: 0 },
  /** Onboarding (fase 024): a altura em centímetros. */
  cm: { min: 120, max: 220, step: 1, unit: 'cm', dec: 0 },
  /** As séries que uma prescrição pede: de 1 a 10, de uma em uma. */
  sets: { min: 1, max: 10, step: 1, unit: '', dec: 0 },
  /** O descanso por omissão do Perfil: de 30 s a 5 min, de 15 em 15 (era o Stepper com step 15). */
  rest: { min: 30, max: 300, step: 15, unit: 's', dec: 0 },
};

/**
 * O número como se escreve em português: vírgula decimal, e sem zeros pendurados.
 *
 * "62,5" e não "62.5" nem "62,50". O produto é português-primeiro, e um peso escrito
 * com ponto decimal lê-se como um número de outra pessoa.
 */
export function formatValue(v: number, dec: number): string {
  if (dec === 0) return String(Math.round(v));
  return v
    .toFixed(dec)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
}

/**
 * Todos os valores de uma escala, do mínimo ao máximo.
 *
 * O `1e-9` na condição de paragem e o arredondamento à terceira casa são contra a
 * vírgula flutuante: somar 2,5 quarenta vezes não dá 100 exatamente, e sem isto o
 * último degrau da roda desaparecia umas vezes e aparecia outras.
 */
export function buildValues(scale: Scale): number[] {
  const out: number[] = [];
  for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
    out.push(Math.round(v * 1000) / 1000);
  }
  return out;
}

/**
 * O degrau mais perto de um valor qualquer.
 *
 * Serve para abrir a roda no sítio certo quando o valor guardado não é um degrau —
 * um registo antigo, ou um valor que veio de outro sítio. Aproxima-se, nunca se
 * recusa a mostrar.
 */
export function nearestIndex(values: number[], target: number): number {
  let index = 0;
  let best = Infinity;
  values.forEach((v, i) => {
    const d = Math.abs(v - target);
    if (d < best) {
      best = d;
      index = i;
    }
  });
  return index;
}

/** O degrau seguinte ou anterior, preso aos limites da escala. */
export function stepValue(v: number, by: number, scale: Scale, step = scale.step): number {
  const next = Math.min(scale.max, Math.max(scale.min, v + step * by));
  return Math.round(next * 1000) / 1000;
}

/**
 * Os oito degraus de esforço do protótipo (`.effortpicker`), tal e qual.
 *
 * 6 a 9 de meio em meio, e depois o 10. **A ausência do 9,5 é deliberada**: quem
 * está a 9,5 diz 10, e o degrau a mais era o que fazia a fila transbordar num ecrã
 * de 360px. Vive aqui, e não ao lado do componente, porque a regra de fast refresh
 * do projeto quer um ficheiro de componente a exportar só componentes.
 */
export const EFFORT_STEPS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 10];
