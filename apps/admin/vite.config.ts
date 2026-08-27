import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Reuse the monorepo's existing local Supabase configuration. Hosted admin
  // deployments still provide these variables through their environment.
  envDir: '../..',
  server: { port: 5174 },
  build: { outDir: 'dist' },
});
