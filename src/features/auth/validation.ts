import { z } from 'zod';

/**
 * Gate validation, carried over from the previous implementation.
 *
 * These rules are product truth, not defaults I chose: the old gate rejected
 * unknown mail domains outright and demanded a letter, a digit and a symbol. Both
 * behaviours are preserved exactly so nobody who could register before is locked
 * out now, and nobody who was rejected before slips through.
 */

/**
 * The allow-list the old gate shipped. It exists to catch typos like `gmial.com`
 * before Supabase sends a confirmation nobody will ever receive, not to police
 * which provider anyone uses.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.pt',
  'hotmail.com',
  'hotmail.pt',
  'live.com',
  'live.pt',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yahoo.com',
  'yahoo.pt',
  'ymail.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'sapo.pt',
  'gmx.com',
  'gmx.net',
  'aol.com',
  'zoho.com',
] as const;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type EmailProblem = 'format' | 'domain' | null;

export function checkEmail(raw: string): EmailProblem {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_SHAPE.test(email)) return 'format';
  const domain = email.split('@')[1];
  return ALLOWED_EMAIL_DOMAINS.includes(domain as (typeof ALLOWED_EMAIL_DOMAINS)[number])
    ? null
    : 'domain';
}

export type PasswordProblem = 'short' | 'letter' | 'digit' | 'symbol' | null;

export function checkPassword(password: string): PasswordProblem {
  const pw = password ?? '';
  if (pw.length < 8) return 'short';
  if (!/[A-Za-z]/.test(pw)) return 'letter';
  if (!/[0-9]/.test(pw)) return 'digit';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'symbol';
  return null;
}

/** Four rules, shown as a live checklist rather than as one error after the fact. */
export function passwordRules(password: string) {
  const pw = password ?? '';
  return [
    { id: 'short', met: pw.length >= 8 },
    { id: 'letter', met: /[A-Za-z]/.test(pw) },
    { id: 'digit', met: /[0-9]/.test(pw) },
    { id: 'symbol', met: /[^A-Za-z0-9]/.test(pw) },
  ] as const;
}

export const signInSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1),
    email: z.string().trim(),
    password: z.string(),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });
