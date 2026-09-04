import { hydrate, onlineManager, QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The outbox, tested the only way that means anything: by taking the network away
 * mid-workout and asking what happened to the sets.
 *
 * `db.ts` is mocked so nothing here talks to Supabase. What is under test is not
 * whether an upsert works — that is Postgres's job — but whether a write made with
 * no signal is still made, once, in the right order, after a reload.
 */

const calls: { op: string; table: string; payload: unknown }[] = [];

/*
 * Both the table writes AND the RPC are mocked. The RPC one is not optional: the
 * merge goes through `supabase.rpc`, and an unmocked client in a test file points
 * at the real project. A test suite must not be able to reach production, however
 * politely production refuses it.
 */
vi.mock('./supabase', () => ({
  supabase: {
    rpc: (name: string, args: Record<string, unknown>) => {
      calls.push({ op: 'rpc', table: name, payload: args });
      if (name === 'publish_shared_exercise') {
        // The shape `007` returns: the two stored rows, together, or nothing.
        const stored = { deleted: args.p_deleted, updated_at: '2026-08-31T10:00:00.000Z' };
        return Promise.resolve({
          data: {
            catalog: { ...stored, id: CATALOG_ID, ex_key: args.p_ex_key },
            addition: { ...stored, id: ADDITION_ID, ex_key: args.p_ex_key, day_no: args.p_day_no },
          },
          error: null,
        });
      }
      return Promise.resolve({ data: { ...args, user_id: USER }, error: null });
    },
  },
  authErrorCode: () => 'UNKNOWN',
}));

vi.mock('./db', () => ({
  upsertRow: (table: string, payload: Record<string, unknown>) => {
    calls.push({ op: 'upsert', table, payload });
    return Promise.resolve({ ...payload, updated_at: '2026-08-31T10:00:00.000Z' });
  },
  deleteRow: (table: string, key: Record<string, unknown>) => {
    calls.push({ op: 'delete', table, payload: key });
    return Promise.resolve();
  },
  parseRow: (_table: string, row: unknown) => row,
  parseRows: (_table: string, rows: unknown[]) => rows,
  SchemaDriftError: class extends Error {},
}));

const USER = '11111111-1111-4111-8111-111111111111';
const CATALOG_ID = '22222222-2222-4222-8222-222222222222';
const ADDITION_ID = '33333333-3333-4333-8333-333333333333';
/** Whoever published it. Not the person editing it: anyone may edit a published row. */
const AUTHOR = '44444444-4444-4444-8444-444444444444';

const { mutationKeys } = await import('./keys');
const { registerMutationDefaults } = await import('./mutations');
const { pendingWrites, snapshot } = await import('./outbox');

function clientWithDefaults(): QueryClient {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 0 } } });
  registerMutationDefaults(client);
  return client;
}

/** Starts a mutation the way a screen would, without React in the way. */
function write(client: QueryClient, key: readonly unknown[], variables: unknown) {
  const mutation = client.getMutationCache().build(client, { mutationKey: key });
  return mutation.execute(variables);
}

/**
 * A write that is already waiting, with no live retryer behind it.
 *
 * This is what a paused mutation looks like after the tab that made it is gone —
 * which is the state the persisted record describes. Executing one instead would
 * leave a retryer subscribed to the connection, and it would send the write itself
 * the moment the test went back online, proving something else entirely.
 */
function queued(client: QueryClient, key: readonly unknown[], variables: unknown) {
  client.getMutationCache().build(
    client,
    { mutationKey: key },
    {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: true,
      status: 'pending',
      submittedAt: Date.now(),
      variables,
    },
  );
}

beforeEach(() => {
  calls.length = 0;
  onlineManager.setOnline(true);
});

afterEach(() => {
  onlineManager.setOnline(true);
});

