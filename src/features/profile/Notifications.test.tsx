// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../../app/ThemeProvider';
import { copyFor } from '../../i18n';
import { RestTimer } from '../train/RestTimer';
import { notifyScreen, restOverOn, setRestOverOn, shouldNotifyRestOver } from './notifications';
import { Notifications } from './Notifications';

/*
 * skill phase-026-notificacoes (ele, 2026-09-27): "porque não implementaste (...) as
 * notificações? (...) implementa isso agora". Só o que é local; os três avisos com
 * servidor ficam à vista e desligados; entra-se por Perfil › Definições.
 */
const t = copyFor('pt').notify;

function permission(p: NotificationPermission) {
  const N = vi.fn() as unknown as typeof Notification & { permission: NotificationPermission };
  Object.defineProperty(N, 'permission', { value: p, configurable: true });
  (N as unknown as { requestPermission: () => Promise<NotificationPermission> }).requestPermission = vi.fn(
    async () => 'granted' as NotificationPermission,
  );
  vi.stubGlobal('Notification', N);
  return N;
}

function hidden(on: boolean) {
  Object.defineProperty(document, 'visibilityState', { value: on ? 'hidden' : 'visible', configurable: true });
}

beforeEach(() => {
  localStorage.clear();
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  hidden(false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('qual frame o ecrã mostra', () => {
  it('iPhone fora do ecrã principal é o frame 4, seja qual for a permissão', () => {
    expect(notifyScreen({ permission: 'default', ios: true, standalone: false })).toBe('ios-install');
    expect(notifyScreen({ permission: 'default', ios: true, standalone: true })).toBe('ask');
  });
  it('o resto é o que o browser diz', () => {
    expect(notifyScreen({ permission: 'default', ios: false, standalone: false })).toBe('ask');
    expect(notifyScreen({ permission: 'denied', ios: false, standalone: false })).toBe('denied');
    expect(notifyScreen({ permission: 'granted', ios: false, standalone: false })).toBe('granted');
    expect(notifyScreen({ permission: 'unsupported', ios: false, standalone: false })).toBe('unsupported');
  });
});

describe('o ecrã Notificações', () => {
  const mount = () =>
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </ThemeProvider>,
    );

  it('frame 1: Ativar pede ao browser só no toque, e os três com servidor estão desligados', async () => {
    const N = permission('default');
    mount();
    expect(N.requestPermission).not.toHaveBeenCalled();
    for (const name of [t.daily, t.coach, t.weekly]) {
      const sw = screen.getByRole('switch', { name }) as HTMLButtonElement;
      expect(sw.disabled).toBe(true);
      expect(sw.getAttribute('aria-checked')).toBe('false');
    }
    expect(screen.getByRole('switch', { name: t.restOver }).getAttribute('aria-checked')).toBe('true');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t.activate }));
    });
    expect(N.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('o interruptor do descanso liga e desliga, e fica guardado', () => {
    permission('granted');
    mount();
    fireEvent.click(screen.getByRole('switch', { name: t.restOver }));
    expect(restOverOn()).toBe(false);
    expect(screen.getByRole('switch', { name: t.restOver }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText(t.onTitle)).toBeTruthy();
  });

  it('frame 3: recusada, sem botão Ativar, com os passos e tudo desligado', () => {
    permission('denied');
    mount();
    expect(screen.getByText(t.blockedTitle)).toBeTruthy();
    expect(screen.getByText(t.how4)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.activate })).toBeNull();
    const sw = screen.getByRole('switch', { name: t.restOver }) as HTMLButtonElement;
    expect(sw.disabled).toBe(true);
  });
});

describe('Descanso acabou', () => {
  it('só avisa com a app fora do ecrã, a permissão dada e o interruptor ligado', () => {
    permission('granted');
    expect(shouldNotifyRestOver(true)).toBe(true);
    expect(shouldNotifyRestOver(false)).toBe(false);
    setRestOverOn(false);
    expect(shouldNotifyRestOver(true)).toBe(false);
    setRestOverOn(true);
    permission('default');
    expect(shouldNotifyRestOver(true)).toBe(false);
  });

  it('o relógio do descanso dispara o aviso ao chegar a 0 com a app escondida, uma vez só', async () => {
    vi.useFakeTimers();
    const N = permission('granted');
    hidden(true);
    render(<RestTimer seconds={2} exerciseName="Leg Press 45°" onClose={() => {}} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(N).toHaveBeenCalledTimes(1);
    expect(N).toHaveBeenCalledWith(`${t.restOverNotif} · Leg Press 45°`, expect.objectContaining({ body: t.restOverNotifBody }));
  });

  it('com a app à vista não avisa', async () => {
    vi.useFakeTimers();
    const N = permission('granted');
    render(<RestTimer seconds={1} exerciseName="Remada" onClose={() => {}} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(N).not.toHaveBeenCalled();
  });
});
