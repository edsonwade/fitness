import { useId, useRef, useState } from 'react';
import clsx from 'clsx';

import { BLOCKS, prog, type ProgKind } from '../../content';
import {
  PHOTO_ACCEPT,
  PhotoError,
  VIDEO_ACCEPT,
  uploadExercisePhoto,
  uploadExerciseVideo,
} from '../../data/photos';
import type { CatalogExercise } from '../../data/entities';
import { useUserId } from '../../data/queries';
import { useT } from '../../i18n/locale-context';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { ValuePill } from '../../ui/ValuePill';
import { uploadedClip } from './clips';
import { asTyped, isProgKind, type DayEntry } from './day-entries';
import {
  formatLoad,
  formatReps,
  formatRest,
  formatSets,
  parseLoad,
  parseReps,
  parseRest,
  parseSets,
} from './prescription-values';
import type { ExerciseInput, Visibility } from './use-day-editing';


/**
 * The one form that creates and changes an exercise.
 *
 * Four jobs, deliberately one component: adding an exercise, editing one you added,
 * editing one that is published for everybody, and changing what a baseline exercise
 * asks of you. They differ in which fields show and where the result is written, and in
 * nothing else a person would notice, so splitting them into four would be four places
 * for the same layout to drift.
 *
 * **Where it lives is a field, not a mode.** The chips decide whether the exercise is
 * written to this day alone or also to the shared catalogue, and the hint under them
 * changes with the choice, because the catalogue has a consequence a label does not
 * carry: from there anyone can put it on another day, change it, or remove it.
 *
 * They no longer decide who sees it. Since `009` the week is one week, so an exercise
 * added to Wednesday is on everybody's Wednesday either way, and a chip offering to
 * keep it to yourself would have been offering something the database will not do.
 *
 * **Only the name and the equipment are typed.** Since 2026-09-23 (his photos of 18:06
 * and 18:10) sets, reps, rest and load are pills that open the wheel, the same
 * `ValuePill` as the set grid of the Executar sheet, and never the keyboard. The text
 * they store is unchanged — `prescription-values.ts` reads it into numbers and writes
 * the picked number back — so a field nobody touches saves exactly what it held.
 *
 * **Photo and video share one stage.** Both are optional. The YouTube link left the app
 * on 2026-09-22 (tarefa 5); what comes back on 2026-09-23 is a file the person films,
 * uploaded by `uploadExerciseVideo` and kept as its URL in `video_id`, where
 * `uploadedClip` turns it into the demonstration the Executar screen plays. An old
 * YouTube id in that column is still carried through untouched and still not shown.
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
  | { kind: 'built'; entry: DayEntry }
  | { kind: 'shared'; entry: DayEntry }
  /** The same published exercise, edited from the catalogue, with no day around it. */
  | { kind: 'catalog'; row: CatalogExercise };

/*
 * A CHAVE, e não a palavra. Uma constante de módulo é lida uma vez, quando o
 * ficheiro carrega, e ficava presa na língua em que a app arrancou; a chave
 * resolve-se a cada render, onde o `useT()` a pode ouvir mudar.
 */
const VISIBILITIES: readonly { value: Visibility; label: 'visPrivate' | 'visShared' }[] = [
  { value: 'day', label: 'visPrivate' },
  { value: 'catalog', label: 'visShared' },
];

const KINDS: readonly {
  value: ProgKind;
  label: 'kindComp' | 'kindAcc' | 'kindIso' | 'kindCore';
}[] = [
  { value: 'comp', label: 'kindComp' },
  { value: 'acc', label: 'kindAcc' },
  { value: 'iso', label: 'kindIso' },
  { value: 'core', label: 'kindCore' },
];

type Draft = {
  name: string;
  equipment: string;
  kind: ProgKind;
  sets: string;
  reps: string;
  load: string;
  rest: string;
  /** `video_id`: an uploaded clip's URL, or an old YouTube id carried through untouched. */
  video: string;
  photoUrl: string | null;
  visibility: Visibility;
};

/** A published exercise, wherever it is being edited from. One shape, one source. */
function draftFromCatalog(row: CatalogExercise): Draft {
  return {
    name: row.name_pt,
    equipment: row.equipment ?? '',
    kind: isProgKind(row.kind) ? row.kind : 'acc',
    sets: row.sets ?? '3',
    reps: row.reps ?? '',
    load: row.load ?? '',
    rest: row.rest ?? '',
    video: row.video_id ?? '',
    photoUrl: row.photo_url,
    visibility: 'catalog',
  };
}

