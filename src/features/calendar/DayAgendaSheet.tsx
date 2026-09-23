import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import type { CalendarEvent, Session } from '../../data/entities';
import { useRows } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Field } from '../../ui/Field';
import { Sheet } from '../../ui/Sheet';
import { TextArea } from '../../ui/TextArea';
import { useDays } from '../train/custom-days';
import { sessionLoad } from '../train/metrics';
import { localDate, sessionDate, useSessions } from '../train/sessions';
import { daySheet, dayState, weekdayIndex, type DayState } from './calendar';
import { eventsOn } from './events';
import { askNotifyPermission } from './notify';
import { useEventEditing, useEvents, type EventInput } from './use-events';

/**
 * A folha de um dia — B7, skill calendario-aberto-e-eventos. A mesma na tira da semana do
 * Treinar e no Calendário, e abre em QUALQUER dia: passado, hoje, futuro, descanso, outro
 * mês, outro ano. Nada está bloqueado.
 *
 * Duas partes, como ele pediu (as duas):
 *  - **Treino**: o dia feito mostra a sessão; o descanso diz que é descanso; o resto mostra
 *    o treino da posição Seg→Dom desse dia, com "Abrir o treino";
 *  - **Eventos**: os desse dia e "+ Evento". Tocar num evento edita-o.
 */
