import clsx from 'clsx';

import type { ThemePreference } from '../app/theme';
import { useThemeState } from '../app/theme-context';
import { Icon, type IconName } from './Icon';

/**
 * The theme control, lifted out of the Programs screen so every surface can carry it.
 *
 * It cycles system, light and dark and names the current state to a screen reader,
 * so it is never a mystery icon. Until there is a settings surface, this is the one
 * place the preference is reachable, which is why it sits in the header of each
 * screen rather than being buried.
 */
const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const LABEL: Record<ThemePreference, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Escuro',
};

const GLYPH: Record<ThemePreference, IconName> = {
  system: 'system',
  light: 'sun',
  dark: 'moon',
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeState();

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Tema: ${LABEL[theme]}. Tocar para mudar.`}
      className={clsx(
        'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-text',
        'shadow-[var(--shadow-card)]',
        'transition-transform duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'active:scale-[0.96] motion-reduce:active:scale-100',
        className,
      )}
    >
      <Icon name={GLYPH[theme]} size={20} strokeWidth={1.9} />
    </button>
  );
}
