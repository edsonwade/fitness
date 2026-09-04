import { useState } from 'react';
import clsx from 'clsx';

import { useUserId } from '../../data/queries';
import { pt } from '../../i18n/pt';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { WriteFailureNotice } from '../../ui/Notice';
import { Sheet } from '../../ui/Sheet';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { ExerciseSheet, type SheetMode } from '../train/ExerciseSheet';
import { useDays, type DayRef } from '../train/custom-days';
import { derivePrescription } from '../train/day-entries';
import type { ExerciseInput } from '../train/use-day-editing';
import { useCatalog, useCatalogEditing, useCatalogPlacement, type CatalogItem } from './catalog';

const t = pt.catalog;
const e = pt.editor;

/**
 * Everything the accounts have published, in one list.
 *
 * This is not a feed and not a store. It is the place where you see what exists for
 * everybody and correct or remove what does not belong, which is why an item shows
 * the days it is prescribed on rather than who added it or when. Under the decision
 * of 2026-09-02 authorship carries no privilege, so putting a name on each row would
 * be decoration that implies a permission the app does not have.
 *
 * Editing and removing both write to rows every account reads, so both reach the
 * other person's open app without a reload. The word on the delete says so.
 */
export function Catalog() {
  const { items, isPending, isError } = useCatalog();
  const editing = useCatalogEditing();
  const placement = useCatalogPlacement();
  const userId = useUserId();
  const week = useDays();
  const [sheet, setSheet] = useState<{ item: CatalogItem; id: number } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picker, setPicker] = useState<{ item: CatalogItem; id: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function openSheet(item: CatalogItem) {
    setSheet((current) => ({ item, id: (current?.id ?? 0) + 1 }));
    setSheetOpen(true);
  }

  function openPicker(item: CatalogItem) {
    setPicker((current) => ({ item, id: (current?.id ?? 0) + 1 }));
    setPickerOpen(true);
  }

  /**
   * Puts the exercise on a day, or takes it off one.
   *
   * The confirmation is the same on every day now. It used to be asked only on the
   * seven of the programme, because only those were common to both accounts; since
   * `009` the whole week is, so placing a card anywhere changes somebody else's
   * training and a warning that depended on which day it was would be wrong half the
   * time. Taking one off does not ask: the card is already there to be seen, and the
   * same tap that removes it is the one that put it there.
   */
  function place(day: DayRef) {
    if (!picker || !userId) return;
    const already = placement.additionOn(picker.item, day.no) !== undefined;
    if (!already && !window.confirm(t.addToDayConfirm)) return;

    placement.place(picker.item, day.no, userId, already);
    setPickerOpen(false);
  }

  function submit(input: ExerciseInput) {
    if (sheet) editing.save(sheet.item.row, input);
  }

  function remove() {
    if (!sheet) return;
    if (!window.confirm(e.removeSharedConfirm)) return;
    editing.remove(sheet.item);
    setSheetOpen(false);
  }

  /**
   * The names of the days an exercise is prescribed on, as the reader knows them.
   *
   * A day that is not in the week is named in words rather than by its number. It
   * means one thing only: the day was deleted and retiring this addition with it was
   * refused, so the row outlived the day it belonged to. "No dia: 101" was the app
   * reading that state out as a fact about the plan; it is a leftover, and it says so.
   */
  function dayNames(item: CatalogItem): string[] {
    return item.days.map((addition) => week.dayOf(addition.day_no)?.name ?? t.dayGone);
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

        {isError ? (
          <p
            role="status"
            className="mt-5 rounded-card border border-rule bg-surface px-4 py-3 font-ui text-[13px] leading-snug text-text-muted"
          >
            {t.loadError}
          </p>
        ) : null}

        <WriteFailureNotice failure={editing.failure ?? placement.failure} className="mt-5" />

        {isPending ? (
          <ul className="mt-5 flex flex-col gap-2.5" aria-busy="true">
            <span className="sr-only">{pt.common.loading}</span>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                aria-hidden="true"
                className="h-[92px] animate-pulse rounded-card bg-surface motion-reduce:animate-none"
              />
            ))}
          </ul>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-card border border-rule bg-surface p-6 text-center">
            <p className="font-ui text-[15px] font-700 text-text">{t.emptyTitle}</p>
            <p className="mt-1.5 font-ui text-[13px] leading-snug text-text-muted">{t.emptyBody}</p>
          </div>
        ) : (
          <>
            <p className="mt-5 font-ui text-[12px] font-600 uppercase tracking-[0.04em] text-text-muted">
              {items.length} {items.length === 1 ? t.countOne : t.countMany}
            </p>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {items.map((item) => (
                <li key={item.row.id}>
                  <Row
                    item={item}
                    days={dayNames(item)}
                    onEdit={() => openSheet(item)}
                    onPlace={() => openPicker(item)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {sheet ? (
        <ExerciseSheet
          key={sheet.id}
          open={sheetOpen}
          mode={{ kind: 'catalog', row: sheet.item.row } satisfies SheetMode}
          onOpenChange={setSheetOpen}
          onSubmit={submit}
          onDelete={remove}
        />
      ) : null}

      {picker ? (
        <Sheet
          key={picker.id}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          title={t.addToDayTitle}
          description={t.addToDayHint}
          footer={
            <Button variant="ghost" onClick={() => setPickerOpen(false)}>
              {pt.common.close}
            </Button>
          }
        >
          <DayPicker item={picker.item} days={week.days} onPick={place} />
        </Sheet>
      ) : null}
    </div>
  );
}

/**
 * The days this exercise can go on, with the ones it is already on marked.
 *
 * A day it is already on stays tappable rather than being disabled, because tapping it
 * takes it off again — the same list answers "put it here" and "take it out of here",
 * and a disabled row would have made the second one unreachable from this screen.
 *
 * Every day is labelled with what placing there means, and it is the same label on all
 * of them because it is the same consequence: the week is one week. That line is the
 * only warning before the confirmation, and it is here rather than in a footnote
 * because it is what someone is agreeing to.
 */
function DayPicker({
  item,
  days,
  onPick,
}: {
  item: CatalogItem;
  days: readonly DayRef[];
  onPick: (day: DayRef) => void;
}) {
  const on = new Set(item.days.map((addition) => addition.day_no));

  if (days.length === 0) {
    return <p className="font-ui text-[13px] leading-snug text-text-muted">{t.addToDayNone}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {days.map((day) => {
        const already = on.has(day.no);
        return (
          <li key={day.no}>
            <button
              type="button"
              onClick={() => onPick(day)}
              aria-pressed={already}
              className={clsx(
                'flex min-h-[56px] w-full items-center gap-3 rounded-card px-4 py-3 text-left',
                'border transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                'active:scale-[0.99] motion-reduce:active:scale-100',
                already
                  ? 'border-edge bg-chip-selected text-chip-selected-ink'
                  : 'border-rule bg-surface text-text pointer-hover:border-edge',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ui text-[14.5px] font-600">{day.name}</span>
                <span className="mt-0.5 block truncate font-ui text-[12px] opacity-80">
                  {already ? t.addToDayAlready : t.addToDayEvery}
                </span>
              </span>
              <Icon
                name={already ? 'check' : 'plus'}
                size={18}
                strokeWidth={2}
                className="shrink-0"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Row({
  item,
  days,
  onEdit,
  onPlace,
}: {
  item: CatalogItem;
  days: readonly string[];
  onEdit: () => void;
  onPlace: () => void;
}) {
  const { row } = item;
  /*
   * Block 1 is what the list shows. An exercise periodizes into four targets and
   * printing all four here would be sixteen figures on a screen someone is scanning;
   * the first block is the one it was written against.
   */
  const p = derivePrescription(row, row.kind, 'b1');

  return (
    <article className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-[var(--shadow-card)]">
      {row.photo_url ? (
        <img
          src={row.photo_url}
          alt=""
          loading="lazy"
          className="h-[64px] w-[64px] shrink-0 rounded-[14px] object-cover"
        />
      ) : (
        /* Never another exercise's photograph, here as anywhere else in this app. */
        <span
          aria-hidden="true"
          className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[14px] bg-surface-sunken text-text-muted"
        >
          <Icon name="dumbbell" size={24} strokeWidth={1.5} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-ui text-[15.5px] font-700 leading-tight text-text">
          {row.name_pt}
        </h2>
        <p className="tabular mt-0.5 truncate font-ui text-[12.5px] text-text-muted">
          {p.s} × {p.r}
          {row.equipment ? (
            <>
              <span aria-hidden="true"> · </span>
              {row.equipment}
            </>
          ) : null}
          {row.video_id ? (
            <>
              <span aria-hidden="true"> · </span>
              <Icon name="play" size={11} strokeWidth={2} className="inline align-[-1px]" />
            </>
          ) : null}
        </p>
        <p className="mt-1 truncate font-ui text-[12px] text-text-muted">
          {days.length === 0
            ? t.onNoDay
            : `${days.length === 1 ? t.onDay : t.onDays}: ${days.join(', ')}`}
        </p>
      </div>

      {/*
        Two actions, and putting it on a day comes first because it is the one people
        come to this screen to do. Editing a published exercise changes it for
        everybody, so it sits second and keeps the quieter treatment.
      */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onPlace}
          aria-label={`${t.addToDay}: ${row.name_pt}`}
          className={clsx(
            'grid h-11 w-11 place-items-center rounded-full',
            'bg-accent text-accent-ink',
            'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
            'active:scale-[0.94] motion-reduce:active:scale-100',
          )}
        >
          <Icon name="plus" size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onEdit}
          aria-label={`${pt.common.edit}: ${row.name_pt}`}
          className={clsx(
            'grid h-11 w-11 place-items-center rounded-full',
            'border border-rule bg-surface-raised text-text',
            'transition-[border-color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
            'active:scale-[0.94] motion-reduce:active:scale-100 pointer-hover:border-edge',
          )}
        >
          <Icon name="edit" size={17} strokeWidth={1.9} />
        </button>
      </div>
    </article>
  );
}
