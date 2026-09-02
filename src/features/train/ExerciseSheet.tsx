import { useId, useRef, useState } from 'react';
import clsx from 'clsx';

import { BLOCKS, prog, type ProgKind } from '../../content';
import { PHOTO_ACCEPT, PhotoError, uploadExercisePhoto } from '../../data/photos';
import { useUserId } from '../../data/queries';
import { pt } from '../../i18n/pt';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { isProgKind, type DayEntry } from './day-entries';
import type { ExerciseInput } from './use-day-editing';
import { youtubeId } from './video-id';

const t = pt.editor;

/**
 * The one form that creates and changes an exercise.
 *
 * Three jobs, deliberately one component: adding an exercise of your own, editing one
 * you added, and changing what a baseline exercise asks of you. They differ in which
 * fields show and where the result is written, and in nothing else a person would
 * notice, so splitting them into three would be three places for the same layout to
 * drift.
 *
 * **Only the name is required.** Video and photo are both optional and both are real
 * on their own: an exercise with a video and no photo shows the demonstration and a
 * neutral tile, one with a photo and no video shows the photo and says there is no
 * demonstration yet, and one with both is complete. A link that is not a YouTube video
 * is refused in every mode, because saving it would produce a card whose play button
 * does nothing.
 *
 * The four-block preview under the numbers is not decoration. `prog()` turns one set
 * of figures into four prescriptions, and the block 3 row is where someone finds out
 * that a "composto" gains a set. Showing it before the save is cheaper than explaining
 * it afterwards.
 *
 * The draft is seeded once, when the component mounts, and never re-seeded. The caller
 * gives this a fresh `key` each time a sheet is opened, so opening one is a mount and
 * the fields are correct without an effect that writes state after render. Closing
 * leaves it mounted, which is what lets it animate out instead of vanishing.
 */

export type SheetMode =
  | { kind: 'new' }
  | { kind: 'own'; entry: DayEntry }
  | { kind: 'built'; entry: DayEntry };

const KINDS: readonly { value: ProgKind; label: string }[] = [
  { value: 'comp', label: t.kindComp },
  { value: 'acc', label: t.kindAcc },
  { value: 'iso', label: t.kindIso },
  { value: 'core', label: t.kindCore },
];

type Draft = {
  name: string;
  equipment: string;
  kind: ProgKind;
  sets: string;
  reps: string;
  load: string;
  rest: string;
  video: string;
  photoUrl: string | null;
};

function draftFrom(mode: SheetMode): Draft {
  if (mode.kind === 'new') {
    return {
      name: '', equipment: '', kind: 'acc',
      sets: '3', reps: '', load: '', rest: '90 s',
      video: '', photoUrl: null,
    };
  }

  const { entry } = mode;
  const p = entry.prescription;

  if (mode.kind === 'own') {
    const row = entry.custom!;
    return {
      name: row.name ?? '',
      equipment: row.equipment ?? '',
      kind: isProgKind(row.kind) ? row.kind : 'acc',
      sets: row.sets ?? String(p.s),
      reps: row.reps ?? '',
      load: row.load ?? '',
      rest: row.rest ?? '',
      video: row.video_id ?? '',
      photoUrl: row.photo_url,
    };
  }

  /*
   * A baseline exercise prefills from what it currently asks, override included, so a
   * field left alone saves the value that was on screen. The old app did the same and
   * for the same reason: a form that prefilled blank would turn "change the rest" into
   * "clear everything else".
   */
  return {
    name: entry.name,
    equipment: entry.equipment ?? '',
    kind: 'acc',
    sets: String(p.s),
    reps: p.r,
    load: p.l,
    rest: p.rest,
    video: entry.videoId ?? '',
    photoUrl: entry.override?.photo_url ?? null,
  };
}

