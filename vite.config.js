import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PHOTO_DIR = fileURLToPath(new URL('./public/assets/images/characters', import.meta.url));

/**
 * Module ảo `virtual:memory-photos`: danh sách file ảnh trong public/assets/images/characters.
 * Game tự ghép ảnh với địa điểm theo tên file (vd quynhon.png → Quy Nhơn).
 * Thêm/xóa ảnh khi đang chạy dev → trang tự tải lại.
 */
function memoryPhotos() {
  const id = 'virtual:memory-photos';
  const resolved = '\0' + id;
  const list = () => (fs.existsSync(PHOTO_DIR) ? fs.readdirSync(PHOTO_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort() : []);
  return {
    name: 'memory-photos',
    resolveId: (i) => (i === id ? resolved : null),
    load: (i) => (i === resolved ? `export default ${JSON.stringify(list())};` : null),
    configureServer(server) {
      server.watcher.add(PHOTO_DIR);
      const onChange = (file) => {
        if (!path.resolve(file).startsWith(PHOTO_DIR)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [memoryPhotos()],
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
