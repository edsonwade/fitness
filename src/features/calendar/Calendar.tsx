import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { useDays } from '../train/custom-days';
import { localDate, sessionDate, useSessions } from '../train/sessions';
import { dayState, monthGrid, monthSummary, yearMap, type DayState } from './calendar';
import { DayAgendaSheet } from './DayAgendaSheet';
import { datesWithEvents } from './events';
import { useEvents } from './use-events';
import { ThemeToggle } from '../../ui/ThemeToggle';

/**
 * O Calendário — fase 015, `proto/v2/10-calendario.html`:
 *
 *  - frame 1: o mês a sério (semana à segunda), feito cheio, planeado tracejado, falhado
 *    neutro, descanso vazio, hoje com anel; a legenda; o resumo do mês; a folha do dia;
 *  - frame 2: o ano de relance, só a partir da primeira sessão gravada;
 *  - frame 3: um mês sem histórico desenha o plano na mesma e diz porquê está vazio.
 *
 * Tocar num dia abre SEMPRE a folha desse dia, e nunca sai do Calendário (B2 de
 * .claude/skills/calendario-ir-para-hoje/PLANO.md — "clico num dia e manda-me para o
 * treino"): feito mostra a sessão, planeado ou falhado mostra o treino do plano, descanso
 * diz que é descanso. Só o botão de dentro da folha leva a outro ecrã.
 *
 * B7 (skill calendario-aberto-e-eventos): nenhum dia está bloqueado. Os dias de fora do
 * mês também abrem, os meses andam sem limite, e a folha é a `DayAgendaSheet`, com o
 * treino do dia e os eventos dele. Um dia com evento leva o ponto.
 */
