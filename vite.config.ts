import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@health-vault/types': fileURLToPath(new URL('./packages/types/src/index.ts', import.meta.url)),
      '@health-vault/api-client': fileURLToPath(new URL('./packages/api-client/src/index.ts', import.meta.url)),
      '@health-vault/config': fileURLToPath(new URL('./packages/config/src/index.ts', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
