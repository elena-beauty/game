// Texture cho ván Đà Lạt: xe đạp đôi, rừng thông, hồ Xuân Hương, sương mù, ổ gà, cổng đích.
import { canvasTexture, skyTexture, ridgeTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const OUTLINE = '#3a2a3f';

function pineSilhouette(ctx, x, base, h, color) {
  const w = h * 0.42;
  ctx.fillStyle = color;
  ctx.fillRect(x - h * 0.03, base - h * 0.15, h * 0.06, h * 0.15);
  for (let i = 0; i < 3; i++) {
    const top = base - h + i * h * 0.25;
    const bottom = base - h * 0.55 + i * h * 0.22;
    const half = w * (0.45 + i * 0.28);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + half, bottom);
    ctx.lineTo(x - half, bottom);
    ctx.closePath();
    ctx.fill();
  }
}

export function createDaLatTextures(scene) {
  skyTexture(scene, 'DaLat-sky', 1280, 720, [[0, '#9fb8e8'], [0.45, '#d9d4f2'], [0.75, '#f6dfe8'], [1, '#fdeee0']]);
  ridgeTexture(scene, 'DaLat-mountains', 1280, 300, { base: 0.55, amp: 0.35, bumps: 2, color: '#a99ccf', top: '#c6bde3', seed: 3 });
  ridgeTexture(scene, 'DaLat-hills', 1280, 260, { base: 0.5, amp: 0.25, bumps: 3, color: '#7d9fb8', top: '#9cb8c9', seed: 11 });

  // Rừng thông xa (bóng mờ)
  canvasTexture(scene, 'DaLat-pines-far', 1024, 260, (ctx, w, h) => {
    let s = 5;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let x = -20; x < w + 20; x += 26 + rnd() * 20) pineSilhouette(ctx, x, h, 120 + rnd() * 110, 'rgba(78,120,118,0.85)');
    ctx.fillStyle = 'rgba(78,120,118,0.85)';
    ctx.fillRect(0, h - 8, w, 8);
  });

  // Hồ Xuân Hương
  canvasTexture(scene, 'DaLat-lake', 1024, 120, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#b7d9ec'], [0.5, '#7fb6d6'], [1, '#5d97bd']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % w;
      const y = 10 + ((i * 37) % (h - 20));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18 + (i % 3) * 8, y);
      ctx.stroke();
    }
    // Thuyền thiên nga
    [[260, 46], [760, 70]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 18, 7);
      fillStroke(ctx, '#ffffff', OUTLINE, 2);
      ctx.beginPath();
      ctx.moveTo(x + 12, y - 2);
      ctx.quadraticCurveTo(x + 22, y - 22, x + 14, y - 26);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ff9a3c';
      ctx.fillRect(x + 12, y - 28, 6, 3);
    });
  });

  // Hàng thông gần
  canvasTexture(scene, 'DaLat-pines-near', 1024, 340, (ctx, w, h) => {
    let s = 17;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let x = 30; x < w; x += 110 + rnd() * 90) {
      const th = 200 + rnd() * 130;
      const base = h;
      ctx.fillStyle = '#6b4a2e';
      ctx.fillRect(x - 6, base - th * 0.25, 12, th * 0.25);
      for (let i = 0; i < 3; i++) {
        const top = base - th + i * th * 0.22;
        const bottom = base - th * 0.5 + i * th * 0.18;
        const half = th * (0.14 + i * 0.07);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x + half, bottom);
        ctx.quadraticCurveTo(x, bottom + 10, x - half, bottom);
        ctx.closePath();
        fillStroke(ctx, linear(ctx, x - half, 0, x + half, 0, [[0, '#4fa36b'], [1, '#22603f']]), OUTLINE, 2.5);
      }
    }
  });

  // Mặt đường + đất (tile dọc dùng cho thân đồi)
  canvasTexture(scene, 'DaLat-soil', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8fc76a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(60,120,60,0.25)';
    for (let i = 0; i < 30; i++) {
      ellipse(ctx, (i * 53) % w, (i * 29) % h, 3, 2);
      ctx.fill();
    }
  });

  // Sương mù
  canvasTexture(scene, 'DaLat-fog', 512, 200, (ctx, w, h) => {
    ctx.fillStyle = radial(ctx, w / 2, h / 2, 10, w / 2, [[0, 'rgba(255,255,255,0.9)'], [0.6, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
    ctx.save();
    ctx.scale(1, h / w);
    ctx.beginPath();
    ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
  });

  // Bánh xe
  canvasTexture(scene, 'DaLat-wheel', 70, 70, (ctx) => {
    ellipse(ctx, 35, 35, 31, 31);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#2b2433';
    ctx.stroke();
    ellipse(ctx, 35, 35, 26, 26);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d6d0de';
    ctx.stroke();
    ctx.strokeStyle = '#bdb6c8';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(35, 35);
      ctx.lineTo(35 + Math.cos(a) * 26, 35 + Math.sin(a) * 26);
      ctx.stroke();
    }
    ellipse(ctx, 35, 35, 5, 5);
    fillStroke(ctx, '#ff6f9f', OUTLINE, 2);
  });

  // Khung xe đạp đôi (không gồm bánh)
  canvasTexture(scene, 'DaLat-bike', 230, 110, (ctx) => {
    const rear = [35, 75];
    const front = [195, 75];
    const seat1 = [70, 32];
    const seat2 = [140, 32];
    const crank1 = [92, 78];
    const crank2 = [148, 78];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const tube = (pts, color = '#2ec4b6') => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach((p) => ctx.lineTo(p[0], p[1]));
      ctx.lineWidth = 9;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    tube([rear, crank1, crank2, front]);
    tube([rear, [seat1[0] + 4, seat1[1] + 10]]);
    tube([crank1, [seat1[0] + 4, seat1[1] + 10], [seat2[0] + 4, seat2[1] + 10], crank2]);
    tube([[seat2[0] + 4, seat2[1] + 10], [176, 30], front]);
    tube([[176, 30], [180, 18], [168, 14]], '#9aa3b5');
    // Yên
    [seat1, seat2].forEach(([x, y]) => {
      roundRect(ctx, x - 10, y - 2, 28, 9, 4);
      fillStroke(ctx, '#5b3a29', OUTLINE, 2);
    });
    // Giỏ hoa phía trước
    roundRect(ctx, 182, 20, 34, 24, 5);
    fillStroke(ctx, linear(ctx, 0, 20, 0, 44, [[0, '#f0c879'], [1, '#c99a4a']]), OUTLINE, 2.5);
    ctx.strokeStyle = 'rgba(90,60,20,0.5)';
    ctx.lineWidth = 1.5;
    for (let x = 188; x < 214; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 22);
      ctx.lineTo(x, 42);
      ctx.stroke();
    }
    [[190, 18, '#7b5cff'], [200, 14, '#ff8fb8'], [210, 18, '#8fb8ff']].forEach(([x, y, c]) => {
      ellipse(ctx, x, y, 7, 7);
      fillStroke(ctx, c, OUTLINE, 1.8);
    });
    // Đùi đĩa
    [crank1, crank2].forEach(([x, y]) => {
      ellipse(ctx, x, y, 9, 9);
      fillStroke(ctx, '#d6d0de', OUTLINE, 2);
    });
  });

  // Ổ gà
  canvasTexture(scene, 'DaLat-pothole', 90, 30, (ctx) => {
    ellipse(ctx, 45, 15, 42, 12);
    fillStroke(ctx, radial(ctx, 45, 17, 2, 42, [[0, '#2a2030'], [1, '#5a4a3a']]), '#3a2a3f', 2.5);
    ellipse(ctx, 45, 13, 30, 6);
    ctx.fillStyle = 'rgba(120,170,210,0.55)';
    ctx.fill();
  });

  // Hoa cẩm tú cầu ven đường
  canvasTexture(scene, 'DaLat-hydrangea', 70, 56, (ctx) => {
    ellipse(ctx, 35, 44, 30, 12);
    ctx.fillStyle = '#3f8a52';
    ctx.fill();
    const colors = ['#8fb8ff', '#b8a0ff', '#ff9ecb', '#a0c8ff'];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 6 + (i % 4) * 4;
      ellipse(ctx, 35 + Math.cos(a) * r * 1.4, 28 + Math.sin(a) * r * 0.9, 5, 5);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
  });

  // Cổng đích
  canvasTexture(scene, 'DaLat-gate', 300, 260, (ctx) => {
    [[20, 34], [266, 34]].forEach(([x]) => {
      roundRect(ctx, x, 40, 14, 220, 5);
      fillStroke(ctx, linear(ctx, x, 0, x + 14, 0, [[0, '#ffffff'], [1, '#cfc8dc']]), OUTLINE, 2.5);
    });
    roundRect(ctx, 6, 20, 288, 58, 16);
    fillStroke(ctx, linear(ctx, 0, 20, 0, 78, [[0, '#ff9ecb'], [1, '#e0558f']]), OUTLINE, 3);
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#3a2a3f' : '#ffffff';
        ctx.fillRect(30 + i * 20, 84 + j * 10, 20, 10);
      }
    }
  });

  // Biển chỉ đường
  canvasTexture(scene, 'DaLat-sign', 90, 110, (ctx) => {
    roundRect(ctx, 40, 40, 10, 70, 3);
    fillStroke(ctx, '#7a4a2a', OUTLINE, 2);
    roundRect(ctx, 6, 8, 78, 40, 8);
    fillStroke(ctx, linear(ctx, 0, 8, 0, 48, [[0, '#ffe39a'], [1, '#f2a93b']]), OUTLINE, 2.5);
  });
}

