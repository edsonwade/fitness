import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import type { Exercise } from '../../content';
import type { ExerciseLog } from '../../data/entities';
import type { LogFields } from '../../data/mutations';
import { pt } from '../../i18n/pt';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { VideoFacade } from './VideoFacade';
import type { DayEntry } from './day-entries';
import { parseRestSeconds, setsDoneFor } from './logs';

const t = pt.train;
const e = pt.editor;

/**
 * One exercise, and the only place a set is actually logged.
 *
 * The card is given a resolved `DayEntry`, never the raw programme item. By the time
 * it renders, the baseline, the user's changes and the user's own exercises have
 * already been merged into one shape, so this file has no idea whether it is drawing
 * something that shipped in the bundle or something typed in this morning, and cannot
 * grow a second code path for one of them.
 *
 * The set chips write straight through `merge_exercise_log`: a tap is optimistic, so
 * the chip fills before the round trip, which is the whole reason the write path is a
 * field-by-field merge and not a table refetch. Weight, reps and the note commit on
 * blur rather than on every keystroke, because the value that matters is the one the
 * user finished typing, not each character on the way there.
 *
 * The inputs stay free text on purpose: `60`, `12,5` and `10/hand` are all real loads
 * real people type, and this product decided long ago not to coerce them to numbers.
 */
export function ExerciseCard({
  entry,
  log,
  onSave,
  onRest,
  controls,
}: {
  entry: DayEntry;
  log: ExerciseLog | undefined;
  onSave: (exKey: string, fields: LogFields) => void;
  onRest: (seconds: number, name: string) => void;
  /** Absent while the day is still loading, or when there is nothing to compose. */
  controls?: {
    onEdit: () => void;
    onHide?: () => void;
    onMove: (direction: 'up' | 'down') => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const p = entry.prescription;
  const done = setsDoneFor(log, p.s);

  function toggleSet(index: number) {
    const next = done.slice();
    next[index] = !next[index];
    onSave(entry.key, { sets_done: next });
    if (next[index]) onRest(parseRestSeconds(p.rest), entry.name);
  }

  return (
    <article className="overflow-hidden rounded-card border border-rule bg-surface shadow-[var(--shadow-card)]">
      <div className="p-3">
        <VideoFacade
          videoId={entry.videoId}
          poster={entry.photo}
          fallbackPoster={entry.fallbackPhoto}
          name={entry.name}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-ui text-[17px] font-700 leading-tight text-text">{entry.name}</h2>
            {entry.equipment ? (
              <p className="mt-0.5 font-ui text-[12.5px] text-text-muted">{entry.equipment}</p>
            ) : null}
          </div>
          {entry.kind === 'custom' ? <Badge>{e.badgeOwn}</Badge> : null}
          {entry.override ? <Badge>{e.badgeChanged}</Badge> : null}
        </div>

        {entry.note ? (
          <p className="mt-2 rounded-field bg-surface-sunken px-3 py-2 font-ui text-[12.5px] leading-snug text-text-muted">
            {entry.note.pt}
          </p>
        ) : null}

        {/* Prescription: this block's target, after anything the user changed. */}
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-ui text-[12.5px]">
          <Stat label={t.target} value={`${p.s} × ${p.r}`} />
          <Stat label={t.rpe} value={p.rpe} />
          <Stat label={t.weight} value={p.l} />
          <Stat label={t.rest} value={p.rest} />
        </dl>

        {/* Set tracker. */}
        <div className="mt-4">
          <p className="mb-2 font-ui text-[12px] font-600 text-text-muted">{t.sets}</p>
          <div className="flex flex-wrap gap-2">
            {done.map((isDone, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleSet(index)}
                aria-pressed={isDone}
                aria-label={`${t.setLabel} ${index + 1}`}
                className={clsx(
                  'grid h-11 w-11 place-items-center rounded-field font-ui text-[14px] font-700 tabular',
                  'transition-[background-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                  'active:scale-[0.94] motion-reduce:active:scale-100',
                  isDone
                    ? 'bg-accent text-accent-ink'
                    : 'border border-rule bg-surface-raised text-text pointer-hover:border-edge',
                )}
              >
                {isDone ? <Icon name="check" size={18} strokeWidth={2.6} /> : index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* What was actually done. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <LogInput
            label={t.weight}
            placeholder={t.weightPlaceholder}
            inputMode="text"
            remote={log?.weight ?? ''}
            onCommit={(v) => onSave(entry.key, { weight: v })}
          />
          <LogInput
            label={t.reps}
            placeholder={t.repsPlaceholder}
            inputMode="text"
            remote={log?.reps ?? ''}
            onCommit={(v) => onSave(entry.key, { reps: v })}
          />
        </div>
        <div className="mt-3">
          <LogInput
            label={t.note}
            placeholder={t.notePlaceholder}
            inputMode="text"
            remote={log?.note ?? ''}
            onCommit={(v) => onSave(entry.key, { note: v })}
          />
        </div>

        {/* Technique, folded away until asked for. Baseline exercises only: nothing
            else in the app has authored execution steps, and inventing them would be
            the one thing PRODUCT.md says this content never does. */}
        {entry.exercise ? (
          <>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-4 flex min-h-[44px] w-full items-center justify-between rounded-field border border-rule px-4 font-ui text-[13px] font-600 text-text transition-colors duration-[160ms] pointer-hover:border-edge"
            >
              {open ? t.hideDetails : t.details}
              <Icon
                name="forward"
                size={16}
                strokeWidth={2}
                className={clsx('transition-transform duration-[200ms]', open ? 'rotate-90' : 'rotate-0')}
              />
            </button>

            {open ? <Technique exercise={entry.exercise} /> : null}
          </>
        ) : null}

        {controls ? <Controls name={entry.name} controls={controls} /> : null}
      </div>
    </article>
  );
}

/**
 * Composing controls, at the foot of the card rather than the head.
 *
 * The head of a card is where a thumb lands while scrolling a day mid-session, and
 * "remove from day" is not a thing to put under an accidental tap. Ordering, editing
 * and removing all live below the logging controls, past everything used during a set.
 */
function Controls({
  name,
  controls,
}: {
  name: string;
  controls: NonNullable<Parameters<typeof ExerciseCard>[0]['controls']>;
}) {
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-rule pt-3">
      <SmallButton
        icon="up"
        label={`${e.moveUp}: ${name}`}
        onClick={() => controls.onMove('up')}
        disabled={!controls.canMoveUp}
      />
      <SmallButton
        icon="down"
        label={`${e.moveDown}: ${name}`}
        onClick={() => controls.onMove('down')}
        disabled={!controls.canMoveDown}
      />
      <span className="flex-1" />
      <SmallButton icon="edit" label={`${pt.common.edit}: ${name}`} onClick={controls.onEdit} />
      {controls.onHide ? (
        <SmallButton icon="x" label={`${e.hide}: ${name}`} onClick={controls.onHide} />
      ) : null}
    </div>
  );
}

function SmallButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: 'up' | 'down' | 'edit' | 'x';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        'grid h-11 w-11 place-items-center rounded-full border border-rule text-text',
        'transition-[border-color,opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        disabled
          ? 'cursor-not-allowed opacity-35'
          : 'active:scale-[0.94] motion-reduce:active:scale-100 pointer-hover:border-edge',
      )}
    >
      <Icon name={icon} size={17} strokeWidth={2} />
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 font-ui text-[10.5px] font-700 uppercase tracking-[0.04em] text-accent-line">
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-500 text-text-muted">{label}</dt>
      <dd className="font-700 text-text">{value}</dd>
    </div>
  );
}

