import {
  dehydrate,
  hydrate,
  onlineManager,
  type DehydratedState,
  type QueryClient,
} from '@tanstack/react-query';
import { openDB, type IDBPDatabase } from 'idb';
import { useEffect, useState } from 'react';

import { registerMutationDefaults } from './mutations';

/**
 * Offline: the cache that survives a cold start, and the outbox that replays what
 * was written with no signal.
 *
 * The scene this is built for is the whole reason the app exists as a phone app:
 * a basement gym with no bars, a session logged anyway, and the app closed before
 * the walk home. Two separate things have to work for that.
 *
 * **Reading.** The successful queries are written to IndexedDB and hydrated back at
 * startup, so opening the app in the basement shows last week's weights rather than
 * an empty screen. The programme itself — every exercise, technique text and poster
 * — is in the bundle already, and never depended on this.
 *
 * **Writing.** A mutation started while offline is not failed and not lost: Query
 * pauses it, and a paused mutation is persisted along with the cache. On reconnect,
 * or on the next launch, the paused mutations are replayed **in the order they were
 * made**. Order is not a detail. Ticking a set and then correcting the weight are
 * two writes to the same row, and replaying them backwards would store the
 * correction and then undo it.
 *
 * Nothing here writes to `localStorage`. The old app kept its state there and had a
 * documented failure when it filled; IndexedDB has room and does not block the main
 * thread while a set is being ticked.
 */

const DB_NAME = 'vw-sync';
const STORE = 'cache';
const RECORD = 'react-query';

/**
 * Bumped when the persisted shape changes in a way an old record cannot survive.
 * Hydrating yesterday's shape into today's build is how a cache turns into a
 * crash, and there is no migration worth writing for a cache: it is a copy of the
 * server, and throwing it away costs one fetch.
 */
const FORMAT = 1;

/** A week. Old enough that the person has been away, not old enough to be a lie. */
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type Persisted = { format: number; savedAt: number; state: DehydratedState };

let handle: Promise<IDBPDatabase> | null = null;

function database(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === 'undefined') return null; // tests, and private modes that block it
  handle ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
  return handle;
}

/**
 * What gets written down.
 *
 * Only successful queries, and only paused mutations. A failed query is not worth
 * restoring, and a mutation that is merely in flight will be retried by the tab
 * that owns it — persisting it would replay it twice.
 */
export function snapshot(client: QueryClient): DehydratedState {
  return dehydrate(client, {
    shouldDehydrateQuery: (query) => query.state.status === 'success',
    shouldDehydrateMutation: (mutation) => mutation.state.isPaused,
  });
}

/**
 * Reads the cache back and replays whatever was waiting.
 *
 * `registerMutationDefaults` has to happen first. A restored mutation is a key and
 * its variables and nothing else, so if the key is unknown when it is resumed there
 * is no function to run and the write is dropped silently — the one failure mode
 * this whole file exists to prevent.
 */
export async function restoreCache(client: QueryClient): Promise<void> {
  registerMutationDefaults(client);

  const db = database();
  if (!db) return;

  try {
    const record = (await (await db).get(STORE, RECORD)) as Persisted | undefined;
    if (!record) return;

    if (record.format !== FORMAT || Date.now() - record.savedAt > MAX_AGE) {
      await (await db).delete(STORE, RECORD);
      return;
    }

    hydrate(client, record.state);

    // Online, this sends the backlog now. Offline, the mutations stay paused and
    // Query resumes them itself when the connection returns.
    if (onlineManager.isOnline()) await client.resumePausedMutations();
  } catch {
    // A cache that cannot be read is not an error worth showing anyone: the app
    // works without it, one fetch slower. Storage is blocked in some private modes
    // and full in others, and neither should keep someone out of their programme.
    await clearCache();
  }
}

/**
 * Keeps the record up to date. Returns the function that stops it.
 *
 * Debounced, because a fetch that lands settles a dozen queries in the same tick
 * and each one notifies. One write per burst; the delay is short enough that
 * closing the app straight after ticking a set still saves it.
 */
export function persistCache(client: QueryClient, delay = 800): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = async () => {
    timer = null;
    const db = database();
    if (!db) return;
    const record: Persisted = { format: FORMAT, savedAt: Date.now(), state: snapshot(client) };
    try {
      await (await db).put(STORE, record, RECORD);
    } catch {
      // Out of quota, or storage blocked. Nothing to do about it here, and losing
      // the persisted copy must not take the running app with it.
    }
  };

  const schedule = () => {
    if (timer) return;
    timer = setTimeout(write, delay);
  };

  const unsubscribeQueries = client.getQueryCache().subscribe(schedule);
  const unsubscribeMutations = client.getMutationCache().subscribe(schedule);

  // A tab being closed or backgrounded is the moment the pending write matters
  // most, and the debounce timer is exactly what will not survive it.
  const flush = () => {
    if (timer) clearTimeout(timer);
    void write();
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', flush);

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribeQueries();
    unsubscribeMutations();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', flush);
  };
}

export async function clearCache(): Promise<void> {
  const db = database();
  if (!db) return;
  try {
    await (await db).delete(STORE, RECORD);
  } catch {
    /* nothing to clear, or nowhere to clear it from */
  }
}

/** How many writes are still waiting. For a status line, and for the tests. */
export function pendingWrites(client: QueryClient): number {
  return client.getMutationCache().getAll().filter((mutation) => mutation.state.isPaused).length;
}

/**
 * Restores the cache once, then keeps it written.
 *
 * `ready` stays false until the restore settles. Rendering before it lands would
 * show an empty screen and then flash the real data in behind it, which on a cold
 * start in a gym is the difference between "the app lost my weights" and "the app
 * opened".
 */
export function useOfflineCache(client: QueryClient): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;

    void restoreCache(client).finally(() => {
      if (!active) return;
      stop = persistCache(client);
      setReady(true);
    });

    return () => {
      active = false;
      stop?.();
    };
  }, [client]);

  return ready;
}
