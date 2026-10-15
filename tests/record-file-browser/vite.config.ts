import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Same-origin development proxy preserves production CORS restrictions unchanged.
const target = 'https://roeudwddxvniazwufdqf.supabase.co';
export default defineConfig({ plugins: [react()], server: {
  host: '127.0.0.1', port: 5176, strictPort: true,
  proxy: Object.fromEntries(['/auth/v1','/rest/v1','/functions/v1'].map(path => [path,{target,changeOrigin:true}]))
} });
