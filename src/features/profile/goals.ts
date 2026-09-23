import type { Goal } from '../../data/entities';

/**
 * Os objetivos — fase 023, `proto/v2/08-perfil.html` frames 1 e 2.
 *
 * `goals` guarda os valores em texto (vieram assim da app antiga: "66", "66 kg", "60,5").
 * Lê-se o primeiro número de cada um; sem número, o objetivo não tem progresso e a barra não
 * aparece — não se inventa uma percentagem.
 */
export function num(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** De 0 a 100: quanto do caminho do início à meta já se fez. Serve para subir e para descer. */
export function goalPct(goal: Pick<Goal, 'start_value' | 'target_value' | 'current_value'>): number | null {
  const start = num(goal.start_value);
  const target = num(goal.target_value);
  const current = num(goal.current_value);
  if (start === null || target === null || current === null || start === target) return null;
  const pct = ((current - start) / (target - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Quanto falta, na unidade do objetivo; zero ou menos é atingido. */
export function remaining(goal: Pick<Goal, 'start_value' | 'target_value' | 'current_value'>): number | null {
  const start = num(goal.start_value);
  const target = num(goal.target_value);
  const current = num(goal.current_value);
  if (target === null || current === null) return null;
  const down = start !== null && target < start;
  const left = down ? current - target : target - current;
  return Math.round(Math.max(0, left) * 10) / 10;
}

/** O "Objetivo perto" do HOJE: o que está mais perto de chegar, sem ter chegado. */
export function nearest(goals: readonly Goal[]): Goal | null {
  let best: { goal: Goal; pct: number } | null = null;
  for (const g of goals) {
    if (g.hit_at) continue;
    const pct = goalPct(g);
    if (pct === null || pct >= 100) continue;
    if (!best || pct > best.pct) best = { goal: g, pct };
  }
  return best?.goal ?? null;
}
