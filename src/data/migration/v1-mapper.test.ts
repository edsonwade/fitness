import { describe, expect, it } from 'vitest';

import { countRows, mapV1Blob } from './v1-mapper';

const USER = '11111111-2222-4333-8444-555555555555';

/**
 * A blob in the shape `old/js/store.js` actually writes, built from the field
 * names in `normState`, `normTrainer`, `normGoal` and the session writer at
 * `js/ui.js:2008`. Values are deliberately awkward where production is awkward.
 */
function realisticBlob() {
  return {
    ex: {
      '1:b1:legpress': { w: '120', r: '10', done: [true, true, false], note: 'sentiu bem' },
      // Free text, which is product truth and must survive as typed.
      '1:b1:dbcurl': { w: '12,5', r: '10/lado', done: [] },
      // Never touched. The old app creates the key on first render.
      '2:b2:hack': {},
      // A user's own exercise, referenced by its `c<id>` key.
      '3:b1:c1737000000001': { w: '40', r: '12', done: [true] },
    },
    sessions: [
      {
        id: 1737000000123,
        date: '2026-02-01T18:30:00.000Z',
        dayName: 'Costas + Peito',
        block: 'Volume',
        entries: [
          { name: 'Leg press', alvo: '4×10', w: '120', reps: '10', done: '3/4', note: '' },
          { name: 'Curl', alvo: '3×12', w: '12,5', reps: '12', done: '3/3', note: 'ok' },
        ],
      },
    ],
    goals: [
      {
        id: 1737000000200,
        title: 'Chegar a 80kg',
        type: 'weight',
        unit: 'kg',
        start: 74,
        target: 80,
        current: '76,5',
        deadline: '2026-06-01',
        photo: '',
        notes: '',
        createdAt: '2026-01-02T10:00:00.000Z',
        hitAt: null,
      },
    ],
    trainers: [
      {
        id: 1737000000300,
        name: 'Rita Sequeira',
        specialty: 'Hipertrofia',
        plans: ['Bloco 1', 'Bloco 2'],
        preferredDays: [1, 3, 5],
        sessions: [
          { id: 1737000000301, date: '2026-02-03', note: 'técnica de agachamento' },
          { id: 1737000000302, date: '2026-02-10', note: '' },
        ],
        createdAt: '2026-01-01T09:00:00.000Z',
      },
    ],
    profile: {
      name: 'Vanilson',
      heightCm: '178',
      weightStart: '74',
      weightCurrent: '76,5',
      weightTarget: '80',
      trainingDays: [1, 2, 3, 4, 5],
      onboardedAt: '2026-01-01T08:00:00.000Z',
    },
    custom: {
      '3': [
        {
          id: 1737000000001,
          name: 'Elevação lateral no cabo',
          eq: 'cabo',
          s: '3',
          r: '15',
          l: '7,5',
          rest: '60',
        },
      ],
    },
    ovr: {
      '1:legpress': { s: '5', r: '8' },
      // The old app prunes to photo-only after a shared publish.
      '2:hack': { photo: 'https://example.test/a.jpg' },
    },
    hidden: { '1:calf_s': 1, '2:plank': 0 },
    restSec: { legpress: 120, c1737000000001: 45 },
    order: { '1': ['dbcurl', 'legpress'], '3': ['c1737000000001'] },
    restNote: 'descansar mais nos compostos',
    theme: 'light',
    lang: 'pt',
  };
}

