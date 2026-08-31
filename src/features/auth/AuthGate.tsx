import { useRef, useState } from 'react';
import clsx from 'clsx';

import { authErrorCode, supabase } from '../../data/supabase';
import { pt } from '../../i18n/pt';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { checkEmail, checkPassword, passwordRules } from './validation';

type Tab = 'signin' | 'signup';
type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>;

const c = pt.gate;

/**
 * The gate. Structure: Segmentado, candidate 3 of seven, seed f6923411.
 *
 * Sign in and create account live on one screen behind a selector, so the returning
 * case, which is the overwhelmingly common one, never changes route. The photograph
 * is a short band rather than a hero: this is the structure's named trade, and the
 * honest cost is that the world's photography carries less weight here than it does
 * deeper in the app.
 */
export function AuthGate() {
  const [tab, setTab] = useState<Tab>('signin');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const liveRegion = useRef<HTMLParagraphElement>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setErrors({});
    setNotice(null);
  }

  function emailError(): string | undefined {
    if (!email.trim()) return c.errEmailRequired;
    const problem = checkEmail(email);
    if (problem === 'format') return c.errEmailFormat;
    if (problem === 'domain') return c.errEmailDomain;
    return undefined;
  }

  async function onSignIn(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    const e = emailError();
    if (e) next.email = e;
    if (!password) next.password = c.errPasswordRequired;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);

    if (error) {
      const code = authErrorCode(error.message);
      setErrors({
        form:
          code === 'NO_ACCOUNT'
            ? c.errNoAccount
            : code === 'UNCONFIRMED'
              ? c.errUnconfirmed
              : code === 'RATE_LIMIT'
                ? c.errRateLimit
                : code === 'OFFLINE'
                  ? c.errOffline
                  : c.errUnknown,
      });
    }
    // Success needs no branch: the session listener swaps the screen.
  }

  async function onSignUp(event: React.FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = c.errNameRequired;
    const e = emailError();
    if (e) next.email = e;
    const pw = checkPassword(password);
    if (pw === 'short') next.password = c.errPasswordShort;
    else if (pw === 'letter') next.password = c.errPasswordLetter;
    else if (pw === 'digit') next.password = c.errPasswordDigit;
    else if (pw === 'symbol') next.password = c.errPasswordSymbol;
    if (password !== confirm) next.confirm = c.errConfirmMismatch;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setNotice(null);
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        data: { full_name: name.trim() },
      },
    });

    if (error) {
      setBusy(false);
      const code = authErrorCode(error.message);
      if (code === 'EXISTS') setErrors({ email: c.errExists });
      else setErrors({ form: code === 'OFFLINE' ? c.errOffline : c.errUnknown });
      return;
    }

    // Carried over from the previous implementation: register, sign straight back
    // out, and land on the sign-in tab with the email already filled. Supabase
    // returns a session even when confirmation is pending, and letting that session
    // through would drop an unconfirmed user into the app.
    await supabase.auth.signOut();
    setBusy(false);
    setPassword('');
    setConfirm('');
    setTab('signin');
    setNotice(c.createdBody);
  }

  const rules = passwordRules(password);

  return (
    <main className="min-h-[100dvh] bg-page py-0 sm:py-8">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[26.5rem] flex-col overflow-hidden bg-ground sm:min-h-0 sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        {/* The same wash that opens every other screen, so the gate is the app. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-wash-from from-15% via-wash-from/75 via-45% to-wash-to"
        />

        <GateBanner tab={tab} />

        <div className="relative flex flex-1 flex-col gap-6 px-7 pb-12 pt-5">
          <Segmented tab={tab} onChange={switchTab} />

          {notice ? (
            <p
              role="status"
              className="rounded-card border border-accent-line/35 bg-accent-soft px-4 py-3 font-ui text-[14px] leading-snug text-text"
            >
              <span className="font-700">{c.createdTitle}. </span>
              {notice}
            </p>
          ) : null}

          <form
            onSubmit={tab === 'signin' ? onSignIn : onSignUp}
            noValidate
            className="flex flex-col gap-5"
          >
            {tab === 'signup' ? (
              <Field
                label={c.name}
                placeholder={c.namePlaceholder}
                autoComplete="name"
                value={name}
                error={errors.name}
                onChange={(ev) => setName(ev.target.value)}
              />
            ) : null}

            <Field
              label={c.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              error={errors.email}
              onChange={(ev) => setEmail(ev.target.value)}
            />

            <Field
              label={c.password}
              revealable
              showLabel={c.show}
              hideLabel={c.hide}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              error={errors.password}
              onChange={(ev) => setPassword(ev.target.value)}
            />

            {tab === 'signup' ? (
              <>
                <PasswordRules rules={rules} />
                <Field
                  label={c.confirmPassword}
                  revealable
                  showLabel={c.show}
                  hideLabel={c.hide}
                  autoComplete="new-password"
                  value={confirm}
                  error={errors.confirm}
                  onChange={(ev) => setConfirm(ev.target.value)}
                />
              </>
            ) : null}

            {errors.form ? (
              <p
                ref={liveRegion}
                role="alert"
                className="rounded-card border border-danger/50 bg-danger/10 px-4 py-3 font-ui text-[14px] leading-snug text-danger"
              >
                {errors.form}
              </p>
            ) : null}

            <Button type="submit" loading={busy}>
              {busy
                ? tab === 'signin'
                  ? c.signingIn
                  : c.creating
                : tab === 'signin'
                  ? c.signIn
                  : c.signUp}
            </Button>
          </form>

          {tab === 'signin' ? <ForgotPassword email={email} /> : null}
        </div>
      </div>
    </main>
  );
}

/**
 * The photograph, in the world's own hero language: a rounded card with the title
 * on a scrim inside it, exactly as the Programs screen draws its hero.
 *
 * It was a full-bleed band bleeding into the ground, which on the light ground
 * washed the photograph to a pale grey and read as a rendering fault rather than
 * as a treatment. The reference never fades a photograph into the page; it puts
 * photographs inside heavily rounded cards and leaves them at full strength.
 *
 * The scrim is measured, not decorative: white on the darkened photograph is 4.5:1.
 */
function GateBanner({ tab }: { tab: Tab }) {
  return (
    <header className="relative px-7 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="relative overflow-hidden rounded-media shadow-[var(--shadow-float)]">
        <img
          src="/img/day-4.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
        <div className="relative flex min-h-[186px] flex-col justify-end p-5">
          <h1 className="font-ui text-[25px] font-700 leading-[1.12] tracking-[-0.01em] text-white">
            {tab === 'signin' ? c.welcomeBack : c.createAccount}
          </h1>
          <p className="mt-1.5 font-ui text-[13.5px] leading-snug text-white/85">
            {tab === 'signin' ? c.subtitleSignIn : c.subtitleSignUp}
          </p>
        </div>
      </div>
    </header>
  );
}

/**
 * The selector. Two real buttons in a tablist, not a styled checkbox, so the
 * keyboard and a screen reader both get the behaviour they expect.
 */
function Segmented({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const options: { id: Tab; label: string }[] = [
    { id: 'signin', label: c.tabSignIn },
    { id: 'signup', label: c.tabSignUp },
  ];

  return (
    <div
      role="tablist"
      aria-label="Entrar ou criar conta"
      className="grid grid-cols-2 gap-1 rounded-full bg-chip p-1"
    >
      {options.map((option) => {
        const active = tab === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={clsx(
              'min-h-[46px] rounded-full px-4 font-ui text-[14px] font-600',
              'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
              active
                ? 'bg-chip-selected text-chip-selected-ink shadow-[var(--shadow-card)]'
                : 'text-chip-ink pointer-hover:text-text',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The four password rules, shown live while typing rather than as one error after
 * a failed submit. A rule that has been met is not an error, so met rules are
 * stated in the accent and unmet ones stay muted.
 */
function PasswordRules({ rules }: { rules: ReturnType<typeof passwordRules> }) {
  const labels: Record<string, string> = {
    short: c.pwRuleShort,
    letter: c.pwRuleLetter,
    digit: c.pwRuleDigit,
    symbol: c.pwRuleSymbol,
  };

  return (
    <ul className="-mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={clsx(
            'flex items-center gap-1.5 font-ui text-[12px]',
            'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
            rule.met ? 'text-accent-line' : 'text-text-muted',
          )}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            {rule.met ? <path d="M5 13l4 4L19 7" /> : <circle cx="12" cy="12" r="8" strokeWidth={2} />}
          </svg>
          <span>{labels[rule.id]}</span>
        </li>
      ))}
    </ul>
  );
}

function ForgotPassword({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'need-email'>('idle');

  async function send() {
    if (checkEmail(email)) {
      setState('need-email');
      return;
    }
    setState('sending');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setState(error ? 'idle' : 'sent');
  }

  return (
    <div className="mt-auto pt-2 text-center">
      <button
        type="button"
        onClick={send}
        disabled={state === 'sending'}
        className="min-h-[44px] px-3 font-ui text-[13px] font-semibold text-text-muted underline underline-offset-4 transition-colors duration-[180ms] pointer-hover:text-text"
      >
        {state === 'sending' ? c.sendingReset : c.forgot}
      </button>
      {state === 'sent' ? (
        <p role="status" className="font-ui text-[13px] text-accent-line">
          {c.resetSent}
        </p>
      ) : null}
      {state === 'need-email' ? (
        <p role="alert" className="font-ui text-[13px] text-danger">
          {c.resetNeedEmail}
        </p>
      ) : null}
    </div>
  );
}
