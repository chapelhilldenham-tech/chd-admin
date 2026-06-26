import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@supabase/phoenix': path.resolve(
        __dirname,
        'node_modules/@supabase/phoenix/priv/static/phoenix.cjs.js'
      ),
    },
  },
  optimizeDeps: {
    include: ['@supabase/phoenix'],
  },
})
