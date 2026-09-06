import type { BlockKey } from '../../content';
import type { ExerciseLog, Session } from '../../data/entities';
import type { LogFields, SessionEntryInput } from '../../data/mutations';
import { useRows } from '../../data/queries';
import type { DayEntry } from './day-entries';
import { logId, setsDoneFor } from './logs';

/**
 * The record: what was trained, and on what day.
 *
 * `exercise_logs` is the state of the bar right now — one row per exercise, overwritten
 * every time, with no date on it at all. That is why the application, until this file
 * existed, could not answer a single question about last week. `sessions` is the other
 * half: one row per training day actually done, with the day it was done on, and the
 * exercises under it as they stood.
 *
 * Both are kept. They are not two versions of the same thing: one is the present and one
 * is the past, and replacing the first with the second would have cost the app the
 * loads it reads back onto the cards.
 *
 * Everything here is pure and knows nothing about React or the network, apart from the
 * one hook at the bottom, because the rule it holds — **what counts as a workout
 * happening** — is the kind of thing that has to be testable without a browser.
 */

/**
 * What counts as trained, in the user's own words (2026-09-06):
 *
 * | Opening the day | no | Changing an exercise | no |
 * | Changing the planned load | no | Writing the load of a set | no |
 * | Changing the planned reps | no | Adding a note | no |
 * | **Ticking a set** | **yes** | **Finishing the workout** | **yes** |
 *
 * So the gate is a count of ticked sets and not "did anything get written". Writing a
 * load with nothing ticked is planning; counting it as a session would inflate every
 * streak and consistency figure that reads this table later.
 */
export function totalSetsDone(entries: readonly SessionEntryInput[]): number {
  let done = 0;
  for (const entry of entries) done += entry.sets_done;
  return done;
}

/**
 * The user's calendar day, as `YYYY-MM-DD`.
 *
 * Local, never UTC, and that is the whole point of the function. A set ticked at 23:30 in
 * Lisbon in summer is already tomorrow in UTC, so slicing an ISO string would file the
 * back half of an evening workout as a second session on the next day — and the identity
 * of a session is exactly this date. `toISOString().slice(0, 10)` is the bug this exists
 * to not have.
 */
export function localDate(at: Date): string {
  const year = at.getFullYear();
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The edit being made right now, which is not in the fetched logs yet. */
export type LogPatch = { exKey: string; fields: LogFields };

/**
 * The whole day, as it stands, ready to be recorded.
 *
 * The snapshot is complete rather than incremental — every exercise the day has, every
 * time — because `record_session` replaces the entries it finds. That is what keeps a
 * session honest when the day is edited mid-workout: an exercise taken out leaves the
 * session, one added joins it, and a reorder cannot end up with two entries claiming the
 * same position.
 *
 * `patch` is the write the user has just made. Without it the snapshot would be one
 * render behind — the tick that opens the session would be missing from the session it
 * opens — because the fetched logs only catch up when the server answers.
 *
 * The prescription travels beside the result, which is the point of `target_sets` and
 * `target_reps`: planned against done is the comparison the phases after this one are
 * built on, and it cannot be reconstructed later, because the programme's blocks move on.
 */
export function buildSessionEntries(
  dayNo: number,
  block: BlockKey,
  entries: readonly DayEntry[],
  byKey: Map<string, ExerciseLog>,
  patch?: LogPatch,
): SessionEntryInput[] {
  return entries.map((entry) => {
    const stored = byKey.get(logId(dayNo, block, entry.key));
    const log: Partial<ExerciseLog> =
      patch && patch.exKey === entry.key ? { ...stored, ...patch.fields } : (stored ?? {});
    const prescribed = entry.prescription.s;

    return {
      ex_key: entry.key,
      name: entry.name,
      target_sets: String(prescribed),
      target_reps: entry.prescription.r,
      /*
       * Null in the live app, always. The column exists so the v1 backfill could keep a
       * prescription string it could not take apart, and nothing here is unreadable:
       * the block states its sets and reps separately. Writing the two joined back
       * together would be storing formatting as data, which is what `003` refused.
       */
      target_raw: null,
      sets_done: setsDoneFor(log, prescribed).filter(Boolean).length,
      sets_total: prescribed,
      weight: log.weight ?? null,
      reps: log.reps ?? null,
      note: log.note ?? null,
    };
  });
}

/**
 * The calendar day a session belongs to.
 *
 * `local_date` for everything the live app writes. The rows the v1 mapper brought over
 * have none — the old app stored an instant and nothing else — so those fall back to the
 * date inside `performed_at`. It is the best that history can be read as, and dropping
 * those rows instead would throw away the only past the user actually has.
 */
export function sessionDate(session: Session): string {
  return session.local_date ?? session.performed_at.slice(0, 10);
}

/**
 * The session of one training day on one calendar day, if there is one.
 *
 * `(day_no, local_date)` is the identity the whole record is built on — the unique
 * index in `011` §3 is this same pair — so this is the lookup and not a search. A day
 * opened on a date it was never trained on has no session, and that absence is a
 * meaningful answer rather than a missing one.
 */
export function sessionFor(
  rows: readonly Session[],
  dayNo: number,
  date: string,
): Session | undefined {
  return rows.find((row) => row.day_no === dayNo && sessionDate(row) === date);
}

/**
 * The third level: **no workout, one under way, or one the user finished.**
 *
 * The three levels are independent (user, 2026-09-06). A set is done or not; an
 * exercise is `idle`/`doing`/`done` by counting its sets (`exerciseState`); a workout
 * is open or finished **by decision**. Ticking the last set of the day does not finish
 * a workout, exactly as it does not in Strong or Hevy — both let you finish with
 * exercises still untouched, because stopping is a thing a person chooses.
 *
 * `none` is not the same as `open`: nothing has been ticked at all, so there is no
 * workout to be in the middle of, and the screen says nothing rather than claiming one
 * is under way.
 *
 * Finished stays finished (his rule, same day). Nothing here can walk `done` back, and
 * neither can the server: `record_session` keeps the end it already has.
 */
export type WorkoutState = 'none' | 'open' | 'done';

export function workoutState(session: Session | undefined): WorkoutState {
  if (!session) return 'none';
  return session.finished_at ? 'done' : 'open';
}

/**
 * Every session in a date range, both ends included, newest first.
 *
 * Inclusive because the ranges the screens ask for are spoken ranges — "this week", "the
 * last thirty days" — and a half-open one silently drops today.
 */
export function sessionsBetween(
  rows: readonly Session[],
  from: string,
  to: string,
): Session[] {
  return rows
    .filter((row) => {
      const date = sessionDate(row);
      return date >= from && date <= to;
    })
    .sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)));
}

/**
 * Every session this account has recorded.
 *
 * Read whole, like the other private tables: a training history is one row per day
 * trained, so a year of five sessions a week is a few hundred rows, and one list serves
 * the trend, the chart and the calendar rather than three overlapping range queries.
 * `session_entries` is the one table that is not read this way — see `SCOPE_COLUMN`.
 */
export function useSessions() {
  return useRows('sessions');
}
