import { useMemo } from 'react';

import { useRows } from '../../data/queries';
import type { ExerciseLog, SetValue } from '../../data/entities';
import type { BlockKey } from '../../content';
import type { DayEntry } from './day-entries';
import { parseLoadKg, parseReps } from './metrics';

/**
 * The block order lives with the day resolver, because that is what needs it first.
 * Re-exported here so the screens keep one import for everything about a log.
 */
export { BLOCK_KEYS } from './day-entries';

/** A stable key for one logged exercise, matching the table's composite primary key. */
export function logId(dayNo: number, block: BlockKey, exKey: string): string {
  return `${dayNo}:${block}:${exKey}`;
}

/**
 * The user's whole logged history, indexed for lookup by (day, block, exercise).
 *
 * One read of `exercise_logs` serves every card on every day, because the table is
 * bounded by the programme and the alternative, a query per card, would be dozens of
 * subscriptions to the same small list. The map is memoised on the fetched rows so a
 * realtime patch rebuilds it and a re-render does not.
 */
export function useExerciseLogs() {
  const query = useRows('exercise_logs');
  const byKey = useMemo(() => {
    const map = new Map<string, ExerciseLog>();
    for (const row of query.data ?? []) {
      map.set(logId(row.day_no, row.block as BlockKey, row.ex_key), row);
    }
    return map;
  }, [query.data]);

  return { ...query, byKey };
}

/**
 * The second of the three levels: **not started, under way, complete.**
 *
 * The levels are independent, and that is the whole rule (user, 2026-09-06): a set is
 * done or not, an exercise is these three, and a workout is open or finished. Only the
 * first two are decided by counting. The third is a decision, and it lives in
 * `sessions.ts` — reading "all sets ticked" as "workout finished" is the exact bug this
 * split exists to remove.
 *
 * An exercise with no sets prescribed is `idle` and not `done`. `every` on an empty
 * array is true, so the naive reading would report a workout's worth of complete
 * exercises for a day nobody has touched.
 */
export type ExerciseState = 'idle' | 'doing' | 'done';

export function exerciseState(done: readonly boolean[]): ExerciseState {
  if (done.length === 0) return 'idle';
  let count = 0;
  for (const set of done) if (set) count += 1;
  if (count === 0) return 'idle';
  return count === done.length ? 'done' : 'doing';
}

export type DayProgress = {
  done: number;
  total: number;
  pct: number;
  /** Exercises in the day, and how many of them are complete. */
  exercises: number;
  exercisesDone: number;
};

/**
 * How far through a day the user is, for one block.
 *
 * It counts the day the user actually has, not the day the bundle shipped: the
 * entries come from `resolveDayEntries`, so an exercise you added counts towards the
 * total, one you hid does not, and a set count you changed is the count this measures
 * against. Reading `day.items` here instead was the bug that made the ring on the
 * week disagree with the bar inside the day.
 *
 * Done is capped per exercise at what this block prescribes: a log carried over from
 * a block with more sets cannot report more than this block asks for, which would
 * otherwise show 120 percent on a deload.
 *
 * It counts both levels in one pass — sets, and the exercises those sets complete —
 * because the day's card states them side by side ("19/19 séries · 5 de 5 exercícios")
 * and two functions walking the same list would be two chances for them to disagree.
 */
export function dayProgress(
  dayNo: number,
  block: BlockKey,
  entries: readonly DayEntry[],
  byKey: Map<string, ExerciseLog>,
): DayProgress {
  let total = 0;
  let done = 0;
  let exercisesDone = 0;
  for (const entry of entries) {
    const prescribed = entry.prescription.s;
    total += prescribed;
    const sets = setsDoneFor(byKey.get(logId(dayNo, block, entry.logKey ?? entry.key)), prescribed);
    done += sets.filter(Boolean).length;
    if (exerciseState(sets) === 'done') exercisesDone += 1;
  }
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct, exercises: entries.length, exercisesDone };
}