export function Calendar() {
  const { locale, t: copy } = useLocale();
  const t = copy.calendar;
  const navigate = useNavigate();
  const today = localDate(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) }));
  const [picked, setPicked] = useState<string | null>(null);
  const { events } = useEvents();
  const eventDates = useMemo(() => datesWithEvents(events), [events]);

  const sessions = useSessions();
  const days = useDays();
  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);
  const doneDates = useMemo(() => new Set(rows.map(sessionDate)), [rows]);
  const firstSession = useMemo(
    () => (rows.length ? rows.map(sessionDate).sort()[0] : null),
    [rows],
  );
  const restSlots = useMemo(
    () => new Set(days.days.slice(0, 7).flatMap((d, i) => (d.type === 'rest' ? [i] : []))),
    [days.days],
  );

  const cells = monthGrid(ym.y, ym.m);
  const summary = monthSummary(cells, today, restSlots, doneDates, firstSession);
  const monthName = new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'long' }).format(
    new Date(ym.y, ym.m - 1, 1),
  );
  const heads = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'narrow' }).format(new Date(2026, 8, 7 + i)),
  );
  const long = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(y, m - 1, d),
    );
  };
  const hasHistoryInMonth = cells.some((c) => c.inMonth && doneDates.has(c.date));

  function shift(delta: number) {
    setYm(({ y, m }) => {
      const n = m + delta;
      return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n };
    });
  }

  function tap(date: string) {
    setPicked(date);
  }

  /*
   * B1 de .claude/skills/calendario-ir-para-hoje/PLANO.md: o botão só punha o mês de hoje,
   * que já era o mês aberto, e por isso "não fazia nada". Agora volta ao separador Mês, ao
   * mês de hoje, e abre a folha de hoje — há sempre uma resposta à vista.
   */
  function goToday() {
    setView('month');
    setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) });
    setPicked(today);
  }

  const stateLabel: Record<DayState, string> = {
    done: t.done,
    planned: t.planned,
    missed: t.missed,
    rest: t.rest,
    none: t.noHistory,
  };
  const cls: Record<DayState, string> = {
    done: 'cal-day is-done',
    planned: 'cal-day is-planned',
    missed: 'cal-day',
    rest: 'cal-day is-rest',
    none: 'cal-day is-rest',
  };

  return (
    <div className="min-h-[100dvh]">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" className="btn btn-icon" aria-label={t.back} onClick={() => navigate(-1)}>
          <Icon name="back" size={20} strokeWidth={2} />
        </button>
        <h1 className="title-3">{view === 'year' ? ym.y : t.title}</h1>
        <span className="spacer" />
        <button type="button" className="btn btn-secondary btn-compact" aria-label={t.today} onClick={goToday}>
          {t.todayBtn}
        </button>
        <ThemeToggle />
      </div>

      <div className="screen-pad stack pb-10">
        <div className="segmented" role="tablist" aria-label={t.title}>
          <button type="button" role="tab" aria-selected={view === 'month'} onClick={() => setView('month')}>
            {t.month}
          </button>
          <button type="button" role="tab" aria-selected={view === 'year'} onClick={() => setView('year')}>
            {t.year}
          </button>
        </div>

        {view === 'month' ? (
          <>
            <div className="row-between">
              <button type="button" className="btn btn-icon" aria-label={t.prev} onClick={() => shift(-1)}>
                <Icon name="back" size={20} strokeWidth={2} />
              </button>
              <div className="text-center">
                <p className="display display-3 first-letter:uppercase">{monthName}</p>
                <p className="body-2 muted">{ym.y}</p>
              </div>
              <button type="button" className="btn btn-icon" aria-label={t.next} onClick={() => shift(1)}>
                <Icon name="forward" size={20} strokeWidth={2} />
              </button>
            </div>

            <div>
              <div className="cal-grid" role="presentation">
                {heads.map((h, i) => (
                  <div key={i} className="cal-head">
                    {h}
                  </div>
                ))}
              </div>
              <div className="cal-grid" style={{ marginTop: 2 }}>
                {cells.map((c) => {
                  const state = dayState(c.date, today, restSlots, doneDates, firstSession);
                  const hasEvent = eventDates.has(c.date);
                  return (
                    <button
                      key={c.date}
                      type="button"
                      className={c.inMonth ? cls[state] : 'cal-day is-outside'}
                      aria-current={c.date === today ? 'date' : undefined}
                      aria-label={`${long(c.date)}, ${stateLabel[state]}${hasEvent ? `, ${t.events}` : ''}`}
                      onClick={() => tap(c.date)}
                    >
                      {c.day}
                      {hasEvent ? <span className="m is-event" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="cal-legend">
              <span>
                <i style={{ background: 'var(--ui-accent)' }} /> {t.done}
              </span>
              <span>
                <i style={{ border: '1.5px dashed var(--ui-accent)' }} /> {t.planned}
              </span>
              <span>
                <i style={{ background: 'var(--ui-surface-raised)' }} /> {t.missed}
              </span>
              <span>
                <i style={{ border: '1px solid var(--ui-rule)' }} /> {t.rest}
              </span>
            </div>

            {hasHistoryInMonth || summary.missed.length ? (
              <div className="card">
                <p className="label first-letter:uppercase">
                  {monthName} {t.sofar}
                </p>
                <div className="row mt-3" style={{ gap: 'var(--sp-6)' }}>
                  <div>
                    <p className="metric metric-md tabular">
                      {summary.done}
                      <span className="unit">
                        {t.of} {summary.planned}
                      </span>
                    </p>
                    <p className="body-2 muted">{t.sessionsDone}</p>
                  </div>
                  <div>
                    <p className="metric metric-md tabular">{summary.missed.length}</p>
                    <p className="body-2 muted">{t.missedWord}</p>
                  </div>
                </div>
                {summary.missed.length ? (
                  <p className="body-2 muted mt-3">
                    {t.missedOn}: {summary.missed.map((d) => Number(d.slice(8))).join(', ')}. {t.written}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="notice">
                <Icon name="info" size={20} strokeWidth={2} />
                <div>
                  <p className="notice-body">{t.emptyMonth}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <YearView firstSession={firstSession} today={today} doneDates={doneDates} />
        )}
      </div>

      <DayAgendaSheet date={picked} onClose={() => setPicked(null)} />
    </div>
  );
}

function YearView({
  firstSession,
  today,
  doneDates,
}: {
  firstSession: string | null;
  today: string;
  doneDates: ReadonlySet<string>;
}) {
  const t = useLocale().t.calendar;
  const weeks = yearMap(firstSession, today);
  return (
    <>
      <div className="card">
        <p className="label">{t.perDay}</p>
        {weeks.length ? (
          <div
            className="mt-3 overflow-x-auto"
            role="img"
            aria-label={`${t.yearAria}: ${[...doneDates].filter((d) => d <= today).length} ${t.sessionsDone}`}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 1fr)',
                gridAutoFlow: 'column',
                gridAutoColumns: 'minmax(10px, 14px)',
                gap: 3,
              }}
            >
              {weeks.flat().map((date) => (
                <i
                  key={date}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 2,
                    background: doneDates.has(date)
                      ? 'var(--ui-accent)'
                      : date > today
                        ? 'transparent'
                        : 'var(--ui-surface-sunken)',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="body-2 muted mt-3">{t.yearEmpty}</p>
        )}
      </div>
      <div className="notice">
        <Icon name="info" size={20} strokeWidth={2} />
        <div>
          <p className="notice-title">{t.yearNoticeTitle}</p>
          <p className="notice-body">{t.yearNoticeBody}</p>
        </div>
      </div>
    </>
  );
}
