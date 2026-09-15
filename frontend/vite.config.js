import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from a domain root (Docker, calculator.matiasbarcelo.com). Set
  // VITE_BASE=/repo-name/ to host under a sub-path instead.
  base: process.env.VITE_BASE ?? '/',
  server: {
    // Forward API calls to the Go backend during development.
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8081',
    },
  },
});
