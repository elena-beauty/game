// Texture cho ván Cát Bà — rừng quốc gia, núi đá vôi, khe suối.
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const OUT = '#3a2a3f';

/** Dải núi đá vôi (tháp karst bo tròn) lặp liền mạch theo chiều ngang. */
function karstLayer(scene, key, w, h, { color, top, seed, count, minH, maxH }) {
  canvasTexture(scene, key, w, h, (ctx) => {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, top], [1, color]]);
    ctx.fillRect(0, h - 30, w, 30);
    for (let i = 0; i < count; i++) {
      const cx = (i + 0.5) * (w / count) + (rnd() - 0.5) * (w / count) * 0.5;
      const tw = 60 + rnd() * 90;
      const th = minH + rnd() * (maxH - minH);
      const draw = (x) => {
        ctx.beginPath();
        ctx.moveTo(x - tw / 2 - 20, h);
        ctx.bezierCurveTo(x - tw / 2, h - th * 0.4, x - tw / 2 - 8, h - th * 0.9, x - tw * 0.1, h - th);
        ctx.bezierCurveTo(x + tw * 0.25, h - th - 8, x + tw / 2 + 6, h - th * 0.8, x + tw / 2, h - th * 0.45);
        ctx.lineTo(x + tw / 2 + 24, h);
        ctx.closePath();
        ctx.fill();
      };
      ctx.fillStyle = linear(ctx, 0, h - th, 0, h, [[0, top], [1, color]]);
      draw(cx);
      if (cx - tw < 0) draw(cx + w);
      if (cx + tw > w) draw(cx - w);
    }
  });
}

