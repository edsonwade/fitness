import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useThemeState } from '../../app/theme-context';
import type { ThemePreference } from '../../app/theme';
import type { Goal } from '../../data/entities';
import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { pendingWrites } from '../../data/outbox';
import { useRows, useUserId } from '../../data/queries';
import { supabase } from '../../data/supabase';
import { INTL_LOCALE, LOCALES, LOCALE_NAMES } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { ValuePill } from '../../ui/ValuePill';
import { cycleWeek, phaseOfWeek } from '../train/journey';
import { localDate, useSessions } from '../train/sessions';
import { applyImport, buildExport, importPlan, type ImportPlan } from './data-port';
import { goalPct, num, remaining } from './goals';
import { setRestDefault, useRestDefault } from './rest-default';
import { ThemeToggle } from '../../ui/ThemeToggle';

const GOAL_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `${import.meta.env.BASE_URL}img/goal-${n}.jpg`);

/**
 * O Perfil — fase 023, `proto/v2/08-perfil.html`:
 *
 *  - frame 1: quem és, o corpo (altura, peso de hoje, meta — na roda, nunca teclado), os
 *    objetivos com foto e progresso, a sincronização, e os dados (exportar, importar,
 *    terminar sessão); as Definições (tema, idioma, descanso por omissão) numa folha;
 *  - frame 2: um objetivo atingido diz o facto e a data, e mais nada;
 *  - frame 3: a confirmação do que não se desfaz, com o botão perigoso em último.
 */
