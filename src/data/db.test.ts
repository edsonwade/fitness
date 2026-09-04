import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * How a write leaves this application — the verb, not the payload.
 *
 * There is one test here and it is about a single word in the HTTP request, which
 * looks like a strange thing to protect until you know what it cost. Removing an
 * exercise from the shared catalogue was refused by the database with
 * `42501 new row violates row-level security policy`, and stayed refused across a
 * migration written specifically to allow it, because PostgREST sends an upsert as
 * `insert ... on conflict do update` and Postgres judges the *insert* policy on the
 * offered row before it ever reaches the update branch. That policy is
 * `created_by = auth.uid()`, the payload carries the original author on purpose, and
 * so every edit of somebody else's published exercise was refused no matter what the
 * update policy said.
 *
 * An update has no insert branch. That is the whole fix, and it is invisible in the
 * payload — the same fields, sent with a different verb — so nothing but this test
 * would notice it being undone.
 */

type Call = { op: string; args: unknown[] };

const calls: Call[] = [];
let answer: { data: unknown; error: unknown } = { data: null, error: null };

/** Records the chain and answers whatever the test set up. */
function builder(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  for (const op of ['upsert', 'update', 'insert', 'eq', 'select', 'single', 'maybeSingle']) {
    chain[op] = (...args: unknown[]) => {
      calls.push({ op, args });
      return op === 'single' || op === 'maybeSingle' ? Promise.resolve(answer) : chain;
    };
  }
  return chain;
}

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => {
      calls.push({ op: 'from', args: [table] });
      return builder();
    },
  },
  authErrorCode: () => 'UNKNOWN',
}));

const { SharedRowUnreachableError, upsertRow } = await import('./db');

const AUTHOR = '44444444-4444-4444-8444-444444444444';
const ROW_ID = '22222222-2222-4222-8222-222222222222';

const published = {
  id: ROW_ID,
  ex_key: 's:remada',
  name_pt: 'remada',
  name_en: null,
  kind: 'comp',
  equipment: null,
  sets: null,
  reps: null,
  load: null,
  rest: null,
  video_id: null,
  photo_url: null,
  deleted: true,
  created_by: AUTHOR,
  created_at: '2026-09-04T16:31:04.650740+00:00',
  updated_at: '2026-09-04T16:40:00.000000+00:00',
  updated_by_client: 'c',
};

beforeEach(() => {
  calls.length = 0;
  answer = { data: null, error: null };
});

describe('writing a row of the shared catalogue', () => {
  it('sends an update keyed on the row, never an upsert', async () => {
    answer = { data: published, error: null };

    await upsertRow('catalog_exercises', { ...published });

    expect(calls.map((c) => c.op)).toEqual(['from', 'update', 'eq', 'select', 'maybeSingle']);
    expect(calls.find((c) => c.op === 'eq')?.args).toEqual(['id', ROW_ID]);
  });

  it('keeps the author of the row it is changing', async () => {
    answer = { data: published, error: null };

    await upsertRow('catalog_exercises', { ...published });

    const sent = calls.find((c) => c.op === 'update')?.args[0] as Record<string, unknown>;
    expect(sent.created_by, 'editing must not transfer authorship').toBe(AUTHOR);
  });

  it('refuses to guess when the update changed nothing', async () => {
    answer = { data: null, error: null };

    await expect(upsertRow('day_additions', { ...published, day_no: 101 })).rejects.toBeInstanceOf(
      SharedRowUnreachableError,
    );
  });

  it('says which column it needed when the row carries no key', async () => {
    const noKey: Record<string, unknown> = { ...published };
    delete noKey.id;

    await expect(upsertRow('catalog_exercises', noKey)).rejects.toThrow(/precisa de id/);
    expect(calls, 'nothing may be sent without a key to send it to').toEqual([]);
  });
});

describe('writing a private row', () => {
  it('still upserts, because those rows are created here', async () => {
    answer = {
      data: { user_id: AUTHOR, day_no: 3, ex_key: 's:remada', updated_at: published.updated_at },
      error: null,
    };

    await upsertRow('hidden_items', { user_id: AUTHOR, day_no: 3, ex_key: 's:remada' });

    expect(calls.map((c) => c.op)).toEqual(['from', 'upsert', 'select', 'single']);
  });
});