export function DayAgendaSheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.calendar;
  const navigate = useNavigate();
  const today = localDate(new Date());

  const sessions = useSessions();
  const days = useDays();
  const { events } = useEvents();
  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);
  const doneDates = useMemo(() => new Set(rows.map(sessionDate)), [rows]);
  const firstSession = useMemo(() => (rows.length ? rows.map(sessionDate).sort()[0] : null), [rows]);
  const restSlots = useMemo(
    () => new Set(days.days.slice(0, 7).flatMap((d, i) => (d.type === 'rest' ? [i] : []))),
    [days.days],
  );

  /* O formulário: null fechado, 'new' para um evento novo, ou o evento a editar. */
  const [editing, setEditing] = useState<CalendarEvent | 'new' | null>(null);

  const state: DayState | null = date ? dayState(date, today, restSlots, doneDates, firstSession) : null;
  const session = date ? rows.find((s) => sessionDate(s) === date) ?? null : null;
  const kind = state ? daySheet(state, session !== null) : null;
  const slot = date ? days.days[weekdayIndex(date)] : undefined;
  const dayEvents = date ? eventsOn(events, date) : [];

  const stateLabel: Record<DayState, string> = {
    done: t.done,
    planned: t.planned,
    missed: t.missed,
    rest: t.rest,
    none: t.noHistory,
  };

  const long = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: y === Number(today.slice(0, 4)) ? undefined : 'numeric',
    }).format(new Date(y, m - 1, d));
  };

  function close() {
    setEditing(null);
    onClose();
  }

  return (
    <Sheet
      open={date !== null}
      onOpenChange={(o) => !o && close()}
      title={date ? long(date) : ''}
      description={session ? (session.finished_at ? t.complete : t.open) : state ? stateLabel[state] : undefined}
    >
      {date === null ? null : editing !== null ? (
        <EventForm
          key={editing === 'new' ? 'new' : editing.id}
          date={date}
          existing={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <div className="stack-lg">
          <section className="stack" aria-label={t.training}>
            <p className="label">{t.training}</p>
            {kind === 'session' && session ? (
              <DaySession
                session={session}
                onOpen={() => navigate(`/treino/${session.day_no ?? 1}?bloco=${session.block ?? 'b1'}`)}
              />
            ) : kind === 'rest' ? (
              <p className="body-2 muted">{t.restBody}</p>
            ) : (
              <>
                {date < today && !session ? <p className="body-2 muted">{t.noSession}</p> : null}
                {slot ? (
                  <div>
                    <p className="label">{slot.eyebrow}</p>
                    <p className="display display-3 mt-0.5">{slot.name}</p>
                    <p className="body-2 muted mt-1">{t.planBody}</p>
                  </div>
                ) : (
                  <p className="body-2 muted">{t.planBody}</p>
                )}
                {slot && slot.type !== 'rest' ? (
                  <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate(`/treino/${slot.no}`)}>
                    {t.openDay}
                  </button>
                ) : null}
              </>
            )}
          </section>

          <section className="stack" aria-label={t.events}>
            <div className="row-between">
              <p className="label">{t.events}</p>
              <button type="button" className="chip chip-sm" onClick={() => setEditing('new')}>
                {t.addEvent}
              </button>
            </div>
            {dayEvents.length === 0 ? (
              <p className="body-2 muted">{t.noEvents}</p>
            ) : (
              <div className="card card-flat" style={{ paddingBlock: 0 }}>
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="list-row w-full text-left"
                    aria-label={`${t.editEvent}: ${event.title}`}
                    onClick={() => setEditing(event)}
                  >
                    <span className="title-3 tabular" style={{ minWidth: 52 }}>
                      {event.local_time ?? '—'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-ui text-[15px] font-600 text-text">{event.title}</span>
                      {event.note ? <span className="body-2 muted block truncate">{event.note}</span> : null}
                    </span>
                    {event.notify ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-text-muted">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}

function EventForm({ date, existing, onDone }: { date: string; existing?: CalendarEvent; onDone: () => void }) {
  const t = useLocale().t.calendar;
  const editing = useEventEditing();
  const [draft, setDraft] = useState<EventInput>({
    title: existing?.title ?? '',
    time: existing?.local_time ?? '',
    note: existing?.note ?? '',
    notify: existing?.notify ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (draft.title.trim() === '') {
      setError(t.titleRequired);
      return;
    }
    editing.save(date, draft, existing);
    if (draft.notify) {
      const permission = await askNotifyPermission();
      if (permission === 'denied' || permission === 'unsupported') {
        setBlocked(true);
        return;
      }
    }
    onDone();
  }

  if (blocked) {
    return (
      <div className="stack">
        <div className="notice">
          <p className="notice-body">{t.notifyBlocked}</p>
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
          OK
        </button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <p className="title-3">{existing ? t.editEvent : t.newEvent}</p>
      <Field
        label={t.eventTitle}
        value={draft.title}
        error={error}
        autoFocus
        onChange={(e) => {
          setError(null);
          setDraft((d) => ({ ...d, title: e.target.value }));
        }}
      />
      <Field
        label={t.eventTime}
        type="time"
        value={draft.time}
        onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
      />
      <TextArea
        label={t.eventNote}
        value={draft.note}
        rows={2}
        onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
      />
      <label className="row" style={{ gap: 'var(--sp-3)', minHeight: 'var(--tap-min)' }}>
        <input
          type="checkbox"
          checked={draft.notify}
          onChange={(e) => setDraft((d) => ({ ...d, notify: e.target.checked }))}
          style={{ width: 22, height: 22, accentColor: 'var(--ui-accent)' }}
        />
        <span className="body-1">{t.notifyMe}</span>
      </label>
      <button type="submit" className="btn btn-primary btn-block">
        {t.saveEvent}
      </button>
      {existing ? (
        <button
          type="button"
          className="btn btn-ghost btn-block"
          style={{ color: 'var(--ui-danger)' }}
          onClick={() => {
            editing.remove(existing);
            onDone();
          }}
        >
          {t.deleteEvent}
        </button>
      ) : null}
      <button type="button" className="btn btn-ghost btn-block" onClick={onDone}>
        {t.back}
      </button>
    </form>
  );
}

function DaySession({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.calendar;
  const entries = useRows('session_entries', [session.id]);
  const load = sessionLoad(entries.data ?? []);
  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  return (
    <div className="stack">
      <p className="display display-3">{session.day_name ?? ''}</p>
      <div className="grid-2">
        <div className="card card-sunken">
          <p className="label">{t.volume}</p>
          {load.ok ? (
            <p className="metric metric-md tabular mt-1">
              {kg.format(load.value)}
              <span className="unit">kg</span>
            </p>
          ) : (
            <p className="body-2 muted mt-2">{t.noData}</p>
          )}
        </div>
        <div className="card card-sunken">
          <p className="label">{t.duration}</p>
          <p className="body-2 muted mt-2">{t.noData}</p>
        </div>
      </div>
      <button type="button" className="btn btn-secondary btn-block" onClick={onOpen}>
        {t.seeSession}
      </button>
    </div>
  );
}
