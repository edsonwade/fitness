import type { DayEntry } from './day-entries';
import { parseRestSeconds } from './logs';

/**
 * What one phase of the programme costs on this day, before anything is logged.
 *
 * `dayProgress` in `logs.ts` answers "how far through am I"; this answers the
 * question that comes before it, and that the block rail could not answer at all
 * while it said only "Bloco 1": how much of this day is there, and how long will it
 * take. Both read the resolved entries rather than `day.items`, so an exercise the
 * user added counts and one they hid does not.
 */
export type BlockSummary = {
  /** Exercises in the day. Block-independent, because a block changes targets, not the list. */
  count: number;
  /** Rounded minutes, or null when the day prescribes nothing to time. */
  minutes: number | null;
};

/**
 * The estimate is the rest the programme prescribes, and nothing else.
 *
 * Every set is followed by its prescribed rest, so the sum of sets times rest is a
 * figure this content can actually produce. The lifting itself is not timed anywhere
 * in the programme: no exercise carries a duration, and a per-set work constant
 * would be a number invented here and then displayed as if the plan had said it.
 * Section 14 of the plan is explicit that the figures in it are examples of how an
 * interface could present information and "não devem ser interpretados como dados
 * reais", so nothing from the document is allowed to become a literal in this file.
 *
 * The label says `~` for the same reason. An underestimate that is honest about
 * being one is worth more mid-session than a precise-looking number nobody measured.
 */
export function blockSummary(entries: readonly DayEntry[]): BlockSummary {
  let seconds = 0;
  for (const entry of entries) {
    seconds += entry.prescription.s * parseRestSeconds(entry.prescription.rest);
  }

  /*
   * A rest day, and a day whose exercises were all hidden, get no duration at all
   * rather than "~0 min". There is nothing to estimate, and saying so by leaving the
   * line out is the honest answer.
   */
  const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : null;
  return { count: entries.length, minutes };
}
