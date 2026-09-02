import { useEffect } from 'react';

/**
 * Two guards the product will not trade away: never repaint over an open sheet,
 * and never repaint over a focused input.
 *
 * These come from the operating context in PRODUCT.md. The app is used one-handed,
 * mid-set, with a phone that has been put down and picked up again. A remote change
 * arriving while a sheet is open, or while someone is typing a weight, must not
 * redraw what they are looking at. It is not dropped either — it waits, and lands
 * the moment the sheet closes or the field is left.
 *
 * The hold is a count, not a flag. Two sheets can be open at once, and a flag would
 * let the first one to close release a guard the second still needs.
 */

const holds = new Set<symbol>();
const listeners = new Set<() => void>();

function notify() {
  if (held()) return;
  for (const listener of [...listeners]) listener();
}

/** True while something on screen must not be repainted underneath. */
export function held(): boolean {
  return holds.size > 0 || hasFocusedInput();
}

/**
 * Whether the user is typing.
 *
 * `isContentEditable` is checked as well as the tags, because a rich note field is
 * a div as far as the DOM is concerned and losing what is being typed into one is
 * no better than losing it from an input.
 */
export function hasFocusedInput(): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  if (active instanceof HTMLElement && active.isContentEditable) return true;
  return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT';
}

/** Takes a hold. Call the returned function to release it. Releasing twice is safe. */
export function hold(): () => void {
  const token = Symbol('repaint-hold');
  holds.add(token);
  return () => {
    if (!holds.delete(token)) return;
    notify();
  };
}

/**
 * Runs `listener` whenever the last guard lifts, so a queued change can be flushed.
 *
 * `focusout` is what makes the typing guard release: the DOM gives no other signal
 * that a field has been left, and without it a change would sit in the queue until
 * the next unrelated one arrived.
 */
export function onFree(listener: () => void): () => void {
  listeners.add(listener);
  const onFocusOut = () => {
    // The focus has not moved yet when focusout fires; the next task sees where it
    // landed. Without this, leaving one input for another would look like release.
    queueMicrotask(notify);
  };
  if (typeof document !== 'undefined') document.addEventListener('focusout', onFocusOut);
  return () => {
    listeners.delete(listener);
    if (typeof document !== 'undefined') document.removeEventListener('focusout', onFocusOut);
  };
}

/** Holds repaints for as long as `active` is true. For sheets, dialogs and menus. */
export function useRepaintHold(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return hold();
  }, [active]);
}

/** Test seam: drops every hold. Never call this from application code. */
export function resetHolds(): void {
  holds.clear();
  listeners.clear();
}
