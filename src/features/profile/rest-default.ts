import { useSyncExternalStore } from 'react';

/**
 * O "Descanso por omissão" das Definições (`proto/v2/08-perfil.html`): o descanso de um
 * exercício que não traz nenhum escrito. O descanso do plano ganha sempre a este.
 *
 * Fica neste aparelho, como o tema e a língua. `localStorage` pode falhar (janela privada,
 * dados bloqueados): então vale o de sempre, 90 s.
 */
const KEY = 'rest-default-seconds';
export const REST_FALLBACK = 90;
const listeners = new Set<() => void>();

function read(): number {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return Number.isFinite(v) && v >= 30 && v <= 300 ? v : REST_FALLBACK;
  } catch {
    return REST_FALLBACK;
  }
}

export function setRestDefault(seconds: number) {
  try {
    window.localStorage.setItem(KEY, String(seconds));
  } catch {
    /* sem armazenamento, fica só nesta sessão do ecrã */
  }
  listeners.forEach((l) => l());
}

export function useRestDefault(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => REST_FALLBACK,
  );
}