describe('a write made with no signal', () => {
  it('waits instead of failing, and is sent when the signal returns', async () => {
    const client = clientWithDefaults();
    onlineManager.setOnline(false);

    void write(client, mutationKeys.upsert('goals'), { user_id: USER, id: 'g1', title: 'Meta' });

    expect(calls).toHaveLength(0);
    expect(pendingWrites(client)).toBe(1);

    onlineManager.setOnline(true);
    await client.resumePausedMutations();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ op: 'upsert', table: 'goals' });
    // `resumePausedMutations` returns when the writes have been let go, not when
    // they have landed, so the queue empties a tick later.
    await vi.waitFor(() => expect(pendingWrites(client)).toBe(0));
  });

  it('replays in the order the person made them', async () => {
    const client = clientWithDefaults();
    onlineManager.setOnline(false);

    // Ticking a set, then correcting the weight. Backwards, the correction is
    // stored and then undone.
    void write(client, mutationKeys.upsert('exercise_logs'), {
      user_id: USER, day_no: 1, block: 'A', ex_key: 'supino', sets_done: [true],
    });
    void write(client, mutationKeys.upsert('exercise_logs'), {
      user_id: USER, day_no: 1, block: 'A', ex_key: 'supino', weight: '65',
    });
    void write(client, mutationKeys.upsert('rest_preferences'), {
      user_id: USER, ex_key: 'supino', seconds: 90,
    });

    expect(pendingWrites(client)).toBe(3);

    onlineManager.setOnline(true);
    await client.resumePausedMutations();

    expect(calls.map((c) => c.table)).toEqual([
      'exercise_logs',
      'exercise_logs',
      'rest_preferences',
    ]);
    expect((calls[0].payload as { sets_done: boolean[] }).sets_done).toEqual([true]);
    expect((calls[1].payload as { weight: string }).weight).toBe('65');
  });

  it('carries this tab’s client id, so the echo can be recognised on arrival', async () => {
    const client = clientWithDefaults();
    await write(client, mutationKeys.upsert('goals'), { user_id: USER, id: 'g1' });

    expect((calls[0].payload as { updated_by_client?: string }).updated_by_client).toBeTruthy();
  });
});

describe('a write that outlives the app being closed', () => {
  it('is written down, read back and sent by the next launch', async () => {
    const before = clientWithDefaults();
    onlineManager.setOnline(false);

    queued(before, mutationKeys.mergeLog(), {
      user_id: USER,
      day_no: 2,
      block: 'B',
      ex_key: 'remada',
      fields: { sets_done: [true, true] },
      changedAt: '2026-08-31T18:30:00.000Z',
    });

    // What `persistCache` puts in IndexedDB.
    const persisted = JSON.parse(JSON.stringify(snapshot(before)));
    expect(persisted.mutations).toHaveLength(1);

    // The app is opened again: a new client, nothing in memory but what was
    // written down.
    const after = clientWithDefaults();
    hydrate(after, persisted);
    expect(pendingWrites(after)).toBe(1);

    onlineManager.setOnline(true);
    await after.resumePausedMutations();

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({ op: 'rpc', table: 'merge_exercise_log' });
    // The instant the set was ticked, not the instant it was finally sent. This is
    // what the field-by-field merge in `003` compares against.
    expect((calls[0].payload as { p_at: string }).p_at).toBe('2026-08-31T18:30:00.000Z');

    const restored = after.getMutationCache().getAll()[0];
    expect(restored.state.variables).toMatchObject({
      ex_key: 'remada',
      changedAt: '2026-08-31T18:30:00.000Z',
    });
  });

  it('does not write down what is merely in flight', () => {
    const client = clientWithDefaults();
    const state = snapshot(client);
    expect(state.mutations).toHaveLength(0);
  });
});

/**
 * The regression that made `007` exist.
 *
 * Publishing writes two rows, and they are worthless apart: an addition with no
 * exercise behind it is a card `resolveDayEntries` refuses to draw, in a table every
 * account reads. While the client sent them as two upserts, one could land and the
 * other be refused, and the leftover was invisible.
 *
 * The obvious client-side fix — await the first, then send the second — is what these
 * tests rule out rather than check. A paused mutation is resumed from a record in
 * IndexedDB, and by then the `await`'s continuation is gone with the tab that made it:
 * the catalogue row would replay and the day addition would never be sent at all. So
 * the property under test is that publishing is ONE unit, from the outbox's side.
 */
function publication(overrides: Record<string, unknown> = {}) {
  return {
    owner_id: USER,
    client: 'tab-1',
    ex_key: 's:novo',
    day_no: 1,
    deleted: false,
    name_pt: 'Agachamento búlgaro',
    kind: 'comp',
    equipment: null,
    sets: '4',
    reps: '8',
    load: null,
    rest: null,
    video_id: null,
    photo_url: null,
    catalog: { id: CATALOG_ID, created_by: USER, created_at: '2026-09-04T10:00:00.000Z' },
    addition: { id: ADDITION_ID, created_by: USER, created_at: '2026-09-04T10:00:00.000Z' },
    ...overrides,
  };
}

