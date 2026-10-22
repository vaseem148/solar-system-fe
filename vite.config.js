import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Absolute asset paths: pages like /about are served the same index.html (see vercel.json)
  base: '/',
  plugins: [react()],
  server: { port: 5173 },
})