// --- Bổ sung: biệt thự Pháp, luống hoa tiền cảnh, chó, cành thông gãy, người đi bộ, xe ngựa ---
export function createDaLatExtraTextures(scene) {
  // Dãy biệt thự Pháp trên đồi (lặp ngang)
  canvasTexture(scene, 'DaLat-villas', 1024, 200, (ctx, w, h) => {
    const walls = ['#fff1c9', '#ffd6e0', '#d6ecff', '#e8ffd6', '#fff4f0'];
    const roofs = ['#d9534f', '#c0392b', '#8e5a9e', '#e07a3f', '#5b6dbf'];
    let x = 30;
    let i = 0;
    while (x < w - 120) {
      const bw = 90 + ((i * 37) % 50);
      const bh = 60 + ((i * 23) % 40);
      const base = h - 10 - ((i * 17) % 30);
      roundRect(ctx, x, base - bh, bw, bh, 4);
      fillStroke(ctx, walls[i % walls.length], OUTLINE, 2.5);
      // mái nhọn kiểu Pháp
      ctx.beginPath();
      ctx.moveTo(x - 8, base - bh + 2);
      ctx.lineTo(x + bw * 0.3, base - bh - 40);
      ctx.lineTo(x + bw * 0.7, base - bh - 40);
      ctx.lineTo(x + bw + 8, base - bh + 2);
      ctx.closePath();
      fillStroke(ctx, roofs[i % roofs.length], OUTLINE, 2.5);
      // ống khói
      roundRect(ctx, x + bw * 0.62, base - bh - 54, 10, 22, 2);
      fillStroke(ctx, '#8a6a5a', OUTLINE, 2);
      // cửa sổ
      for (let k = 0; k < 3; k++) {
        roundRect(ctx, x + 10 + k * (bw - 28) / 2.2, base - bh + 14, 14, 20, 6);
        fillStroke(ctx, '#7fb6d6', OUTLINE, 1.8);
      }
      roundRect(ctx, x + bw / 2 - 9, base - 26, 18, 26, 8);
      fillStroke(ctx, '#7a4a2a', OUTLINE, 1.8);
      x += bw + 60 + ((i * 41) % 60);
      i++;
    }
  });

  // Luống hoa tiền cảnh
  canvasTexture(scene, 'DaLat-flowerbed', 512, 90, (ctx, w, h) => {
    ctx.fillStyle = '#4f8f45';
    ctx.beginPath();
    ctx.moveTo(0, 40);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, 34 + Math.sin(x / 30) * 8);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    const cols = ['#ff5d8f', '#ffd166', '#b8a0ff', '#ffffff', '#ff9a3c', '#8fb8ff'];
    for (let i = 0; i < 46; i++) {
      const x = (i * 11.3) % w;
      const y = 26 + ((i * 7) % 24);
      ctx.strokeStyle = '#2f6b35';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 26);
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        ellipse(ctx, x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.5, 3.5);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fill();
      }
      ellipse(ctx, x, y, 2, 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    }
  });

  // Chó hoang (2 frame chạy)
  ['DaLat-dog0', 'DaLat-dog1'].forEach((key, f) => {
    canvasTexture(scene, key, 70, 50, (ctx) => {
      const leg = (x, a) => {
        ctx.save();
        ctx.translate(x, 30);
        ctx.rotate(a);
        roundRect(ctx, -3, 0, 6, 16, 3);
        fillStroke(ctx, '#c98a4a', OUTLINE, 1.8);
        ctx.restore();
      };
      const s = f ? 0.5 : -0.5;
      leg(18, s);
      leg(26, -s);
      leg(46, -s);
      leg(54, s);
      ellipse(ctx, 36, 28, 22, 11);
      fillStroke(ctx, '#e0a060', OUTLINE, 2.2);
      ctx.beginPath();
      ctx.moveTo(58, 24);
      ctx.quadraticCurveTo(68, 12, 64, 6);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e0a060';
      ctx.stroke();
      ellipse(ctx, 14, 18, 11, 10);
      fillStroke(ctx, '#e0a060', OUTLINE, 2.2);
      ellipse(ctx, 6, 21, 5, 4);
      fillStroke(ctx, '#f2c08a', OUTLINE, 1.6);
      ellipse(ctx, 3, 19, 2, 2);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
      ellipse(ctx, 18, 9, 4, 7, 0.4);
      fillStroke(ctx, '#a8682e', OUTLINE, 1.6);
      ellipse(ctx, 12, 15, 1.8, 1.8);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
    });
  });

  // Cành thông gãy chắn đường
  canvasTexture(scene, 'DaLat-branch', 130, 44, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 32);
    ctx.lineTo(124, 22);
    ctx.lineWidth = 10;
    ctx.strokeStyle = OUTLINE;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#7a4a2a';
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const x = 16 + i * 12;
      const y = 30 - i;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y - 16);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 4, y - 18);
      ctx.lineWidth = 3;
      ctx.strokeStyle = i % 2 ? '#2f7a4a' : '#3f9a62';
      ctx.stroke();
    }
  });

  // Người đi bộ (du khách áo len, khăn quàng)
  ['DaLat-walker0', 'DaLat-walker1'].forEach((key, f) => {
    canvasTexture(scene, key, 50, 96, (ctx) => {
      const s = f ? 0.35 : -0.35;
      [[19, s], [31, -s]].forEach(([x, a]) => {
        ctx.save();
        ctx.translate(x, 64);
        ctx.rotate(a);
        roundRect(ctx, -4, 0, 8, 26, 4);
        fillStroke(ctx, '#3d4a6b', OUTLINE, 2);
        ctx.restore();
      });
      roundRect(ctx, 11, 34, 28, 34, 9);
      fillStroke(ctx, '#e07a3f', OUTLINE, 2.2);
      roundRect(ctx, 13, 32, 24, 7, 3);
      fillStroke(ctx, '#ffd166', OUTLINE, 1.8);
      ellipse(ctx, 25, 20, 13, 13);
      fillStroke(ctx, '#ffd9bd', OUTLINE, 2.2);
      ctx.beginPath();
      ctx.arc(25, 16, 13, Math.PI, 0);
      ctx.closePath();
      fillStroke(ctx, '#7b5cff', OUTLINE, 2);
      ellipse(ctx, 25, 3, 4, 4);
      fillStroke(ctx, '#fff', OUTLINE, 1.5);
      ellipse(ctx, 21, 22, 1.6, 1.6);
      ellipse(ctx, 29, 22, 1.6, 1.6);
      ctx.fillStyle = OUTLINE;
      ctx.fill();
    });
  });

  // Xe ngựa (trang trí ven hồ)
  canvasTexture(scene, 'DaLat-cart', 200, 110, (ctx) => {
    // ngựa
    [[24, 0.3], [40, -0.3], [58, 0.2], [70, -0.2]].forEach(([x, a]) => {
      ctx.save();
      ctx.translate(x, 70);
      ctx.rotate(a);
      roundRect(ctx, -3, 0, 7, 30, 3);
      fillStroke(ctx, '#ffffff', OUTLINE, 2);
      ctx.restore();
    });
    ellipse(ctx, 48, 62, 32, 15);
    fillStroke(ctx, '#ffffff', OUTLINE, 2.5);
    ctx.beginPath();
    ctx.moveTo(22, 56);
    ctx.lineTo(10, 26);
    ctx.lineTo(22, 22);
    ctx.lineTo(34, 52);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', OUTLINE, 2.5);
    ellipse(ctx, 8, 30, 10, 7, -0.6);
    fillStroke(ctx, '#ffffff', OUTLINE, 2.5);
    ctx.fillStyle = '#e0558f';
    ctx.fillRect(16, 20, 8, 6);
    // xe
    roundRect(ctx, 96, 30, 90, 46, 10);
    fillStroke(ctx, linear(ctx, 0, 30, 0, 76, [[0, '#ff7eb3'], [1, '#c2416f']]), OUTLINE, 2.5);
    ctx.beginPath();
    ctx.moveTo(92, 32);
    ctx.quadraticCurveTo(140, -6, 190, 32);
    ctx.closePath();
    fillStroke(ctx, '#ffd166', OUTLINE, 2.5);
    ctx.beginPath();
    ctx.moveTo(78, 60);
    ctx.lineTo(98, 60);
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ellipse(ctx, 160, 84, 20, 20);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#7a4a2a';
    ctx.stroke();
    ellipse(ctx, 160, 84, 4, 4);
    fillStroke(ctx, '#ffd166', OUTLINE, 1.5);
  });
}
