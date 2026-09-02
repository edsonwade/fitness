import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useOfflineCache } from '../data/outbox';

/**
 * Application providers.
 *
 * One place, so a new provider is added here rather than being wrapped around
 * something arbitrary in the tree.
 *
 * The client is created inside state rather than as a module constant. A module
 * constant is shared by every render of every test file in the same process, so one
 * test's cached queries leak into the next; created here, each mount gets its own.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);

  // Nothing renders until the persisted cache has been read back. It is one
  // IndexedDB read, and doing it first is what stops a cold start in a basement gym
  // from showing an empty programme for a frame before last week's weights arrive.
  const ready = useOfflineCache(client);
  useDevHandle(client);

  return (
    <QueryClientProvider client={client}>{ready ? children : null}</QueryClientProvider>
  );
}

/**
 * Puts the query client on `window`, for development and for the validation build.
 *
 * The data layer has no screens of its own yet, and the project rule is that a phase
 * is proven in the running application rather than in its tests. Without a handle
 * there is nothing to drive from the browser: the offline queue cannot be filled and
 * the persisted record cannot be shown to exist.
 *
 * The offline gate has to be proven on a BUILT app, because reloading with the
 * network down is the service worker's job and there is no service worker in dev.
 * So the handle is available in dev, and in a build made explicitly for validation
 * with `VITE_EXPOSE_QUERY_CLIENT=1`. Both are build-time constants, so the deployed
 * bundle — built without that variable — does not contain this at all.
 */
function useDevHandle(client: QueryClient): void {
  useEffect(() => {
    if (!import.meta.env.DEV && !import.meta.env.VITE_EXPOSE_QUERY_CLIENT) return;
    (window as unknown as { __vw?: unknown }).__vw = { client };
    return () => {
      delete (window as unknown as { __vw?: unknown }).__vw;
    };
  }, [client]);
}

/**
 * Query defaults, chosen against the operating context in PRODUCT.md rather than
 * against the library's own defaults.
 *
 * `refetchOnWindowFocus` is off. The scene is a phone put down between sets and
 * picked up again, so focus fires constantly; refetching on every pickup would
 * repaint a screen the user is reading mid-set, which is the exact failure the
 * session listener was already written to avoid.
 *
 * `retry: 2` with a capped backoff, because gym wifi drops rather than fails
 * cleanly, and a single attempt turns a two-second dropout into an error screen.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        /*
         * A day, not the library's five minutes. The cache is written to IndexedDB
         * and read back on the next launch, and only what is still in memory gets
         * written: a five-minute lifetime would mean a phone left on the bench for
         * ten minutes saves nothing to open with tomorrow.
         */
        gcTime: 24 * 60 * 60_000,
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        /*
         * `networkMode: 'online'` is the default and is named here because the
         * outbox depends on it: offline, a mutation is PAUSED rather than failed,
         * and a paused mutation is what gets persisted and replayed. Switching this
         * to 'always' would make every write fail in the gym instead of waiting.
         *
         * The retries are for the other kind of bad connection — the one that is
         * technically online and drops the request anyway, which is what gym wifi
         * mostly does.
         */
        networkMode: 'online',
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}
