import { useContext, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';

import type { Exercise } from '../../content';
import type { ExerciseLog } from '../../data/entities';
import { INTL_LOCALE } from '../../i18n';
import { useLocale, useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import type { DayEntry } from './day-entries';
import { exerciseState, setsDoneFor } from './logs';
import { ReorderContext } from './reorder-context';
import { ReorderHandle } from './ReorderableCard';
import type { Suggestion } from './suggestion';


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
  suggestion,
  runHref,
  controls,
}: {
  entry: DayEntry;
  log: ExerciseLog | undefined;
  /** A carga sugerida do histórico (fase 013); sem histórico daquele exercício, nada. */
  suggestion?: Suggestion | null;
  /** "Registar" leva ao ecrã Executar deste dia. */
  runHref: string;
  /** Absent while the day is still loading, or when there is nothing to compose. */
  controls?: {
    onEdit: () => void;
    onHide?: () => void;
  };
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.train;
  const e = copy.editor;
  const reorder = useContext(ReorderContext);
  const [open, setOpen] = useState(false);
  const p = entry.prescription;
  const done = setsDoneFor(log, p.s);
  const state = exerciseState(done);
  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });

  /*
   * `proto/v2/03-treino.html` frame 2: miniatura, nome em title-3, a prescrição em duas
   * linhas ("4 séries · 10-12 reps · RPE 7-8" e "60 kg a calibrar · 2–3 min"), a sugestão
   * a volt com de onde saiu, a nota como alternativa com um traço à esquerda, e os chips
   * Técnica e Registar. As séries marcam-se no Executar, que é a porta do Registar.
   */
  return (
    <article
      {...reorder?.rootProps}
      tabIndex={reorder ? 0 : undefined}
      aria-describedby={reorder?.hintId}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget) reorder?.handleProps.onKeyDown(event);
      }}
      style={reorder?.lifted ? { touchAction: 'none' } : undefined}
      className={clsx(
        'card select-none',
        'transition-[box-shadow,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        reorder?.lifted && 'z-10 scale-[1.02] shadow-[var(--shadow-float)] motion-reduce:scale-100',
      )}
    >
      <div className="row">
        <CardThumb photo={entry.photo} fallback={entry.fallbackPhoto} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="title-3 min-w-0 flex-1">{entry.name}</p>
            {/* A pega de arrastar (B5): prime e segura no cartão, ou arrasta por aqui. */}
            <ReorderHandle name={entry.name} words={e} />
            {state === 'done' ? (
              <span className="shrink-0 text-accent-line" aria-label={t.exDone}>
                <Icon name="check" size={18} strokeWidth={2.6} />
              </span>
            ) : null}
          </div>
          <p className="body-2 muted tabular">
            {p.s} {p.s === 1 ? t.serie : t.series} · {p.r} reps{p.rpe ? ` · RPE ${p.rpe}` : ''}
          </p>
          <p className="body-2 muted">
            {p.l}
            {p.rest ? ` · ${p.rest}` : ''}
          </p>
          {suggestion ? (
            <>
              <p className="body-2 mt-1 tabular" style={{ color: 'var(--ui-accent)' }}>
                {t.suggestion}: {kg.format(suggestion.kg)} kg
              </p>
              <p className="body-2 muted tabular">
                {t.lastTimePre} {kg.format(suggestion.lastKg)} kg {t.lastTimeIn} {suggestion.setsDone}{' '}
                {suggestion.setsDone === 1 ? t.serie : t.series}.
              </p>
            </>
          ) : null}
          {entry.equipment ? <p className="body-2 muted">{entry.equipment}</p> : null}
        </div>
      </div>

      {entry.note ? (
        <p
          className="body-2 muted mt-3"
          style={{ paddingLeft: 'var(--sp-3)', borderLeft: '2px solid var(--ui-rule)' }}
        >
          {entry.note}
        </p>
      ) : null}

      <div className="row mt-3 flex-wrap" style={{ gap: 'var(--sp-2)' }}>
        {entry.exercise ? (
          <button
            type="button"
            className={open ? 'chip chip-sm chip-selected' : 'chip chip-sm'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {t.technique}
          </button>
        ) : null}
        <Link to={runHref} className="chip chip-sm no-underline">
          {t.log}
        </Link>
        {entry.kind === 'custom' ? <Badge>{e.badgeOwn}</Badge> : null}
        {entry.kind === 'shared' ? <Badge>{e.badgeShared}</Badge> : null}
        {entry.override ? <Badge>{e.badgeChanged}</Badge> : null}
      </div>

      {open && entry.exercise ? <Technique exercise={entry.exercise} /> : null}

      {controls ? (
        <Controls name={entry.name} controls={controls} shared={entry.kind === 'shared'} />
      ) : null}
    </article>
  );
}

/** A `.thumb` do protótipo, com a mesma queda para a foto de reserva. */
function CardThumb({ photo, fallback }: { photo: string | null; fallback: string | null }) {
  const [src, setSrc] = useState(photo ?? fallback);
  if (!src) {
    return (
      <span className="thumb grid place-items-center bg-surface-sunken text-text-muted" aria-hidden="true">
        <Icon name="dumbbell" size={22} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <img
      className="thumb"
      src={src}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => {
        if (fallback && src !== fallback) setSrc(fallback);
        else setSrc(null);
      }}
    />
  );
}

/**
 * Composing controls, at the foot of the card rather than the head.
 *
 * The head of a card is where a thumb lands while scrolling a day mid-session, and
 * "remove from day" is not a thing to put under an accidental tap. Editing and removing
 * live below the logging controls, past everything used during a set. Ordering left the
 * foot entirely: it is direct manipulation now, on the card itself, not a button here.
 */
function Controls({
  name,
  controls,
  shared,
}: {
  name: string;
  controls: NonNullable<Parameters<typeof ExerciseCard>[0]['controls']>;
  /** Published for everybody, which changes what the hide control is called. */
  shared: boolean;
}) {
  const copy = useT();
  const e = copy.editor;
  return (
    <div className="mt-4 flex items-center gap-2 border-t border-rule pt-3">
      <span className="flex-1" />
      <SmallButton icon="edit" label={`${copy.common.edit}: ${name}`} onClick={controls.onEdit} />
      {controls.onHide ? (
        <SmallButton
          icon="x"
          /*
           * A shared exercise gets a different word for the same gesture. "Tirar do
           * dia" on something that belongs to everyone reads like removing it from
           * everyone's day, and the control that does that is behind a confirmation
           * inside the sheet, not one tap away on the card.
           */
          label={`${shared ? e.hideShared : e.hide}: ${name}`}
          onClick={controls.onHide}
        />
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
  icon: 'edit' | 'x';
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

function Technique({ exercise }: { exercise: Exercise }) {
  const { locale, t: copy } = useLocale();
  const t = copy.train;
  return (
    <div className="mt-3 flex flex-col gap-4">
      <Block title={t.technique}>
        <ol className="flex flex-col gap-1.5">
          {exercise.steps[locale].map((step, i) => (
            <li key={i} className="flex gap-2 font-ui text-[13px] leading-snug text-text">
              <span className="tabular shrink-0 font-700 text-accent-line">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Block>

      {exercise.errs[locale].length ? (
        <Block title={t.commonErrors}>
          <ul className="flex flex-col gap-2">
            {exercise.errs[locale].map((fault, i) => (
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
          {exercise.safe[locale].map((line, i) => (
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
        <p className="font-ui text-[13px] leading-snug text-text">{exercise.breath[locale]}</p>
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

