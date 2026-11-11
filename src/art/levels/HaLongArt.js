// Texture cho ván Hạ Long: nước ngọc lục bảo, đảo đá vôi, hòn đá nổi tiếng, kayak, nhà bè, lưới, tàu du lịch, du thuyền...
import { canvasTexture, roundRect, linear, fillStroke, ellipse } from '../../utils/canvas.js';

const OUTLINE = '#3a2a3f';

/** Khối đá vôi nhìn chéo từ trên: chân tối, vách sọc, đỉnh phủ cây. */
function karst(ctx, w, h, seed, shape = null) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const cx = w / 2;
  // bóng trên mặt nước
  ellipse(ctx, cx + 10, h - 30, w * 0.46, 26);
  ctx.fillStyle = 'rgba(10,60,60,0.35)';
  ctx.fill();
  // thân đá
  const pts = shape ?? [];
  if (!shape) {
    // Đỉnh tròn kiểu "mái vòm" + răng cưa ngẫu nhiên, 2 mép thấp dần xuống
    const n = 10;
    const peak = 0.3 + rnd() * 0.4;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = w * (0.1 + 0.8 * t);
      const dome = Math.pow(Math.abs(t - peak) / Math.max(peak, 1 - peak), 1.6);
      const top = h * (0.06 + 0.5 * dome + rnd() * 0.07);
      pts.push([x, top]);
    }
  }
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h - 34);
  pts.forEach(([x, y], i) => (i ? ctx.quadraticCurveTo((pts[i - 1][0] + x) / 2, Math.min(pts[i - 1][1], y) - 8, x, y) : ctx.lineTo(x, y)));
  ctx.lineTo(w * 0.94, h - 34);
  ctx.quadraticCurveTo(cx, h - 18, w * 0.06, h - 34);
  ctx.closePath();
  fillStroke(ctx, linear(ctx, 0, 0, w, 0, [[0, '#c9cfc4'], [0.45, '#9aa69a'], [1, '#6c7a70']]), OUTLINE, 3);
  ctx.save();
  ctx.clip();
  // sọc vách
  ctx.strokeStyle = 'rgba(58,42,63,0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const x = w * 0.1 + rnd() * w * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.2 + rnd() * 30);
    ctx.lineTo(x + (rnd() - 0.5) * 14, h - 30 - rnd() * 40);
    ctx.stroke();
  }
  // cây phủ đỉnh
  pts.forEach(([x, y]) => {
    for (let k = 0; k < 3; k++) {
      ellipse(ctx, x + (rnd() - 0.5) * 30, y + 8 + rnd() * 26, 18 + rnd() * 10, 13 + rnd() * 6);
      ctx.fillStyle = k % 2 ? '#4fa36b' : '#3a8a57';
      ctx.fill();
    }
  });
  // chân đá sậm (bị nước bào)
  ctx.fillStyle = 'rgba(40,60,50,0.45)';
  ctx.fillRect(0, h - 56, w, 30);
  ctx.restore();
  // viền nước vỗ chân đá
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h - 34);
  ctx.quadraticCurveTo(cx, h - 18, w * 0.94, h - 34);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.stroke();
}

