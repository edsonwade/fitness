/**
 * A notificação do sistema de um evento — B7, skill calendario-aberto-e-eventos.
 *
 * Passa pelo service worker quando há um (é o que o telemóvel mostra com a app em fundo),
 * e pelo `Notification` da página quando não há. Sem permissão não faz nada: o aviso
 * dentro da app (no Hoje) está lá na mesma.
 */

export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function notifyPermission(): NotifyPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Pede a permissão uma vez, no gesto de guardar um evento com "Avisar-me". */
export async function askNotifyPermission(): Promise<NotifyPermission> {
  const now = notifyPermission();
  if (now !== 'default') return now;
  try {
    return await Notification.requestPermission();
  } catch {
    return notifyPermission();
  }
}

export async function showSystemNotification(title: string, body: string, tag: string): Promise<void> {
  if (notifyPermission() !== 'granted') return;
  const icon = `${import.meta.env.BASE_URL}favicon.svg`;
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, { body, tag, icon });
      return;
    }
    new Notification(title, { body, tag, icon });
  } catch {
    /* Um browser que recusa à última hora não parte a app: o aviso do Hoje fica. */
  }
}