/** A text input that commits on blur and stays in step with a realtime update. */
function LogInput({
  label,
  placeholder,
  inputMode,
  remote,
  onCommit,
}: {
  label: string;
  placeholder: string;
  inputMode: 'text' | 'decimal';
  remote: string;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(remote);
  const focused = useRef(false);

  // A write from another device lands as a new `remote`. Take it only when the field
  // is idle, so it never overwrites what a thumb is in the middle of typing.
  useEffect(() => {
    if (!focused.current) setValue(remote);
  }, [remote]);

  return (
    <Field
      label={label}
      placeholder={placeholder}
      inputMode={inputMode}
      value={value}
      onChange={(e2) => setValue(e2.target.value)}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        const trimmed = value.trim();
        if (trimmed !== remote) onCommit(trimmed);
      }}
    />
  );
}

function Technique({ exercise }: { exercise: Exercise }) {
  return (
    <div className="mt-3 flex flex-col gap-4">
      <Block title={t.technique}>
        <ol className="flex flex-col gap-1.5">
          {exercise.steps.pt.map((step, i) => (
            <li key={i} className="flex gap-2 font-ui text-[13px] leading-snug text-text">
              <span className="tabular shrink-0 font-700 text-accent-line">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Block>

      {exercise.errs.pt.length ? (
        <Block title={t.commonErrors}>
          <ul className="flex flex-col gap-2">
            {exercise.errs.pt.map((fault, i) => (
              <li key={i} className="rounded-field bg-surface-sunken px-3 py-2">
                <p className="font-ui text-[12.5px] font-600 leading-snug text-text">{fault.e}</p>
                <p className="mt-1 font-ui text-[12.5px] leading-snug text-text-muted">
                  <span className="font-600 text-accent-line">{t.fix}: </span>
                  {fault.c}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title={t.safety}>
        <ul className="flex flex-col gap-1.5">
          {exercise.safe.pt.map((line, i) => (
            <li key={i} className="flex gap-2 font-ui text-[13px] leading-snug text-text">
              <span aria-hidden="true" className="shrink-0 text-accent-line">
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
      </Block>

      <Block title={t.breathing}>
        <p className="font-ui text-[13px] leading-snug text-text">{exercise.breath.pt}</p>
      </Block>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 font-ui text-[11px] font-700 uppercase tracking-[0.05em] text-text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}