export function createCatBaTextures(scene) {
  canvasTexture(scene, 'CatBa-sky', 1280, 720, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#7ec8e3'], [0.55, '#c8ecd9'], [1, '#eaf7d8']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = radial(ctx, 980, 150, 10, 260, [[0, 'rgba(255,250,220,0.95)'], [0.25, 'rgba(255,240,180,0.5)'], [1, 'rgba(255,240,180,0)']]);
    ctx.fillRect(0, 0, w, h);
  });

  karstLayer(scene, 'CatBa-far', 1280, 360, { color: '#7aae9f', top: '#a9d6c6', seed: 3, count: 9, minH: 160, maxH: 330 });
  karstLayer(scene, 'CatBa-mid', 1280, 360, { color: '#5c9a7f', top: '#7fb894', seed: 11, count: 7, minH: 140, maxH: 300 });

  // Rừng gần: vòm cây tròn
  canvasTexture(scene, 'CatBa-near', 1024, 260, (ctx, w, h) => {
    let s = 21;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    ctx.fillStyle = '#2f6b4a';
    ctx.fillRect(0, h - 90, w, 90);
    for (let i = 0; i < 26; i++) {
      const x = (i / 26) * w + rnd() * 20;
      const r = 40 + rnd() * 40;
      const y = h - 70 - rnd() * 90;
      [0, w, -w].forEach((off) => {
        ellipse(ctx, x + off, y, r, r * 0.85);
        ctx.fillStyle = radial(ctx, x + off - r * 0.3, y - r * 0.3, 4, r, [[0, '#5fb36f'], [1, '#2f6b4a']]);
        ctx.fill();
      });
    }
  });

  // Suối dưới chân
  canvasTexture(scene, 'CatBa-stream', 256, 140, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#7fe0e8'], [0.3, '#3aa6c9'], [1, '#1f5f86']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    [[20, 30], [140, 55], [80, 90], [200, 110]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20, y - 6, x + 40, y);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, w, 6);
  });

  // Cây lá rộng nền
  canvasTexture(scene, 'CatBa-tree', 220, 320, (ctx) => {
    roundRect(ctx, 96, 150, 28, 170, 8);
    fillStroke(ctx, linear(ctx, 96, 0, 124, 0, [[0, '#6b4226'], [1, '#9b6a40']]), OUT, 3);
    [[110, 110, 90], [60, 140, 60], [160, 140, 60], [110, 60, 66]].forEach(([x, y, r]) => {
      ellipse(ctx, x, y, r, r * 0.8);
      fillStroke(ctx, radial(ctx, x - r * 0.3, y - r * 0.4, 6, r, [[0, '#7fd18a'], [1, '#2f8a4c']]), OUT, 3);
    });
  });

  // Dương xỉ tiền cảnh
  canvasTexture(scene, 'CatBa-fern', 200, 120, (ctx) => {
    const frond = (angle, len) => {
      ctx.save();
      ctx.translate(100, 118);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -22, len, 0);
      ctx.quadraticCurveTo(len * 0.5, -4, 0, 0);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, -20, 0, 4, [[0, '#4caf63'], [1, '#1f6b3a']]), '#174d2b', 2);
      ctx.restore();
    };
    [[-2.9, 95], [-2.5, 90], [-2.0, 80], [-1.5, 70], [-1.1, 82], [-0.6, 92], [-0.25, 96]].forEach(([a, l]) => frond(a, l));
  });

  // Khỉ voọc Cát Bà (đầu vàng)
  canvasTexture(scene, 'CatBa-monkey', 110, 96, (ctx) => {
    ctx.strokeStyle = '#2b2430';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 66);
    ctx.bezierCurveTo(4, 70, 2, 40, 14, 22);
    ctx.stroke();
    ellipse(ctx, 50, 64, 24, 20);
    fillStroke(ctx, linear(ctx, 0, 44, 0, 84, [[0, '#4a3f52'], [1, '#2b2430']]), OUT, 3);
    [[34, 84], [66, 84]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 8, 6);
      fillStroke(ctx, '#2b2430', OUT, 2.5);
    });
    ellipse(ctx, 74, 70, 7, 6);
    fillStroke(ctx, '#2b2430', OUT, 2.5);
    ellipse(ctx, 64, 34, 26, 24);
    fillStroke(ctx, radial(ctx, 58, 26, 4, 28, [[0, '#ffe7a3'], [1, '#e8b04a']]), OUT, 3);
    ellipse(ctx, 70, 40, 14, 12);
    ctx.fillStyle = '#5a4436';
    ctx.fill();
    [62, 76].forEach((x) => {
      ellipse(ctx, x, 37, 3, 3.6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ellipse(ctx, x + 0.5, 37.5, 1.7, 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    });
    ctx.strokeStyle = '#2b1f1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(69, 44, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ellipse(ctx, 50, 20, 9, 12, -0.4);
    fillStroke(ctx, '#ffd166', OUT, 2.5);
  });

  // Cờ trạm nghỉ
  canvasTexture(scene, 'CatBa-pole', 20, 140, (ctx) => {
    roundRect(ctx, 6, 6, 8, 132, 4);
    fillStroke(ctx, '#d6d3d1', OUT, 2.5);
    ellipse(ctx, 10, 8, 6, 6);
    fillStroke(ctx, '#ffd166', OUT, 2);
  });
  canvasTexture(scene, 'CatBa-flag', 70, 46, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 4);
    ctx.quadraticCurveTo(34, -4, 66, 10);
    ctx.lineTo(60, 24);
    ctx.lineTo(66, 38);
    ctx.quadraticCurveTo(34, 28, 2, 40);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 70, 0, [[0, '#ff5d5d'], [1, '#e11d48']]), OUT, 2.5);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('★', 18, 30);
  });

  // Bảng đỉnh núi
  canvasTexture(scene, 'CatBa-sign', 240, 150, (ctx) => {
    roundRect(ctx, 54, 70, 14, 80, 4);
    fillStroke(ctx, '#7a4a2a', OUT, 2.5);
    roundRect(ctx, 172, 70, 14, 80, 4);
    fillStroke(ctx, '#7a4a2a', OUT, 2.5);
    roundRect(ctx, 10, 8, 220, 82, 14);
    fillStroke(ctx, linear(ctx, 0, 8, 0, 90, [[0, '#d9a066'], [1, '#a86e3f']]), OUT, 3.5);
    ctx.fillStyle = '#fff8ee';
    ctx.textAlign = 'center';
    ctx.font = '800 28px "Baloo 2", sans-serif';
    ctx.fillText('Đỉnh Ngự Lâm', 120, 50);
    ctx.font = '700 18px "Baloo 2", sans-serif';
    ctx.fillText('Vịnh Lan Hạ →', 120, 76);
  });

  // Toàn cảnh vịnh Lan Hạ
  canvasTexture(scene, 'CatBa-bay', 900, 300, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 120, 0, h, [[0, '#8fe3f0'], [1, '#2ba3c4']]);
    ctx.fillRect(0, 120, w, h - 120);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, 130 + Math.random() * 160, 20, 2);
    [[120, 90, 80], [260, 60, 110], [420, 100, 70], [560, 50, 120], [720, 80, 90], [840, 110, 60]].forEach(([x, hgt, tw]) => {
      ctx.beginPath();
      ctx.moveTo(x - tw / 2 - 10, 190);
      ctx.bezierCurveTo(x - tw / 2, 190 - hgt, x - 4, 100 - hgt * 0.4, x + 10, 190 - hgt - 30);
      ctx.bezierCurveTo(x + tw / 2, 190 - hgt, x + tw / 2 + 4, 170, x + tw / 2 + 10, 190);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, 60, 0, 190, [[0, '#7fbf95'], [1, '#3f7d63']]), 'rgba(58,42,63,0.5)', 2);
    });
    // Thuyền nhỏ
    [[300, 230], [640, 250]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + 20, y);
      ctx.lineTo(x + 12, y + 8);
      ctx.lineTo(x - 12, y + 8);
      ctx.closePath();
      ctx.fillStyle = '#8b5a2b';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 24);
      ctx.lineTo(x + 14, y - 6);
      ctx.closePath();
      ctx.fillStyle = '#ffb36b';
      ctx.fill();
    });
  });
}

