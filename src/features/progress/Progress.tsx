import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { EXERCISES } from '../../content';
import { useRows } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Bars } from '../../ui/Bars';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useDays } from '../train/custom-days';
import { builtinPoster } from '../train/day-entries';
import { weekSlot } from '../train/recommendation';
import { localDate, sessionDate, useSessions } from '../train/sessions';
import {
  MIN_SESSIONS_FOR_TREND,
  byExercise,
  groupEntries,
  inPeriod,
  records,
  totals,
  volumes,
  type ExerciseLine,
  type Period,
} from './progress';
import { ThemeToggle } from '../../ui/ThemeToggle';

/**
 * O ecrã Progresso — fase 014, `proto/v2/05-progresso.html`:
 *
 *  - frame 1: período (7 dias / 30 dias / Tudo), volume por sessão em barras (uma série, a
 *    última a volt), quatro números, "Por exercício" com a folha do exercício;
 *  - frame 2: recordes, cada um com data, e o aviso de quem não aparece e porquê;
 *  - frame 3: abaixo de três sessões, "Ainda não há gráfico", o que já existe, e começar.
 *
 * Nenhum número é de exemplo: o que não se lê do registo diz "sem dados".
 */
export function Progress() {
  const { locale, t: copy } = useLocale();
  const t = copy.progress;
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('30');
  const [open, setOpen] = useState<ExerciseLine | null>(null);
  const today = localDate(new Date());

  const sessions = useSessions();
  const all = useMemo(() => inPeriod(sessions.data ?? [], 'all', today), [sessions.data, today]);
  const shown = useMemo(() => inPeriod(all, period, today), [all, period, today]);
  const entries = useRows(
    'session_entries',
    all.map((s) => s.id),
  );
  const by = useMemo(() => groupEntries(entries.data ?? []), [entries.data]);

  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const dm = (date: string) => {
    const [, m, d] = date.split('-').map(Number);
    return `${d}/${m}`;
  };
  const long = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long' }).format(
      new Date(y, m - 1, d),
    );
  };
  const nameOf = (line: { key: string; name: string }) => EXERCISES[line.key]?.n[locale] ?? line.name;

  const vols = volumes(shown, by);
  const tot = totals(shown, by);
  const lines = byExercise(shown, by);
  const recs = records(byExercise(all, by));

  const days = useDays();
  const todayRef = days.days[weekSlot(new Date())];

  const appbar = (
    <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" className="btn btn-icon" aria-label={t.back} onClick={() => navigate(-1)}>
        <Icon name="back" size={20} strokeWidth={2} />
      </button>
      <h1 className="display display-4">{t.title}</h1>
      <span className="spacer" />
      <Link className="btn btn-icon" to="/calendario" aria-label={t.calendar}>
        <Icon name="calendar" size={20} strokeWidth={2} />
      </Link>
      <ThemeToggle />
    </div>
  );

  if (sessions.isPending || entries.isPending) {
    return (
      <div className="min-h-[100dvh]">
        {appbar}
        <div className="screen-pad stack-lg" aria-busy="true">
          <div className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-pill)' }} />
          <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-card)' }} />
        </div>
      </div>
    );
  }

  /* Frame 3: sem sessões que cheguem para uma tendência. */
  if (all.length < MIN_SESSIONS_FOR_TREND) {
    return (
      <div className="min-h-[100dvh]">
        {appbar}
        <div className="screen-pad stack pb-10">
          <div className="card">
            <p className="label">{t.volumeTitle}</p>
            <div className="empty" style={{ paddingBlock: 'var(--sp-6)' }}>
              <p className="title-2">{t.noChartTitle}</p>
              <p>
                {t.noChartPre} {all.length} {all.length === 1 ? t.sessionWord : t.sessionsWord} {t.noChartPost}
              </p>
            </div>
          </div>
          {all.length > 0 ? (
            <div className="card">
              <p className="label">{t.whatExists}</p>
              <div className="mt-2">
                {[...all].reverse().map((s) => (
                  <div key={s.id} className="list-row">
                    <span className="body-2 tabular">{dm(sessionDate(s))}</span>
                    <span className="spacer" />
                    <span className="body-2">{s.day_name ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {todayRef && todayRef.type !== 'rest' ? (
            <Link to={`/treino/${todayRef.no}/executar`} className="btn btn-primary btn-block">
              {t.startToday}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const last = vols[vols.length - 1];
  const prev = vols[vols.length - 2];

  return (
    <div className="min-h-[100dvh]">
      {appbar}
      <div className="screen-pad stack-lg pb-10">
        <div className="segmented" role="tablist" aria-label={t.period}>
          {(['7', '30', 'all'] as const).map((p) => (
            <button key={p} type="button" role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}>
              {p === '7' ? t.p7 : p === '30' ? t.p30 : t.pAll}
            </button>
          ))}
        </div>

        <section className="card">
          <p className="label">{t.volumeTitle}</p>
          {last ? (
            <>
              <p className="metric metric-lg tabular mt-2">
                {kg.format(last.kg)}
                <span className="unit">kg</span>
              </p>
              {prev ? (
                <p className="body-2 tabular" style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>
                  {last.kg >= prev.kg ? '↑' : '↓'} {kg.format(Math.abs(last.kg - prev.kg))} kg {t.sinceLast}
                </p>
              ) : null}
              <div className="mt-5">
                <Bars
                  label={t.volumeAria}
                  points={vols.map((v) => ({ x: dm(v.date), value: v.kg }))}
                  format={(v) => `${kg.format(v)} kg`}
                />
              </div>
            </>
          ) : (
            <p className="body-2 muted mt-2">{t.noData}</p>
          )}
        </section>

        <div className="grid-2">
          <div className="card">
            <p className="label">{t.sessions}</p>
            <p className="metric metric-md tabular mt-1">{tot.sessions}</p>
            <p className="body-2 muted">{period === 'all' ? t.allTime : `${t.inLast} ${period} ${t.days}`}</p>
          </div>
          <div className="card">
            <p className="label">{t.setsDone}</p>
            <p className="metric metric-md tabular mt-1">{tot.setsDone}</p>
            <p className="body-2 muted">
              {t.ofPlanned} {tot.setsPlanned} {t.planned}
            </p>
          </div>
          <div className="card">
            <p className="label">{t.volumeTotal}</p>
            {tot.volumeKg !== null ? (
              <p className="metric metric-md tabular mt-1">
                {tot.volumeKg >= 1000 ? kg.format(tot.volumeKg / 1000) : kg.format(tot.volumeKg)}
                <span className="unit">{tot.volumeKg >= 1000 ? 't' : 'kg'}</span>
              </p>
            ) : (
              <p className="body-2 muted mt-2">{t.noData}</p>
            )}
            <p className="body-2 muted">{period === 'all' ? t.pAll : `${period} ${t.days}`}</p>
          </div>
          <div className="card">
            <p className="label">{t.time}</p>
            <p className="body-2 muted mt-2">{t.noData}</p>
          </div>
        </div>

        {lines.length ? (
          <section>
            <h2 className="display display-4 mb-3">{t.byExercise}</h2>
            <div className="stack-sm">
              {lines.map((line) => (
                <button
                  key={line.key}
                  type="button"
                  className="card row w-full text-left"
                  onClick={() => setOpen(line)}
                >
                  <img className="thumb-sm" src={builtinPoster(line.key)} alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="title-3">{nameOf(line)}</p>
                    <p className="body-2 muted tabular">
                      {line.latestKg !== null ? `${kg.format(line.latestKg)} kg` : t.noLoad} · {line.points.length}{' '}
                      {line.points.length === 1 ? t.sessionWord : t.sessionsWord}
                    </p>
                  </div>
                  {line.deltaKg !== null && line.deltaKg !== 0 ? (
                    <span className="body-2 tabular" style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>
                      {line.deltaKg > 0 ? '↑' : '↓'} {kg.format(Math.abs(line.deltaKg))} kg
                    </span>
                  ) : (
                    <span className="body-2 muted">—</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {recs.list.length || recs.missing.length ? (
          <section className="stack">
            <h2 className="display display-4">{t.records}</h2>
            {recs.list[0] ? (
              <div className="card card-accent">
                <p className="label text-text">{t.recent}</p>
                <p className="display display-2 mt-2 tabular">{kg.format(recs.list[0].kg)} kg</p>
                <p className="body-1 mt-2">
                  {nameOf(recs.list[0])}, {long(recs.list[0].date)}
                </p>
                <p className="body-2 muted mt-2">{t.recordBody}</p>
              </div>
            ) : null}
            <div>
              {recs.list.slice(1).map((r) => (
                <div key={r.key} className="list-row">
                  <img className="thumb-sm" src={builtinPoster(r.key)} alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="body-1 body-med">{nameOf(r)}</p>
                    <p className="body-2 muted">{long(r.date)}</p>
                  </div>
                  <span className="metric metric-sm tabular">
                    {kg.format(r.kg)}
                    <span className="unit">kg</span>
                  </span>
                </div>
              ))}
            </div>
            {recs.missing.map((name) => (
              <div key={name} className="notice">
                <Icon name="info" size={20} strokeWidth={2} />
                <div>
                  <p className="notice-title">
                    {EXERCISES[name]?.n[locale] ?? name} {t.missingTitle}
                  </p>
                  <p className="notice-body">{t.missingBody}</p>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <Link to="/calendario" className="btn btn-secondary btn-block">
          {t.seeCalendar}
        </Link>
      </div>

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)} title={open ? nameOf(open) : ''}>
        {open ? <ExerciseDetail line={open} format={(v) => kg.format(v)} dm={dm} /> : null}
      </Sheet>
    </div>
  );
}

function ExerciseDetail({
  line,
  format,
  dm,
}: {
  line: ExerciseLine;
  format: (v: number) => string;
  dm: (d: string) => string;
}) {
  const t = useLocale().t.progress;
  const loads = line.points.filter((p) => p.kg !== null && p.kg > 0);
  return (
    <div className="stack">
      {line.latestKg !== null ? (
        <div>
          <p className="metric metric-lg tabular">
            {format(line.latestKg)}
            <span className="unit">kg</span>
          </p>
          <p className="body-2 muted">{t.latestLoad}</p>
        </div>
      ) : (
        <p className="body-2 muted">{t.noLoad}</p>
      )}
      {loads.length >= 2 ? (
        <Bars
          height={110}
          label={t.loadAria}
          points={loads.map((p) => ({ x: dm(p.date), value: p.kg as number }))}
          format={(v) => `${format(v)} kg`}
        />
      ) : null}
      <div>
        <p className="label mb-2">{t.history}</p>
        {[...line.points].reverse().map((p, i) => (
          <div key={`${p.date}-${i}`} className="list-row">
            <span className="body-2 tabular">{dm(p.date)}</span>
            <span className="spacer" />
            <span className="body-2 tabular">
              {p.sets}
              {p.reps !== null ? ` × ${p.reps}` : ''}
            </span>
            <span className="body-2 tabular muted" style={{ width: 64, textAlign: 'right' }}>
              {p.kg !== null ? `${format(p.kg)} kg` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
