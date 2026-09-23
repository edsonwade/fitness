import { useMemo, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router';

import type { Session, SessionEntry } from '../../data/entities';
import { useRows } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { eventsOn } from '../calendar/events';
import { useEvents } from '../calendar/use-events';
import { Icon } from '../../ui/Icon';
import { shortWeekday } from '../../ui/weekday';
import { OfflineNotice } from '../../ui/OfflineNotice';
import { useDays, type DayRef } from '../train/custom-days';
import { dayPoster, useProgramme } from '../train/day-entries';
import { trend, volume } from '../train/metrics';
import { ReadinessCard } from '../train/ReadinessCard';
import { RecommendationCard } from '../train/RecommendationCard';
import { blockOfLatest, weekSlot } from '../train/recommendation';
import { localDate, sessionDate, useSessions } from '../train/sessions';
import { dayStreak, weekConsistency, weekPlan, weekWindows } from './week-plan';
import { coachRead } from '../train/coach';
import { goalPct, nearest, remaining } from '../profile/goals';
import { weekdayIndex } from '../calendar/calendar';
import { ThemeToggle } from '../../ui/ThemeToggle';

/**
 * O ecrã HOJE — o separador que abre a aplicação.
 *
 * Alvo: `proto/v2/02-hoje.html`, frame 1 de cima a baixo (fase 009, a ordem do §5.2):
 *
 *   appbar · Prontidão · Objetivo de hoje · O treino de hoje · Começar treino ·
 *   Ver a semana inteira · O teu progresso · Plano da semana
 *
 * e o frame 3 num dia de descanso: só o objetivo, "Ver a semana" e "Treinar na mesma".
 *
 * SEM NÚMEROS INVENTADOS (§14). O que o protótipo marca como *exemplo* só aparece aqui
 * quando se consegue calcular do registo; o que não se calcula diz "sem dados". O Coach e
 * o Objetivo perto do frame 1 são das fases 016 e 023 e entram com elas.
 */
export function Today() {
  const { locale, t: copy } = useLocale();
  const t = copy.today;
  const now = useMemo(() => new Date(), []);
  const today = localDate(now);
  /* "sábado, 12 de setembro", que é como a barra de topo do protótipo o escreve. */
  const stamp = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const days = useDays();
  const sessions = useSessions();
  const profiles = useRows('user_profiles');
  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);
  const block = useMemo(() => blockOfLatest(rows, sessionDate), [rows]);
  const programme = useProgramme(block);

  const dayRef: DayRef | null = days.days[weekSlot(now)] ?? null;
  const entries =
    dayRef && !programme.isPending ? programme.resolve(dayRef.day, dayRef.no).entries : [];
  const isRest = dayRef !== null && dayRef.type === 'rest' && entries.length === 0;
  const restSlots = new Set(days.days.slice(0, 7).flatMap((d, i) => (d.type === 'rest' ? [i] : [])));
  const streak = dayStreak(today, restSlots, new Set(rows.map(sessionDate)), weekdayIndex);
  /* Frame 2: sem sessões, as faixas sem dados não aparecem — nem vazias. */
  const noHistory = !sessions.isPending && rows.length === 0;

  /*
   * Fase 024: uma conta que ainda não passou pelo onboarding vai lá uma vez. Saltar grava
   * `onboarded_at` como responder, por isso nunca se pergunta duas vezes.
   */
  if (profiles.isSuccess && !profiles.data[0]?.onboarded_at) {
    return <Navigate to="/boas-vindas" replace />;
  }

  /* Frame 4: o esqueleto com a forma do que vem, para não haver salto. */
  if (days.isPending || sessions.isPending) {
    return (
      <div className="min-h-full">
        <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div>
            <div className="skeleton" style={{ width: 130, height: 11 }} />
            <div className="skeleton" style={{ width: 96, height: 16, marginTop: 6 }} />
          </div>
          <span className="spacer" />
          <ThemeToggle />
        </div>
        <div className="screen-pad stack-lg" aria-busy="true" aria-live="polite">
          <span className="sr-only">{copy.offline.loading}</span>
          <div className="card">
            <div className="skeleton" style={{ width: 100, height: 11 }} />
            <div className="row mt-4" style={{ gap: 'var(--sp-5)' }}>
              <div className="skeleton" style={{ width: 112, height: 112, borderRadius: '50%' }} />
              <div style={{ flex: '1 1 auto' }}>
                <div className="skeleton" style={{ width: '70%', height: 26 }} />
                <div className="skeleton" style={{ width: '100%', height: 12, marginTop: 12 }} />
                <div className="skeleton" style={{ width: '80%', height: 12, marginTop: 8 }} />
              </div>
            </div>
          </div>
          <div className="skeleton" style={{ width: '100%', height: 150, borderRadius: 'var(--radius-card)' }} />
          <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 'var(--radius-media)' }} />
          <div className="skeleton" style={{ width: '100%', height: 60, borderRadius: 'var(--radius-pill)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="label first-letter:uppercase">{stamp}</p>
          <p className="title-3">{t.greeting}</p>
        </div>
        <span className="spacer" />
        {streak >= 2 ? (
          <div className="chip chip-sm" style={{ borderColor: 'var(--ui-accent)', color: 'var(--ui-accent)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
              <path d="M13 2 4 14h7l-1 8 9-12h-7Z" />
            </svg>
            {streak} {t.streakDays}
          </div>
        ) : null}
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg pb-8">
        <OfflineNotice />
        <TodayEvents today={today} />
        {isRest ? (
          <>
            <RecommendationCard />
            <Link to="/treino" className="btn btn-secondary btn-block">
              {t.seeWeek}
            </Link>
            <Link to="/treino" className="btn btn-ghost btn-block">
              {t.trainAnyway}
            </Link>
          </>
        ) : (
          <>
            <ReadinessCard />
            <div id="objetivo" className="scroll-mt-4">
              <RecommendationCard />
            </div>

            {dayRef ? (
              <section>
                <div className={noHistory ? 'hidden' : 'row-between mb-3'}>
                  <p className="display display-4">{t.dayTitle}</p>
                  <Link
                    className="body-2 muted no-underline"
                    to={`/treino/${dayRef.no}?bloco=${block}`}
                  >
                    {t.seeDay}
                  </Link>
                </div>
                <Link to={`/treino/${dayRef.no}?bloco=${block}`} className="daycard block">
                  <img
                    src={entries[0]?.photo ?? dayPoster(dayRef.no)}
                    alt=""
                    onError={(e) => {
                      const fallback = dayPoster(dayRef.no);
                      if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
                    }}
                  />
                  <div className="veil" />
                  <div className="on-top">
                    <p className="eyebrow">{dayRef.eyebrow}</p>
                    <p className="display display-3">{dayRef.name}</p>
                    <p className="meta">
                      {dayRef.day
                        ? dayRef.day.mus[locale].join(' · ')
                        : `${entries.length} ${entries.length === 1 ? copy.train.exercise : copy.train.exercises}`}
                    </p>
                  </div>
                </Link>
              </section>
            ) : null}

            {dayRef ? (
              <Link
                to={`/treino/${dayRef.no}/executar?bloco=${block}`}
                className="btn btn-primary btn-block btn-lg"
              >
                {t.start}
              </Link>
            ) : null}
            {noHistory ? null : (
              <>
                <Link to="/treino" className="btn btn-ghost btn-block">
                  {t.seeWeekAll}
                </Link>
                <ProgressCard sessions={rows} today={today} pending={false} />
                <WeekPlanCard sessions={rows} today={today} />
                <CoachCard sessions={rows} today={today} />
                <GoalNearCard />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * "O teu progresso": Força, Consistência e Volume semanal, e o "Ver evolução →".
 *
 * - **Volume semanal** — a soma de carga × reps das sessões desta semana (`volume`).
 * - **Consistência** — sessões feitas contra dias de treino do plano que já chegaram.
 * - **Força** — a variação do volume da última semana inteira contra a anterior
 *   (`trend`). Uma semana a meio não se compara: sem duas semanas completas, "sem dados".
 */
function ProgressCard({
  sessions,
  today,
  pending,
}: {
  sessions: readonly Session[];
  today: string;
  pending: boolean;
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.today;
  const days = useDays();
  const windows = useMemo(() => weekWindows(sessions, today), [sessions, today]);
  const ids = useMemo(() => windows.recent.map((s) => s.id), [windows]);
  const entries = useRows('session_entries', ids);

  const bySession = useMemo(() => {
    const map = new Map<string, SessionEntry[]>();
    for (const e of entries.data ?? []) {
      const list = map.get(e.session_id) ?? [];
      list.push(e);
      map.set(e.session_id, list);
    }
    return map;
  }, [entries.data]);

  const slots = days.days.map((d) => ({ no: d.no, rest: d.type === 'rest' }));
  const cons = weekConsistency(slots, sessions, today);
  const thisWeek = volume(sessions, bySession, windows.thisWeek.from, windows.thisWeek.to);
  const change = trend(
    volume(sessions, bySession, windows.lastWeek.from, windows.lastWeek.to),
    volume(sessions, bySession, windows.weekBefore.from, windows.weekBefore.to),
    { currentComplete: true },
  );
  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });

  if (pending) return null;

  return (
    <section className="card">
      <p className="label">{t.progressTitle}</p>
      <div className="row mt-3 flex-wrap" style={{ gap: 'var(--sp-5)' }}>
        <Figure label={t.strength}>
          {change.ok ? (
            <>
              {change.value >= 0 ? '↑' : '↓'} {Math.abs(Math.round(change.value * 100))}
              <span className="unit">%</span>
            </>
          ) : null}
        </Figure>
        <Figure label={t.consistency}>
          {cons.planned > 0 ? (
            <>
              {Math.round((cons.done / cons.planned) * 100)}
              <span className="unit">%</span>
            </>
          ) : null}
        </Figure>
        <Figure label={t.weeklyVolume}>
          {thisWeek.ok ? (
            <>
              {kg.format(thisWeek.value)}
              <span className="unit">kg</span>
            </>
          ) : null}
        </Figure>
      </div>
      <Link
        to="/evolucao"
        className="body-2 body-med mt-4 inline-block no-underline"
        style={{ color: 'var(--ui-accent)' }}
      >
        {t.seeEvolution}
      </Link>
    </section>
  );
}

/** Uma leitura do cartão de progresso. Sem número, o padrão "dado que não existe". */
function Figure({ label, children }: { label: string; children: ReactNode }) {
  const t = useLocale().t.today;
  return (
    <div>
      <p className="label">{label}</p>
      {children ? (
        <p className="metric metric-md tabular mt-0.5">{children}</p>
      ) : (
        <p className="body-2 muted mt-2">{t.noFigure}</p>
      )}
    </div>
  );
}

/** "Plano da semana": sete linhas com os nomes reais da semana, e os três estados. */
function WeekPlanCard({ sessions, today }: { sessions: readonly Session[]; today: string }) {
  const { locale, t: copy } = useLocale();
  const t = copy.today;
  const days = useDays();
  if (days.isPending || days.isError) return null;

  const slots = days.days.map((d) => ({ no: d.no, rest: d.type === 'rest' }));
  const plan = weekPlan(slots, sessions, today);

  return (
    <section className="card" style={{ paddingBlock: 'var(--sp-4)' }}>
      <p className="label mb-2">{t.weekPlan}</p>
      {plan.map((row) => {
        const day = days.days[row.slot];
        const rest = row.state === 'rest';
        const [y, m, d] = row.date.split('-').map(Number);
        const wd = shortWeekday(locale, new Date(y, m - 1, d));
        return (
          <div key={row.date} className="list-row">
            <span className={row.state === 'done' ? 'daybadge is-done' : 'daybadge'} aria-hidden="true">
              {row.state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : null}
            </span>
            <span className={`body-2 body-med first-letter:uppercase ${rest ? 'muted' : ''}`} style={{ width: 34 }}>
              {wd}
            </span>
            <span className={`body-2 ${rest ? 'muted' : ''}`} style={{ flex: '1 1 auto' }}>
              {day.type === 'rest' ? t.rest : day.name}
            </span>
            {row.state === 'today' ? (
              <span className="chip chip-sm" style={{ borderColor: 'var(--ui-accent)', color: 'var(--ui-accent)' }}>
                {t.todayChip}
              </span>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

/**
 * O Coach (fase 016): o facto — X das últimas N sessões planeadas — e a decisão que dele
 * decorre. Sem facto que se possa mostrar, o cartão não existe.
 */
function CoachCard({ sessions, today }: { sessions: readonly Session[]; today: string }) {
  const t = useLocale().t.coach;
  const days = useDays();
  if (days.isPending) return null;
  const restSlots = new Set(days.days.slice(0, 7).flatMap((d, i) => (d.type === 'rest' ? [i] : [])));
  const dates = sessions.map(sessionDate);
  const first = dates.length ? [...dates].sort()[0] : null;
  const read = coachRead(today, restSlots, new Set(dates), first, weekdayIndex);
  if (!read) return null;

  return (
    <section className="card">
      <p className="label">{t.title}</p>
      <p className="body-1 mt-3">
        {t.factPre} {read.done} {t.factMid} {read.planned} {t.factPost} {t[read.kind]}
      </p>
      <p className="body-2 muted mt-2">{t.rule}</p>
      <a href="#objetivo" className="btn btn-secondary mt-4 no-underline">
        {t.see}
      </a>
    </section>
  );
}

/**
 * "Objetivo perto" (frame 1, a última faixa): o objetivo mais adiantado que ainda não
 * chegou, da tabela `goals` (fase 023). Sem objetivo com progresso, não há faixa.
 */
function GoalNearCard() {
  const { locale, t: copy } = useLocale();
  const t = copy.profile;
  const goals = useRows('goals');
  const goal = nearest(goals.data ?? []);
  if (!goal) return null;
  const pct = goalPct(goal) ?? 0;
  const left = remaining(goal);
  const dec = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  return (
    <Link to="/perfil" className="card block no-underline" style={{ color: 'inherit' }}>
      <p className="label">{t.goalNear}</p>
      <div className="row mt-3">
        {goal.photo ? <img className="thumb" src={goal.photo} alt="" /> : null}
        <div style={{ flex: '1 1 auto' }}>
          <p className="title-3">{goal.title}</p>
          <p className="body-2 muted mt-0.5 tabular">
            {goal.current_value ?? '—'} {goal.unit ?? ''}
            {left !== null ? ` · ${t.left} ${dec.format(left)} ${goal.unit ?? ''}` : ''}
          </p>
          <div className="track mt-2">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * O aviso dentro da app dos eventos de hoje — B7, skill calendario-aberto-e-eventos: "fica
 * como notificação quando chega o dia". Sem eventos hoje, não aparece nada. Tocar abre o
 * Calendário.
 */
function TodayEvents({ today }: { today: string }) {
  const t = useLocale().t.calendar;
  const { events } = useEvents();
  const list = eventsOn(events, today);
  if (list.length === 0) return null;
  return (
    <Link to="/calendario" className="notice" style={{ borderColor: 'var(--ui-volt)' }}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <div className="min-w-0">
        <p className="notice-title">{t.todayEvents}</p>
        {list.map((event) => (
          <p key={event.id} className="notice-body truncate">
            {event.local_time ? `${event.local_time} · ` : ''}
            {event.title}
          </p>
        ))}
      </div>
    </Link>
  );
}
