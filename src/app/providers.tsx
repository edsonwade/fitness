import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        // Mutations are not retried blindly here. Phase 3 owns the offline outbox,
        // and a retry policy invented now would have to be unpicked to build it.
        retry: 0,
      },
    },
  });
}