/**
 * Reads a set-completion array for an exercise, padded or trimmed to the block's count.
 *
 * Typed by shape rather than by row: the session snapshot counts a log with the edit the
 * user has just made laid over it, and that value is a log's fields and not a whole row.
 */
export function setsDoneFor(
  log: { sets_done?: boolean[] | null } | undefined,
  prescribed: number,
): boolean[] {
  const base = log?.sets_done ?? [];
  return Array.from({ length: prescribed }, (_, i) => base[i] ?? false);
}

/**
 * Reads each set's own numbers (`014`), padded or trimmed to the block's count like
 * `setsDoneFor`, so position `i` always means "set `i + 1`" and never runs off the end.
 *
 * Typed by shape for the same reason as `setsDoneFor`, and tolerant of a row with no
 * `sets` at all: that is what a database where `014` has not been run sends.
 */
export function setValuesFor(
  log: { sets?: readonly SetValue[] | null } | undefined,
  prescribed: number,
): SetValue[] {
  const base = log?.sets ?? [];
  return Array.from({ length: prescribed }, (_, i) => base[i] ?? {});
}

/**
 * Reads a rest prescription like "90s", "2 min" or "60-90s" into seconds.
 *
 * The programme's rest strings are free text authored by hand, so this takes the
 * first number it finds and multiplies by sixty when the unit is minutes. A range
 * rests for its lower bound, which is the honest reading of "rest 60 to 90": you are
 * cleared to go again at sixty.
 */
export function parseRestSeconds(rest: string, fallback = 90): number {
  const match = rest.match(/(\d+)/);
  if (!match) return fallback;
  const value = Number(match[1]);
  return /min/i.test(rest) ? value * 60 : value;
}

/**
 * Reads an effort prescription like "8", "7-8" or "RPE 8,5" into a number of RPE.
 *
 * The sibling of `parseRestSeconds`, and it reads a range the same honest way: "7 to 8"
 * is cleared at 7. Half points count, because the effort scale moves in halves, and a
 * comma is a decimal point because that is how the load is written in this app. A
 * prescription with no number in it — a word, a dash — is `null` rather than a guess.
 */
export function parseRpe(rpe: string): number | null {
  const match = rpe.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/**
 * The volume of the session so far, in kilos: load × reps, summed over the sets ticked.
 *
 * Set by set, because since `014` a set can carry its own load and reps — the first set
 * at 60 and the third at 62.5 are two different volumes.
 *
 * The live twin of `sessionLoad` in `metrics.ts`, and it obeys the same rule rather than
 * a friendlier one: an entry counts only when the record carries **both** a legible load
 * and legible reps. Falling back to the prescribed numbers would be counting what the
 * programme asked for as if it had been lifted, and the bar at the bottom of the sheet
 * would then disagree with every number the history screens report from the same rows.
 *
 * A session where nothing has been logged is therefore `0`, which is the number the
 * prototype's own sheet shows before the first set is marked.
 */
export function sessionVolume(
  dayNo: number,
  block: BlockKey,
  entries: readonly DayEntry[],
  byKey: Map<string, ExerciseLog>,
): number {
  let total = 0;
  for (const entry of entries) {
    const log = byKey.get(logId(dayNo, block, entry.logKey ?? entry.key));
    if (!log) continue;
    const done = setsDoneFor(log, entry.prescription.s);
    const values = setValuesFor(log, entry.prescription.s);
    const wholeLoad = parseLoadKg(log.weight);
    const wholeReps = parseReps(log.reps);
    done.forEach((isDone, i) => {
      if (!isDone) return;
      /* A set's own number wins; the exercise-wide column is what a set with no number
         of its own was logged at, which is every set logged before `014`. */
      const load = values[i].weight ?? wholeLoad;
      const reps = values[i].reps ?? wholeReps;
      if (load === null || load === undefined || reps === null || reps === undefined) return;
      total += load * reps;
    });
  }
  return total;
}
