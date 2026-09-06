import { useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Reorder } from 'motion/react';
import clsx from 'clsx';

import { BLOCKS, type BlockKey } from '../../content';
import { pt } from '../../i18n/pt';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { Icon, IconButton } from '../../ui/Icon';
import { WriteFailureNotice } from '../../ui/Notice';
import { PhaseJourney } from './PhaseJourney';
import { DaySheet, type DaySheetMode } from './DaySheet';
import {
  applyDayDrag,
  resolveDays,
  useCustomDayEditing,
  useDayOrder,
  useDayOrderEditing,
  useDays,
  type DayInput,
  type DayRef,
} from './custom-days';
import { ReorderableCard } from './ReorderableCard';
import { ReorderContext, type CardReorder } from './reorder-context';
import { dayPoster, useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, useExerciseLogs } from './logs';

const t = pt.train;
const d = pt.days;

/** Which week is being shown and edited: everybody's, or this account's own. */
type Scope = 'shared' | 'own';
const SCOPE_STORAGE = 'week-order-scope';

/**
 * The week, wired.
 *
 * This is the Programs screen the Showcase demonstrated, but every figure is now the
 * user's own: the block chips choose a periodization block, and each day card reads
 * its real completion out of `exercise_logs` for that block. The rest day is a card
 * that does not open, because there is nothing to open.
 *
 * The block lives in local state and rides into the day view on the link, so a day
 * opened from block 2 opens showing block 2 and a reload of the day keeps it.
 *
 * The week is the programme's seven days and then the user's own, and this screen is
 * where one is made — and, since `004`, where its order is set. The days reorder by
 * press-and-hold and drag, the arrows the interaction requirement bans are gone, and
 * the weekday label follows the position a day is dragged to. The order comes in two
 * scopes: the shared week that is everybody's, and this account's own arrangement.
 *
 * It is also where a day is removed, and that is here rather than only inside the day
 * because of where a person looks. A day added to the week is a thing you notice from
 * the week, and "the week only has seven days" is a sentence said while looking at
 * this list, so the control belongs on this list.
 */
