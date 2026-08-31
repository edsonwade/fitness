import { Navigate, Outlet, useRouteError } from 'react-router';

import { AuthGate } from '../features/auth/AuthGate';
import { useSessionState } from '../features/auth/session-context';
import { Screen, SessionSplash } from '../ui/Screen';

/*
 * The route elements live beside the route table rather than inside it so that
 * `routes.tsx` exports only the router. A module that exports both a component and
 * a plain value cannot be hot-reloaded, which would mean a full page reload, and a
 * lost session read, on every edit to a guard.
 */

/**
 * Holds the frame until the session read resolves. The read itself happens once, in
 * <SessionProvider> above the router; this only spends its result.
 *
 * Without this the gate renders for a frame before the stored session is read, and
 * a returning user sees a sign-in form flash on every cold start. `useSession`
 * already tracks that with its `loading` flag; this is where the flag is spent.
 */
export function SessionBoundary() {
  const { loading } = useSessionState();
  if (loading) return <SessionSplash />;
  return <Outlet />;
}

/** Signed out, so the gate. `replace`, so Back does not bounce off the guard. */
export function RequireSession() {
  const { session } = useSessionState();
  if (!session) return <Navigate to="/entrar" replace />;
  return <Outlet />;
}

/** Already signed in, so the gate has nothing to ask. */
export function RequireNoSession() {
  const { session } = useSessionState();
  if (session) return <Navigate to="/" replace />;
  return <AuthGate />;
}

export function NotFound() {
  return (
    <Screen
      title="Página não encontrada"
      body="O endereço não corresponde a nenhum ecrã da aplicação."
    >
      <BackHome label="Ir para os programas" />
    </Screen>
  );
}

/**
 * The route error boundary.
 *
 * A thrown render error currently reaches React Router's own developer page, which
 * is the wrong thing to show a user standing at a machine. This states what
 * happened and offers the one action that recovers.
 */
export function RouteError() {
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : null;

  return (
    <Screen
      title="Alguma coisa correu mal"
      body="O ecrã não conseguiu abrir. Voltar aos programas costuma resolver."
    >
      <BackHome label="Voltar aos programas" />
      {detail ? (
        <p className="max-w-[30ch] font-ui text-[12px] leading-relaxed text-text-muted">{detail}</p>
      ) : null}
    </Screen>
  );
}

/**
 * A full reload rather than a client navigation. After a render error the router's
 * own state is what is suspect, so navigating within it can land straight back on
 * the same broken screen.
 */
function BackHome({ label }: { label: string }) {
  return (
    <a
      href={import.meta.env.BASE_URL}
      className="mt-1 inline-flex min-h-[48px] items-center rounded-full bg-accent px-6 font-ui text-[14px] font-700 text-accent-ink transition-colors duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] pointer-hover:bg-accent-hover active:scale-[0.98] motion-reduce:active:scale-100"
    >
      {label}
    </a>
  );
}
