import { z } from 'zod';

/**
 * The rows of `003_new_app_schema.sql`, as the client reads them.
 *
 * These are READ schemas. Postgres has already enforced the shape on write, so
 * their job is to catch the mismatch between what this build expects and what the
 * database actually returns, which is what happens when a migration has not been
 * run yet. That failure is otherwise silent until some component renders
 * `undefined` three screens later.
 *
 * Free text stays text everywhere it is text in the database. Weight, reps and the
 * body measurements are the confirmed product truth: '60', '12,5' and '10/hand'
 * are all real values real people typed, and a number type here would be a
 * validation gate the product never agreed to.
 */

const nullableText = z.string().nullable();
const timestamptz = z.string();

/** Every table written by a person carries these. On a shared one, `user_id` is
 * whoever wrote it last rather than whose row it is — see `SHARED_TABLES`. */
const ownedRow = {
  user_id: z.uuid(),
  updated_at: timestamptz,
  updated_by_client: nullableText.optional(),
};

export const exerciseLogSchema = z.object({
  ...ownedRow,
  day_no: z.number().int(),
  block: z.string(),
  ex_key: z.string(),
  weight: nullableText,
  reps: nullableText,
  sets_done: z.array(z.boolean()),
  note: nullableText,
  /*
   * Written only by `merge_exercise_log`, never by the client. It is read here
   * because replica identity full puts it on every realtime payload, and a schema
   * that omitted it would be a schema that does not describe what arrives.
   */
  field_updated_at: z.record(z.string(), z.string()),
});

export const sessionSchema = z.object({
  ...ownedRow,
  id: z.uuid(),
  performed_at: timestamptz,
  day_name: nullableText,
  block: nullableText,
});

export const sessionEntrySchema = z.object({
  ...ownedRow,
  session_id: z.uuid(),
  idx: z.number().int(),
  name: nullableText,
  /* Structured, not the old app's '4×10' display string. See 003. */
  target_sets: nullableText,
  target_reps: nullableText,
  target_raw: nullableText,
  sets_done: z.number().int().nullable(),
  sets_total: z.number().int().nullable(),
  weight: nullableText,
  reps: nullableText,
  note: nullableText,
});

export const goalSchema = z.object({
  ...ownedRow,
  id: z.uuid(),
  title: nullableText,
  type: nullableText,
  unit: nullableText,
  start_value: nullableText,
  target_value: nullableText,
  current_value: nullableText,
  deadline: nullableText,
  photo: nullableText,
  notes: nullableText,
  created_at: timestamptz,
  hit_at: timestamptz.nullable(),
});

export const trainerSchema = z.object({
  ...ownedRow,
  id: z.uuid(),
  name: nullableText,
  photo: nullableText,
  specialty: nullableText,
  bio: nullableText,
  phone: nullableText,
  email: nullableText,
  instagram: nullableText,
  availability: nullableText,
  notes: nullableText,
  plans: z.array(z.string()),
  preferred_days: z.array(z.number().int()),
  active: z.boolean(),
  created_at: timestamptz,
});

export const trainerSessionSchema = z.object({
  ...ownedRow,
  id: z.uuid(),
  trainer_id: z.uuid(),
  session_date: nullableText,
  note: nullableText,
});

export const userProfileSchema = z.object({
  ...ownedRow,
  name: nullableText,
  photo: nullableText,
  height_cm: nullableText,
  weight_start: nullableText,
  weight_current: nullableText,
  weight_target: nullableText,
  training_days: z.array(z.number().int()),
  onboarded_at: timestamptz.nullable(),
});

export const userSettingsSchema = z.object({
  ...ownedRow,
  theme: z.string(),
  lang: z.string(),
  rest_note: z.string(),
});

/**
 * A training day added to the week, outside the seven the programme ships.
 *
 * `day_no` is the whole design (plan decision D4): 1 to 7 is the baseline, 101 up is
 * added, and every table that already carries a `day_no` therefore carries such a day
 * without a column of its own. There is no weekday here, because an invented day is
 * not pinned to one, and no list of items, because its exercises are
 * `custom_exercises` rows like any other.
 *
 * `user_id` is who wrote the row last, not who the day is for. Since `009` the number
 * is unique across the whole database and the day belongs to everybody, which is what
 * makes "Caminhada" the same Caminhada in both accounts rather than two days that
 * happen to share a number.
 */