export function Train() {
  const navigate = useNavigate();
  const [block, setBlock] = useState<BlockKey>('b1');
  const logs = useExerciseLogs();
  const programme = useProgramme(block);
  const week = useDays();
  const editing = useCustomDayEditing();
  const dayOrder = useDayOrder();
  const orderEditing = useDayOrderEditing();

  /*
   * Mounted after it closes so it can animate out, and remounted under a fresh id
   * each time it is opened, which is what seeds the form without an effect.
   */
  const [sheet, setSheet] = useState<{ mode: DaySheetMode; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  /*
   * Which week is on screen. A tap is remembered; until then there is no choice, and
   * the scope is derived below — own when the account has one, because the own order
   * wins and opening on the shared week would hide the arrangement the person made.
   * Derived rather than seeded in an effect, so no render cascades to settle it.
   */
  const [chosenScope, setChosenScope] = useState<Scope | null>(() => {
    try {
      const stored = localStorage.getItem(SCOPE_STORAGE);
      if (stored === 'own' || stored === 'shared') return stored;
    } catch {
      /* private mode, blocked storage — the derived default below is correct anyway */
    }
    return null;
  });
  const scope: Scope = chosenScope ?? (dayOrder.hasOwn ? 'own' : 'shared');

  function chooseScope(next: Scope) {
    setChosenScope(next);
    try {
      localStorage.setItem(SCOPE_STORAGE, next);
    } catch {
      /* nothing to persist to; the in-memory choice still holds for this visit */
    }
  }

  /*
   * The order this scope is looking at. Own falls back to shared when there is no own
   * one yet, so switching to "A minha" shows the shared week and the first drag makes
   * it yours rather than starting from an empty arrangement.
   */
  const chosenOrder = scope === 'own' ? (dayOrder.ownOrder ?? dayOrder.sharedOrder) : dayOrder.sharedOrder;

  /* The canonical sequence the server says this scope has, resolved to the real days. */
  const canonicalNos = useMemo(
    () => resolveDays(week.customs ?? [], chosenOrder ?? undefined).map((day) => day.no),
    [week.customs, chosenOrder],
  );
  const sig = canonicalNos.join(',');

  /*
   * The live sequence the list is drawn in. `Reorder` moves it under the finger, so it
   * lives here and only the drop writes it back. A write from the server (this device's
   * own, or the other account's, or a scope change) arrives as a new canonical order;
   * the effect adopts it, but never mid-drag — clobbering the list under a moving finger
   * is the one thing this guard exists to prevent.
   */
  const [liveOrder, setLiveOrder] = useState<number[]>(canonicalNos);
  const liveRef = useRef<number[]>(liveOrder);
  const draggingRef = useRef(false);
  const originRef = useRef<number[]>(liveOrder);
  const fromRef = useRef(0);
  const draggedRef = useRef(0);
  /*
   * Whether the gesture in progress became a drag. A drag leaves a trailing click on
   * the card, and a hold-then-release fires one too, and neither should open the day.
   * Set when a drag starts, cleared at the start of every new pointer interaction, so
   * the next real tap always opens whether or not the browser suppressed the drag's
   * click. A boolean, not a clock: reading the clock in a component is a rule this
   * codebase keeps.
   */
  const didDrag = useRef(false);
  const [announce, setAnnounce] = useState('');
  const hintId = useId();

  useEffect(() => {
    if (draggingRef.current) return;
    const next = sig === '' ? [] : sig.split(',').map(Number);
    setLiveOrder((prev) => (prev.join(',') === sig ? prev : next));
    liveRef.current = next;
  }, [sig]);

  /* The days in the order the list is drawn in, with the weekday label per position. */
  const days = useMemo(
    () => resolveDays(week.customs ?? [], liveOrder),
    [week.customs, liveOrder],
  );

  function persist(next: number[]) {
    if (scope === 'own') orderEditing.saveOwn(next);
    else orderEditing.saveShared(next);
  }

  /** `Reorder` reflows the list; keep the ref in step so the drop reads the latest. */
  function reorder(next: number[]) {
    liveRef.current = next;
    setLiveOrder(next);
  }

  function pickUp(no: number) {
    draggingRef.current = true;
    didDrag.current = true;
    originRef.current = liveRef.current.slice();
    draggedRef.current = no;
    fromRef.current = originRef.current.indexOf(no);
  }

  /** Start of a fresh pointer interaction: not a drag until a pickup says so. */
  function armTap() {
    didDrag.current = false;
  }

  /**
   * One write per drop. The final order is NOT `Reorder`'s reflow — that is direct
   * insertion — but the day-drag rule (`applyDayDrag`), computed from where the drag
   * started and where it was released. The two agree in every case but a single slot
   * down, where the rule's wrap takes over, so the card settles there on release.
   */
  function drop() {
    draggingRef.current = false;
    const to = liveRef.current.indexOf(draggedRef.current);
    const final = applyDayDrag(originRef.current, fromRef.current, to);
    liveRef.current = final;
    setLiveOrder(final);
    /* A drag that ended where it began is not a change, and must not write the week. */
    if (final.join(',') === originRef.current.join(',')) return;
    persist(final);
    speak(draggedRef.current, final);
  }

  /**
   * The keyboard path, for anyone who cannot drag. Arrow Up / Down on the grab handle
   * moves the card one place and writes it — a plain adjacent swap, the predictable
   * keyboard move, and the same one write. It is not the arrows the requirement removed:
   * it is the accessible complement, on the handle, reachable only by focusing it.
   */
  function moveByKey(no: number, direction: 'up' | 'down') {
    const current = liveRef.current;
    const index = current.indexOf(no);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    reorder(next);
    persist(next);
    speak(no, next);
  }

  function speak(no: number, order: number[]) {
    const name = days.find((day) => day.no === no)?.name ?? '';
    const position = order.indexOf(no) + 1;
    setAnnounce(`${name}, ${d.position} ${position} ${d.positionOf} ${order.length}`);
  }

  function openSheet(mode: DaySheetMode) {
    setSheet((current) => ({ mode, id: (current?.id ?? 0) + 1 }));
    setSheetOpen(true);
  }

  /** One handler for both shapes of the sheet: a day being made, and one being changed. */
  function submitSheet(input: DayInput) {
    const mode = sheet?.mode;
    if (!mode) return;
    if (mode.kind === 'new') {
      const dayNo = editing.createDay(input);
      navigate(`/treino/${dayNo}?bloco=${block}`);
      return;
    }
    if (mode.ref.custom) editing.saveDay(mode.ref.custom, input);
  }

  function removeDay() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'edit') return;
    if (!window.confirm(d.removeConfirm)) return;
    editing.deleteDay(mode.ref.no);
    setSheetOpen(false);
  }

  /**
   * Opening a day. Guarded against the click a drag leaves behind: if this gesture
   * became a drag, its trailing click is the tail of the gesture, not a tap, and must
   * not navigate away from the week you were arranging.
   */
  function openDay(no: number) {
    if (didDrag.current) return;
    navigate(`/treino/${no}?bloco=${block}`);
  }

  /*
   * Two ways back, one per scope, and never both at once. On your own week the way
   * back is the shared one; on the shared week the way back is the order the plan
   * ships. The shared reset writes everybody's week, so it asks first — the own reset
   * touches only your row and does not.
   */
  const showResetShared = scope === 'own' && dayOrder.hasOwn;
  const showResetDefault = scope === 'shared' && dayOrder.hasShared;

  function resetToDefault() {
    if (!window.confirm(d.orderResetDefaultConfirm)) return;
    orderEditing.resetToDefault();
  }

  return (
    <div className="relative min-h-full bg-ground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-wash-from from-15% via-wash-from/75 via-45% to-wash-to"
      />

      <div className="relative px-7 pb-10">
        <header className="flex items-center gap-3 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <div className="min-w-0 flex-1">
            <h1 className="font-ui text-[26px] font-700 leading-[1.1] tracking-[-0.02em] text-text">
              {t.title}
            </h1>
            <p className="mt-1 font-ui text-[13.5px] text-text-muted">{t.subtitle}</p>
          </div>
          <ThemeToggle />
        </header>

        {/*
          * The week's rail names the phase, not its number. These four names wrap rather
          * than scroll, so every phase is one tap away and nothing hides.
          */}
        <div className="mt-5 flex flex-wrap gap-2.5" role="tablist" aria-label={t.blocksLabel}>
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
                  'min-h-[44px] rounded-full px-5 font-ui text-[13.5px] font-500',
                  'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                  'active:scale-[0.97] motion-reduce:active:scale-100',
                  selected
                    ? 'bg-chip-selected font-600 text-chip-selected-ink'
                    : 'bg-chip text-chip-ink',
                )}
              >
                {t.phase[b.k as BlockKey]}
              </button>
            );
          })}
        </div>

        <PhaseJourney block={block} />

        {logs.isError || programme.isError || week.isError ? (
          <p
            role="status"
            className="mt-4 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
          >
            {t.logsError}
          </p>
        ) : null}

        <WriteFailureNotice failure={editing.failure} />
        <WriteFailureNotice failure={orderEditing.failure} />

        {/*
          * Whose week this is, and the way back. Not a switch hidden in settings: the
          * order of the week is a thing people share, so which one you are looking at,
          * and how to return to everyone's, belong on the week itself. Quiet, two taps,
          * out of the way of the day cards it governs.
          */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div
            role="radiogroup"
            aria-label={d.orderLabel}
            className="inline-flex rounded-full bg-surface-sunken p-1"
          >
            {(['shared', 'own'] as const).map((s) => {
              const active = scope === s;
              return (
                <button
                  key={s}
                  role="radio"
                  type="button"
                  aria-checked={active}
                  onClick={() => chooseScope(s)}
                  className={clsx(
                    'min-h-[44px] rounded-full px-4 font-ui text-[12.5px] font-600',
                    'transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                    active ? 'bg-surface text-text shadow-[var(--shadow-card)]' : 'text-text-muted',
                  )}
                >
                  {s === 'shared' ? d.orderShared : d.orderOwn}
                </button>
              );
            })}
          </div>

          {showResetShared ? (
            <button
              type="button"
              onClick={() => orderEditing.resetToShared()}
              className={clsx(
                'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3',
                'font-ui text-[12.5px] font-600 text-accent-line',
                'transition-colors duration-[160ms] pointer-hover:text-text',
              )}
            >
              <Icon name="users" size={15} strokeWidth={2.2} />
              {d.orderReset}
            </button>
          ) : showResetDefault ? (
            <button
              type="button"
              onClick={resetToDefault}
              className={clsx(
                'inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3',
                'font-ui text-[12.5px] font-600 text-accent-line',
                'transition-colors duration-[160ms] pointer-hover:text-text',
              )}
            >
              <Icon name="back" size={15} strokeWidth={2.2} />
              {d.orderResetDefault}
            </button>
          ) : null}
        </div>

        <p className="mt-2 font-ui text-[12px] leading-snug text-text-muted">
          {scope === 'own' ? d.orderOwnActive : d.orderSharedActive}
        </p>

        <Reorder.Group
          as="ul"
          axis="y"
          values={liveOrder}
          onReorder={reorder}
          className="mt-4 flex flex-col gap-2.5"
        >
          {days.map((dayRef, index) => (
            <ReorderableCard
              key={dayRef.no}
              value={dayRef.no}
              position={index + 1}
              total={days.length}
              hintId={hintId}
              onPickup={() => pickUp(dayRef.no)}
              onDrop={drop}
              onKeyMove={(direction) => moveByKey(dayRef.no, direction)}
            >
              <DayCard
                dayRef={dayRef}
                block={block}
                entries={programme.resolve(dayRef.day, dayRef.no).entries}
                logs={logs.byKey}
                pending={logs.isPending || programme.isPending}
                onOpen={() => openDay(dayRef.no)}
                onArm={armTap}
                /*
                 * Only a day the user added. The programme's seven ship in the bundle
                 * and nothing in the database can change or remove them, so a pencil on
                 * one would open a form with no destination.
                 */
                onEdit={
                  dayRef.kind === 'own' ? () => openSheet({ kind: 'edit', ref: dayRef }) : undefined
                }
              />
            </ReorderableCard>
          ))}
        </Reorder.Group>

        <button
          type="button"
          onClick={() => openSheet({ kind: 'new' })}
          className={clsx(
            'mt-3 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full',
            'border border-dashed border-edge/60 bg-transparent',
            'font-ui text-[14px] font-700 text-text',
            'transition-[border-color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
            'active:scale-[0.98] motion-reduce:active:scale-100 pointer-hover:border-edge',
          )}
        >
          <Icon name="plus" size={18} strokeWidth={2.2} />
          {d.create}
        </button>

        {/* The reorder hint the grab handles point at, and the live region a keyboard move speaks. */}
        <p id={hintId} className="sr-only">
          {d.reorderHint}
        </p>
        <p role="status" aria-live="polite" className="sr-only">
          {announce}
        </p>
      </div>

      {sheet ? (
        <DaySheet
          key={sheet.id}
          open={sheetOpen}
          mode={sheet.mode}
          onOpenChange={setSheetOpen}
          onSubmit={submitSheet}
          onDelete={sheet.mode.kind === 'edit' ? removeDay : undefined}
        />
      ) : null}
    </div>
  );
}

