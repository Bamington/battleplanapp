import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
  },
  // Remove the base path for Vercel deployment
  // base: process.env.NODE_ENV === 'production' ? '/battleplanapp/' : '/',
});
