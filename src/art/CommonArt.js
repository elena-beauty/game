// Texture dùng chung cho mọi scene: sao, tim, mây, hạt sáng, cây, ghim bản đồ...
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse, starPath, heartPath, softDot } from '../utils/canvas.js';

const OUTLINE = '#3a2a3f';

export function createCommonTextures(scene) {
  // Sao vàng / sao rỗng
  canvasTexture(scene, 'star', 64, 64, (ctx) => {
    starPath(ctx, 32, 34, 5, 28, 13);
    fillStroke(ctx, linear(ctx, 0, 6, 0, 60, [[0, '#fff3a8'], [0.5, '#ffd23f'], [1, '#f59e0b']]), '#8a4b08', 3.5);
    starPath(ctx, 28, 28, 5, 9, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  });
  canvasTexture(scene, 'star-empty', 64, 64, (ctx) => {
    starPath(ctx, 32, 34, 5, 28, 13);
    fillStroke(ctx, 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.55)', 3);
  });

  canvasTexture(scene, 'heart', 48, 48, (ctx) => {
    heartPath(ctx, 24, 28, 20);
    fillStroke(ctx, linear(ctx, 0, 6, 0, 40, [[0, '#ff9ebd'], [1, '#ff3d77']]), '#a3194a', 2.5);
    ellipse(ctx, 16, 18, 4, 3, -0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  });

  // Mây (3 kiểu)
  [
    ['cloud1', 220, 120, [[60, 64, 40], [110, 48, 52], [160, 64, 38], [40, 74, 26], [190, 76, 24]]],
    ['cloud2', 160, 100, [[50, 50, 30], [90, 38, 38], [125, 52, 26]]],
    ['cloud3', 280, 130, [[60, 74, 36], [110, 54, 50], [170, 50, 46], [220, 74, 34], [140, 80, 30]]],
  ].forEach(([key, w, h, puffs]) => {
    canvasTexture(scene, key, w, h, (ctx) => {
      ctx.fillStyle = 'rgba(120,140,180,0.25)';
      puffs.forEach(([x, y, r]) => {
        ellipse(ctx, x + 4, y + 6, r, r);
        ctx.fill();
      });
      puffs.forEach(([x, y, r]) => {
        ellipse(ctx, x, y, r, r);
        ctx.fillStyle = radial(ctx, x - r * 0.3, y - r * 0.4, r * 0.1, r, [[0, '#ffffff'], [1, '#eaf2ff']]);
        ctx.fill();
      });
    });
  });

  softDot(scene, 'spark', 16);
  softDot(scene, 'glow', 64);
  softDot(scene, 'glow-warm', 64, '255,200,120');
  canvasTexture(scene, 'pixel', 4, 4, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 4, 4);
  });

  // Bóng đổ mềm
  canvasTexture(scene, 'shadow', 64, 20, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 10, 0, 32, [[0, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]);
    ctx.save();
    ctx.scale(1, 20 / 64);
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
  });

  // Ghim bản đồ
  canvasTexture(scene, 'pin', 56, 72, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(28, 68);
    ctx.bezierCurveTo(12, 46, 4, 36, 4, 26);
    ctx.arc(28, 26, 24, Math.PI, 0);
    ctx.bezierCurveTo(52, 36, 44, 46, 28, 68);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', OUTLINE, 3);
    ellipse(ctx, 28, 26, 17, 17);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fill();
  });

  canvasTexture(scene, 'lock', 36, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(18, 16, 9, Math.PI, 0);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#6b7280';
    ctx.stroke();
    roundRect(ctx, 5, 16, 26, 20, 5);
    fillStroke(ctx, linear(ctx, 0, 16, 0, 36, [[0, '#fcd34d'], [1, '#d97706']]), '#78350f', 2.5);
    ellipse(ctx, 18, 25, 3, 3);
    ctx.fillStyle = '#78350f';
    ctx.fill();
  });

  // Cây dừa
  canvasTexture(scene, 'palm', 180, 260, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(84, 258);
    ctx.bezierCurveTo(80, 180, 96, 120, 92, 70);
    ctx.lineTo(102, 70);
    ctx.bezierCurveTo(108, 120, 96, 190, 100, 258);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 80, 0, 104, 0, [[0, '#8b5a2b'], [1, '#c08552']]), OUTLINE, 3);
    ctx.strokeStyle = 'rgba(60,30,10,0.4)';
    ctx.lineWidth = 2;
    for (let y = 90; y < 250; y += 16) {
      ctx.beginPath();
      ctx.moveTo(88, y);
      ctx.lineTo(102, y + 3);
      ctx.stroke();
    }
    const leaf = (angle, len) => {
      ctx.save();
      ctx.translate(97, 70);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -26, len, 10);
      ctx.quadraticCurveTo(len * 0.5, -6, 0, 0);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, -20, 0, 10, [[0, '#5fd068'], [1, '#2f8f46']]), OUTLINE, 2.5);
      ctx.restore();
    };
    [[-2.9, 82], [-2.3, 78], [-1.7, 60], [-1.2, 70], [-0.5, 80], [0.1, 82], [-0.9, 74]].forEach(([a, l]) => leaf(a, l));
    [[86, 76], [100, 80], [92, 84]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 7, 7);
      fillStroke(ctx, '#7c4a1e', OUTLINE, 2);
    });
  });

  // Cây thông
  canvasTexture(scene, 'pine', 120, 220, (ctx) => {
    roundRect(ctx, 52, 170, 16, 46, 4);
    fillStroke(ctx, '#7a4a2a', OUTLINE, 2.5);
    [[60, 20, 26, 70], [60, 55, 38, 115], [60, 95, 50, 172]].forEach(([cx, top, half, bottom]) => {
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx + half, bottom);
      ctx.quadraticCurveTo(cx, bottom + 10, cx - half, bottom);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, cx - half, 0, cx + half, 0, [[0, '#3f9a62'], [1, '#1f5f3c']]), OUTLINE, 2.5);
    });
  });

  // Hoa nhỏ (trang trí)
  canvasTexture(scene, 'flower', 40, 40, (ctx) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ellipse(ctx, 20 + Math.cos(a) * 9, 20 + Math.sin(a) * 9, 7, 7);
      fillStroke(ctx, '#ff8fb8', '#c2416f', 1.8);
    }
    ellipse(ctx, 20, 20, 6, 6);
    fillStroke(ctx, '#ffd166', '#b7791f', 1.8);
  });

  // Đồng hồ (icon HUD)
  canvasTexture(scene, 'icon-clock', 40, 40, (ctx) => {
    ellipse(ctx, 20, 21, 16, 16);
    fillStroke(ctx, '#fff', OUTLINE, 3);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 21);
    ctx.lineTo(20, 11);
    ctx.moveTo(20, 21);
    ctx.lineTo(27, 24);
    ctx.stroke();
  });

  // Máy ảnh (icon album / kết quả)
  canvasTexture(scene, 'icon-camera', 64, 52, (ctx) => {
    roundRect(ctx, 4, 12, 56, 36, 8);
    fillStroke(ctx, linear(ctx, 0, 12, 0, 48, [[0, '#5b6378'], [1, '#2f3546']]), OUTLINE, 3);
    roundRect(ctx, 20, 4, 22, 12, 4);
    fillStroke(ctx, '#3f4658', OUTLINE, 3);
    ellipse(ctx, 32, 30, 12, 12);
    fillStroke(ctx, radial(ctx, 28, 26, 1, 12, [[0, '#9bd5ff'], [1, '#1d4e89']]), '#d1d5db', 3);
    ellipse(ctx, 50, 20, 3, 3);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
  });
}
