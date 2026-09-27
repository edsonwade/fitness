import { useId, useRef, useState } from 'react';

import { authErrorCode, supabase } from '../../data/supabase';
import { LocalePicker } from '../../i18n/LocalePicker';
import { useT } from '../../i18n/locale-context';
import { rememberChoice, remembered } from './remember';
import { checkEmail, checkPassword } from './validation';

type Tab = 'signin' | 'signup';
type Social = 'google' | 'azure' | 'apple';
type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'form', string>>;


/**
 * The gate, as frames 2 and 3 of the v2 entry prototype — which copy the reference
 * photo he pinned on 2026-09-22 (fundo-vidro-e-entrada T4): the photograph full-bleed
 * behind everything and darkened towards the bottom, the title centred, small labels
 * above light fields, the filled button, and the switch between the two in the footer.
 *
 * No password rule is on screen before anything is typed. Only the first rule that is
 * still missing appears, and only once the field has text and has lost focus, or on
 * submit. His words: "desde quando é que aplicação premium aparece estas informações
 * antes de preencher?"
 */
export function AuthGate() {
  const c = useT().gate;
  const [tab, setTab] = useState<Tab>('signin');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [block, setBlock] = useState<'unconfirmed' | 'offline' | null>(null);
  const [resent, setResent] = useState(false);
  const [remember, setRemember] = useState(remembered);

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
    setBlock(null);
    rememberChoice(remember);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);

    if (error) {
      const code = authErrorCode(error.message);
      /*
       * Os três erros que acontecem a sério (`proto/v2/01-entrada.html` frame 4), cada um
       * com o que se passou e o que fazer: a palavra-passe errada no próprio campo, o email
       * por confirmar com "Enviar outra vez", e sem rede com o que continua a abrir.
       */
      if (code === 'NO_ACCOUNT') setErrors({ password: c.errNoAccount });
      else if (code === 'UNCONFIRMED') setBlock('unconfirmed');
      else if (code === 'OFFLINE') setBlock('offline');
      else setErrors({ form: code === 'RATE_LIMIT' ? c.errRateLimit : c.errUnknown });
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

  /*
   * Google · Outlook · Apple, a escolha dele para o B1 (frames 2 e 3 do protótipo). O
   * Outlook é a conta Microsoft, que no Supabase se chama `azure` e precisa do scope
   * `email`. O Supabase leva o browser ao provider e volta aqui; o listener da sessão
   * troca o ecrã como num login normal.
   */
  async function onSocial(provider: Social) {
    setErrors({});
    setNotice(null);
    rememberChoice(tab === 'signin' ? remember : true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        ...(provider === 'azure' ? { scopes: 'email' } : {}),
      },
    });
    if (error) {
      setErrors({ form: authErrorCode(error.message) === 'OFFLINE' ? c.errOffline : c.errUnknown });
    }
  }

  const [pwSeen, setPwSeen] = useState(false);
  const [confirmSeen, setConfirmSeen] = useState(false);

  function passwordHint(): string | undefined {
    if (errors.password) return errors.password;
    if (tab !== 'signup' || !pwSeen || !password) return undefined;
    const pw = checkPassword(password);
    if (pw === 'short') return c.errPasswordShort;
    if (pw === 'letter') return c.errPasswordLetter;
    if (pw === 'digit') return c.errPasswordDigit;
    if (pw === 'symbol') return c.errPasswordSymbol;
    return undefined;
  }

  function confirmHint(): string | undefined {
    if (errors.confirm) return errors.confirm;
    if (!confirmSeen || !confirm || confirm === password) return undefined;
    return c.errConfirmMismatch;
  }

  function go(next: Tab) {
    switchTab(next);
    setPwSeen(false);
    setConfirmSeen(false);
  }

  return (
    <main className="auth min-h-[100dvh]">
      <img
        className="auth-bg"
        src={`${import.meta.env.BASE_URL}img/onboard-welcome.jpg`}
        alt=""
        fetchPriority="high"
      />
      <div className="auth-veil" aria-hidden="true" />

      <form
        className="auth-body mx-auto w-full max-w-[26.5rem]"
        onSubmit={(ev) => {
          setPwSeen(true);
          setConfirmSeen(true);
          return tab === 'signin' ? onSignIn(ev) : onSignUp(ev);
        }}
        noValidate
      >
        <h1 className="auth-title">{tab === 'signin' ? c.signIn : c.signUp}</h1>

        {notice ? (
          <p role="status" className="mb-4 rounded-[8px] border border-white/20 bg-white/10 px-4 py-3 text-[14px] leading-snug">
            <span className="font-700">{c.createdTitle}. </span>
            {notice}
          </p>
        ) : null}

        <div className="auth-form">
          {tab === 'signup' ? (
            <AuthField
              label={c.name}
              placeholder={c.namePlaceholder}
              autoComplete="name"
              value={name}
              error={errors.name}
              onChange={setName}
            />
          ) : null}

          <AuthField
            label={c.email}
            placeholder={c.emailPlaceholder}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={setEmail}
          />

          <AuthField
            label={c.password}
            placeholder={c.passwordPlaceholder}
            secret
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            error={passwordHint()}
            onChange={setPassword}
            onBlur={() => password && setPwSeen(true)}
          />

          {tab === 'signup' ? (
            <AuthField
              label={c.confirmPassword}
              placeholder={c.passwordPlaceholder}
              secret
              autoComplete="new-password"
              value={confirm}
              error={confirmHint()}
              onChange={setConfirm}
              onBlur={() => confirm && setConfirmSeen(true)}
            />
          ) : null}

          {tab === 'signin' ? (
            <div className="auth-row">
              <label>
                <button
                  type="button"
                  className="switch"
                  role="switch"
                  aria-checked={remember}
                  aria-label={c.remember}
                  onClick={() => setRemember((v) => !v)}
                />
                {c.remember}
              </label>
              <ForgotPassword email={email} />
            </div>
          ) : null}

          {block === 'unconfirmed' ? (
            <div className="notice" role="alert">
              <div>
                <p className="notice-title">{c.unconfirmedTitle}</p>
                <p className="notice-body">
                  {c.unconfirmedPre} {email.trim().toLowerCase()}. {c.unconfirmedPost}
                </p>
                <button
                  type="button"
                  className="chip chip-sm mt-3"
                  disabled={resent}
                  onClick={async () => {
                    await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
                    setResent(true);
                  }}
                >
                  {resent ? c.resent : c.resend}
                </button>
              </div>
            </div>
          ) : null}
          {block === 'offline' ? (
            <div className="notice notice-danger" role="alert">
              <div>
                <p className="notice-title">{c.offlineTitle}</p>
                <p className="notice-body">{c.offlineBody}</p>
              </div>
            </div>
          ) : null}

          {errors.form ? (
            <p ref={liveRegion} role="alert" className="auth-hint text-[13px]">
              {errors.form}
            </p>
          ) : null}

          <button className="auth-submit" type="submit" disabled={busy} aria-busy={busy}>
            {busy
              ? tab === 'signin'
                ? c.signingIn
                : c.creating
              : tab === 'signin'
                ? c.signIn
                : c.signUp}
          </button>
        </div>

        <p className="auth-or">{tab === 'signin' ? c.orSignIn : c.orSignUp}</p>
        <div className="auth-social">
          <button type="button" aria-label={c.withGoogle} onClick={() => onSocial('google')}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
              <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" opacity=".85" />
              <path d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.4 14Z" opacity=".7" />
              <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.7 9.4 5.9 12 5.9Z" opacity=".55" />
            </svg>
          </button>
          <button type="button" aria-label={c.withOutlook} onClick={() => onSocial('azure')}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 5.5h7.2c.4 0 .8.4.8.8v11.4c0 .4-.4.8-.8.8H13v-4.3l2.6 1.9c.2.1.4.1.6 0L21 12.6v-1.8l-5.1 3.6L13 12.3V5.5Z" opacity=".7" />
              <path d="M2 5.2 12 3.5v17L2 18.8V5.2Zm5 3.3c-1.9 0-3.1 1.5-3.1 3.5s1.2 3.5 3.1 3.5 3.1-1.5 3.1-3.5-1.2-3.5-3.1-3.5Zm0 1.5c.9 0 1.4.8 1.4 2s-.5 2-1.4 2-1.4-.8-1.4-2 .5-2 1.4-2Z" />
            </svg>
          </button>
          <button type="button" aria-label={c.withApple} onClick={() => onSocial('apple')}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3-2.5 1-1.4 1.3-2.7 1.4-2.8-.1 0-2.6-1-2.6-4.2ZM14 5.2c.7-.8 1.2-2 1-3.2-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.5 2.9-1.3Z" />
            </svg>
          </button>
        </div>

        <p className="auth-foot">
          {tab === 'signin' ? c.noAccount : c.haveAccount}{' '}
          <button type="button" className="auth-link" onClick={() => go(tab === 'signin' ? 'signup' : 'signin')}>
            {tab === 'signin' ? c.tabSignUp : c.tabSignIn}
          </button>
        </p>

        {/* A língua escolhe-se antes de entrar (skill lingua-na-entrada-e-definicoes). */}
        <LocalePicker variant="auth" />
      </form>
    </main>
  );
}

