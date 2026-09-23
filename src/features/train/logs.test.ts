import { describe, expect, it } from 'vitest';

import type { ExerciseLog, SetValue } from '../../data/entities';
import { mergeSets } from '../../data/mutations';
import type { DayEntry } from './day-entries';
import { logId, parseRpe, sessionVolume, setsDoneFor, setValuesFor } from './logs';
import { buildSessionEntries } from './sessions';

/**
 * As duas leituras que a folha das séries faz, testadas sozinhas.
 *
 * Ambas são puras e ambas decidem o que aparece no ecrã dele: o esforço prescrito em
 * cada linha da grelha, e o número que a barra do fundo diz ser o volume da sessão.
 * A regra que mais interessa fixar aqui é a segunda — o volume conta só o que está
 * REGISTADO, e nunca o que foi prescrito. Um teste é o que impede que alguém, mais
 * tarde, torne o número mais simpático a meio de outra tarefa.
 */

function entryOf(key: string, sets: number): DayEntry {
  return {
    key,
    kind: 'built',
    name: key,
    equipment: null,
    prescription: { s: sets, r: '10', rpe: '8', l: '60 kg', rest: '90s' },
    clip: null,
    photo: null,
    fallbackPhoto: null,
  };
}

function logOf(
  exKey: string,
  fields: { weight: string | null; reps: string | null; sets_done: boolean[]; sets?: SetValue[] },
): ExerciseLog {
  return {
    user_id: '00000000-0000-4000-8000-000000000000',
    updated_at: '2026-09-22T10:00:00.000Z',
    day_no: 1,
    block: 'b1',
    ex_key: exKey,
    note: null,
    field_updated_at: {},
    ...fields,
  };
}

function mapOf(...logs: ExerciseLog[]): Map<string, ExerciseLog> {
  return new Map(logs.map((log) => [logId(log.day_no, 'b1', log.ex_key), log]));
}

describe('parseRpe', () => {
  it('reads a single number', () => {
    expect(parseRpe('8')).toBe(8);
  });

  it('reads a range at its floor, like the rest prescription does', () => {
    expect(parseRpe('7-8')).toBe(7);
  });

  it('keeps half points, because the effort scale moves in halves', () => {
    expect(parseRpe('8,5')).toBe(8.5);
    expect(parseRpe('RPE 9.5')).toBe(9.5);
  });

  it('is null when there is no number to read, rather than guessing one', () => {
    expect(parseRpe('máximo')).toBeNull();
    expect(parseRpe('—')).toBeNull();
  });
});

/*
 * Bug B2 de `.claude/skills/executar-quatro-erros-do-browser/PLANO.md`: "se mudo de
 * exercício, as séries que estavam marcadas não podem aparecer marcadas". Na app as
 * séries guardam-se com a chave dia · bloco · exercício, e o ecrã Executar lê-as sempre
 * pela chave do exercício a decorrer. Estes testes fixam isso.
 */
describe('as séries são de cada exercício (B2)', () => {
  const legpress = entryOf('legpress', 4);
  const hack = entryOf('hack', 3);
  const logs = mapOf(logOf('legpress', { weight: '60', reps: '12', sets_done: [true, true, false, false] }));
  const shown = (entry: DayEntry) => setsDoneFor(logs.get(logId(1, 'b1', entry.key)), entry.prescription.s);

  it('duas marcadas no Leg Press não aparecem na Máquina Hack', () => {
    expect(shown(legpress)).toEqual([true, true, false, false]);
    expect(shown(hack)).toEqual([false, false, false]);
  });

  it('voltar ao Leg Press devolve as duas tal como estavam', () => {
    shown(hack);
    expect(shown(legpress)).toEqual([true, true, false, false]);
  });

  it('a chave separa exercício, dia e bloco', () => {
    expect(logId(1, 'b1', 'legpress')).not.toBe(logId(1, 'b1', 'hack'));
    expect(logId(1, 'b1', 'legpress')).not.toBe(logId(2, 'b1', 'legpress'));
  });

  it('o volume da sessão soma todos, e trocar de exercício não o apaga', () => {
    const both = mapOf(
      logOf('legpress', { weight: '60', reps: '12', sets_done: [true, true, false, false] }),
      logOf('hack', { weight: '50', reps: '10', sets_done: [true, false, false] }),
    );
    expect(sessionVolume(1, 'b1', [legpress, hack], both)).toBe(60 * 12 * 2 + 50 * 10);
  });
});

