import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { EXERCISES } from '../../content';
import { useRows } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Bars } from '../../ui/Bars';
import { Icon } from '../../ui/Icon';
import { localDate, sessionDate, useSessions } from '../train/sessions';
import { evolving, longestWeekStreak } from './evolution';
import { byExercise, groupEntries, inPeriod, records } from './progress';
import { ThemeToggle } from '../../ui/ThemeToggle';

/**
 * A Evolução — fase 017, `proto/v2/05-progresso.html` frame 4. Para onde leva o
 * "Ver evolução →" do HOJE: o percurso em meses, não o dia de hoje.
 *
 * Abre a dizer desde quando está a contar; a carga de um exercício mês a mês (uma série, só a
 * última barra a volt — o gráfico da fase 014); os marcos com data; e o aviso de quem ainda
 * não tem meses que cheguem.
 */
export function Evolution() {
  const { locale, t: copy } = useLocale();
  const t = copy.evolution;
  const navigate = useNavigate();
  const today = localDate(new Date());
  const sessions = useSessions();
  const all = useMemo(() => inPeriod(sessions.data ?? [], 'all', today), [sessions.data, today]);
  const entries = useRows(
    'session_entries',
    all.map((s) => s.id),
  );
  const lines = useMemo(() => byExercise(all, groupEntries(entries.data ?? [])), [all, entries.data]);
  const ev = evolving(lines);
  const [pick, setPick] = useState(0);
  const chosen = ev[Math.min(pick, ev.length - 1)];

  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const long = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long' }).format(
      new Date(y, m - 1, d),
    );
  };
  const mon = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: 'short' })
      .format(new Date(y, m - 1, 1))
      .replace('.', '');
  };
  const nameOf = (key: string, fallback: string) => EXERCISES[key]?.n[locale] ?? fallback;
  const first = all[0] ? sessionDate(all[0]) : null;
  const best = chosen ? records([chosen.line]).list[0] : undefined;
  const streak = longestWeekStreak(all.map(sessionDate));

  return (
    <div className="min-h-[100dvh]">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" className="btn btn-icon" aria-label={t.back} onClick={() => navigate(-1)}>
          <Icon name="back" size={20} strokeWidth={2} />
        </button>
        <h1 className="display display-4">{t.title}</h1>
        <span className="spacer" />
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg pb-10">
        <p className="body-2 muted">
          {first ? `${t.countingPre} ${long(first)}${t.countingPost}` : t.nothing}
        </p>

        {ev.length > 1 ? (
          <div className="hscroll" style={{ paddingInline: 0, marginInline: 0 }}>
            {ev.map((x, i) => (
              <button
                key={x.line.key}
                type="button"
                className="chip chip-sm"
                aria-pressed={chosen?.line.key === x.line.key}
                onClick={() => setPick(i)}
              >
                {nameOf(x.line.key, x.line.name)}
              </button>
            ))}
          </div>
        ) : null}

        {chosen ? (
          <section className="card">
            <p className="label">
              {nameOf(chosen.line.key, chosen.line.name)} · {t.overMonths}
            </p>
            <p className="metric metric-lg tabular mt-2">
              {kg.format(chosen.months[chosen.months.length - 1].kg)}
              <span className="unit">kg</span>
            </p>
            {(() => {
              const delta = chosen.months[chosen.months.length - 1].kg - chosen.months[0].kg;
              return delta !== 0 ? (
                <p className="body-2 tabular" style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>
                  {delta > 0 ? '↑' : '↓'} {kg.format(Math.abs(delta))} kg {t.sinceFirst}
                </p>
              ) : null;
            })()}
            <div className="mt-5">
              <Bars
                label={`${nameOf(chosen.line.key, chosen.line.name)}. ${t.aria}`}
                points={chosen.months.map((m) => ({ x: mon(m.month), value: m.kg }))}
                format={(v) => `${kg.format(v)} kg`}
              />
            </div>
            <p className="body-2 muted mt-3">{t.oneSeries}</p>
          </section>
        ) : first ? (
          <div className="card">
            <div className="empty" style={{ paddingBlock: 'var(--sp-6)' }}>
              <p className="title-2">{t.noneTitle}</p>
              <p>{t.noneBody}</p>
            </div>
          </div>
        ) : null}

        {first ? (
          <section className="card">
            <p className="label">{t.milestones}</p>
            <div className="mt-2">
              <div className="list-row">
                <span className="body-2 body-med" style={{ flex: '1 1 auto' }}>
                  {t.firstSession}
                </span>
                <span className="body-2 tabular muted">{long(first)}</span>
              </div>
              {best ? (
                <div className="list-row">
                  <span className="body-2 body-med" style={{ flex: '1 1 auto' }}>
                    {t.highest} {nameOf(best.key, best.name)} · {long(best.date)}
                  </span>
                  <span className="metric metric-sm tabular">
                    {kg.format(best.kg)}
                    <span className="unit">kg</span>
                  </span>
                </div>
              ) : null}
              {streak > 0 ? (
                <div className="list-row">
                  <span className="body-2 body-med" style={{ flex: '1 1 auto' }}>
                    {t.streak}
                  </span>
                  <span className="metric metric-sm tabular">{streak}</span>
                </div>
              ) : null}
            </div>
            <p className="body-2 muted mt-3">{t.milestoneRule}</p>
          </section>
        ) : null}

        {lines.length > ev.length ? (
          <div className="notice">
            <Icon name="info" size={20} strokeWidth={2} />
            <div>
              <p className="notice-title">{t.othersTitle}</p>
              <p className="notice-body">{t.othersBody}</p>
            </div>
          </div>
        ) : null}

        <Link to="/calendario" className="btn btn-secondary btn-block">
          {t.seeCalendar}
        </Link>
      </div>
    </div>
  );
}
