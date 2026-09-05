import type React from 'react';

/**
 * A short aside inside a screen: a label, and a sentence that belongs to it.
 *
 * It lived inside `DayView` while the day was the only screen that had anything to
 * set aside. The week needs the same shape now that the deload has to explain itself
 * wherever the phase is chosen, so it moved out rather than being written twice.
 *
 * The label is the accent line and the body is page text: on `bg-accent-soft` the
 * muted token is mixed for the page and lands short of 4.5:1, so the second line
 * carries the full-strength colour and the step between the two is size and weight.
 */
export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-card border border-accent-line/25 bg-accent-soft px-4 py-3">
      <p className="font-ui text-[11px] font-700 uppercase tracking-[0.05em] text-accent-line">
        {title}
      </p>
      <p className="mt-1 font-ui text-[13px] leading-snug text-text">{children}</p>
    </div>
  );
}
