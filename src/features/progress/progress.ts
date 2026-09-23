import type { Session, SessionEntry } from '../../data/entities';
import { parseLoadKg, parseReps, sessionLoad } from '../train/metrics';
import { shiftDays } from '../train/readiness';
import { sessionDate } from '../train/sessions';

/**
 * As contas do ecrã Progresso — `proto/v2/05-progresso.html` frames 1 a 3.
 *
 * Tudo sai das sessões gravadas e das suas entradas; nada se estima. Uma sessão sem carga
 * legível não entra no volume, um exercício sem carga registada não tem recorde, e abaixo
 * de três sessões não há gráfico (frame 3: "duas não fazem uma tendência").
 */
export type Period = '7' | '30' | 'all';
export const MIN_SESSIONS_FOR_TREND = 3;

export function inPeriod(sessions: readonly Session[], period: Period, today: string): Session[] {
  const from = period === 'all' ? '0000-00-00' : shiftDays(today, -(Number(period) - 1));
  return sessions
    .filter((s) => {
      const d = sessionDate(s);
      return d >= from && d <= today;
    })
    .sort((a, b) => sessionDate(a).localeCompare(sessionDate(b)));
}

export function groupEntries(entries: readonly SessionEntry[]): Map<string, SessionEntry[]> {
  const map = new Map<string, SessionEntry[]>();
  for (const e of entries) {
    const list = map.get(e.session_id) ?? [];
    list.push(e);
    map.set(e.session_id, list);
  }
  return map;
}

export type SessionVolume = { id: string; date: string; kg: number };

/** Uma barra por sessão, da mais antiga para a mais recente; só as que têm carga legível. */
export function volumes(
  sessions: readonly Session[],
  bySession: ReadonlyMap<string, SessionEntry[]>,
): SessionVolume[] {
  return sessions.flatMap((s) => {
    const load = sessionLoad(bySession.get(s.id) ?? []);
    return load.ok ? [{ id: s.id, date: sessionDate(s), kg: load.value }] : [];
  });
}

export type Totals = { sessions: number; setsDone: number; setsPlanned: number; volumeKg: number | null };

export function totals(
  sessions: readonly Session[],
  bySession: ReadonlyMap<string, SessionEntry[]>,
): Totals {
  let setsDone = 0;
  let setsPlanned = 0;
  for (const s of sessions) {
    for (const e of bySession.get(s.id) ?? []) {
      setsDone += e.sets_done ?? 0;
      setsPlanned += e.sets_total ?? e.sets_done ?? 0;
    }
  }
  const vols = volumes(sessions, bySession);
  return {
    sessions: sessions.length,
    setsDone,
    setsPlanned,
    volumeKg: vols.length ? vols.reduce((n, v) => n + v.kg, 0) : null,
  };
}

export type ExercisePoint = { date: string; kg: number | null; sets: number; reps: number | null };
export type ExerciseLine = {
  key: string;
  name: string;
  points: ExercisePoint[];
  latestKg: number | null;
  /** Da primeira carga legível à mais recente. Null com menos de duas. */
  deltaKg: number | null;
};

/** "Por exercício": cada exercício com as sessões em que foi feito, por ordem. */
export function byExercise(
  sessions: readonly Session[],
  bySession: ReadonlyMap<string, SessionEntry[]>,
): ExerciseLine[] {
  const lines = new Map<string, ExerciseLine>();
  for (const s of sessions) {
    for (const e of bySession.get(s.id) ?? []) {
      if (!e.ex_key || (e.sets_done ?? 0) <= 0) continue;
      const line = lines.get(e.ex_key) ?? {
        key: e.ex_key,
        name: e.name ?? e.ex_key,
        points: [],
        latestKg: null,
        deltaKg: null,
      };
      line.name = e.name ?? line.name;
      line.points.push({
        date: sessionDate(s),
        kg: parseLoadKg(e.weight),
        sets: e.sets_done ?? 0,
        reps: parseReps(e.reps),
      });
      lines.set(e.ex_key, line);
    }
  }
  for (const line of lines.values()) {
    const loads = line.points.map((p) => p.kg).filter((kg): kg is number => kg !== null && kg > 0);
    line.latestKg = loads.length ? loads[loads.length - 1] : null;
    line.deltaKg = loads.length >= 2 ? loads[loads.length - 1] - loads[0] : null;
  }
  return [...lines.values()].sort((a, b) => b.points.length - a.points.length);
}

export type Record = { key: string; name: string; kg: number; date: string };

/**
 * Recordes: a carga mais alta de cada exercício, com a data em que foi feita pela
 * primeira vez. Os exercícios sem carga registada vão para `missing`, e o ecrã diz porquê.
 */
export function records(lines: readonly ExerciseLine[]): { list: Record[]; missing: string[] } {
  const list: Record[] = [];
  const missing: string[] = [];
  for (const line of lines) {
    let best: Record | null = null;
    for (const p of line.points) {
      if (p.kg === null || p.kg <= 0) continue;
      if (!best || p.kg > best.kg) best = { key: line.key, name: line.name, kg: p.kg, date: p.date };
    }
    if (best) list.push(best);
    else missing.push(line.name);
  }
  list.sort((a, b) => b.date.localeCompare(a.date));
  return { list, missing };
}
