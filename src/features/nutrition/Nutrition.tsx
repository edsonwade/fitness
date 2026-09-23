import { useId, useMemo, useRef, useState } from 'react';

import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { uploadFoodPhoto } from '../../data/photos';
import { useRows, useUserId } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { ProgressRing } from '../../ui/ProgressRing';
import { Sheet } from '../../ui/Sheet';
import { ValuePill } from '../../ui/ValuePill';
import { WheelField } from '../../ui/WheelField';
import { shortWeekday } from '../../ui/weekday';
import { shiftDays } from '../train/readiness';
import { localDate } from '../train/sessions';
import type { FoodEntry } from '../../data/entities';
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
 * o peso escolhem-se na roda (B4); o teclado só aparece no modo Texto.
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
  const [openFood, setOpenFood] = useState<string | null>(null);

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

      {/* B8, foto 20:10: numa .hscroll os cinco somavam ~460 px e "Macros" ficava fora do
          ecrã a 360 e 390 px, sem nada a dizer que a fila rolava. Agora partem em linhas:
          todos à vista em qualquer largura (src/test/responsivo.test.ts). */}
      <div className="chipwrap px-5" style={{ paddingBottom: 'var(--sp-4)' }}>
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
                  <span className="d">{shortWeekday(locale, d0(d))}</span>
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
            <MacroCard
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
              onLog={() => setCapture({ meal: mealNow(), quick: false })}
            />
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

              {/* B6, foto de referência 19:35: "Hoje", uma fila de cartões de foto, um por alimento. */}
              <div className="px-5 pb-3 pt-6">
                <h2 className="display display-4">{date === today ? t.tabToday : t.diary}</h2>
              </div>
              <div className="food-rail" role="list" aria-label={t.diary}>
                {MEALS.flatMap((m) => meals[m])
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .map((e) => (
                    <div key={e.id} role="listitem">
                      <FoodCard entry={e} onOpen={() => setOpenFood(e.id)} />
                    </div>
                  ))}
                <div role="listitem">
                  <button type="button" className="food-card food-card-add" onClick={() => setCapture({ meal: mealNow(), quick: false })}>
                    <Icon name="plus" size={28} strokeWidth={2} />
                  </button>
                  <p className="food-card-name muted">{t.log}</p>
                </div>
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

      <MealSheet
        entries={dayEntries}
        openId={openFood}
        onPick={setOpenFood}
        onAdd={(m) => {
          setOpenFood(null);
          setCapture({ meal: m, quick: false });
        }}
      />
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

/*
 * B6: os macros do dia eram três "0g" soltos, e o ecrã ficava meio vazio. Agora são
 * três anéis. Cada anel mostra a fatia das calorias que esse macro dá (4 kcal/g na
 * proteína e nos hidratos, 9 na gordura), com os gramas ao centro. Não há metas de
 * hidratos nem de gordura guardadas, e por isso não se inventa uma. Sem nada
 * registado, o cartão diz isso e dá a ação para registar.
 */