export function ExerciseSheet({
  open,
  mode,
  onOpenChange,
  onSubmit,
  onDelete,
  onRestore,
}: {
  open: boolean;
  mode: SheetMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ExerciseInput) => void;
  /** Only for an exercise of the user's own. */
  onDelete?: () => void;
  /** Only for a baseline exercise that currently carries an override. */
  onRestore?: () => void;
}) {
  const userId = useUserId();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(mode));
  const [nameError, setNameError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewId = useId();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function pickPhoto(file: File | undefined) {
    if (!file || !userId) return;
    setPhotoNote(null);
    setUploading(true);
    try {
      const url = await uploadExercisePhoto(file, userId, draft.name || 'ex');
      set('photoUrl', url);
    } catch (error) {
      const reason = error instanceof PhotoError ? error.reason : 'upload';
      setPhotoNote(
        reason === 'offline' ? t.photoOffline : reason === 'decode' ? t.photoBadFile : t.photoFailed,
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function submit() {
    const name = draft.name.trim();
    if (!name) {
      setNameError(t.errName);
      return;
    }
    // Empty is "no video" and saves. Non-empty that yields nothing is a typo, and
    // saving it would ship a play button that does nothing.
    const raw = draft.video.trim();
    const videoId = youtubeId(raw);
    if (raw && !videoId) {
      setVideoError(t.errVideo);
      return;
    }
    onSubmit({
      name,
      equipment: draft.equipment,
      kind: draft.kind,
      sets: draft.sets,
      reps: draft.reps,
      load: draft.load,
      rest: draft.rest,
      videoId,
      photoUrl: draft.photoUrl,
    });
    onOpenChange(false);
  }

  const isNew = mode.kind === 'new';
  const isOwn = mode.kind === 'own';
  const showKind = isNew || isOwn;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? t.newTitle : isOwn ? t.editOwnTitle : t.editBuiltTitle}
      description={isNew ? t.newHint : mode.kind === 'built' ? t.editBuiltHint : undefined}
      footer={
        <div className="flex flex-col gap-2.5">
          <Button onClick={submit} loading={uploading}>
            {isNew ? t.create : pt.common.save}
          </Button>
          {onDelete ? (
            <Button variant="ghost" onClick={onDelete} className="text-danger">
              <Icon name="trash" size={17} strokeWidth={1.9} />
              {t.remove}
            </Button>
          ) : null}
          {onRestore ? (
            <Button variant="ghost" onClick={onRestore}>
              {t.restoreOriginal}
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

        <Field
          label={t.equipment}
          placeholder={t.equipmentPlaceholder}
          value={draft.equipment}
          onChange={(e) => set('equipment', e.target.value)}
        />

        {showKind ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="font-ui text-[13px] font-500 text-text-muted">{t.kind}</legend>
            <div className="rail -mx-5 gap-2 px-5 pb-1">
              {KINDS.map((option) => {
                const selected = draft.kind === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set('kind', option.value)}
                    className={clsx(
                      'min-h-[44px] rounded-full px-4 font-ui text-[13px] font-500',
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
            <p className="font-ui text-[12px] leading-snug text-text-muted">{t.kindHint}</p>
          </fieldset>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t.sets}
            placeholder={t.setsPlaceholder}
            inputMode="numeric"
            value={draft.sets}
            onChange={(e) => set('sets', e.target.value)}
          />
          <Field
            label={t.reps}
            placeholder={t.repsPlaceholder}
            value={draft.reps}
            onChange={(e) => set('reps', e.target.value)}
          />
          <Field
            label={t.load}
            placeholder={t.loadPlaceholder}
            value={draft.load}
            onChange={(e) => set('load', e.target.value)}
          />
          <Field
            label={t.rest}
            placeholder={t.restPlaceholder}
            value={draft.rest}
            onChange={(e) => set('rest', e.target.value)}
          />
        </div>

        {showKind ? <BlockPreview draft={draft} id={previewId} /> : null}

        <div className="flex flex-col gap-2">
          <Field
            label={t.video}
            placeholder={t.videoPlaceholder}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={draft.video}
            error={videoError}
            onChange={(e) => {
              set('video', e.target.value);
              if (videoError) setVideoError(null);
            }}
          />
          <p className="font-ui text-[12px] leading-snug text-text-muted">{t.videoHint}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-ui text-[13px] font-500 text-text-muted">{t.photo}</p>
          <div className="flex items-center gap-3">
            <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-field border border-rule bg-surface-sunken">
              {draft.photoUrl ? (
                <img src={draft.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="dumbbell" size={26} strokeWidth={1.6} className="text-text-muted" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className={clsx(
                  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-rule px-4',
                  'font-ui text-[13px] font-600 text-text',
                  'transition-colors duration-[160ms] pointer-hover:border-edge',
                  uploading && 'cursor-not-allowed opacity-60',
                )}
              >
                <Icon name="camera" size={16} strokeWidth={1.8} />
                {uploading ? t.photoSending : draft.photoUrl ? t.photoChange : t.photoAdd}
              </button>
              {draft.photoUrl ? (
                <button
                  type="button"
                  onClick={() => set('photoUrl', null)}
                  className="min-h-[44px] font-ui text-[13px] font-600 text-text-muted underline-offset-4 pointer-hover:underline"
                >
                  {t.photoRemove}
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={PHOTO_ACCEPT}
            hidden
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
          <p className="font-ui text-[12px] leading-snug text-text-muted">
            {photoNote ?? t.photoHint}
          </p>
        </div>
      </div>
    </Sheet>
  );
}

/**
 * What `prog()` will make of these numbers, before they are saved.
 *
 * Reads live off the draft, so changing the movement type redraws four rows and the
 * consequence of the choice is visible while the choice is being made.
 */
function BlockPreview({ draft, id }: { draft: Draft; id: string }) {
  const sets = Number.parseInt(draft.sets.trim(), 10);
  const slots = prog(
    Number.isFinite(sets) && sets > 0 ? Math.min(sets, 12) : 3,
    draft.load.trim() || '—',
    draft.rest.trim() || '90 s',
    draft.kind,
  );
  const reps = draft.reps.trim();

  return (
    <section aria-labelledby={id} className="rounded-card border border-rule bg-surface p-3">
      <h3 id={id} className="font-ui text-[11px] font-700 uppercase tracking-[0.05em] text-text-muted">
        {t.preview}
      </h3>
      <ul className="mt-2 flex flex-col gap-1">
        {BLOCKS.map((b) => {
          const p = slots[b.k];
          return (
            <li key={b.k} className="flex items-baseline justify-between gap-3 font-ui text-[12.5px]">
              <span className="font-600 text-text-muted">{b.t.pt}</span>
              <span className="tabular text-text">
                {p.s} × {reps || p.r}
                <span className="text-text-muted"> · RPE {p.rpe}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
