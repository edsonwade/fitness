import { useId, useState, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  /** Renders the show/hide control and manages the input type. */
  revealable?: boolean;
  showLabel?: string;
  hideLabel?: string;
};

/**
 * One text field.
 *
 * Label above the input, error below it, never a placeholder standing in for a
 * label. The error is wired through `aria-describedby` and announced politely, so
 * it reaches a screen reader instead of only being visible.
 *
 * The input is 16px on purpose. iOS Safari zooms the whole page when a focused
 * input is smaller than that, and the recovery from that zoom is a pinch, one
 * handed, mid-set.
 */
export function Field({
  label,
  error,
  revealable = false,
  showLabel = 'Mostrar',
  hideLabel = 'Esconder',
  className,
  type = 'text',
  ...rest
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const resolvedType = revealable ? (revealed ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-ui text-[13px] font-500 text-text-muted"
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...rest}
          id={id}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            'w-full rounded-field border bg-surface-raised px-4 font-ui text-[16px] text-text',
            // 52px keeps the target well clear of the 24px floor, which the gym
            // scene needs: sweaty hands and a phone held in one hand.
            'min-h-[52px] placeholder:text-text-muted',
            'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
            // No border swap on focus. The global :focus-visible outline in
            // tokens.css is the indicator; recolouring the border too drew a second
            // concentric ring around every focused field.
            'focus-visible:outline-offset-[3px]',
            revealable && 'pr-[52px]',
            error ? 'border-danger' : 'border-rule pointer-hover:border-edge',
            className,
          )}
        />

        {revealable ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? hideLabel : showLabel}
            aria-pressed={revealed}
            className={clsx(
              'absolute right-1 top-1/2 grid h-[44px] w-[44px] -translate-y-1/2 place-items-center',
              'rounded-full text-text-muted',
              'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
              'pointer-hover:text-text',
            )}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="font-ui text-[13px] leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/*
 * Two icons drawn here rather than pulled from a library. The project has no icon
 * dependency yet and the family is still an open decision; adding one for a single
 * glyph pair would pre-empt that choice. Both share one stroke weight so they can
 * be swapped wholesale when the family lands.
 */
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 } as const;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...STROKE}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...STROKE}>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 4M6.5 7.9C3.9 9.6 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 4.2-.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
