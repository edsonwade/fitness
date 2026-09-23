import { NavLink, Outlet, useLocation } from 'react-router';

import type { Copy } from '../i18n';
import { useT } from '../i18n/locale-context';
import { EventReminders } from '../features/calendar/EventReminders';
import { AppBackdrop } from '../ui/AppBackdrop';

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
 *
 * A BARRA É A `.tabbar` DO SISTEMA v2, portada de `proto/v2/system.css` — não é
 * mais um desenho escrito à mão em utilidades. Os cinco separadores, os ícones e os
 * rótulos são os de `proto/v2/02-hoje.html`, e o estado ativo passa por
 * `aria-current="page"`, que é o que a folha usa para pintar o ícone a accent: o
 * estado chega à tecnologia de apoio pelo atributo, não só pela cor.
 */
export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="h-[100dvh] bg-page sm:flex sm:h-auto sm:min-h-[100dvh] sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto flex h-[100dvh] w-full max-w-[26.5rem] flex-col overflow-hidden bg-ground isolate sm:h-[calc(100dvh-4rem)] sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        {/* B8: a foto desfocada por trás de todo o vidro. Sem ela o vidro lia-se preto. */}
        <AppBackdrop src={backdropFor(pathname)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
        <BottomNav />
        {/* Os avisos dos eventos do calendário, com a app aberta (B7). Não desenha nada. */}
        <EventReminders />
      </div>
    </div>
  );
}

/** A foto de cada separador. Todas estão em `public/img/`. */
function backdropFor(pathname: string): string {
  const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}.jpg`;
  if (pathname.startsWith('/treino')) return img('day-1');
  if (pathname.startsWith('/nutricao')) return img('onboard-goal');
  if (pathname.startsWith('/equipa')) return img('day-3');
  if (pathname.startsWith('/perfil')) return img('day-5');
  return img('onboard-welcome');
}

type Tab = {
  to: string;
  /*
   * A CHAVE, e não a palavra. Um `label: pt.nav.today` numa constante de módulo é
   * lido UMA vez, quando o ficheiro carrega, e ficava preso na língua em que a app
   * arrancou: trocar para francês deixava a barra em português. A chave resolve-se
   * a cada render, dentro do componente, onde o `useT()` a pode ouvir mudar.
   */
  label: keyof Copy['nav'];
  /** O traço do protótipo, tal e qual. Um peso só, para ler a 22px. */
  icon: React.ReactNode;
  end?: boolean;
};

/*
 * Os cinco do protótipo, por esta ordem. O Catálogo saiu daqui: no v2 pendura-se do
 * Treino, e o ecrã do Treino leva a ligação para ele.
 */
const TABS: Tab[] = [
  {
    to: '/',
    end: true,
    label: 'today',
    icon: <path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  },
  {
    to: '/treino',
    label: 'train',
    icon: <path d="M6 6v12M18 6v12M2 10v4M22 10v4M6 12h12" />,
  },
  {
    to: '/nutricao',
    label: 'nutrition',
    icon: (
      <>
        <path d="M5 3v8a3 3 0 0 0 6 0V3M8 11v10M17 3c-1.5 2-2 4-2 6s.5 3 2 3 2-1 2-3-.5-4-2-6Z" />
        <path d="M17 12v9" />
      </>
    ),
  },
  {
    to: '/equipa',
    label: 'team',
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <circle cx="17.5" cy="9.5" r="2.6" />
        <path d="M17.5 14a5 5 0 0 1 4 6" />
      </>
    ),
  },
  {
    to: '/perfil',
    label: 'profile',
    icon: (
      <>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

function BottomNav() {
  const t = useT();
  return (
    <nav aria-label={t.nav.landmark} className="tabbar z-20">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end}>
          {({ isActive }) => (
            <>
              {/*
                * `aria-current` é o que a folha lê, e o NavLink já o põe sozinho.
                * O `isActive` aqui só engrossa o traço, que é a diferença que se vê
                * antes de se ler a cor — e é por isso que o estado não depende dela.
                */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isActive ? 2.2 : 1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-[stroke-width] duration-[180ms]"
              >
                {tab.icon}
              </svg>
              <span>{t.nav[tab.label]}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
