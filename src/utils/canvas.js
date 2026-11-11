// Helper vẽ texture bằng Canvas 2D (gradient, bo góc, viền) — thay cho asset ảnh.

/**
 * Tạo CanvasTexture một lần, vẽ bằng draw(ctx, w, h). Bỏ qua nếu key đã tồn tại.
 */
export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  const ctx = tex.getContext();
  draw(ctx, w, h);
  tex.refresh();
  return key;
}

/**
 * Tạo spritesheet từ nhiều frame vẽ tay. frames = { name: (ctx, w, h) => {} }.
 * Mỗi frame được đặt tên (vd 'walk0') để dùng trong anims.
 */
export function canvasSheet(scene, key, fw, fh, frames) {
  if (scene.textures.exists(key)) return key;
  const names = Object.keys(frames);
  const tex = scene.textures.createCanvas(key, fw * names.length, fh);
  const ctx = tex.getContext();
  names.forEach((name, i) => {
    ctx.save();
    ctx.translate(i * fw, 0);
    ctx.beginPath();
    ctx.rect(0, 0, fw, fh);
    ctx.clip();
    frames[name](ctx, fw, fh);
    ctx.restore();
    tex.add(name, 0, i * fw, 0, fw, fh);
  });
  tex.refresh();
  return key;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function linear(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

export function radial(ctx, x, y, r0, r1, stops) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([t, c]) => g.addColorStop(t, c));
  return g;
}

/** Tô + viền một path đã dựng sẵn. */
export function fillStroke(ctx, fill, stroke, lineWidth = 3) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function ellipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

export function starPath(ctx, cx, cy, spikes, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.35);
  ctx.bezierCurveTo(cx - s * 1.1, cy - s * 0.4, cx - s * 0.45, cy - s * 1.05, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.45, cy - s * 1.05, cx + s * 1.1, cy - s * 0.4, cx, cy + s * 0.35);
  ctx.closePath();
}

/** Dải đồi/núi ngẫu nhiên lặp liền mạch theo chiều ngang (dùng cho TileSprite parallax). */
export function ridgeTexture(scene, key, w, h, { base = 0.6, amp = 0.25, bumps = 4, color = '#5a8f5a', top = null, seed = 1 } = {}) {
  return canvasTexture(scene, key, w, h, (ctx) => {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const phases = Array.from({ length: 3 }, () => rnd() * Math.PI * 2);
    const yAt = (x) => {
      const t = (x / w) * Math.PI * 2;
      return (
        h * base -
        h * amp * (0.6 * Math.sin(t * bumps + phases[0]) + 0.3 * Math.sin(t * bumps * 2 + phases[1]) + 0.1 * Math.sin(t * bumps * 5 + phases[2]))
      );
    };
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) ctx.lineTo(x, yAt(x));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = top ? linear(ctx, 0, h * (base - amp), 0, h, [[0, top], [1, color]]) : color;
    ctx.fill();
  });
}

/** Bầu trời gradient dọc. stops: [[0,'#..'],[1,'#..']] */
export function skyTexture(scene, key, w, h, stops) {
  return canvasTexture(scene, key, w, h, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, stops);
    ctx.fillRect(0, 0, w, h);
  });
}

/** Chấm tròn mềm (glow) — dùng cho particle, ánh sáng, bóng. */
export function softDot(scene, key, r, color = '255,255,255') {
  return canvasTexture(scene, key, r * 2, r * 2, (ctx) => {
    ctx.fillStyle = radial(ctx, r, r, 0, r, [
      [0, `rgba(${color},1)`],
      [0.4, `rgba(${color},0.6)`],
      [1, `rgba(${color},0)`],
    ]);
    ctx.fillRect(0, 0, r * 2, r * 2);
  });
}

export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
