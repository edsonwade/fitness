import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import clsx from 'clsx';

import { BLOCKS, CARDIO, DAYS, type BlockKey } from '../../content';
import type { LogFields } from '../../data/mutations';
import { useMergeExerciseLog } from '../../data/mutations';
import { pt } from '../../i18n/pt';
import { Screen } from '../../ui/Screen';
import { Icon, IconButton } from '../../ui/Icon';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSheet, type SheetMode } from './ExerciseSheet';
import { RestTimer } from './RestTimer';
import { useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, logId, useExerciseLogs } from './logs';
import { useDayEditing, type ExerciseInput } from './use-day-editing';

const t = pt.train;
const e = pt.editor;

function isBlockKey(value: string | null): value is BlockKey {
  return value !== null && (BLOCK_KEYS as readonly string[]).includes(value);
}

type Rest = { id: number; seconds: number; name: string };

/**
 * One training day, and the working surface of the whole app.
 *
 * Two things happen here. The day is logged: the videos play, the sets tick, the loads
 * are written and read back. And the day is composed: an exercise is added, a
 * prescription is changed, one that is not happening today is taken out, and the order
 * is made to match the room. Everything on screen comes from `useProgramme`, which
 * merges the bundled programme with the user's four private tables, so the two halves
 * are looking at the same day rather than at the plan and at the edits separately.
 *
 * The block rides in on the URL, so a day opened from block two opens on block two and
 * survives a reload; the chips here rewrite that same search param rather than holding
 * a second copy of the state.
 *
 * The rest clock is owned here, not in the card, because there is one body resting at
 * a time. A new tick replaces the running clock rather than stacking a second one.
 */