function draftFrom(mode: SheetMode): Draft {
  if (mode.kind === 'catalog') return draftFromCatalog(mode.row);

  if (mode.kind === 'new') {
    return {
      name: '', equipment: '', kind: 'acc',
      sets: '3', reps: '', load: '', rest: '90 s',
      video: '', photoUrl: null,
      // This day only, by default. Putting an exercise in the catalogue is a choice
      // someone makes, never one they discover afterwards.
      visibility: 'day',
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
      visibility: 'day',
    };
  }

  if (mode.kind === 'shared') return draftFromCatalog(entry.shared!.catalog);

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
    video: entry.override?.video_id ?? '',
    photoUrl: entry.override?.photo_url ?? null,
    // A baseline exercise is the programme's, and what this form writes for it is an
    // override on the day. There is nothing here to put in the catalogue, so the
    // selector does not show.
    visibility: 'day',
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
  const copy = useT();
  const t = copy.editor;
  const userId = useUserId();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(mode));
  const [nameError, setNameError] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'photo' | 'video' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const previewId = useId();
  const nameId = useId();
  const equipmentId = useId();
  const nameErrorId = useId();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function pickPhoto(file: File | undefined) {
    if (!file || !userId) return;
    setPhotoNote(null);
    setUploading('photo');
    try {
      const url = await uploadExercisePhoto(file, userId, draft.name || 'ex');
      set('photoUrl', url);
    } catch (error) {
      const reason = error instanceof PhotoError ? error.reason : 'upload';
      setPhotoNote(
        reason === 'offline' ? t.photoOffline : reason === 'decode' ? t.photoBadFile : t.photoFailed,
      );
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function pickVideo(file: File | undefined) {
    if (!file || !userId) return;
    setPhotoNote(null);
    setUploading('video');
    try {
      const url = await uploadExerciseVideo(file, userId, draft.name || 'ex');
      set('video', url);
    } catch (error) {
      const reason = error instanceof PhotoError ? error.reason : 'upload';
      setPhotoNote(
        reason === 'offline'
          ? t.videoOffline
          : reason === 'size'
            ? t.videoTooBig
            : reason === 'decode'
              ? t.videoBadFile
              : t.videoFailed,
      );
    } finally {
      setUploading(null);
      if (videoInput.current) videoInput.current.value = '';
    }
  }

  function submit() {
    const name = draft.name.trim();
    if (!name) {
      setNameError(t.errName);
      return;
    }
    /*
     * Publishing something that was yours is one way: the private row goes, the
     * shared one takes its key, and from then on anyone can change or remove it.
     * A new exercise does not ask, because there is nothing to lose and the hint
     * under the chips already says what "toda a gente" means.
     */
    if (isOwn && draft.visibility === 'catalog' && !window.confirm(t.publishConfirm)) return;

    onSubmit({
      name,
      equipment: draft.equipment,
      kind: draft.kind,
      sets: draft.sets,
      reps: draft.reps,
      load: draft.load,
      rest: draft.rest,
      videoId: draft.video,
      photoUrl: draft.photoUrl,
      visibility: draft.visibility,
    });
    onOpenChange(false);
  }

  const isNew = mode.kind === 'new';
  const isOwn = mode.kind === 'own';
  const isShared = mode.kind === 'shared' || mode.kind === 'catalog';
  const showKind = isNew || isOwn || isShared;
  /*
   * Two reasons the chips are not always here. A baseline exercise belongs to the
   * programme, and what this form writes for it is a private override, so there is
   * nothing to publish. An already-published one has no way back: taking it private
   * again would remove it from days other people are training this week, and no
   * screen in this app is going to do that behind a chip.
   */
  const showVisibility = isNew || isOwn;
  /* Only an uploaded file plays here; an old YouTube id stays in the draft, unseen. */
  const clip = uploadedClip(draft.video, draft.photoUrl);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isNew ? t.newTitle : isShared ? t.sharedTitle : isOwn ? t.editOwnTitle : t.editBuiltTitle}
      description={
        isNew ? t.newHint : isShared ? t.sharedHint : mode.kind === 'built' ? t.editBuiltHint : undefined
      }
      footer={
        <div className="flex flex-col gap-2.5">
          <Button onClick={submit} loading={uploading !== null}>
            {isNew ? t.create : copy.common.save}
          </Button>
          {onDelete ? (
            <Button variant="ghost" onClick={onDelete} className="text-danger">
              <Icon name="trash" size={17} strokeWidth={1.9} />
              {isShared ? t.removeShared : t.remove}
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
      <div className="flex flex-col gap-5">
        <MediaStage
          video={clip?.mp4 ?? null}
          photo={draft.photoUrl}
          uploading={uploading}
          onPickVideo={() => videoInput.current?.click()}
          onPickPhoto={() => fileInput.current?.click()}
          onRemove={() => (clip ? set('video', '') : set('photoUrl', null))}
        />
        <input
          ref={fileInput}
          type="file"
          accept={PHOTO_ACCEPT}
          hidden
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        <input
          ref={videoInput}
          type="file"
          accept={VIDEO_ACCEPT}
          hidden
          onChange={(e) => void pickVideo(e.target.files?.[0])}
        />
        <p className="rx-note" role={photoNote ? 'status' : undefined}>
          {photoNote ?? t.mediaHint}
        </p>

        {/*
          * The two things a person writes. No box: the name is set in the display face
          * the day and the Executar screen use for an exercise, so what is typed here
          * already looks like the card it becomes.
          */}
        <div className="flex flex-col gap-4">
          <div className={clsx('rx-line', nameError && 'is-error')}>
            <label htmlFor={nameId} className="rx-label">
              {t.name}
            </label>
            <input
              id={nameId}
              className="rx-title"
              value={draft.name}
              placeholder={t.namePlaceholder}
              autoComplete="off"
              enterKeyHint="next"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? nameErrorId : undefined}
              onChange={(e) => {
                set('name', e.target.value);
                if (nameError) setNameError(null);
              }}
            />
            {nameError ? (
              <p id={nameErrorId} className="rx-error" role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="rx-line">
            <label htmlFor={equipmentId} className="rx-label">
              {t.equipment}
            </label>
            <div className="flex items-center gap-2.5">
              <Icon name="dumbbell" size={18} strokeWidth={1.8} className="shrink-0 text-text-muted" />
              <input
                id={equipmentId}
                className="rx-sub"
                value={draft.equipment}
                placeholder={t.equipmentPlaceholder}
                autoComplete="off"
                enterKeyHint="done"
                onChange={(e) => set('equipment', e.target.value)}
              />
            </div>
          </div>
        </div>

        <PrescriptionPanel draft={draft} set={set} />

        {showVisibility ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="rx-label">{t.visibility}</legend>
            <div className="flex gap-2">
              {VISIBILITIES.map((option) => {
                const selected = draft.visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set('visibility', option.value)}
                    className={clsx(
                      'min-h-[44px] rounded-full px-5 font-ui text-[13px] font-500',
                      'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
                      'active:scale-[0.97] motion-reduce:active:scale-100',
                      selected
                        ? 'bg-chip-selected font-600 text-chip-selected-ink'
                        : 'bg-chip text-chip-ink',
                    )}
                  >
                    {t[option.label]}
                  </button>
                );
              })}
            </div>
            <p className="rx-note">
              {draft.visibility === 'day' ? t.visHintPrivate : t.visHintShared}
            </p>
          </fieldset>
        ) : null}

        {showKind ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="rx-label">{t.kind}</legend>
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
                    {t[option.label]}
                  </button>
                );
              })}
            </div>
            <p className="rx-note">{t.kindHint}</p>
          </fieldset>
        ) : null}

        {showKind ? <BlockPreview draft={draft} id={previewId} /> : null}
      </div>
    </Sheet>
  );
}

