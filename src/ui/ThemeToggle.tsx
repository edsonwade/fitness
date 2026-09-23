import clsx from 'clsx';

import { nextTheme } from '../app/theme';
import { useThemeState } from '../app/theme-context';
import { useT } from '../i18n/locale-context';
import { Icon } from './Icon';

/**
 * O botão do tema, na barra de topo de TODOS os ecrãs — B1 de
 * .claude/skills/tema-em-todas-as-barras/PLANO.md ("tem de estar visível em todos os
 * menus e submenus, na parte de cima, dos exercícios também").
 *
 * Alterna só entre escuro e claro: numa barra, um terceiro estado ("sistema") faz o
 * toque parecer que não fez nada. O "sistema" continua nas Definições, e aqui resolve-se
 * pelo telefone. O ícone mostra PARA ONDE vais: sol no escuro, lua no claro.
 */
function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function ThemeToggle({ onMedia = false, className }: { onMedia?: boolean; className?: string }) {
  const { theme, setTheme } = useThemeState();
  const t = useT().theme;
  const next = nextTheme(theme, prefersDark());

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === 'light' ? t.toLight : t.toDark}
      className={clsx('btn btn-icon', onMedia && 'on-media', className)}
    >
      <Icon name={next === 'light' ? 'sun' : 'moon'} size={20} strokeWidth={2} />
    </button>
  );
}
