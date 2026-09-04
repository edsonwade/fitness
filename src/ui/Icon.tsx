import clsx from 'clsx';

/**
 * One stroke family for the whole application.
 *
 * The project had no icon dependency and Field.tsx drew its two glyphs inline with a
 * note that the family was still an open decision. This is that decision: a single
 * component, one stroke weight, so a screen never mixes two icon languages. Every
 * path is drawn on the same 24-grid with round caps and joins, which is the shape
 * language the pinned references use.
 *
 * Adding a glyph is one entry here, not a new inline SVG on a surface. That keeps the
 * weight and the grid consistent, which is the whole reason an icon set exists rather
 * than a scattering of paths.
 */
const PATHS = {
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M5 12l7 7 7-7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 13l4 4L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  play: 'M8 5v14l11-7z',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L20 8l-4-4L4 16zM14 6l4 4',
  target: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 20a5.5 5.5 0 0 1 11 0M16 7.5a3 3 0 0 1 0 6M17 14.5a5 5 0 0 1 3.5 5.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7',
  download: 'M12 4v11M8 11l4 4 4-4M5 20h14',
  upload: 'M12 20V9M8 13l4-4 4 4M5 5h14',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 6h14v14H5zM8 12h3M8 16h8',
  flag: 'M6 21V4M6 4h11l-2 4 2 4H6',
  info: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  alert: 'M12 4.5 3 20h18zM12 10v4M12 17h.01',
  external: 'M7 17L17 7M9 7h8v8',
  dumbbell: 'M6.5 9v6M17.5 9v6M4 10.5v3M20 10.5v3M9 12h6',
  book: 'M5 4h9l5 5v11H5zM14 4v5h5',
  sun: 'M12 5a7 7 0 1 0 0 14M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
  system: 'M3 5h18v12H3zM8 21h8M12 17v4',
  camera: 'M4 8h3l2-2h6l2 2h3v12H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  logout: 'M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M9 12h11M17 9l3 3-3 3',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.9,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/**
 * The circular control that flanks a title on every screen: back, close, a menu.
 * The reference draws it as a raised disc on the surface colour, which is what the
 * shadow token carries.
 */
export function IconButton({
  icon,
  label,
  onClick,
  className,
  size = 'md',
  type = 'button',
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={onClick}
      className={clsx(
        'grid shrink-0 place-items-center rounded-full bg-surface text-text',
        'shadow-[var(--shadow-card)]',
        'transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'active:scale-[0.96] motion-reduce:active:scale-100',
        size === 'md' ? 'h-11 w-11' : 'h-9 w-9',
        className,
      )}
    >
      <Icon name={icon} size={size === 'md' ? 20 : 17} strokeWidth={2} />
    </button>
  );
}
