// Texture riêng cho ván Đà Nẵng — lướt sóng Mỹ Khê & Cầu Rồng.
import { canvasTexture, skyTexture, ridgeTexture, linear, radial, ellipse, roundRect, fillStroke } from '../../utils/canvas.js';

const OUT = '#3a2a3f';

export function createDaNangTextures(scene) {
  skyTexture(scene, 'DaNang-sky', 1280, 720, [[0, '#3fa9ea'], [0.25, '#86d3f7'], [0.34, '#d8f4ff'], [0.36, '#fff1cf'], [1, '#fff1cf']]);

  canvasTexture(scene, 'DaNang-sun', 160, 160, (ctx) => {
    ellipse(ctx, 80, 80, 60, 60);
    ctx.fillStyle = radial(ctx, 80, 80, 6, 60, [[0, '#ffffff'], [0.5, '#fff6b0'], [1, '#ffd166']]);
    ctx.fill();
  });

  // Bán đảo Sơn Trà phía xa
  ridgeTexture(scene, 'DaNang-mountain', 1280, 120, { base: 0.85, amp: 0.55, bumps: 1, color: '#78a9bf', top: '#5f8fa8', seed: 3 });

  canvasTexture(scene, 'DaNang-sea', 1280, 470, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#8fe3ef'], [0.25, '#4cbcd9'], [1, '#1c7fb0']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 70; i++) {
      const y = Math.random() * 90;
      ctx.fillRect(Math.random() * w, y, 10 + Math.random() * 40, 2);
    }
  });

  // Bờ biển xa: cát + dù + chòi cứu hộ
  canvasTexture(scene, 'DaNang-beach', 560, 70, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.quadraticCurveTo(w * 0.5, 26, w, 36);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, 0, 26, 0, h, [[0, '#fff3cf'], [1, '#f0cf8f']]);
    ctx.fill();
    [[60, '#ff6b6b'], [170, '#ffd166'], [300, '#4cc9f0'], [420, '#ff8fb8']].forEach(([x, c]) => {
      ctx.strokeStyle = '#7a5a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, 44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 20, 22);
      ctx.quadraticCurveTo(x, 0, x + 20, 22);
      ctx.closePath();
      fillStroke(ctx, c, OUT, 2);
    });
    // chòi cứu hộ
    ctx.strokeStyle = '#7a4a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(500, 46);
    ctx.lineTo(510, 14);
    ctx.moveTo(530, 46);
    ctx.lineTo(520, 14);
    ctx.stroke();
    roundRect(ctx, 500, 4, 32, 12, 3);
    fillStroke(ctx, '#ff5252', OUT, 2);
  });

  canvasTexture(scene, 'DaNang-board', 150, 34, (ctx) => {
    ellipse(ctx, 75, 17, 70, 12);
    fillStroke(ctx, linear(ctx, 0, 5, 0, 29, [[0, '#fffbe8'], [1, '#ffd98a']]), OUT, 3);
    ctx.save();
    ellipse(ctx, 75, 17, 70, 12);
    ctx.clip();
    ctx.fillStyle = '#ff6f9f';
    ctx.fillRect(40, 0, 12, 34);
    ctx.fillStyle = '#3d8bfd';
    ctx.fillRect(56, 0, 6, 34);
    ctx.restore();
  });

  canvasTexture(scene, 'DaNang-shell', 52, 46, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(26, 42);
    ctx.lineTo(4, 18);
    ctx.quadraticCurveTo(26, -8, 48, 18);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, 42, [[0, '#ffe0ec'], [1, '#ff8fb8']]), OUT, 2.5);
    ctx.strokeStyle = 'rgba(160,40,90,0.5)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(26, 40);
      ctx.lineTo(26 + i * 9, 10 + Math.abs(i) * 3);
      ctx.stroke();
    }
  });

  canvasTexture(scene, 'DaNang-rock', 130, 90, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 86);
    ctx.lineTo(18, 40);
    ctx.lineTo(46, 14);
    ctx.lineTo(80, 8);
    ctx.lineTo(110, 34);
    ctx.lineTo(124, 86);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 8, 0, 86, [[0, '#9aa3b5'], [1, '#4b5263']]), OUT, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(30, 40);
    ctx.lineTo(48, 20);
    ctx.lineTo(60, 24);
    ctx.lineTo(40, 46);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ellipse(ctx, 65, 84, 62, 6);
    ctx.fill();
  });

  canvasTexture(scene, 'DaNang-jetski', 160, 90, (ctx) => {
    // thân mô tô nước
    ctx.beginPath();
    ctx.moveTo(10, 60);
    ctx.lineTo(150, 54);
    ctx.quadraticCurveTo(156, 74, 130, 80);
    ctx.lineTo(28, 80);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 54, 0, 80, [[0, '#ff5d5d'], [1, '#c22f3d']]), OUT, 3);
    roundRect(ctx, 40, 44, 60, 14, 6);
    fillStroke(ctx, '#2f3546', OUT, 2.5);
    // người lái (cứu hộ)
    roundRect(ctx, 64, 14, 22, 34, 8);
    fillStroke(ctx, '#ffd166', OUT, 2.5);
    ellipse(ctx, 75, 10, 10, 10);
    fillStroke(ctx, '#ffd9bd', OUT, 2.5);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(84, 26);
    ctx.lineTo(112, 44);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ellipse(ctx, 80, 84, 74, 5);
    ctx.fill();
  });

  // Vệt nước trên mặt sóng (tạo cảm giác tốc độ)
  canvasTexture(scene, 'DaNang-streak', 512, 300, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 30 + Math.random() * 90;
      ctx.lineWidth = 1.5 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len / 2, y - 4, x + len, y);
      ctx.stroke();
    }
  });

  // Cầu Rồng về đêm (bóng vàng phát sáng)
  canvasTexture(scene, 'DaNang-bridge', 1280, 170, (ctx, w) => {
    const deckY = 140;
    // trụ cầu
    ctx.fillStyle = '#2a2140';
    for (let x = 60; x < w; x += 180) ctx.fillRect(x, deckY, 14, 30);
    roundRect(ctx, 0, deckY - 6, w, 12, 4);
    fillStroke(ctx, '#3b2f5a', '#1d1630', 2);
    // thân rồng uốn lượn
    ctx.beginPath();
    const pts = [];
    for (let x = 40; x <= 1120; x += 6) {
      const y = deckY - 10 - Math.abs(Math.sin(((x - 40) / 1080) * Math.PI * 4)) * 80;
      pts.push([x, y]);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#7a4a10';
    ctx.lineWidth = 20;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.strokeStyle = '#ffc94a';
    ctx.lineWidth = 13;
    ctx.stroke();
    ctx.strokeStyle = '#fff2b0';
    ctx.lineWidth = 4;
    ctx.stroke();
    // vảy đèn
    ctx.fillStyle = '#ffffff';
    pts.forEach(([x, y], i) => {
      if (i % 5 === 0) {
        ellipse(ctx, x, y, 2.5, 2.5);
        ctx.fill();
      }
    });
    // đầu rồng
    const hx = 1130;
    const hy = 52;
    ctx.beginPath();
    ctx.moveTo(1112, 70);
    ctx.quadraticCurveTo(1120, 30, 1150, 36);
    ctx.lineTo(1188, 46);
    ctx.lineTo(1170, 58);
    ctx.lineTo(1186, 66);
    ctx.quadraticCurveTo(1150, 76, 1112, 70);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 30, 0, 76, [[0, '#fff2b0'], [1, '#ffb52e']]), '#7a4a10', 3);
    ctx.beginPath();
    ctx.moveTo(1136, 36);
    ctx.lineTo(1124, 14);
    ctx.lineTo(1146, 34);
    ctx.closePath();
    fillStroke(ctx, '#ffc94a', '#7a4a10', 2);
    ellipse(ctx, hx + 18, hy - 4, 3, 3);
    ctx.fillStyle = '#ff3d3d';
    ctx.fill();
    // đuôi
    ctx.beginPath();
    ctx.moveTo(40, deckY - 10);
    ctx.quadraticCurveTo(10, deckY - 40, 26, deckY - 60);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#ffc94a';
    ctx.stroke();
  });

  // Thanh phố bên sông Hàn (bóng nhà có đèn)
  canvasTexture(scene, 'DaNang-city', 1280, 200, (ctx, w, h) => {
    let x = 0;
    while (x < w) {
      const bw = 40 + Math.random() * 70;
      const bh = 60 + Math.random() * 130;
      ctx.fillStyle = '#2b2448';
      ctx.fillRect(x, h - bh, bw, bh);
      ctx.fillStyle = 'rgba(255,214,120,0.85)';
      for (let yy = h - bh + 8; yy < h - 8; yy += 14)
        for (let xx = x + 6; xx < x + bw - 8; xx += 12) if (Math.random() < 0.45) ctx.fillRect(xx, yy, 5, 7);
      x += bw + 4;
    }
  });
}
