import { useEffect, useState } from 'react';

import { useUserId } from '../../data/queries';
import { pendingReminders } from './events';
import { showSystemNotification } from './notify';
import { useEvents } from './use-events';

const FIRED_KEY = 'calendar-events-fired';
/** Agenda os avisos das próximas 24 h; o efeito volta a correr quando a lista muda. */
const HORIZON_MS = 24 * 60 * 60 * 1000;

function readFired(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FIRED_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function markFired(id: string) {
  try {
    const fired = readFired();
    fired.add(id);
    localStorage.setItem(FIRED_KEY, JSON.stringify([...fired].slice(-500)));
  } catch {
    /* Sem armazenamento, o pior é o aviso repetir-se ao reabrir a app. */
  }
}

/**
 * Os avisos dos eventos, com a app aberta — B7, skill calendario-aberto-e-eventos.
 *
 * Montado uma vez na casca. Dá já os avisos de hoje cuja hora passou e ainda não foram
 * dados, e agenda os que vêm. Cada evento avisa uma vez (guardado neste aparelho). Não
 * desenha nada: o aviso dentro da app é o cartão do Hoje.
 */
export function EventReminders() {
  return useUserId() ? <Scheduler /> : null;
}

function Scheduler() {
  const { events } = useEvents();
  /* Muda à meia-noite, para agendar os avisos do dia novo sem reabrir a app. */
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const now = new Date();
    const timers: number[] = [];
    for (const { event, delay } of pendingReminders(events, now, readFired(), HORIZON_MS)) {
      timers.push(
        window.setTimeout(() => {
          markFired(event.id);
          const when = event.local_time ?? '';
          void showSystemNotification(event.title, [when, event.note ?? ''].filter(Boolean).join(' · '), `event-${event.id}`);
        }, delay),
      );
    }
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    timers.push(window.setTimeout(() => setTick((n) => n + 1), midnight.getTime() - now.getTime()));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [events, tick]);

  return null;
}
