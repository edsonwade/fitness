import { useState } from 'react';
import clsx from 'clsx';

import { pt } from '../../i18n/pt';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { TextArea } from '../../ui/TextArea';
import type { DayInput, DayRef, DayType } from './custom-days';

const t = pt.days;

/**
 * The form that makes a training day of your own, and edits it afterwards.
 *
 * Four fields, only one of them required. A day needs a name to be findable in a
 * week of eight; the goal and the warm-up are the two things the programme's own
 * days carry above their exercises, and a day of yours is allowed the same two
 * rather than a thinner version of them.
 *
 * There is no weekday to pick. The programme pins its seven days to Monday through
 * Sunday because that is what the programme is; a day you invented is trained when
 * you decide to train it, and a picker would be asking for a fact that does not
 * exist.
 *
 * Cardio is not offered as a type. A cardio day in the programme prescribes cardio
 * entries that live in the bundle, and there is no screen that would let you write
 * one, so the choice would be a control that changes nothing. The database accepts
 * the word already, so offering it later needs a screen and not a migration.
 *
 * The draft is seeded once, on mount, and never re-seeded: the caller gives this a
 * fresh `key` per opening, so opening is a mount and the fields are right without an
 * effect writing state after render. Closing leaves it mounted so it can animate out.
 */

export type DaySheetMode = { kind: 'new' } | { kind: 'edit'; ref: DayRef };

const TYPES: readonly { value: DayType; label: string }[] = [
  { value: 'strength', label: t.typeStrength },
  { value: 'rest', label: t.typeRest },
];

type Draft = { name: string; goal: string; warm: string; type: DayType };

function draftFrom(mode: DaySheetMode): Draft {
  if (mode.kind === 'new') return { name: '', goal: '', warm: '', type: 'strength' };
  const { ref } = mode;
  return {
    name: ref.custom?.name ?? '',
    goal: ref.goal ?? '',
    warm: ref.warm ?? '',
    // A day stored as cardio keeps its type until the person changes it; the chips
    // simply show neither as pressed rather than silently rewriting the row.
    type: ref.type,
  };
}

export function DaySheet({
  open,
  mode,
  onOpenChange,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  mode: DaySheetMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: DayInput) => void;
  /** Only when editing a day that exists. */
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(mode));
  const [nameError, setNameError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function submit() {
    const name = draft.name.trim();
    if (!name) {
      setNameError(t.errName);
      return;
    }
    onSubmit({ name, goal: draft.goal, warm: draft.warm, type: draft.type });
    onOpenChange(false);
  }

  const isNew = mode.kind === 'new';

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? t.newTitle : t.editTitle}
      description={isNew ? t.newHint : undefined}
      footer={
        <div className="flex flex-col gap-2.5">
          <Button onClick={submit}>{isNew ? t.create : pt.common.save}</Button>
          {onDelete ? (
            <Button variant="ghost" onClick={onDelete} className="text-danger">
              <Icon name="trash" size={17} strokeWidth={1.9} />
              {t.remove}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label={t.name}
          placeholder={t.namePlaceholder}
          value={draft.name}
          error={nameError}
          onChange={(e) => {
            set('name', e.target.value);
            if (nameError) setNameError(null);
          }}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="font-ui text-[13px] font-500 text-text-muted">{t.type}</legend>
          <div className="flex gap-2">
            {TYPES.map((option) => {
              const selected = draft.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('type', option.value)}
                  className={clsx(
                    'min-h-[44px] rounded-full px-5 font-ui text-[13px] font-500',
                    'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                    'active:scale-[0.97] motion-reduce:active:scale-100',
                    selected
                      ? 'bg-chip-selected font-600 text-chip-selected-ink'
                      : 'bg-chip text-chip-ink',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="font-ui text-[12px] leading-snug text-text-muted">{t.typeHint}</p>
        </fieldset>

        <TextArea
          label={t.goal}
          placeholder={t.goalPlaceholder}
          value={draft.goal}
          onChange={(e) => set('goal', e.target.value)}
        />

        <TextArea
          label={t.warm}
          placeholder={t.warmPlaceholder}
          value={draft.warm}
          onChange={(e) => set('warm', e.target.value)}
        />
      </div>
    </Sheet>
  );
}
