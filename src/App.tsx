import { RouterProvider } from 'react-router';

import { SessionProvider } from './features/auth/SessionProvider';
import { Providers } from './app/providers';
import { ThemeProvider } from './app/ThemeProvider';
import { router } from './app/routes';

/**
 * Application root.
 *
 * Order matters. The theme sits above everything because it must be applied on every
 * route, not only on the ones that happen to render a theme control. The session sits
 * above the router because the route guards read it, and the query client sits above
 * the session because Phase 3's data modules are keyed by user id and must be able to
 * clear their cache when it changes.
 */
export default function App() {
  return (
    <ThemeProvider>
      <Providers>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </Providers>
    </ThemeProvider>
  );
}