export function DayView() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const merge = useMergeExerciseLog();
  const logs = useExerciseLogs();
  const [rest, setRest] = useState<Rest | null>(null);
  /*
   * The sheet stays mounted after it closes so it can animate out, and is remounted
   * under a fresh `id` every time one is opened. That is what seeds the form with the
   * right exercise without an effect writing state after render.
   */
  const [sheet, setSheet] = useState<{ mode: SheetMode; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const dayId = Number(params.dia);
  const day = DAYS.find((d) => d.id === dayId) ?? null;
  const blockParam = searchParams.get('bloco');
  const block: BlockKey = isBlockKey(blockParam) ? blockParam : 'b1';

  const programme = useProgramme(block);
  const editing = useDayEditing(dayId);
  const { entries, hiddenCount } = programme.resolve(day, dayId);
  const progress = dayProgress(dayId, block, entries, logs.byKey);

  if (!day) {
    return (
      <Screen title="Dia não encontrado" body="Este dia de treino não existe.">
        <Link
          to="/"
          className="inline-flex min-h-[48px] items-center rounded-full bg-accent px-6 font-ui text-[14px] font-700 text-accent-ink"
        >
          {t.title}
        </Link>
      </Screen>
    );
  }

  // Bound after the guard above, because a hoisted function body does not inherit the
  // narrowing an early return gives the rest of the component.
  const baselineItems = day.items ?? [];
  const isRestDay = day.type === 'rest' && entries.length === 0 && hiddenCount === 0;

  function setBlock(next: BlockKey) {
    const next_params = new URLSearchParams(searchParams);
    next_params.set('bloco', next);
    setSearchParams(next_params, { replace: true });
  }

  function save(exKey: string, fields: LogFields) {
    merge.log({ day_no: dayId, block, ex_key: exKey }, fields);
  }

  /**
   * Back means back, when there is a history entry to go back to. A day is normally
   * opened from the week, and returning there is what the gesture means; but the day
   * is also a deep link a user can land on cold, and popping an empty history stack
   * leaves them on the same screen with nothing having happened. The week is the
   * fallback because it is the parent of this screen, not merely the home page.
   */
  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  }

  function startRest(seconds: number, name: string) {
    setRest({ id: Date.now(), seconds, name });
  }

  function openSheet(mode: SheetMode) {
    // A counter rather than a clock: the id only has to differ from the last one, and
    // reading the clock during a render is a rule this codebase keeps.
    setSheet((current) => ({ mode, id: (current?.id ?? 0) + 1 }));
    setSheetOpen(true);
  }

  /** One handler for all three shapes of the sheet: new, own, and baseline. */
  function submitSheet(input: ExerciseInput) {
    const mode = sheet?.mode;
    if (!mode) return;
    if (mode.kind === 'new') editing.addCustom(input);
    else if (mode.kind === 'own') editing.saveCustom(mode.entry.custom!, input);
    else editing.saveOverride(mode.entry.key, input);
  }

  function removeOwn() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'own') return;
    if (!window.confirm(e.removeConfirm)) return;
    editing.deleteCustom(mode.entry.custom!);
    setSheetOpen(false);
  }

  function restoreOriginal() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'built' || !mode.entry.override) return;
    if (!window.confirm(e.restoreOriginalConfirm)) return;
    editing.clearOverride(mode.entry.override);
    setSheetOpen(false);
  }

  /**
   * Restoring works off the day's own baseline keys, not off the hidden table.
   *
   * `hidden_items` is scoped per user and holds every day at once; asking it which
   * keys belong to this day is asking it something it is not indexed for. The day
   * knows its own exercises, and the ones missing from the resolved list are exactly
   * the ones to put back.
   */
  function restoreHidden() {
    const visible = new Set(entries.map((entry) => entry.key));
    editing.restoreHidden(baselineItems.map((i) => i.ex).filter((k) => !visible.has(k)));
  }

  return (
    <div className="min-h-[100dvh] bg-page py-0 sm:py-8">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[26.5rem] overflow-hidden bg-ground sm:min-h-0 sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-wash-from from-15% via-wash-from/75 via-45% to-wash-to"
        />

        <div className="relative px-6 pb-40">
          <header className="flex items-center gap-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <IconButton icon="back" label={pt.common.back} onClick={goBack} />
            <div className="min-w-0 flex-1 text-center">
              <p className="font-ui text-[11px] font-600 uppercase tracking-[0.05em] text-text-muted">
                {day.wd.pt}
              </p>
              <h1 className="truncate font-ui text-[19px] font-700 text-text">{day.name.pt}</h1>
            </div>
            <span className="h-11 w-11 shrink-0" aria-hidden="true" />
          </header>

          <div
            className="rail -mx-6 mt-4 gap-2.5 px-6 pb-1"
            role="tablist"
            aria-label={t.blocksLabel}
          >
            {BLOCKS.map((b) => {
              const selected = b.k === block;
              return (
                <button
                  key={b.k}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setBlock(b.k as BlockKey)}
                  className={clsx(
                    'min-h-[42px] rounded-full px-4 font-ui text-[13px] font-500',
                    'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                    'active:scale-[0.97] motion-reduce:active:scale-100',
                    selected
                      ? 'bg-chip-selected font-600 text-chip-selected-ink'
                      : 'bg-chip text-chip-ink',
                  )}
                >
                  {b.t.pt}
                </button>
              );
            })}
          </div>

          {/* Day progress. */}
          <div className="mt-4 rounded-card bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <span className="font-ui text-[12px] font-600 text-text-muted">{t.progressLabel}</span>
              <span className="tabular font-ui text-[13px] font-700 text-text">
                {progress.done}/{progress.total} {t.series}
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            {progress.total > 0 && progress.done >= progress.total ? (
              <p className="mt-2 flex items-center gap-1.5 font-ui text-[12.5px] font-600 text-accent-line">
                <Icon name="check" size={15} strokeWidth={2.6} />
                {t.allDone}
              </p>
            ) : null}
          </div>

          {day.goal ? <Callout title={t.goal}>{day.goal.pt}</Callout> : null}
          {day.warm ? <Callout title={t.warmup}>{day.warm.pt}</Callout> : null}

          {logs.isError || programme.isError ? (
            <p
              role="status"
              className="mt-4 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
            >
              {t.logsError}
            </p>
          ) : null}

          {/*
            * A rejected write has to say so. The card appears the moment it is added,
            * and without this the only way to find out the server refused it is to
            * open the day again tomorrow and see it gone.
            */}
          {editing.saveFailed ? (
            <p
              role="alert"
              className="mt-4 rounded-card border border-danger/40 bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-danger"
            >
              {e.saveFailed}
            </p>
          ) : null}

          {isRestDay ? (
            <div className="mt-6 rounded-card border border-rule bg-surface p-6 text-center">
              <p className="font-ui text-[15px] font-700 text-text">{t.restDay}</p>
              <p className="mt-1.5 font-ui text-[13px] leading-snug text-text-muted">
                {t.restDayBody}
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="mt-6 rounded-card border border-rule bg-surface p-6 text-center">
              <p className="font-ui text-[15px] font-700 text-text">{e.emptyTitle}</p>
              <p className="mt-1.5 font-ui text-[13px] leading-snug text-text-muted">{e.emptyBody}</p>
            </div>
          ) : (
            <ul className="mt-5 flex flex-col gap-4">
              {entries.map((entry, index) => (
                <li key={entry.key}>
                  <ExerciseCard
                    entry={entry}
                    log={logs.byKey.get(logId(dayId, block, entry.key))}
                    onSave={save}
                    onRest={startRest}
                    controls={{
                      onEdit: () => openSheet(sheetModeFor(entry)),
                      onHide: entry.kind === 'built' ? () => editing.hide(entry.key) : undefined,
                      onMove: (direction) => editing.move(entries, entry.key, direction),
                      canMoveUp: index > 0,
                      canMoveDown: index < entries.length - 1,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {hiddenCount > 0 ? (
            <p className="mt-4 text-center font-ui text-[12.5px] text-text-muted">
              {hiddenCount} {hiddenCount === 1 ? e.hiddenOne : e.hiddenMany}
              <span aria-hidden="true"> · </span>
              <button
                type="button"
                onClick={restoreHidden}
                className="min-h-[44px] font-700 text-accent-line underline-offset-4 pointer-hover:underline"
              >
                {e.restore}
              </button>
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => openSheet({ kind: 'new' })}
            className={clsx(
              'mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full',
              'border border-dashed border-edge/60 bg-transparent',
              'font-ui text-[14px] font-700 text-text',
              'transition-[border-color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
              'active:scale-[0.98] motion-reduce:active:scale-100 pointer-hover:border-edge',
            )}
          >
            <Icon name="plus" size={18} strokeWidth={2.2} />
            {e.add}
          </button>

          {day.cardio?.length ? <CardioSection keys={day.cardio} /> : null}
        </div>

        {rest ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-0">
            <RestTimer
              key={rest.id}
              seconds={rest.seconds}
              exerciseName={rest.name}
              onClose={() => setRest(null)}
            />
          </div>
        ) : null}
      </div>

      {sheet ? (
        <ExerciseSheet
          key={sheet.id}
          open={sheetOpen}
          mode={sheet.mode}
          onOpenChange={setSheetOpen}
          onSubmit={submitSheet}
          onDelete={sheet.mode.kind === 'own' ? removeOwn : undefined}
          onRestore={
            sheet.mode.kind === 'built' && sheet.mode.entry.override ? restoreOriginal : undefined
          }
        />
      ) : null}
    </div>
  );
}

function sheetModeFor(entry: DayEntry): SheetMode {
  return entry.kind === 'custom' ? { kind: 'own', entry } : { kind: 'built', entry };
}

function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-card border border-accent-line/25 bg-accent-soft px-4 py-3">
      <p className="font-ui text-[11px] font-700 uppercase tracking-[0.05em] text-accent-line">
        {title}
      </p>
      <p className="mt-1 font-ui text-[13px] leading-snug text-text">{children}</p>
    </div>
  );
}

/** The cardio prescriptions a day names, shown as read-only guidance. */
function CardioSection({ keys }: { keys: readonly string[] }) {
  const entries = keys.map((k) => CARDIO[k]).filter(Boolean);
  if (!entries.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 font-ui text-[15px] font-700 text-text">Cardio</h2>
      <ul className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <li key={i} className="rounded-card border border-rule bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-ui text-[15px] font-700 text-text">{entry.nPT}</h3>
              <span className="tabular shrink-0 font-ui text-[12.5px] font-600 text-accent-line">
                {entry.dur}
              </span>
            </div>
            <p className="mt-1.5 font-ui text-[12.5px] leading-snug text-text-muted">{entry.obj.pt}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {entry.tips.pt.map((tip, j) => (
                <li key={j} className="flex gap-2 font-ui text-[12.5px] leading-snug text-text">
                  <span aria-hidden="true" className="shrink-0 text-accent-line">
                    ·
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
