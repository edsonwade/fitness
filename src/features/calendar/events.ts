import type { CalendarEvent } from '../../data/entities';
import { shiftDays } from '../train/readiness';

/**
 * As contas dos eventos do calendário — B7, skill calendario-aberto-e-eventos
 * (`.claude/skills/calendario-aberto-e-eventos/SKILL.md`).
 *
 * "As pessoas podem criar eventos em qualquer dia e fica como notificação quando chega o
 * dia." Um evento vive numa data local `YYYY-MM-DD` (a mesma chave das sessões), com uma
 * hora `HH:MM` opcional. Sem hora, avisa às 09:00 desse dia.
 */

/** A hora a que um evento sem hora avisa. */
export const DEFAULT_REMINDER_TIME = '09:00';

type EventLike = Pick<CalendarEvent, 'id' | 'local_date' | 'local_time' | 'title' | 'notify'>;

/** Os eventos de um dia, pela hora; os sem hora primeiro, como o dia inteiro. */
export function eventsOn<T extends EventLike>(events: readonly T[], date: string): T[] {
  return events
    .filter((e) => e.local_date === date)
    .sort((a, b) => (a.local_time ?? '').localeCompare(b.local_time ?? '') || a.title.localeCompare(b.title));
}

/** As datas que têm pelo menos um evento — para o ponto no calendário e na tira. */
export function datesWithEvents(events: readonly EventLike[]): Set<string> {
  return new Set(events.map((e) => e.local_date));
}

/** O instante em que um evento avisa, na hora local. */
export function reminderAt(event: EventLike): Date {
  const [y, m, d] = event.local_date.split('-').map(Number);
  const [hh, mm] = (event.local_time ?? DEFAULT_REMINDER_TIME).split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/**
 * Os avisos por dar: eventos com "Avisar-me", cuja hora já chegou (ou chega dentro de
 * `horizonMs`), que ainda não foram dados, e que não são de um dia que já passou — um
 * evento de ontem não acorda ninguém hoje.
 *
 * Devolve cada um com `delay`: 0 para os que já deviam ter avisado hoje, e os
 * milissegundos até à hora para os que ainda vêm.
 */
export function pendingReminders<T extends EventLike>(
  events: readonly T[],
  now: Date,
  fired: ReadonlySet<string>,
  horizonMs: number,
): { event: T; delay: number }[] {
  const today = localIso(now);
  const out: { event: T; delay: number }[] = [];
  for (const event of events) {
    if (!event.notify || fired.has(event.id) || event.local_date < today) continue;
    const delay = reminderAt(event).getTime() - now.getTime();
    if (delay > horizonMs) continue;
    out.push({ event, delay: Math.max(0, delay) });
  }
  return out.sort((a, b) => a.delay - b.delay);
}

/** A Segunda da semana que está `offset` semanas depois da de `today`. */
export function mondayAt(today: string, offset: number): string {
  const [y, m, d] = today.split('-').map(Number);
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7;
  return shiftDays(today, offset * 7 - weekday);
}

function localIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
