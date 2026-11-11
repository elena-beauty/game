// Texture riêng cho ván Phú Quốc — rạn san hô An Thới.
import { canvasTexture, ridgeTexture, linear, radial, ellipse, roundRect, fillStroke, starPath } from '../../utils/canvas.js';

const OUT = '#3a2a3f';

function fish(ctx, w, h, body, belly, stripes = null) {
  const cx = w * 0.45;
  const cy = h / 2;
  // đuôi
  ctx.beginPath();
  ctx.moveTo(w * 0.12, cy);
  ctx.lineTo(2, cy - h * 0.38);
  ctx.quadraticCurveTo(w * 0.08, cy, 2, cy + h * 0.38);
  ctx.closePath();
  fillStroke(ctx, body, OUT, 2.5);
  // thân
  ellipse(ctx, cx + w * 0.08, cy, w * 0.38, h * 0.4);
  fillStroke(ctx, linear(ctx, 0, cy - h * 0.4, 0, cy + h * 0.4, [[0, body], [1, belly]]), OUT, 2.5);
  if (stripes) {
    ctx.save();
    ellipse(ctx, cx + w * 0.08, cy, w * 0.38, h * 0.4);
    ctx.clip();
    stripes.forEach((sx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * sx - 4, 0, 8, h);
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 2;
      ctx.strokeRect(w * sx - 4, -2, 8, h + 4);
    });
    ctx.restore();
    ellipse(ctx, cx + w * 0.08, cy, w * 0.38, h * 0.4);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  }
  // mắt
  ellipse(ctx, w * 0.72, cy - h * 0.08, h * 0.11, h * 0.11);
  fillStroke(ctx, '#fff', OUT, 1.5);
  ellipse(ctx, w * 0.735, cy - h * 0.08, h * 0.055, h * 0.055);
  ctx.fillStyle = OUT;
  ctx.fill();
}

