import type { Session, SessionEntry } from '../../data/entities';
import { sessionsBetween } from './sessions';

/**
 * The interpretation layer: load, volume, trend, consistency, from the record.
 *
 * This is §10.2 of the plan as code — "when there is enough data". The record (phase 005)
 * is `sessions` and `session_entries`; this file turns it into the four numbers every
 * later phase reads (007, 008, 013, 014, 016, 017, 018), so none of them reinvents the
 * arithmetic or, worse, invents a number the data does not support.
 *
 * The one rule that shapes every function: **a metric either carries the value, or the
 * reason it cannot.** Never a `0`, a `NaN`, or a `+0%`. "+0% vs. last week" in the first
 * week of use is a lie with the shape of a fact, and the first screen to forget the
 * empty case is the one that ships it. The discriminated result below makes forgetting a
 * type error rather than a bad render.
 *
 * Everything here is pure — `import type` only, no React, no network. The caller that
 * knows about rows and the network passes the rows in; this file only counts.
 */

/** Why a metric has no value. Each is a real state the record can be in, not an error. */
export type MetricGap =
  /** No session in the window carried a legible load — the first-use empty week. */
  | 'sem-dados'
  /** This period is shorter than the one it would be compared to; a comparison lies. */
  | 'periodo-incompleto'
  /** Sessions exist in the window, but not one entry had both a load and reps to read. */
  | 'sem-carga-legivel';

/** One entry left out of a load, and why. The count of these is itself the honest answer. */
export type Excluded = {
  name: string;
  reason: 'sem-peso' | 'sem-reps' | 'peso-ilegivel' | 'reps-ilegivel' | 'sem-series';
};

/**
 * The value, with what it had to leave out — or the reason there is no value.
 *
 * `excluded` rides on the success case on purpose: a load can be real and still have left
 * a stretch or a walk out of the sum, and the screen that shows "4.820 kg" is the one
 * that should be able to say "(2 exercises without a load)" beside it.
 */
export type Metric<T> =
  | { ok: true; value: T; excluded: Excluded[] }
  | { ok: false; reason: MetricGap };

/**
 * A free-text weight as a number of kilos, or null when it cannot be read as one.
 *
 * The molde is `parseRestSeconds` in `logs.ts`: take the first number, and do not guess
 * past it. `weight` is what a real person typed — '60', '12,5', '10/hand', 'bodyweight' —
 * so a comma is a decimal point, a slash means "per hand" and is too ambiguous to sum, and
 * a word with no number in it is a load the app was never told. Each of those is `null`,
 * which keeps the entry out of the sum instead of counting it as zero kilos lifted.
 */
