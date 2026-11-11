// Texture cho ván Ninh Thuận: cát, đồi cát, xe jeep, xương rồng, cối xay gió, nho, cừu, điểm ngắm hoàng hôn.
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const OUTLINE = '#3a2a3f';

export function createNinhThuanTextures(scene) {
  // Nền cát có gợn
  canvasTexture(scene, 'NinhThuan-sand', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f3cf8a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,140,70,0.28)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const y = (i * 29) % h;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = y + Math.sin((x / w) * Math.PI * 4 + i) * 6;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,240,200,0.35)';
    for (let i = 0; i < 80; i++) {
      ellipse(ctx, (i * 137) % w, (i * 71) % h, 2, 1.2);
      ctx.fill();
    }
  });

  // Đồi cát (sáng 1 phía, bóng 1 phía)
  canvasTexture(scene, 'NinhThuan-dune', 420, 260, (ctx, w, h) => {
    ctx.save();
    ctx.scale(1, h / w);
    ctx.fillStyle = radial(ctx, w * 0.42, w * 0.4, 10, w * 0.5, [[0, 'rgba(255,236,190,0.95)'], [0.55, 'rgba(240,190,110,0.7)'], [1, 'rgba(200,140,70,0)']]);
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.quadraticCurveTo(210, 40, 360, 130);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,250,230,0.8)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(70, 150);
    ctx.quadraticCurveTo(210, 60, 350, 140);
    ctx.quadraticCurveTo(220, 210, 70, 150);
    ctx.fillStyle = 'rgba(180,110,50,0.22)';
    ctx.fill();
  });

  // Xe jeep nhìn từ trên (đầu xe hướng lên)
  canvasTexture(scene, 'NinhThuan-jeep', 96, 140, (ctx) => {
    // bánh
    [[12, 30], [84, 30], [12, 108], [84, 108]].forEach(([x, y]) => {
      roundRect(ctx, x - 9, y - 16, 18, 32, 6);
      fillStroke(ctx, '#2b2433', OUTLINE, 2);
    });
    // thân
    roundRect(ctx, 16, 8, 64, 126, 16);
    fillStroke(ctx, linear(ctx, 16, 0, 80, 0, [[0, '#ff9f4a'], [0.5, '#ffb866'], [1, '#e8782c']]), OUTLINE, 3);
    // nắp capo
    roundRect(ctx, 22, 12, 52, 34, 10);
    fillStroke(ctx, linear(ctx, 0, 12, 0, 46, [[0, '#ffc98a'], [1, '#ff9f4a']]), OUTLINE, 2);
    ctx.strokeStyle = 'rgba(58,42,63,0.5)';
    ctx.lineWidth = 2;
    for (let x = 32; x <= 64; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 26);
      ctx.stroke();
    }
    // đèn
    [[26, 10], [70, 10]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 6, 4);
      fillStroke(ctx, '#fff6c2', OUTLINE, 2);
    });
    // kính chắn gió
    roundRect(ctx, 20, 48, 56, 9, 4);
    fillStroke(ctx, linear(ctx, 0, 48, 0, 57, [[0, '#bfe9ff'], [1, '#6fb7e0']]), OUTLINE, 2);
    // khoang ngồi
    roundRect(ctx, 22, 60, 52, 60, 8);
    fillStroke(ctx, '#6b4a3a', OUTLINE, 2);
    [[34, 74], [62, 74], [48, 104]].forEach(([x, y], i) => {
      roundRect(ctx, x - (i === 2 ? 20 : 10), y - 8, i === 2 ? 40 : 20, 16, 5);
      fillStroke(ctx, '#c9a27a', OUTLINE, 1.5);
    });
    // khung chống lật
    ctx.lineWidth = 5;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.moveTo(18, 92);
    ctx.lineTo(78, 92);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d6d0de';
    ctx.stroke();
    // bánh dự phòng
    ellipse(ctx, 48, 134, 14, 6);
    fillStroke(ctx, '#2b2433', OUTLINE, 2);
  });

  // Xương rồng (hơi nghiêng 2.5D)
  canvasTexture(scene, 'NinhThuan-cactus', 70, 96, (ctx) => {
    ellipse(ctx, 35, 88, 26, 7);
    ctx.fillStyle = 'rgba(120,70,20,0.3)';
    ctx.fill();
    const arm = (x, y, w, h) => {
      roundRect(ctx, x, y, w, h, w / 2);
      fillStroke(ctx, linear(ctx, x, 0, x + w, 0, [[0, '#7fd08a'], [1, '#3f9a52']]), OUTLINE, 2.5);
    };
    arm(8, 30, 14, 34);
    arm(48, 22, 14, 30);
    arm(14, 52, 18, 12);
    arm(40, 46, 18, 12);
    arm(24, 8, 22, 82);
    ctx.fillStyle = '#fff6d0';
    for (let i = 0; i < 14; i++) {
      ellipse(ctx, 28 + (i % 3) * 7, 16 + i * 5, 1.2, 1.2);
      ctx.fill();
    }
    ellipse(ctx, 35, 10, 6, 5);
    fillStroke(ctx, '#ff7eb3', OUTLINE, 1.5);
  });

  // Cối xay gió: tháp + cánh
  canvasTexture(scene, 'NinhThuan-tower', 40, 260, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(26, 10);
    ctx.lineTo(30, 254);
    ctx.lineTo(10, 254);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 10, 0, 30, 0, [[0, '#ffffff'], [1, '#c9c3d6']]), OUTLINE, 2.5);
    ellipse(ctx, 20, 12, 9, 9);
    fillStroke(ctx, '#f2f0f7', OUTLINE, 2.5);
  });
  canvasTexture(scene, 'NinhThuan-blades', 220, 220, (ctx) => {
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(110, 110);
      ctx.rotate((i / 3) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(-10, -60, -2, -104);
      ctx.lineTo(4, -104);
      ctx.quadraticCurveTo(10, -40, 6, 0);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, -8, 0, 8, 0, [[0, '#ffffff'], [1, '#d6d0e2']]), OUTLINE, 2.5);
      ctx.restore();
    }
    ellipse(ctx, 110, 110, 9, 9);
    fillStroke(ctx, '#ff7a59', OUTLINE, 2.5);
  });

  // Giàn nho
  canvasTexture(scene, 'NinhThuan-vine', 160, 50, (ctx) => {
    ctx.fillStyle = '#7a4a2a';
    [8, 78, 148].forEach((x) => ctx.fillRect(x, 6, 5, 42));
    ctx.strokeStyle = '#7a4a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(152, 12);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      ellipse(ctx, 10 + i * 10.5, 16 + (i % 2) * 6, 11, 9);
      fillStroke(ctx, i % 2 ? '#5fc36a' : '#48a85a', OUTLINE, 1.6);
    }
    [[30, 30], [92, 32], [130, 28]].forEach(([x, y]) => {
      for (let k = 0; k < 5; k++) {
        ellipse(ctx, x + (k % 2) * 5 - 2, y + Math.floor(k / 2) * 4, 3, 3);
        ctx.fillStyle = '#7b3fa8';
        ctx.fill();
      }
    });
  });

  // Chùm nho để hái
  canvasTexture(scene, 'NinhThuan-grape', 56, 70, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(28, 14);
    ctx.quadraticCurveTo(30, 4, 38, 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6b4a2e';
    ctx.stroke();
    ellipse(ctx, 40, 12, 10, 6, -0.4);
    fillStroke(ctx, '#5fc36a', OUTLINE, 2);
    const rows = [[3, 22], [4, 32], [3, 42], [2, 52], [1, 61]];
    rows.forEach(([n, y]) => {
      for (let i = 0; i < n; i++) {
        const x = 28 + (i - (n - 1) / 2) * 10;
        ellipse(ctx, x, y, 6, 6);
        fillStroke(ctx, radial(ctx, x - 2, y - 2, 1, 7, [[0, '#d7a6ff'], [1, '#7b3fa8']]), OUTLINE, 1.8);
      }
    });
  });

  // Cừu (nhìn hơi nghiêng)
  canvasTexture(scene, 'NinhThuan-sheep', 64, 50, (ctx) => {
    [[18, 38], [28, 40], [40, 40], [48, 38]].forEach(([x, y]) => {
      roundRect(ctx, x - 3, y, 6, 10, 2);
      fillStroke(ctx, '#3a2a3f', null);
    });
    [[16, 24], [26, 18], [38, 18], [48, 24], [22, 32], [36, 34], [46, 30]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 11, 10);
      fillStroke(ctx, '#ffffff', OUTLINE, 2);
    });
    [[16, 24], [26, 18], [38, 18], [48, 24], [22, 32], [36, 34], [46, 30]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 9, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
    ellipse(ctx, 56, 22, 8, 9);
    fillStroke(ctx, '#4a3a4f', OUTLINE, 2);
    ellipse(ctx, 58, 20, 1.6, 1.6);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });

  // Điểm ngắm hoàng hôn: sàn gỗ + cờ
  canvasTexture(scene, 'NinhThuan-viewpoint', 220, 170, (ctx) => {
    ellipse(ctx, 110, 150, 100, 18);
    ctx.fillStyle = 'rgba(120,70,20,0.3)';
    ctx.fill();
    roundRect(ctx, 20, 96, 180, 50, 12);
    fillStroke(ctx, linear(ctx, 0, 96, 0, 146, [[0, '#d9a066'], [1, '#a86e3f']]), OUTLINE, 3);
    ctx.strokeStyle = 'rgba(58,42,63,0.4)';
    ctx.lineWidth = 2;
    for (let x = 44; x < 200; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 98);
      ctx.lineTo(x, 144);
      ctx.stroke();
    }
    roundRect(ctx, 150, 8, 6, 100, 3);
    fillStroke(ctx, '#7a4a2a', OUTLINE, 2);
    ctx.beginPath();
    ctx.moveTo(156, 12);
    ctx.lineTo(206, 26);
    ctx.lineTo(156, 42);
    ctx.closePath();
    fillStroke(ctx, '#ff5d8f', OUTLINE, 2.5);
    // ống nhòm
    roundRect(ctx, 54, 70, 26, 14, 5);
    fillStroke(ctx, '#5b6378', OUTLINE, 2);
    roundRect(ctx, 64, 82, 6, 20, 2);
    fillStroke(ctx, '#3f4658', OUTLINE, 2);
  });

  // Vệt gió
  canvasTexture(scene, 'NinhThuan-streak', 64, 6, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, w, 0, [[0, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
    roundRect(ctx, 0, 1, w, h - 2, 2);
    ctx.fill();
  });
}
