import type { ReactNode } from 'react';

import { SessionContext } from './session-context';
import { useSession } from './useSession';

/**
 * Subscribes to Supabase auth exactly once for the whole application.
 *
 * `useSession` opens a real subscription, so calling it from each route guard would
 * open one per guard and leave them to drift apart under a token refresh. One
 * subscription, one answer, read through the context.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const state = useSession();
  return <SessionContext value={state}>{children}</SessionContext>;
}