export function Profile() {
  const { locale, t: copy } = useLocale();
  const t = copy.profile;
  const userId = useUserId();
  const profiles = useRows('user_profiles');
  const goals = useRows('goals');
  const sessions = useSessions();
  const profile = profiles.data?.[0] ?? null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [goalSheet, setGoalSheet] = useState<{ goal: Goal | null; id: number } | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dec = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const height = num(profile?.height_cm);
  const now = num(profile?.weight_current);
  const target = num(profile?.weight_target);
  const start = num(profile?.weight_start);
  const week = cycleWeek(sessions.data ?? [], localDate(new Date()));
  const bodyPct =
    start !== null && now !== null && target !== null && start !== target
      ? Math.max(0, Math.min(100, Math.round(((start - now) / (start - target)) * 100)))
      : null;

  const sorted = useMemo(
    () => [...(goals.data ?? [])].sort((a, b) => Number(!!a.hit_at) - Number(!!b.hit_at) || b.created_at.localeCompare(a.created_at)),
    [goals.data],
  );

  async function exportData() {
    if (!userId) return;
    const file = await buildExport(userId);
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-${localDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function readImport(file: File | undefined) {
    if (!file) return;
    try {
      setPlan(importPlan(JSON.parse(await file.text())));
    } catch {
      setPlan({ ok: false });
    }
  }

  return (
    <div className="min-h-full pb-8">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="display display-4">{t.title}</h1>
        <span className="spacer" />
        <button type="button" className="btn btn-icon" aria-label={t.settings} onClick={() => setSettingsOpen(true)}>
          <Icon name="system" size={20} strokeWidth={2} />
        </button>
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg">
        <div className="row">
          {profile?.photo ? (
            <img className="avatar avatar-lg" src={profile.photo} alt="" />
          ) : (
            <span className="avatar avatar-lg grid place-items-center title-2" aria-hidden="true">
              {(profile?.name ?? t.you).slice(0, 1).toUpperCase()}
            </span>
          )}
          <div style={{ flex: '1 1 auto' }}>
            <p className="title-1">{profile?.name ?? t.you}</p>
            {week !== null ? (
              <p className="body-2 muted">
                {copy.journey.names[phaseOfWeek(week)]} · {t.blockWeek} {week}
              </p>
            ) : null}
          </div>
        </div>

        <section className="card">
          <p className="label">{t.body}</p>
          {height !== null || now !== null ? (
            <>
              <div className="grid-3 mt-3">
                <Figure value={height !== null ? dec.format(height > 3 ? height / 100 : height) : null} unit="m" label={t.height} />
                <Figure value={now !== null ? dec.format(now) : null} unit="kg" label={t.now} />
                <Figure value={target !== null ? dec.format(target) : null} unit="kg" label={t.goal} />
              </div>
              {bodyPct !== null ? (
                <>
                  <div className="track mt-4">
                    <i style={{ width: `${bodyPct}%` }} />
                  </div>
                  <p className="body-2 muted mt-2">
                    {t.startedAt} {dec.format(start as number)} kg.
                    {now !== null && target !== null ? ` ${t.leftPre} ${dec.format(Math.abs(now - target))} kg.` : ''}
                  </p>
                </>
              ) : null}
            </>
          ) : (
            <p className="body-2 muted mt-3">{t.noBody}</p>
          )}
          <button type="button" className="btn btn-secondary btn-block mt-4" onClick={() => setBodyOpen(true)}>
            {t.update}
          </button>
        </section>

        <section>
          <div className="row-between mb-3">
            <h2 className="display display-4">{t.goals}</h2>
            <button type="button" className="chip chip-sm" onClick={() => setGoalSheet({ goal: null, id: Date.now() })}>
              {t.newGoal}
            </button>
          </div>
          {sorted.length ? (
            <div className="stack-sm">
              {sorted.map((g, i) => {
                const pct = goalPct(g);
                const left = remaining(g);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={g.hit_at ? 'card card-accent row w-full text-left' : 'card row w-full text-left'}
                    onClick={() => setGoalSheet({ goal: g, id: Date.now() })}
                  >
                    <img className="thumb" src={g.photo ?? GOAL_PHOTOS[i % GOAL_PHOTOS.length]} alt="" />
                    <div className="min-w-0 flex-1">
                      <p className="title-3">{g.title}</p>
                      {g.hit_at ? (
                        <p className="body-2 body-med mt-0.5">
                          {t.hitOn} {longDate(g.hit_at.slice(0, 10), locale)}
                        </p>
                      ) : (
                        <>
                          <p className="body-2 muted tabular">
                            {g.current_value ?? '—'} {g.unit ?? ''}
                            {left !== null ? ` · ${t.left} ${dec.format(left)} ${g.unit ?? ''}` : ''}
                          </p>
                          {pct !== null ? (
                            <div className="track mt-2">
                              <i style={{ width: `${pct}%` }} />
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="card">
              <p className="body-2 muted">{t.noGoals}</p>
            </div>
          )}
        </section>

        <SyncCard />

        <div className="stack-sm">
          <button type="button" className="btn btn-secondary btn-block" onClick={() => void exportData()}>
            {t.exportLabel}
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
            {t.importLabel}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void readImport(e.currentTarget.files?.[0])}
          />
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ color: 'var(--ui-danger)' }}
            onClick={() => void supabase.auth.signOut()}
          >
            {t.signOut}
          </button>
          <button type="button" className="btn btn-ghost btn-block muted" onClick={() => setDeleting(true)}>
            {t.deleteAccount}
          </button>
        </div>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <BodySheet
        key={`body-${bodyOpen}`}
        open={bodyOpen}
        onOpenChange={setBodyOpen}
        height={height !== null ? (height > 3 ? height / 100 : height) : 1.75}
        weight={now ?? 70}
        target={target ?? now ?? 70}
        hasStart={start !== null}
      />
      {goalSheet ? (
        <GoalSheet key={goalSheet.id} goal={goalSheet.goal} onClose={() => setGoalSheet(null)} />
      ) : null}
      {plan ? <ImportDialog plan={plan} onClose={() => setPlan(null)} /> : null}
      {deleting ? <DeleteDialog onClose={() => setDeleting(false)} /> : null}
    </div>
  );
}

function longDate(iso: string, locale: keyof typeof INTL_LOCALE) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
}

function Figure({ value, unit, label }: { value: string | null; unit: string; label: string }) {
  return (
    <div>
      <p className="metric metric-sm tabular">
        {value ?? '—'}
        {value ? <span className="unit">{unit}</span> : null}
      </p>
      <p className="body-2 muted">{label}</p>
    </div>
  );
}

function SyncCard() {
  const t = useLocale().t.profile;
  const client = useQueryClient();
  const pending = pendingWrites(client);
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const ok = online && pending === 0;
  return (
    <section className="card">
      <p className="label">{t.sync}</p>
      <div className="row mt-3">
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: ok ? 'var(--ui-accent)' : 'var(--ui-danger)',
            flex: '0 0 auto',
          }}
        />
        <div style={{ flex: '1 1 auto' }}>
          <p className="body-1 body-med">{!online ? t.offline : pending ? `${pending} ${pending === 1 ? t.waitingOne : t.waiting}` : t.synced}</p>
          <p className="body-2 muted">{ok ? t.syncedBody : t.waitingBody}</p>
        </div>
      </div>
    </section>
  );
}

function SettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { locale, setLocale, t: copy } = useLocale();
  const t = copy.profile;
  const { theme, setTheme } = useThemeState();
  const rest = useRestDefault();
  const themes: [ThemePreference, string][] = [
    ['dark', t.dark],
    ['light', t.light],
    ['system', t.system],
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.settings}>
      <div className="stack">
        <div>
          <p className="label mb-2">{t.theme}</p>
          <div className="segmented" role="radiogroup" aria-label={t.theme}>
            {themes.map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={theme === k} aria-selected={theme === k} onClick={() => setTheme(k)}>
                {label}
              </button>
            ))}
          </div>
          <p className="body-2 muted mt-1.5">{t.themeHint}</p>
        </div>
        <div>
          <p className="label mb-2">{t.language}</p>
          {/* B8: quatro nomes em colunas iguais não cabem a 320–390 px ("Português" precisa
              de 63 px e tinha 44). Presets que partem em linhas, como a refeição. */}
          <div className="presetrow" role="radiogroup" aria-label={t.language}>
            {LOCALES.map((l) => (
              <button key={l} type="button" className="preset" role="radio" lang={l} aria-checked={locale === l} aria-pressed={locale === l} onClick={() => setLocale(l)}>
                {LOCALE_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-2">{t.restDefault}</p>
          <ValuePill scale="rest" title={t.restDefault} value={rest} onChange={setRestDefault} />
          <p className="body-2 muted mt-2">{t.restHint}</p>
        </div>
      </div>
    </Sheet>
  );
}

function BodySheet({
  open,
  onOpenChange,
  height: h0,
  weight: w0,
  target: g0,
  hasStart,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  height: number;
  weight: number;
  target: number;
  hasStart: boolean;
}) {
  const t = useLocale().t.profile;
  const profile = useUpsertRow('user_profiles');
  const weightLog = useUpsertRow('weight_logs');
  const logs = useRows('weight_logs');
  const [h, setH] = useState(h0);
  const [w, setW] = useState(w0);
  const [g, setG] = useState(g0);
  const text = (v: number, d: number) => v.toFixed(d).replace('.', ',');

  function save() {
    const today = localDate(new Date());
    profile.save({
      height_cm: String(Math.round(h * 100)),
      weight_current: text(w, 1),
      weight_target: text(g, 1),
      ...(hasStart ? {} : { weight_start: text(w, 1) }),
    });
    /* O mesmo peso no tracker da Nutrição: uma verdade só. */
    weightLog.save({
      id: (logs.data ?? []).find((l) => l.local_date === today)?.id ?? crypto.randomUUID(),
      local_date: today,
      kg: Math.round(w * 10) / 10,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.body}>
      <div className="stack-lg">
        <div>
          <p className="label mb-2">{t.height}</p>
          <ValuePill scale="height" title={t.height} value={h} onChange={setH} />
        </div>
        <div>
          <p className="label mb-2">{t.weightToday}</p>
          <ValuePill scale="body" title={t.weightToday} value={w} onChange={setW} />
        </div>
        <div>
          <p className="label mb-2">{t.goal}</p>
          <ValuePill scale="goalKg" title={t.goal} value={g} onChange={setG} />
        </div>
        <button type="button" className="btn btn-primary btn-block" onClick={save}>
          {t.save}
        </button>
      </div>
    </Sheet>
  );
}

/** Criar, acompanhar e fechar um objetivo. Atingido: o facto e a data (frame 2), e mais nada. */
function GoalSheet({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.profile;
  const upsert = useUpsertRow('goals');
  const remove = useDeleteRow('goals');
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState(goal?.title ?? '');
  const [unit, setUnit] = useState<'kg' | 'count'>(goal?.unit && goal.unit !== 'kg' ? 'count' : 'kg');
  const [startV, setStartV] = useState(num(goal?.start_value) ?? 0);
  const [targetV, setTargetV] = useState(num(goal?.target_value) ?? 0);
  const [currentV, setCurrentV] = useState(num(goal?.current_value) ?? num(goal?.start_value) ?? 0);
  const [photo, setPhoto] = useState(goal?.photo ?? GOAL_PHOTOS[0]);
  const dec = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const scale = unit === 'kg' ? 'goalKg' : 'count';
  const unitText = unit === 'kg' ? 'kg' : t.unitCount;

  function close() {
    setOpen(false);
    window.setTimeout(onClose, 300);
  }

  function save(hit = false) {
    if (!title.trim()) return;
    upsert.save({
      id: goal?.id ?? crypto.randomUUID(),
      title: title.trim(),
      unit: unitText,
      start_value: String(startV),
      target_value: String(targetV),
      current_value: String(currentV),
      photo,
      ...(hit ? { hit_at: new Date().toISOString() } : {}),
    });
    close();
  }

  if (goal?.hit_at) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && close()} title={t.goalTitle}>
        <div className="stack">
          <div className="card-media" style={{ height: 170 }}>
            <img src={goal.photo ?? GOAL_PHOTOS[0]} alt="" />
          </div>
          <div>
            <span className="chip chip-sm chip-selected">{t.hitChip}</span>
            <p className="display display-2 mt-3">{goal.title}</p>
            <p className="body-1 muted mt-3">
              {t.hitBodyPre} {longDate(goal.hit_at.slice(0, 10), locale)}
              {t.hitBodyMid} {longDate(goal.created_at.slice(0, 10), locale)}
              {goal.start_value ? `${t.hitBodyPost} ${goal.start_value} ${goal.unit ?? ''}` : ''}.
            </p>
          </div>
          <div className="grid-2">
            <div className="card card-sunken">
              <p className="label">{t.whenSet}</p>
              <p className="metric metric-sm tabular mt-1">
                {goal.start_value ?? '—'}
                <span className="unit">{goal.unit ?? ''}</span>
              </p>
            </div>
            <div className="card card-sunken">
              <p className="label">{t.now}</p>
              <p className="metric metric-sm tabular mt-1">
                {goal.current_value ?? '—'}
                <span className="unit">{goal.unit ?? ''}</span>
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={() => {
            close();
          }}>
            {t.nextGoal}
          </button>
          <button type="button" className="btn btn-ghost btn-block muted" onClick={() => { remove.remove({ id: goal.id }); close(); }}>
            {t.deleteGoal}
          </button>
        </div>
      </Sheet>
    );
  }

  const pct = goalPct({ start_value: String(startV), target_value: String(targetV), current_value: String(currentV) });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title={t.goalTitle}>
      <div className="stack">
        <div>
          <label className="label" htmlFor="goal-title">
            {t.titleLabel}
          </label>
          <input
            id="goal-title"
            className="input mt-2 w-full"
            value={title}
            placeholder={t.titlePlaceholder}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
        </div>
        <div>
          <p className="label mb-2">{t.unit}</p>
          <div className="segmented" role="radiogroup" aria-label={t.unit}>
            <button type="button" role="radio" aria-checked={unit === 'kg'} aria-selected={unit === 'kg'} onClick={() => setUnit('kg')}>
              {t.unitKg}
            </button>
            <button type="button" role="radio" aria-checked={unit === 'count'} aria-selected={unit === 'count'} onClick={() => setUnit('count')}>
              {t.unitCount}
            </button>
          </div>
        </div>
        <div className="row-between">
          <p className="title-3">{t.startLabel}</p>
          <ValuePill scale={scale} title={t.startLabel} value={startV} onChange={setStartV} />
        </div>
        <div className="row-between">
          <p className="title-3">{t.targetLabel}</p>
          <ValuePill scale={scale} title={t.targetLabel} value={targetV} onChange={setTargetV} />
        </div>
        {goal ? (
          <div className="row-between">
            <p className="title-3">{t.currentLabel}</p>
            <ValuePill scale={scale} title={t.currentLabel} value={currentV} onChange={setCurrentV} />
          </div>
        ) : null}
        {goal && pct !== null ? (
          <div>
            <div className="track">
              <i style={{ width: `${pct}%` } as CSSProperties} />
            </div>
            <p className="body-2 muted mt-1 tabular">
              {t.left} {dec.format(Math.abs(targetV - currentV))} {unitText}
            </p>
          </div>
        ) : null}
        <div>
          <p className="label mb-2">{t.photo}</p>
          <div className="row flex-wrap" style={{ gap: 'var(--sp-2)' }}>
            {GOAL_PHOTOS.map((src) => (
              <button
                key={src}
                type="button"
                aria-pressed={photo === src}
                onClick={() => setPhoto(src)}
                className="rounded-[12px] p-0.5"
                style={photo === src ? { outline: '2px solid var(--ui-accent)' } : undefined}
              >
                <img className="thumb-sm" src={src} alt="" />
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block" disabled={!title.trim()} onClick={() => save()}>
          {t.save}
        </button>
        {goal ? (
          <>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => save(true)}>
              {t.markHit}
            </button>
            <button type="button" className="btn btn-ghost btn-block muted" onClick={() => { remove.remove({ id: goal.id }); close(); }}>
              {t.deleteGoal}
            </button>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}

/** Frame 3: o que vai mudar, dito antes; "Cancelar" primeiro, o perigoso em último. */
function ImportDialog({ plan, onClose }: { plan: ImportPlan; onClose: () => void }) {
  const t = useLocale().t.profile;
  const userId = useUserId();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex p-5" role="dialog" aria-modal="true" aria-labelledby="imp-t">
      <div className="scrim" onClick={onClose} />
      <div className="dialog relative">
        <h2 className="title-2" id="imp-t">
          {t.importTitle}
        </h2>
        {plan.ok ? (
          <>
            <p className="body-1 mt-3">
              {t.importBodyPre} {plan.total} {t.importRows} {t.importIn} {plan.tables.length} {t.importTables}:{' '}
              {plan.tables.map((x) => `${x.table} (${x.rows})`).join(', ')}.
            </p>
            <p className="body-2 muted mt-2">{t.importWarn}</p>
          </>
        ) : (
          <p className="body-1 mt-3">{t.importBad}</p>
        )}
        <div className="stack-sm mt-5">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            {t.cancel}
          </button>
          {plan.ok ? (
            <button
              type="button"
              className="btn btn-danger btn-block"
              disabled={busy || !userId}
              onClick={async () => {
                if (!userId) return;
                setBusy(true);
                try {
                  await applyImport(plan, userId);
                } finally {
                  await client.invalidateQueries();
                  setBusy(false);
                  onClose();
                }
              }}
            >
              {t.importGo}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const t = useLocale().t.profile;
  const sessions = useSessions();
  const goals = useRows('goals');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = sessions.data?.length ?? 0;
  return (
    <div className="fixed inset-0 z-50 flex p-5" role="dialog" aria-modal="true" aria-labelledby="del-t">
      <div className="scrim" onClick={onClose} />
      <div className="dialog relative">
        <h2 className="title-2" id="del-t">
          {t.deleteTitle}
        </h2>
        <p className="body-1 mt-3">
          {t.deleteBodyPre} {count} {t.deleteSessions}, {t.deleteSets} {goals.data?.length ?? 0} {t.deleteGoals}
        </p>
        {failed ? <p className="body-2 mt-2" style={{ color: 'var(--ui-danger)' }}>{t.deleteFail}</p> : null}
        <div className="stack-sm mt-5">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="btn btn-danger btn-block"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error } = await supabase.rpc('delete_my_account');
              setBusy(false);
              if (error) {
                setFailed(true);
                return;
              }
              await supabase.auth.signOut();
            }}
          >
            {t.deleteGo}
          </button>
        </div>
      </div>
    </div>
  );
}
