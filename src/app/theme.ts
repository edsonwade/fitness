import { useEffect, useState } from 'react';

/**
 * Theme preference, chosen inside the app.
 *
 * Three states, not two. "system" writes no attribute and lets the
 * `prefers-color-scheme` block in tokens.css decide, so a user who never chose
 * follows their phone. An explicit choice stamps `data-theme` and wins in both
 * directions, including against a phone that disagrees.
 *
 * Desde o porte do sistema v2, o padrão de quem nunca escolheu é **escuro**: é esse
 * o mundo primário do protótipo aprovado. Ver `readStored` mais abaixo.
 *
 * Stored locally for now. Per the approved plan (section 8.1) theme is *synced*
 * user state and belongs in `user_settings` alongside `lang`, so choosing dark on
 * the phone turns the PC dark too. That is Phase 3. This is deliberately not
 * `next-themes`: that library owns its own persistence and would fight the sync
 * layer for the same fact.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/*
 * Bumped from 'vw.theme'. The previous version wrote the default on first load, so
 * browsers that had already opened the app carry a stored 'system' nobody chose.
 * A new key retires those silently instead of asking anyone to clear site data.
 */
const STORAGE_KEY = 'vw.theme.v2';

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
}

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Private mode, or site data blocked. Fall through to the brand default.
  }
  /*
   * ESCURO, e não 'system' nem 'light'.
   *
   * Até ao porte do sistema v2 isto devolvia 'light', porque a referência de agosto
   * era um produto claro — areia quente e laranja — e deixar 'system' fazia com que
   * um telemóvel em modo escuro mostrasse uma app que não se parecia nada com a
   * referência.
   *
   * O v2 inverteu isso: em `proto/v2/tokens.css` **o escuro é o mundo primário e o
   * claro é o derivado**, e o próprio protótipo abre em escuro. Manter 'light' aqui
   * era mostrar a app no mundo secundário a quem nunca escolheu nada.
   *
   * A marca continua a insistir num modo em vez de seguir o sistema: quem escolheu
   * claro fica com claro, e essa escolha está guardada e não é tocada por isto.
   */
  return 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(readStored);

  // Applying the theme is a render concern; persisting it is not.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /*
   * Only an explicit choice is written down. The previous version persisted the
   * value on every mount, which meant the first visit silently stored whatever the
   * default happened to be. When the default later changed from 'system' to
   * 'light', every browser that had ever loaded the app was already pinned to
   * 'system' and kept following the OS into dark mode. A default nobody chose must
   * never be recorded as if they had.
   */
  function setTheme(next: ThemePreference) {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice must never break using the app.
    }
  }

  return { theme, setTheme };
}

/** What the user actually sees now, after the system preference resolves. */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