describe('v1 blob mapper', () => {
  it('maps a realistic blob into every table it should touch', async () => {
    const { rows, warnings } = await mapV1Blob(USER, realisticBlob());
    const counts = countRows(rows);

    expect(counts).toMatchObject({
      // '2:b2:hack' is an untouched entry and is deliberately not written.
      exercise_logs: 3,
      sessions: 1,
      session_entries: 2,
      goals: 1,
      trainers: 1,
      trainer_sessions: 2,
      user_profiles: 1,
      user_settings: 1,
      custom_exercises: 1,
      exercise_overrides: 2,
      // '2:plank' is present but falsy, which is not hidden.
      hidden_items: 1,
      rest_preferences: 2,
      exercise_order: 2,
    });
    expect(warnings).toEqual([]);
  });

  it('produces the same ids every run, so the backfill can be re-run', async () => {
    const first = await mapV1Blob(USER, realisticBlob());
    const second = await mapV1Blob(USER, realisticBlob());
    expect(second.rows).toEqual(first.rows);

    // And a different user never collides with this one.
    const other = await mapV1Blob('99999999-2222-4333-8444-555555555555', realisticBlob());
    expect(other.rows.sessions[0].id).not.toBe(first.rows.sessions[0].id);
  });

  it('emits real RFC 4122 v5 identifiers', async () => {
    const { rows } = await mapV1Blob(USER, realisticBlob());
    for (const row of [...rows.sessions, ...rows.goals, ...rows.trainers]) {
      expect(row.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });

  it('keeps weight, reps and measurements as the text they were typed as', async () => {
    const { rows } = await mapV1Blob(USER, realisticBlob());
    const curl = rows.exercise_logs.find((r) => r.ex_key === 'dbcurl');
    expect(curl).toMatchObject({ weight: '12,5', reps: '10/lado' });
    expect(rows.user_profiles[0]).toMatchObject({ weight_current: '76,5' });
    // A number in the blob becomes its text, never a rounded numeric.
    expect(rows.goals[0]).toMatchObject({ start_value: '74', current_value: '76,5' });
  });

  it('carries the legacy c<id> key so logs and order still resolve', async () => {
    const { rows } = await mapV1Blob(USER, realisticBlob());
    expect(rows.custom_exercises[0]).toMatchObject({ legacy_key: 'c1737000000001', day_no: 3 });
    expect(rows.exercise_logs.some((r) => r.ex_key === 'c1737000000001')).toBe(true);
    expect(rows.exercise_order.find((r) => r.day_no === 3)).toMatchObject({
      ordered_keys: ['c1737000000001'],
    });
    expect(rows.rest_preferences.some((r) => r.ex_key === 'c1737000000001')).toBe(true);
  });

  it('splits the log key from the left, so a colon in an exercise key is safe', async () => {
    const { rows } = await mapV1Blob(USER, { ex: { '1:b1:od:d': { w: '10' } } });
    expect(rows.exercise_logs[0]).toMatchObject({ day_no: 1, block: 'b1', ex_key: 'od:d' });
  });

  it('skips a bad record without losing the good ones beside it', async () => {
    const { rows, warnings } = await mapV1Blob(USER, {
      goals: [
        { id: 1, title: 'boa' },
        'nao e um objecto',
        { title: 'sem id' },
        { id: 2, title: 'outra boa' },
      ],
      ex: { 'chave-partida': { w: '10' }, '1:b1:ok': { w: '20' } },
    });
    expect(rows.goals).toHaveLength(2);
    expect(rows.exercise_logs).toHaveLength(1);
    expect(warnings).toHaveLength(3);
  });

  it('never throws on a blob that is not an object', async () => {
    for (const junk of [null, undefined, 42, 'texto', []]) {
      const result = await mapV1Blob(USER, junk);
      expect(result.rows.exercise_logs).toEqual([]);
    }
  });

  it('carries the OLD settings defaults, not the new ones', async () => {
    // An absent theme meant the user was looking at a dark, English app.
    const bare = await mapV1Blob(USER, {});
    expect(bare.rows.user_settings[0]).toMatchObject({ theme: 'dark', lang: 'en', rest_note: '' });

    const chosen = await mapV1Blob(USER, { theme: 'light', lang: 'pt' });
    expect(chosen.rows.user_settings[0]).toMatchObject({ theme: 'light', lang: 'pt' });
  });

  it('restores the default training days when the blob holds none', async () => {
    // normState() replaced an empty list with the default, so an empty list never
    // meant "trains no days".
    const { rows } = await mapV1Blob(USER, { profile: { trainingDays: [] } });
    expect(rows.user_profiles[0]).toMatchObject({ training_days: [1, 2, 3, 4, 5, 6] });
  });

  it('treats an absent active flag as an active trainer', async () => {
    const { rows } = await mapV1Blob(USER, { trainers: [{ id: 7, name: 'Sem flag' }] });
    expect(rows.trainers[0]).toMatchObject({ active: true });

    const off = await mapV1Blob(USER, { trainers: [{ id: 7, active: false }] });
    expect(off.rows.trainers[0]).toMatchObject({ active: false });
  });

  it('drops an override that holds nothing, as the old app would have deleted it', async () => {
    const { rows } = await mapV1Blob(USER, { ovr: { '1:legpress': {}, '1:hack': { s: '4' } } });
    expect(rows.exercise_overrides).toHaveLength(1);
    expect(rows.exercise_overrides[0]).toMatchObject({ ex_key: 'hack', sets: '4' });
  });

  it('splits the old display strings into real columns', async () => {
    const { rows } = await mapV1Blob(USER, realisticBlob());
    // '4×10' and '3/4' were formatting, not data.
    expect(rows.session_entries[0]).toMatchObject({
      name: 'Leg press',
      target_sets: '4',
      target_reps: '10',
      target_raw: null,
      sets_done: 3,
      sets_total: 4,
      weight: '120',
    });
  });

  it('splits on the first separator only, so free-text reps survive', async () => {
    const { rows } = await mapV1Blob(USER, {
      sessions: [
        {
          id: 1,
          date: '2026-02-01',
          entries: [
            { alvo: '4×10/lado', done: '4/4' },
            { alvo: '3×8-10', done: '0/3' },
            { alvo: '3x12', done: '2/3' },
          ],
        },
      ],
    });
    expect(rows.session_entries.map((r) => [r.target_sets, r.target_reps])).toEqual([
      ['4', '10/lado'],
      ['3', '8-10'],
      ['3', '12'],
    ]);
    expect(rows.session_entries.map((r) => r.sets_done)).toEqual([4, 0, 2]);
  });

  it('keeps a target it cannot split rather than dropping it', async () => {
    const { rows, warnings } = await mapV1Blob(USER, {
      sessions: [{ id: 1, date: '2026-02-01', entries: [{ alvo: 'ate a falha' }] }],
    });
    expect(rows.session_entries[0]).toMatchObject({
      target_sets: null,
      target_reps: null,
      target_raw: 'ate a falha',
    });
    expect(warnings.some((w) => w.includes('ate a falha'))).toBe(true);
  });

  it('keeps session entries in the order the array had them', async () => {
    const { rows } = await mapV1Blob(USER, {
      sessions: [{ id: 5, date: '2026-02-01', entries: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }],
    });
    expect(rows.session_entries.map((r) => [r.idx, r.name])).toEqual([
      [0, 'a'],
      [1, 'b'],
      [2, 'c'],
    ]);
    expect(rows.session_entries.every((r) => r.session_id === rows.sessions[0].id)).toBe(true);
  });

  it('normalises a trainer session date to YYYY-MM-DD', async () => {
    const { rows } = await mapV1Blob(USER, {
      trainers: [
        {
          id: 1,
          sessions: [
            { id: 10, date: '2026-02-03' },
            { id: 11, date: '2026-02-04T22:00:00.000Z' },
          ],
        },
      ],
    });
    expect(rows.trainer_sessions.map((r) => r.session_date)).toEqual(['2026-02-03', '2026-02-04']);
  });
});
