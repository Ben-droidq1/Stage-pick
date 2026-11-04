import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Match the browsers this app actually targets; avoids shipping legacy helpers.
    target: 'es2020',
    rollupOptions: {
      output: {
        // React changes far less often than app code, so give it its own
        // long-cached chunk instead of invalidating it on every deploy.
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react'
          }
        },
      },
    },
  },
})
