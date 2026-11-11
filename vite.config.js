import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 8080, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Tách Phaser ra chunk riêng để cache tốt hơn.
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
});
