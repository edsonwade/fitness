import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';

import { clientId, isOwnEcho, stamp } from './client-id';
import { exerciseLogSchema, type ExerciseLog } from './entities';
import { dbKeys, rowId } from './keys';
import { applyChange, createChangeQueue, type DbChange } from './realtime';
import { hold, onFree, resetHolds } from './repaint-guard';
import { applyIncoming, applyOptimistic } from './row-cache';

/**
 * The rules that decide what a screen shows when two devices are awake at once.
 *
 * These are tested here, away from React, because every one of them is a decision
 * about data and not about rendering: which row wins, when a change is allowed to
 * land, and what happens to a payload this build cannot read. Testing them through
 * a component would only add ways for the test to fail for reasons that are not
 * these rules.
 */

const USER = '11111111-1111-4111-8111-111111111111';

function log(over: Partial<ExerciseLog> = {}): ExerciseLog {
  return {
    user_id: USER,
    day_no: 1,
    block: 'A',
    ex_key: 'supino',
    weight: '60',
    reps: '10',
    sets_done: [true, false, false],
    note: null,
    field_updated_at: {},
    updated_at: '2026-08-31T10:00:00.000Z',
    updated_by_client: null,
    ...over,
  };
}

/** What `useMergeExerciseLog` seeds a brand-new row with. */
const SEED = {
  weight: null,
  reps: null,
  note: null,
  sets_done: [],
  field_updated_at: {},
  updated_at: new Date(0).toISOString(),
  updated_by_client: null,
} satisfies Partial<ExerciseLog>;

function change(row: ExerciseLog, eventType: DbChange['eventType'] = 'UPDATE'): DbChange {
  return { table: 'exercise_logs', eventType, row: row as unknown as Record<string, unknown> };
}

function cacheOf(client: QueryClient): ExerciseLog[] | undefined {
  return client.getQueryData<ExerciseLog[]>(dbKeys.rows(USER, 'exercise_logs'));
}

afterEach(() => resetHolds());

