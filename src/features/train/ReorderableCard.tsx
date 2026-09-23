import { useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Reorder, useDragControls, useReducedMotion } from 'motion/react';

import { Icon } from '../../ui/Icon';

import { ReorderContext, type CardReorder } from './reorder-context';

/**
 * One reorderable row: a `Reorder.Item` that carries the press-and-hold gesture the
 * interaction requirement asks for, and hands the card the pickup it needs to draw
 * itself lifted.
 *
 * **Why `dragListener={false}`.** Left to itself a `Reorder.Item` starts dragging on the
 * first pointer move, which on a card full of a video, set chips and text inputs would
 * mean every scroll and every tap fought the drag. So the item never listens on its
 * own; a drag begins only when we call `dragControls.start`, and we call it in exactly
 * two places:
 *
 *   - **press-and-hold on the card body** (`rootProps`): hold still on the card for
 *     {@link HOLD_MS}ms and it lifts. Move the finger first, past {@link MOVE_TOL}px, and
 *     it was a scroll — the timer is dropped and the page scrolls as normal. A press
 *     that lands on a button, input or the video is left alone, so the controls inside
 *     the card keep working.
 *   - **the grab handle** (`handleProps`): an immediate, deliberate pickup, and the
 *     keyboard path. The handle is `touch-none`, so a drag straight off it never scrolls.
 *
 * The drag ends on the window's `pointerup`, not on a motion callback, because the
 * gesture can start from either source and the release is the one event both share.
 *
 * `prefers-reduced-motion` drops the layout animation: the list still reorders and the
 * new position is still announced by the day's live region, it just does not slide.
 */
const HOLD_MS = 300;
const MOVE_TOL = 10;

export function ReorderableCard({
  value,
  position,
  total,
  hintId,
  onPickup,
  onDrop,
  onKeyMove,
  children,
}: {
  /**
   * The key this row reorders by; matches one entry in the group's `values`. A string
   * for the exercises (their `ex_key`), a number for the days (their `day_no`).
   */
  value: string | number;
  /** 1-based place in the list, spoken by the handle and the live region. */
  position: number;
  total: number;
  hintId: string;
  onPickup: () => void;
  onDrop: () => void;
  onKeyMove: (direction: 'up' | 'down') => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const [lifted, setLifted] = useState(false);

  // The latest callbacks, so the window listeners we attach on pickup never go stale
  // and never need re-attaching mid-drag. Written in an effect, not during render.
  const cb = useRef({ onPickup, onDrop });
  useEffect(() => {
    cb.current = { onPickup, onDrop };
  });

  const dragging = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const origin = useRef<{ x: number; y: number; event: React.PointerEvent } | null>(null);
  const endDrag = useRef<() => void>(undefined);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = undefined;
    }
    origin.current = null;
  }

  function beginDrag(event: React.PointerEvent) {
    clearHold();
    if (dragging.current) return;
    dragging.current = true;
    setLifted(true);
    cb.current.onPickup();
    controls.start(event);

    const end = () => {
      if (!dragging.current) return;
      dragging.current = false;
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      endDrag.current = undefined;
      setLifted(false);
      cb.current.onDrop();
    };
    endDrag.current = end;
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  // Best-effort cleanup if the row unmounts mid-gesture.
  useEffect(
    () => () => {
      clearHold();
      endDrag.current?.();
    },
    [],
  );

  const rootProps: CardReorder['rootProps'] = {
    onPointerDown: (event) => {
      if (dragging.current || event.button !== 0) return;
      /*
       * A press on a control INSIDE the card is that control's. The card itself can be
       * `role="button"` (the day card is), and it must not count: `closest` finds the
       * card first and the hold never started — bug B5 of
       * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`.
       */
      const el = event.target as HTMLElement;
      const control = el.closest(
        'button, a, input, textarea, select, label, iframe, [role="button"], [contenteditable="true"]',
      );
      if (control && control !== event.currentTarget) return;
      origin.current = { x: event.clientX, y: event.clientY, event };
      holdTimer.current = setTimeout(() => {
        if (origin.current) beginDrag(origin.current.event);
      }, HOLD_MS);
    },
    onPointerMove: (event) => {
      if (!origin.current || dragging.current) return;
      const moved = Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y);
      if (moved > MOVE_TOL) clearHold();
    },
    onPointerUp: clearHold,
    onPointerLeave: clearHold,
  };

  const handleProps: CardReorder['handleProps'] = {
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      beginDrag(event);
    },
    onKeyDown: (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        onKeyMove(event.key === 'ArrowUp' ? 'up' : 'down');
      }
    },
  };

  return (
    <Reorder.Item
      as="li"
      value={value}
      dragListener={false}
      dragControls={controls}
      transition={reduce ? { duration: 0 } : undefined}
      className="list-none"
    >
      <ReorderContext.Provider value={{ lifted, position, total, hintId, rootProps, handleProps }}>
        {children}
      </ReorderContext.Provider>
    </Reorder.Item>
  );
}

/**
 * The grab handle: an immediate pickup on pointer (`touch-none`, so a drag off it never
 * scrolls) and the keyboard path — focus it, Arrow Up / Down moves the row one place.
 * It came back after the redesign took it out and left no visible way to reorder (B5).
 * Renders nothing outside a reorderable list.
 */
export function ReorderHandle({
  name,
  words,
}: {
  name: string;
  words: { reorder: string; position: string; positionOf: string };
}) {
  const reorder = useContext(ReorderContext);
  if (!reorder) return null;
  return (
    <button
      type="button"
      aria-label={`${words.reorder}: ${name}, ${words.position} ${reorder.position} ${words.positionOf} ${reorder.total}`}
      aria-describedby={reorder.hintId}
      onPointerDown={reorder.handleProps.onPointerDown}
      onKeyDown={reorder.handleProps.onKeyDown}
      className={clsx(
        'reorder-handle grid h-11 w-9 shrink-0 touch-none select-none place-items-center rounded-field',
        reorder.lifted ? 'cursor-grabbing' : 'cursor-grab',
      )}
    >
      <Icon name="grip" size={18} strokeWidth={2.2} />
    </button>
  );
}