/** One field of the gate: small bold label above a light glass input, eye on secrets. */
function AuthField({
  label,
  value,
  onChange,
  onBlur,
  error,
  secret,
  ...input
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  secret?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}) {
  const c = useT().gate;
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          {...input}
          id={id}
          className={error ? 'auth-input is-error' : 'auth-input'}
          type={secret ? (shown ? 'text' : 'password') : (input.type ?? 'text')}
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : undefined}
          onChange={(ev) => onChange(ev.target.value)}
          onBlur={onBlur}
        />
        {secret ? (
          <button
            type="button"
            className="auth-eye"
            aria-label={shown ? c.hide : c.show}
            onClick={() => setShown((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {shown ? <path d="M3 3l18 18" /> : null}
            </svg>
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-e`} className="auth-hint" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ForgotPassword({ email }: { email: string }) {
  const c = useT().gate;
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
    <div className="text-right">
      <button
        type="button"
        onClick={send}
        disabled={state === 'sending'}
        className="auth-link is-quiet min-h-[36px] text-[12.5px]"
      >
        {state === 'sending' ? c.sendingReset : c.forgot}
      </button>
      {state === 'sent' ? (
        <p role="status" className="text-[12.5px] text-[var(--ui-volt)]">
          {c.resetSent}
        </p>
      ) : null}
      {state === 'need-email' ? (
        <p role="alert" className="auth-hint">
          {c.resetNeedEmail}
        </p>
      ) : null}
    </div>
  );
}
