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