describe('applyChange', () => {
  it('inserts a row the cache has never seen', () => {
    const client = new QueryClient();
    client.setQueryData(dbKeys.rows(USER, 'exercise_logs'), []);

    applyChange(client, USER, change(log(), 'INSERT'));

    expect(cacheOf(client)).toHaveLength(1);
    expect(cacheOf(client)![0].weight).toBe('60');
  });

  it('replaces a row in place, keeping its position in the list', () => {
    const client = new QueryClient();
    const first = log({ ex_key: 'agachamento' });
    const second = log({ ex_key: 'supino' });
    client.setQueryData(dbKeys.rows(USER, 'exercise_logs'), [first, second]);

    applyChange(
      client,
      USER,
      change(log({ ex_key: 'agachamento', weight: '80', updated_at: '2026-08-31T11:00:00.000Z' })),
    );

    const rows = cacheOf(client)!;
    expect(rows.map((r) => r.ex_key)).toEqual(['agachamento', 'supino']);
    expect(rows[0].weight).toBe('80');
  });

  it('ignores a change older than what the cache already holds', () => {
    const client = new QueryClient();
    client.setQueryData(dbKeys.rows(USER, 'exercise_logs'), [
      log({ weight: '80', updated_at: '2026-08-31T12:00:00.000Z' }),
    ]);

    // A backlog arriving after a reconnect, carrying the weight from before.
    applyChange(client, USER, change(log({ weight: '60', updated_at: '2026-08-31T10:00:00.000Z' })));

    expect(cacheOf(client)![0].weight).toBe('80');
  });

  it('removes the row on a delete', () => {
    const client = new QueryClient();
    client.setQueryData(dbKeys.rows(USER, 'exercise_logs'), [log(), log({ ex_key: 'remada' })]);

    applyChange(client, USER, change(log(), 'DELETE'));

    expect(cacheOf(client)!.map((r) => r.ex_key)).toEqual(['remada']);
  });

  it('marks the query stale instead of throwing when the payload does not parse', () => {
    const client = new QueryClient();
    const key = dbKeys.rows(USER, 'exercise_logs');
    client.setQueryData(key, [log()]);

    // What a tab open across a release sees: a column this build has never heard of,
    // and a required one missing.
    const alien = { user_id: USER, day_no: 1, block: 'A', ex_key: 'supino', rpe: 8 };
    expect(() =>
      applyChange(client, USER, { table: 'exercise_logs', eventType: 'UPDATE', row: alien }),
    ).not.toThrow();

    expect(cacheOf(client)).toHaveLength(1);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it('files a scoped table under its parent, not under the table alone', () => {
    const client = new QueryClient();
    const sessionId = '22222222-2222-4222-8222-222222222222';
    const entry = {
      session_id: sessionId,
      idx: 0,
      user_id: USER,
      name: 'Supino',
      target_sets: '4',
      target_reps: '10',
      target_raw: null,
      sets_done: 4,
      sets_total: 4,
      weight: '60',
      reps: '10',
      note: null,
      updated_at: '2026-08-31T10:00:00.000Z',
      updated_by_client: null,
    };

    applyChange(client, USER, { table: 'session_entries', eventType: 'INSERT', row: entry });

    expect(client.getQueryData(dbKeys.rows(USER, 'session_entries', [sessionId]))).toHaveLength(1);
    expect(client.getQueryData(dbKeys.rows(USER, 'session_entries'))).toBeUndefined();
  });
});

describe('the repaint guard', () => {
  it('holds changes while a sheet is open and applies them when it closes', () => {
    const applied: DbChange[] = [];
    const queue = createChangeQueue((c) => applied.push(c));
    onFree(queue.flush);

    const release = hold();
    queue.push(change(log({ weight: '80' })));
    expect(applied).toHaveLength(0);
    expect(queue.size).toBe(1);

    release();
    expect(applied).toHaveLength(1);
    expect((applied[0].row as unknown as ExerciseLog).weight).toBe('80');
  });

  it('keeps only the last state of a row, and the order between rows', () => {
    const applied: DbChange[] = [];
    const queue = createChangeQueue((c) => applied.push(c));
    onFree(queue.flush);

    const release = hold();
    queue.push(change(log({ ex_key: 'supino', weight: '60' })));
    queue.push(change(log({ ex_key: 'remada', weight: '40' })));
    queue.push(change(log({ ex_key: 'supino', weight: '65' })));
    queue.push(change(log({ ex_key: 'supino', weight: '70' })));
    release();

    expect(applied.map((c) => (c.row as unknown as ExerciseLog).ex_key)).toEqual([
      'supino',
      'remada',
    ]);
    expect((applied[0].row as unknown as ExerciseLog).weight).toBe('70');
  });

  it('needs every hold released, not just the first', () => {
    const applied: DbChange[] = [];
    const queue = createChangeQueue((c) => applied.push(c));
    onFree(queue.flush);

    const sheet = hold();
    const menu = hold();
    queue.push(change(log()));

    sheet();
    expect(applied).toHaveLength(0);
    menu();
    expect(applied).toHaveLength(1);
  });

  it('applies immediately when nothing is held', () => {
    const applied: DbChange[] = [];
    const queue = createChangeQueue((c) => applied.push(c));
    queue.push(change(log()));
    expect(applied).toHaveLength(1);
  });
});

describe('echo suppression', () => {
  it('recognises this tab’s own write and no one else’s', () => {
    const mine = stamp({ weight: '60' });
    expect(mine.updated_by_client).toBe(clientId());
    expect(isOwnEcho(mine)).toBe(true);

    expect(isOwnEcho({ updated_by_client: 'another-tab' })).toBe(false);
    expect(isOwnEcho({ updated_by_client: null })).toBe(false);
    expect(isOwnEcho(undefined)).toBe(false);
  });
});

describe('the optimistic path', () => {
  it('does not advance updated_at, so the server’s answer still wins', () => {
    const rows = [log({ weight: '60', updated_at: '2026-08-31T10:00:00.000Z' })];

    const optimistic = applyOptimistic(rows, 'exercise_logs', {
      user_id: USER,
      day_no: 1,
      block: 'A',
      ex_key: 'supino',
      weight: '65',
    });
    expect(optimistic[0].weight).toBe('65');
    expect(optimistic[0].updated_at).toBe('2026-08-31T10:00:00.000Z');

    const stored = log({ weight: '65', updated_at: '2026-08-31T10:00:01.000Z', note: 'boa' });
    const settled = applyIncoming(optimistic, 'exercise_logs', stored);
    expect(settled[0].note).toBe('boa');
  });

  it('adds the row when the user is logging an exercise for the first time', () => {
    const rows = applyOptimistic(
      [],
      'exercise_logs',
      { user_id: USER, day_no: 2, block: 'B', ex_key: 'remada', sets_done: [true] },
      SEED,
    );
    expect(rows).toHaveLength(1);
    expect(rowId('exercise_logs', rows[0])).toBe([USER, 2, 'B', 'remada'].join('\t'));
  });

  /*
   * The regression. Typing a load into an exercise with no log yet used to append
   * the patch itself, and the appended object had no `sets_done`. The day's progress
   * count read that column, threw on undefined, and the user was thrown out to the
   * route error screen in the middle of a session.
   */
  it('gives a first-time row every column, not only the ones edited', () => {
    const rows = applyOptimistic(
      [],
      'exercise_logs',
      { user_id: USER, day_no: 2, block: 'B', ex_key: 'remada', weight: '42' },
      SEED,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].sets_done).toEqual([]);
    expect(rows[0].weight).toBe('42');
    expect(() => rows[0].sets_done.filter(Boolean)).not.toThrow();
    expect(exerciseLogSchema.safeParse(rows[0]).success).toBe(true);
  });

  it('leaves the cache alone rather than append a row that is not a row', () => {
    const rows = applyOptimistic([], 'exercise_logs', {
      user_id: USER,
      day_no: 2,
      block: 'B',
      ex_key: 'remada',
      weight: '42',
    });
    expect(rows).toHaveLength(0);
  });

  it('does not let the seed overwrite what an existing row already holds', () => {
    const rows = applyOptimistic(
      [log({ weight: '60', sets_done: [true, true, false] })],
      'exercise_logs',
      { user_id: USER, day_no: 1, block: 'A', ex_key: 'supino', note: 'pesado' },
      SEED,
    );
    expect(rows[0].weight).toBe('60');
    expect(rows[0].sets_done).toEqual([true, true, false]);
    expect(rows[0].note).toBe('pesado');
  });
});