export const customDaySchema = z.object({
  ...ownedRow,
  day_no: z.number().int(),
  name: nullableText,
  goal: nullableText,
  warm: nullableText,
  type: z.string(),
  created_at: timestamptz,
});

export const customExerciseSchema = z.object({
  ...ownedRow,
  id: z.uuid(),
  day_no: z.number().int(),
  legacy_key: nullableText,
  /*
   * Which periodization curve `prog()` runs for this exercise. Added by `004`
   * with a default, so the rows the backfill already wrote keep the 'acc' the
   * old app published them as.
   */
  kind: z.string(),
  name: nullableText,
  equipment: nullableText,
  sets: nullableText,
  reps: nullableText,
  load: nullableText,
  rest: nullableText,
  video_id: nullableText,
  photo_url: nullableText,
  created_at: timestamptz,
});

export const exerciseOverrideSchema = z.object({
  ...ownedRow,
  day_no: z.number().int(),
  ex_key: z.string(),
  name: nullableText,
  equipment: nullableText,
  sets: nullableText,
  reps: nullableText,
  load: nullableText,
  rest: nullableText,
  video_id: nullableText,
  photo_url: nullableText,
});

export const hiddenItemSchema = z.object({
  ...ownedRow,
  day_no: z.number().int(),
  ex_key: z.string(),
});

export const restPreferenceSchema = z.object({
  ...ownedRow,
  ex_key: z.string(),
  seconds: z.number().int(),
});

export const exerciseOrderSchema = z.object({
  ...ownedRow,
  day_no: z.number().int(),
  ordered_keys: z.array(z.string()),
});

/* ---------- the additive catalogue ----------------------------------------- */

const authoredRow = {
  created_by: z.uuid(),
  created_at: timestamptz,
  updated_at: timestamptz,
  updated_by_client: nullableText.optional(),
  deleted: z.boolean(),
};

export const catalogExerciseSchema = z.object({
  ...authoredRow,
  id: z.uuid(),
  ex_key: z.string(),
  name_pt: z.string(),
  name_en: nullableText,
  /*
   * Which periodization curve `prog()` runs for this exercise, added by `006`.
   * It lives on the exercise rather than on the day that prescribes it: a squat
   * is a compound on Monday and on Thursday, and storing it per day would be two
   * places for one fact to disagree.
   */
  kind: z.string(),
  equipment: nullableText,
  sets: nullableText,
  reps: nullableText,
  load: nullableText,
  rest: nullableText,
  video_id: nullableText,
  photo_url: nullableText,
});

/**
 * The first day number that is not part of the bundled programme.
 *
 * 1 to 7 are the authored week and cannot be written to: they live in the bundle. 8
 * to 100 is left empty for that week to grow. 101 up is what people add, and since
 * `009` those numbers are handed out from the shared table, so a number names one day
 * for everybody. `custom-days.ts` re-exports it for the screens, so there is one
 * number and not two that must agree.
 */
export const FIRST_CUSTOM_DAY = 101;

export const dayAdditionSchema = z.object({
  ...authoredRow,
  id: z.uuid(),
  day_no: z.number().int(),
  /*
   * Always null, and the column is kept to say so out loud.
   *
   * `008` put an owner here because day numbers above 100 were handed out per
   * account, so "day 101" named a different day in each one and an addition there
   * meant nothing to anyone else. `009` removed that premise instead of managing it:
   * every day is now one day, numbered once across the database, so every addition
   * is everybody's. The database enforces it — `check (user_id is null)`, `009` §5 —
   * and dropping the column would have been the one irreversible way to record the
   * same fact.
   */
  user_id: z.uuid().nullable(),
  ex_key: z.string(),
  block_config: z.record(z.string(), z.unknown()),
});

/* ---------- the registry --------------------------------------------------- */

/**
 * Table name to schema. Every table the migrations create, from `003` onward,
 * appears here exactly once, and a test asserts that against the SQL files
 * themselves, so adding a table to a migration without a schema, or the reverse,
 * fails the build rather than a screen.
 */
export const TABLES = {
  exercise_logs: exerciseLogSchema,
  sessions: sessionSchema,
  session_entries: sessionEntrySchema,
  goals: goalSchema,
  trainers: trainerSchema,
  trainer_sessions: trainerSessionSchema,
  user_profiles: userProfileSchema,
  user_settings: userSettingsSchema,
  custom_days: customDaySchema,
  custom_exercises: customExerciseSchema,
  exercise_overrides: exerciseOverrideSchema,
  hidden_items: hiddenItemSchema,
  rest_preferences: restPreferenceSchema,
  exercise_order: exerciseOrderSchema,
  catalog_exercises: catalogExerciseSchema,
  day_additions: dayAdditionSchema,
} as const;

