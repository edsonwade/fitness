import { useSyncExternalStore } from 'react';

import { notifyPermission, showSystemNotification, type NotifyPermission } from '../calendar/notify';

/**
 * As notificações — skill phase-026-notificacoes, `proto/v2/13-notificacoes.html`.
 *
 * Escolha dele, 2026-09-27: **só o que é local**. Funciona o "Descanso acabou", que não
 * precisa de servidor; os três avisos com servidor ficam à vista e desligados.
 * O pedido de permissão é o mesmo dos eventos do calendário (`../calendar/notify`).
 */

/** Qual dos frames do protótipo o ecrã mostra. */
export type NotifyScreen = 'unsupported' | 'ios-install' | 'ask' | 'denied' | 'granted';

export type NotifyEnv = { permission: NotifyPermission; ios: boolean; standalone: boolean };

/**
 * Frame 4 primeiro: num iPhone/iPad fora do ecrã principal o pedido nem existe, e um
 * botão "Ativar" ali não faria nada. Depois o que o browser diz.
 */
export function notifyScreen(env: NotifyEnv): NotifyScreen {
  if (env.ios && !env.standalone) return 'ios-install';
  if (env.permission === 'unsupported') return 'unsupported';
  if (env.permission === 'denied') return 'denied';
  if (env.permission === 'granted') return 'granted';
  return 'ask';
}

export function readNotifyEnv(): NotifyEnv {
  if (typeof window === 'undefined') return { permission: 'unsupported', ios: false, standalone: false };
  const ua = navigator.userAgent;
  // O iPad em modo "computador" diz-se Mac, e só o toque o denuncia.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  return { permission: notifyPermission(), ios, standalone };
}

/* ---------- a preferência "Descanso acabou", guardada no aparelho ---------- */

const KEY = 'fitness.notify.restOver';
const listeners = new Set<() => void>();

export function restOverOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setRestOverOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* Sem armazenamento fica ligado, que é o que o protótipo mostra. */
  }
  listeners.forEach((l) => l());
}

export function useRestOverOn(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    restOverOn,
    () => true,
  );
}

/**
 * O aviso do frame 2: só com a app fora do ecrã, a permissão dada e o interruptor
 * ligado. Com a app à vista, o relógio do descanso já diz tudo e um aviso a mais só
 * atrapalhava.
 */
export function shouldNotifyRestOver(hidden: boolean): boolean {
  return hidden && notifyPermission() === 'granted' && restOverOn();
}

export async function notifyRestOver(title: string, body: string): Promise<void> {
  if (typeof document === 'undefined' || !shouldNotifyRestOver(document.visibilityState === 'hidden')) return;
  await showSystemNotification(title, body, 'rest-over');
}
