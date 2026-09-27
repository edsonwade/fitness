// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '../../i18n/LocaleProvider';
import { AuthGate } from './AuthGate';
import { shouldForget } from './remember';

/*
 * B1 da skill lingua-na-entrada-e-definicoes (ele, 2026-09-27): "continua errado o login
 * e create… o protótipo mudou para aparecer Google, Outlook, App". O Entrar e o Criar
 * conta ficam como proto/v2/01-entrada.html frames 2 e 3: Google · Outlook · Apple.
 */
const oauth = vi.fn(async (args: unknown) => ({ data: { args }, error: null }));
vi.mock('../../data/supabase', () => ({
  supabase: { auth: { signInWithOAuth: (a: unknown) => oauth(a) } },
  authErrorCode: () => 'UNKNOWN',
}));

function mount() {
  return render(
    <LocaleProvider>
      <AuthGate />
    </LocaleProvider>,
  );
}

const socials = () =>
  Array.from(document.querySelectorAll('.auth-social button')).map((b) => b.getAttribute('aria-label'));

beforeEach(() => {
  localStorage.setItem('vw.locale.v1', 'pt');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  oauth.mockClear();
});

describe('Entrar e Criar conta como o protótipo', () => {
  it('o Entrar tem "ou entra com" e Google · Outlook · Apple, por esta ordem', () => {
    mount();
    expect(screen.getByText('ou entra com')).toBeTruthy();
    expect(socials()).toEqual(['Entrar com Google', 'Entrar com Outlook', 'Entrar com Apple']);
  });

  it('o Criar conta tem "ou cria com" e os mesmos três', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('ou cria com')).toBeTruthy();
    expect(socials()).toEqual(['Entrar com Google', 'Entrar com Outlook', 'Entrar com Apple']);
  });

  it('Outlook entra pela conta Microsoft (azure)', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Outlook' }));
    expect(oauth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'azure', options: expect.objectContaining({ scopes: 'email' }) }),
    );
  });

  it('Google e Apple chamam o provider deles', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Apple' }));
    expect(oauth.mock.calls.map(([a]) => (a as { provider: string }).provider)).toEqual(['google', 'apple']);
  });

  it('Lembrar-me só no Entrar, ligado por omissão', () => {
    mount();
    expect(screen.getByRole('switch', { name: 'Lembrar-me' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('Lembrar-me desligado: a sessão não passa para uma aba nova', () => {
    mount();
    fireEvent.click(screen.getByRole('switch', { name: 'Lembrar-me' }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }));
    expect(shouldForget()).toBe(false); // a mesma aba continua
    sessionStorage.clear(); // aba nova
    expect(shouldForget()).toBe(true);
  });
});
