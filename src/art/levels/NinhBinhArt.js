// Art vẽ bằng code cho ván Ninh Bình: Tràng An – Tam Cốc (đò, núi đá vôi, lúa vàng, hang động)
// và Hang Múa (bậc đá, dê núi, rồng đá Ngọa Long).
import { canvasTexture, canvasSheet, roundRect, linear, radial, fillStroke, ellipse, skyTexture } from '../../utils/canvas.js';

const OUT = '#3a2a3f';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

/** Dải núi đá vôi hình tháp (karst) lặp liền mạch theo chiều ngang. */
function karstLayer(scene, key, w, h, { body, top, green, stripe, seed, count, minH, maxH, outline = null }) {
  canvasTexture(scene, key, w, h, (ctx) => {
    const r = rng(seed);
    const towers = [];
    for (let i = 0; i < count; i++) {
      towers.push({ cx: (i / count) * w + r() * (w / count) * 0.6, tw: 70 + r() * 120, th: minH + r() * (maxH - minH), lean: (r() - 0.5) * 0.3 });
    }
    towers.sort((a, b) => b.th - a.th);
    towers.forEach((t) => {
      [-w, 0, w].forEach((off) => {
        const cx = t.cx + off;
        const base = h + 4;
        const topY = h - t.th;
        const hw = t.tw / 2;
        ctx.beginPath();
        ctx.moveTo(cx - hw * 1.15, base);
        ctx.bezierCurveTo(cx - hw * 1.1, topY + t.th * 0.45, cx - hw * 0.95 + t.lean * 40, topY + t.th * 0.12, cx - hw * 0.45 + t.lean * 30, topY + 6);
        ctx.quadraticCurveTo(cx + t.lean * 30, topY - 14, cx + hw * 0.45 + t.lean * 30, topY + 6);
        ctx.bezierCurveTo(cx + hw * 0.95 + t.lean * 40, topY + t.th * 0.12, cx + hw * 1.1, topY + t.th * 0.45, cx + hw * 1.15, base);
        ctx.closePath();
        ctx.fillStyle = linear(ctx, 0, topY, 0, base, [[0, top], [1, body]]);
        ctx.fill();
        if (outline) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = outline;
          ctx.stroke();
        }
        // vệt đá dọc
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = stripe;
        ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) {
          const sx = cx - hw + (k + 0.5) * (t.tw / 6) + (r() - 0.5) * 8;
          ctx.beginPath();
          ctx.moveTo(sx, topY + 20 + r() * 30);
          ctx.lineTo(sx + (r() - 0.5) * 10, base);
          ctx.stroke();
        }
        // mảng cây xanh bám vách
        ctx.fillStyle = green;
        for (let k = 0; k < 9; k++) {
          const gx = cx + (r() - 0.5) * t.tw;
          const gy = topY + r() * t.th * 0.85;
          ellipse(ctx, gx, gy, 10 + r() * 16, 6 + r() * 9);
          ctx.fill();
        }
        // đỉnh xanh
        ellipse(ctx, cx + t.lean * 30, topY + 6, hw * 0.55, 12);
        ctx.fill();
        ctx.restore();
      });
    });
  });
}