/**
 * The stage at the top: the clip if there is one, else the photo, else an empty frame
 * that says so. The two glass buttons sit on the picture, the way the Executar screen
 * lays its controls over the demonstration, and the ✕ takes away whichever is showing.
 */
function MediaStage({
  video,
  photo,
  uploading,
  onPickVideo,
  onPickPhoto,
  onRemove,
}: {
  video: string | null;
  photo: string | null;
  uploading: 'photo' | 'video' | null;
  onPickVideo: () => void;
  onPickPhoto: () => void;
  onRemove: () => void;
}) {
  const t = useT().editor;
  const busy = uploading !== null;

  return (
    <div className="rx-stage" aria-busy={busy || undefined}>
      {video ? (
        <video
          key={video}
          src={video}
          poster={photo ?? undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          aria-label={t.videoChange}
        />
      ) : photo ? (
        <img src={photo} alt="" />
      ) : (
        <div className="rx-stage-empty">
          <Icon name="dumbbell" size={30} strokeWidth={1.5} />
          <span>{t.mediaEmpty}</span>
        </div>
      )}

      {video || photo ? (
        <button
          type="button"
          className="rx-stage-x"
          onClick={onRemove}
          disabled={busy}
          aria-label={video ? t.videoRemove : t.photoRemove}
        >
          <Icon name="x" size={16} strokeWidth={2.2} />
        </button>
      ) : null}

      <div className="rx-stage-actions">
        <button type="button" className="rx-glass-btn" onClick={onPickVideo} disabled={busy}>
          <Icon name="play" size={15} strokeWidth={2} />
          {uploading === 'video' ? t.videoSending : video ? t.videoChange : t.videoAdd}
        </button>
        <button type="button" className="rx-glass-btn" onClick={onPickPhoto} disabled={busy}>
          <Icon name="camera" size={15} strokeWidth={1.9} />
          {uploading === 'photo' ? t.photoSending : photo ? t.photoChange : t.photo}
        </button>
      </div>

      {busy ? <div className="rx-stage-progress" aria-hidden="true" /> : null}
    </div>
  );
}

/**
 * Sets, reps, rest and load, as the set grid of the Executar sheet draws them: an
 * uppercase column head over a glass pill, and the wheel behind every pill. Reps are
 * two pills, the bottom and the top of the range; picked equal, they are a fixed count.
 * An empty load is the dashed dash of *not filled in*, never words in a field.
 */
function PrescriptionPanel({
  draft,
  set,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const t = useT().editor;
  const sets = parseSets(draft.sets);
  const reps = parseReps(draft.reps);
  const rest = parseRest(draft.rest);
  const load = parseLoad(draft.load);

  return (
    <section className="rx-panel" aria-label={t.prescription}>
      <div className="rx-panel-head">
        <h3 className="rx-label">{t.prescription}</h3>
        <span className="rx-note">{t.prescriptionHint}</span>
      </div>

      <div className="rx-grid">
        <span className="rx-col">{t.sets}</span>
        <span className="rx-col">{t.reps}</span>
        <span className="rx-col">{t.rest}</span>
        <span className="rx-col">{t.load}</span>

        <ValuePill
          value={sets}
          scale="sets"
          title={t.sets}
          className="rx-pill"
          onChange={(v) => set('sets', formatSets(v))}
        />
        <div className="rx-range">
          <ValuePill
            value={reps?.min ?? null}
            scale="reps"
            title={t.repsMin}
            className="rx-pill"
            variant="volt"
            onChange={(v) => set('reps', formatReps({ min: v, max: Math.max(reps?.max ?? v, v) }))}
          />
          <span className="rx-range-dash" aria-hidden="true">–</span>
          <ValuePill
            value={reps?.max ?? null}
            scale="reps"
            title={t.repsMax}
            className="rx-pill"
            variant="volt"
            onChange={(v) => set('reps', formatReps({ min: Math.min(reps?.min ?? v, v), max: v }))}
          />
        </div>
        <ValuePill
          value={rest}
          scale="seg"
          title={t.rest}
          className="rx-pill"
          onChange={(v) => set('rest', formatRest(v))}
        />
        <ValuePill
          value={load}
          scale="kg"
          title={t.load}
          className="rx-pill"
          onChange={(v) => set('load', formatLoad(v, draft.load))}
        />
      </div>

      {load !== null ? (
        <button type="button" className="rx-clear" onClick={() => set('load', '')}>
          {t.loadClear}
        </button>
      ) : null}
    </section>
  );
}

/**
 * What `prog()` will make of these numbers, before they are saved.
 *
 * Reads live off the draft, so changing the movement type redraws four rows and the
 * consequence of the choice is visible while the choice is being made.
 */
function BlockPreview({ draft, id }: { draft: Draft; id: string }) {
  const copy = useT();
  const t = copy.editor;
  const sets = Number.parseInt(draft.sets.trim(), 10);
  /*
   * The load goes in through `asTyped`, which repeats it into the four languages
   * rather than translating it: it is the number this person just typed into the
   * field above, and it reads back the same whatever language the app is in. The
   * three loads `prog()` writes itself do translate, and this preview does not draw
   * them — it shows sets, reps and RPE.
   */
  const slots = prog(
    Number.isFinite(sets) && sets > 0 ? Math.min(sets, 12) : 3,
    asTyped(draft.load.trim() || '—'),
    draft.rest.trim() || '90 s',
    draft.kind,
  );
  const reps = draft.reps.trim();

  return (
    <section aria-labelledby={id} className="rx-panel">
      <h3 id={id} className="rx-label">
        {t.preview}
      </h3>
      <ul className="mt-2 flex flex-col gap-1">
        {BLOCKS.map((b) => {
          const p = slots[b.k];
          return (
            <li key={b.k} className="flex items-baseline justify-between gap-3 font-ui text-[13px]">
              <span className="font-600 text-text-muted">{copy.train.phase[b.k]}</span>
              <span className="tabular font-700 text-text">
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
