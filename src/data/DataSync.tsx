import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';

import { dbKeys } from './keys';
import { useUserId } from './queries';
import { useRealtimeSync } from './realtime';

/**
 * The data layer's own lifecycle, mounted once between the session and the router.
 *
 * Two jobs, both of which have to happen above every screen rather than inside one:
 * the realtime subscription, and dropping a signed-out user's rows.
 *
 * Nothing here renders. It is a component rather than a hook called in `App` so that
 * `App` stays a tree of providers and reads as one.
 */
export function DataSync({ children }: { children: ReactNode }) {
  useRealtimeSync();
  useCacheResetOnUserChange();
  return children;
}

/**
 * Removes the previous user's cached rows when the signed-in user changes.
 *
 * Query keys already carry the user id, so nothing can be served to the wrong
 * account. This is about a shared phone: after signing out, someone else's weights
 * should not still be sitting in memory waiting for the back button. Signing out is
 * a change to `null`, which is why the effect keys on the transition and not on
 * whether a user is present.
 */
function useCacheResetOnUserChange(): void {
  const client = useQueryClient();
  const userId = useUserId();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current && previous.current !== userId) {
      client.removeQueries({ queryKey: dbKeys.user(previous.current) });
    }
    previous.current = userId;
  }, [client, userId]);
}