export function parseLoadKg(weight: string | null): number | null {
  if (weight === null) return null;
  const text = weight.trim();
  if (text === '') return null;
  /* '10/hand', '2x20' — a load split across a phrase is not one number to multiply. */
  if (/[/×x]/i.test(text)) return null;
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/**
 * A free-text rep count as a number, or null when it cannot be read as one.
 *
 * The first whole number, which is the floor of a range — '8-10' is read as 8, the same
 * honest lower bound `parseRestSeconds` reads a rest range as. 'AMRAP' has no number and
 * is `null`: it is a real instruction, but not one this layer can multiply.
 */
export function parseReps(reps: string | null): number | null {
  if (reps === null) return null;
  const text = reps.trim();
  if (text === '') return null;
  const match = text.match(/(\d+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/** The display name of an entry, for the excluded list — never blank. */
function entryName(entry: SessionEntry): string {
  return entry.name ?? entry.ex_key ?? '(sem nome)';
}

/**
 * The load of one session: the sum of load × reps × sets done, over the entries that can
 * be read as all three.
 *
 * An entry with no sets done did not happen, and one with no legible load or reps is not a
 * load this layer can add; both leave the sum and land in `excluded` with the reason, so
 * the caller can say how many were set aside rather than silently dropping them. If not one
 * entry contributes, there is no load to report — `sem-carga-legivel`, not `0`.
 */
export function sessionLoad(entries: readonly SessionEntry[]): Metric<number> {
  let total = 0;
  let contributed = false;
  const excluded: Excluded[] = [];

  for (const entry of entries) {
    const done = entry.sets_done;
    if (done === null || done <= 0) {
      excluded.push({ name: entryName(entry), reason: 'sem-series' });
      continue;
    }
    if (entry.weight === null || entry.weight.trim() === '') {
      excluded.push({ name: entryName(entry), reason: 'sem-peso' });
      continue;
    }
    const load = parseLoadKg(entry.weight);
    if (load === null) {
      excluded.push({ name: entryName(entry), reason: 'peso-ilegivel' });
      continue;
    }
    if (entry.reps === null || entry.reps.trim() === '') {
      excluded.push({ name: entryName(entry), reason: 'sem-reps' });
      continue;
    }
    const reps = parseReps(entry.reps);
    if (reps === null) {
      excluded.push({ name: entryName(entry), reason: 'reps-ilegivel' });
      continue;
    }
    total += load * reps * done;
    contributed = true;
  }

  if (!contributed) return { ok: false, reason: 'sem-carga-legivel' };
  return { ok: true, value: total, excluded };
}

/**
 * The volume of a window: the load of every session in it, summed.
 *
 * The range is delimited by `sessionsBetween`, which reuses `sessionDate` so a session
 * filed under the calendar day the person lived, not the UTC instant. `entriesBySession`
 * is a `Map<sessionId, SessionEntry[]>` the caller builds from the fetched rows — this
 * layer does not read the network. A session whose entries are all illegible contributes
 * nothing but is not an error; only a window where no session contributes at all is
 * `sem-dados`, and the excluded entries of every counted session travel out together.
 */
export function volume(
  sessions: readonly Session[],
  entriesBySession: ReadonlyMap<string, SessionEntry[]>,
  from: string,
  to: string,
): Metric<number> {
  const inRange = sessionsBetween(sessions, from, to);
  let total = 0;
  let contributed = false;
  const excluded: Excluded[] = [];

  for (const session of inRange) {
    const load = sessionLoad(entriesBySession.get(session.id) ?? []);
    if (!load.ok) continue;
    total += load.value;
    excluded.push(...load.excluded);
    contributed = true;
  }

  if (!contributed) return { ok: false, reason: 'sem-dados' };
  return { ok: true, value: total, excluded };
}

/**
 * The change from one period's volume to the one before it, as a fraction ((cur-prev)/prev).
 *
 * `currentComplete` is the guard the plan is built on: three days of this week against
 * seven of last week is a drop that never happened, so an incomplete current period refuses
 * to be compared and says `periodo-incompleto`. A missing volume on either side is
 * `sem-dados` — including a previous volume of zero, which would divide into an infinity
 * dressed as growth. What this never returns is `+0%` for a week that only just began.
 */
export function trend(
  current: Metric<number>,
  previous: Metric<number>,
  opts: { currentComplete: boolean },
): Metric<number> {
  if (!opts.currentComplete) return { ok: false, reason: 'periodo-incompleto' };
  if (!current.ok || !previous.ok || previous.value === 0) {
    return { ok: false, reason: 'sem-dados' };
  }
  return { ok: true, value: (current.value - previous.value) / previous.value, excluded: [] };
}

/**
 * Sessions done against sessions planned, as the pair "4 of 5" and never a seventh.
 *
 * The pair stays a pair so the screen can say "4/5" without the layer having decided it is
 * 80%. `planned` is the count of the week's training days, and where it comes from
 * (`user_profiles.training_days`) is a caller in a later, UI-facing phase; this layer only
 * receives the number, so it touches no profile and no network. A `planned` of zero is a
 * week with nothing to be consistent against — `sem-dados`, not `0/0`.
 */
export function consistency(
  done: number,
  planned: number,
): Metric<{ done: number; planned: number }> {
  if (planned <= 0) return { ok: false, reason: 'sem-dados' };
  return { ok: true, value: { done, planned }, excluded: [] };
}