function DayCard({
  dayRef,
  block,
  entries,
  logs,
  pending,
  onOpen,
  onArm,
  onEdit,
}: {
  dayRef: DayRef;
  block: BlockKey;
  /** The day the user actually has: baseline, plus their own, minus what they hid. */
  entries: readonly DayEntry[];
  logs: ReturnType<typeof useExerciseLogs>['byKey'];
  pending: boolean;
  /** Navigates into the day, guarded against the click a drag leaves behind. */
  onOpen: () => void;
  /** Marks the start of a fresh pointer interaction, before a hold decides it is a drag. */
  onArm: () => void;
  /** Opens the day's own form, delete included. Only a day the user added has one. */
  onEdit?: () => void;
}) {
  const reorder = useContext(ReorderContext);

  /*
   * A rest day is a day with nothing in it, and now that is a thing the user can arrange
   * as well as a thing the programme ships. Reading `type` alone would have put "rest
   * day" on a day someone had just filled with their own exercises.
   */
  const isRest = dayRef.type === 'rest' && entries.length === 0;
  /*
   * A day of your own always opens, rest or not. The programme's rest day has nothing
   * behind it and nothing you could do there; yours has a name to change and a delete.
   */
  const opens = dayRef.kind === 'own' || !isRest;
  const photo = entries[0]?.photo ?? (dayRef.kind === 'built' ? dayPoster(dayRef.no) : null);
  const setCount = entries.reduce((sum, entry) => sum + entry.prescription.s, 0);
  const progress = dayProgress(dayRef.no, block, entries, logs);

  return (
    <article
      {...reorder?.rootProps}
      /*
       * Capture, so it runs before `rootProps` starts the hold timer and does not
       * override its `onPointerDown`. It only says "a new gesture has begun"; whether it
       * becomes a drag is decided later, by the hold timer or the grab handle.
       */
      onPointerDownCapture={onArm}
      style={reorder?.lifted ? { touchAction: 'none' } : undefined}
      /*
       * The whole card taps to open — a big target for a hand mid-set — but a tap that
       * lands on the "Abrir" link or the pencil is theirs, and a release at the end of a
       * drag is not a tap at all: `onOpen` drops the drag's tail, and this returns early
       * for the controls so they never navigate twice.
       */
      onClick={(event) => {
        if (!opens) return;
        if ((event.target as HTMLElement).closest('a, button')) return;
        onOpen();
      }}
      className={clsx(
        'relative flex items-center gap-3 rounded-[20px] bg-surface p-3',
        'transition-[box-shadow,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        reorder?.lifted
          ? 'z-10 scale-[1.02] shadow-[var(--shadow-float)] motion-reduce:scale-100'
          : 'shadow-[var(--shadow-card)]',
        isRest && !reorder?.lifted && 'opacity-90',
      )}
    >
      {reorder ? <ReorderHandle name={dayRef.name} reorder={reorder} /> : null}

      <div className="min-w-0 flex-1 py-1">
        <p className="font-ui text-[11px] font-600 uppercase tracking-[0.04em] text-text-muted">
          {dayRef.label}
        </p>
        <h2 className="mt-0.5 truncate font-ui text-[18px] font-700 text-text">{dayRef.name}</h2>

        {isRest ? (
          <p className="mt-1.5 font-ui text-[12px] text-text-muted">{t.restDay}</p>
        ) : (
          <p className="mt-1.5 flex items-center gap-1.5 font-ui text-[12px] text-text-muted">
            <Icon name="dumbbell" size={13} strokeWidth={1.8} />
            {entries.length} {entries.length === 1 ? t.exercise : t.exercises}
            <span aria-hidden="true">·</span>
            {setCount} {setCount === 1 ? t.serie : t.series}
          </p>
        )}

        {opens ? (
          <div className="mt-3 flex items-center gap-3">
            {/*
             * The real navigation control: a link, so the keyboard, the screen reader
             * and a right-click all treat opening the day as what it is. The card's own
             * tap handler covers the rest of the surface.
             */}
            <Link
              to={`/treino/${dayRef.no}?bloco=${block}`}
              aria-label={`${dayRef.name}. ${progress.pct}% concluído.`}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-ui text-[12px] font-700 text-accent-ink transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:active:scale-100"
            >
              {t.open}
              <Icon name="forward" size={13} strokeWidth={2.4} />
            </Link>
            {pending ? (
              <span
                className="h-[38px] w-[38px] shrink-0 animate-pulse rounded-full bg-surface-sunken motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Ring value={progress.pct} />
            )}
          </div>
        ) : null}
      </div>

      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          onError={(e) => {
            const fallback = dayRef.kind === 'built' ? dayPoster(dayRef.no) : null;
            if (!fallback || e.currentTarget.src.endsWith(fallback)) return;
            e.currentTarget.src = fallback;
          }}
          className="h-[108px] w-[108px] shrink-0 rounded-[16px] object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid h-[108px] w-[108px] shrink-0 place-items-center rounded-[16px] bg-surface-sunken text-text-muted"
        >
          <Icon name="dumbbell" size={30} strokeWidth={1.5} />
        </span>
      )}

      {onEdit ? (
        <IconButton
          icon="edit"
          /*
           * The default 44px, not the small one. It sits over a photograph on a card
           * that scrolls under a thumb, and it is the way into a sheet with a delete in
           * it: this is the last control on the screen to make hard to hit accurately.
           */
          label={`${d.edit}: ${dayRef.name}`}
          onClick={onEdit}
          className="absolute right-3 top-3 border border-rule"
        />
      ) : null}
    </article>
  );
}

