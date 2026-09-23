import { describe, expect, it } from 'vitest';

import type { Session, SessionEntry } from '../../data/entities';
import { lastByKey, suggestFrom } from './suggestion';

function entry(over: Partial<SessionEntry>): SessionEntry {
  return {
    session_id: 's1',
    idx: 0,
    ex_key: 'legpress',
    name: 'Leg Press',
    target_sets: null,
    target_reps: null,
    target_raw: null,
    sets_done: 4,
    sets_total: 4,
    weight: '60 kg',
    reps: '10',
    note: null,
    ...over,
  } as SessionEntry;
}

describe('a carga sugerida', () => {
  it('séries todas feitas: sobe 2,5 kg', () => {
    expect(suggestFrom(entry({}))).toEqual({ kg: 62.5, lastKg: 60, setsDone: 4, setsTotal: 4 });
  });

  it('ficou a meio: repete a carga', () => {
    expect(suggestFrom(entry({ sets_done: 2 }))?.kg).toBe(60);
  });

  it('sem histórico, sem carga legível ou sem séries: nada', () => {
    expect(suggestFrom(undefined)).toBeNull();
    expect(suggestFrom(entry({ weight: null }))).toBeNull();
    expect(suggestFrom(entry({ weight: '— preencher' }))).toBeNull();
    expect(suggestFrom(entry({ sets_done: 0 }))).toBeNull();
  });

  it('lê a sessão mais recente de cada exercício', () => {
    const sessions = [
      { id: 'old', local_date: '2026-09-01', performed_at: '2026-09-01T10:00:00Z' },
      { id: 'new', local_date: '2026-09-08', performed_at: '2026-09-08T10:00:00Z' },
    ] as Session[];
    const map = lastByKey(sessions, [
      entry({ session_id: 'old', weight: '50 kg' }),
      entry({ session_id: 'new', weight: '60 kg' }),
    ]);
    expect(map.get('legpress')?.weight).toBe('60 kg');
  });
});
