import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import type { BlockKey } from '../../content';
import { pt } from '../../i18n/pt';

const t = pt.train;

/**
 * What the chosen phase is, said in a line — and made to change like a focus pull.
 *
 * The rail names the four phases; this panel underneath says what the selected one
 * trains for. It used to narrate position ("second phase, after Iniciante"), which is
 * only the order the chips already show. Now it carries a short title and a sentence
 * per phase (`pt.train.phaseInfo`), the deload's being the one that explains why its
 * demand drops (§8.1) rather than reading as a fault.
 *
 * Changing phase is not a swap but a transition, because the product owner asked for
 * one: the leaving line rises a little and fades, the arriving line comes up from below
 * and resolves from blurred to sharp, title a beat before its sentence. Both lines are
 * on screen for the ~240ms it takes, so the panel keeps `current` and the phase that is
 * `outgoing`, drawing the outgoing one absolutely on top so it animates out without
 * pushing the layout. A fixed `min-height` keeps the block from jumping as sentences of
 * different length come and go. `prefers-reduced-motion` drops the motion in the CSS.
 *
 * `aria-live` is on the region, not the rail: activating a tab already speaks the tab,
 * not the paragraph that appeared under it, and on the deload that paragraph is the
 * point. The outgoing layer is `aria-hidden`, so the reader hears only the new state.
 * The role is `note` — ancillary content that happens to change with the tab — and it
 * gives the phase gate one selector that means this region and nothing else.
 */
export function PhaseJourney({ block }: { block: BlockKey }) {
  const [current, setCurrent] = useState<BlockKey>(block);
  const [outgoing, setOutgoing] = useState<BlockKey | null>(null);
  const prev = useRef<BlockKey>(block);

  useEffect(() => {
    if (block === prev.current) return;
    setOutgoing(prev.current);
    setCurrent(block);
    prev.current = block;
    // Cleared after the leave animation so the old layer stops being drawn. The
    // duration matches `phase-out` in tokens.css; a little longer is harmless.
    const timer = window.setTimeout(() => setOutgoing(null), 240);
    return () => window.clearTimeout(timer);
  }, [block]);

  return (
    <div role="note" aria-live="polite" aria-atomic="true" className="relative mt-3 min-h-[4.75rem]">
      {outgoing !== null ? <PhaseInfo key={outgoing} block={outgoing} variant="leave" /> : null}
      <PhaseInfo key={current} block={current} variant="enter" />
    </div>
  );
}

/**
 * One phase's line, keyed by block so the animation replays on every change.
 *
 * The enter layer animates its two children on their own timelines (title, then
 * sentence — the stagger lives in the CSS); the leave layer animates as one block and
 * sits absolutely on top so it does not take space. The accent rule on the left is the
 * whole panel's furniture and is the same on both, deload included.
 */
function PhaseInfo({ block, variant }: { block: BlockKey; variant: 'enter' | 'leave' }) {
  const info = t.phaseInfo[block];
  return (
    <div
      aria-hidden={variant === 'leave'}
      className={clsx(
        'border-l-2 border-accent-line/40 pl-3',
        variant === 'enter' ? 'phase-enter' : 'phase-leave absolute inset-x-0 top-0',
      )}
    >
      <p className="font-ui text-[11px] font-700 uppercase tracking-[0.05em] text-accent-line">
        {info.title}
      </p>
      <p className="mt-1 font-ui text-[13px] leading-snug text-text-muted">{info.body}</p>
    </div>
  );
}
