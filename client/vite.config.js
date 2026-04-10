import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base path must match your GitHub repo name
  base: '/ai-syllabus-assistant/',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
});
