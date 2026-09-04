import { useState } from 'react';

import type { WriteFailure } from '../data/mutations';
import { pt } from '../i18n/pt';
import { Icon } from './Icon';

const c = pt.common;

/**
 * What a refused write looks like.
 *
 * This replaces a red slab that said "não foi possível guardar" under a screen where
 * the thing it referred to had visibly worked. Three rules came out of that:
 *
 * **It names what did not happen.** Every caller passes a sentence about the specific
 * write, not about the screen. "O dia saiu da semana, mas um exercício acrescentado
 * continua agarrado a ele" is a different problem from "o dia não foi apagado", and a
 * message that cannot tell them apart is a message that will be wrong half the time.
 *
 * **It offers the two moves there are.** Send it again, or let it go. A dead-end alert
 * makes the person reload the app to find out whether it mattered, which is the exact
 * thing they cannot do mid-set.
 *
 * **It keeps the server's own words** behind a disclosure rather than discarding them.
 * Closed, it does not shout; opened, it is the difference between "tenta outra vez" and
 * knowing that a constraint refused the row. Nobody has to read it for the card to work.
 *
 * It is a surface card with a danger-coloured mark, not a wall of red. Red as an
 * enclosure reads as damage; here the damage is one write, and the card is the same
 * furniture as everything else on the screen so it sits in the page instead of alarming
 * over it.
 */
export function WriteFailureNotice({
  failure,
  className,
}: {
  failure: WriteFailure | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!failure) return null;

  return (
    <div
      role="alert"
      className={
        'flex gap-3 rounded-card border border-danger/30 bg-surface p-4 shadow-[var(--shadow-card)] ' +
        (className ?? 'mt-4')
      }
    >
      <span className="shrink-0 pt-0.5 text-danger" aria-hidden="true">
        <Icon name="alert" size={19} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-ui text-[14px] font-700 leading-snug text-text">{failure.what}</p>
        <p className="mt-1 font-ui text-[13px] leading-snug text-text-muted">{c.writeBody}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={failure.retry}
            className={
              'inline-flex min-h-[44px] items-center rounded-full bg-accent px-5 font-ui ' +
              'text-[13px] font-700 text-accent-ink transition-transform ' +
              'duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] ' +
              'active:scale-[0.97] motion-reduce:active:scale-100'
            }
          >
            {c.writeRetry}
          </button>
          <button
            type="button"
            onClick={failure.dismiss}
            className="min-h-[44px] rounded-full px-4 font-ui text-[13px] font-600 text-text-muted"
          >
            {c.writeDismiss}
          </button>
        </div>

        {failure.detail ? (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="min-h-[44px] font-ui text-[12.5px] font-600 text-text-muted underline-offset-4 pointer-hover:underline"
            >
              {open ? c.writeDetailsHide : c.writeDetails}
            </button>
            {open ? (
              <p className="tabular mt-1 break-words font-ui text-[12px] leading-snug text-text-muted">
                {failure.detail}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
