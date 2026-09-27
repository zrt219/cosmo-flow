import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false
  },
  build: {
    chunkSizeWarningLimit: 1200
  }
});