export function createHaLongTextures(scene) {
  // Nước xanh ngọc
  canvasTexture(scene, 'HaLong-water', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2bb0a1';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(200,255,240,0.28)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 14; i++) {
      const x = (i * 71) % w;
      const y = (i * 43) % h;
      ctx.beginPath();
      ctx.arc(x, y, 10 + (i % 4) * 4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  });

  [0, 1, 2].forEach((i) => canvasTexture(scene, `HaLong-karst${i}`, 240, 280, (ctx, w, h) => karst(ctx, w, h, 13 + i * 31)));

  // Hòn Trống Mái: 2 khối đá chạm đầu
  canvasTexture(scene, 'HaLong-trongmai', 260, 300, (ctx, w, h) => {
    ctx.save();
    ctx.translate(-20, 0);
    karst(ctx, 170, h, 77, [[30, 150], [70, 60], [110, 30], [150, 70]]);
    ctx.restore();
    ctx.save();
    ctx.translate(100, 30);
    karst(ctx, 160, h - 30, 91, [[20, 50], [60, 20], [110, 80], [140, 140]]);
    ctx.restore();
  });
  // Hòn Đỉnh Hương: hình lư hương
  canvasTexture(scene, 'HaLong-dinhhuong', 220, 300, (ctx, w, h) => {
    ellipse(ctx, 120, h - 30, 90, 22);
    ctx.fillStyle = 'rgba(10,60,60,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(90, h - 34);
    ctx.quadraticCurveTo(70, 190, 40, 130);
    ctx.quadraticCurveTo(20, 60, 110, 40);
    ctx.quadraticCurveTo(200, 60, 180, 130);
    ctx.quadraticCurveTo(150, 190, 130, h - 34);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, w, 0, [[0, '#cfd5c9'], [0.5, '#9aa69a'], [1, '#6c7a70']]), OUTLINE, 3);
    [[70, 46], [110, 34], [150, 48]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 24, 14);
      ctx.fillStyle = '#3f9a62';
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(58,42,63,0.25)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(60 + i * 18, 70);
      ctx.lineTo(80 + i * 10, 200);
      ctx.stroke();
    }
  });
  // Hòn Chó Đá: hình chú chó ngồi
  canvasTexture(scene, 'HaLong-chouda', 260, 280, (ctx, w, h) => {
    ellipse(ctx, 130, h - 30, 110, 24);
    ctx.fillStyle = 'rgba(10,60,60,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(30, h - 34);
    ctx.quadraticCurveTo(20, 140, 70, 120);
    ctx.quadraticCurveTo(60, 70, 90, 40);
    ctx.lineTo(100, 70);
    ctx.quadraticCurveTo(140, 50, 170, 70);
    ctx.lineTo(185, 36);
    ctx.quadraticCurveTo(210, 80, 190, 120);
    ctx.quadraticCurveTo(240, 150, 230, h - 34);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, w, 0, [[0, '#cfd5c9'], [0.5, '#9aa69a'], [1, '#6c7a70']]), OUTLINE, 3);
    ellipse(ctx, 120, 92, 5, 5);
    ellipse(ctx, 160, 92, 5, 5);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    [[100, 130], [170, 150], [60, 180]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 20, 12);
      ctx.fillStyle = '#4fa36b';
      ctx.fill();
    });
  });

  // Kayak đôi (mũi hướng lên)
  canvasTexture(scene, 'HaLong-kayak', 64, 180, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.bezierCurveTo(62, 50, 62, 130, 32, 176);
    ctx.bezierCurveTo(2, 130, 2, 50, 32, 4);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 64, 0, [[0, '#ff5a4f'], [0.5, '#ff8a5c'], [1, '#d9382f']]), OUTLINE, 3);
    ctx.beginPath();
    ctx.moveTo(32, 8);
    ctx.lineTo(32, 172);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
    [[60, 22], [118, 22]].forEach(([y, hh]) => {
      ellipse(ctx, 32, y, 15, hh);
      fillStroke(ctx, '#3a2a3f', '#ffd166', 3);
    });
  });
  canvasTexture(scene, 'HaLong-paddle', 140, 16, (ctx) => {
    roundRect(ctx, 14, 6, 112, 4, 2);
    fillStroke(ctx, '#d6d0de', OUTLINE, 1.5);
    [[2, 0], [118, 0]].forEach(([x]) => {
      ellipse(ctx, x + 10, 8, 11, 6);
      fillStroke(ctx, '#ffd166', OUTLINE, 2);
    });
  });

  // Nhà bè làng chài
  canvasTexture(scene, 'HaLong-house', 170, 150, (ctx) => {
    roundRect(ctx, 6, 70, 158, 70, 8);
    fillStroke(ctx, '#b07a4a', OUTLINE, 3);
    ctx.strokeStyle = 'rgba(58,42,63,0.4)';
    ctx.lineWidth = 2;
    for (let x = 20; x < 160; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 72);
      ctx.lineTo(x, 138);
      ctx.stroke();
    }
    [[10, 132], [80, 136], [150, 132]].forEach(([x, y]) => {
      ellipse(ctx, x + 6, y, 10, 7);
      fillStroke(ctx, '#2b6cb0', OUTLINE, 2);
    });
    roundRect(ctx, 30, 40, 110, 64, 6);
    fillStroke(ctx, '#fff4dc', OUTLINE, 2.5);
    ctx.beginPath();
    ctx.moveTo(20, 46);
    ctx.lineTo(85, 8);
    ctx.lineTo(150, 46);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 8, 0, 46, [[0, '#5fb4ff'], [1, '#2b6cb0']]), OUTLINE, 3);
    roundRect(ctx, 46, 60, 20, 18, 4);
    fillStroke(ctx, '#7fb6d6', OUTLINE, 2);
    roundRect(ctx, 100, 60, 20, 18, 4);
    fillStroke(ctx, '#7fb6d6', OUTLINE, 2);
    // chậu hoa + cờ
    ellipse(ctx, 150, 66, 8, 8);
    fillStroke(ctx, '#ff5d8f', OUTLINE, 1.5);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(84, 0, 14, 9);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(89, 3, 3, 3);
  });

  // Lưới đánh cá
  canvasTexture(scene, 'HaLong-net', 220, 120, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= w; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 10, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + 4);
      ctx.stroke();
    }
    for (let x = 6; x < w; x += 26) {
      ellipse(ctx, x, 4, 6, 5);
      fillStroke(ctx, '#ff9a3c', OUTLINE, 1.5);
      ellipse(ctx, x + 6, h - 4, 6, 5);
      fillStroke(ctx, '#ff9a3c', OUTLINE, 1.5);
    }
  });

  // Tàu du lịch (nằm ngang, mũi bên phải)
  canvasTexture(scene, 'HaLong-boat', 300, 110, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.lineTo(240, 24);
    ctx.quadraticCurveTo(296, 55, 240, 86);
    ctx.lineTo(10, 80);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 24, 0, 86, [[0, '#ffffff'], [1, '#c9d6e0']]), OUTLINE, 3);
    roundRect(ctx, 40, 36, 150, 38, 10);
    fillStroke(ctx, '#a86e3f', OUTLINE, 2.5);
    for (let x = 52; x < 180; x += 22) {
      roundRect(ctx, x, 44, 14, 10, 3);
      fillStroke(ctx, '#7fd3e0', OUTLINE, 1.5);
    }
    roundRect(ctx, 196, 42, 30, 26, 6);
    fillStroke(ctx, '#ffd166', OUTLINE, 2);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(14, 18, 18, 12);
  });

  // Du thuyền đích
  canvasTexture(scene, 'HaLong-cruise', 560, 230, (ctx) => {
    ellipse(ctx, 290, 200, 270, 26);
    ctx.fillStyle = 'rgba(10,60,60,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(20, 120);
    ctx.lineTo(520, 110);
    ctx.quadraticCurveTo(560, 150, 500, 196);
    ctx.lineTo(60, 196);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 110, 0, 196, [[0, '#ffffff'], [1, '#c4cfd9']]), OUTLINE, 3);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(40, 176, 450, 8);
    roundRect(ctx, 70, 70, 380, 50, 10);
    fillStroke(ctx, '#d9a066', OUTLINE, 3);
    roundRect(ctx, 130, 30, 260, 44, 10);
    fillStroke(ctx, '#fff4dc', OUTLINE, 3);
    roundRect(ctx, 210, 6, 110, 28, 8);
    fillStroke(ctx, '#ffd166', OUTLINE, 2.5);
    for (let x = 84; x < 440; x += 26) {
      roundRect(ctx, x, 82, 16, 14, 4);
      fillStroke(ctx, '#7fd3e0', OUTLINE, 1.5);
    }
    for (let x = 144; x < 380; x += 26) {
      roundRect(ctx, x, 42, 16, 14, 4);
      fillStroke(ctx, '#7fd3e0', OUTLINE, 1.5);
    }
    // dây cờ
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 116);
    ctx.quadraticCurveTo(140, 0, 265, 6);
    ctx.quadraticCurveTo(390, 0, 510, 106);
    ctx.stroke();
    const cols = ['#ff5d8f', '#ffd166', '#5fb4ff', '#7cf29a'];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      const x = 40 + t * 460;
      const y = 104 - Math.sin(t * Math.PI) * 96;
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x, y + 10);
      ctx.closePath();
      ctx.fillStyle = cols[i % 4];
      ctx.fill();
    }
  });

  // Rác trôi: khúc gỗ & thùng xốp
  canvasTexture(scene, 'HaLong-log', 110, 34, (ctx) => {
    roundRect(ctx, 4, 6, 102, 22, 11);
    fillStroke(ctx, linear(ctx, 0, 6, 0, 28, [[0, '#b07a4a'], [1, '#7a4a2a']]), OUTLINE, 2.5);
    ellipse(ctx, 96, 17, 7, 9);
    fillStroke(ctx, '#d9a066', OUTLINE, 2);
  });
  canvasTexture(scene, 'HaLong-crate', 50, 50, (ctx) => {
    roundRect(ctx, 5, 5, 40, 40, 6);
    fillStroke(ctx, '#f4f4f4', OUTLINE, 2.5);
    ctx.strokeStyle = 'rgba(58,42,63,0.3)';
    ctx.beginPath();
    ctx.moveTo(5, 25);
    ctx.lineTo(45, 25);
    ctx.stroke();
  });
  // Cá nhảy
  canvasTexture(scene, 'HaLong-fish', 54, 28, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 14);
    ctx.quadraticCurveTo(24, -2, 42, 14);
    ctx.quadraticCurveTo(24, 30, 6, 14);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 2, 0, 26, [[0, '#cfe8ff'], [1, '#5f8fc4']]), OUTLINE, 2);
    ctx.beginPath();
    ctx.moveTo(40, 14);
    ctx.lineTo(52, 4);
    ctx.lineTo(52, 24);
    ctx.closePath();
    fillStroke(ctx, '#5f8fc4', OUTLINE, 2);
    ellipse(ctx, 14, 12, 2, 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
  });
  // Vòm hang (thạch nhũ) — ngang
  canvasTexture(scene, 'HaLong-arch', 300, 70, (ctx, w, h) => {
    roundRect(ctx, 0, 6, w, 34, 14);
    fillStroke(ctx, linear(ctx, 0, 6, 0, 40, [[0, '#8c968c'], [1, '#55605a']]), OUTLINE, 3);
    for (let x = 18; x < w; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x - 9, 36);
      ctx.lineTo(x, 36 + 14 + (x % 3) * 7);
      ctx.lineTo(x + 9, 36);
      ctx.closePath();
      fillStroke(ctx, '#9aa69a', OUTLINE, 2);
    }
  });
  // Mòng biển
  canvasTexture(scene, 'HaLong-gull', 40, 20, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 12);
    ctx.quadraticCurveTo(10, 2, 20, 12);
    ctx.quadraticCurveTo(30, 2, 38, 12);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
  // Hang tối (vách đá dải ngang)
  canvasTexture(scene, 'HaLong-rockwall', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, w, h, [[0, '#7d887f'], [1, '#5d675f']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(58,42,63,0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const x = (i * 59) % w;
      ctx.beginPath();
      ctx.moveTo(x, (i * 37) % h);
      ctx.lineTo(x + 10, ((i * 37) % h) + 50);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      ellipse(ctx, (i * 83) % w, (i * 53) % h, 16, 10);
      ctx.fillStyle = 'rgba(70,140,90,0.6)';
      ctx.fill();
    }
  });
}
