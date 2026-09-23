import { describe, expect, it } from 'vitest';

import type { Session, SessionEntry } from '../../data/entities';
import { byExercise, groupEntries, inPeriod, records, totals, volumes } from './progress';

const S = (id: string, date: string) =>
  ({ id, local_date: date, performed_at: `${date}T10:00:00Z` }) as Session;
const E = (session_id: string, ex_key: string, weight: string | null, sets = 3, reps = '10') =>
  ({ session_id, ex_key, name: ex_key, weight, reps, sets_done: sets, sets_total: 4 }) as SessionEntry;

const sessions = [S('a', '2026-09-01'), S('b', '2026-09-06'), S('c', '2026-09-11')];
const entries = [
  E('a', 'legpress', '50 kg'),
  E('b', 'legpress', '55 kg'),
  E('c', 'legpress', '60 kg', 4),
  E('c', 'hack', '— preencher'),
];
const by = groupEntries(entries);

describe('o Progresso', () => {
  it('filtra o período a contar de hoje, do mais antigo para o mais recente', () => {
    expect(inPeriod(sessions, '7', '2026-09-11').map((s) => s.id)).toEqual(['b', 'c']);
    expect(inPeriod(sessions, 'all', '2026-09-11').map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('uma barra por sessão, com o volume a sério', () => {
    expect(volumes(sessions, by).map((v) => v.kg)).toEqual([1500, 1650, 2400]);
  });

  it('os totais somam séries e volume; sem carga legível, volume null', () => {
    expect(totals(sessions, by)).toEqual({ sessions: 3, setsDone: 13, setsPlanned: 16, volumeKg: 5550 });
    expect(totals([], by).volumeKg).toBeNull();
  });

  it('por exercício: a carga mais recente e quanto subiu', () => {
    const leg = byExercise(sessions, by).find((l) => l.key === 'legpress')!;
    expect(leg.latestKg).toBe(60);
    expect(leg.deltaKg).toBe(10);
  });

  it('recordes com data; sem carga registada não há recorde', () => {
    const r = records(byExercise(sessions, by));
    expect(r.list).toEqual([{ key: 'legpress', name: 'legpress', kg: 60, date: '2026-09-11' }]);
    expect(r.missing).toEqual(['hack']);
  });
});
