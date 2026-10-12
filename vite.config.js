import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths, so the build works on any host or sub-folder
  base: './',
  plugins: [react()],
  server: { port: 5173 },
})
