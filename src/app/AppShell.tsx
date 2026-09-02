import { NavLink, Outlet } from 'react-router';
import clsx from 'clsx';

import { pt } from '../i18n/pt';

/**
 * The application frame every tabbed surface lives inside.
 *
 * The phone-shaped panel is the same one the gate and the Programs screen draw:
 * the page colour frames it on a wide window, and on a phone it fills the viewport
 * and the frame disappears. The difference is that here it is a fixed-height column
 * whose middle scrolls, so the tab bar is always where a thumb expects it rather
 * than sliding away with the content.
 *
 * Each surface renders its own header and wash inside the scroll region; the shell
 * owns only the frame and the bar. That split is why a surface can be read on its
 * own and why adding one is a route entry plus a file, not a change here.
 */
export function AppShell() {
  return (
    <div className="h-[100dvh] bg-page sm:flex sm:h-auto sm:min-h-[100dvh] sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[26.5rem] flex-col overflow-hidden bg-ground sm:h-[calc(100dvh-4rem)] sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

type Tab = {
  to: string;
  label: string;
  /** The two SVG path strokes: outline first, kept simple so one weight reads at 24px. */
  icon: React.ReactNode;
  end?: boolean;
};

const TABS: Tab[] = [
  {
    to: '/',
    end: true,
    label: pt.nav.train,
    icon: <path d="M6.5 9v6M17.5 9v6M4 12h16M4 10.5v3M20 10.5v3M9 8v8M15 8v8" />,
  },
  {
    to: '/catalogo',
    label: pt.nav.catalog,
    icon: <path d="M5 4h9l5 5v11H5zM14 4v5h5M8 13h7M8 16.5h7" />,
  },
  {
    to: '/objetivos',
    label: pt.nav.goals,
    icon: <path d="M12 3v18M3 12h18M12 12l6-3v6zM7.5 7.5a6.4 6.4 0 1 0 9 9" />,
  },
  {
    to: '/treinadores',
    label: pt.nav.trainers,
    icon: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3.5 20a5.5 5.5 0 0 1 11 0M16 7.5a3 3 0 0 1 0 6M17 14.5a5 5 0 0 1 3.5 5.5" />,
  },
  {
    to: '/perfil',
    label: pt.nav.profile,
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0" />,
  },
];

function BottomNav() {
  return (
    <nav
      aria-label="Secções"
      className="z-20 shrink-0 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around px-1">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 pt-2 pb-1.5',
                  'font-ui text-[10.5px] font-600',
                  'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                  isActive ? 'text-accent-line' : 'text-text-muted pointer-hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="23"
                    height="23"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2.1 : 1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="transition-[stroke-width] duration-[180ms]"
                  >
                    {tab.icon}
                  </svg>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
