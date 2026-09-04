import type { ReactNode } from 'react';

/**
 * A whole screen carrying one short message: the session splash, a route error, a
 * page that does not exist.
 *
 * These three states are the ones a router quietly ships as a blank page or as
 * React Router's own unstyled default. They are part of the product, so they are
 * built in the committed world rather than left to a framework fallback.
 *
 * The app frame is the same one the Programs screen uses: page colour outside, the
 * ground inside a rounded panel, so a message screen reads as the same application
 * and not as a browser error.
 */
export function Screen({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-page py-0 sm:py-8">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[26.5rem] flex-col items-center justify-center gap-4 overflow-hidden bg-ground px-8 text-center sm:min-h-[32rem] sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        <h1 className="font-ui text-[22px] font-700 leading-[1.15] text-text">{title}</h1>
        {body ? (
          <p className="max-w-[28ch] font-ui text-[14px] leading-relaxed text-text-muted">{body}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/**
 * Shown while the first session read resolves.
 *
 * Deliberately not a spinner. The wait is normally under 200ms, and a spinner that
 * appears and vanishes inside a blink reads as a flicker of breakage. This holds
 * the frame at rest, so a fast resolve looks like the app simply opening.
 *
 * `aria-busy` and the polite live region carry the state to a screen reader, which
 * is what a silent frame would otherwise fail to do.
 *
 * `label` exists because the same resting frame is now the right answer to a second
 * short wait: a training day of the user's own arrives from the database rather than
 * from the bundle, so opening one from a link waits on a row. The frame is identical;
 * only what a screen reader is told differs, and it should not be told the app is
 * opening when the app is already open.
 */
export function SessionSplash({ label = 'A abrir a aplicação' }: { label?: string }) {
  return (
    <div
      className="min-h-[100dvh] bg-page py-0 sm:py-8"
      aria-busy="true"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div className="mx-auto min-h-[100dvh] w-full max-w-[26.5rem] bg-ground sm:min-h-[32rem] sm:rounded-[40px] sm:shadow-[var(--shadow-float)]" />
    </div>
  );
}
