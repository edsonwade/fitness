import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../data/supabase';

export type SessionState = {
  session: Session | null;
  /** True until the first session read resolves, so the gate never flashes. */
  loading: boolean;
};

/**
 * Session lifecycle.
 *
 * One behaviour here is product truth carried over from the previous
 * implementation: **the UI must only rebuild when the user id actually changes**,
 * never on a token refresh. Supabase fires `TOKEN_REFRESHED` on a timer, and
 * treating every event as a login is what used to repaint the whole app mid-set.
 */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      currentUserId = data.session?.user.id ?? null;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      const nextUserId = next?.user.id ?? null;

      // A token refresh keeps the same user. Swap the session object so callers
      // hold a fresh token, but do not treat it as an identity change.
      if (nextUserId === currentUserId) {
        setSession(next);
        return;
      }

      currentUserId = nextUserId;
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
