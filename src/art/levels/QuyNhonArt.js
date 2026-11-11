// Texture cho ván Quy Nhơn — biển Kỳ Co nhìn từ trên xuống.
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const OUT = '#3a2a3f';

export function createQuyNhonTextures(scene) {
  // Mặt nước lặp liền mạch 256x256
  canvasTexture(scene, 'QuyNhon-water', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#25b9cf';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let row = 0; row < 8; row++) {
      const y0 = row * 32 + 10;
      const off = (row % 2) * 64;
      for (let k = 0; k < 2; k++) {
        const x0 = (off + k * 128) % w;
        ctx.beginPath();
        for (let x = 0; x <= 56; x += 4) ctx.lineTo(x0 + x, y0 + Math.sin((x / 56) * Math.PI * 2) * 3);
        ctx.stroke();
      }
    }
  });
  // Lớp ánh sáng (caustics) cộng sáng
  canvasTexture(scene, 'QuyNhon-caustic', 256, 256, (ctx) => {
    ctx.strokeStyle = 'rgba(200,255,255,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = 32 + ((i * 53) % 192);
      const y = 32 + ((i * 97) % 192);
      ctx.beginPath();
      ctx.ellipse(x, y, 20, 11, i, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  // Gradient độ sâu: xa bờ đậm hơn
  canvasTexture(scene, 'QuyNhon-depth', 8, 256, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, 'rgba(10,60,120,0.55)'], [0.6, 'rgba(10,90,140,0.2)'], [1, 'rgba(120,255,230,0.25)']]);
    ctx.fillRect(0, 0, w, h);
  });

  // Bãi cát + bọt sóng
  canvasTexture(scene, 'QuyNhon-beach', 1280, 300, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, 60);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, 50 + Math.sin(x / 90) * 14);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, 0, 30, 0, h, [[0, '#fff3cf'], [1, '#f0c98b']]);
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, 50 + Math.sin(x / 90) * 14);
    ctx.stroke();
    ctx.fillStyle = 'rgba(190,140,80,0.35)';
    for (let i = 0; i < 160; i++) {
      ellipse(ctx, Math.random() * w, 90 + Math.random() * (h - 90), 2.2, 1.3);
      ctx.fill();
    }
  });

  // Cầu cảng gỗ
  canvasTexture(scene, 'QuyNhon-pier', 90, 420, (ctx, w, h) => {
    for (let y = 0; y < h; y += 26) {
      roundRect(ctx, 6, y, w - 12, 22, 4);
      fillStroke(ctx, linear(ctx, 0, y, 0, y + 22, [[0, '#c98e5a'], [1, '#9b6337']]), OUT, 2.5);
    }
    [[2, 0], [w - 10, 0]].forEach(([x]) => {
      for (let y = 10; y < h; y += 110) {
        ellipse(ctx, x + 4, y, 7, 7);
        fillStroke(ctx, '#7a4a2a', OUT, 2.5);
      }
    });
  });

  // Đá ven bờ
  canvasTexture(scene, 'QuyNhon-rock', 140, 110, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 80);
    ctx.bezierCurveTo(4, 30, 50, 6, 80, 14);
    ctx.bezierCurveTo(120, 18, 138, 60, 126, 86);
    ctx.bezierCurveTo(100, 104, 30, 104, 10, 80);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 10, 0, 100, [[0, '#a8a29e'], [1, '#57534e']]), OUT, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ellipse(ctx, 60, 30, 22, 7, -0.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(68, 70, 66, 38, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });

  // Thuyền thúng (nhìn từ trên)
  canvasTexture(scene, 'QuyNhon-thung', 180, 180, (ctx) => {
    ellipse(ctx, 90, 96, 84, 80);
    ctx.fillStyle = 'rgba(0,40,80,0.25)';
    ctx.fill();
    ellipse(ctx, 90, 88, 82, 78);
    fillStroke(ctx, radial(ctx, 80, 76, 10, 86, [[0, '#d9a066'], [1, '#8a5a2b']]), OUT, 3.5);
    ctx.strokeStyle = 'rgba(80,45,15,0.45)';
    ctx.lineWidth = 2;
    for (let r = 20; r < 78; r += 12) {
      ctx.beginPath();
      ctx.ellipse(90, 88, r, r * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      ctx.beginPath();
      ctx.moveTo(90, 88);
      ctx.lineTo(90 + Math.cos(a) * 80, 88 + Math.sin(a) * 76);
      ctx.stroke();
    }
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#5b3a1e';
    ctx.beginPath();
    ctx.ellipse(90, 88, 78, 74, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Sóng lớn (dải ngang)
  canvasTexture(scene, 'QuyNhon-wave', 1280, 120, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, 'rgba(20,110,170,0)'], [0.35, 'rgba(30,140,200,0.55)'], [0.7, 'rgba(160,240,255,0.85)'], [1, 'rgba(255,255,255,0)']]);
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(0, 86);
    for (let x = 0; x <= w; x += 10) ctx.lineTo(x, 80 + Math.sin(x / 34) * 7 + Math.sin(x / 13) * 3);
    ctx.lineTo(w, 102);
    for (let x = w; x >= 0; x -= 10) ctx.lineTo(x, 98 + Math.sin(x / 28) * 4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 70; i++) {
      ellipse(ctx, Math.random() * w, 70 + Math.random() * 14, 3 + Math.random() * 4, 2 + Math.random() * 2);
      ctx.fill();
    }
  });

  // Vỏ sò
  canvasTexture(scene, 'QuyNhon-shell', 56, 52, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(28, 46);
    ctx.lineTo(8, 22);
    ctx.bezierCurveTo(10, 4, 46, 4, 48, 22);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 6, 0, 46, [[0, '#ffd1dc'], [1, '#ff8fab']]), OUT, 2.5);
    ctx.strokeStyle = 'rgba(160,50,90,0.6)';
    ctx.lineWidth = 2;
    [-14, -7, 0, 7, 14].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(28, 44);
      ctx.lineTo(28 + dx * 1.3, 12);
      ctx.stroke();
    });
    roundRect(ctx, 20, 40, 16, 9, 3);
    fillStroke(ctx, '#ffb3c6', OUT, 2);
  });

  // Sứa
  canvasTexture(scene, 'QuyNhon-jelly', 80, 90, (ctx) => {
    ctx.strokeStyle = 'rgba(200,120,220,0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    [18, 30, 42, 54, 64].forEach((x, i) => {
      ctx.beginPath();
      ctx.moveTo(x, 44);
      ctx.bezierCurveTo(x - 8, 58, x + 8, 70, x - 2 + (i % 2) * 4, 86);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(8, 46);
    ctx.bezierCurveTo(6, 8, 74, 8, 72, 46);
    ctx.quadraticCurveTo(40, 54, 8, 46);
    ctx.closePath();
    fillStroke(ctx, radial(ctx, 32, 22, 4, 40, [[0, 'rgba(255,230,250,0.95)'], [1, 'rgba(220,130,230,0.8)']]), '#8a3fa0', 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(ctx, 28, 24, 7, 4, -0.4);
    ctx.fill();
    ctx.fillStyle = OUT;
    ellipse(ctx, 32, 36, 2.5, 3);
    ctx.fill();
    ellipse(ctx, 48, 36, 2.5, 3);
    ctx.fill();
  });

  // Ca nô (nhìn từ trên, mũi hướng sang phải)
  canvasTexture(scene, 'QuyNhon-speedboat', 200, 80, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(10, 14);
    ctx.lineTo(140, 10);
    ctx.quadraticCurveTo(196, 40, 140, 70);
    ctx.lineTo(10, 66);
    ctx.quadraticCurveTo(2, 40, 10, 14);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 10, 0, 70, [[0, '#ffffff'], [1, '#d6dde8']]), OUT, 3);
    ctx.beginPath();
    ctx.moveTo(14, 28);
    ctx.lineTo(150, 26);
    ctx.lineTo(150, 54);
    ctx.lineTo(14, 52);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    roundRect(ctx, 70, 22, 46, 36, 10);
    fillStroke(ctx, linear(ctx, 70, 0, 116, 0, [[0, '#93e0ff'], [1, '#3b82c4']]), OUT, 2.5);
    roundRect(ctx, 22, 26, 34, 28, 6);
    fillStroke(ctx, '#f8d48a', OUT, 2.5);
  });

  // Phao cứu sinh
  canvasTexture(scene, 'QuyNhon-buoy', 72, 72, (ctx) => {
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(36, 36, 30, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
      ctx.arc(36, 36, 15, ((i + 1) * Math.PI) / 4, (i * Math.PI) / 4, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ef4444';
      ctx.fill();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUT;
    ctx.beginPath();
    ctx.arc(36, 36, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(36, 36, 15, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Vệt dòng chảy (mũi tên) lặp ngang
  canvasTexture(scene, 'QuyNhon-current', 128, 64, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    [[10, 16], [70, 44]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40, y);
      ctx.moveTo(x + 32, y - 7);
      ctx.lineTo(x + 41, y);
      ctx.lineTo(x + 32, y + 7);
      ctx.stroke();
    });
  });

  // Bóng cá bơi bên dưới
  canvasTexture(scene, 'QuyNhon-fish', 60, 26, (ctx) => {
    ctx.fillStyle = 'rgba(10,50,90,0.35)';
    ellipse(ctx, 26, 13, 20, 9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(44, 13);
    ctx.lineTo(58, 3);
    ctx.lineTo(58, 23);
    ctx.closePath();
    ctx.fill();
  });
}

/** Cá mập, bạch tuộc, đảo đá Kỳ Co. */
export function createQuyNhonExtras(scene) {
  canvasTexture(scene, 'QuyNhon-shark', 180, 80, (ctx) => {
    // thân dưới nước (bóng xanh đậm)
    ctx.beginPath();
    ctx.moveTo(170, 40);
    ctx.quadraticCurveTo(120, 14, 60, 30);
    ctx.lineTo(18, 16);
    ctx.lineTo(28, 40);
    ctx.lineTo(18, 64);
    ctx.lineTo(60, 50);
    ctx.quadraticCurveTo(120, 66, 170, 40);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20,50,90,0.55)';
    ctx.fill();
    // vây lưng nhô khỏi nước
    ctx.beginPath();
    ctx.moveTo(84, 44);
    ctx.quadraticCurveTo(100, 6, 124, 2);
    ctx.quadraticCurveTo(112, 22, 118, 44);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 84, 0, 124, 0, [[0, '#94a3b8'], [1, '#475569']]), OUT, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(74, 48);
    ctx.quadraticCurveTo(100, 40, 130, 48);
    ctx.stroke();
  });
  canvasTexture(scene, 'QuyNhon-octopus', 100, 100, (ctx) => {
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.quadraticCurveTo(50 + Math.cos(a + 0.5) * 30, 50 + Math.sin(a + 0.5) * 30, 50 + Math.cos(a) * 46, 50 + Math.sin(a) * 46);
      ctx.lineWidth = 11;
      ctx.strokeStyle = OUT;
      ctx.stroke();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#f97366';
      ctx.stroke();
    }
    ellipse(ctx, 50, 48, 24, 22);
    fillStroke(ctx, radial(ctx, 44, 40, 3, 26, [[0, '#ffb3a7'], [1, '#e8554a']]), OUT, 3);
    [42, 58].forEach((x) => {
      ellipse(ctx, x, 48, 5, 6);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ellipse(ctx, x, 49, 2.5, 3.5);
      ctx.fillStyle = '#111';
      ctx.fill();
    });
  });
  canvasTexture(scene, 'QuyNhon-ink', 64, 64, (ctx) => {
    ctx.fillStyle = radial(ctx, 32, 32, 2, 32, [[0, 'rgba(30,20,40,0.95)'], [0.7, 'rgba(30,20,40,0.6)'], [1, 'rgba(30,20,40,0)']]);
    ctx.fillRect(0, 0, 64, 64);
  });
  canvasTexture(scene, 'QuyNhon-islet', 340, 280, (ctx) => {
    // bọt sóng quanh đảo
    ellipse(ctx, 170, 150, 160, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    ellipse(ctx, 170, 148, 146, 108);
    ctx.fillStyle = '#ffe8b0';
    ctx.fill();
    // khối đá granite
    ctx.beginPath();
    ctx.moveTo(40, 160);
    ctx.bezierCurveTo(30, 80, 110, 30, 180, 40);
    ctx.bezierCurveTo(270, 46, 310, 120, 290, 180);
    ctx.bezierCurveTo(250, 240, 90, 240, 40, 160);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 40, 0, 240, [[0, '#c7bfb6'], [1, '#77706a']]), OUT, 3.5);
    // cây xanh trên đỉnh
    [[130, 80, 40], [180, 70, 46], [230, 96, 34], [160, 112, 30]].forEach(([x, y, r]) => {
      ellipse(ctx, x, y, r, r * 0.8);
      fillStroke(ctx, radial(ctx, x - 10, y - 10, 3, r, [[0, '#7fd18a'], [1, '#2f8a4c']]), OUT, 2.5);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, 90, 150, 26, 8, -0.5);
    ctx.fill();
  });
}