/**
 * The grab handle, at the head of the day card.
 *
 * The same control the exercises got: an immediate, precise pickup on pointer
 * (`touch-none`, so a drag off it never scrolls), and the keyboard path — focus it,
 * Arrow Up / Down moves the day one place, announced by the week's live region. One
 * quiet grip, not two arrows: the ban on chevrons is not undone by the alternative
 * that replaces them.
 */
function ReorderHandle({ name, reorder }: { name: string; reorder: CardReorder }) {
  return (
    <button
      type="button"
      aria-label={`${d.reorder}: ${name}, ${d.position} ${reorder.position} ${d.positionOf} ${reorder.total}`}
      aria-describedby={reorder.hintId}
      onPointerDown={reorder.handleProps.onPointerDown}
      onKeyDown={reorder.handleProps.onKeyDown}
      className={clsx(
        '-ml-0.5 grid h-11 w-8 shrink-0 touch-none select-none place-items-center rounded-field',
        'transition-colors duration-[160ms] pointer-hover:text-text',
        reorder.lifted ? 'cursor-grabbing text-text' : 'cursor-grab text-text-muted',
      )}
    >
      <Icon name="grip" size={18} strokeWidth={2.2} />
    </button>
  );
}

/** The reference's progress ring, wired to a real completion figure. */
function Ring({ value }: { value: number }) {
  const size = 38;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t.progressLabel}
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-accent-soft" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="text-accent-line transition-[stroke-dasharray] duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        />
      </svg>
      <span className="tabular absolute font-ui text-[10px] font-700 leading-none text-text">
        {value}%
      </span>
    </div>
  );
}

// Keep the block-key order asserted against the content types.
void (BLOCK_KEYS satisfies readonly BlockKey[]);
