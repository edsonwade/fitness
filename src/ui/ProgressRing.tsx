import clsx from 'clsx';

type Props = {
  /** 0 to 100. */
  value: number;
  label: string;
  size?: number;
  className?: string;
};

/**
 * A progress ring, as the pinned reference uses on every workout card.
 *
 * The value is announced through a real `progressbar` role rather than being left
 * as a decorative arc with a number floating inside it, so the figure reaches a
 * screen reader as a measurement instead of as loose text.
 *
 * The arc is drawn with `stroke-dasharray` on a circle. That is a static geometry
 * calculation, not an animation: this number is functional data the user reads, and
 * counting it up would slow down the answer to "how far am I".
 */
export function ProgressRing({ value, label, size = 52, className }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={clsx('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-accent-soft"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="text-accent"
        />
      </svg>
      <span className="tabular absolute font-ui text-[12px] font-600 leading-none text-text">
        {clamped}%
      </span>
    </div>
  );
}
