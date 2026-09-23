import { useMemo, useState } from 'react';

import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useRows } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { Stepper } from '../../ui/Stepper';
import { shiftDays } from '../train/readiness';
import { localDate } from '../train/sessions';
import { Capture } from './Capture';
import {
  MEALS,
  byMeal,
  goalProgress,
  onDate,
  pctOf,
  sparkPoints,
  totalsOf,
  weightTrend,
  type Meal,
} from './nutrition';
import { ThemeToggle } from '../../ui/ThemeToggle';

type Tab = 'today' | 'history' | 'quick' | 'recipes' | 'macros';

/**
 * A Nutrição — fase 020, `proto/v2/06-nutricao.html`:
 *
 *  - frame 1: separadores, a semana com o visto nos dias com registo, o anel grande das
 *    calorias e o de proteína (percentagem **e** absoluto), o peso com sparkline, delta e
 *    meta, o diário de macros por refeição, e "Registar refeição";
 *  - frames 2 e 3: `Capture`, a câmara com os quatro modos e o confirmar;
 *  - frame 4: sem registos no dia, "Nada registado hoje" — não se enchem os espaços.
 *
 * Nenhum número sem origem: sai das tabelas de `015_nutricao.sql`, ou não aparece. As metas e
 * o peso mudam por stepper; o teclado só aparece no modo Texto.
 */
