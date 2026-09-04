import { useId, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string | null;
};

/**
 * A field for a sentence rather than a value.
 *
 * The same label, error and focus behaviour as `Field`, and deliberately the same
 * 16px text: iOS Safari zooms the page when a focused control is smaller, and the
 * way back from that zoom is a two-fingered pinch, one handed, in a gym.
 *
 * It exists because a day's goal and its warm-up are two or three lines of the
 * user's own prose, and a single-line input hides everything but the last few words
 * of what was just typed. `rows` is small on purpose: this grows by scrolling rather
 * than by pushing the sheet's save button off the screen.
 */
export function TextArea({ label, error, className, rows = 3, ...rest }: TextAreaProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-ui text-[13px] font-500 text-text-muted">
        {label}
      </label>

      <textarea
        {...rest}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={clsx(
          'w-full resize-none rounded-field border bg-surface-raised px-4 py-3',
          'font-ui text-[16px] leading-snug text-text placeholder:text-text-muted',
          'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          'focus-visible:outline-offset-[3px]',
          error ? 'border-danger' : 'border-rule pointer-hover:border-edge',
          className,
        )}
      />

      {error ? (
        <p id={errorId} role="alert" className="font-ui text-[13px] leading-snug text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