describe('publicar um exercício', () => {
  it('is one write, not two, so half of it cannot be sent', async () => {
    const client = clientWithDefaults();
    onlineManager.setOnline(false);

    void write(client, mutationKeys.publishShared(), publication());

    expect(pendingWrites(client)).toBe(1);

    onlineManager.setOnline(true);
    await client.resumePausedMutations();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ op: 'rpc', table: 'publish_shared_exercise' });
    // The two tables are never touched directly. If either of these ever appears
    // here again, the pair can come apart on the wire.
    expect(calls.some((c) => c.table === 'catalog_exercises')).toBe(false);
    expect(calls.some((c) => c.table === 'day_additions')).toBe(false);
  });

  it('survives the app being closed with both halves still attached', async () => {
    const before = clientWithDefaults();
    onlineManager.setOnline(false);

    queued(before, mutationKeys.publishShared(), publication());
    const persisted = JSON.parse(JSON.stringify(snapshot(before)));

    const after = clientWithDefaults();
    hydrate(after, persisted);
    expect(pendingWrites(after)).toBe(1);

    onlineManager.setOnline(true);
    await after.resumePausedMutations();

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    const sent = calls[0].payload as Record<string, unknown>;
    expect(calls[0].table).toBe('publish_shared_exercise');
    // Both rows still described by the replayed call, an hour and a reload later.
    expect(sent.p_ex_key).toBe('s:novo');
    expect(sent.p_day_no).toBe(1);
    expect(sent.p_name_pt).toBe('Agachamento búlgaro');
    expect(sent.p_deleted).toBe(false);
  });

  it('puts both stored rows in the cache of the account reading them', async () => {
    const client = clientWithDefaults();
    await write(client, mutationKeys.publishShared(), publication());

    expect(client.getQueryData(['db', USER, 'catalog_exercises'])).toMatchObject([
      { id: CATALOG_ID, ex_key: 's:novo' },
    ]);
    expect(client.getQueryData(['db', USER, 'day_additions'])).toMatchObject([
      { id: ADDITION_ID, day_no: 1 },
    ]);
  });

  it('takes both away again when the exercise is unpublished', async () => {
    const client = clientWithDefaults();
    await write(client, mutationKeys.publishShared(), publication());
    await write(client, mutationKeys.publishShared(), publication({ deleted: true }));

    // `fetchRows` reads `deleted = false`, so a soft-deleted row that stayed in the
    // cache would disagree with the next refetch — the bug `applyChange` documents.
    expect(client.getQueryData(['db', USER, 'catalog_exercises'])).toEqual([]);
    expect(client.getQueryData(['db', USER, 'day_additions'])).toEqual([]);
  });
});

/**
 * The catalogue screen, where a published exercise is edited and removed.
 *
 * That screen writes the catalogue row on its own — no day is open, so there is no
 * addition to write with it — and so it goes through the plain upsert rather than
 * through `007`. Both tests here are about the same fact: on these two tables the
 * owner column is the AUTHOR, and the cache is keyed by the READER.
 *
 * What is not covered: the optimistic patch, which lives in `useUpsertRow` and needs
 * React to run. These exercise the stored row coming back.
 */
describe('editar o que outra pessoa publicou', () => {
  const published = {
    id: CATALOG_ID,
    ex_key: 's:agachamento',
    name_pt: 'Agachamento',
    created_by: AUTHOR,
    deleted: false,
    updated_at: '2026-08-01T10:00:00.000Z',
  };

  /** What the screen has on screen: the shared table, read by the signed-in account. */
  function withCatalogRead(): QueryClient {
    const client = clientWithDefaults();
    client.setQueryData(['db', USER, 'catalog_exercises'], [published]);
    return client;
  }

  it('puts the stored row in the reader’s cache and not the author’s', async () => {
    const client = withCatalogRead();

    await write(client, mutationKeys.upsert('catalog_exercises'), {
      ...published,
      name_pt: 'Agachamento frontal',
    });

    expect(client.getQueryData(['db', USER, 'catalog_exercises'])).toMatchObject([
      { id: CATALOG_ID, name_pt: 'Agachamento frontal' },
    ]);
    // Keyed by `created_by`, the stored row landed here, where nothing reads it, and
    // the editor was left looking at their own guess until the next reload.
    expect(client.getQueryData(['db', AUTHOR, 'catalog_exercises'])).toBeUndefined();
  });

  it('takes it off the screen of whoever removed it', async () => {
    const client = withCatalogRead();

    await write(client, mutationKeys.upsert('catalog_exercises'), {
      ...published,
      deleted: true,
    });

    // Realtime cannot do this one: the echo of our own write is dropped on purpose,
    // so a row left in the cache with the flag set stays visible to the one account
    // that asked for it to go.
    expect(client.getQueryData(['db', USER, 'catalog_exercises'])).toEqual([]);
  });
});
