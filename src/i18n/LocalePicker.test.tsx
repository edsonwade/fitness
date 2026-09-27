// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { LocalePicker } from './LocalePicker';
import { LocaleProvider } from './LocaleProvider';
import { useT } from './locale-context';

/*
 * Skill lingua-na-entrada-e-definicoes (ele, 2026-09-27): "onde está a opção de escolher
 * português, francês, inglês, espanhol?" — e escolheu "Entrada + Definições".
 */
function Title() {
  return <h1>{useT().gate.signIn}</h1>;
}

function mount(variant: 'settings' | 'auth') {
  return render(
    <LocaleProvider>
      <Title />
      <LocalePicker variant={variant} />
    </LocaleProvider>,
  );
}

beforeEach(() => {
  localStorage.setItem('vw.locale.v1', 'pt');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('a língua no Entrar', () => {
  it('mostra as quatro línguas, cada uma no nome dela', () => {
    mount('auth');
    const names = screen.getAllByRole('radio').map((b) => b.textContent);
    expect(names).toEqual(['Português', 'English', 'Español', 'Français']);
  });

  it('tocar em Français muda o ecrã para francês, e fica marcado', () => {
    mount('auth');
    const before = screen.getByRole('heading').textContent;
    fireEvent.click(screen.getByRole('radio', { name: 'Français' }));
    expect(screen.getByRole('radio', { name: 'Français' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Português' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('heading').textContent).not.toBe(before);
    expect(document.documentElement.lang).toBe('fr');
  });

  it('a escolha fica guardada: ao voltar a abrir continua em francês', () => {
    const first = mount('auth');
    fireEvent.click(screen.getByRole('radio', { name: 'Français' }));
    const french = screen.getByRole('heading').textContent;
    first.unmount();
    mount('auth');
    expect(screen.getByRole('heading').textContent).toBe(french);
    expect(screen.getByRole('radio', { name: 'Français' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('a língua nas Definições', () => {
  it('quatro presets, a escolhida marcada', () => {
    mount('settings');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
    fireEvent.click(screen.getByRole('radio', { name: 'Español' }));
    expect(screen.getByRole('radio', { name: 'Español' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Español' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('um só componente, nos dois sítios', () => {
  const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');

  it('o Entrar monta o seletor', () => {
    expect(read('../features/auth/AuthGate.tsx')).toMatch(/<LocalePicker variant="auth" \/>/);
  });

  it('as Definições do Perfil montam o seletor, sem cópia própria', () => {
    const src = read('../features/profile/Profile.tsx');
    expect(src).toMatch(/<LocalePicker \/>/);
    expect(src).not.toMatch(/LOCALE_NAMES/);
  });
});
