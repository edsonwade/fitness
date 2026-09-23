import { EXERCISES, type Localized } from '../../content';

/**
 * As variantes de equipamento de cada exercício do programa — bugs B2, B3 e B4 de
 * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`.
 *
 * Palavras dele, 2026-09-23: "quando clicas no dumbbells e queres mudar para barbell o
 * vídeo que aparece é sempre o mesmo. Como assim, se são exercícios diferentes?" Trocar
 * o equipamento é trocar de exercício: outro nome, outro vídeo, outras séries.
 *
 * - A PRIMEIRA variante de cada lista é a de origem, a do exercício autorado.
 * - Só se lista o equipamento que o movimento tem mesmo. Um exercício que não está aqui
 *   não se troca: a Leg Press não tem halteres.
 * - `ex` aponta para outro exercício do programa, e a variante leva o nome, o vídeo, a
 *   foto e a técnica dele. Sem `ex`, a variante leva o nome de `name` e nenhum vídeo —
 *   nunca o vídeo de outro exercício.
 * - O que se grava no override é o id (`barbell`…), nunca o texto traduzido.
 */

export const EQUIP_IDS = ['barbell', 'dumbbells', 'machine', 'cable', 'bodyweight'] as const;
export type EquipId = (typeof EQUIP_IDS)[number];

export const EQUIP_NAMES: Readonly<Record<EquipId, Localized>> = {
  barbell: { pt: 'Barra', en: 'Barbell', es: 'Barra', fr: 'Barre' },
  dumbbells: { pt: 'Halteres', en: 'Dumbbells', es: 'Mancuernas', fr: 'Haltères' },
  machine: { pt: 'Máquina', en: 'Machine', es: 'Máquina', fr: 'Machine' },
  cable: { pt: 'Cabo', en: 'Cable', es: 'Polea', fr: 'Poulie' },
  bodyweight: { pt: 'Peso corporal', en: 'Bodyweight', es: 'Peso corporal', fr: 'Poids du corps' },
};

export type Variant = {
  equip: EquipId;
  /** Outro exercício do programa, de onde vêm o nome, o vídeo, a foto e a técnica. */
  ex?: string;
  /** O nome, quando a variante não é um exercício do programa. */
  name?: Localized;
};

const n = (pt: string, en: string, es: string, fr: string): Localized => ({ pt, en, es, fr });

const BARBELL_CURL = n('Rosca direta com barra', 'Barbell Curl', 'Curl con barra', 'Curl à la barre');

