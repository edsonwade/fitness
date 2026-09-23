import { formatValue } from '../../ui/scales';

/**
 * Between the prescription as it is stored and the pills that edit it.
 *
 * The four numbers of a prescription are kept as text — "3", "10-12", "2 min",
 * "20 kg/hand" — because that is what the rows, `prog()` and every card already read.
 * The sheet no longer lets anyone type them (his rule of 2026-09-12, and the photos of
 * 2026-09-23 18:06 and 18:10): each one is a pill that opens the wheel. These functions
 * turn the text into the number a pill shows and the picked number back into text.
 *
 * A value these cannot read — "AMRAP", "— to fill in" — reads as empty, and the sheet
 * keeps the original text until someone picks a number, so opening and saving an
 * exercise never rewrites a field nobody touched.
 */

export type RepRange = { min: number; max: number };

/** The first whole or decimal number in a text, with a decimal comma or point. */
function firstNumber(text: string): number | null {
  const match = /(\d+(?:[.,]\d+)?)/.exec(text);
  if (!match) return null;
  const n = Number.parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseSets(text: string): number | null {
  const n = firstNumber(text);
  return n !== null && n >= 1 ? Math.min(10, Math.round(n)) : null;
}

export function formatSets(n: number): string {
  return String(Math.round(n));
}

/** "10-12" and "10–12" are a range, "12" is a fixed count. */
export function parseReps(text: string): RepRange | null {
  const range = /(\d+)\s*[-–—]\s*(\d+)/.exec(text);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const n = firstNumber(text);
  return n !== null && n >= 1 ? { min: Math.round(n), max: Math.round(n) } : null;
}

export function formatReps({ min, max }: RepRange): string {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo === hi ? String(lo) : `${lo}-${hi}`;
}

/**
 * Seconds. "2 min" is 120, "1:30" is 90, "90 s" and "90s" are 90, and a bare number is
 * seconds — the unit every rest in the programme is counted in on the timer.
 */
export function parseRest(text: string): number | null {
  const clock = /(\d+):(\d{2})/.exec(text);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const n = firstNumber(text);
  if (n === null) return null;
  return /min/i.test(text) ? Math.round(n * 60) : Math.round(n);
}

export function formatRest(seconds: number): string {
  return `${Math.round(seconds)} s`;
}

export function parseLoad(text: string): number | null {
  return firstNumber(text);
}

/**
 * The picked load, written back into the text it came from when there was one, so
 * "20 kg/hand" becomes "22,5 kg/hand" and not a bare "22,5 kg" that lost the hand.
 */
export function formatLoad(kg: number, previous: string): string {
  const shown = formatValue(kg, 1);
  if (firstNumber(previous) !== null) {
    return previous.replace(/(\d+(?:[.,]\d+)?)/, shown);
  }
  return `${shown} kg`;
}
