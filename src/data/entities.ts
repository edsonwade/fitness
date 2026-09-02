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

/** Every private table carries these four. */
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
  equipment: nullableText,
  sets: nullableText,
  reps: nullableText,
  load: nullableText,
  rest: nullableText,
  video_id: nullableText,
  photo_url: nullableText,
});

export const dayAdditionSchema = z.object({
  ...authoredRow,
  id: z.uuid(),
  day_no: z.number().int(),
  ex_key: z.string(),
  block_config: z.record(z.string(), z.unknown()),
});

/* ---------- the registry --------------------------------------------------- */

/**
 * Table name to schema. Every table `003` creates appears here exactly once, and a
 * test asserts that against the SQL file itself, so adding a table to the migration
 * without a schema, or the reverse, fails the build rather than a screen.
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
  custom_exercises: customExerciseSchema,
  exercise_overrides: exerciseOverrideSchema,
  hidden_items: hiddenItemSchema,
  rest_preferences: restPreferenceSchema,
  exercise_order: exerciseOrderSchema,
  catalog_exercises: catalogExerciseSchema,
  day_additions: dayAdditionSchema,
} as const;

export type TableName = keyof typeof TABLES;
export type RowOf<T extends TableName> = z.infer<(typeof TABLES)[T]>;

export type ExerciseLog = z.infer<typeof exerciseLogSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionEntry = z.infer<typeof sessionEntrySchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Trainer = z.infer<typeof trainerSchema>;
export type TrainerSession = z.infer<typeof trainerSessionSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
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
  custom_exercises: ['id'],
  exercise_overrides: ['user_id', 'day_no', 'ex_key'],
  hidden_items: ['user_id', 'day_no', 'ex_key'],
  rest_preferences: ['user_id', 'ex_key'],
  exercise_order: ['user_id', 'day_no'],
  catalog_exercises: ['id'],
  day_additions: ['id'],
};
