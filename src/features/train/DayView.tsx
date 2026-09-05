import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import clsx from 'clsx';

import { BLOCKS, CARDIO, type BlockKey } from '../../content';
import type { LogFields } from '../../data/mutations';
import { useMergeExerciseLog } from '../../data/mutations';
import { pt } from '../../i18n/pt';
import { Screen, SessionSplash } from '../../ui/Screen';
import { Icon, IconButton } from '../../ui/Icon';
import { WriteFailureNotice } from '../../ui/Notice';
import { DaySheet } from './DaySheet';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseSheet, type SheetMode } from './ExerciseSheet';
import { RestTimer } from './RestTimer';
import { blockSummary, type BlockSummary } from './block-summary';
import { useCustomDayEditing, useDays, type DayInput } from './custom-days';
import { useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, logId, useExerciseLogs } from './logs';
import { useDayEditing, type ExerciseInput } from './use-day-editing';

const t = pt.train;
const e = pt.editor;
const d = pt.days;

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
  const [daySheet, setDaySheet] = useState<number | null>(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  /*
   * The rail scrolls now that a phase says what it is and what it costs, so the
   * selected one has to be brought into view. Without this, opening a day on the
   * deload from a link lands on a rail scrolled to the start, showing three phases
   * that are not the one on screen. `block: 'nearest'` keeps the page itself still.
   */
  const selectedPhase = useRef<HTMLButtonElement>(null);

  const dayId = Number(params.dia);
  const week = useDays();
  const dayRef = week.dayOf(dayId);
  const blockParam = searchParams.get('bloco');
  const block: BlockKey = isBlockKey(blockParam) ? blockParam : 'b1';

  const programme = useProgramme(block);
  const editing = useDayEditing(dayId);
  const dayEditing = useCustomDayEditing();
  const { entries, hiddenCount } = programme.resolve(dayRef?.day ?? null, dayId);
  const progress = dayProgress(dayId, block, entries, logs.byKey);

  useEffect(() => {
    selectedPhase.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [block]);

  /*
   * A day of the user's own does not ship in the bundle, so opening one cold means
   * waiting for a row. Telling someone their own training day does not exist, every
   * time they open it from a link, is the failure this guard exists to prevent.
   */
  if (!dayRef && week.isPending) {
    return <SessionSplash label={pt.common.loading} />;
  }

  if (!dayRef) {
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
  const day = dayRef;
  const baselineItems = day.day?.items ?? [];
  const isOwnDay = day.kind === 'own';
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
    else if (mode.kind === 'shared') editing.saveShared(mode.entry, input);
    else if (mode.kind === 'built') editing.saveOverride(mode.entry.key, input);
  }

  function removeOwn() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'own') return;
    if (!window.confirm(e.removeConfirm)) return;
    editing.deleteCustom(mode.entry.custom!);
    setSheetOpen(false);
  }

  /**
   * Removes a published exercise from every account, not just this one.
   *
   * The confirmation says so in those words. Anyone may do this, by the decision of
   * 2026-09-02, which makes the wording the only thing standing between "I do not
   * want this in my Tuesday" and deleting it out of someone else's Tuesday. Taking it
   * out of your own day is a different control, on the card, called something else.
   */
  function removeShared() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'shared') return;
    if (!window.confirm(e.removeSharedConfirm)) return;
    editing.removeShared(mode.entry);
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
    /*
     * The keys this day could be showing: the programme's own, plus everything
     * anyone published onto it. Whatever is missing from the resolved list is what
     * was hidden. Asking `hidden_items` instead would be asking a table that holds
     * every day at once which of its rows belong to this one.
     */
    const possible = [
      ...baselineItems.map((i) => i.ex),
      ...(programme.additions ?? [])
        .filter((row) => row.day_no === dayId)
        .map((row) => row.ex_key),
    ];
    editing.restoreHidden(possible.filter((k) => !visible.has(k)));
  }

  function openDaySheet() {
    setDaySheet((current) => (current ?? 0) + 1);
    setDaySheetOpen(true);
  }

  function saveDay(input: DayInput) {
    if (!day.custom) return;
    dayEditing.saveDay(day.custom, input);
  }

  /**
   * Deleting the day leaves the screen the day was on, and has to.
   *
   * The row goes first and the navigation follows in the same tick: the write is
   * optimistic, so staying here for even a frame would render a day that no longer
   * exists and land on the "day not found" screen by way of an empty list.
   */
  function removeDay() {
    if (!window.confirm(d.removeConfirm)) return;
    dayEditing.deleteDay(dayId);
    setDaySheetOpen(false);
    navigate('/', { replace: true });
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
                {day.label}
              </p>
              <h1 className="truncate font-ui text-[19px] font-700 text-text">{day.name}</h1>
            </div>
            {/*
              * The edit control appears only on a day the user made. The programme's
              * seven are not editable content: they ship in the bundle, so there is
              * nothing here that could change them, and a button that opened a form
              * with no destination would be a promise the data model refuses.
              */}
            {isOwnDay ? (
              <IconButton icon="edit" label={d.edit} onClick={openDaySheet} />
            ) : (
              <span className="h-11 w-11 shrink-0" aria-hidden="true" />
            )}
          </header>

          {/*
            * The four phases of the programme, each saying what it is and what it
            * costs today.
            *
            * It used to say "Bloco 1", which is the position of a thing in a list and
            * not the thing itself. The name comes from the plan (§8.3), the meaning
            * under it is the authored `s.pt` printed verbatim, and the third line is
            * counted off this day's resolved entries rather than written by hand.
            *
            * Every tab is resolved in its own block, not in the selected one. The
            * count is the same in all four, because a block changes targets and not
            * the list, but the minutes are not: the deload prescribes fewer sets, and
            * reading them all off the current block would have printed one block's
            * cost four times.
            */}
          <div
            className="rail -mx-6 mt-4 gap-2.5 px-6 pb-1"
            role="tablist"
            aria-label={t.blocksLabel}
          >
            {BLOCKS.map((b) => {
              const key = b.k as BlockKey;
              const selected = key === block;
              const summary = blockSummary(programme.resolveIn(key, day.day ?? null, dayId).entries);
              const cost = costOf(summary);
              return (
                <button
                  key={b.k}
                  ref={selected ? selectedPhase : undefined}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  /*
                   * Spoken as a sentence, because the visible lines are built out of
                   * separators and a tilde: "~27 min" read aloud is the word tilde.
                   */
                  aria-label={[t.phase[key], b.s.pt, cost.spoken].filter(Boolean).join(', ')}
                  onClick={() => setBlock(key)}
                  className={clsx(
                    'min-w-[10.5rem] rounded-card px-4 py-3 text-left font-ui',
                    'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                    'active:scale-[0.97] motion-reduce:active:scale-100',
                    selected ? 'bg-chip-selected text-chip-selected-ink' : 'bg-chip text-chip-ink',
                  )}
                >
                  {/*
                    * Hidden from the reader, who gets the label above, and the three
                    * lines carry no colour of their own: the muted token is mixed for
                    * the page, not for a chip, and on the orange selected fill it
                    * lands at 2.9:1. The steps here are size and weight.
                    */}
                  <span aria-hidden="true" className="block text-[15px] font-700 leading-[1.2]">
                    {t.phase[key]}
                  </span>
                  <span aria-hidden="true" className="mt-0.5 block text-[11.5px] font-500 leading-[1.3]">
                    {b.s.pt}
                  </span>
                  {cost.shown ? (
                    <span
                      aria-hidden="true"
                      className="tabular mt-1.5 block text-[11px] font-600 leading-[1.3]"
                    >
                      {cost.shown}
                    </span>
                  ) : null}
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

          {day.goal ? <Callout title={t.goal}>{day.goal}</Callout> : null}
          {day.warm ? <Callout title={t.warmup}>{day.warm}</Callout> : null}

          {logs.isError || programme.isError ? (
            <p
              role="status"
              className="mt-4 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
            >
              {t.logsError}
            </p>
          ) : null}

          {/*
            * A rejected write has to say so, and say which one. The card appears the
            * moment it is added, so without this the only way to find out the server
            * refused it is to open the day again tomorrow and see it gone.
            */}
          <WriteFailureNotice failure={editing.failure} />
          <WriteFailureNotice failure={dayEditing.failure} />

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
                      /*
                       * Hiding takes something out of THIS day, for this account
                       * only, and it is offered on anything the user did not write:
                       * the programme's exercises and the ones other people
                       * published. An exercise of your own has a delete instead,
                       * because hiding a row you can remove would be two ways to do
                       * the same thing with different consequences.
                       */
                      onHide:
                        entry.kind === 'custom' ? undefined : () => editing.hide(entry.key),
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

          {day.day?.cardio?.length ? <CardioSection keys={day.day.cardio} /> : null}
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

      {daySheet && day.custom ? (
        <DaySheet
          key={daySheet}
          open={daySheetOpen}
          mode={{ kind: 'edit', ref: day }}
          onOpenChange={setDaySheetOpen}
          onSubmit={saveDay}
          onDelete={removeDay}
        />
      ) : null}

      {sheet ? (
        <ExerciseSheet
          key={sheet.id}
          open={sheetOpen}
          mode={sheet.mode}
          onOpenChange={setSheetOpen}
          onSubmit={submitSheet}
          onDelete={
            sheet.mode.kind === 'own'
              ? removeOwn
              : sheet.mode.kind === 'shared'
                ? removeShared
                : undefined
          }
          onRestore={
            sheet.mode.kind === 'built' && sheet.mode.entry.override ? restoreOriginal : undefined
          }
        />
      ) : null}
    </div>
  );
}

/**
 * The cost line of a phase tab, seen and spoken.
 *
 * A day with nothing in it gets no line rather than "0 exercícios · ~0 min". The plan
 * is explicit (§14) that its own figures are examples and not data, so an empty day
 * that printed a duration would be inventing exactly the number that section warns
 * about. The rest day already says what it is, in words, below the rail.
 */
function costOf(summary: BlockSummary): { shown: string | null; spoken: string | null } {
  if (summary.count === 0) return { shown: null, spoken: null };

  const unit = summary.count === 1 ? t.exercise : t.exercises;
  const counted = `${summary.count} ${unit}`;
  if (summary.minutes === null) return { shown: counted, spoken: counted };

  return {
    shown: `${counted} · ~${summary.minutes} ${t.minutes}`,
    spoken: `${counted}, ${t.about} ${summary.minutes} ${t.minutesLong}`,
  };
}

function sheetModeFor(entry: DayEntry): SheetMode {
  if (entry.kind === 'custom') return { kind: 'own', entry };
  if (entry.kind === 'shared') return { kind: 'shared', entry };
  return { kind: 'built', entry };
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
