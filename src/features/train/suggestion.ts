import { useMemo } from 'react';

import type { Session, SessionEntry } from '../../data/entities';
import { useRows } from '../../data/queries';
import { parseLoadKg } from './metrics';
import { sessionDate, useSessions } from './sessions';

/**
 * A carga sugerida — fase 013, `proto/v2/03-treino.html` frame 2: *"Sugestão: 62,5 kg"* e,
 * por baixo, de onde saiu: *"Da última vez fizeste 60 kg nas 4 séries"*.
 *
 * A regra é curta e diz-se:
 *  - a última vez que o exercício foi feito, com carga legível e pelo menos uma série;
 *  - fez as séries todas → sobe um degrau de disco (2,5 kg);
 *  - ficou a meio → repete a carga.
 *
 * Sem histórico daquele exercício não há sugestão (o Agachamento Hack do protótipo é o
 * contraexemplo à vista). A prescrição do programa não se toca: é só a carga.
 */
export const LOAD_STEP_KG = 2.5;
const LOOKBACK_SESSIONS = 12;

export type Suggestion = {
  kg: number;
  lastKg: number;
  setsDone: number;
  setsTotal: number | null;
};

export function suggestFrom(entry: SessionEntry | undefined): Suggestion | null {
  if (!entry) return null;
  const lastKg = parseLoadKg(entry.weight);
  const done = entry.sets_done ?? 0;
  if (lastKg === null || lastKg <= 0 || done <= 0) return null;
  const total = entry.sets_total;
  const all = total !== null && done >= total;
  return { kg: all ? lastKg + LOAD_STEP_KG : lastKg, lastKg, setsDone: done, setsTotal: total };
}

/** A última entrada de cada exercício, da sessão mais recente para trás. */
export function lastByKey(
  sessions: readonly Session[],
  entries: readonly SessionEntry[],
): Map<string, SessionEntry> {
  const order = new Map(
    [...sessions]
      .sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))
      .map((s, i) => [s.id, i] as const),
  );
  const out = new Map<string, SessionEntry>();
  const sorted = [...entries].sort(
    (a, b) => (order.get(a.session_id) ?? 1e9) - (order.get(b.session_id) ?? 1e9),
  );
  for (const e of sorted) {
    if (!e.ex_key || out.has(e.ex_key)) continue;
    if (suggestFrom(e) === null) continue;
    out.set(e.ex_key, e);
  }
  return out;
}

/** As sugestões de todos os exercícios, a partir das últimas sessões gravadas. */
export function useSuggestions(): Map<string, Suggestion> {
  const sessions = useSessions();
  const recent = useMemo(
    () =>
      [...(sessions.data ?? [])]
        .sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))
        .slice(0, LOOKBACK_SESSIONS),
    [sessions.data],
  );
  const entries = useRows(
    'session_entries',
    recent.map((s) => s.id),
  );
  return useMemo(() => {
    const out = new Map<string, Suggestion>();
    for (const [key, entry] of lastByKey(recent, entries.data ?? [])) {
      const s = suggestFrom(entry);
      if (s) out.set(key, s);
    }
    return out;
  }, [recent, entries.data]);
}