function MacroCard({
  protein,
  carbs,
  fat,
  onLog,
}: {
  protein: number;
  carbs: number;
  fat: number;
  onLog: () => void;
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const num = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  const kcal = protein * 4 + carbs * 4 + fat * 9;
  const macros = [
    [t.protein, protein, protein * 4],
    [t.carbs, carbs, carbs * 4],
    [t.fat, fat, fat * 9],
  ] as const;

  return (
    <div className="card mx-5 mt-4">
      <p className="label">{t.macrosTitle}</p>
      {kcal === 0 ? (
        <div className="mt-3">
          <p className="body-2 muted">{t.emptyBody}</p>
          <button type="button" className="btn btn-primary mt-4" onClick={onLog}>
            {t.logMeal}
          </button>
        </div>
      ) : (
        <div className="grid-3 mt-4">
          {macros.map(([label, grams, part]) => {
            const share = Math.round((part / kcal) * 100);
            return (
              <div key={label} className="grid justify-items-center gap-2 text-center">
                <ProgressRing
                    value={share}
                    label={`${label}: ${num.format(grams)} g, ${share}% ${t.macrosOfKcal}`}
                    size={84}
                    stroke={8}
                    center={
                      <span className="metric metric-sm tabular absolute" style={{ color: 'var(--ui-text)' }}>
                        {num.format(grams)}
                        <span className="unit">g</span>
                      </span>
                    }
                  />
                <p className="label">{label}</p>
                <p className="body-2 muted tabular">
                  {share}% {t.macrosOfKcal}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
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

/**
 * O cartão de um alimento — foto de referência 19:35 (B6). A foto enche o quadrado, sem
 * gradiente por cima da comida; o ponto volt no canto; a pílula de vidro com a refeição em
 * baixo; o nome por baixo do cartão. Sem foto, a placa neutra com o ícone — nunca a foto de
 * outro alimento. Tocar abre a folha com o que foi registado.
 */
function FoodCard({ entry, onOpen }: { entry: FoodEntry; onOpen: () => void }) {
  const t = useLocale().t.nutrition;
  return (
    <>
      <button type="button" className="food-card" aria-label={`${t.meals[entry.meal]}: ${entry.name}`} onClick={onOpen}>
        {entry.photo_url ? (
          <img src={entry.photo_url} alt="" className="food-card-img" loading="lazy" />
        ) : (
          <span className="food-card-empty" aria-hidden="true">
            <Icon name="apple" size={34} strokeWidth={1.6} />
          </span>
        )}
        <span className="food-card-dot" aria-hidden="true" />
        <span className="food-card-tag">
          <Icon name="apple" size={14} strokeWidth={2} />
          {t.meals[entry.meal]}
        </span>
      </button>
      <p className="food-card-name">{entry.name}</p>
    </>
  );
}

/**
 * Tocar num cartão: o alimento, com as quatro operações (B7, foto 20:00). Criar é a Captura e
 * "Adicionar"; ver é esta folha; "Editar" passa-a a formulário (foto, nome obrigatório,
 * números e refeição) que atualiza a mesma linha; "Apagar" tira-o do diário.
 */
function MealSheet({
  entries,
  openId,
  onPick,
  onAdd,
}: {
  entries: FoodEntry[];
  openId: string | null;
  onPick: (id: string | null) => void;
  onAdd: (meal: Meal) => void;
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const remove = useDeleteRow('food_entries');
  const num = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const time = new Intl.DateTimeFormat(INTL_LOCALE[locale], { hour: '2-digit', minute: '2-digit' });
  const entry = entries.find((e) => e.id === openId) ?? null;
  /* A última entrada aberta fica à vista enquanto a folha fecha. */
  const [shown, setShown] = useState<FoodEntry | null>(entry);
  const [editing, setEditing] = useState(false);
  if (entry && entry !== shown) setShown(entry);
  /* Trocar de alimento, ou fechar, sai sempre da edição. */
  const [editingId, setEditingId] = useState(openId);
  if (openId !== editingId) {
    setEditingId(openId);
    setEditing(false);
  }
  const e = entry ?? shown;
  const siblings = e ? byMeal(entries)[e.meal].filter((o) => o.id !== e.id) : [];

  return (
    <Sheet
      open={entry !== null}
      onOpenChange={(o) => (o ? undefined : onPick(null))}
      title={e ? (editing ? t.editFood : t.meals[e.meal]) : t.mealDetail}
    >
      {e && editing ? (
        <FoodEditor key={e.id} entry={e} onDone={() => setEditing(false)} />
      ) : e ? (
        <div className="stack">
          <div className="food-detail-photo">
            {e.photo_url ? (
              <img src={e.photo_url} alt={e.name} className="food-card-img" />
            ) : (
              <span className="food-card-empty" aria-hidden="true">
                <Icon name="apple" size={48} strokeWidth={1.4} />
              </span>
            )}
          </div>
          <div>
            <p className="display display-4">{e.name}</p>
            <p className="body-2 muted mt-1">
              {t.loggedAt} {time.format(new Date(e.created_at))} · {e.estimate ? t.precisionEstimate : t.precisionMeasured}
            </p>
          </div>
          <div className="food-macros">
            <div className="food-macro">
              <span className="label">{t.calories}</span>
              <span className="tabular body-med">{e.kcal ?? 0} kcal</span>
            </div>
            <div className="food-macro">
              <span className="label">{t.protein}</span>
              <span className="tabular body-med">{num.format(Number(e.protein_g ?? 0))} g</span>
            </div>
            <div className="food-macro">
              <span className="label">{t.carbs}</span>
              <span className="tabular body-med">{num.format(Number(e.carbs_g ?? 0))} g</span>
            </div>
            <div className="food-macro">
              <span className="label">{t.fat}</span>
              <span className="tabular body-med">{num.format(Number(e.fat_g ?? 0))} g</span>
            </div>
          </div>
          {siblings.length ? (
            <div>
              <p className="label mb-2">{t.alsoInMeal}</p>
              {siblings.map((o) => (
                <button key={o.id} type="button" className="list-row w-full text-left" onClick={() => onPick(o.id)}>
                  <span className="body-1 min-w-0 flex-1 truncate">{o.name}</span>
                  <span className="body-2 muted tabular">{o.kcal ?? 0} kcal</span>
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="btn btn-primary btn-block" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} strokeWidth={2} />
            {t.edit}
          </button>
          <div className="food-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                remove.remove({ id: e.id });
                onPick(null);
              }}
            >
              <Icon name="trash" size={16} strokeWidth={2} />
              {t.deleteFood}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onAdd(e.meal)}>
              <Icon name="plus" size={16} strokeWidth={2} />
              {t.addShort}
            </button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

/**
 * Editar um alimento — B7. A foto põe-se, troca-se ou tira-se; o nome é obrigatório (vazio,
 * diz-se e o Guardar fica desligado); os números na roda (B4); a refeição nos presets.
 * Guardar atualiza a mesma linha — o mesmo `id` —, nunca cria outra.
 */
function FoodEditor({ entry, onDone }: { entry: FoodEntry; onDone: () => void }) {
  const t = useLocale().t.nutrition;
  const upsert = useUpsertRow('food_entries');
  const userId = useUserId();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const errorId = useId();
  const [name, setName] = useState(entry.name);
  const [kcal, setKcal] = useState(entry.kcal ?? 0);
  const [protein, setProtein] = useState(Number(entry.protein_g ?? 0));
  const [carbs, setCarbs] = useState(Number(entry.carbs_g ?? 0));
  const [fat, setFat] = useState(Number(entry.fat_g ?? 0));
  const [meal, setMeal] = useState<Meal>(entry.meal);
  /* A foto: a que está na linha, uma nova escolhida (ainda por subir), ou nenhuma. */
  const [photoUrl, setPhotoUrl] = useState<string | null>(entry.photo_url ?? null);
  const [picked, setPicked] = useState<{ file: File; preview: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const blank = !name.trim();
  const preview = picked?.preview ?? photoUrl;

  function pick(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicked({ file, preview: String(reader.result) });
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function save() {
    if (blank || saving) return;
    let url = photoUrl;
    if (picked) {
      if (!userId) return;
      setSaving(true);
      try {
        url = await uploadFoodPhoto(picked.file, userId, name.trim());
      } catch {
        setSaving(false);
        setNote(t.photoUploadFailed);
        return;
      }
    }
    upsert.save({
      id: entry.id,
      local_date: entry.local_date,
      meal,
      name: name.trim(),
      kcal: Math.round(kcal),
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      source: entry.source,
      estimate: entry.estimate,
      barcode: entry.barcode,
      /* Sem a 019 corrida, uma coluna desconhecida recusava a linha: só vai quando conta. */
      ...(url !== null || entry.photo_url != null ? { photo_url: url } : {}),
    });
    setSaving(false);
    onDone();
  }

  return (
    <div className="stack">
      <div className="food-detail-photo">
        {preview ? (
          <img src={preview} alt={name} className="food-card-img" />
        ) : (
          <span className="food-card-empty" aria-hidden="true">
            <Icon name="apple" size={48} strokeWidth={1.4} />
          </span>
        )}
      </div>
      <div className="food-actions">
        <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
          <Icon name="camera" size={16} strokeWidth={2} />
          {preview ? t.photoChangeShort : t.photoAddShort}
        </button>
        {preview ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPicked(null);
              setPhotoUrl(null);
            }}
          >
            <Icon name="x" size={16} strokeWidth={2} />
            {t.photoRemoveShort}
          </button>
        ) : null}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden aria-label={t.photoAddShort} onChange={(ev) => pick(ev.currentTarget.files?.[0])} />

      <div>
        <label className="label" htmlFor={nameId}>
          {t.name}
        </label>
        <input
          id={nameId}
          className={blank ? 'input is-error mt-2 w-full' : 'input mt-2 w-full'}
          value={name}
          required
          aria-invalid={blank}
          aria-describedby={blank ? errorId : undefined}
          onChange={(ev) => {
            /* B1: o valor lê-se já, antes do updater. */
            const value = ev.currentTarget.value;
            setName(value);
          }}
        />
        {blank ? (
          <p id={errorId} className="field-error-text mt-2" role="alert">
            {t.nameRequired}
          </p>
        ) : null}
      </div>

      <div className="food-edit-grid">
        <div>
          <p className="label mb-2">{t.calories}</p>
          <ValuePill scale="kcal" title={t.calories} value={kcal} onChange={setKcal} />
        </div>
        <div>
          <p className="label mb-2">{t.protein}</p>
          <ValuePill scale="grams" title={t.protein} value={protein} onChange={setProtein} />
        </div>
        <div>
          <p className="label mb-2">{t.carbs}</p>
          <ValuePill scale="grams" title={t.carbs} value={carbs} onChange={setCarbs} />
        </div>
        <div>
          <p className="label mb-2">{t.fat}</p>
          <ValuePill scale="grams" title={t.fat} value={fat} onChange={setFat} />
        </div>
      </div>

      <div>
        <p className="label mb-2">{t.meal}</p>
        <div className="presetrow" role="radiogroup" aria-label={t.meal}>
          {MEALS.map((m) => (
            <button key={m} type="button" className="preset" role="radio" aria-checked={meal === m} aria-pressed={meal === m} onClick={() => setMeal(m)}>
              {t.meals[m]}
            </button>
          ))}
        </div>
      </div>

      {note ? (
        <p className="body-2 muted" role="status">
          {note}
        </p>
      ) : null}
      <div className="food-actions">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          {t.cancel}
        </button>
        <button type="button" className="btn btn-primary" disabled={blank || saving} onClick={() => void save()}>
          {saving ? t.savingPhoto : t.save}
        </button>
      </div>
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
  /*
   * B3: o Base UI não chama onOpenChange quando é o ecrã a abrir a folha, e o valor ficava
   * o do primeiro render (70 kg, antes de os dados chegarem). Repõe-se ao abrir.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setKg(initial);
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.weightToday}
    >
      {/* B4: a roda com os valores já lá, e não − / +. Inteiros e décimas: 80 → 100 é um scroll. */}
      <WheelField scale="body" label={t.weight} value={kg} onChange={setKg} />
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
  /* B3: a meta guardada, e não 2000/120 do primeiro render — senão Guardar apagava-a. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setKcal(kcal0);
      setProtein(protein0);
    }
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.goalTitle}
    >
      <div className="stack">
        {/* B4: duas rodas lado a lado, kcal e proteína. */}
        <div className="wheelpair">
          <div>
            <p className="label">{t.calories}</p>
            <WheelField scale="kcalGoal" label={t.calories} value={kcal} onChange={setKcal} />
          </div>
          <div>
            <p className="label">{t.protein}</p>
            <WheelField scale="proteinGoal" label={t.protein} value={protein} onChange={setProtein} />
          </div>
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
