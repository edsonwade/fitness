import { describe, expect, it } from 'vitest';

import type { Session } from '../../data/entities';
import { readiness } from './readiness';
import { recommendation, stanceFor, type DayShape } from './recommendation';
import type { Readiness } from './readiness';

/**
 * A recomendação, provada sem browser — mas a prova verdadeira é o utilizador ver o objetivo com
 * contexto no ecrã, com os dados dele. Aqui prova-se a regra que importa: **sem prontidão não há
 * moldura de recomendação** (e não um motivo inventado), e a postura sai da recuperação real e da
 * densidade da semana, não de um valor por omissão. Todos os números abaixo são inventados e
 * neutros; os exemplos do plano (§4.3: "45 min", "7/10") não aparecem como se fossem reais.
 */

const TODAY = '2026-09-10';

let sessionSeq = 0;
function session(over: Partial<Session> = {}): Session {
  sessionSeq += 1;
  return {
    user_id: '00000000-0000-4000-8000-000000000001',
    updated_at: '2026-09-10T10:00:00Z',
    id: `33333333-3333-4333-8333-00000000000${sessionSeq}`,
    performed_at: '2026-09-10T10:00:00Z',
    finished_at: null,
    day_no: 1,
    local_date: '2026-09-10',
    day_name: 'Perna',
    block: 'b1',
    ...over,
  };
}

/** A prontidão que uma data `local_date` produziria, para alimentar a recomendação. */
function readinessOn(dates: string[]): ReturnType<typeof readiness> {
  return readiness(dates.map((local_date) => session({ local_date })), null, TODAY);
}

describe('recommendation', () => {
  it('has no recommendation frame with no history — a reason, not an invented motive', () => {
    // O caso obrigatório da fase: conta sem histórico nenhum.
    expect(recommendation('strength', readiness([], null, TODAY))).toEqual({
      ok: false,
      reason: 'sem-dados',
    });
  });

  it('a rest day is always a rest recommendation, even with fresh readiness', () => {
    const result = recommendation('rest', readinessOn(['2026-09-08'])); // treino há 2 dias
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.shape).toBe('rest');
    expect(result.value.stance).toBe('descanso');
    // As parcelas da prontidão viajam para o ecrã as mostrar, sem recalcular.
    expect(result.value.recovery).toBe('boa');
    expect(result.value.daysSinceLast).toBe(2);
  });

  it('a training day inside the recovery window recommends training', () => {
    const result = recommendation('strength', readinessOn(['2026-09-08'])); // há 2 dias: janela
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stance).toBe('treinar');
    expect(result.value.recovery).toBe('boa');
  });

  it('a training day when the last workout was today recommends moderating', () => {
    const result = recommendation('strength', readinessOn([TODAY]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stance).toBe('moderar');
    expect(result.value.recovery).toBe('treino-hoje');
  });

  it('a training day after a dense week recommends moderating, even inside the window', () => {
    // Última sessão há 2 dias (janela ideal), mas cinco sessões nos últimos sete dias.
    const result = recommendation(
      'strength',
      readinessOn(['2026-09-08', '2026-09-07', '2026-09-06', '2026-09-05', '2026-09-04']),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.recovery).toBe('boa'); // o intervalo é ideal…
    expect(result.value.sessionsLast7).toBe(5); // …mas a semana foi densa
    expect(result.value.stance).toBe('moderar');
  });
});

describe('stanceFor', () => {
  const base: Readiness = {
    score: 100,
    recovery: 'boa',
    daysSinceLast: 2,
    sessionsLast7: 1,
    load: { ok: false, reason: 'sem-carga-legivel' },
  };

  it('rest always yields descanso, whatever the readiness', () => {
    const shapes: DayShape[] = ['rest'];
    for (const shape of shapes) {
      expect(stanceFor(shape, { ...base, recovery: 'treino-hoje', sessionsLast7: 5 })).toBe(
        'descanso',
      );
    }
  });

  it('a long pause on a training day still recommends training', () => {
    expect(stanceFor('strength', { ...base, recovery: 'pausa-longa', daysSinceLast: 14 })).toBe(
      'treinar',
    );
  });
});
