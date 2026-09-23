import { useMemo, useState, type CSSProperties } from 'react';

import type { BlockKey } from '../../content';
import { useT } from '../../i18n/locale-context';
import { Sheet } from '../../ui/Sheet';
import { PHASES, cycleWeek, phaseOfWeek, weekCell } from './journey';
import { localDate, useSessions } from './sessions';

/**
 * "A tua jornada" — `proto/v2/03-treino.html` frame 1, a fita de quatro bandas com a régua,
 * o painel da fase escolhida e a folha "Ver as fases" com o ciclo inteiro.
 *
 * A cor diz o tempo (volt = semana cumprida, do registo) e o contorno diz a escolha (a fase
 * que estás a ver). Tocar numa banda escolhe a fase, como faziam os chips que ela substitui.
 */
export function JourneyRail({
  block,
  onBlock,
}: {
  block: BlockKey;
  onBlock: (next: BlockKey) => void;
}) {
  const t = useT().journey;
  const sessions = useSessions();
  const week = useMemo(
    () => cycleWeek(sessions.data ?? [], localDate(new Date())),
    [sessions.data],
  );
  const nowPhase = week === null ? null : phaseOfWeek(week);
  const [open, setOpen] = useState(false);

  function stateOf(k: BlockKey): { text: string; now: boolean } {
    const order = PHASES.findIndex((p) => p.k === k);
    const current = nowPhase === null ? -1 : PHASES.findIndex((p) => p.k === nowPhase);
    if (order === current) return { text: t.now, now: true };
    if (k === 'dl') return { text: t.last, now: false };
    if (current >= 0 && order === current + 1) return { text: t.next, now: false };
    return { text: t.later, now: false };
  }

  function range(p: (typeof PHASES)[number]) {
    return p.weeks === 1
      ? `${t.weekLabel} ${p.first} · 1 ${t.week}`
      : `${t.weeksLabel} ${p.first}-${p.first + p.weeks - 1} · ${p.weeks} ${t.weeks}`;
  }

  const weekText = week === null ? null : `${t.weekLabel} ${week} / 12`;
  const selected = PHASES.find((p) => p.k === block) ?? PHASES[0];

  return (
    <div>
      <div className="row-between mb-3">
        <p className="label" id="jornada-h">
          {t.title}
        </p>
        <button type="button" className="chip chip-sm" onClick={() => setOpen(true)}>
          {t.open}
        </button>
      </div>

      <div className="journey-rail" role="tablist" aria-labelledby="jornada-h">
        {PHASES.map((p) => {
          const active = p.k === block;
          return (
            <button
              key={p.k}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              aria-current={p.k === nowPhase ? 'step' : undefined}
              aria-label={`${t.names[p.k]}. ${range(p)}.`}
              className={p.k === 'dl' ? 'journey-band is-deload' : 'journey-band'}
              style={{ '--weeks': p.weeks } as CSSProperties}
              onClick={() => onBlock(p.k)}
              onKeyDown={(e) => {
                const i = PHASES.findIndex((x) => x.k === block);
                if (e.key === 'ArrowRight') onBlock(PHASES[Math.min(PHASES.length - 1, i + 1)].k);
                if (e.key === 'ArrowLeft') onBlock(PHASES[Math.max(0, i - 1)].k);
              }}
            >
              {Array.from({ length: p.weeks }, (_, i) => {
                const cell = weekCell(p.first + i, week);
                return (
                  <span
                    key={i}
                    className={
                      cell === 'done' ? 'journey-week is-done' : cell === 'half' ? 'journey-week is-half' : 'journey-week'
                    }
                    style={{ '--i': p.first + i - 1 } as CSSProperties}
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <div className="journey-scale" aria-hidden="true">
        {PHASES.map((p) => (
          <span key={p.k} style={{ '--weeks': p.weeks } as CSSProperties}>
            {p.weeks === 1 ? p.first : `${p.first}-${p.first + p.weeks - 1}`}
          </span>
        ))}
      </div>

      <div className="journey-panel" role="note" aria-live="polite" aria-atomic="true">
        <div key={block} className="journey-panel-layer phase-enter">
          <div className="row-between">
            <p className="display display-4 journey-name">{t.names[block]}</p>
            {selected.k === nowPhase && weekText ? (
              <span className="journey-state is-now">{weekText}</span>
            ) : null}
          </div>
          <p className="body-2 muted mt-1">{t.bodies[block]}</p>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen} title={t.title} description={weekText ?? undefined}>
        <p className="body-2 muted mb-4">{t.intro}</p>
        <div className="stack-sm" role="tablist" aria-label={t.title}>
          {PHASES.map((p) => {
            const state = stateOf(p.k);
            return (
              <button
                key={p.k}
                type="button"
                role="tab"
                aria-selected={p.k === block}
                className="journey-row"
                onClick={() => {
                  onBlock(p.k);
                  setOpen(false);
                }}
              >
                <div className="row-between">
                  <p className="display display-4">{t.names[p.k]}</p>
                  {nowPhase !== null ? (
                    <span className={state.now ? 'journey-state is-now' : 'journey-state'}>{state.text}</span>
                  ) : null}
                </div>
                <p className="body-2 muted mt-1">{range(p)}</p>
                <p className="body-2 mt-2">{t.bodies[p.k]}</p>
                <div className="journey-facts">
                  {t.facts[p.k].map((f) => (
                    <span key={f}>{f}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
