// Texture riêng cho ván Singapore — thành phố về đêm, siêu cây phát sáng, vịnh.
import { canvasTexture, skyTexture, linear, radial, ellipse, roundRect, fillStroke } from '../../utils/canvas.js';

const OUT = '#1d1430';

function skyline(ctx, w, h, { color, light, minH, maxH, density, seed }) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let x = 0;
  while (x < w) {
    const bw = 50 + rnd() * 90;
    const bh = minH + rnd() * (maxH - minH);
    const top = h - bh;
    ctx.fillStyle = color;
    if (rnd() < 0.3) {
      // tháp nhọn
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, top + 30);
      ctx.lineTo(x + bw / 2, top - 20);
      ctx.lineTo(x + bw, top + 30);
      ctx.lineTo(x + bw, h);
      ctx.fill();
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(x + bw / 2 - 2, top - 26, 4, 6);
    } else if (rnd() < 0.3) {
      roundRect(ctx, x, top, bw, bh + 10, 18);
      ctx.fill();
    } else ctx.fillRect(x, top, bw, bh);
    ctx.fillStyle = light;
    for (let yy = top + 12; yy < h - 6; yy += 13)
      for (let xx = x + 6; xx < x + bw - 6; xx += 10) if (rnd() < density) ctx.fillRect(xx, yy, 5, 6);
    x += bw + 2 + rnd() * 10;
  }
}

