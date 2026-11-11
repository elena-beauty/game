// Texture cho ván Hà Nội — phố cổ về đêm, Hồ Gươm, cầu Thê Húc.
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const OUT = '#3a2a3f';
const FONT = '"Baloo 2", sans-serif';

export const STALLS = [
  { key: 'pho', name: 'Phở', color: '#e85d4a', food: '🍜' },
  { key: 'buncha', name: 'Bún chả', color: '#f2a93b', food: '🥢' },
  { key: 'kem', name: 'Kem Tràng Tiền', color: '#5ec8d8', food: '🍦' },
  { key: 'caphe', name: 'Cà phê trứng', color: '#8b5a2b', food: '☕' },
];

const BIKE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
const SHIRTS = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#f472b6'];

function person(ctx, x, y, shirt, { hat = null, helmet = null, s = 1 } = {}) {
  // thân
  roundRect(ctx, x - 10 * s, y - 2 * s, 20 * s, 24 * s, 7 * s);
  fillStroke(ctx, shirt, OUT, 2.5);
  // đầu
  ellipse(ctx, x, y - 12 * s, 11 * s, 11 * s);
  fillStroke(ctx, '#ffd9bd', OUT, 2.5);
  if (helmet) {
    ctx.beginPath();
    ctx.arc(x, y - 13 * s, 12.5 * s, Math.PI, 0);
    ctx.closePath();
    fillStroke(ctx, helmet, OUT, 2.5);
  } else if (hat === 'non') {
    ctx.beginPath();
    ctx.moveTo(x - 20 * s, y - 14 * s);
    ctx.lineTo(x, y - 32 * s);
    ctx.lineTo(x + 20 * s, y - 14 * s);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, y - 32 * s, 0, y - 14 * s, [[0, '#fff3cf'], [1, '#e6c27a']]), OUT, 2.5);
  } else {
    ctx.beginPath();
    ctx.arc(x, y - 14 * s, 11 * s, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineWidth = 6 * s;
    ctx.strokeStyle = '#2a2433';
    ctx.stroke();
  }
}

