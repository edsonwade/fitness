import {
  v1BlobSchema,
  v1CustomSchema,
  v1GoalSchema,
  v1LogSchema,
  v1OverrideSchema,
  v1ProfileSchema,
  v1SessionEntrySchema,
  v1SessionSchema,
  v1TrainerSchema,
  v1TrainerSessionSchema,
} from './v1-schema.ts';

/**
 * The v1 blob mapper: `user_state.data` to the rows of `003_new_app_schema.sql`.
 *
 * This one module has two callers, which is why it is worth its own file and its
 * own tests. It is the backfill (plan M2) AND it is the v1 branch of the import
 * feature (plan D13), so a user restoring a backup taken before the cutover goes
 * through exactly the code path the migration was proved on.
 *
 * TWO PROPERTIES IT MUST HAVE, and the tests hold both:
 *
 * 1. **Deterministic ids.** M2 is re-runnable through `on conflict do nothing`,
 *    which only works if a row keeps the same primary key across runs. Random
 *    uuids would make every re-run insert duplicates instead of skipping. Ids are
 *    therefore derived, UUIDv5 style, from the user id plus the legacy id.
 * 2. **Never lose a row to a bad field.** A malformed goal must not cost the user
 *    their training history. Anything unusable is skipped and recorded in
 *    `warnings`, which M3 reviews.
 */

/* ---------- deterministic ids ---------------------------------------------- */

/**
 * A fixed namespace for this migration. Any constant uuid works; what matters is
 * that it never changes, because changing it re-keys every row and turns the next
 * backfill re-run into a duplicate insert of everything.
 */
const NAMESPACE = '6f9b1d2e-3c4a-4b5d-8e7f-0a1b2c3d4e5f';

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/-/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

/**
 * RFC 4122 v5: SHA-1 of namespace bytes plus name bytes, with the version and
 * variant bits forced. Web Crypto rather than `node:crypto`, because this module
 * also runs in the browser as the import path.
 */
