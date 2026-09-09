import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      input: {
        // the application
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // the diagrams from docs/, built as their own page
        canvas: fileURLToPath(new URL('./docs/canvas/index.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~fixtures': fileURLToPath(new URL('./fixtures', import.meta.url)),
    },
  },
});