export type TableName = keyof typeof TABLES;

/**
 * The tables every account reads and writes as one. **This is the line the whole app
 * turns on**, so it is stated once, here, and read by the fetch, the realtime bridge
 * and the write path rather than restated in each.
 *
 * The rule behind the list: **the plan is everybody's, the record is yours.** The week
 * is the same week for everyone — the same days, the same exercises in them, the same
 * order, the same things taken out — so a change to it is a change to everybody's
 * week, and it arrives on the other account over realtime rather than at their next
 * reload. What is left out is what belongs to one person: the loads they lifted
 * (`exercise_logs`, `sessions`, `session_entries`), their goals and trainers, their
 * profile and settings, and the rest they take between sets.
 *
 * `009` is where this stops being a client decision. Before it, RLS ended every read
 * at `user_id = auth.uid()`, so widening the list here would have changed nothing at
 * all: the rows simply would not arrive.
 *
 * The two catalogue tables are in the list for the same reason as the rest, but they
 * carry `created_by` rather than `user_id`, and they are soft-deleted rather than
 * deleted — `AUTHORED_TABLES` is what the code checks where that difference matters.
 */
export const SHARED_TABLES: ReadonlySet<TableName> = new Set<TableName>([
  'custom_days',
  'custom_exercises',
  'exercise_overrides',
  'hidden_items',
  'exercise_order',
  'catalog_exercises',
  'day_additions',
]);

/**
 * The two shared tables whose owner column is `created_by` and whose delete is a flag.
 *
 * A published exercise is referred to by the day additions that prescribe it, so
 * removing the row itself would leave those pointing at nothing. Everything else in
 * `SHARED_TABLES` is referred to by nothing and is deleted outright.
 */
export const AUTHORED_TABLES: ReadonlySet<TableName> = new Set<TableName>([
  'catalog_exercises',
  'day_additions',
]);

export function isShared(table: TableName): boolean {
  return SHARED_TABLES.has(table);
}
export type RowOf<T extends TableName> = z.infer<(typeof TABLES)[T]>;

export type ExerciseLog = z.infer<typeof exerciseLogSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionEntry = z.infer<typeof sessionEntrySchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Trainer = z.infer<typeof trainerSchema>;
export type TrainerSession = z.infer<typeof trainerSessionSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type CustomDay = z.infer<typeof customDaySchema>;
export type CustomExercise = z.infer<typeof customExerciseSchema>;
export type ExerciseOverride = z.infer<typeof exerciseOverrideSchema>;
export type HiddenItem = z.infer<typeof hiddenItemSchema>;
export type RestPreference = z.infer<typeof restPreferenceSchema>;
export type ExerciseOrder = z.infer<typeof exerciseOrderSchema>;
export type CatalogExercise = z.infer<typeof catalogExerciseSchema>;
export type DayAddition = z.infer<typeof dayAdditionSchema>;

/**
 * The primary key of each table, which the realtime bridge needs to find the row a
 * change refers to inside a cached list.
 *
 * **No shared table has `user_id` in its key**, and that is the same rule as
 * `SHARED_TABLES` seen from the other side: if the writer were part of the identity,
 * one fact about the week — this exercise is hidden on Wednesday — would be stored
 * once per account. `009` §3 re-keys the four that had it. The symptom that rule was
 * written for: with the old key, hiding wrote one row per account, so the second
 * account's "restore" deleted only its own and the exercise stayed hidden behind a
 * row that screen could not see.
 */
export const PRIMARY_KEYS: Record<TableName, readonly string[]> = {
  exercise_logs: ['user_id', 'day_no', 'block', 'ex_key'],
  sessions: ['id'],
  session_entries: ['session_id', 'idx'],
  goals: ['id'],
  trainers: ['id'],
  trainer_sessions: ['id'],
  user_profiles: ['user_id'],
  user_settings: ['user_id'],
  custom_days: ['day_no'],
  custom_exercises: ['id'],
  exercise_overrides: ['day_no', 'ex_key'],
  hidden_items: ['day_no', 'ex_key'],
  rest_preferences: ['user_id', 'ex_key'],
  exercise_order: ['day_no'],
  catalog_exercises: ['id'],
  day_additions: ['id'],
};
