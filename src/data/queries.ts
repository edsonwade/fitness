import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useSessionState } from '../features/auth/session-context';
import { fetchRows } from './db';
import type { RowOf, TableName } from './entities';
import { dbKeys, SCOPE_COLUMN, type Scope } from './keys';

/**
 * Reading. One hook, because thirteen near-identical hooks would be thirteen
 * places to forget the user id or the scope.
 *
 * Screens are expected to wrap this in something that speaks their language —
 * `useGoals()`, `useTrainers()` — where there is anything to add, such as a sort or
 * a derived value. Where there is nothing to add, calling this directly is honest.
 */

export function useUserId(): string | null {
  return useSessionState().session?.user.id ?? null;
}

export function useRows<T extends TableName>(
  table: T,
  scope: Scope = [],
  options: { enabled?: boolean } = {},
): UseQueryResult<RowOf<T>[]> {
  const userId = useUserId();
  const needsScope = SCOPE_COLUMN[table] !== undefined;

  return useQuery({
    queryKey: dbKeys.rows(userId ?? 'anon', table, scope),
    queryFn: () => fetchRows(table, userId!, scope),
    // Signed out there is nothing to read, and a scoped table with no scope would
    // ask for every session's entries at once. Both are disabled rather than
    // handled, so neither can fire a query that would be wrong to answer.
    enabled: (options.enabled ?? true) && userId !== null && (!needsScope || scope.length > 0),
  });
}

/**
 * The two tables that hold exactly one row per user.
 *
 * They are stored as lists like everything else, so realtime, invalidation and the
 * optimistic path have one shape to handle rather than two. The unwrapping happens
 * here, once. `null` means the row has not been created yet, which is the real
 * state of a person who has signed up and not finished onboarding.
 */
export function useSingletonRow<T extends 'user_profiles' | 'user_settings'>(
  table: T,
): UseQueryResult<RowOf<T>[]> & { row: RowOf<T> | null } {
  const query = useRows(table);
  return { ...query, row: query.data?.[0] ?? null } as UseQueryResult<RowOf<T>[]> & {
    row: RowOf<T> | null;
  };
}
