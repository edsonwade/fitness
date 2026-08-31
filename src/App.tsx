import { Showcase } from './features/showcase/Showcase';

/**
 * Application root.
 *
 * Currently pinned to the visual showcase: the user asked to approve the pinned
 * world on a sample screen before any further functionality is written. The auth
 * gate exists at features/auth and is rebuilt into this world once the look is
 * signed off.
 */
export default function App() {
  return <Showcase />;
}
