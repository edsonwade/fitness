import { createBrowserRouter } from 'react-router';

import { Showcase } from '../features/showcase/Showcase';
import {
  NotFound,
  RequireNoSession,
  RequireSession,
  RouteError,
  SessionBoundary,
} from './route-elements';

/**
 * Routing.
 *
 * Paths are Portuguese, because the product is Portuguese-first and a URL the user
 * reads in their own language is part of the product, not an implementation detail.
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
          children: [{ index: true, element: <Showcase /> }],
        },
        { path: 'entrar', element: <RequireNoSession /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
