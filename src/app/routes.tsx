import { createBrowserRouter } from 'react-router';

import { Catalog } from '../features/catalog/Catalog';
import { DayView } from '../features/train/DayView';
import { Train } from '../features/train/Train';
import { AppShell } from './AppShell';
import {
  NotFound,
  RequireNoSession,
  RequireSession,
  RouteError,
  SessionBoundary,
  SurfacePending,
} from './route-elements';

/**
 * Routing.
 *
 * Paths are Portuguese, because the product is Portuguese-first and a URL the user
 * reads in their own language is part of the product, not an implementation detail.
 *
 * Two shapes of signed-in screen, and the difference is deliberate. The tabbed
 * surfaces live inside <AppShell>, which owns the frame and keeps the bottom bar
 * under the thumb. A training day does not: it is the surface a lifter works in
 * between sets, and a tab bar there is five ways to lose your place mid-session. It
 * draws its own frame and leaves by its own back control.
 *
 * The three surfaces not built yet are routed to <SurfacePending> rather than left
 * out of the table. The shell already ships their tabs, and a tab that lands on
 * "page not found" tells the user the app is broken when the truth is that the
 * screen is not written yet.
 *
 * `basename` comes from Vite rather than being written literally. This deploys to
 * GitHub Pages, which serves from a repository subpath; a hardcoded '/' would work
 * in dev and 404 on every deep link in production. `BASE_URL` is '/' until
 * `vite.config.ts` sets a base, and then it follows it without a second edit here.
 */
export const router = createBrowserRouter(
  [
    {
      element: <SessionBoundary />,
      errorElement: <RouteError />,
      children: [
        {
          element: <RequireSession />,
          children: [
            {
              element: <AppShell />,
              children: [
                { index: true, element: <Train /> },
                { path: 'catalogo', element: <Catalog /> },
                { path: 'objetivos', element: <SurfacePending /> },
                { path: 'treinadores', element: <SurfacePending /> },
                { path: 'perfil', element: <SurfacePending /> },
              ],
            },
            { path: 'treino/:dia', element: <DayView /> },
          ],
        },
        { path: 'entrar', element: <RequireNoSession /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
