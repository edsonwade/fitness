import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Reorder } from 'motion/react';
import clsx from 'clsx';

import { BLOCKS, CARDIO, type BlockKey } from '../../content';
import {
  firstFailure,
  useRecordSession,
  useReopenSession,
} from '../../data/mutations';
import { useLocale, type LocaleState } from '../../i18n/locale-context';
import { Screen, SessionSplash } from '../../ui/Screen';
import { Icon } from '../../ui/Icon';
import { WriteFailureNotice } from '../../ui/Notice';
import { Sheet } from '../../ui/Sheet';
import { useSuggestions } from './suggestion';
import { DaySheet } from './DaySheet';
import { ExerciseCard } from './ExerciseCard';
import { ReorderableCard } from './ReorderableCard';
import { ExerciseSheet, type SheetMode } from './ExerciseSheet';
import { blockSummary, type BlockSummary } from './block-summary';
import { useCustomDayEditing, useDays, type DayInput } from './custom-days';
import { dayPoster, useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, logId, useExerciseLogs } from './logs';
import {
  localDate,
  sessionFor,
  useSessions,
  workoutState,
} from './sessions';
import { useDayEditing, type ExerciseInput } from './use-day-editing';
import { ThemeToggle } from '../../ui/ThemeToggle';


function isBlockKey(value: string | null): value is BlockKey {
  return value !== null && (BLOCK_KEYS as readonly string[]).includes(value);
}

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
  const { locale, t: copy } = useLocale();
  const t = copy.train;
  const e = copy.editor;
  const d = copy.days;
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const record = useRecordSession();
  const reopen = useReopenSession();
  const logs = useExerciseLogs();
  const sessions = useSessions();
  /*
   * Today, read once when the screen mounts rather than on every render. The clock is
   * not render state — reading it during a render makes the same render produce two
   * different screens either side of midnight — and this is the same initialiser form
   * `orderKeys` below and `openSheet` already use.
   */
  const [today] = useState(() => localDate(new Date()));
  const [phasesOpen, setPhasesOpen] = useState(false);
  const suggestions = useSuggestions();
  /*
   * The sheet stays mounted after it closes so it can animate out, and is remounted
   * under a fresh `id` every time one is opened. That is what seeds the form with the
   * right exercise without an effect writing state after render.
   */
  const [sheet, setSheet] = useState<{ mode: SheetMode; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [daySheet, setDaySheet] = useState<number | null>(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);

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
  /*
   * The workout level, which is not the sets level. It comes from the recorded session
   * and only from there: a day with every set ticked is still a workout under way until
   * the user finishes it. See `workoutState`.
   */
  const workout = workoutState(sessionFor(sessions.data ?? [], dayId, today));

  /*
   * The order the list is drawn in. It mirrors the resolved day, but `Reorder` needs to
   * move it live under the finger, so the live sequence lives here and only the drop
   * writes it back. `orderRef` holds the same value synchronously, so the commit on
   * release reads the sequence the last reflow produced and not a render behind it.
   *
   * A write from the server (this device's own, or the other account's) arrives as a
   * new resolved order; the effect adopts it, but never mid-drag — clobbering the list
   * under a moving finger is the one thing this guard exists to prevent. Keys never
   * contain a newline, so it is a safe separator for the cheap equality check.
   */
  const [orderKeys, setOrderKeys] = useState<string[]>(() => entries.map((e2) => e2.key));
  const orderRef = useRef(orderKeys);
  const draggingRef = useRef(false);
  const [announce, setAnnounce] = useState('');
  const hintId = useId();

  const serverSig = entries.map((e2) => e2.key).join('\n');
  useEffect(() => {
    if (draggingRef.current) return;
    const next = serverSig === '' ? [] : serverSig.split('\n');
    setOrderKeys((prev) => (prev.join('\n') === serverSig ? prev : next));
    orderRef.current = next;
  }, [serverSig]);

  /*
   * A day of the user's own does not ship in the bundle, so opening one cold means
   * waiting for a row. Telling someone their own training day does not exist, every
   * time they open it from a link, is the failure this guard exists to prevent.
   */
  if (!dayRef && week.isPending) {
    return <SessionSplash label={copy.common.loading} />;
  }

  if (!dayRef) {
    return (
      <Screen title={t.dayNotFoundTitle} body={t.dayNotFoundBody}>
        <Link
          to="/treino"
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

  /**
   * "Reabrir treino": walking the end back so a finished workout is editable again.
   *
   * Terminar is reversible, but only here — his rule (2026-09-06). Correcting a set does
   * not reopen a finished workout; this button does, by clearing `finished_at` on the
   * session. The session and its numbers stay in history; the day just returns to "in
   * curso" and the TERMINAR button comes back. It is also the only way out of a workout
   * finished by mistake.
   */
  function reopenWorkout() {
    reopen.reopen({ day_no: dayId, local_date: today });
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

  /** `Reorder` reflows the list; keep the ref in step so the drop reads the latest. */
  function reorder(next: string[]) {
    orderRef.current = next;
    setOrderKeys(next);
  }

  function pickUp() {
    draggingRef.current = true;
  }

  /** One write per drop: the sequence the drag settled on, straight to `exercise_order`. */
  function drop() {
    draggingRef.current = false;
    editing.saveOrder(orderRef.current);
  }

  /**
   * The keyboard path, for anyone who cannot drag. Arrow Up / Down on the grab handle
   * moves the card one place and writes it, and the live region speaks the new position.
   * It is the same one write, and the same handle — not the chevrons that were removed.
   */
  function moveByKey(key: string, direction: 'up' | 'down') {
    const current = orderRef.current;
    const index = current.indexOf(key);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next);
    editing.saveOrder(next);
    const name = entries.find((entry) => entry.key === key)?.name ?? '';
    setAnnounce(`${name}, ${e.position} ${target + 1} ${e.positionOf} ${next.length}`);
  }

  /*
   * The entries in the order the user set. Anything the resolved day has that the saved
   * order does not yet (an exercise added a beat ago, before the sync effect adopts it)
   * is drawn at the end, so a fresh card is never dropped from the list for one frame.
   */
  const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));
  const ordered = orderKeys
    .map((key) => entryByKey.get(key))
    .filter((entry): entry is DayEntry => entry !== undefined);
  for (const entry of entries) {
    if (!orderKeys.includes(entry.key)) ordered.push(entry);
  }
  const renderKeys = ordered.map((entry) => entry.key);

  /*
   * Whether this day has a saved order at all. Only then is there anything to reset:
   * with no row, the list is already the programme's own sequence. The order is one
   * shared row per day, so resetting it writes a day every account reads — the button
   * asks first.
   */
  const hasOrder = (programme.order ?? []).some((row) => row.day_no === dayId);

  function resetOrder() {
    if (!window.confirm(e.resetOrderDefaultConfirm)) return;
    editing.resetOrder();
  }

  /*
   * One phase card. Pulled out of the map so the three training levels and the deload
   * can be laid out in separate rows — a grid that wraps and a line of its own for the
   * descarga — off the same markup, rather than a scroll rail that hid Iniciante and
   * clipped Recuperação on a phone. Every card is resolved in its own block, so the
   * cost line is that phase's, not the selected one's.
   */
  function renderPhaseTab(b: (typeof BLOCKS)[number]) {
    const key = b.k as BlockKey;
    const selected = key === block;
    const summary = blockSummary(programme.resolveIn(key, day.day ?? null, dayId).entries);
    const cost = costOf(summary, t);
    return (
      <button
        key={b.k}
        role="tab"
        type="button"
        aria-selected={selected}
        /*
         * Spoken as a sentence, because the visible lines are built out of separators
         * and a tilde: "~27 min" read aloud is the word tilde.
         */
        aria-label={[t.phase[key], b.s[locale], cost.spoken].filter(Boolean).join(', ')}
        onClick={() => setBlock(key)}
        className={clsx(
          'h-full rounded-card px-4 py-3 text-left font-ui',
          'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          'active:scale-[0.97] motion-reduce:active:scale-100',
          selected ? 'bg-chip-selected text-chip-selected-ink' : 'bg-chip text-chip-ink',
        )}
      >
        {/*
          * Hidden from the reader, who gets the label above, and the three lines carry
          * no colour of their own: the muted token is mixed for the page, not for a
          * chip, and on the orange selected fill it lands at 2.9:1. The steps here are
          * size and weight.
          */}
        <span aria-hidden="true" className="block text-[15px] font-700 leading-[1.2]">
          {t.phase[key]}
        </span>
        <span aria-hidden="true" className="mt-0.5 block text-[11.5px] font-500 leading-[1.3]">
          {b.s[locale]}
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
  }

  const trainingPhases = BLOCKS.filter((b) => b.k !== 'dl');
  const deloadPhase = BLOCKS.find((b) => b.k === 'dl');

  const heroPhoto = day.kind === 'built' ? dayPoster(dayId) : (entries[0]?.photo ?? null);
  const setTotal = progress.total;

  /*
   * `proto/v2/03-treino.html` frame 2, de cima para baixo: a foto do dia com o voltar e o
   * nome em display; os chips da fase e do custo; a lista; "Adicionar exercício" como
   * secundário no fundo; e a `.session-bar` colada em baixo com o total e o Começar treino.
   */
  return (
    <div className="min-h-[100dvh] bg-page py-0 sm:py-8">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[26.5rem] overflow-hidden bg-ground sm:min-h-0 sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        <div className="relative h-[190px]">
          {heroPhoto ? (
            <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--ui-ground), rgb(0 0 0 / 0.2) 65%)' }}
          />
          <button
            type="button"
            className="btn btn-icon on-media absolute left-5 top-[max(1rem,env(safe-area-inset-top))]"
            aria-label={copy.common.back}
            onClick={goBack}
          >
            <Icon name="back" size={20} strokeWidth={2} />
          </button>
          <div className="absolute right-5 top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2">
            {isOwnDay ? (
              <button type="button" className="btn btn-icon on-media" aria-label={d.edit} onClick={openDaySheet}>
                <Icon name="edit" size={18} strokeWidth={2} />
              </button>
            ) : null}
            <ThemeToggle onMedia />
          </div>
          <div className="absolute inset-x-5 bottom-4">
            <p className="label">{day.day?.eyebrow[locale] ?? day.label}</p>
            <h1 className="display display-2 mt-0.5">{day.name}</h1>
          </div>
        </div>

        <div className="relative px-5 pb-40 pt-4">
          <div className="row flex-wrap" style={{ gap: 'var(--sp-2)' }}>
            <button
              type="button"
              className="chip chip-sm chip-selected"
              aria-haspopup="dialog"
              onClick={() => setPhasesOpen(true)}
            >
              {BLOCKS.find((b) => b.k === block)?.t[locale]} · {BLOCKS.find((b) => b.k === block)?.s[locale].split('·')[0].trim()}
            </button>
            {!isRestDay ? (
              <>
                <span className="chip chip-sm tabular">
                  {entries.length} {entries.length === 1 ? t.exercise : t.exercises}
                </span>
                <span className="chip chip-sm tabular">
                  {setTotal} {setTotal === 1 ? t.serie : t.series}
                </span>
              </>
            ) : null}
          </div>

          <Sheet open={phasesOpen} onOpenChange={setPhasesOpen} title={t.blocksLabel}>
            <div role="tablist" aria-label={t.blocksLabel}>
              <div className="grid grid-cols-2 gap-2.5">{trainingPhases.map(renderPhaseTab)}</div>
              {deloadPhase ? (
                <div className="mt-2.5 grid grid-cols-2 gap-2.5 border-t border-rule pt-2.5">
                  {renderPhaseTab(deloadPhase)}
                </div>
              ) : null}
            </div>
          </Sheet>

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
          {/*
            * The session write, reported on its own line and in its own words. It is
            * not the same failure as the set not saving: the set did save, on the card,
            * and only the history did not — so one sentence for both would be wrong
            * about the half the user is looking at.
            */}
          <WriteFailureNotice
            failure={firstFailure([
              [record, t.failRecordSession],
              [reopen, t.failReopenSession],
            ])}
          />

          {isRestDay ? (
            <div className="mt-6 rounded-card border border-rule bg-surface p-6 text-center">
              <p className="font-ui text-[15px] font-700 text-text">{t.restDay}</p>
              <p className="mt-1.5 font-ui text-[13px] leading-snug text-text-muted">
                {t.restDayBody}
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="empty mt-6">
              <p className="title-2">{e.emptyTitle}</p>
              <p>{e.emptyBody}</p>
              <button type="button" className="btn btn-primary mt-5" onClick={() => openSheet({ kind: 'new' })}>
                {e.add}
              </button>
              <Link to="/catalogo" className="btn btn-ghost mt-2">
                {copy.journey.catalog}
              </Link>
            </div>
          ) : (
            <Reorder.Group
              as="ul"
              axis="y"
              values={renderKeys}
              onReorder={reorder}
              className="mt-5 flex flex-col gap-4"
            >
              {ordered.map((entry, index) => (
                <ReorderableCard
                  key={entry.key}
                  value={entry.key}
                  position={index + 1}
                  total={ordered.length}
                  hintId={hintId}
                  onPickup={pickUp}
                  onDrop={drop}
                  onKeyMove={(direction) => moveByKey(entry.key, direction)}
                >
                  <ExerciseCard
                    entry={entry}
                    log={logs.byKey.get(logId(dayId, block, entry.logKey ?? entry.key))}
                    suggestion={suggestions.get(entry.key) ?? null}
                    runHref={`/treino/${dayId}/executar?bloco=${block}`}
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
                    }}
                  />
                </ReorderableCard>
              ))}
            </Reorder.Group>
          )}

          {/*
            * The way back to the day's own order. It shows only when a saved order
            * exists and there is more than one card to arrange — otherwise there is
            * nothing to undo. Quiet, off to the side of the list it governs, the twin
            * of the week's "Repor por defeito": direct manipulation is the loud path,
            * and the return to factory is the small one under it.
            */}
          {!isRestDay && hasOrder && ordered.length > 1 ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={resetOrder}
                className={clsx(
                  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3',
                  'font-ui text-[12.5px] font-600 text-accent-line',
                  'transition-colors duration-[160ms] pointer-hover:text-text',
                )}
              >
                <Icon name="back" size={15} strokeWidth={2.2} />
                {e.resetOrderDefault}
              </button>
            </div>
          ) : null}

          {/*
            * The keyboard alternative to dragging, spoken not shown. The instructions
            * sit behind one id every grab handle points at; the live region says where a
            * card landed after an Arrow Up / Down, since the reflow itself is silent.
            */}
          <p id={hintId} className="sr-only">
            {e.reorderHint}
          </p>
          <p role="status" aria-live="polite" className="sr-only">
            {announce}
          </p>

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

          {entries.length > 0 ? (
            <div className="stack-sm" style={{ paddingBlock: 'var(--sp-6)' }}>
              <button type="button" className="btn btn-secondary btn-block" onClick={() => openSheet({ kind: 'new' })}>
                {e.add}
              </button>
            </div>
          ) : null}

          {day.day?.cardio?.length ? <CardioSection keys={day.day.cardio} /> : null}
        </div>

        {!isRestDay && setTotal > 0 ? (
          <div className="session-bar fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[26.5rem]">
            <div>
              <p className="tot-label tabular">
                {progress.done} {t.of} {setTotal} {t.series}
              </p>
              <p className="body-2 muted">
                {workout === 'done' ? t.workoutDone : progress.done > 0 ? t.workoutOpen : t.notStarted}
              </p>
            </div>
            {workout === 'done' ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={reopenWorkout}
                disabled={reopen.isPending}
              >
                {reopen.isPending ? t.reopening : t.reopen}
              </button>
            ) : (
              <Link to={`/treino/${dayId}/executar?bloco=${block}`} className="btn btn-primary">
                {copy.today.start}
              </Link>
            )}
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
function costOf(
  summary: BlockSummary,
  /*
   * A plain function, so it takes the words instead of reaching for them. A hook
   * cannot be called outside a component, and a module-level `pt.train` would pin
   * this line to Portuguese whatever language the screen is in.
   */
  t: LocaleState['t']['train'],
): { shown: string | null; spoken: string | null } {
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

/** The cardio prescriptions a day names, shown as read-only guidance. */
function CardioSection({ keys }: { keys: readonly string[] }) {
  const { locale } = useLocale();
  const entries = keys.map((k) => CARDIO[k]).filter(Boolean);
  if (!entries.length) return null;

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 font-ui text-[15px] font-700 text-text">Cardio</h2>
      <ul className="flex flex-col gap-3">
        {entries.map((entry, i) => (
          <li key={i} className="rounded-card border border-rule bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-ui text-[15px] font-700 text-text">{entry.n[locale]}</h3>
              <span className="tabular shrink-0 font-ui text-[12.5px] font-600 text-accent-line">
                {entry.dur}
              </span>
            </div>
            <p className="mt-1.5 font-ui text-[12.5px] leading-snug text-text-muted">{entry.obj[locale]}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {entry.tips[locale].map((tip, j) => (
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
