import type { ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import clsx from 'clsx';

import { useRepaintHold } from '../data/repaint-guard';
import { pt } from '../i18n/pt';
import { Icon } from './Icon';

/**
 * The bottom sheet every form in this app opens into.
 *
 * A sheet rather than a page because of where this is used: a phone held in one hand
 * between sets. The day stays behind it, the thumb reaches the controls at the bottom
 * of the screen rather than the top, and dismissing is a downward swipe, which is the
 * gesture the hand is already making.
 *
 * Base UI's Drawer carries the parts that are easy to get wrong and impossible to see
 * in a screenshot: focus is trapped and returned to whatever opened it, Escape closes,
 * the page behind stops scrolling, and the popup is `aria-modal` with the title wired
 * to it. Section 6 of the architecture plan picked this over the hand-rolled `#sheet`
 * for exactly that list.
 *
 * `useRepaintHold` is the product's own rule on top: while this is open, a change
 * arriving from another device is held rather than applied. Someone editing an
 * exercise must not have the fields redrawn under their thumb because the same account
 * ticked a set on a tablet.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Pinned under the scroll region, so the primary action is always reachable. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  useRepaintHold(open);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} swipeDirection="down">
      <Drawer.Portal>
        <Drawer.Backdrop
          className={clsx(
            'fixed inset-0 z-40 min-h-dvh bg-black',
            'opacity-[calc(0.45*(1-var(--drawer-swipe-progress)))]',
            'transition-opacity duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            'data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0',
            'motion-reduce:transition-none',
          )}
        />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup
            className={clsx(
              'flex max-h-[88dvh] w-full max-w-[26.5rem] flex-col',
              'rounded-t-[28px] border border-b-0 border-rule bg-ground',
              'shadow-[var(--shadow-float)] outline-none',
              '[transform:translateY(var(--drawer-swipe-movement-y))]',
              'transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
              'data-swiping:select-none data-swiping:duration-0',
              'data-starting-style:[transform:translateY(100%)]',
              'data-ending-style:[transform:translateY(100%)]',
              'motion-reduce:transition-none',
            )}
          >
            {/* The grab handle. Decorative: the close button is the accessible path. */}
            <div className="flex shrink-0 justify-center pt-2.5" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-surface-sunken" />
            </div>

            <header className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-3">
              <div className="min-w-0 flex-1">
                <Drawer.Title className="font-ui text-[19px] font-700 leading-tight text-text">
                  {title}
                </Drawer.Title>
                {description ? (
                  <Drawer.Description className="mt-1 font-ui text-[13px] leading-snug text-text-muted">
                    {description}
                  </Drawer.Description>
                ) : null}
              </div>
              {/*
                * Styled here rather than through `IconButton` because Base UI needs to
                * put its own click handler and ref on this element, and that primitive
                * forwards neither.
                */}
              <Drawer.Close
                aria-label={pt.common.close}
                className={clsx(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-text',
                  'shadow-[var(--shadow-card)]',
                  'transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                  'active:scale-[0.96] motion-reduce:active:scale-100',
                )}
              >
                <Icon name="x" size={18} strokeWidth={2.2} />
              </Drawer.Close>
            </header>

            <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </Drawer.Content>

            {footer ? (
              <div className="shrink-0 border-t border-rule bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                {footer}
              </div>
            ) : null}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
