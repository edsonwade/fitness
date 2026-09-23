/**
 * As contas do separador Equipa — fases 021 e 022, `proto/v2/07-equipa.html`.
 *
 * O ranking chega pronto do servidor (`team_leaderboard`, `017`): por conta, o nome, as
 * sessões e o volume em quilos. Aqui só se ordena, se numera e se encontra a tua linha —
 * volume real, e nunca pontos.
 */
export type LeaderRow = {
  user_id: string;
  name: string | null;
  photo: string | null;
  sessions: number;
  volume_kg: number;
  prev_volume_kg: number | null;
};

export type Ranked = LeaderRow & { rank: number; isYou: boolean; isTop: boolean; delta: number | null };

export function rank(rows: readonly LeaderRow[], me: string | null): Ranked[] {
  const sorted = [...rows].sort(
    (a, b) => Number(b.volume_kg) - Number(a.volume_kg) || b.sessions - a.sessions,
  );
  return sorted.map((r, i) => ({
    ...r,
    volume_kg: Number(r.volume_kg),
    rank: i + 1,
    isYou: r.user_id === me,
    isTop: i < 3 && Number(r.volume_kg) > 0,
    delta: r.prev_volume_kg === null ? null : Number(r.volume_kg) - Number(r.prev_volume_kg),
  }));
}

/** Toneladas com uma casa, como o protótipo: "44,7 t". */
export function tonnes(kg: number): number {
  return Math.round(kg / 100) / 10;
}

/**
 * Os dias em que um treinador pode, nos próximos `span` dias, a partir de `preferred_days`
 * (1 = segunda … 7 = domingo). Sem disponibilidade registada, nenhum — e não se desenha
 * uma grelha de vagas a fingir.
 */
export function openDays(preferred: readonly number[], from: Date, span = 14): Date[] {
  if (!preferred.length) return [];
  const out: Date[] = [];
  for (let i = 1; i <= span; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const iso = ((d.getDay() + 6) % 7) + 1;
    if (preferred.includes(iso)) out.push(d);
  }
  return out;
}

/** O instante marcado, em hora local, como ISO para `timestamptz`. */
export function startsAt(day: Date, hour: number, minute = 0): string {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).toISOString();
}