export function createNinhBinhTextures(scene) {
  // ---------- Phase A: sông Tràng An ----------
  skyTexture(scene, 'NinhBinh-sky', 1280, 720, [[0, '#7ec8ee'], [0.45, '#c6ecff'], [0.62, '#fff2cf'], [1, '#ffe2a8']]);

  karstLayer(scene, 'NinhBinh-karst-far', 1600, 420, { body: '#b4cbd0', top: '#d4e2e4', green: 'rgba(140,175,160,0.55)', stripe: 'rgba(120,150,160,0.25)', seed: 3, count: 11, minH: 180, maxH: 380 });
  karstLayer(scene, 'NinhBinh-karst-mid', 1600, 440, { body: '#6e9c86', top: '#8fb89c', green: 'rgba(70,130,80,0.75)', stripe: 'rgba(40,80,60,0.25)', seed: 11, count: 8, minH: 200, maxH: 400, outline: 'rgba(40,70,55,0.6)' });
  karstLayer(scene, 'NinhBinh-karst-near', 1600, 520, { body: '#3f6b51', top: '#5e8e62', green: 'rgba(60,140,70,0.9)', stripe: 'rgba(20,50,35,0.35)', seed: 29, count: 6, minH: 260, maxH: 500, outline: OUT });

  // Ruộng lúa Tam Cốc
  canvasTexture(scene, 'NinhBinh-rice', 1024, 70, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#f6d77a'], [1, '#e2b04a']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let x = 0; x < w; x += 128) {
      ctx.fillStyle = `rgba(${200 + r() * 40},${160 + r() * 40},60,0.35)`;
      ctx.fillRect(x, 0, 128, h);
      ctx.fillStyle = '#7fae4c';
      ctx.fillRect(x, 0, 3, h);
    }
    ctx.strokeStyle = 'rgba(160,110,30,0.35)';
    ctx.lineWidth = 1.5;
    for (let y = 8; y < h; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#7fae4c';
    ctx.fillRect(0, 0, w, 4);
    ctx.fillRect(0, h - 5, w, 5);
  });

  // Nước sông
  canvasTexture(scene, 'NinhBinh-water', 512, 280, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#7cc2b4'], [0.4, '#4f9e98'], [1, '#2b6b72']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(17);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = 8 + r() * (h - 16);
      const len = 14 + r() * 40 * (y / h + 0.4);
      ctx.lineWidth = 1.5 + (y / h) * 2;
      [-w, 0, w].forEach((o) => {
        ctx.beginPath();
        ctx.moveTo(x + o, y);
        ctx.quadraticCurveTo(x + o + len / 2, y - 3, x + o + len, y);
        ctx.stroke();
      });
    }
  });

  // Thuyền nan (đò)
  canvasTexture(scene, 'NinhBinh-sampan', 320, 80, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(6, 22);
    ctx.quadraticCurveTo(30, 70, 110, 72);
    ctx.lineTo(220, 72);
    ctx.quadraticCurveTo(298, 70, 314, 20);
    ctx.quadraticCurveTo(160, 40, 6, 22);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 20, 0, 72, [[0, '#a8743f'], [1, '#5e3a1e']]), OUT, 3);
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,230,180,0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x < 320; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 18, 75);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(10, 24);
    ctx.quadraticCurveTo(160, 44, 310, 22);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#d9a866';
    ctx.stroke();
  });

  // Người chèo đò bằng chân (2 frame)
  const rower = (legOut) => (ctx) => {
    // mái chèo
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(legOut ? 70 : 60, 62);
    ctx.lineTo(legOut ? 10 : 30, 120);
    ctx.stroke();
    ctx.fillStyle = '#7a4a22';
    ellipse(ctx, legOut ? 12 : 31, 118, 7, 14, legOut ? 0.8 : 0.4);
    ctx.fill();
    // chân đạp mái chèo
    ctx.strokeStyle = '#e7b48c';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(52, 86);
    ctx.lineTo(legOut ? 66 : 58, legOut ? 66 : 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(44, 88);
    ctx.lineTo(legOut ? 34 : 40, 100);
    ctx.stroke();
    // thân áo bà ba
    roundRect(ctx, 32, 56, 26, 34, 8);
    fillStroke(ctx, linear(ctx, 0, 56, 0, 90, [[0, '#4a5d9c'], [1, '#2e3b6e']]), OUT, 2.5);
    // tay
    ctx.strokeStyle = '#e7b48c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(36, 64);
    ctx.lineTo(28, 80);
    ctx.stroke();
    // đầu
    ellipse(ctx, 46, 46, 11, 11);
    fillStroke(ctx, '#ffd6b5', OUT, 2.5);
    // nón lá
    ctx.beginPath();
    ctx.moveTo(18, 44);
    ctx.lineTo(46, 18);
    ctx.lineTo(74, 44);
    ctx.quadraticCurveTo(46, 50, 18, 44);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 18, 0, 46, [[0, '#fff3cc'], [1, '#e8c77c']]), OUT, 2.5);
    ctx.strokeStyle = 'rgba(150,110,40,0.5)';
    ctx.lineWidth = 1;
    [28, 36, 56, 64].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(46, 20);
      ctx.lineTo(x, 45);
      ctx.stroke();
    });
  };
  canvasSheet(scene, 'NinhBinh-rower', 96, 128, { r0: rower(false), r1: rower(true) });

  // Bông sen
  canvasTexture(scene, 'NinhBinh-lotus', 64, 52, (ctx) => {
    ellipse(ctx, 32, 40, 28, 9);
    fillStroke(ctx, linear(ctx, 0, 30, 0, 50, [[0, '#7cc35a'], [1, '#3f8a3a']]), OUT, 2);
    const petal = (a, len, col) => {
      ctx.save();
      ctx.translate(32, 36);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-9, -len * 0.6, 0, -len);
      ctx.quadraticCurveTo(9, -len * 0.6, 0, 0);
      ctx.closePath();
      fillStroke(ctx, col, '#a8325f', 1.8);
      ctx.restore();
    };
    [-1.0, 1.0, -0.55, 0.55].forEach((a) => petal(a, 22, linear(ctx, 0, 0, 0, 30, [[0, '#ffe0ee'], [1, '#ff8fb8']])));
    [-0.2, 0.2, 0].forEach((a) => petal(a, 28, linear(ctx, 0, 0, 0, 30, [[0, '#fff0f6'], [1, '#ff6f9f']])));
    ellipse(ctx, 32, 30, 4, 3);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
  });

  // Đá giữa sông
  canvasTexture(scene, 'NinhBinh-rock', 130, 90, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(8, 82);
    ctx.bezierCurveTo(4, 40, 30, 10, 62, 8);
    ctx.bezierCurveTo(100, 6, 126, 40, 122, 82);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 8, 0, 82, [[0, '#c9cdc7'], [1, '#7c8580']]), OUT, 3);
    ctx.fillStyle = 'rgba(80,150,80,0.85)';
    [[40, 22, 16, 8], [80, 18, 18, 9], [62, 12, 10, 6]].forEach(([x, y, a, b]) => {
      ellipse(ctx, x, y, a, b);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(60,60,60,0.3)';
    ctx.lineWidth = 2;
    [[50, 30, 46, 70], [86, 34, 92, 72]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(10, 78, 110, 4);
  });

  // Khúc gỗ trôi
  canvasTexture(scene, 'NinhBinh-log', 150, 44, (ctx) => {
    roundRect(ctx, 6, 8, 138, 28, 14);
    fillStroke(ctx, linear(ctx, 0, 8, 0, 36, [[0, '#a87445'], [1, '#6b4220']]), OUT, 3);
    ellipse(ctx, 132, 22, 9, 12);
    fillStroke(ctx, '#d9a46c', OUT, 2);
    ellipse(ctx, 132, 22, 4, 6);
    ctx.strokeStyle = '#8a5a2c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#5fa04a';
    ellipse(ctx, 50, 10, 10, 5);
    ctx.fill();
  });

  // Đàn vịt
  canvasTexture(scene, 'NinhBinh-duck', 54, 44, (ctx) => {
    ellipse(ctx, 26, 30, 20, 11);
    fillStroke(ctx, '#fffaf0', OUT, 2.5);
    ellipse(ctx, 40, 16, 8, 8);
    fillStroke(ctx, '#fffaf0', OUT, 2.5);
    ctx.beginPath();
    ctx.moveTo(46, 15);
    ctx.lineTo(54, 18);
    ctx.lineTo(46, 20);
    ctx.closePath();
    fillStroke(ctx, '#ffb347', OUT, 1.5);
    ellipse(ctx, 41, 14, 1.6, 1.6);
    ctx.fillStyle = OUT;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 26);
    ctx.quadraticCurveTo(24, 20, 32, 30);
    ctx.strokeStyle = 'rgba(150,140,120,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Lưới đánh cá (vó)
  canvasTexture(scene, 'NinhBinh-net', 150, 120, (ctx) => {
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    [[14, 118, 30, 6], [136, 118, 120, 6]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(30, 8);
    ctx.quadraticCurveTo(75, 60, 120, 8);
    ctx.lineTo(120, 100);
    ctx.quadraticCurveTo(75, 116, 30, 100);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    for (let x = 20; x < 140; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, 120);
      ctx.moveTo(x + 20, 0);
      ctx.lineTo(x, 120);
      ctx.stroke();
    }
    ctx.restore();
    ['#ff6b4a', '#ffd166', '#ff6b4a'].forEach((c, i) => {
      ellipse(ctx, 40 + i * 35, 100 + (i === 1 ? 8 : 0), 5, 5);
      fillStroke(ctx, c, OUT, 1.5);
    });
  });

  // Đò du khách đi ngược chiều
  canvasTexture(scene, 'NinhBinh-tourboat', 280, 120, (ctx) => {
    const person = (x, shirt, hat) => {
      roundRect(ctx, x - 10, 50, 20, 26, 7);
      fillStroke(ctx, shirt, OUT, 2);
      ellipse(ctx, x, 42, 9, 9);
      fillStroke(ctx, '#ffd6b5', OUT, 2);
      if (hat === 'non') {
        ctx.beginPath();
        ctx.moveTo(x - 18, 40);
        ctx.lineTo(x, 22);
        ctx.lineTo(x + 18, 40);
        ctx.closePath();
        fillStroke(ctx, '#f6dd9a', OUT, 2);
      } else {
        ellipse(ctx, x, 34, 14, 4);
        fillStroke(ctx, hat, OUT, 2);
        ellipse(ctx, x, 31, 8, 6);
        fillStroke(ctx, hat, OUT, 2);
      }
      // áo phao cam
      ctx.fillStyle = 'rgba(255,120,40,0.9)';
      ctx.fillRect(x - 9, 54, 18, 8);
    };
    person(80, '#ff8fb8', '#f2c14e');
    person(130, '#7cc2ff', '#ffffff');
    person(220, '#4a5d9c', 'non');
    ctx.beginPath();
    ctx.moveTo(4, 70);
    ctx.quadraticCurveTo(24, 112, 90, 114);
    ctx.lineTo(190, 114);
    ctx.quadraticCurveTo(262, 112, 276, 68);
    ctx.quadraticCurveTo(140, 86, 4, 70);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 68, 0, 114, [[0, '#a8743f'], [1, '#5e3a1e']]), OUT, 3);
    ctx.beginPath();
    ctx.moveTo(8, 72);
    ctx.quadraticCurveTo(140, 90, 272, 70);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#d9a866';
    ctx.stroke();
  });

  // Cò trắng bay
  canvasTexture(scene, 'NinhBinh-heron', 90, 50, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.quadraticCurveTo(30, 30, 44, 28);
    ctx.quadraticCurveTo(60, 30, 86, 12);
    ctx.quadraticCurveTo(62, 36, 46, 36);
    ctx.quadraticCurveTo(28, 38, 4, 14);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', 'rgba(58,42,63,0.7)', 2);
    ctx.beginPath();
    ctx.moveTo(46, 32);
    ctx.quadraticCurveTo(54, 40, 66, 38);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(66, 38);
    ctx.lineTo(76, 40);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f2a93b';
    ctx.stroke();
  });

  // Mái chùa ven sông + bụi tre
  canvasTexture(scene, 'NinhBinh-temple', 240, 170, (ctx) => {
    // bụi tre
    ctx.strokeStyle = '#4f8a3a';
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + i * 6, 170);
      ctx.quadraticCurveTo(10 + i * 10, 80, 30 + i * 14 - 20, 20 + i * 6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(90,160,70,0.85)';
    for (let i = 0; i < 14; i++) {
      ellipse(ctx, 10 + (i % 7) * 10, 20 + Math.floor(i / 7) * 30 + (i % 3) * 8, 12, 5, -0.5);
      ctx.fill();
    }
    // thân chùa
    roundRect(ctx, 96, 104, 120, 66, 4);
    fillStroke(ctx, linear(ctx, 0, 104, 0, 170, [[0, '#f3e1c2'], [1, '#d6bc90']]), OUT, 2.5);
    [118, 150, 182].forEach((x) => {
      roundRect(ctx, x, 124, 16, 46, 3);
      fillStroke(ctx, '#9c3b2a', OUT, 2);
    });
    // mái cong 2 tầng
    const roof = (y, w, h) => {
      ctx.beginPath();
      ctx.moveTo(156 - w / 2 - 16, y + h - 14);
      ctx.quadraticCurveTo(156 - w / 2, y + h, 156 - w / 2 + 14, y + h);
      ctx.lineTo(156 + w / 2 - 14, y + h);
      ctx.quadraticCurveTo(156 + w / 2, y + h, 156 + w / 2 + 16, y + h - 14);
      ctx.lineTo(156 + w / 2 - 20, y);
      ctx.lineTo(156 - w / 2 + 20, y);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, y, 0, y + h, [[0, '#b0452e'], [1, '#7a2a1c']]), OUT, 2.5);
    };
    roof(80, 150, 28);
    roundRect(ctx, 126, 56, 60, 26, 3);
    fillStroke(ctx, '#f3e1c2', OUT, 2);
    roof(36, 100, 24);
    ellipse(ctx, 156, 34, 5, 5);
    fillStroke(ctx, '#ffd166', OUT, 1.5);
  });

  // ---------- Hang động ----------
  canvasTexture(scene, 'NinhBinh-cavemouth', 520, 720, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, w, 0, [[0, '#4d5a52'], [0.5, '#2f3a34'], [1, '#4d5a52']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(41);
    ctx.fillStyle = 'rgba(70,130,80,0.8)';
    for (let i = 0; i < 26; i++) {
      ellipse(ctx, r() * w, r() * 380, 12 + r() * 20, 7 + r() * 10);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(20,30,25,0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const x = r() * w;
      ctx.beginPath();
      ctx.moveTo(x, r() * 200);
      ctx.lineTo(x + (r() - 0.5) * 20, h);
      ctx.stroke();
    }
    // khoét cửa hang
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(60, h);
    ctx.lineTo(60, 520);
    ctx.bezierCurveTo(70, 420, 170, 380, 260, 380);
    ctx.bezierCurveTo(350, 380, 450, 420, 460, 520);
    ctx.lineTo(460, h);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(60, h);
    ctx.lineTo(60, 520);
    ctx.bezierCurveTo(70, 420, 170, 380, 260, 380);
    ctx.bezierCurveTo(350, 380, 450, 420, 460, 520);
    ctx.lineTo(460, h);
    ctx.lineWidth = 5;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    // thạch nhũ ở vòm
    ctx.fillStyle = '#3a463f';
    for (let x = 110; x < 420; x += 34) {
      const top = 380 + Math.abs(x - 260) * 0.45;
      ctx.beginPath();
      ctx.moveTo(x - 9, top - 4);
      ctx.lineTo(x, top + 18 + r() * 22);
      ctx.lineTo(x + 9, top - 4);
      ctx.closePath();
      ctx.fill();
    }
  });

  canvasTexture(scene, 'NinhBinh-ceiling', 512, 170, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, 90, [[0, '#1d2420'], [1, '#36423b']]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    for (let x = w; x >= 0; x -= 32) ctx.lineTo(x, 70 + Math.sin(x * 0.05) * 14 + ((x / 32) % 2) * 10);
    ctx.closePath();
    ctx.fill();
    const r = rng(77);
    for (let x = 12; x < w; x += 22 + r() * 18) {
      const len = 30 + r() * 70;
      ctx.beginPath();
      ctx.moveTo(x - 7, 68);
      ctx.quadraticCurveTo(x - 2, 68 + len * 0.7, x, 68 + len);
      ctx.quadraticCurveTo(x + 2, 68 + len * 0.7, x + 7, 68);
      ctx.closePath();
      ctx.fillStyle = linear(ctx, 0, 68, 0, 68 + len, [[0, '#4b5a52'], [1, '#8fa39a']]);
      ctx.fill();
    }
  });

  // Thạch nhũ treo thấp (chướng ngại phải cúi)
  canvasTexture(scene, 'NinhBinh-stalactite', 110, 330, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w - 10, 120);
    ctx.quadraticCurveTo(80, 220, 62, h - 4);
    ctx.lineTo(48, h - 4);
    ctx.quadraticCurveTo(30, 220, 10, 120);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 0, 0, h, [[0, '#2d3732'], [0.6, '#6f8279'], [1, '#c9d6cf']]), OUT, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.quadraticCurveTo(46, 180, 54, h - 30);
    ctx.stroke();
    ellipse(ctx, 55, h - 2, 3, 4);
    ctx.fillStyle = 'rgba(180,230,255,0.9)';
    ctx.fill();
  });

  // ---------- Phase B: Hang Múa ----------
  skyTexture(scene, 'NinhBinh-sky2', 1280, 720, [[0, '#6aa8e0'], [0.5, '#ffd1a6'], [1, '#ffb27a']]);

  // Vách núi phía sau (lặp dọc + ngang)
  canvasTexture(scene, 'NinhBinh-cliff', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, w, 0, [[0, '#7d8f86'], [0.5, '#93a59b'], [1, '#7d8f86']]);
    ctx.fillRect(0, 0, w, h);
    const r = rng(53);
    ctx.strokeStyle = 'rgba(40,60,50,0.3)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const x = r() * w;
      [-h, 0, h].forEach((o) => {
        ctx.beginPath();
        ctx.moveTo(x, o + r() * h);
        ctx.lineTo(x + (r() - 0.5) * 20, o + r() * h + 120);
        ctx.stroke();
      });
    }
    ctx.fillStyle = 'rgba(70,140,75,0.75)';
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      [[0, 0], [-w, 0], [w, 0], [0, -h], [0, h]].forEach(([ox, oy]) => {
        ellipse(ctx, x + ox, y + oy, 12 + (i % 4) * 6, 7 + (i % 3) * 4);
        ctx.fill();
      });
    }
  });

  // Toàn cảnh thung lũng Tam Cốc nhìn từ trên cao
  canvasTexture(scene, 'NinhBinh-panorama', 1280, 520, (ctx, w, h) => {
    ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#e6d38f'], [1, '#d9b65a']]);
    ctx.fillRect(0, 160, w, h - 160);
    const r = rng(91);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(160,190,80,0.55)' : 'rgba(240,200,90,0.6)';
      const x = r() * w;
      const y = 180 + r() * (h - 180);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 60 + r() * 60, y + 6);
      ctx.lineTo(x + 50 + r() * 50, y + 30);
      ctx.lineTo(x - 10, y + 26);
      ctx.closePath();
      ctx.fill();
    }
    // sông uốn lượn
    ctx.beginPath();
    ctx.moveTo(-20, 330);
    ctx.bezierCurveTo(250, 250, 380, 470, 640, 380);
    ctx.bezierCurveTo(880, 300, 1000, 460, 1300, 360);
    ctx.lineWidth = 34;
    ctx.strokeStyle = '#7fc4c0';
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();
    // đò nhỏ
    [[300, 330], [700, 368], [1040, 392]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 10, 3);
      ctx.fillStyle = '#6b4220';
      ctx.fill();
    });
    // núi đá vôi xa
    for (let i = 0; i < 16; i++) {
      const x = (i / 16) * w + r() * 60;
      const th = 90 + r() * 170;
      const tw = 50 + r() * 70;
      const by = 200 + r() * 40;
      ctx.beginPath();
      ctx.moveTo(x - tw / 2, by);
      ctx.bezierCurveTo(x - tw / 2, by - th * 0.7, x - tw * 0.3, by - th, x, by - th);
      ctx.bezierCurveTo(x + tw * 0.3, by - th, x + tw / 2, by - th * 0.7, x + tw / 2, by);
      ctx.closePath();
      ctx.fillStyle = linear(ctx, 0, by - th, 0, by, [[0, '#9fbfa6'], [1, '#6f9a7c']]);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 150, w, 60);
  });

  // Bậc đá leo (khối cầu thang đi lên sang phải)
  canvasTexture(scene, 'NinhBinh-steps', 190, 70, (ctx, w, h) => {
    // khối đá đỡ
    ctx.beginPath();
    ctx.moveTo(4, 30);
    ctx.lineTo(w - 4, 6);
    ctx.lineTo(w - 10, h - 4);
    ctx.lineTo(10, h - 4);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 6, 0, h, [[0, '#a7aea4'], [1, '#6f776f']]), OUT, 3);
    // 6 bậc
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 30;
      const y = 28 - i * 4;
      roundRect(ctx, x, y, 32, 10, 3);
      fillStroke(ctx, i % 2 ? '#d7d2c4' : '#cbc5b5', OUT, 2);
    }
    ctx.fillStyle = 'rgba(80,140,70,0.7)';
    ellipse(ctx, 30, h - 10, 18, 6);
    ctx.fill();
    ellipse(ctx, 150, h - 12, 14, 5);
    ctx.fill();
  });

  // Chiếu nghỉ (checkpoint) có lan can đá
  canvasTexture(scene, 'NinhBinh-landing', 300, 90, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(4, 30);
    ctx.lineTo(w - 4, 30);
    ctx.lineTo(w - 24, h - 4);
    ctx.lineTo(24, h - 4);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 30, 0, h, [[0, '#b9b2a0'], [1, '#7a7466']]), OUT, 3);
    roundRect(ctx, 4, 24, w - 8, 14, 4);
    fillStroke(ctx, '#ddd6c4', OUT, 2.5);
    // lan can
    for (let x = 16; x < w - 10; x += 24) {
      roundRect(ctx, x, 4, 8, 22, 2);
      fillStroke(ctx, '#cfc8b4', OUT, 1.8);
    }
    roundRect(ctx, 10, 0, w - 20, 7, 3);
    fillStroke(ctx, '#e3dcc9', OUT, 2);
  });

  // Dê núi
  canvasTexture(scene, 'NinhBinh-goat', 80, 64, (ctx) => {
    [[20, 46], [30, 48], [52, 48], [60, 46]].forEach(([x, y]) => {
      roundRect(ctx, x - 3, y, 7, 14, 3);
      fillStroke(ctx, '#5a4a3a', OUT, 1.8);
    });
    ellipse(ctx, 40, 38, 26, 15);
    fillStroke(ctx, linear(ctx, 0, 24, 0, 52, [[0, '#ffffff'], [1, '#d9d2c4']]), OUT, 2.5);
    ellipse(ctx, 66, 26, 11, 10);
    fillStroke(ctx, '#f7f3ea', OUT, 2.5);
    ctx.beginPath();
    ctx.moveTo(62, 18);
    ctx.quadraticCurveTo(54, 2, 46, 10);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#8a7a5a';
    ctx.stroke();
    ellipse(ctx, 70, 24, 2, 2);
    ctx.fillStyle = OUT;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(70, 34);
    ctx.lineTo(68, 44);
    ctx.lineTo(73, 36);
    ctx.fillStyle = '#d9d2c4';
    ctx.fill();
  });

  // Đá lăn
  canvasTexture(scene, 'NinhBinh-boulder', 44, 44, (ctx) => {
    ellipse(ctx, 22, 22, 19, 18);
    fillStroke(ctx, radial(ctx, 16, 15, 2, 22, [[0, '#c4c7c0'], [1, '#6d736d']]), OUT, 3);
    ctx.strokeStyle = 'rgba(40,40,40,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 14);
    ctx.lineTo(24, 26);
    ctx.lineTo(30, 18);
    ctx.stroke();
  });

  // Du khách đứng chụp ảnh
  canvasTexture(scene, 'NinhBinh-tourist', 56, 96, (ctx) => {
    roundRect(ctx, 16, 66, 9, 28, 3);
    fillStroke(ctx, '#3d4a6b', OUT, 2);
    roundRect(ctx, 30, 66, 9, 28, 3);
    fillStroke(ctx, '#3d4a6b', OUT, 2);
    roundRect(ctx, 12, 36, 32, 34, 8);
    fillStroke(ctx, '#ffd166', OUT, 2.5);
    ellipse(ctx, 28, 24, 12, 12);
    fillStroke(ctx, '#ffe0c4', OUT, 2.5);
    ellipse(ctx, 28, 14, 18, 5);
    fillStroke(ctx, '#ffffff', OUT, 2);
    roundRect(ctx, 36, 40, 16, 12, 3);
    fillStroke(ctx, '#2f3546', OUT, 2);
    ellipse(ctx, 44, 46, 3.5, 3.5);
    ctx.fillStyle = '#9bd5ff';
    ctx.fill();
  });

  // Cờ trạm nghỉ
  canvasTexture(scene, 'NinhBinh-flag', 50, 90, (ctx) => {
    roundRect(ctx, 6, 4, 5, 86, 2);
    fillStroke(ctx, '#8a6a4a', OUT, 2);
    ctx.beginPath();
    ctx.moveTo(11, 8);
    ctx.lineTo(46, 20);
    ctx.lineTo(11, 34);
    ctx.closePath();
    fillStroke(ctx, '#e8402e', OUT, 2);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('★', 18, 25);
  });

  // Rồng đá Ngọa Long trên đỉnh
  canvasTexture(scene, 'NinhBinh-dragon', 320, 240, (ctx) => {
    // mỏm đá đỉnh núi
    ctx.beginPath();
    ctx.moveTo(10, 240);
    ctx.bezierCurveTo(30, 170, 100, 150, 160, 152);
    ctx.bezierCurveTo(230, 150, 290, 170, 310, 240);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 150, 0, 240, [[0, '#a3aca2'], [1, '#5f6a62']]), OUT, 3);
    ctx.fillStyle = 'rgba(70,140,75,0.8)';
    [[60, 190], [250, 200], [150, 210]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 22, 9);
      ctx.fill();
    });
    // thân rồng uốn khúc
    const stone = linear(ctx, 0, 40, 0, 170, [[0, '#d9dcd2'], [1, '#8f978d']]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(40, 160);
    ctx.bezierCurveTo(60, 100, 110, 100, 120, 140);
    ctx.bezierCurveTo(130, 175, 180, 170, 190, 120);
    ctx.bezierCurveTo(200, 70, 240, 60, 250, 90);
    ctx.lineWidth = 30;
    ctx.strokeStyle = OUT;
    ctx.stroke();
    ctx.lineWidth = 24;
    ctx.strokeStyle = stone;
    ctx.stroke();
    // vảy / vây lưng
    ctx.fillStyle = '#b8beb2';
    [[58, 118], [92, 104], [150, 160], [184, 112], [214, 74]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x, y - 18);
      ctx.lineTo(x + 8, y);
      ctx.closePath();
      fillStroke(ctx, '#b8beb2', OUT, 2);
    });
    // đầu rồng
    ellipse(ctx, 262, 82, 30, 22, -0.2);
    fillStroke(ctx, stone, OUT, 3);
    ctx.beginPath();
    ctx.moveTo(280, 92);
    ctx.lineTo(310, 102);
    ctx.lineTo(282, 104);
    ctx.closePath();
    fillStroke(ctx, '#c9cec3', OUT, 2.5);
    // sừng
    ctx.lineWidth = 5;
    ctx.strokeStyle = OUT;
    ctx.beginPath();
    ctx.moveTo(252, 62);
    ctx.quadraticCurveTo(244, 36, 230, 34);
    ctx.moveTo(266, 60);
    ctx.quadraticCurveTo(270, 32, 258, 24);
    ctx.stroke();
    ellipse(ctx, 270, 76, 4, 4);
    ctx.fillStyle = '#e8402e';
    ctx.fill();
    // râu
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(292, 98);
    ctx.quadraticCurveTo(306, 120, 296, 136);
    ctx.stroke();
    // đuôi
    ctx.beginPath();
    ctx.moveTo(40, 160);
    ctx.quadraticCurveTo(20, 170, 22, 150);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#8f978d';
    ctx.stroke();
  });
}
