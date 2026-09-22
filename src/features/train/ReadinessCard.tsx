import { useMemo } from 'react';

import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { ProgressRing } from '../../ui/ProgressRing';
import { useRows } from '../../data/queries';
import { localDate, sessionDate, useSessions } from './sessions';
import { readiness } from './readiness';


/**
 * The readiness surface: the first thing the week screen answers — "how ready am I today?" —
 * with the reasons in view (§5.3, §10.2).
 *
 * It reads from the record and nothing else. Recovery is the interval since the last session;
 * the score is that interval adjusted for how dense the last seven days were; the load is the
 * last session's, shown as the effort being recovered from. Every one of those is a real
 * number out of `sessions`/`session_entries`, and the "Por quê?" spells the rule out so the
 * figure is never a bare dashboard number. With no history there is no ring and no number —
 * the card says what the app needs to see instead of inventing one.
 */
export function ReadinessCard() {
  const { locale, t: copy } = useLocale();
  const t = copy.train.readiness;
  /*
   * The load, with the reader's own thousands grouping: "2 500 kg" in Portuguese and
   * French, "2,500 kg" in English. It used to be pinned to `pt-PT`, which put a thin
   * space in an English sentence. A number is copy too.
   */
  const kg = useMemo(
    () => new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 }),
    [locale],
  );
  const sessions = useSessions();
  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);

  /* The most recent session, whose entries carry the load being recovered from. */
  const latest = useMemo(() => {
    if (rows.length === 0) return undefined;
    return [...rows].sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))[0];
  }, [rows]);

  /* Scoped to that one session; with none, the empty scope disables the query on its own. */
  const entries = useRows('session_entries', latest ? [latest.id] : []);

  const today = localDate(new Date());
  const state = useMemo(
    () => readiness(rows, entries.data ?? null, today),
    [rows, entries.data, today],
  );

  /* Still loading the history: a quiet placeholder the size of the ring, not a false zero. */
  if (sessions.isPending) {
    return (
      <section className="mt-5 flex items-center gap-4 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]">
        <span
          aria-hidden="true"
          className="h-[92px] w-[92px] shrink-0 animate-pulse rounded-full bg-surface-sunken motion-reduce:animate-none"
        />
        <span
          aria-hidden="true"
          className="h-[14px] w-40 animate-pulse rounded-full bg-surface-sunken motion-reduce:animate-none"
        />
      </section>
    );
  }

  /* The history failed to load. The plan below is still usable, so this stays out of the way. */
  if (sessions.isError) return null;

  /* No sessions recorded yet: say what is missing, and draw no ring around an empty number. */
  if (!state.ok) {
    return (
      <section className="mt-5 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]">
        <h2 className="font-ui text-[15px] font-700 text-text">{t.emptyTitle}</h2>
        <p className="mt-1.5 font-ui text-[13px] leading-snug text-text-muted">{t.emptyBody}</p>
      </section>
    );
  }

  const r = state.value;
  const why: string[] = [];
  if (r.daysSinceLast <= 0) why.push(t.trainedToday);
  else if (r.daysSinceLast === 1) why.push(t.trainedYesterday);
  else why.push(`${t.trainedAgoPre} ${r.daysSinceLast} ${t.trainedAgoPost}`);
  why.push(t.window);
  if (r.sessionsLast7 >= 4) why.push(t.dense);
  why.push(`${r.sessionsLast7} ${r.sessionsLast7 === 1 ? t.sessionsWeekOne : t.sessionsWeekMany}`);

  return (
    <section className="mt-5 rounded-[20px] bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-ui text-[11px] font-600 uppercase tracking-[0.04em] text-text-muted">
        {t.title}
      </h2>

      <div className="mt-2.5 flex items-center gap-4">
        <ProgressRing
          value={r.score}
          label={`${t.label} ${r.score} ${t.outOf}`}
          size={92}
          stroke={7}
          className="shrink-0"
          center={
            <span className="absolute grid place-items-center leading-none">
              <span className="tabular font-ui text-[30px] font-700 text-text">{r.score}</span>
              <span className="mt-0.5 font-ui text-[10px] font-600 text-text-muted">{t.outOf}</span>
            </span>
          }
        />

        <dl className="min-w-0 flex-1 grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="min-w-0">
            <dt className="font-ui text-[11px] font-600 text-text-muted">{t.recoveryLabel}</dt>
            <dd className="mt-0.5 truncate font-ui text-[15px] font-700 text-text">
              {t.recovery[r.recovery]}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-ui text-[11px] font-600 text-text-muted">{t.loadLabel}</dt>
            <dd className="mt-0.5 truncate font-ui text-[15px] font-700 text-text">
              {r.load.ok ? (
                <>
                  {kg.format(r.load.value)} <span className="font-500 text-text-muted">{t.kg}</span>
                </>
              ) : (
                <span className="font-500 text-[13px] text-text-muted">{t.noLoad}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/*
        * The reasons, always in view — the number without them would be exactly the
        * administrative dashboard §0 wants gone. The last line keeps the reading honest about
        * what it is: a reading of the record, not a medical measurement.
        */}
      <p className="mt-3 font-ui text-[12.5px] leading-relaxed text-text-muted">
        <span className="font-600 text-text">{t.whyLabel} </span>
        {why.join(' ')}
        {r.load.ok ? ` ${t.lastLoadPre} ${kg.format(r.load.value)} ${t.kg}.` : ''}
      </p>
      <p className="mt-1 font-ui text-[11px] leading-snug text-text-muted/85">{t.disclaimer}</p>
    </section>
  );
}
