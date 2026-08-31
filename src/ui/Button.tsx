import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  children: ReactNode;
};

/**
 * The pressable.
 *
 * Full pill, per the shape lock read off the pinned reference. Primary is the accent
 * fill with its own ink token: the orange in light at 7.4:1, the mint in dark at
 * 15.1:1.
 *
 * Sentence case, not the letterspaced small caps this carried from the retired
 * industrial world. Both pinned references set every pill in sentence case, and caps
 * plus tracking is the one detail that made this button look like a different app
 * from the screen it sits on.
 *
 * Loading is a real state, not a disabled button with a changed word: the label is
 * swapped, `aria-busy` is set, and the control stops accepting presses so a slow
 * network cannot produce two sign-ups.
 */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const inert = disabled || loading;

  return (
    <button
      {...rest}
      disabled={inert}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full px-6',
        'font-ui text-[15px] font-700',
        'transition-[background-color,color,border-color,opacity,transform]',
        'duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        // Tactile press. Dropped under reduced motion, where movement is what goes
        // and colour is what stays.
        !inert && 'active:scale-[0.98] motion-reduce:active:scale-100',
        variant === 'primary' && 'bg-accent text-accent-ink pointer-hover:bg-accent-hover',
        variant === 'ghost' &&
          'border border-rule bg-transparent text-text pointer-hover:border-edge',
        inert && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/**
 * Shown only inside a button that is already labelled, so it is decorative here and
 * the label carries the meaning. Kept to opacity and rotation, both cheap.
 */
function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      className="animate-spin motion-reduce:animate-none"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