/** Phiến đá vôi rộng w (type: rock | wobble | moss). Mặt trên tại y = 6. */
export function rockTexture(scene, w, type) {
  const key = `CatBa-rock-${type}-${w}`;
  canvasTexture(scene, key, w, 64, (ctx, cw, h) => {
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.quadraticCurveTo(cw / 2, 2, cw - 4, 10);
    ctx.lineTo(cw - 10, 30);
    ctx.quadraticCurveTo(cw * 0.7, h - 2, cw * 0.5, h - 4);
    ctx.quadraticCurveTo(cw * 0.25, h - 2, 10, 30);
    ctx.closePath();
    const base = type === 'wobble' ? ['#d6c7b0', '#8f7c66'] : ['#d4d0cb', '#8c8580'];
    fillStroke(ctx, linear(ctx, 0, 4, 0, h, [[0, base[0]], [1, base[1]]]), OUT, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    roundRect(ctx, 12, 8, cw - 24, 5, 2.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,42,63,0.35)';
    ctx.lineWidth = 2;
    for (let x = 24; x < cw - 20; x += 38) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 6, 34);
      ctx.lineTo(x + 2, 44);
      ctx.stroke();
    }
    if (type === 'wobble') {
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cw * 0.45, 8);
      ctx.lineTo(cw * 0.52, 22);
      ctx.lineTo(cw * 0.46, 34);
      ctx.lineTo(cw * 0.55, 50);
      ctx.stroke();
    }
    if (type === 'moss') {
      ctx.beginPath();
      ctx.moveTo(2, 12);
      ctx.quadraticCurveTo(cw / 2, 0, cw - 2, 12);
      for (let x = cw - 6; x > 6; x -= 12) ctx.quadraticCurveTo(x - 3, 22 + (x % 3) * 3, x - 12, 14);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, 0, 0, 24, [[0, '#a3e07a'], [1, '#4f9a3c']]), '#2f6b2a', 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(ctx, cw * 0.3, 8, 10, 2);
      ctx.fill();
    }
  });
  return key;
}

/** Rắn lục trên cành / phiến đá và đá lở. */
export function createCatBaHazards(scene) {
  canvasTexture(scene, 'CatBa-snake', 110, 50, (ctx) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(8, 40);
      ctx.bezierCurveTo(26, 22, 40, 48, 58, 34);
      ctx.bezierCurveTo(70, 24, 78, 22, 84, 24);
    };
    body();
    ctx.lineWidth = 15;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    body();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#5fc36a';
    ctx.stroke();
    ctx.setLineDash([3, 7]);
    body();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2f8a3c';
    ctx.stroke();
    ctx.setLineDash([]);
    ellipse(ctx, 92, 22, 14, 10);
    fillStroke(ctx, radial(ctx, 88, 18, 2, 14, [[0, '#a6ec9b'], [1, '#48b75a']]), OUT, 2.5);
    ellipse(ctx, 96, 18, 3.5, 4);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ellipse(ctx, 97, 18, 1.2, 3);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(105, 25);
    ctx.lineTo(110, 26);
    ctx.moveTo(107, 25.5);
    ctx.lineTo(110, 22);
    ctx.stroke();
  });
  canvasTexture(scene, 'CatBa-boulder', 64, 60, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.lineTo(18, 8);
    ctx.lineTo(44, 4);
    ctx.lineTo(60, 24);
    ctx.lineTo(54, 50);
    ctx.lineTo(26, 56);
    ctx.lineTo(6, 44);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 4, 0, 56, [[0, '#c9c3bc'], [1, '#6b6560']]), OUT, 3);
    ctx.strokeStyle = 'rgba(58,42,63,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, 20);
    ctx.lineTo(34, 30);
    ctx.lineTo(30, 44);
    ctx.stroke();
  });
}
