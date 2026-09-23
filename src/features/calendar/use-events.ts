import { useMemo } from 'react';

import type { CalendarEvent } from '../../data/entities';
import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useRows } from '../../data/queries';

/**
 * Os eventos do calendário desta conta — B7, skill calendario-aberto-e-eventos.
 * Uma lista só, porque são poucos e a tira, o mês e o Hoje leem todos a mesma.
 */
export function useEvents() {
  const query = useRows('calendar_events');
  const events = useMemo(() => query.data ?? [], [query.data]);
  return { events, isPending: query.isPending, isError: query.isError };
}

export type EventInput = {
  title: string;
  /** `HH:MM`, ou vazio para o dia inteiro. */
  time: string;
  note: string;
  notify: boolean;
};

/** Criar, mudar e apagar um evento. Otimista, como as outras escritas da app. */
export function useEventEditing() {
  const upsert = useUpsertRow('calendar_events');
  const remove = useDeleteRow('calendar_events');

  return {
    save(date: string, input: EventInput, existing?: CalendarEvent) {
      const now = new Date().toISOString();
      const note = input.note.trim();
      upsert.save({
        id: existing?.id ?? crypto.randomUUID(),
        local_date: date,
        local_time: input.time.trim() === '' ? null : input.time.trim(),
        title: input.title.trim(),
        note: note === '' ? null : note,
        notify: input.notify,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      });
    },
    remove(event: CalendarEvent) {
      remove.remove({ id: event.id });
    },
  };
}
