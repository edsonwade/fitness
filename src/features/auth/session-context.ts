import { createContext, useContext } from 'react';

import type { SessionState } from './useSession';

/**
 * The session, read once and shared.
 *
 * Separated from the provider component so the file exports no components, which
 * keeps react-refresh able to hot-reload the provider without discarding state.
 *
 * `null` is the "no provider above me" case and is distinct from a resolved
 * `session: null`, which means signed out. Collapsing the two would turn a missing
 * provider into a silent sign-out instead of an error a developer can see.
 */
export const SessionContext = createContext<SessionState | null>(null);

export function useSessionState(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSessionState used outside <SessionProvider>');
  return value;
}
