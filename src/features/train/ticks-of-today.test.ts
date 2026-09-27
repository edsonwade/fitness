import { describe, expect, it } from 'vitest';

import type { ExerciseLog } from '../../data/entities';
import { stampTicks } from '../../data/mutations';
import { setsDoneFor, ticksOfToday } from './logs';
import { localDate } from './sessions';

/**
 * B1 de `.claude/skills/demo-nao-marca-series/PLANO.md` (foto dele de 2026-09-27 15:17):
 * no fim da demonstração a folha abria com as séries todas feitas, sem ele ter tocado.
 *
 * Nada as marcava — `exercise_logs` não tem data (`sessions.ts`), e os vistos da última
 * vez que fez este dia ficavam lá para sempre. A folha só aparece depois do vídeo, por
 * isso era aí que ele os via. A regra: um visto é de hoje, ou não é visto nenhum.
 */

const TODAY = new Date(2026, 8, 27, 15, 17);
const LAST_WEEK = new Date(2026, 8, 20, 18, 0);

function rowOf(ticks: boolean[], stamped: Date | null, updated = stamped ?? LAST_WEEK): ExerciseLog {
  return {
    user_id: '00000000-0000-4000-8000-000000000000',
    updated_at: updated.toISOString(),
    day_no: 3,
    block: 'b1',
    ex_key: 'chest-supported-row',
    weight: '30',
    reps: '10',
    sets_done: ticks,
    note: null,
    sets: [{ rest: 120, rpe: 7, reps: 10, weight: 30 }],
    field_updated_at: stamped ? { sets_done: stamped.toISOString() } : {},
  };
}

describe('ticksOfToday — os vistos só valem no dia em que foram marcados', () => {
  it('as 3 séries marcadas na semana passada aparecem hoje por marcar (o bug da foto)', () => {
    const row = rowOf([true, true, true], LAST_WEEK);
    expect(setsDoneFor(ticksOfToday(row, localDate(TODAY)), 3)).toEqual([false, false, false]);
  });

  it('os números da semana passada ficam: são a carga que o cartão lê', () => {
    const row = rowOf([true, true, true], LAST_WEEK);
    const shown = ticksOfToday(row, localDate(TODAY));
    expect(shown.weight).toBe('30');
    expect(shown.reps).toBe('10');
    expect(shown.sets).toEqual(row.sets);
  });

  it('o que ele marcou hoje continua marcado', () => {
    const row = rowOf([true, false, false], TODAY);
    expect(setsDoneFor(ticksOfToday(row, localDate(TODAY)), 3)).toEqual([true, false, false]);
  });

  it('sem carimbo do visto, decide a data da linha', () => {
    expect(setsDoneFor(ticksOfToday(rowOf([true, true], null, LAST_WEEK), localDate(TODAY)), 2)).toEqual([
      false,
      false,
    ]);
    expect(setsDoneFor(ticksOfToday(rowOf([true, true], null, TODAY), localDate(TODAY)), 2)).toEqual([
      true,
      true,
    ]);
  });
});

describe('stampTicks — o visto otimista é de agora, e não da semana passada', () => {
  it('marcar hoje numa linha antiga põe o carimbo de agora, e o visto não some até o servidor responder', () => {
    const row = rowOf([true, true, true], LAST_WEEK);
    const at = TODAY.toISOString();
    const stamped = { ...row, sets_done: [true, false, false], ...stampTicks(row, { sets_done: [true, false, false] }, at) };
    expect(setsDoneFor(ticksOfToday(stamped, localDate(TODAY)), 3)).toEqual([true, false, false]);
  });

  it('escrever só um peso não mexe no carimbo do visto', () => {
    const row = rowOf([true, true, true], LAST_WEEK);
    expect(stampTicks(row, { weight: '32' }, TODAY.toISOString())).toEqual({});
  });
});