export function createSingaporeTextures(scene) {
  skyTexture(scene, 'Singapore-sky', 1280, 720, [[0, '#090824'], [0.45, '#22134a'], [0.75, '#5a2370'], [1, '#b8487a']]);

  canvasTexture(scene, 'Singapore-moon', 120, 120, (ctx) => {
    ellipse(ctx, 60, 60, 40, 40);
    ctx.fillStyle = radial(ctx, 50, 50, 4, 42, [[0, '#ffffff'], [1, '#ffe7b0']]);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,180,140,0.4)';
    [[48, 50, 7], [70, 66, 5], [58, 78, 4]].forEach(([x, y, r]) => {
      ellipse(ctx, x, y, r, r);
      ctx.fill();
    });
  });

  canvasTexture(scene, 'Singapore-sky-far', 1600, 340, (ctx, w, h) => skyline(ctx, w, h, { color: '#3a2563', light: 'rgba(255,210,150,0.55)', minH: 120, maxH: 300, density: 0.25, seed: 4 }));
  canvasTexture(scene, 'Singapore-sky-near', 1600, 420, (ctx, w, h) => skyline(ctx, w, h, { color: '#1c1640', light: 'rgba(255,230,160,0.85)', minH: 160, maxH: 400, density: 0.4, seed: 9 }));

  // Vòng quay quan sát (chung chung)
  canvasTexture(scene, 'Singapore-wheel', 300, 300, (ctx) => {
    ctx.strokeStyle = '#8ad8ff';
    ctx.lineWidth = 4;
    ellipse(ctx, 150, 150, 140, 140);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.lineTo(150 + Math.cos(a) * 140, 150 + Math.sin(a) * 140);
      ctx.stroke();
      ellipse(ctx, 150 + Math.cos(a) * 140, 150 + Math.sin(a) * 140, 8, 8);
      ctx.fillStyle = i % 2 ? '#ff8fd0' : '#ffe066';
      ctx.fill();
    }
  });

  // Siêu cây: thân lưới thép hình phễu + tán đèn
  canvasTexture(scene, 'Singapore-tree', 260, 460, (ctx, w, h) => {
    const cx = w / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 22, h);
    ctx.bezierCurveTo(cx - 24, 260, cx - 40, 140, cx - 120, 60);
    ctx.lineTo(cx + 120, 60);
    ctx.bezierCurveTo(cx + 40, 140, cx + 24, 260, cx + 22, h);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 60, 0, h, [[0, '#7a2fa6'], [1, '#2b1450']]), OUT, 3);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,150,240,0.55)';
    ctx.lineWidth = 2;
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 3, h);
      ctx.quadraticCurveTo(cx + i * 4, 200, cx + i * 10, 60);
      ctx.stroke();
    }
    for (let y = 80; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + 10);
      ctx.stroke();
    }
    ctx.restore();
    // Tán
    ellipse(ctx, cx, 58, 126, 26);
    fillStroke(ctx, linear(ctx, 0, 32, 0, 84, [[0, '#ff9ae6'], [1, '#8b2fc4']]), OUT, 3);
    ctx.fillStyle = '#fff6a8';
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      ellipse(ctx, cx + Math.cos(a) * 112, 58 + Math.sin(a) * 20, 3, 3);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(120,230,140,0.85)';
    for (let i = 0; i < 40; i++) {
      ellipse(ctx, cx + (Math.random() - 0.5) * 70, 120 + Math.random() * 320, 5, 3);
      ctx.fill();
    }
  });

  canvasTexture(scene, 'Singapore-floor', 128, 140, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#4b3f78'], [1, '#221a40']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9d2f0';
    ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(0, 12, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 40, w / 2 - 2, 40);
    ctx.fillRect(w / 2 + 2, 84, w / 2 - 2, 40);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 16, w - 2, h - 17);
  });

  canvasTexture(scene, 'Singapore-water', 256, 120, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#2a3b8a'], [1, '#0d1238']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,200,240,0.4)';
    for (let i = 0; i < 26; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 12 + Math.random() * 30, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(0, 0, w, 3);
  });

  // Toa tàu điện: thân (phía sau) + khung trước có kính
  canvasTexture(scene, 'Singapore-train-back', 400, 160, (ctx, w, h) => {
    roundRect(ctx, 4, 4, w - 8, h - 8, 26);
    fillStroke(ctx, linear(ctx, 0, 0, 0, h, [[0, '#f4f6ff'], [1, '#b9c1e0']]), OUT, 4);
    ctx.fillStyle = '#e94b6a';
    ctx.fillRect(8, h - 46, w - 16, 12);
    ctx.fillStyle = '#7b5cff';
    ctx.fillRect(8, h - 32, w - 16, 6);
    // nội thất
    ctx.fillStyle = 'rgba(40,40,80,0.35)';
    roundRect(ctx, 22, 22, w - 44, 86, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    for (let x = 40; x < w - 40; x += 40) {
      ctx.fillRect(x, 26, 22, 4);
    }
  });
  canvasTexture(scene, 'Singapore-train-front', 400, 160, (ctx, w) => {
    ctx.strokeStyle = '#8b93b8';
    ctx.lineWidth = 6;
    for (let x = 22; x <= w - 22; x += 89) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, 108);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(160,220,255,0.18)';
    roundRect(ctx, 22, 22, w - 44, 86, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 30; x < w - 40; x += 89) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x + 18, 30);
      ctx.lineTo(x + 4, 90);
      ctx.lineTo(x - 2, 90);
      ctx.closePath();
      ctx.fill();
    }
  });
  canvasTexture(scene, 'Singapore-door', 26, 116, (ctx, w, h) => {
    roundRect(ctx, 2, 2, w - 4, h - 4, 4);
    fillStroke(ctx, linear(ctx, 0, 0, w, 0, [[0, '#d7dcf5'], [1, '#9aa3c9']]), OUT, 3);
    ctx.fillStyle = 'rgba(120,200,255,0.5)';
    ctx.fillRect(6, 14, w - 12, 40);
  });

  canvasTexture(scene, 'Singapore-drone', 90, 54, (ctx) => {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(14, 16);
    ctx.lineTo(76, 16);
    ctx.stroke();
    [14, 76].forEach((x) => {
      ellipse(ctx, x, 10, 14, 4);
      fillStroke(ctx, 'rgba(200,220,255,0.7)', OUT, 2);
    });
    roundRect(ctx, 24, 16, 42, 26, 10);
    fillStroke(ctx, linear(ctx, 0, 16, 0, 42, [[0, '#5a6385'], [1, '#2a3050']]), OUT, 3);
    ellipse(ctx, 45, 30, 8, 8);
    fillStroke(ctx, radial(ctx, 45, 30, 1, 8, [[0, '#ffb3b3'], [1, '#ff2d55']]), OUT, 2);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 42);
    ctx.lineTo(26, 52);
    ctx.moveTo(60, 42);
    ctx.lineTo(64, 52);
    ctx.stroke();
  });

  canvasTexture(scene, 'Singapore-luggage', 60, 62, (ctx) => {
    roundRect(ctx, 22, 2, 16, 14, 4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    roundRect(ctx, 6, 12, 48, 44, 8);
    fillStroke(ctx, linear(ctx, 0, 12, 0, 56, [[0, '#ffb347'], [1, '#e8761c']]), OUT, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(18, 14, 4, 40);
    ctx.fillRect(38, 14, 4, 40);
    [[16, 58], [44, 58]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 4, 4);
      fillStroke(ctx, '#333', OUT, 1.5);
    });
  });

  canvasTexture(scene, 'Singapore-gum', 48, 40, (ctx) => {
    roundRect(ctx, 4, 8, 40, 26, 6);
    fillStroke(ctx, linear(ctx, 0, 8, 0, 34, [[0, '#ff9ad5'], [1, '#e0458f']]), OUT, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, 16, 28, 4);
    ctx.fillStyle = '#7ef0c4';
    ctx.fillRect(10, 23, 18, 4);
  });

  // Người đi đường (bóng hoạt hình)
  ['#4cc9f0', '#ffd166', '#a78bfa', '#ff8fa3', '#7ee081'].forEach((shirt, i) => {
    canvasTexture(scene, `Singapore-npc${i}`, 44, 90, (ctx) => {
      roundRect(ctx, 12, 52, 8, 34, 4);
      fillStroke(ctx, '#3b3555', OUT, 2);
      roundRect(ctx, 24, 52, 8, 34, 4);
      fillStroke(ctx, '#3b3555', OUT, 2);
      roundRect(ctx, 8, 28, 28, 30, 10);
      fillStroke(ctx, shirt, OUT, 2.5);
      ellipse(ctx, 22, 16, 13, 14);
      fillStroke(ctx, '#f2c9a5', OUT, 2.5);
      ctx.beginPath();
      ctx.arc(22, 13, 13, Math.PI, 0);
      ctx.fillStyle = ['#2a2433', '#6e3b24', '#111', '#a0522d', '#333'][i];
      ctx.fill();
      ellipse(ctx, 18, 17, 1.6, 2);
      ellipse(ctx, 26, 17, 1.6, 2);
      ctx.fillStyle = OUT;
      ctx.fill();
    });
  });

  canvasTexture(scene, 'Singapore-lamp', 40, 200, (ctx) => {
    ctx.fillStyle = '#2a2240';
    ctx.fillRect(17, 30, 6, 170);
    roundRect(ctx, 6, 8, 28, 26, 8);
    fillStroke(ctx, '#ffe9a8', OUT, 3);
  });

  canvasTexture(scene, 'Singapore-cone', 30, 36, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(15, 2);
    ctx.lineTo(26, 32);
    ctx.lineTo(4, 32);
    ctx.closePath();
    fillStroke(ctx, '#ff7a2f', OUT, 2.5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(9, 16, 12, 5);
    ctx.fillStyle = '#ff7a2f';
    ctx.fillRect(1, 31, 28, 4);
  });

  canvasTexture(scene, 'Singapore-pulley', 40, 70, (ctx) => {
    ellipse(ctx, 20, 12, 10, 10);
    fillStroke(ctx, '#c0c8e0', OUT, 3);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20, 52);
    ctx.stroke();
    roundRect(ctx, 4, 50, 32, 10, 5);
    fillStroke(ctx, '#ff4d6d', OUT, 2.5);
  });

  // Mái vòm sân bay + thác nước trong nhà
  canvasTexture(scene, 'Singapore-terminal', 900, 340, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.bezierCurveTo(60, 40, w - 60, 40, w, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, 0, 40, 0, h, [[0, 'rgba(120,180,255,0.45)'], [1, 'rgba(60,40,120,0.6)']]);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(180,220,255,0.8)';
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(180,220,255,0.35)';
    ctx.lineWidth = 2;
    for (let x = -w; x < w * 2; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 300, 0);
      ctx.moveTo(x, h);
      ctx.lineTo(x - 300, 0);
      ctx.stroke();
    }
    // vườn trong nhà
    ctx.fillStyle = 'rgba(80,180,110,0.8)';
    for (let i = 0; i < 30; i++) {
      ellipse(ctx, 100 + Math.random() * (w - 200), h - 20 - Math.random() * 60, 30, 18);
      ctx.fill();
    }
    ctx.restore();
  });

  canvasTexture(scene, 'Singapore-arch', 240, 200, (ctx, w, h) => {
    ctx.fillStyle = '#2a2240';
    ctx.fillRect(14, 40, 16, h - 40);
    ctx.fillRect(w - 30, 40, 16, h - 40);
    roundRect(ctx, 4, 6, w - 8, 52, 14);
    fillStroke(ctx, linear(ctx, 0, 6, 0, 58, [[0, '#ffe066'], [1, '#ff9f1c']]), OUT, 4);
    ctx.fillStyle = '#fff';
    for (let x = 18; x < w - 14; x += 14) {
      ellipse(ctx, x, 62, 3, 3);
      ctx.fill();
    }
  });
}
