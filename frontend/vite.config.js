import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Source maps disabled in production — prevents source code exposure
    sourcemap: false,

    // Use Vite 8's native Oxc minifier (esbuild is no longer bundled)
    minify: 'oxc',

    // Warn on large chunks
    chunkSizeWarningLimit: 400,
  },

  server: {
    // Dev server listens on localhost only — never expose to network
    host: 'localhost',
    port: 5173,

    // Security headers for the dev server
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options':        'DENY',
      'Referrer-Policy':        'strict-origin-when-cross-origin',
    },
  },
});
