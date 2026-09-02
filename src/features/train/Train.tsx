import { useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';

import { BLOCKS, DAYS, type BlockKey, type Day } from '../../content';
import { pt } from '../../i18n/pt';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { Icon } from '../../ui/Icon';
import { dayPoster, useProgramme, type DayEntry } from './day-entries';
import { BLOCK_KEYS, dayProgress, useExerciseLogs } from './logs';

const t = pt.train;

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
 */
export function Train() {
  const [block, setBlock] = useState<BlockKey>('b1');
  const logs = useExerciseLogs();
  const programme = useProgramme(block);

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

        {logs.isError || programme.isError ? (
          <p
            role="status"
            className="mt-4 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
          >
            {t.logsError}
          </p>
        ) : null}

        <ul className="mt-4 flex flex-col gap-2.5">
          {DAYS.map((day) => (
            <li key={day.id}>
              <DayCard
                day={day}
                block={block}
                entries={programme.resolve(day, day.id).entries}
                logs={logs.byKey}
                pending={logs.isPending || programme.isPending}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DayCard({
  day,
  block,
  entries,
  logs,
  pending,
}: {
  day: Day;
  block: BlockKey;
  /** The day the user actually has: baseline, plus their own, minus what they hid. */
  entries: readonly DayEntry[];
  logs: ReturnType<typeof useExerciseLogs>['byKey'];
  pending: boolean;
}) {
  /*
   * A rest day is a day with nothing in it, and now that is a thing the user can
   * arrange as well as a thing the programme ships. Reading `type` alone would have
   * put "rest day" on a day someone had just filled with their own exercises.
   */
  const isRest = day.type === 'rest' && entries.length === 0;
  const photo = entries[0]?.photo ?? dayPoster(day.id);
  const setCount = entries.reduce((sum, entry) => sum + entry.prescription.s, 0);
  const progress = dayProgress(day.id, block, entries, logs);

  const inner = (
    <article
      className={clsx(
        'relative flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)]',
        isRest && 'opacity-90',
      )}
    >
      <div className="min-w-0 flex-1 py-1 pl-1">
        <p className="font-ui text-[11px] font-600 uppercase tracking-[0.04em] text-text-muted">
          {day.wd.pt}
        </p>
        <h2 className="mt-0.5 truncate font-ui text-[18px] font-700 text-text">{day.name.pt}</h2>

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

        {!isRest ? (
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

      <img
        src={photo}
        alt=""
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = dayPoster(day.id);
        }}
        className="h-[108px] w-[108px] shrink-0 rounded-[16px] object-cover"
      />
    </article>
  );

  if (isRest) return inner;

  return (
    <Link
      to={`/treino/${day.id}?bloco=${block}`}
      aria-label={`${day.name.pt}. ${progress.pct}% concluído.`}
      className="block rounded-[20px] transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99] motion-reduce:active:scale-100"
    >
      {inner}
    </Link>
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
