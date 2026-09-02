import { useEffect, useRef, useState } from 'react';

import { pt } from '../../i18n/pt';
import { Icon } from '../../ui/Icon';

const t = pt.train;

/**
 * The rest clock, shown only while a rest is running.
 *
 * It starts when a set is ticked, because that is the moment the rest begins, and it
 * counts down rather than up so the number answers the one question between sets:
 * how much longer. The bar is the same measurement drawn a second way, for a glance
 * from across a rack where the digits are too small to read.
 *
 * Reduced motion keeps the number and drops the bar's transition, because the number
 * is the information and the sweep is the decoration.
 */
export function RestTimer({
  seconds,
  exerciseName,
  onClose,
}: {
  seconds: number;
  exerciseName: string;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const done = remaining <= 0;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.focus();
  }, []);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const clock = `${mm}:${ss.toString().padStart(2, '0')}`;
  const pct = total === 0 ? 0 : Math.round(((total - remaining) / total) * 100);

  return (
    <div
      ref={endRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="pointer-events-auto mx-auto w-full max-w-[26.5rem] rounded-t-[24px] border border-b-0 border-rule bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-float)]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-line">
          <Icon name="clock" size={22} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-ui text-[12px] font-600 text-text-muted">
            {done ? t.restDone : t.restRunning}
          </p>
          <p className="truncate font-ui text-[13px] text-text-muted">{exerciseName}</p>
        </div>
        <span className="tabular font-ui text-[26px] font-700 leading-none text-text">
          {clock}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setRemaining((r) => r + 15);
            setTotal((tot) => tot + 15);
          }}
          disabled={done}
          className="min-h-[46px] flex-1 rounded-full border border-rule bg-transparent font-ui text-[13px] font-600 text-text transition-colors duration-[160ms] pointer-hover:border-edge disabled:opacity-50"
        >
          {t.addSeconds}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[46px] flex-1 rounded-full bg-accent font-ui text-[13px] font-700 text-accent-ink transition-transform duration-[160ms] active:scale-[0.98] motion-reduce:active:scale-100"
        >
          {done ? t.restDone : t.skipRest}
        </button>
      </div>
    </div>
  );
}
