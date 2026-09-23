import { createBrowserRouter } from 'react-router';

import { Catalog } from '../features/catalog/Catalog';
import { Nutrition } from '../features/nutrition/Nutrition';
import { Profile } from '../features/profile/Profile';
import { Onboarding } from '../features/onboarding/Onboarding';
import { Team } from '../features/team/Team';
import { DayView } from '../features/train/DayView';
import { Calendar } from '../features/calendar/Calendar';
import { Progress } from '../features/progress/Progress';
import { Evolution } from '../features/progress/Evolution';
import { RunSession } from '../features/train/RunSession';
import { Today } from '../features/today/Today';
import { Train } from '../features/train/Train';
import { AppShell } from './AppShell';
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
 * Two shapes of signed-in screen, and the difference is deliberate. The tabbed
 * surfaces live inside <AppShell>, which owns the frame and keeps the bottom bar
 * under the thumb. A training day does not: it is the surface a lifter works in
 * between sets, and a tab bar there is five ways to lose your place mid-session. It
 * draws its own frame and leaves by its own back control.
 *
 * OS CINCO SEPARADORES DO PROTÓTIPO v2, postos aqui pelo porte do sistema:
 * HOJE (`/`), TREINO (`/treino`), NUTRIÇÃO, EQUIPA e PERFIL. O ecrã de treino
 * mudou de `/` para `/treino` porque a raiz passou a ser o HOJE, que é a porta de
 * entrada que o protótipo desenha. O Catálogo deixou de ser separador e pendura-se
 * do Treino, mas continua a ser rota própria: é um ecrã, só deixou de ser um dos
 * cinco.
 *
 * The three surfaces not built yet are routed to <SurfacePending> rather than left
 * out of the table. The shell already ships their tabs, and a tab that lands on
 * "page not found" tells the user the app is broken when the truth is that the
 * screen is not written yet.
 *
 * O PERFIL É A EXCEÇÃO, e por uma razão: a escolha de língua vive nas Definições,
 * que são dentro do Perfil, e as Definições chegam na fase 023. Até lá o Perfil é o
 * mesmo vazio mais o seletor de língua, em <ProfilePending>. Quatro dicionários sem
 * nenhuma forma de lá chegar seriam uma funcionalidade escondida atrás de uma fase
 * que ainda não começou.
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
                { index: true, element: <Today /> },
                { path: 'treino', element: <Train /> },
                { path: 'catalogo', element: <Catalog /> },
                { path: 'nutricao', element: <Nutrition /> },
                { path: 'equipa', element: <Team /> },
                { path: 'perfil', element: <Profile /> },
              ],
            },
            { path: 'boas-vindas', element: <Onboarding /> },
            { path: 'progresso', element: <Progress /> },
            { path: 'calendario', element: <Calendar /> },
            { path: 'evolucao', element: <Evolution /> },
            { path: 'treino/:dia', element: <DayView /> },
            /*
             * O Executar está fora do <AppShell> pela mesma razão que o dia está, e
             * com mais força ainda: é o ecrã onde se treina entre séries, e uma barra
             * de separadores a meio de uma série são cinco maneiras de perder o sítio.
             * Entra-se por COMEÇAR TREINO, que é a única porta, como a gravação mostra.
             */
            { path: 'treino/:dia/executar', element: <RunSession /> },
          ],
        },
        { path: 'entrar', element: <RequireNoSession /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
