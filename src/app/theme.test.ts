import { describe, expect, it } from 'vitest';

import { nextTheme, resolvedTheme } from './theme';

// B1 de .claude/skills/tema-em-todas-as-barras/PLANO.md: o botão das barras de topo
// alterna entre escuro e claro, e cada toque muda o que se vê.
describe('o botão do tema nas barras de topo', () => {
  it('do escuro vai para o claro, e do claro para o escuro', () => {
    expect(nextTheme('dark', false)).toBe('light');
    expect(nextTheme('dark', true)).toBe('light');
    expect(nextTheme('light', true)).toBe('dark');
    expect(nextTheme('light', false)).toBe('dark');
  });

  it('no "sistema", parte do que o telefone mostra e vai para o outro', () => {
    expect(resolvedTheme('system', true)).toBe('dark');
    expect(resolvedTheme('system', false)).toBe('light');
    expect(nextTheme('system', true)).toBe('light');
    expect(nextTheme('system', false)).toBe('dark');
  });

  it('dois toques voltam ao princípio', () => {
    const once = nextTheme('dark', false);
    expect(nextTheme(once, false)).toBe('dark');
  });
});