async function uuidV5(name: string): Promise<string> {
  const bytes = new Uint8Array([...hexToBytes(NAMESPACE), ...new TextEncoder().encode(name)]);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
  const b = digest.slice(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50; // version 5
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = [...b].map((n) => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ---------- coercion ------------------------------------------------------- */

/** Text as the old app would have shown it. Free text is preserved, not parsed. */
function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function textOr(value: unknown, fallback: string): string {
  return text(value) ?? fallback;
}

/** A day number. Blob keys are strings, and some blobs carry them as numbers. */
function dayNo(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n >= 1 && n <= 7 ? n : null;
}

function smallintArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
    .filter((n) => Number.isInteger(n));
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => text(v)).filter((v): v is string => v !== null);
}

/**
 * An ISO timestamp, or null. The old app wrote `new Date().toISOString()` in most
 * places, but imported backups carry whatever the exporting browser produced, so
 * an unparseable value is dropped rather than becoming an invalid timestamptz that
 * makes the whole insert fail.
 */
function timestamp(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** `YYYY-MM-DD`, which is what trainer sessions are stored as. */
function dateOnly(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  if (match) return match[1];
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * `alvo` was written as `sets + '×' + reps` at `js/ui.js:2008`, so it is a rendered
 * string, not data. Split it back apart on the FIRST multiplication sign only:
 * the reps half is free text and legitimately contains more characters, as in
 * '4×10/lado' or '3×8-10'.
 *
 * Anything that does not carry the separator is kept whole in `target_raw`. The
 * migration is allowed to fail to understand a value; it is not allowed to drop it.
 */
function splitTarget(value: unknown): {
  target_sets: string | null;
  target_reps: string | null;
  target_raw: string | null;
} {
  const raw = text(value);
  if (!raw) return { target_sets: null, target_reps: null, target_raw: null };
  // The old app used U+00D7. Accept a typed 'x' too, since imported backups exist.
  const at = raw.search(/[×x]/);
  if (at < 0) return { target_sets: null, target_reps: null, target_raw: raw };
  const sets = raw.slice(0, at).trim();
  const reps = raw.slice(at + 1).trim();
  if (!sets && !reps) return { target_sets: null, target_reps: null, target_raw: raw };
  return { target_sets: sets || null, target_reps: reps || null, target_raw: null };
}

/**
 * `done` was written as `completed + '/' + total`. Both halves are counts the old
 * app had computed, so they become the integers they always were.
 */
function splitDone(value: unknown): { sets_done: number | null; sets_total: number | null } {
  const raw = text(value);
  if (!raw) return { sets_done: null, sets_total: null };
  const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(raw);
  if (!match) return { sets_done: null, sets_total: null };
  return { sets_done: parseInt(match[1], 10), sets_total: parseInt(match[2], 10) };
}

/** The blob writes `arr[i] = true` into a fresh array, so holes are normal. */
function boolArray(value: unknown): boolean[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => v === true);
}

/* ---------- row types ------------------------------------------------------ */

export type V1Rows = {
  exercise_logs: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  session_entries: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  trainers: Record<string, unknown>[];
  trainer_sessions: Record<string, unknown>[];
  user_profiles: Record<string, unknown>[];
  user_settings: Record<string, unknown>[];
  custom_exercises: Record<string, unknown>[];
  exercise_overrides: Record<string, unknown>[];
  hidden_items: Record<string, unknown>[];
  rest_preferences: Record<string, unknown>[];
  exercise_order: Record<string, unknown>[];
};

export type MapResult = {
  rows: V1Rows;
  /** Everything skipped or coerced, for the M3 divergence review. */
  warnings: string[];
};

function emptyRows(): V1Rows {
  return {
    exercise_logs: [],
    sessions: [],
    session_entries: [],
    goals: [],
    trainers: [],
    trainer_sessions: [],
    user_profiles: [],
    user_settings: [],
    custom_exercises: [],
    exercise_overrides: [],
    hidden_items: [],
    rest_preferences: [],
    exercise_order: [],
  };
}

/**
 * `<day>:<block>:<exKey>`. Split from the left twice rather than on every colon:
 * an exercise key is a slug today, but a published key is user supplied and a
 * colon in it must not silently shift the block into the wrong column.
 */
function splitLogKey(key: string): { day: number; block: string; exKey: string } | null {
  const first = key.indexOf(':');
  if (first < 0) return null;
  const second = key.indexOf(':', first + 1);
  if (second < 0) return null;
  const day = dayNo(key.slice(0, first));
  const block = key.slice(first + 1, second);
  const exKey = key.slice(second + 1);
  if (day === null || !block || !exKey) return null;
  return { day, block, exKey };
}

/** `<day>:<exKey>`, used by both `hidden` and `ovr`. */
function splitDayKey(key: string): { day: number; exKey: string } | null {
  const at = key.indexOf(':');
  if (at < 0) return null;
  const day = dayNo(key.slice(0, at));
  const exKey = key.slice(at + 1);
  if (day === null || !exKey) return null;
  return { day, exKey };
}

/* ---------- the mapper ----------------------------------------------------- */

export async function mapV1Blob(userId: string, input: unknown): Promise<MapResult> {
  const rows = emptyRows();
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);

  const parsed = v1BlobSchema.safeParse(input ?? {});
  if (!parsed.success) {
    // The schema is permissive enough that this means the blob is not an object
    // at all. There is nothing to salvage, and the caller records it per user.
    return { rows, warnings: ['blob is not an object; nothing mapped'] };
  }
  const blob = parsed.data;

  /* ---- cargas ---- */
  for (const [key, value] of Object.entries(blob.ex ?? {})) {
    const parts = splitLogKey(key);
    if (!parts) {
      warn(`exercise_logs: unparseable key "${key}"`);
      continue;
    }
    const log = v1LogSchema.safeParse(value);
    if (!log.success) {
      warn(`exercise_logs: unusable value at "${key}"`);
      continue;
    }
    const setsDone = boolArray(log.data.done);
    const weight = text(log.data.w);
    const reps = text(log.data.r);
    const note = text(log.data.note);
    // An entry the user never touched carries nothing. Writing it would inflate
    // the reconciliation counts against a blob key that holds an empty object.
    if (!weight && !reps && !note && setsDone.every((d) => !d)) continue;

    rows.exercise_logs.push({
      user_id: userId,
      day_no: parts.day,
      block: parts.block,
      ex_key: parts.exKey,
      weight,
      reps,
      sets_done: setsDone,
      note,
    });
  }

  /* ---- sessões ---- */
  for (const raw of blob.sessions ?? []) {
    const session = v1SessionSchema.safeParse(raw);
    if (!session.success) {
      warn('sessions: unusable entry skipped');
      continue;
    }
    const legacy = text(session.data.id);
    if (!legacy) {
      warn('sessions: entry without an id skipped');
      continue;
    }
    const id = await uuidV5(`${userId}:session:${legacy}`);
    rows.sessions.push({
      id,
      user_id: userId,
      performed_at: timestamp(session.data.date) ?? new Date(0).toISOString(),
      day_name: text(session.data.dayName),
      block: text(session.data.block),
    });
    if (!timestamp(session.data.date)) {
      warn(`sessions: session ${legacy} had no readable date; kept at epoch`);
    }

    (session.data.entries ?? []).forEach((entryRaw, idx) => {
      const entry = v1SessionEntrySchema.safeParse(entryRaw);
      if (!entry.success) {
        warn(`session_entries: unusable entry ${idx} in session ${legacy}`);
        return;
      }
      const target = splitTarget(entry.data.alvo);
      const done = splitDone(entry.data.done);
      if (target.target_raw) {
        warn(`session_entries: target "${target.target_raw}" kept unparsed in session ${legacy}`);
      }
      if (text(entry.data.done) && done.sets_done === null) {
        warn(`session_entries: unreadable set count in session ${legacy}, entry ${idx}`);
      }
      rows.session_entries.push({
        session_id: id,
        idx,
        user_id: userId,
        name: text(entry.data.name),
        ...target,
        ...done,
        weight: text(entry.data.w),
        reps: text(entry.data.reps),
        note: text(entry.data.note),
      });
    });
  }

  /* ---- metas ---- */
  for (const raw of blob.goals ?? []) {
    const goal = v1GoalSchema.safeParse(raw);
    if (!goal.success) {
      warn('goals: unusable entry skipped');
      continue;
    }
    const legacy = text(goal.data.id);
    if (!legacy) {
      warn('goals: entry without an id skipped');
      continue;
    }
    rows.goals.push({
      id: await uuidV5(`${userId}:goal:${legacy}`),
      user_id: userId,
      title: text(goal.data.title),
      type: text(goal.data.type),
      unit: text(goal.data.unit),
      start_value: text(goal.data.start),
      target_value: text(goal.data.target),
      current_value: text(goal.data.current),
      deadline: text(goal.data.deadline),
      photo: text(goal.data.photo),
      notes: text(goal.data.notes),
      created_at: timestamp(goal.data.createdAt) ?? new Date(0).toISOString(),
      hit_at: timestamp(goal.data.hitAt),
    });
  }

  /* ---- treinadores e as suas sessões ---- */
  for (const raw of blob.trainers ?? []) {
    const trainer = v1TrainerSchema.safeParse(raw);
    if (!trainer.success) {
      warn('trainers: unusable entry skipped');
      continue;
    }
    const legacy = text(trainer.data.id);
    if (!legacy) {
      warn('trainers: entry without an id skipped');
      continue;
    }
    const trainerId = await uuidV5(`${userId}:trainer:${legacy}`);
    rows.trainers.push({
      id: trainerId,
      user_id: userId,
      name: text(trainer.data.name),
      photo: text(trainer.data.photo),
      specialty: text(trainer.data.specialty),
      bio: text(trainer.data.bio),
      phone: text(trainer.data.phone),
      email: text(trainer.data.email),
      instagram: text(trainer.data.instagram),
      availability: text(trainer.data.availability),
      notes: text(trainer.data.notes),
      plans: textArray(trainer.data.plans),
      preferred_days: smallintArray(trainer.data.preferredDays),
      // `active: x.active !== false` in normTrainer, so absent means active.
      active: trainer.data.active !== false,
      created_at: timestamp(trainer.data.createdAt) ?? new Date(0).toISOString(),
    });

    for (const sessionRaw of trainer.data.sessions ?? []) {
      const ts = v1TrainerSessionSchema.safeParse(sessionRaw);
      if (!ts.success) {
        warn(`trainer_sessions: unusable entry on trainer ${legacy}`);
        continue;
      }
      const tsLegacy = text(ts.data.id);
      if (!tsLegacy) {
        warn(`trainer_sessions: entry without an id on trainer ${legacy}`);
        continue;
      }
      rows.trainer_sessions.push({
        id: await uuidV5(`${userId}:trainer-session:${tsLegacy}`),
        trainer_id: trainerId,
        user_id: userId,
        session_date: dateOnly(ts.data.date),
        note: text(ts.data.note),
      });
    }
  }

  /* ---- perfil ---- */
  const profile = v1ProfileSchema.safeParse(blob.profile ?? {});
  if (profile.success) {
    const trainingDays = smallintArray(profile.data.trainingDays);
    rows.user_profiles.push({
      user_id: userId,
      name: text(profile.data.name),
      photo: text(profile.data.photo),
      height_cm: text(profile.data.heightCm),
      weight_start: text(profile.data.weightStart),
      weight_current: text(profile.data.weightCurrent),
      weight_target: text(profile.data.weightTarget),
      // normState() replaces an empty list with the default, so an empty list here
      // never meant "trains no days"; it meant the key was never written.
      training_days: trainingDays.length ? trainingDays : [1, 2, 3, 4, 5, 6],
      onboarded_at: timestamp(profile.data.onboardedAt),
    });
  } else {
    warn('user_profiles: profile unusable; defaults written');
    rows.user_profiles.push({
      user_id: userId,
      training_days: [1, 2, 3, 4, 5, 6],
      onboarded_at: null,
    });
  }

  /* ---- definições ---- */
  // The OLD defaults, not the new ones. An absent key meant the user was looking
  // at a dark, English app, and carrying the new light/Portuguese defaults here
  // would silently change what they had been using.
  rows.user_settings.push({
    user_id: userId,
    theme: textOr(blob.theme, 'dark') === 'light' ? 'light' : 'dark',
    lang: textOr(blob.lang, 'en') === 'pt' ? 'pt' : 'en',
    rest_note: textOr(blob.restNote, ''),
  });

  /* ---- exercícios próprios ---- */
  for (const [dayKey, list] of Object.entries(blob.custom ?? {})) {
    const day = dayNo(dayKey);
    if (day === null) {
      warn(`custom_exercises: unparseable day "${dayKey}"`);
      continue;
    }
    if (!Array.isArray(list)) {
      warn(`custom_exercises: day ${day} did not hold a list`);
      continue;
    }
    for (const raw of list) {
      const custom = v1CustomSchema.safeParse(raw);
      if (!custom.success) {
        warn(`custom_exercises: unusable entry on day ${day}`);
        continue;
      }
      const legacy = text(custom.data.id);
      if (!legacy) {
        warn(`custom_exercises: entry without an id on day ${day}`);
        continue;
      }
      rows.custom_exercises.push({
        id: await uuidV5(`${userId}:custom:${legacy}`),
        user_id: userId,
        day_no: day,
        // The rest of the blob refers to this exercise as `c<id>`. Without this
        // column, the logs, the personal order and the rest preferences that
        // point at it would all dangle.
        legacy_key: `c${legacy}`,
        name: text(custom.data.name),
        equipment: text(custom.data.eq),
        sets: text(custom.data.s),
        reps: text(custom.data.r),
        load: text(custom.data.l),
        rest: text(custom.data.rest),
        video_id: text(custom.data.vid),
        photo_url: text(custom.data.photo),
      });
    }
  }

  /* ---- alterações a exercícios da base ---- */
  for (const [key, value] of Object.entries(blob.ovr ?? {})) {
    const parts = splitDayKey(key);
    if (!parts) {
      warn(`exercise_overrides: unparseable key "${key}"`);
      continue;
    }
    const ovr = v1OverrideSchema.safeParse(value);
    if (!ovr.success) {
      warn(`exercise_overrides: unusable value at "${key}"`);
      continue;
    }
    const row = {
      user_id: userId,
      day_no: parts.day,
      ex_key: parts.exKey,
      name: text(ovr.data.name),
      equipment: text(ovr.data.eq),
      sets: text(ovr.data.s),
      reps: text(ovr.data.r),
      load: text(ovr.data.l),
      rest: text(ovr.data.rest),
      video_id: text(ovr.data.vid),
      photo_url: text(ovr.data.photo),
    };
    // The old app deletes the key once nothing is left in it, so an all-null row
    // is not a state the app can produce and writing one would be noise.
    const hasValue = Object.entries(row).some(
      ([k, v]) => !['user_id', 'day_no', 'ex_key'].includes(k) && v !== null,
    );
    if (!hasValue) continue;
    rows.exercise_overrides.push(row);
  }

  /* ---- escondidos ---- */
  for (const [key, value] of Object.entries(blob.hidden ?? {})) {
    if (!value) continue; // Presence of a falsy value is not hidden.
    const parts = splitDayKey(key);
    if (!parts) {
      warn(`hidden_items: unparseable key "${key}"`);
      continue;
    }
    rows.hidden_items.push({ user_id: userId, day_no: parts.day, ex_key: parts.exKey });
  }

  /* ---- descanso escolhido ---- */
  for (const [exKey, value] of Object.entries(blob.restSec ?? {})) {
    const seconds = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (!Number.isInteger(seconds) || seconds < 0) {
      warn(`rest_preferences: unusable seconds for "${exKey}"`);
      continue;
    }
    rows.rest_preferences.push({ user_id: userId, ex_key: exKey, seconds });
  }

  /* ---- ordem pessoal ---- */
  for (const [dayKey, value] of Object.entries(blob.order ?? {})) {
    const day = dayNo(dayKey);
    if (day === null) {
      warn(`exercise_order: unparseable day "${dayKey}"`);
      continue;
    }
    const keys = textArray(value);
    if (!keys.length) continue;
    rows.exercise_order.push({ user_id: userId, day_no: day, ordered_keys: keys });
  }

  return { rows, warnings };
}

/**
 * The counts M3 reconciles against the blob's own array lengths and key counts.
 * Kept beside the mapper so the reconciliation cannot drift from what was written.
 */
export function countRows(rows: V1Rows): Record<keyof V1Rows, number> {
  return Object.fromEntries(
    Object.entries(rows).map(([table, list]) => [table, list.length]),
  ) as Record<keyof V1Rows, number>;
}
