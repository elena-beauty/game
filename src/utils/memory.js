// Ảnh kỷ niệm thật theo địa điểm (levels.json → "memoryPhoto"), mở khóa khi thắng ván.
import { SaveSystem } from '../systems/SaveSystem.js';

export const memoryKey = (levelKey) => `memory-${levelKey}`;

/** Địa điểm có ảnh thật đã tải được không. */
export const hasMemory = (scene, levelKey) => scene.textures.exists(memoryKey(levelKey));

/** Ảnh thật đã mở khóa (có ảnh + đã thắng ván ít nhất 1 lần). */
export const memoryUnlocked = (scene, levelKey) => hasMemory(scene, levelKey) && SaveSystem.getStars(levelKey) > 0;

/**
 * Tìm vùng ảnh thật (bỏ viền đen/trong suốt) và thêm frame 'trim' vào texture.
 * Gọi 1 lần sau khi load (PreloadScene).
 */
export function trimTexture(scene, key, threshold = 24) {
  const tex = scene.textures.get(key);
  if (!tex || tex.has('trim')) return;
  const img = tex.getSourceImage();
  const W = img.width;
  const H = img.height;
  const s = Math.min(1, 240 / W);
  const w = Math.max(1, Math.round(W * s));
  const h = Math.max(1, Math.round(H * s));
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const bright = (x, y) => {
      const i = (y * w + x) * 4;
      return d[i + 3] > 20 && Math.max(d[i], d[i + 1], d[i + 2]) > threshold;
    };
    const colHas = (x) => {
      let n = 0;
      for (let y = 0; y < h; y++) if (bright(x, y)) n++;
      return n > h * 0.04;
    };
    const rowHas = (y) => {
      let n = 0;
      for (let x = 0; x < w; x++) if (bright(x, y)) n++;
      return n > w * 0.04;
    };
    let x0 = 0;
    let x1 = w - 1;
    let y0 = 0;
    let y1 = h - 1;
    // Nội dung = ≥ RUN cột/hàng sáng liên tiếp (bỏ qua đường viền mảnh ở mép ảnh).
    const RUN = 4;
    const solid = (has, i, dir) => {
      for (let k = 0; k < RUN; k++) if (!has(i + k * dir)) return false;
      return true;
    };
    while (x0 < x1 - RUN && !solid(colHas, x0, 1)) x0++;
    while (x1 > x0 + RUN && !solid(colHas, x1, -1)) x1--;
    while (y0 < y1 - RUN && !solid(rowHas, y0, 1)) y0++;
    while (y1 > y0 + RUN && !solid(rowHas, y1, -1)) y1--;
    const fx = Math.floor(x0 / s);
    const fy = Math.floor(y0 / s);
    const fw = Math.min(W - fx, Math.ceil((x1 - x0 + 1) / s));
    const fh = Math.min(H - fy, Math.ceil((y1 - y0 + 1) / s));
    tex.add('trim', 0, fx, fy, fw, fh);
  } catch {
    tex.add('trim', 0, 0, 0, W, H);
  }
}

/**
 * Đặt ảnh vừa khung w×h, không méo.
 * - Ảnh cùng hướng ngang: cắt bớt phần thừa (cover).
 * - Ảnh dọc / khác tỉ lệ nhiều: hiện đủ ảnh (contain) trên nền mờ của chính ảnh đó.
 * Trả về Container (thêm vào container khác được).
 */
export function coverImage(scene, x, y, key, w, h) {
  const frameName = scene.textures.get(key).has('trim') ? 'trim' : undefined;
  const c = scene.add.container(x, y);
  const make = () => scene.add.image(0, 0, key, frameName);
  const probe = make();
  const fw = probe.frame.width;
  const fh = probe.frame.height;
  const ratio = fw / fh / (w / h);

  const cover = (img, alpha = 1) => {
    const scale = Math.max(w / fw, h / fh);
    const cw = w / scale;
    const ch = h / scale;
    img.setCrop((fw - cw) / 2, (fh - ch) / 2, cw, ch).setScale(scale).setAlpha(alpha);
    return img;
  };

  if (ratio > 0.8 && ratio < 1.6) {
    c.add(cover(probe));
  } else {
    // nền: chính ảnh phóng to, tối + mờ
    c.add(cover(probe, 0.55).setTint(0x8a7a99));
    c.add(scene.add.rectangle(0, 0, w, h, 0x140c22, 0.25));
    const fg = make();
    fg.setScale(Math.min(w / fw, h / fh));
    c.add(fg);
  }
  return c;
}