export function createPhuQuocTextures(scene) {
  canvasTexture(scene, 'PhuQuoc-water', 1280, 1300, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, 150, [[0, '#6fc6f5'], [0.7, '#c9efff'], [1, '#fff4d6']]);
    ctx.fillRect(0, 0, w, 150);
    ctx.fillStyle = linear(ctx, 0, 150, 0, h, [[0, '#5fe0e6'], [0.25, '#22b5c9'], [0.6, '#137aa6'], [1, '#0b4f7a']]);
    ctx.fillRect(0, 150, w, h - 150);
  });

  // Quần đảo An Thới nhìn từ mặt biển
  canvasTexture(scene, 'PhuQuoc-islands', 1600, 90, (ctx, w, h) => {
    [[60, 120, 50], [260, 200, 70], [520, 90, 40], [700, 260, 80], [1020, 140, 55], [1250, 220, 65], [1480, 110, 45]].forEach(([x, bw, bh]) => {
      ctx.beginPath();
      ctx.moveTo(x - bw / 2, h);
      ctx.bezierCurveTo(x - bw / 3, h - bh, x + bw / 3, h - bh * 1.1, x + bw / 2, h);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, h - bh, 0, h, [[0, '#4fa86a'], [1, '#2f6f4a']]), '#2a4a3a', 2);
      // cây trên đảo
      ctx.fillStyle = '#2f7a46';
      for (let i = 0; i < 5; i++) {
        ellipse(ctx, x - bw / 4 + i * (bw / 8), h - bh * 0.8 + Math.abs(i - 2) * 6, 10, 7);
        ctx.fill();
      }
    });
    // cáp treo Hòn Thơm (đường mảnh)
    ctx.strokeStyle = 'rgba(60,60,80,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(400, 70, 760, 20);
    ctx.stroke();
    [[180, 46], [470, 50]].forEach(([x, y]) => {
      roundRect(ctx, x - 6, y, 12, 10, 3);
      fillStroke(ctx, '#ff6b6b', '#2a2a3a', 1.5);
    });
  });

  canvasTexture(scene, 'PhuQuoc-shark', 230, 110, (ctx, w, h) => {
    // vây lưng
    ctx.beginPath();
    ctx.moveTo(100, 34);
    ctx.lineTo(126, 2);
    ctx.lineTo(140, 36);
    ctx.closePath();
    fillStroke(ctx, '#6f8796', OUT, 3);
    // đuôi
    ctx.beginPath();
    ctx.moveTo(40, 58);
    ctx.lineTo(4, 18);
    ctx.lineTo(18, 60);
    ctx.lineTo(4, 100);
    ctx.closePath();
    fillStroke(ctx, '#6f8796', OUT, 3);
    // thân
    ctx.beginPath();
    ctx.moveTo(30, 58);
    ctx.bezierCurveTo(70, 20, 180, 20, 226, 56);
    ctx.bezierCurveTo(190, 92, 70, 92, 30, 58);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 26, 0, 90, [[0, '#8fa9b8'], [0.55, '#7b95a5'], [0.56, '#eef4f7'], [1, '#d7e3ea']]), OUT, 3);
    // vây ngực
    ctx.beginPath();
    ctx.moveTo(140, 70);
    ctx.lineTo(120, 102);
    ctx.lineTo(162, 76);
    ctx.closePath();
    fillStroke(ctx, '#7b95a5', OUT, 2.5);
    // miệng răng
    ctx.beginPath();
    ctx.moveTo(176, 68);
    ctx.quadraticCurveTo(200, 80, 218, 64);
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    for (let x = 182; x < 214; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x + 3, 76);
      ctx.lineTo(x + 6, 70);
      ctx.fill();
    }
    // mắt dữ
    ellipse(ctx, 196, 48, 6, 6);
    fillStroke(ctx, '#fff', OUT, 2);
    ellipse(ctx, 198, 48, 3, 3);
    ctx.fillStyle = OUT;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(186, 38);
    ctx.lineTo(204, 42);
    ctx.lineWidth = 3;
    ctx.stroke();
    // mang
    ctx.lineWidth = 2;
    [160, 166, 172].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 46);
      ctx.quadraticCurveTo(x - 4, 56, x, 66);
      ctx.stroke();
    });
  });

  canvasTexture(scene, 'PhuQuoc-octopus', 110, 110, (ctx) => {
    for (let i = 0; i < 6; i++) {
      const x = 22 + i * 13;
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.quadraticCurveTo(x + (i - 2.5) * 6, 90, x + (i - 2.5) * 10, 104);
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.strokeStyle = OUT;
      ctx.stroke();
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#e06aa8';
      ctx.stroke();
    }
    ellipse(ctx, 55, 44, 36, 36);
    fillStroke(ctx, radial(ctx, 45, 30, 4, 40, [[0, '#ffb3d9'], [1, '#c2417f']]), OUT, 3);
    [[42, 46], [68, 46]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 7, 8);
      fillStroke(ctx, '#fff', OUT, 2);
      ellipse(ctx, x + 1, y + 1, 3.5, 4);
      ctx.fillStyle = OUT;
      ctx.fill();
    });
    ellipse(ctx, 55, 62, 6, 4);
    fillStroke(ctx, '#7a1f4a', OUT, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    [[40, 22], [62, 18], [72, 30]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 4, 3);
      ctx.fill();
    });
  });

  canvasTexture(scene, 'PhuQuoc-ink', 512, 512, (ctx) => {
    for (let i = 0; i < 26; i++) {
      const x = 256 + (Math.random() - 0.5) * 300;
      const y = 256 + (Math.random() - 0.5) * 300;
      const r = 60 + Math.random() * 110;
      ctx.fillStyle = radial(ctx, x, y, 0, r, [[0, 'rgba(20,10,30,0.85)'], [1, 'rgba(20,10,30,0)']]);
      ctx.fillRect(0, 0, 512, 512);
    }
  });

  canvasTexture(scene, 'PhuQuoc-jelly', 70, 100, (ctx) => {
    for (let i = 0; i < 5; i++) {
      const x = 16 + i * 9.5;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.bezierCurveTo(x - 8, 60, x + 8, 76, x + (i % 2 ? 4 : -4), 98);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,150,210,0.9)';
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(4, 44);
    ctx.bezierCurveTo(4, -6, 66, -6, 66, 44);
    ctx.quadraticCurveTo(50, 36, 35, 44);
    ctx.quadraticCurveTo(20, 36, 4, 44);
    ctx.closePath();
    fillStroke(ctx, radial(ctx, 30, 18, 2, 40, [[0, 'rgba(255,230,245,0.95)'], [1, 'rgba(255,120,200,0.75)']]), '#a33a7a', 2.5);
    ellipse(ctx, 26, 26, 3, 3.5);
    ellipse(ctx, 44, 26, 3, 3.5);
    ctx.fillStyle = OUT;
    ctx.fill();
  });

  canvasTexture(scene, 'PhuQuoc-eel', 160, 50, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(40, 6, 90, 50, 130, 20);
    ctx.quadraticCurveTo(156, 14, 156, 28);
    ctx.quadraticCurveTo(150, 44, 126, 40);
    ctx.bezierCurveTo(90, 66, 40, 26, 0, 46);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 6, 0, 50, [[0, '#9fd36a'], [1, '#4d7f2f']]), OUT, 3);
    ctx.fillStyle = 'rgba(40,60,20,0.5)';
    for (let i = 0; i < 14; i++) {
      ellipse(ctx, 10 + i * 9, 30 + Math.sin(i) * 5, 2.5, 2.5);
      ctx.fill();
    }
    ellipse(ctx, 140, 24, 4, 4);
    fillStroke(ctx, '#ffe066', OUT, 1.5);
    ctx.beginPath();
    ctx.moveTo(140, 36);
    ctx.lineTo(154, 32);
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUT;
    ctx.stroke();
  });

  canvasTexture(scene, 'PhuQuoc-cave', 200, 120, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 118);
    ctx.quadraticCurveTo(6, 20, 90, 10);
    ctx.quadraticCurveTo(190, 6, 196, 118);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, 118, [[0, '#7a8f9c'], [1, '#3b4f5e']]), OUT, 3);
    ellipse(ctx, 100, 74, 30, 22);
    ctx.fillStyle = '#0d1b26';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,140,190,0.8)';
    [[40, 30], [150, 26], [170, 60]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 8, 5);
      ctx.fill();
    });
  });

  canvasTexture(scene, 'PhuQuoc-surface', 256, 40, (ctx, w) => {
    ctx.beginPath();
    ctx.moveTo(0, 14);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, 14 + Math.sin((x / w) * Math.PI * 4) * 5);
    ctx.lineTo(w, 40);
    ctx.lineTo(0, 40);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,250,255,0.55)';
    ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, 14 + Math.sin((x / w) * Math.PI * 4) * 5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();
  });

  canvasTexture(scene, 'PhuQuoc-ray', 220, 900, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.35, 0);
    ctx.lineTo(w * 0.65, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, 'rgba(255,255,230,0.55)'], [1, 'rgba(255,255,230,0)']]);
    ctx.fill();
  });

  canvasTexture(scene, 'PhuQuoc-caustic', 256, 256, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    let s = 5;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 18; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.ellipse(x, y, 18 + rnd() * 22, 10 + rnd() * 14, rnd() * 3, 0, Math.PI * 1.6);
      ctx.stroke();
    }
  });

  ridgeTexture(scene, 'PhuQuoc-reef-far', 2400, 420, { base: 0.55, amp: 0.3, bumps: 7, color: '#0d5a7d', top: '#1a7a9a', seed: 11 });
  ridgeTexture(scene, 'PhuQuoc-reef-mid', 2400, 300, { base: 0.6, amp: 0.3, bumps: 11, color: '#0f6a7a', top: '#1f8c8e', seed: 23 });

  canvasTexture(scene, 'PhuQuoc-sand', 3200, 170, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, 30);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, 26 + Math.sin(x * 0.006) * 10 + Math.sin(x * 0.021) * 5);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, 0, 10, 0, h, [[0, '#f6e2b0'], [1, '#c99e64']]);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    ctx.fillStyle = 'rgba(140,100,60,0.35)';
    for (let i = 0; i < 400; i++) {
      ellipse(ctx, Math.random() * w, 50 + Math.random() * (h - 50), 2 + Math.random() * 3, 1.5 + Math.random() * 2);
      ctx.fill();
    }
  });

  // San hô cành
  canvasTexture(scene, 'PhuQuoc-coral1', 120, 130, (ctx) => {
    ctx.lineCap = 'round';
    const branch = (x, y, a, len, wdt, depth) => {
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      ctx.strokeStyle = OUT;
      ctx.lineWidth = wdt + 5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = '#ff7aa8';
      ctx.lineWidth = wdt;
      ctx.stroke();
      if (depth > 0) {
        branch(x2, y2, a - 0.45, len * 0.72, wdt * 0.78, depth - 1);
        branch(x2, y2, a + 0.45, len * 0.72, wdt * 0.78, depth - 1);
      } else {
        ellipse(ctx, x2, y2, wdt * 0.8, wdt * 0.8);
        fillStroke(ctx, '#ffc2d6', OUT, 2);
      }
    };
    branch(60, 128, -Math.PI / 2, 40, 13, 3);
  });

  // Quạt biển
  canvasTexture(scene, 'PhuQuoc-coral2', 130, 120, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(65, 118);
    ctx.bezierCurveTo(-10, 90, 0, 0, 65, 6);
    ctx.bezierCurveTo(130, 0, 140, 90, 65, 118);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, 118, [[0, '#c792ea'], [1, '#7b4bc4']]), OUT, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(65, 116);
      ctx.quadraticCurveTo(65 + i * 10, 60, 65 + i * 13, 14 + Math.abs(i) * 6);
      ctx.stroke();
    }
  });

  // San hô ống
  canvasTexture(scene, 'PhuQuoc-coral3', 100, 100, (ctx) => {
    [[22, 50, 12], [44, 22, 14], [64, 40, 13], [82, 60, 10]].forEach(([x, top, r]) => {
      roundRect(ctx, x - r, top, r * 2, 98 - top, r);
      fillStroke(ctx, linear(ctx, 0, top, 0, 98, [[0, '#ffb35c'], [1, '#e2711d']]), OUT, 2.5);
      ellipse(ctx, x, top + 4, r - 3, 4);
      ctx.fillStyle = '#7a3410';
      ctx.fill();
    });
  });

  canvasTexture(scene, 'PhuQuoc-kelp', 50, 220, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(22, 220);
    for (let y = 220; y > 10; y -= 10) ctx.lineTo(22 + Math.sin(y * 0.05) * 8, y);
    for (let y = 10; y <= 220; y += 10) ctx.lineTo(30 + Math.sin(y * 0.05) * 8, y);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, 220, [[0, '#8fe36a'], [1, '#2f8f46']]), OUT, 2.5);
    for (let y = 40; y < 210; y += 36) {
      ellipse(ctx, 26 + Math.sin(y * 0.05) * 8 + (y % 72 ? 10 : -10), y, 9, 4, y % 72 ? 0.5 : -0.5);
      fillStroke(ctx, '#6fd06a', OUT, 2);
    }
  });

  canvasTexture(scene, 'PhuQuoc-rock', 220, 110, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 108);
    ctx.quadraticCurveTo(10, 30, 70, 18);
    ctx.quadraticCurveTo(120, 0, 170, 22);
    ctx.quadraticCurveTo(216, 40, 216, 108);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, 108, [[0, '#6e8a99'], [1, '#3b4f5e']]), OUT, 3);
    ctx.fillStyle = 'rgba(120,220,140,0.6)';
    ellipse(ctx, 90, 22, 30, 7);
    ctx.fill();
  });

  // Loài để chụp
  canvasTexture(scene, 'PhuQuoc-clown', 76, 48, (ctx, w, h) => fish(ctx, w, h, '#ff8a2b', '#ffb066', [0.42, 0.68]));
  canvasTexture(scene, 'PhuQuoc-anemone', 140, 90, (ctx) => {
    for (let i = 0; i < 16; i++) {
      const x = 14 + i * 7.5;
      ctx.beginPath();
      ctx.moveTo(x, 88);
      ctx.quadraticCurveTo(x + Math.sin(i) * 14, 40, x + Math.sin(i * 1.7) * 10, 10 + (i % 3) * 8);
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.strokeStyle = OUT;
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.strokeStyle = i % 2 ? '#c4f07a' : '#9fe36a';
      ctx.stroke();
    }
  });
  canvasTexture(scene, 'PhuQuoc-starfish', 70, 70, (ctx) => {
    starPath(ctx, 35, 37, 5, 32, 13);
    fillStroke(ctx, linear(ctx, 0, 5, 0, 68, [[0, '#ffb45c'], [1, '#ff6b3d']]), OUT, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      for (let r = 8; r < 26; r += 7) {
        ellipse(ctx, 35 + Math.cos(a) * r, 37 + Math.sin(a) * r, 2, 2);
        ctx.fill();
      }
    }
    ellipse(ctx, 29, 33, 3, 3.5);
    ellipse(ctx, 41, 33, 3, 3.5);
    ctx.fillStyle = OUT;
    ctx.fill();
  });
  canvasTexture(scene, 'PhuQuoc-turtle', 160, 104, (ctx) => {
    // chân
    [[40, 26, -0.6], [40, 80, 0.6], [104, 22, -0.3], [104, 84, 0.3]].forEach(([x, y, r]) => {
      ellipse(ctx, x, y, 22, 9, r);
      fillStroke(ctx, '#8bd17c', OUT, 2.5);
    });
    // đầu
    ellipse(ctx, 138, 52, 18, 15);
    fillStroke(ctx, '#9ee08f', OUT, 2.5);
    ellipse(ctx, 144, 47, 3, 3.5);
    ctx.fillStyle = OUT;
    ctx.fill();
    // mai
    ellipse(ctx, 76, 52, 52, 38);
    fillStroke(ctx, radial(ctx, 70, 44, 6, 56, [[0, '#d0a65c'], [1, '#7a5420']]), OUT, 3);
    ctx.strokeStyle = 'rgba(60,35,10,0.6)';
    ctx.lineWidth = 2.5;
    [[76, 52, 18], [48, 40, 10], [104, 40, 10], [48, 66, 10], [104, 66, 10]].forEach(([x, y, r]) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.stroke();
    });
  });
  canvasTexture(scene, 'PhuQuoc-seahorse', 60, 100, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.quadraticCurveTo(52, 8, 54, 22);
    ctx.lineTo(44, 26);
    ctx.quadraticCurveTo(48, 50, 36, 66);
    ctx.quadraticCurveTo(28, 82, 40, 88);
    ctx.quadraticCurveTo(46, 96, 34, 96);
    ctx.quadraticCurveTo(16, 92, 20, 74);
    ctx.quadraticCurveTo(10, 50, 18, 34);
    ctx.quadraticCurveTo(14, 16, 30, 12);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 10, 0, 96, [[0, '#ffe066'], [1, '#ffa94d']]), OUT, 2.5);
    ellipse(ctx, 36, 19, 3, 3);
    ctx.fillStyle = OUT;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,90,10,0.6)';
    ctx.lineWidth = 2;
    for (let y = 36; y < 70; y += 8) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(36, y + 2);
      ctx.stroke();
    }
    ellipse(ctx, 12, 48, 6, 10, 0.3);
    fillStroke(ctx, 'rgba(255,240,180,0.9)', OUT, 2);
  });
  canvasTexture(scene, 'PhuQuoc-brain', 140, 86, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 84);
    ctx.bezierCurveTo(4, 0, 136, 0, 136, 84);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 10, 0, 84, [[0, '#b8f2a0'], [1, '#5fb35f']]), OUT, 3);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(40,90,40,0.6)';
    ctx.lineWidth = 3;
    for (let r = 12; r < 80; r += 12) {
      ctx.beginPath();
      for (let a = Math.PI; a <= Math.PI * 2; a += 0.08) ctx.lineTo(70 + Math.cos(a) * r * 0.9, 84 + Math.sin(a) * r * 0.95 + Math.sin(a * 12) * 3);
      ctx.stroke();
    }
    ctx.restore();
  });

  canvasTexture(scene, 'PhuQuoc-urchin', 64, 52, (ctx) => {
    ctx.strokeStyle = '#2a1636';
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = Math.PI + (i / 17) * Math.PI;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(32, 40);
      ctx.lineTo(32 + Math.cos(a) * 30, 40 + Math.sin(a) * 34);
      ctx.stroke();
    }
    ellipse(ctx, 32, 40, 16, 12);
    fillStroke(ctx, radial(ctx, 28, 35, 2, 16, [[0, '#9b6bd4'], [1, '#3f2063']]), OUT, 2.5);
  });

  canvasTexture(scene, 'PhuQuoc-grouper', 220, 130, (ctx, w, h) => {
    fish(ctx, w, h, '#8a6a4f', '#d9b38c');
    ctx.fillStyle = 'rgba(70,45,25,0.45)';
    for (let i = 0; i < 16; i++) {
      ellipse(ctx, 80 + Math.random() * 90, 40 + Math.random() * 50, 5, 4);
      ctx.fill();
    }
    // môi dày
    ellipse(ctx, 196, 72, 12, 7);
    fillStroke(ctx, '#c98a6a', OUT, 2.5);
  });

  canvasTexture(scene, 'PhuQuoc-fish1', 40, 24, (ctx, w, h) => fish(ctx, w, h, '#4cc9f0', '#bdf0ff'));
  canvasTexture(scene, 'PhuQuoc-fish2', 40, 24, (ctx, w, h) => fish(ctx, w, h, '#ffd166', '#fff3c4'));
  canvasTexture(scene, 'PhuQuoc-fish3', 40, 24, (ctx, w, h) => fish(ctx, w, h, '#b56cff', '#e9d1ff'));

  canvasTexture(scene, 'PhuQuoc-bubble', 24, 24, (ctx) => {
    ellipse(ctx, 12, 12, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ellipse(ctx, 8, 8, 3, 2, -0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  });

  canvasTexture(scene, 'PhuQuoc-arrow', 48, 48, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(44, 24);
    ctx.lineTo(18, 6);
    ctx.lineTo(18, 16);
    ctx.lineTo(4, 16);
    ctx.lineTo(4, 32);
    ctx.lineTo(18, 32);
    ctx.lineTo(18, 42);
    ctx.closePath();
    fillStroke(ctx, '#ffd166', OUT, 3);
  });

  canvasTexture(scene, 'PhuQuoc-check', 40, 40, (ctx) => {
    ellipse(ctx, 20, 20, 17, 17);
    fillStroke(ctx, '#48c774', OUT, 3);
    ctx.beginPath();
    ctx.moveTo(11, 21);
    ctx.lineTo(18, 28);
    ctx.lineTo(30, 13);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  });

  // Thuyền câu nổi trên mặt nước (nhìn từ dưới lên một phần)
  canvasTexture(scene, 'PhuQuoc-boat', 260, 90, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 30);
    ctx.lineTo(254, 30);
    ctx.quadraticCurveTo(240, 84, 200, 86);
    ctx.lineTo(50, 86);
    ctx.quadraticCurveTo(16, 80, 6, 30);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 30, 0, 86, [[0, '#4a90d9'], [1, '#1f4f8a']]), OUT, 3);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(10, 34, 240, 8);
    roundRect(ctx, 90, 0, 80, 32, 6);
    fillStroke(ctx, '#fff8ee', OUT, 3);
  });
}