describe('sessionVolume', () => {
  const entries = [entryOf('legpress', 4), entryOf('hack', 3)];

  it('is zero before anything is logged', () => {
    expect(sessionVolume(1, 'b1', entries, mapOf())).toBe(0);
  });

  it('counts load × reps × sets ticked', () => {
    const logs = mapOf(logOf('legpress', { weight: '60', reps: '12', sets_done: [true, true] }));
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(60 * 12 * 2);
  });

  it('sums the exercises of the day', () => {
    const logs = mapOf(
      logOf('legpress', { weight: '60', reps: '12', sets_done: [true, false, false, false] }),
      logOf('hack', { weight: '40', reps: '10', sets_done: [true, true, false] }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(60 * 12 + 40 * 10 * 2);
  });

  /*
   * O caso que define a regra: a série está marcada, o programa diz 60 kg, e ninguém
   * escreveu o peso. Não conta. Contá-lo seria somar o que o plano pediu como se tivesse
   * sido levantado, e a barra da folha passaria a discordar de todos os números que os
   * ecrãs de histórico tiram das mesmas linhas.
   */
  it('leaves out a ticked set with no load written down', () => {
    const logs = mapOf(logOf('legpress', { weight: null, reps: '12', sets_done: [true, true] }));
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(0);
  });

  it('leaves out a load it cannot read as one number', () => {
    const logs = mapOf(
      logOf('legpress', { weight: '10/mão', reps: '12', sets_done: [true] }),
      logOf('hack', { weight: '40', reps: '10', sets_done: [true] }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(40 * 10);
  });

  it('ignores a log whose sets are all unticked', () => {
    const logs = mapOf(
      logOf('legpress', { weight: '60', reps: '12', sets_done: [false, false, false, false] }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(0);
  });

  /* Um registo de um bloco com mais séries não pode inflacionar este: `setsDoneFor`
     corta o array ao que ESTE bloco prescreve, e o volume conta o que sobra. */
  it('counts no more sets than this block prescribes', () => {
    const logs = mapOf(
      logOf('hack', { weight: '40', reps: '10', sets_done: [true, true, true, true, true] }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(40 * 10 * 3);
  });
});

/*
 * O registo por série do `014`. Três regras a fixar: a posição de uma série nunca
 * escorrega, o número da própria série ganha ao do exercício inteiro, e um treino feito
 * só no ecrã Executar não chega ao histórico sem carga.
 */
describe('setValuesFor', () => {
  it('pads to the block, so position i is always set i + 1', () => {
    expect(setValuesFor({ sets: [{ weight: 60 }] }, 3)).toEqual([{ weight: 60 }, {}, {}]);
  });

  it('reads a row with no sets at all — a database where 014 has not been run', () => {
    expect(setValuesFor({}, 2)).toEqual([{}, {}]);
    expect(setValuesFor(undefined, 1)).toEqual([{}]);
  });
});

describe('mergeSets', () => {
  it('writes one field of one set and leaves the rest alone', () => {
    const before: SetValue[] = [{ weight: 60, reps: 12 }, { weight: 60 }];
    expect(mergeSets(before, { 1: { weight: 62.5 } })).toEqual([
      { weight: 60, reps: 12 },
      { weight: 62.5 },
    ]);
    expect(before[1]).toEqual({ weight: 60 });
  });

  it('fills the gap before a position past the end, like the SQL does', () => {
    expect(mergeSets([], { 2: { rpe: 8 } })).toEqual([{}, {}, { rpe: 8 }]);
  });
});

describe('sessionVolume, set by set', () => {
  const entries = [entryOf('legpress', 3)];

  it('counts each ticked set at its own load and reps', () => {
    const logs = mapOf(
      logOf('legpress', {
        weight: null,
        reps: null,
        sets_done: [true, false, true],
        sets: [{ weight: 60, reps: 12 }, { weight: 70, reps: 10 }, { weight: 62.5, reps: 10 }],
      }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(60 * 12 + 62.5 * 10);
  });

  it('falls back to the exercise-wide columns for a set with no numbers of its own', () => {
    const logs = mapOf(
      logOf('legpress', {
        weight: '50',
        reps: '10',
        sets_done: [true, true, false],
        sets: [{ weight: 60 }],
      }),
    );
    expect(sessionVolume(1, 'b1', entries, logs)).toBe(60 * 10 + 50 * 10);
  });
});

describe('buildSessionEntries, with sets of their own', () => {
  const entries = [entryOf('legpress', 3)];

  it('takes the last ticked set when the exercise-wide load is empty', () => {
    const logs = mapOf(
      logOf('legpress', {
        weight: null,
        reps: null,
        sets_done: [true, true, false],
        sets: [{ weight: 60, reps: 12 }, { weight: 62.5, reps: 10 }, { weight: 99 }],
      }),
    );
    const [entry] = buildSessionEntries(1, 'b1', entries, logs);
    expect(entry).toMatchObject({ sets_done: 2, weight: '62.5', reps: '10' });
  });

  it('lays the edit being made over the stored sets, merged and not replaced', () => {
    const logs = mapOf(
      logOf('legpress', {
        weight: null,
        reps: null,
        sets_done: [true, false, false],
        sets: [{ weight: 60, reps: 12 }],
      }),
    );
    const [entry] = buildSessionEntries(1, 'b1', entries, logs, {
      exKey: 'legpress',
      fields: { sets_done: [true, true, false], sets: { 1: { weight: 65 } } },
    });
    expect(entry).toMatchObject({ sets_done: 2, weight: '65', reps: null });
  });
});
