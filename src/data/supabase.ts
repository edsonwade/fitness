import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client.
 *
 * These are the same project and publishable key the previous implementation used,
 * carried across so existing accounts keep working. The publishable key is public by
 * design and is safe in a static bundle: Row Level Security is what actually scopes
 * every read and write to `auth.uid()`. A `service_role` key must never appear here.
 *
 * GitHub Pages serves static files with no server (plan D11), so the browser talks
 * to Supabase directly.
 */
const SUPABASE_URL = 'https://loiiwelbzbweacpwpzil.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_739Cd4HJWV5VWDeOZ765XQ_QwiBDIow';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Maps Supabase's English auth errors onto our own codes.
 *
 * Carried over from the previous implementation, which learned these strings the
 * hard way. Matching on the message is fragile but it is what the API gives us, so
 * the unknown case has to stay graceful rather than leaking a raw English string
 * into a Portuguese interface.
 */
export type AuthErrorCode =
  | 'NO_ACCOUNT'
  | 'EXISTS'
  | 'UNCONFIRMED'
  | 'RATE_LIMIT'
  | 'WEAK_PASSWORD'
  | 'OFFLINE'
  | 'UNKNOWN';

export function authErrorCode(message: string): AuthErrorCode {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'NO_ACCOUNT';
  if (m.includes('already registered') || m.includes('already been registered')) return 'EXISTS';
  if (m.includes('email not confirmed')) return 'UNCONFIRMED';
  if (m.includes('rate limit') || m.includes('too many')) return 'RATE_LIMIT';
  if (m.includes('password') && m.includes('weak')) return 'WEAK_PASSWORD';
  if (m.includes('fetch') || m.includes('network')) return 'OFFLINE';
  return 'UNKNOWN';
}
