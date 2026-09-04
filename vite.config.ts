import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this as static files with no server and no SSR (plan D11),
// so every path stays relative to the deployed base.
export default defineConfig({
  // Project site, not a user site: everything lives under /fitness/. The router
  // reads this back through import.meta.env.BASE_URL, so the two cannot drift.
  base: '/fitness/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app is installed on a phone and opened in a gym. An update that waits
      // for every tab to close is an update that never lands, so a new build takes
      // over on the next launch without asking.
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vanilson Workout',
        short_name: 'Workout',
        description: 'O teu plano de treino, sessão a sessão.',
        lang: 'pt',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#151919',
        theme_color: '#151919',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // The shell, the fonts and the seven day posters: what a cold start with no
        // network needs to draw a complete screen. The other seventy photographs are
        // cached the first time they are seen instead — precaching ten megabytes over
        // mobile data to install an app is not a trade this product would make.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'img/day-*.jpg'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'vw-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Supabase is never served from the cache. Stale sets and stale weights are
        // worse than none, and the outbox is what makes writes survive being offline.
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: { enabled: false },
    }),
  ],
})