export function Nutrition() {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const today = localDate(new Date());
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<Tab>('today');
  const [capture, setCapture] = useState<{ meal: Meal; quick: boolean } | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const foods = useRows('food_entries');
  const weights = useRows('weight_logs');
  const targets = useRows('nutrition_targets');
  const profile = useRows('user_profiles');
  const all = useMemo(() => foods.data ?? [], [foods.data]);
  const dayEntries = onDate(all, date);
  const totals = totalsOf(dayEntries);
  const meals = byMeal(dayEntries);
  const target = targets.data?.[0] ?? null;
  const trend = weightTrend(weights.data ?? []);
  const weightGoal = Number(profile.data?.[0]?.weight_target?.replace(',', '.')) || null;
  const firstWeight = [...(weights.data ?? [])].sort((a, b) => a.local_date.localeCompare(b.local_date))[0];

  const days = Array.from({ length: 7 }, (_, i) => shiftDays(today, i - 6));
  const loggedDates = new Set(all.map((e) => e.local_date));
  const wd = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short' });
  const dec = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const d0 = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const tabs: [Tab, string][] = [
    ['today', t.tabToday],
    ['history', t.tabHistory],
    ['quick', t.tabQuick],
    ['recipes', t.tabRecipes],
    ['macros', t.tabMacros],
  ];

  const pending = foods.isPending || weights.isPending || targets.isPending;

  return (
    <div className="min-h-full pb-6">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="display display-4">{t.title}</h1>
        <span className="spacer" />
        <button type="button" className="btn btn-icon" aria-label={t.history} onClick={() => setTab('history')}>
          <Icon name="history" size={20} strokeWidth={2} />
        </button>
        <ThemeToggle />
      </div>

      <div className="hscroll" style={{ paddingBottom: 'var(--sp-4)' }}>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className="chip"
            aria-pressed={tab === k}
            onClick={() => {
              if (k === 'quick') {
                setCapture({ meal: 'snack', quick: true });
                return;
              }
              setTab(k);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <History
          dates={[...loggedDates].sort().reverse()}
          kcalOf={(d) => totalsOf(onDate(all, d)).kcal}
          onPick={(d) => {
            setDate(d);
            setTab('today');
          }}
          format={(d) => new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'long', day: 'numeric', month: 'long' }).format(d0(d))}
        />
      ) : tab === 'recipes' ? (
        <div className="screen-pad">
          <div className="empty">
            <p>{t.recipesEmpty}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-5">
            <div className="weekstrip">
              {days.map((d) => (
                <button key={d} type="button" aria-current={d === date ? 'date' : undefined} onClick={() => setDate(d)}>
                  <span className="d">{wd.format(d0(d)).replace('.', '')}</span>
                  <span className="n">{Number(d.slice(8))}</span>
                  <span className={loggedDates.has(d) ? 'daybadge is-done' : 'daybadge'} aria-hidden="true" style={{ width: 18, height: 18 }}>
                    {loggedDates.has(d) ? <Icon name="check" size={11} strokeWidth={3} /> : null}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {pending ? (
            <div className="screen-pad stack mt-4" aria-busy="true">
              <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-card)' }} />
              <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-card)' }} />
            </div>
          ) : tab === 'macros' ? (
            <div className="card mx-5 mt-4">
              <p className="label">{t.macrosTitle}</p>
              <div className="row mt-3 flex-wrap" style={{ gap: 'var(--sp-5)' }}>
                {(
                  [
                    [t.protein, totals.protein],
                    [t.carbs, totals.carbs],
                    [t.fat, totals.fat],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label}>
                    <p className="label">{label}</p>
                    <p className="metric metric-md tabular mt-1">
                      {dec.format(v)}
                      <span className="unit">g</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : dayEntries.length === 0 && date === today && !trend ? (
            <div className="screen-pad mt-6">
              <div className="empty">
                <p className="title-2">{t.emptyTitle}</p>
                <p>{t.emptyBody}</p>
                <button type="button" className="btn btn-primary mt-5" onClick={() => setCapture({ meal: mealNow(), quick: false })}>
                  {t.logMeal}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Rings
                kcal={totals.kcal}
                protein={totals.protein}
                kcalGoal={target?.kcal ?? null}
                proteinGoal={target?.protein_g ?? null}
                onGoal={() => setGoalOpen(true)}
              />

              <div className="card mx-5 mt-4">
                <div className="row-between">
                  <p className="label">{t.weight}</p>
                  <button type="button" className="chip chip-sm" onClick={() => setWeightOpen(true)}>
                    {t.log}
                  </button>
                </div>
                {trend ? (
                  <>
                    <div className="row mt-3" style={{ alignItems: 'flex-end', gap: 'var(--sp-4)' }}>
                      <div>
                        <p className="metric metric-lg tabular">
                          {dec.format(trend.latest.kg)}
                          <span className="unit">kg</span>
                        </p>
                        {trend.delta !== null ? (
                          <p className="body-2 mt-0.5 tabular" style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>
                            {trend.delta > 0 ? '↗' : trend.delta < 0 ? '↘' : '→'} {dec.format(Math.abs(trend.delta))} kg
                            {(() => {
                              const g = firstWeight ? goalProgress(Number(firstWeight.kg), trend.latest.kg, weightGoal) : null;
                              return g !== null ? ` · ${dec.format(g)}% ${t.ofWeightGoal}` : '';
                            })()}
                          </p>
                        ) : null}
                      </div>
                      {trend.series.length >= 2 ? (
                        <svg viewBox="0 0 120 44" width="120" height="44" className="ml-auto" role="img" aria-label={`${t.weight}: ${trend.series.map((v) => dec.format(v)).join(', ')} kg`}>
                          <polyline
                            points={sparkPoints(trend.series, 120, 44)}
                            fill="none"
                            stroke="var(--ui-accent)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <p className="body-2 muted mt-2">
                      {weights.data?.length ?? 0} {t.records}
                    </p>
                  </>
                ) : (
                  <p className="body-2 muted mt-3">{t.noWeight}</p>
                )}
              </div>

              <div className="px-5 pb-5 pt-6">
                <h2 className="display display-4">{t.diary}</h2>
              </div>
              <div className="stack-sm px-5">
                {MEALS.map((m) => (
                  <MealCard key={m} meal={m} entries={meals[m]} onAdd={() => setCapture({ meal: m, quick: false })} />
                ))}
              </div>

              <div className="p-5">
                <button type="button" className="btn btn-primary btn-block" onClick={() => setCapture({ meal: mealNow(), quick: false })}>
                  {t.logMeal}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {capture ? (
        <Capture date={date} meal={capture.meal} quick={capture.quick} onClose={() => setCapture(null)} />
      ) : null}

      <WeightSheet
        open={weightOpen}
        onOpenChange={setWeightOpen}
        initial={trend?.latest.kg ?? 70}
        today={today}
        existingId={(weights.data ?? []).find((w) => w.local_date === today)?.id ?? null}
      />
      <GoalSheet
        open={goalOpen}
        onOpenChange={setGoalOpen}
        kcal={target?.kcal ?? 2000}
        protein={target?.protein_g ?? 120}
      />
    </div>
  );
}

/** A refeição da hora a que se abre o registo. */
function mealNow(): Meal {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 19) return 'snack';
  return 'dinner';
}

function Rings({
  kcal,
  protein,
  kcalGoal,
  proteinGoal,
  onGoal,
}: {
  kcal: number;
  protein: number;
  kcalGoal: number | null;
  proteinGoal: number | null;
  onGoal: () => void;
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const num = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  const kp = pctOf(kcal, kcalGoal);
  const pp = pctOf(protein, proteinGoal);
  const arc = (r: number, pct: number | null) => {
    const c = 2 * Math.PI * r;
    const v = Math.max(0, Math.min(100, pct ?? 0));
    return { strokeDasharray: c, strokeDashoffset: c * (1 - v / 100) };
  };

  return (
    <div className="card mx-5 mt-4">
      <div className="row" style={{ gap: 'var(--sp-5)', alignItems: 'center' }}>
        <div style={{ flex: '1 1 auto' }}>
          <div style={{ borderLeft: '2px solid var(--ui-accent)', paddingLeft: 'var(--sp-3)' }}>
            {kp !== null ? (
              <p className="body-2 tabular" style={{ color: 'var(--ui-accent)', fontWeight: 600 }}>
                {kp}%
              </p>
            ) : null}
            <p className="metric metric-lg tabular">
              {num.format(kcal)}
              <span className="unit">kcal</span>
            </p>
            <p className="body-2 muted">{t.kcalEaten}</p>
          </div>
          <div className="mt-4" style={{ borderLeft: '2px solid var(--ui-accent-2)', paddingLeft: 'var(--sp-3)' }}>
            {pp !== null ? (
              <p className="body-2 tabular" style={{ color: 'var(--ui-accent-2)', fontWeight: 600 }}>
                {pp}%
              </p>
            ) : null}
            <p className="metric metric-lg tabular">
              {num.format(protein)}
              <span className="unit">g</span>
            </p>
            <p className="body-2 muted">{t.proteinEaten}</p>
          </div>
        </div>
        <div className="ring-wrap relative grid place-items-center" style={{ flex: '0 0 auto' }}>
          <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
            <circle className="ring-track" cx="66" cy="66" r="56" strokeWidth="12" />
            <circle className="ring-value" cx="66" cy="66" r="56" strokeWidth="12" style={arc(56, kp)} />
            <circle className="ring-track" cx="66" cy="66" r="38" strokeWidth="10" />
            <circle className="ring-value ring-value-2" cx="66" cy="66" r="38" strokeWidth="10" style={arc(38, pp)} />
          </svg>
          <div className="ring-center">
            {kp !== null ? (
              <>
                <p className="metric metric-sm tabular">
                  {kp}
                  <span className="unit">%</span>
                </p>
                <p className="label">{t.ofGoal}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <p className="body-2 muted mt-3 text-center">
        {kcalGoal ? (
          <>
            {t.goalLine} {num.format(kcalGoal)} kcal
            {proteinGoal ? ` · ${num.format(proteinGoal)} g ${t.proteinWord}` : ''} ·{' '}
          </>
        ) : null}
        <button type="button" className="underline-offset-4 pointer-hover:underline" style={{ color: 'var(--ui-accent)' }} onClick={onGoal}>
          {t.setGoal}
        </button>
      </p>
    </div>
  );
}

function MealCard({ meal, entries, onAdd }: { meal: Meal; entries: ReturnType<typeof byMeal>[Meal]; onAdd: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const remove = useDeleteRow('food_entries');
  const num = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const kcal = totalsOf(entries).kcal;

  if (!entries.length) {
    return (
      <button type="button" className="card card-flat w-full text-left" onClick={onAdd}>
        <div className="row-between">
          <span className="chip chip-sm">{t.meals[meal]}</span>
          <span className="body-2 muted">{t.toLog}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="card">
      <div className="row-between">
        <span className="chip chip-sm chip-selected">{t.meals[meal]}</span>
        <span className="body-2 muted tabular">{num.format(kcal)} kcal</span>
      </div>
      {entries.map((e, i) => (
        <div key={e.id} className="list-row" style={i === entries.length - 1 ? { borderBottom: 0, paddingBottom: 0 } : undefined}>
          <div className="min-w-0 flex-1">
            <p className="body-1 body-med">{e.name}</p>
            <p className="body-2 muted tabular">
              {e.kcal ?? 0} kcal · {t.p} {num.format(Number(e.protein_g ?? 0))} g · {t.c} {num.format(Number(e.carbs_g ?? 0))} g · {t.f}{' '}
              {num.format(Number(e.fat_g ?? 0))} g
              {e.estimate ? ` · ${t.precisionEstimate.toLowerCase()}` : ''}
            </p>
          </div>
          <button type="button" className="btn btn-icon" aria-label={`${t.remove}: ${e.name}`} onClick={() => remove.remove({ id: e.id })}>
            <Icon name="trash" size={16} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}

function History({
  dates,
  kcalOf,
  onPick,
  format,
}: {
  dates: string[];
  kcalOf: (d: string) => number;
  onPick: (d: string) => void;
  format: (d: string) => string;
}) {
  const t = useLocale().t.nutrition;
  if (!dates.length) {
    return (
      <div className="screen-pad">
        <div className="empty">
          <p>{t.historyEmpty}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="screen-pad">
      <div className="card" style={{ paddingBlock: 'var(--sp-2)' }}>
        {dates.map((d) => (
          <button key={d} type="button" className="list-row w-full text-left" onClick={() => onPick(d)}>
            <span className="body-2 body-med first-letter:uppercase" style={{ flex: '1 1 auto' }}>
              {format(d)}
            </span>
            <span className="body-2 muted tabular">{kcalOf(d)} kcal</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WeightSheet({
  open,
  onOpenChange,
  initial,
  today,
  existingId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: number;
  today: string;
  existingId: string | null;
}) {
  const t = useLocale().t.nutrition;
  const upsert = useUpsertRow('weight_logs');
  const [kg, setKg] = useState(initial);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setKg(initial);
        onOpenChange(o);
      }}
      title={t.weightToday}
    >
      <div className="grid place-items-center">
        <Stepper scale="body" label={t.weight} value={kg} onChange={setKg} />
      </div>
      <p className="stepper-step">{t.weightStep}</p>
      <button
        type="button"
        className="btn btn-primary btn-block mt-6"
        onClick={() => {
          upsert.save({ id: existingId ?? crypto.randomUUID(), local_date: today, kg: Math.round(kg * 10) / 10 });
          onOpenChange(false);
        }}
      >
        {t.save}
      </button>
    </Sheet>
  );
}

function GoalSheet({
  open,
  onOpenChange,
  kcal: kcal0,
  protein: protein0,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kcal: number;
  protein: number;
}) {
  const t = useLocale().t.nutrition;
  const upsert = useUpsertRow('nutrition_targets');
  const [kcal, setKcal] = useState(kcal0);
  const [protein, setProtein] = useState(protein0);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setKcal(kcal0);
          setProtein(protein0);
        }
        onOpenChange(o);
      }}
      title={t.goalTitle}
    >
      <div className="stack">
        <div className="row-between">
          <p className="title-3">{t.calories}</p>
          <Stepper size="sm" scale="kcalGoal" label={t.calories} value={kcal} onChange={setKcal} />
        </div>
        <div className="row-between">
          <p className="title-3">{t.protein}</p>
          <Stepper size="sm" scale="proteinGoal" label={t.protein} value={protein} onChange={setProtein} />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            upsert.save({ kcal, protein_g: protein });
            onOpenChange(false);
          }}
        >
          {t.save}
        </button>
      </div>
    </Sheet>
  );
}
