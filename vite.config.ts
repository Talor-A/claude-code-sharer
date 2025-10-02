import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'public/index.html',
        session: 'public/session.html'
      }
    }
  }
});
