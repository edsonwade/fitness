import { createContext } from 'react';

/**
 * The pickup a card is given so it can be reordered by direct manipulation.
 *
 * `rootProps` are the press-and-hold handlers the card body wears: hold still on the
 * card and it lifts; move first and the page scrolls instead. `handleProps` are the
 * grab handle's own — an immediate pointer pickup, and the keyboard path (arrows) for
 * anyone who cannot drag. One handle, not two chevrons: the arrows the interaction
 * requirement forbids do not come back as an accessibility afterthought.
 */
export type CardReorder = {
  lifted: boolean;
  position: number;
  total: number;
  /** Shared id of the visually-hidden instructions the handle points at. */
  hintId: string;
  rootProps: React.HTMLAttributes<HTMLElement>;
  handleProps: {
    onPointerDown: (event: React.PointerEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
};

/**
 * The pickup for the card that reads it, supplied by `ReorderableCard`. Passed through
 * context rather than a prop so the card body — video, chips, inputs and all — stays
 * ordinary children of the reorderable row, and the row never has to invoke a render
 * callback with its own drag refs while it is still rendering.
 *
 * Null when the card is not inside a reorderable list (e.g. still loading): then there
 * is no handle and no lifted state, exactly as before this phase.
 */
export const ReorderContext = createContext<CardReorder | null>(null);
