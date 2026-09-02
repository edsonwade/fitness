/**
 * This browser tab's identity, written into every mutation as `updated_by_client`.
 *
 * Realtime delivers a device its own writes back. Without a way to recognise them,
 * a tab applies its own change twice: once optimistically, once when the echo
 * arrives, and the second application lands after the user has already typed the
 * next thing. The old code solves the same problem for the shared catalogue by
 * comparing signatures after the fact (`js/shared.js:157`); doing it in the write
 * path is cheaper and exact.
 *
 * Per TAB, not per browser: two tabs open on the same account are two independent
 * optimistic states, and a write from one genuinely is remote news to the other.
 * `sessionStorage` rather than `localStorage` is what makes that true, and it also
 * means the id survives a reload, so an in-flight echo arriving after a refresh is
 * still recognised.
 */
const STORAGE_KEY = 'vw.client-id';

function create(): string {
  // `randomUUID` needs a secure context. Dev over plain http on a LAN address is
  // not one, and falling over there would break the app for a mid-set reload.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

let cached: string | null = null;

export function clientId(): string {
  if (cached) return cached;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      cached = stored;
      return stored;
    }
    const fresh = create();
    sessionStorage.setItem(STORAGE_KEY, fresh);
    cached = fresh;
    return fresh;
  } catch {
    // Private mode, or storage blocked. An id that does not survive a reload is
    // still correct for echo suppression within this page's lifetime.
    cached = cached ?? create();
    return cached;
  }
}

/** True when a realtime row is this tab's own write coming back. */
export function isOwnEcho(row: { updated_by_client?: string | null } | null | undefined): boolean {
  return !!row?.updated_by_client && row.updated_by_client === clientId();
}

/** Stamps a mutation payload so the echo can be recognised when it returns. */
export function stamp<T extends Record<string, unknown>>(payload: T): T & { updated_by_client: string } {
  return { ...payload, updated_by_client: clientId() };
}
