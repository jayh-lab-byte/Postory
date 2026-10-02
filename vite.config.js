import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { postoryApi } from './server/plugin.js'

export default defineConfig({
  plugins: [react(), postoryApi()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
})
