import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import clsx from 'clsx';

import { BLOCKS, type BlockKey } from '../../content';
import { pt } from '../../i18n/pt';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { Icon, IconButton } from '../../ui/Icon';
import { WriteFailureNotice } from '../../ui/Notice';
import { DaySheet, type DaySheetMode } from './DaySheet';
import { useCustomDayEditing, useDays, type DayInput, type DayRef } from './custom-days';
import { dayPoster, useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, useExerciseLogs } from './logs';

const t = pt.train;
const d = pt.days;

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
 * where one is made. Creating opens the new day straight away rather than returning
 * here with a fresh empty card: a day is created in order to put something in it, and
 * the next tap after "create" is always "add exercise".
 *
 * It is also where one is removed, and that is here rather than only inside the day
 * because of where a person looks. A day added to the week is a thing you notice from
 * the week — eight cards where the programme has seven — and the delete lived one
 * screen further in, behind a pencil, past a scroll. "The week only has seven days"
 * is a sentence said while looking at this list, so the control belongs on this list.
 * It is the same sheet and the same confirmation the day itself opens, not a second
 * way to delete with its own rules.
 */
export function Train() {
  const navigate = useNavigate();
  const [block, setBlock] = useState<BlockKey>('b1');
  const logs = useExerciseLogs();
  const programme = useProgramme(block);
  const week = useDays();
  const editing = useCustomDayEditing();
  /*
   * Mounted after it closes so it can animate out, and remounted under a fresh id
   * each time it is opened, which is what seeds the form without an effect.
   */
  const [sheet, setSheet] = useState<{ mode: DaySheetMode; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  /**
   * Deletes the day the sheet is open on, and stays here.
   *
   * The day view navigates home after this because it is standing on the day it just
   * removed; the week is already where a deleted day leaves you, so the only thing to
   * do is close the sheet and let the card go.
   */
  function removeDay() {
    const mode = sheet?.mode;
    if (mode?.kind !== 'edit') return;
    if (!window.confirm(d.removeConfirm)) return;
    editing.deleteDay(mode.ref.no);
    setSheetOpen(false);
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

        <div
          className="rail -mx-7 mt-5 gap-2.5 px-7 pb-1"
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
                  'min-h-[44px] rounded-full px-5 font-ui text-[13.5px] font-500',
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

        {logs.isError || programme.isError || week.isError ? (
          <p
            role="status"
            className="mt-4 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
          >
            {t.logsError}
          </p>
        ) : null}

        <WriteFailureNotice failure={editing.failure} />

        <ul className="mt-4 flex flex-col gap-2.5">
          {week.days.map((dayRef) => (
            <li key={dayRef.no}>
              <DayCard
                dayRef={dayRef}
                block={block}
                entries={programme.resolve(dayRef.day, dayRef.no).entries}
                logs={logs.byKey}
                pending={logs.isPending || programme.isPending}
                /*
                 * Only a day the user added. The programme's seven ship in the bundle
                 * and nothing in the database can change or remove them, so a pencil
                 * on one would open a form with no destination.
                 */
                onEdit={dayRef.kind === 'own' ? () => openSheet({ kind: 'edit', ref: dayRef }) : undefined}
              />
            </li>
          ))}
        </ul>

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
  onEdit,
}: {
  dayRef: DayRef;
  block: BlockKey;
  /** The day the user actually has: baseline, plus their own, minus what they hid. */
  entries: readonly DayEntry[];
  logs: ReturnType<typeof useExerciseLogs>['byKey'];
  pending: boolean;
  /** Opens the day's own form, delete included. Only a day the user added has one. */
  onEdit?: () => void;
}) {
  /*
   * A rest day is a day with nothing in it, and now that is a thing the user can
   * arrange as well as a thing the programme ships. Reading `type` alone would have
   * put "rest day" on a day someone had just filled with their own exercises.
   */
  const isRest = dayRef.type === 'rest' && entries.length === 0;
  /*
   * A day of your own always opens, rest or not. The programme's rest day has
   * nothing behind it and nothing you could do there; yours has a name to change and
   * a delete, and a card that refused to open would be a day you could create and
   * never get back into.
   */
  const opens = dayRef.kind === 'own' || !isRest;
  /*
   * No borrowed photograph. A day of yours with nothing in it yet shows a neutral
   * tile rather than one of the programme's day pictures, for the same reason an
   * exercise you added never gets given a baseline demonstration.
   */
  const photo = entries[0]?.photo ?? (dayRef.kind === 'built' ? dayPoster(dayRef.no) : null);
  const setCount = entries.reduce((sum, entry) => sum + entry.prescription.s, 0);
  const progress = dayProgress(dayRef.no, block, entries, logs);

  const inner = (
    <article
      className={clsx(
        'relative flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)]',
        isRest && 'opacity-90',
      )}
    >
      <div className="min-w-0 flex-1 py-1 pl-1">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 font-ui text-[12px] font-700 text-accent-ink">
              {t.open}
              <Icon name="forward" size={13} strokeWidth={2.4} />
            </span>
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
    </article>
  );

  /*
   * The pencil is a sibling of the link, not a child of it. Nesting a button inside an
   * anchor is invalid, and the browser resolves it by giving the tap to whichever it
   * feels like — on a card whose other control deletes the day, "whichever it feels
   * like" is not a thing to leave to a browser. Sitting on top of the link instead, it
   * takes its own taps and lets every other pixel of the card open the day.
   */
  return (
    <div className="relative">
      {opens ? (
        <Link
          to={`/treino/${dayRef.no}?bloco=${block}`}
          aria-label={`${dayRef.name}. ${progress.pct}% concluído.`}
          className="block rounded-[20px] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99] motion-reduce:active:scale-100"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}

      {onEdit ? (
        <IconButton
          icon="edit"
          /*
           * The default 44px, not the small one. It sits over a photograph on a card
           * that scrolls under a thumb, and it is the way into a sheet with a delete
           * in it: this is the last control on the screen to make hard to hit
           * accurately. The border is what separates it from a pale photograph.
           */
          label={`${d.edit}: ${dayRef.name}`}
          onClick={onEdit}
          className="absolute right-3 top-3 border border-rule"
        />
      ) : null}
    </div>
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
