import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves this as static files with no server and no SSR (plan D11),
// so every path stays relative to the deployed base.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
