import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration for Vite
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['xlsx', 'react-window'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