export function createHaNoiTextures(scene) {
  // Mặt đường nhựa 1 làn
  canvasTexture(scene, 'HaNoi-road', 256, 80, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#3d3d52'], [1, '#33334a']]);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 60; i++) ctx.fillRect((i * 37) % w, (i * 53) % h, 3, 2);
    ctx.fillStyle = 'rgba(255,230,150,0.75)';
    for (let x = 10; x < w; x += 64) ctx.fillRect(x, 0, 34, 4);
  });
  // Vỉa hè gạch
  canvasTexture(scene, 'HaNoi-brick', 64, 64, (ctx) => {
    ctx.fillStyle = '#8f6a5a';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#a77d6a';
    [[0, 0], [32, 0], [16, 32], [-16, 32], [48, 32]].forEach(([x, y]) => {
      roundRect(ctx, x + 2, y + 2, 28, 28, 3);
      ctx.fill();
    });
  });
  // Mép vỉa hè
  canvasTexture(scene, 'HaNoi-curb', 64, 10, (ctx) => {
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(0, 0, 64, 10);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(0, 7, 64, 3);
    ctx.fillRect(31, 0, 2, 10);
  });

  // Dãy nhà ống hai bên (lặp dọc)
  canvasTexture(scene, 'HaNoi-houses', 140, 480, (ctx, w, h) => {
    const walls = ['#f6c85f', '#f2a7a0', '#9fd3c7', '#f7e1a0', '#e8b4d8', '#f6c85f'];
    for (let i = 0; i < 6; i++) {
      const y = i * 80;
      ctx.fillStyle = linear(ctx, 0, 0, w, 0, [[0, '#7f3b2a'], [1, '#b5523a']]);
      ctx.fillRect(0, y, w * 0.55, 80);
      ctx.strokeStyle = 'rgba(60,20,10,0.4)';
      ctx.lineWidth = 2;
      for (let k = 8; k < w * 0.55; k += 10) {
        ctx.beginPath();
        ctx.moveTo(k, y);
        ctx.lineTo(k, y + 80);
        ctx.stroke();
      }
      roundRect(ctx, w * 0.55, y + 2, w * 0.45, 76, 4);
      fillStroke(ctx, walls[i], OUT, 2.5);
      // cửa sổ sáng đèn
      roundRect(ctx, w * 0.62, y + 14, 16, 22, 3);
      fillStroke(ctx, '#ffe7a3', OUT, 2);
      roundRect(ctx, w * 0.62, y + 46, 16, 22, 3);
      fillStroke(ctx, i % 2 ? '#ffd166' : '#5b4a6b', OUT, 2);
      // ban công + chậu hoa
      ctx.fillStyle = '#3f9a62';
      ellipse(ctx, w * 0.9, y + 40, 7, 7);
      ctx.fill();
      ctx.fillStyle = '#ff6f9f';
      ellipse(ctx, w * 0.9, y + 36, 3, 3);
      ctx.fill();
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });

  // Đèn lồng
  ['#ef4444', '#f59e0b', '#ec4899', '#22c55e'].forEach((c, i) => {
    canvasTexture(scene, `HaNoi-lantern-${i}`, 30, 44, (ctx) => {
      roundRect(ctx, 11, 0, 8, 6, 2);
      ctx.fillStyle = '#7c2d12';
      ctx.fill();
      ellipse(ctx, 15, 21, 13, 15);
      fillStroke(ctx, radial(ctx, 12, 17, 2, 16, [[0, '#fff7cc'], [0.45, c], [1, '#7f1d1d']]), OUT, 2);
      ctx.strokeStyle = 'rgba(80,20,10,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(15, 21, 6, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 36);
      ctx.lineTo(15, 44);
      ctx.stroke();
    });
  });

  // Xe máy + người lái (nhìn ngang, hướng phải) — có đèn pha
  BIKE_COLORS.forEach((color, i) => {
    canvasTexture(scene, `HaNoi-bike-${i}`, 170, 90, (ctx) => {
      ctx.fillStyle = linear(ctx, 120, 0, 170, 0, [[0, 'rgba(255,240,170,0.55)'], [1, 'rgba(255,240,170,0)']]);
      ctx.beginPath();
      ctx.moveTo(118, 58);
      ctx.lineTo(170, 42);
      ctx.lineTo(170, 82);
      ctx.closePath();
      ctx.fill();
      [[34, 72], [104, 72]].forEach(([x, y]) => {
        ellipse(ctx, x, y, 14, 14);
        fillStroke(ctx, '#1f1f2e', OUT, 2.5);
        ellipse(ctx, x, y, 6, 6);
        ctx.fillStyle = '#9ca3af';
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(22, 60);
      ctx.quadraticCurveTo(30, 42, 64, 46);
      ctx.lineTo(96, 46);
      ctx.quadraticCurveTo(116, 44, 118, 62);
      ctx.lineTo(96, 66);
      ctx.lineTo(48, 66);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, 42, 0, 66, [[0, color], [1, '#1f2937']]), OUT, 2.5);
      roundRect(ctx, 38, 40, 40, 9, 4);
      fillStroke(ctx, '#2b2433', OUT, 2);
      ellipse(ctx, 116, 54, 5, 4);
      ctx.fillStyle = '#fff7cc';
      ctx.fill();
      person(ctx, 60, 26, SHIRTS[i % SHIRTS.length], { helmet: ['#fde047', '#f87171', '#ffffff', '#60a5fa', '#34d399'][i] });
      // tay lái
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(68, 30);
      ctx.lineTo(96, 40);
      ctx.stroke();
    });
  });

  // Xích lô
  canvasTexture(scene, 'HaNoi-cyclo', 200, 110, (ctx) => {
    [[40, 90, 18], [130, 92, 16], [176, 92, 16]].forEach(([x, y, r]) => {
      ellipse(ctx, x, y, r, r);
      fillStroke(ctx, '#1f1f2e', OUT, 2.5);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      for (let a = 0; a < Math.PI; a += Math.PI / 4) {
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.lineTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
        ctx.stroke();
      }
    });
    // ghế khách phía trước + mui
    roundRect(ctx, 120, 50, 70, 30, 8);
    fillStroke(ctx, linear(ctx, 0, 50, 0, 80, [[0, '#ef4444'], [1, '#991b1b']]), OUT, 2.5);
    ctx.beginPath();
    ctx.moveTo(118, 54);
    ctx.quadraticCurveTo(140, 14, 188, 30);
    ctx.lineTo(190, 40);
    ctx.quadraticCurveTo(150, 30, 130, 56);
    ctx.closePath();
    fillStroke(ctx, '#1f2937', OUT, 2.5);
    person(ctx, 158, 52, '#fbbf24', { s: 0.9 });
    // khung + người đạp phía sau
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 90);
    ctx.lineTo(70, 62);
    ctx.lineTo(120, 70);
    ctx.stroke();
    person(ctx, 64, 40, '#60a5fa', { hat: 'non' });
  });

  // Gánh hàng rong
  canvasTexture(scene, 'HaNoi-vendor', 150, 100, (ctx) => {
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(10, 34);
    ctx.lineTo(140, 34);
    ctx.stroke();
    [[22, '#f87171'], [128, '#fbbf24']].forEach(([x, fruit]) => {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 34);
      ctx.lineTo(x - 14, 70);
      ctx.moveTo(x, 34);
      ctx.lineTo(x + 14, 70);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 20, 70);
      ctx.lineTo(x + 20, 70);
      ctx.lineTo(x + 14, 92);
      ctx.lineTo(x - 14, 92);
      ctx.closePath();
      fillStroke(ctx, '#c98e5a', OUT, 2.5);
      [[-8, 66], [0, 62], [8, 66]].forEach(([dx, y]) => {
        ellipse(ctx, x + dx, y, 6, 6);
        fillStroke(ctx, fruit, OUT, 1.5);
      });
    });
    person(ctx, 75, 60, '#a78bfa', { hat: 'non' });
    roundRect(ctx, 68, 80, 14, 18, 4);
    fillStroke(ctx, '#3f3f5a', OUT, 2);
  });

  // Xe đẩy bán đồ ăn
  canvasTexture(scene, 'HaNoi-cart', 150, 110, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(30, 16);
    ctx.quadraticCurveTo(80, -4, 130, 16);
    ctx.lineTo(126, 26);
    ctx.lineTo(34, 26);
    ctx.closePath();
    fillStroke(ctx, '#ef4444', OUT, 2.5);
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 26);
    ctx.lineTo(80, 50);
    ctx.stroke();
    roundRect(ctx, 30, 50, 100, 40, 6);
    fillStroke(ctx, linear(ctx, 0, 50, 0, 90, [[0, '#cfe8ff'], [1, '#7aa7d6']]), OUT, 2.5);
    ctx.fillStyle = '#fbbf24';
    [[48, 66], [66, 70], [90, 64], [110, 70]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 8, 5);
      ctx.fill();
    });
    [[44, 96], [116, 96]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 10, 10);
      fillStroke(ctx, '#1f1f2e', OUT, 2.5);
    });
    person(ctx, 14, 62, '#34d399', { s: 0.9 });
  });

  // Chó vàng
  canvasTexture(scene, 'HaNoi-dog', 80, 60, (ctx) => {
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(12, 28);
    ctx.quadraticCurveTo(4, 14, 10, 8);
    ctx.stroke();
    ctx.strokeStyle = '#e0a458';
    ctx.lineWidth = 3;
    ctx.stroke();
    [[22, 44], [34, 46], [46, 46], [56, 44]].forEach(([x, y]) => {
      roundRect(ctx, x - 3, y - 6, 6, 14, 3);
      fillStroke(ctx, '#d08b40', OUT, 2);
    });
    ellipse(ctx, 38, 34, 24, 13);
    fillStroke(ctx, linear(ctx, 0, 22, 0, 46, [[0, '#f2b766'], [1, '#c9803a']]), OUT, 2.5);
    ellipse(ctx, 62, 24, 13, 12);
    fillStroke(ctx, '#f2b766', OUT, 2.5);
    ctx.beginPath();
    ctx.moveTo(56, 14);
    ctx.lineTo(60, 2);
    ctx.lineTo(66, 14);
    ctx.closePath();
    fillStroke(ctx, '#c9803a', OUT, 2);
    ellipse(ctx, 74, 27, 4, 3);
    ctx.fillStyle = OUT;
    ctx.fill();
    ellipse(ctx, 64, 21, 2, 2.5);
    ctx.fill();
  });

  // Người đi chợ đêm
  SHIRTS.forEach((c, i) => {
    canvasTexture(scene, `HaNoi-walker-${i}`, 44, 72, (ctx) => {
      ellipse(ctx, 22, 68, 14, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fill();
      roundRect(ctx, 14, 50, 6, 18, 3);
      fillStroke(ctx, '#3f3f5a', OUT, 2);
      roundRect(ctx, 24, 50, 6, 18, 3);
      fillStroke(ctx, '#3f3f5a', OUT, 2);
      person(ctx, 22, 32, c, { hat: i % 3 === 0 ? 'non' : null, s: 1 });
    });
  });

  // Quầy hàng
  STALLS.forEach((st, i) => {
    canvasTexture(scene, `HaNoi-stall-${i}`, 200, 170, (ctx) => {
      ellipse(ctx, 100, 160, 92, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      // bàn
      roundRect(ctx, 26, 92, 148, 56, 8);
      fillStroke(ctx, linear(ctx, 0, 92, 0, 148, [[0, '#c98e5a'], [1, '#8b5a2b']]), OUT, 3);
      // bát / đồ ăn
      [[56, 96], [100, 92], [144, 96]].forEach(([x, y]) => {
        ellipse(ctx, x, y, 16, 7);
        fillStroke(ctx, '#fff', OUT, 2);
        ellipse(ctx, x, y - 2, 11, 4);
        ctx.fillStyle = ['#f6d36b', '#e8a46b', '#fff7cc'][(x / 44) % 3 | 0];
        ctx.fill();
      });
      // khói bốc lên
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 3;
      [86, 104].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 84);
        ctx.bezierCurveTo(x - 8, 74, x + 8, 66, x, 56);
        ctx.stroke();
      });
      // mái che sọc
      for (let k = 0; k < 8; k++) {
        ctx.beginPath();
        ctx.moveTo(14 + k * 21.5, 18);
        ctx.lineTo(14 + (k + 1) * 21.5, 18);
        ctx.lineTo(14 + (k + 1) * 21.5, 50);
        ctx.quadraticCurveTo(14 + (k + 0.5) * 21.5, 60, 14 + k * 21.5, 50);
        ctx.closePath();
        ctx.fillStyle = k % 2 ? '#fff8ee' : st.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUT;
        ctx.stroke();
      }
      // biển tên
      roundRect(ctx, 30, 0, 140, 28, 8);
      fillStroke(ctx, '#3a2a3f', '#ffd166', 3);
      ctx.fillStyle = '#ffd166';
      ctx.font = `800 ${st.name.length > 10 ? 16 : 20}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(st.name.toUpperCase(), 100, 21);
    });
  });

  // Hồ Gươm (nước đêm, lặp)
  canvasTexture(scene, 'HaNoi-lake', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#1d4d5a'], [1, '#1a4450']]);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(160,230,220,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const x = 20 + ((i * 71) % 200);
      const y = 20 + ((i * 113) % 210);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y);
      ctx.stroke();
    }
  });

  // Cầu Thê Húc (nhìn từ trên, chạy dọc)
  canvasTexture(scene, 'HaNoi-bridge', 150, 400, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(255,90,60,0.25)';
    ctx.fillRect(4, 0, w - 8, h);
    roundRect(ctx, 22, 0, w - 44, h, 6);
    fillStroke(ctx, linear(ctx, 22, 0, w - 22, 0, [[0, '#b91c1c'], [0.5, '#ef4444'], [1, '#b91c1c']]), OUT, 3);
    ctx.strokeStyle = 'rgba(80,10,10,0.5)';
    ctx.lineWidth = 2;
    for (let y = 12; y < h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(w - 26, y);
      ctx.stroke();
    }
    [16, w - 16].forEach((x) => {
      roundRect(ctx, x - 6, 0, 12, h, 4);
      fillStroke(ctx, '#dc2626', OUT, 2.5);
      for (let y = 20; y < h; y += 50) {
        roundRect(ctx, x - 9, y, 18, 18, 4);
        fillStroke(ctx, '#991b1b', OUT, 2);
        ellipse(ctx, x, y + 9, 4, 4);
        ctx.fillStyle = '#ffd166';
        ctx.fill();
      }
    });
  });

  // Đền Ngọc Sơn trên đảo
  canvasTexture(scene, 'HaNoi-temple', 420, 200, (ctx) => {
    ellipse(ctx, 210, 110, 205, 88);
    fillStroke(ctx, linear(ctx, 0, 30, 0, 200, [[0, '#4f9a5a'], [1, '#2f6b3a']]), OUT, 3);
    [[60, 80], [360, 90], [110, 150], [320, 150]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 34, 28);
      fillStroke(ctx, radial(ctx, x - 8, y - 8, 2, 34, [[0, '#7fd18a'], [1, '#2f8a4c']]), OUT, 2.5);
    });
    // mái đền cong
    const roof = (x, y, w, h, c) => {
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 14, y + h);
      ctx.quadraticCurveTo(x - w / 2, y + h * 0.6, x - w / 2 + 10, y);
      ctx.lineTo(x + w / 2 - 10, y);
      ctx.quadraticCurveTo(x + w / 2, y + h * 0.6, x + w / 2 + 14, y + h);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, y, 0, y + h, [[0, c], [1, '#7f1d1d']]), OUT, 3);
    };
    roundRect(ctx, 150, 90, 120, 60, 4);
    fillStroke(ctx, '#f6c85f', OUT, 3);
    roof(210, 54, 150, 44, '#c2410c');
    roof(210, 30, 90, 30, '#b91c1c');
    ctx.fillStyle = '#ffe7a3';
    [175, 205, 235].forEach((x) => {
      roundRect(ctx, x, 106, 16, 30, 3);
      ctx.fill();
    });
  });

  // Tháp Rùa
  canvasTexture(scene, 'HaNoi-turtle', 150, 150, (ctx) => {
    ellipse(ctx, 75, 115, 70, 30);
    fillStroke(ctx, '#3f8a4c', OUT, 3);
    roundRect(ctx, 40, 50, 70, 64, 6);
    fillStroke(ctx, linear(ctx, 0, 50, 0, 114, [[0, '#e7dcc8'], [1, '#a8957a']]), OUT, 3);
    roundRect(ctx, 52, 20, 46, 34, 5);
    fillStroke(ctx, linear(ctx, 0, 20, 0, 54, [[0, '#e7dcc8'], [1, '#a8957a']]), OUT, 3);
    ctx.fillStyle = '#ffd166';
    [[56, 76], [82, 76], [66, 30]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x + 6, y + 6, 6, Math.PI, 0);
      ctx.lineTo(x + 12, y + 20);
      ctx.lineTo(x, y + 20);
      ctx.closePath();
      ctx.fill();
    });
    ctx.beginPath();
    ctx.moveTo(48, 20);
    ctx.lineTo(75, 2);
    ctx.lineTo(102, 20);
    ctx.closePath();
    fillStroke(ctx, '#8b6f4e', OUT, 3);
  });

  // Cây liễu ven hồ (nhìn trên)
  canvasTexture(scene, 'HaNoi-willow', 140, 140, (ctx) => {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      ellipse(ctx, 70 + Math.cos(a) * 40, 70 + Math.sin(a) * 40, 22, 22);
      ctx.fillStyle = i % 2 ? '#3f8a4c' : '#4f9a5a';
      ctx.fill();
    }
    ellipse(ctx, 70, 70, 46, 46);
    ctx.fillStyle = radial(ctx, 60, 60, 4, 46, [[0, '#8fd694'], [1, '#3f8a4c']]);
    ctx.fill();
  });

  // Cột dây chắn (đóng lối ra hồ)
  canvasTexture(scene, 'HaNoi-post', 28, 56, (ctx) => {
    roundRect(ctx, 8, 10, 12, 44, 4);
    fillStroke(ctx, '#e5e7eb', OUT, 2.5);
    ellipse(ctx, 14, 10, 9, 9);
    fillStroke(ctx, '#ef4444', OUT, 2.5);
  });

  // Đèn đường (vầng sáng ấm trên mặt đất)
  canvasTexture(scene, 'HaNoi-lamp', 40, 40, (ctx) => {
    ellipse(ctx, 20, 20, 12, 12);
    fillStroke(ctx, radial(ctx, 18, 18, 1, 12, [[0, '#ffffff'], [1, '#fbbf24']]), OUT, 2.5);
  });

  // Viền tối đêm
  canvasTexture(scene, 'HaNoi-vignette', 1280, 720, (ctx, w, h) => {
    ctx.fillStyle = radial(ctx, w / 2, h / 2, 220, 780, [[0, 'rgba(10,8,40,0)'], [0.6, 'rgba(10,8,40,0.25)'], [1, 'rgba(10,8,40,0.7)']]);
    ctx.fillRect(0, 0, w, h);
  });

  // Bong bóng phím E
  canvasTexture(scene, 'HaNoi-ekey', 56, 56, (ctx) => {
    roundRect(ctx, 4, 4, 48, 44, 12);
    fillStroke(ctx, '#ffffff', OUT, 3);
    ctx.fillStyle = OUT;
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('E', 28, 37);
  });
}