export const VARIANTS: Readonly<Record<string, readonly Variant[]>> = {
  dbbench: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: n('Supino com barra', 'Barbell Bench Press', 'Press de banca con barra', 'Développé couché à la barre') },
    { equip: 'machine', name: n('Supino na máquina', 'Machine Chest Press', 'Press de pecho en máquina', 'Développé couché à la machine') },
  ],
  incldb: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: n('Supino inclinado com barra', 'Incline Barbell Press', 'Press inclinado con barra', 'Développé incliné à la barre') },
    { equip: 'machine', name: n('Supino inclinado na máquina', 'Incline Machine Press', 'Press inclinado en máquina', 'Développé incliné à la machine') },
  ],
  pecdeck: [
    { equip: 'machine' },
    { equip: 'cable', name: n('Crucifixo na polia', 'Cable Fly', 'Aperturas en polea', 'Écarté à la poulie') },
    { equip: 'dumbbells', name: n('Crucifixo com halteres', 'Dumbbell Fly', 'Aperturas con mancuernas', 'Écarté aux haltères') },
  ],
  dbohp: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: n('Desenvolvimento com barra', 'Barbell Overhead Press', 'Press militar con barra', 'Développé militaire à la barre') },
    { equip: 'machine', name: n('Desenvolvimento na máquina', 'Machine Shoulder Press', 'Press de hombros en máquina', 'Développé épaules à la machine') },
  ],
  lateral: [
    { equip: 'dumbbells' },
    { equip: 'cable', name: n('Elevação lateral na polia', 'Cable Lateral Raise', 'Elevación lateral en polea', 'Élévation latérale à la poulie') },
    { equip: 'machine', name: n('Elevação lateral na máquina', 'Machine Lateral Raise', 'Elevación lateral en máquina', 'Élévation latérale à la machine') },
  ],
  reardelt: [
    { equip: 'dumbbells' },
    { equip: 'machine', name: n('Peck deck invertido', 'Reverse Pec Deck', 'Contractora inversa', 'Pec deck inversé') },
    { equip: 'cable', name: n('Crucifixo invertido na polia', 'Cable Reverse Fly', 'Pájaro en polea', 'Oiseau à la poulie') },
  ],
  dbcurl: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: BARBELL_CURL },
    { equip: 'cable', ex: 'cablecurl' },
  ],
  cablecurl: [
    { equip: 'cable' },
    { equip: 'barbell', name: BARBELL_CURL },
    { equip: 'dumbbells', ex: 'dbcurl' },
  ],
  hammer: [
    { equip: 'dumbbells' },
    { equip: 'cable', name: n('Rosca martelo na polia com corda', 'Cable Rope Hammer Curl', 'Curl martillo en polea con cuerda', 'Curl marteau à la poulie avec corde') },
  ],
  skull: [
    { equip: 'barbell' },
    { equip: 'dumbbells', name: n('Extensão de tríceps deitado com halteres', 'Dumbbell Lying Triceps Extension', 'Extensión de tríceps tumbado con mancuernas', 'Extension triceps allongé aux haltères') },
  ],
  kickback: [
    { equip: 'cable' },
    { equip: 'dumbbells', name: n('Coice de tríceps com halter', 'Dumbbell Triceps Kickback', 'Patada de tríceps con mancuerna', 'Kickback triceps à l’haltère') },
  ],
  ohext: [
    { equip: 'cable' },
    { equip: 'dumbbells', name: n('Extensão acima da cabeça com halter', 'Overhead Dumbbell Extension', 'Extensión sobre la cabeza con mancuerna', 'Extension au-dessus de la tête à l’haltère') },
  ],
  dip: [
    { equip: 'bodyweight' },
    { equip: 'machine', name: n('Mergulho assistido na máquina', 'Assisted Dip Machine', 'Fondos asistidos en máquina', 'Dips assistés à la machine') },
  ],
  csrow: [
    { equip: 'machine' },
    { equip: 'dumbbells', name: n('Remada com peito apoiado com halteres', 'Chest-Supported Dumbbell Row', 'Remo con pecho apoyado con mancuernas', 'Rowing buste appuyé aux haltères') },
    { equip: 'cable', ex: 'seatedrow' },
  ],
  seatedrow: [
    { equip: 'cable' },
    { equip: 'machine', ex: 'csrow' },
  ],
  dbrdl: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: n('Peso morto romeno com barra', 'Barbell Romanian Deadlift', 'Peso muerto rumano con barra', 'Soulevé de terre roumain à la barre') },
  ],
  lunge: [
    { equip: 'dumbbells' },
    { equip: 'barbell', name: n('Afundo com barra', 'Barbell Lunge', 'Zancada con barra', 'Fente à la barre') },
    { equip: 'bodyweight', name: n('Afundo sem carga', 'Bodyweight Lunge', 'Zancada sin carga', 'Fente au poids du corps') },
  ],
  hipthrust: [
    { equip: 'machine' },
    { equip: 'barbell', name: n('Hip thrust com barra', 'Barbell Hip Thrust', 'Hip thrust con barra', 'Hip thrust à la barre') },
  ],
};

/** As variantes de um exercício, a de origem primeiro; vazio quando não se troca. */
export function variantsOf(exKey: string): readonly Variant[] {
  return VARIANTS[exKey] ?? [];
}

/**
 * O equipamento gravado, lido como id. Aceita o id e, para os overrides gravados antes
 * do B2, o texto traduzido em qualquer das quatro línguas ("Dumbbells", "Halteres"…).
 */
export function equipIdOf(stored: string | null | undefined): EquipId | null {
  const value = stored?.trim().toLowerCase();
  if (!value) return null;
  for (const id of EQUIP_IDS) {
    if (id === value) return id;
    if (Object.values(EQUIP_NAMES[id]).some((label) => label.toLowerCase() === value)) return id;
  }
  return null;
}

/**
 * A variante escolhida para este exercício, ou null para a de origem. Um equipamento que
 * o exercício não tem (ou texto livre do formulário de edição) é a de origem.
 */
export function chosenVariant(exKey: string, stored: string | null | undefined): Variant | null {
  const id = equipIdOf(stored);
  const list = variantsOf(exKey);
  if (!id || list.length === 0 || list[0].equip === id) return null;
  return list.find((v) => v.equip === id) ?? null;
}

/**
 * A chave do registo de uma variante (B3): as séries da Barra não são as dos Halteres.
 * A de origem guarda-se na chave do exercício, como sempre, e nada do que já foi
 * registado se perde.
 */
export function variantLogKey(exKey: string, variant: Variant | null): string {
  return variant ? `${exKey}@${variant.equip}` : exKey;
}

/** O exercício do programa atrás de uma variante, quando é um. */
export function variantExercise(variant: Variant | null) {
  return variant?.ex ? EXERCISES[variant.ex] : undefined;
}
