// Đồ họa ván Hội An — phố cổ đèn lồng & sông Hoài về đêm. Mọi key texture có tiền tố 'HoiAn-'.
import { canvasTexture, roundRect, linear, radial, fillStroke, ellipse } from '../../utils/canvas.js';

const INK = '#3a2a3f';

export const LANTERN_COLORS = ['#e63946', '#ffbe0b', '#fb8500', '#ff5d8f', '#9b5de5', '#2ec4b6', '#3a86ff'];
export const LANTERN_TINTS = [0xff5a5a, 0xffd166, 0xffa040, 0xff7eb3, 0xc49bff, 0x5fe0d0, 0x7fb2ff];

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Đèn lồng lụa Hội An: thân tròn có gân, chóp + đáy gỗ, tua rua. */
function drawLantern(ctx, cx, cy, w, h, color, lit = true) {
  // dây treo
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, cy - h / 2);
  ctx.stroke();
  // chóp
  roundRect(ctx, cx - w * 0.22, cy - h / 2 - 4, w * 0.44, 7, 2);
  fillStroke(ctx, '#5a3825', INK, 1.5);
  // thân
  ellipse(ctx, cx, cy, w / 2, h / 2);
  ctx.fillStyle = lit
    ? radial(ctx, cx - w * 0.12, cy - h * 0.1, 1, w * 0.7, [[0, '#fffbe6'], [0.35, color], [1, shade(color, 0.55)]])
    : linear(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, '#7d7468'], [0.5, '#b8ab96'], [1, '#6e665c']]);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // gân tre
  ctx.strokeStyle = lit ? 'rgba(90,30,10,0.35)' : 'rgba(40,30,20,0.35)';
  ctx.lineWidth = 1.2;
  [-0.6, -0.25, 0.25, 0.6].forEach((k) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(k) * w / 2, h / 2, 0, k < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, k < 0 ? Math.PI * 1.5 : Math.PI * 0.5);
    ctx.stroke();
  });
  // đáy + tua rua
  roundRect(ctx, cx - w * 0.2, cy + h / 2 - 3, w * 0.4, 6, 2);
  fillStroke(ctx, '#5a3825', INK, 1.5);
  ctx.strokeStyle = lit ? color : '#7d7468';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 1.6, cy + h / 2 + 3);
    ctx.lineTo(cx + i * 2.2, cy + h / 2 + 12);
    ctx.stroke();
  }
  if (lit) {
    ellipse(ctx, cx - w * 0.18, cy - h * 0.18, w * 0.1, h * 0.14, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  }
}

/** Nhân vật nhỏ nhìn 3/4 (khách du lịch, người bán hàng). */
function drawPerson(ctx, x, y, { shirt, pants = '#3b3f58', hair = '#2a2433', hat = null, skin = '#ffd9bd', s = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ellipse(ctx, 0, 30, 13, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  roundRect(ctx, -8, 14, 6, 16, 3);
  fillStroke(ctx, pants, INK, 1.5);
  roundRect(ctx, 2, 14, 6, 16, 3);
  fillStroke(ctx, pants, INK, 1.5);
  roundRect(ctx, -11, -4, 22, 22, 7);
  fillStroke(ctx, shirt, INK, 1.8);
  ellipse(ctx, 0, -13, 10, 10);
  fillStroke(ctx, skin, INK, 1.8);
  if (hat === 'non') {
    ctx.beginPath();
    ctx.moveTo(-17, -14);
    ctx.lineTo(0, -30);
    ctx.lineTo(17, -14);
    ctx.quadraticCurveTo(0, -9, -17, -14);
    fillStroke(ctx, linear(ctx, 0, -30, 0, -10, [[0, '#fff3c4'], [1, '#d9b56a']]), INK, 1.6);
  } else if (hat === 'cap') {
    ellipse(ctx, 0, -19, 11, 6);
    fillStroke(ctx, '#ffffff', INK, 1.5);
  } else {
    ctx.beginPath();
    ctx.arc(0, -15, 10, Math.PI, 0);
    fillStroke(ctx, hair, INK, 1.6);
  }
  ctx.fillStyle = INK;
  ellipse(ctx, -3.5, -12, 1.4, 1.8);
  ctx.fill();
  ellipse(ctx, 3.5, -12, 1.4, 1.8);
  ctx.fill();
  ctx.restore();
}

function wheel(ctx, x, y, r) {
  ellipse(ctx, x, y, r, r);
  fillStroke(ctx, '#2b2b36', INK, 2);
  ellipse(ctx, x, y, r * 0.55, r * 0.55);
  fillStroke(ctx, '#c9c9d6', INK, 1.5);
  ctx.strokeStyle = '#6b6b80';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55);
    ctx.stroke();
  }
}

/** Ngói âm dương phố cổ. */
function tileRoof(ctx, x, y, w, h) {
  ctx.fillStyle = linear(ctx, 0, y, 0, y + h, [[0, '#8a4a2a'], [1, '#5e2f1b']]);
  ctx.fillRect(x, y, w, h);
  for (let ry = y + 6, row = 0; ry < y + h - 4; ry += 13, row++) {
    for (let rx = x + (row % 2) * 9; rx < x + w; rx += 18) {
      ctx.beginPath();
      ctx.arc(rx + 9, ry, 9, 0, Math.PI);
      ctx.fillStyle = row % 2 ? '#a65a33' : '#b5653b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(50,20,10,0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  // rêu
  ctx.fillStyle = 'rgba(90,120,60,0.35)';
  for (let i = 0; i < 10; i++) {
    ellipse(ctx, x + Math.random() * w, y + Math.random() * h, 8 + Math.random() * 10, 4 + Math.random() * 4);
    ctx.fill();
  }
  // nóc
  roundRect(ctx, x - 4, y - 6, w + 8, 12, 5);
  fillStroke(ctx, '#4a2416', INK, 2);
}

function bougainvillea(ctx, x, y, r) {
  ctx.fillStyle = '#2f7a3e';
  for (let i = 0; i < 9; i++) {
    ellipse(ctx, x + (Math.random() - 0.5) * r * 1.6, y + (Math.random() - 0.5) * r, r * 0.35, r * 0.25);
    ctx.fill();
  }
  ['#ff4fa3', '#ff7ec0', '#e0368a', '#ff9fd0'].forEach((c) => {
    ctx.fillStyle = c;
    for (let i = 0; i < 12; i++) {
      ellipse(ctx, x + (Math.random() - 0.5) * r * 1.8, y + (Math.random() - 0.5) * r * 1.1, r * 0.13, r * 0.13);
      ctx.fill();
    }
  });
}

/** Nhà phố cổ: mái ngói + tường vàng + cửa gỗ (nhìn 3/4 từ trên xuống). */
function drawHouse(ctx, w, h, variant) {
  const roofH = 160;
  const wall = ['#f2c14e', '#f5cf6a', '#e9b23c'][variant % 3];
  tileRoof(ctx, 8, 8, w - 16, roofH);
  // bóng mái
  ctx.fillStyle = 'rgba(30,10,5,0.6)';
  ctx.fillRect(8, roofH + 6, w - 16, 12);
  // tường
  ctx.fillStyle = linear(ctx, 0, roofH + 10, 0, h, [[0, shade(wall, 0.85)], [0.3, wall], [1, shade(wall, 0.9)]]);
  ctx.fillRect(12, roofH + 14, w - 24, h - roofH - 20);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(12, roofH + 14, w - 24, h - roofH - 20);
  // vết rêu tường
  ctx.fillStyle = 'rgba(120,90,30,0.18)';
  for (let i = 0; i < 6; i++) {
    ellipse(ctx, 20 + Math.random() * (w - 40), roofH + 30 + Math.random() * 60, 14, 8);
    ctx.fill();
  }
  // cửa gỗ giữa
  const dw = 92;
  const dx = w / 2 - dw / 2;
  const dy = roofH + 34;
  const dh = h - dy - 8;
  ctx.fillStyle = 'rgba(255,190,90,0.85)';
  ctx.fillRect(dx, dy, dw, dh);
  const shutter = variant === 2 ? '#2a6f6a' : '#5a3825';
  [0, 1, 2, 3].forEach((i) => {
    if (variant !== 1 && (i === 1 || i === 2)) return; // cửa mở giữa
    roundRect(ctx, dx + i * (dw / 4) + 1, dy, dw / 4 - 2, dh, 2);
    fillStroke(ctx, shutter, INK, 1.8);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(dx + i * (dw / 4) + 4, dy + (dh * k) / 4);
      ctx.lineTo(dx + (i + 1) * (dw / 4) - 4, dy + (dh * k) / 4);
      ctx.stroke();
    }
  });
  if (variant === 1) {
    // tiệm may: cuộn vải trong cửa sổ
    ['#e63946', '#ffbe0b', '#2ec4b6', '#9b5de5', '#ff5d8f'].forEach((c, i) => {
      roundRect(ctx, dx + 10 + i * 15, dy + dh - 34, 12, 30, 3);
      fillStroke(ctx, c, INK, 1.2);
    });
  } else {
    // bàn trà / hàng lưu niệm
    roundRect(ctx, dx + 24, dy + dh - 26, dw - 48, 14, 3);
    fillStroke(ctx, '#7a4a2a', INK, 1.5);
  }
  // cửa sổ hai bên
  [30, w - 74].forEach((x) => {
    roundRect(ctx, x, roofH + 40, 44, 52, 4);
    fillStroke(ctx, 'rgba(255,200,110,0.9)', INK, 2);
    [0, 1].forEach((k) => {
      roundRect(ctx, x + k * 22, roofH + 40, 22, 52, 3);
      fillStroke(ctx, shutter, INK, 1.5);
    });
  });
  // biển hiệu
  roundRect(ctx, w / 2 - 70, roofH + 16, 140, 16, 4);
  fillStroke(ctx, '#3b2416', '#c9a227', 2);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px "Baloo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(['QUÁN TRÀ PHỐ HỘI', 'MAY ĐO • TAILOR', 'ĐÈN LỒNG PHỐ CỔ'][variant % 3], w / 2, roofH + 28);
  // hoa giấy
  bougainvillea(ctx, variant % 2 ? w - 26 : 26, roofH + 18, 34);
}

export function createHoiAnTextures(scene) {
  // Đèn lồng 7 màu + đèn chưa thắp
  LANTERN_COLORS.forEach((c, i) => canvasTexture(scene, `HoiAn-lantern-${i}`, 40, 72, (ctx) => drawLantern(ctx, 20, 34, 30, 40, c)));
  canvasTexture(scene, 'HoiAn-lantern-off', 40, 72, (ctx) => drawLantern(ctx, 20, 34, 30, 40, '#999', false));

  [0, 1, 2].forEach((v) => canvasTexture(scene, `HoiAn-house-${v}`, 300, 290, (ctx, w, h) => drawHouse(ctx, w, h, v)));

  // Đá lát phố
  canvasTexture(scene, 'HoiAn-stone', 128, 128, (ctx) => {
    ctx.fillStyle = '#6e5f57';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 32) {
      for (let x = (y / 32) % 2 ? -32 : 0; x < 128; x += 64) {
        roundRect(ctx, x + 2, y + 2, 60, 28, 6);
        ctx.fillStyle = ['#8a786c', '#7f6e63', '#958274'][(x + y) % 3 === 0 ? 0 : (x / 64 + y / 32) % 2 ? 1 : 2];
        ctx.fill();
        ctx.fillStyle = 'rgba(255,220,170,0.08)';
        ctx.fillRect(x + 6, y + 5, 40, 5);
      }
    }
  });
  canvasTexture(scene, 'HoiAn-road', 128, 128, (ctx) => {
    ctx.fillStyle = '#4a3f45';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 2);
  });
  canvasTexture(scene, 'HoiAn-plank', 64, 64, (ctx) => {
    ctx.fillStyle = '#7a4f30';
    ctx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 16) {
      ctx.fillStyle = y % 32 ? '#8c5c38' : '#6e4529';
      ctx.fillRect(0, y + 1, 64, 14);
      ctx.fillStyle = '#3a2416';
      ctx.fillRect(0, y + 15, 64, 2);
      ctx.fillRect((y * 7) % 64, y + 1, 2, 14);
    }
  });

  // Nước sông Hoài về đêm
  canvasTexture(scene, 'HoiAn-water', 256, 256, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 0, 256, 256, [[0, '#0d1a3a'], [0.5, '#132a52'], [1, '#0f2045']]);
    ctx.fillRect(0, 0, 256, 256);
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.strokeStyle = i % 4 ? 'rgba(120,170,255,0.18)' : 'rgba(255,200,120,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 10, y - 4, x + 22, y);
      ctx.stroke();
    }
  });

  // Vũng nước (trơn)
  canvasTexture(scene, 'HoiAn-puddle', 130, 64, (ctx) => {
    ellipse(ctx, 65, 32, 60, 26);
    ctx.fillStyle = linear(ctx, 0, 6, 0, 58, [[0, 'rgba(40,60,110,0.85)'], [1, 'rgba(20,30,70,0.85)']]);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(160,200,255,0.6)';
    ctx.stroke();
    [['#ff5a5a', 40, 26], ['#ffd166', 80, 34], ['#c49bff', 60, 40]].forEach(([c, x, y]) => {
      ctx.fillStyle = radial(ctx, x, y, 1, 12, [[0, c], [1, 'rgba(0,0,0,0)']]);
      ctx.fillRect(x - 12, y - 12, 24, 24);
    });
  });

  // Cột treo đèn
  canvasTexture(scene, 'HoiAn-post', 50, 140, (ctx) => {
    roundRect(ctx, 20, 20, 9, 116, 3);
    fillStroke(ctx, linear(ctx, 20, 0, 29, 0, [[0, '#6e4529'], [1, '#a0704a']]), INK, 2);
    roundRect(ctx, 6, 16, 38, 8, 3);
    fillStroke(ctx, '#5a3825', INK, 2);
    ellipse(ctx, 25, 134, 16, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  });

  // Khách du lịch, người bán hàng, thợ ảnh
  const shirts = ['#ff7a59', '#3d8bfd', '#33b36b', '#ffd166', '#c49bff', '#ffffff', '#ff5d8f'];
  shirts.forEach((sh, i) =>
    canvasTexture(scene, `HoiAn-person-${i}`, 44, 72, (ctx) =>
      drawPerson(ctx, 22, 38, { shirt: sh, hair: i % 3 ? '#2a2433' : '#c98a4a', hat: i === 2 ? 'cap' : i === 5 ? 'non' : null }),
    ),
  );
  canvasTexture(scene, 'HoiAn-vendor', 150, 80, (ctx) => {
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(10, 36);
    ctx.quadraticCurveTo(75, 28, 140, 36);
    ctx.stroke();
    [[22, '#33b36b'], [128, '#ffbe0b']].forEach(([x, fruit]) => {
      ctx.strokeStyle = '#5a3825';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 12, 52);
      ctx.lineTo(x, 34);
      ctx.lineTo(x + 12, 52);
      ctx.stroke();
      ellipse(ctx, x, 58, 18, 10);
      fillStroke(ctx, '#c9a066', INK, 2);
      for (let k = 0; k < 6; k++) {
        ellipse(ctx, x - 10 + (k % 3) * 10, 51 + Math.floor(k / 3) * 5, 5, 5);
        fillStroke(ctx, fruit, INK, 1);
      }
    });
    drawPerson(ctx, 75, 40, { shirt: '#5fa8d3', hat: 'non' });
  });
  canvasTexture(scene, 'HoiAn-photog', 50, 72, (ctx) => {
    drawPerson(ctx, 25, 38, { shirt: '#22223b', hat: 'cap' });
    roundRect(ctx, 16, 18, 18, 12, 3);
    fillStroke(ctx, '#111', '#888', 1.5);
    ellipse(ctx, 25, 24, 4, 4);
    ctx.fillStyle = '#7fb2ff';
    ctx.fill();
  });

  // Xích lô (nhìn ngang, đi sang phải)
  canvasTexture(scene, 'HoiAn-cyclo', 170, 110, (ctx) => {
    wheel(ctx, 128, 88, 16);
    wheel(ctx, 30, 88, 16);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 88);
    ctx.lineTo(70, 74);
    ctx.lineTo(118, 74);
    ctx.lineTo(128, 88);
    ctx.stroke();
    // ghế khách phía trước
    ctx.beginPath();
    ctx.moveTo(98, 76);
    ctx.lineTo(158, 76);
    ctx.quadraticCurveTo(162, 46, 140, 40);
    ctx.lineTo(104, 40);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 40, 0, 76, [[0, '#e63946'], [1, '#9b1d2a']]), INK, 2.5);
    // mái che
    ctx.beginPath();
    ctx.moveTo(100, 40);
    ctx.quadraticCurveTo(110, 8, 160, 14);
    ctx.lineTo(158, 24);
    ctx.quadraticCurveTo(116, 20, 106, 42);
    ctx.closePath();
    fillStroke(ctx, '#2a6f6a', INK, 2);
    drawPerson(ctx, 128, 46, { shirt: '#ffd166', hat: 'cap', s: 0.8 });
    drawPerson(ctx, 48, 50, { shirt: '#5fa8d3', hat: 'non', s: 0.85 });
  });
  canvasTexture(scene, 'HoiAn-bike', 110, 90, (ctx) => {
    wheel(ctx, 22, 70, 15);
    wheel(ctx, 88, 70, 15);
    ctx.strokeStyle = '#2a6f6a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(22, 70);
    ctx.lineTo(50, 50);
    ctx.lineTo(80, 50);
    ctx.lineTo(88, 70);
    ctx.moveTo(50, 50);
    ctx.lineTo(55, 70);
    ctx.stroke();
    roundRect(ctx, 80, 34, 26, 16, 3);
    fillStroke(ctx, '#c9a066', INK, 2);
    ['#ff5d8f', '#ffd166', '#ff7a59'].forEach((c, i) => {
      ellipse(ctx, 86 + i * 8, 32, 5, 5);
      fillStroke(ctx, c, INK, 1);
    });
    drawPerson(ctx, 52, 28, { shirt: '#ffffff', hat: 'non', s: 0.85 });
  });
  canvasTexture(scene, 'HoiAn-moto', 120, 90, (ctx) => {
    wheel(ctx, 24, 70, 15);
    wheel(ctx, 96, 70, 15);
    ctx.beginPath();
    ctx.moveTo(20, 66);
    ctx.quadraticCurveTo(30, 40, 60, 46);
    ctx.lineTo(96, 46);
    ctx.lineTo(104, 66);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 40, 0, 70, [[0, '#ff9f5a'], [1, '#d95d1a']]), INK, 2.5);
    ellipse(ctx, 108, 46, 6, 5);
    ctx.fillStyle = '#fff6b0';
    ctx.fill();
    drawPerson(ctx, 58, 26, { shirt: '#3d8bfd', hat: 'cap', s: 0.85 });
  });

  // Chùa Cầu (cầu có mái, nhìn 3/4)
  canvasTexture(scene, 'HoiAn-chuacau', 600, 300, (ctx) => {
    // chân cầu đá
    ctx.fillStyle = linear(ctx, 0, 230, 0, 300, [[0, '#8a7d70'], [1, '#5a5048']]);
    roundRect(ctx, 20, 226, 560, 70, 10);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    [80, 520].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, 296, 44, Math.PI, 0);
      ctx.fillStyle = '#1b2440';
      ctx.fill();
      ctx.stroke();
    });
    // thân gỗ đỏ son
    ctx.fillStyle = linear(ctx, 0, 140, 0, 232, [[0, '#7a1e1e'], [1, '#a8322b']]);
    ctx.fillRect(30, 140, 540, 92);
    ctx.strokeRect(30, 140, 540, 92);
    for (let x = 44; x < 570; x += 48) {
      roundRect(ctx, x, 146, 10, 84, 3);
      fillStroke(ctx, '#c0392b', INK, 1.5);
    }
    // lối đi giữa (sáng ấm)
    ctx.fillStyle = radial(ctx, 300, 200, 10, 90, [[0, '#ffe2a8'], [1, '#c9741a']]);
    roundRect(ctx, 220, 150, 160, 84, 8);
    ctx.fill();
    ctx.stroke();
    // mái chính cong
    const roof = (x0, x1, y, h) => {
      ctx.beginPath();
      ctx.moveTo(x0 - 20, y + h - 10);
      ctx.quadraticCurveTo(x0, y + h, x0 + 20, y);
      ctx.lineTo(x1 - 20, y);
      ctx.quadraticCurveTo(x1, y + h, x1 + 20, y + h - 10);
      ctx.lineTo(x1 + 4, y + h + 8);
      ctx.lineTo(x0 - 4, y + h + 8);
      ctx.closePath();
    };
    ctx.save();
    roof(30, 570, 52, 90);
    ctx.clip();
    tileRoof(ctx, 0, 40, 600, 120);
    ctx.restore();
    roof(30, 570, 52, 90);
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // miếu nhỏ ở giữa, mái 2 tầng
    ctx.save();
    roof(230, 370, 6, 60);
    ctx.clip();
    tileRoof(ctx, 190, 0, 220, 80);
    ctx.restore();
    roof(230, 370, 6, 60);
    ctx.stroke();
    // đầu đao uốn
    [[10, 140], [590, 140], [208, 74], [392, 74]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y - 8, 9, Math.PI * 0.2, Math.PI * 1.3);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#c9a227';
      ctx.stroke();
    });
    // bảng tên
    roundRect(ctx, 236, 120, 128, 26, 6);
    fillStroke(ctx, '#3b2416', '#ffd166', 3);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px "Baloo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHÙA CẦU', 300, 140);
  });

  // Thuyền gỗ có mắt (nhìn từ trên, mũi hướng lên)
  const boat = (key, hull, trim, canopy = false) =>
    canvasTexture(scene, key, 120, 230, (ctx) => {
      ellipse(ctx, 60, 120, 52, 108);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(60, 6);
      ctx.bezierCurveTo(108, 50, 108, 170, 92, 222);
      ctx.lineTo(28, 222);
      ctx.bezierCurveTo(12, 170, 12, 50, 60, 6);
      ctx.closePath();
      fillStroke(ctx, linear(ctx, 0, 0, 120, 0, [[0, shade(hull, 0.7)], [0.5, hull], [1, shade(hull, 0.7)]]), INK, 3);
      ctx.beginPath();
      ctx.moveTo(60, 24);
      ctx.bezierCurveTo(92, 60, 92, 165, 82, 210);
      ctx.lineTo(38, 210);
      ctx.bezierCurveTo(28, 165, 28, 60, 60, 24);
      ctx.closePath();
      fillStroke(ctx, '#8c5c38', INK, 2);
      ctx.strokeStyle = 'rgba(50,25,10,0.5)';
      ctx.lineWidth = 1.5;
      for (let y = 70; y < 205; y += 14) {
        ctx.beginPath();
        ctx.moveTo(34, y);
        ctx.lineTo(86, y);
        ctx.stroke();
      }
      // viền màu + mắt thuyền
      ctx.strokeStyle = trim;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, 12);
      ctx.bezierCurveTo(100, 52, 100, 168, 88, 216);
      ctx.moveTo(60, 12);
      ctx.bezierCurveTo(20, 52, 20, 168, 32, 216);
      ctx.stroke();
      [[30, 44], [90, 44]].forEach(([x, y]) => {
        ellipse(ctx, x, y, 9, 6);
        fillStroke(ctx, '#ffffff', '#c0392b', 2.5);
        ellipse(ctx, x, y, 3.5, 3.5);
        ctx.fillStyle = '#111';
        ctx.fill();
      });
      if (canopy) {
        roundRect(ctx, 30, 96, 60, 80, 12);
        fillStroke(ctx, '#2a6f6a', INK, 2.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        for (let y = 104; y < 172; y += 10) {
          ctx.beginPath();
          ctx.moveTo(34, y);
          ctx.lineTo(86, y);
          ctx.stroke();
        }
      }
      // đèn lồng nhỏ ở đuôi
      ellipse(ctx, 60, 206, 8, 10);
      fillStroke(ctx, '#e63946', INK, 1.5);
    });
  boat('HoiAn-boat', '#a8692f', '#2ec4b6');
  boat('HoiAn-boat2', '#7a4a2a', '#ffbe0b', true);
  boat('HoiAn-boat3', '#5e3a22', '#e63946', true);

  // Hoa đăng (đèn hoa sen giấy)
  canvasTexture(scene, 'HoiAn-hoadang', 52, 52, (ctx) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(26, 26);
      ctx.rotate(a);
      ellipse(ctx, 0, -13, 7, 12);
      fillStroke(ctx, linear(ctx, 0, -25, 0, 0, [[0, '#ffe0ec'], [1, '#ff5d8f']]), INK, 1.4);
      ctx.restore();
    }
    ellipse(ctx, 26, 26, 9, 9);
    ctx.fillStyle = radial(ctx, 26, 26, 1, 10, [[0, '#fffbe0'], [0.6, '#ffd166'], [1, '#ff9f1c']]);
    ctx.fill();
  });
  canvasTexture(scene, 'HoiAn-ring', 160, 160, (ctx) => {
    ctx.strokeStyle = 'rgba(255,215,120,0.9)';
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 5;
    ellipse(ctx, 80, 80, 72, 72);
    ctx.stroke();
  });
  // Đám đèn hoa đăng trôi (chướng ngại)
  canvasTexture(scene, 'HoiAn-cluster', 150, 110, (ctx) => {
    [[30, 40], [70, 30], [110, 45], [50, 75], [95, 78], [130, 80], [20, 80]].forEach(([x, y], i) => {
      ctx.fillStyle = radial(ctx, x, y, 2, 26, [[0, 'rgba(255,210,120,0.6)'], [1, 'rgba(255,210,120,0)']]);
      ctx.fillRect(x - 26, y - 26, 52, 52);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        ellipse(ctx, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6, 6);
        fillStroke(ctx, ['#ff7eb3', '#ffd166', '#ffffff'][i % 3], INK, 1);
      }
      ellipse(ctx, x, y, 4, 4);
      ctx.fillStyle = '#fff6b0';
      ctx.fill();
    });
  });
  // Lưới đánh cá
  canvasTexture(scene, 'HoiAn-net', 180, 130, (ctx) => {
    ctx.strokeStyle = 'rgba(220,220,230,0.6)';
    ctx.lineWidth = 1.5;
    for (let x = 10; x <= 170; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 6, 118);
      ctx.stroke();
    }
    for (let y = 12; y <= 118; y += 14) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(176, y + 4);
      ctx.stroke();
    }
    for (let x = 10; x <= 176; x += 22) {
      ellipse(ctx, x, 10, 5, 5);
      fillStroke(ctx, '#ff9f1c', INK, 1.5);
    }
    [[6, 6], [174, 6], [6, 122], [174, 122]].forEach(([x, y]) => {
      roundRect(ctx, x - 4, y - 14, 8, 28, 3);
      fillStroke(ctx, '#6e4529', INK, 1.5);
    });
  });
  // Cầu gỗ bắc ngang sông (giữa đường)
  canvasTexture(scene, 'HoiAn-footbridge', 860, 80, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 10, 0, 70, [[0, '#9a6a42'], [1, '#6e4529']]);
    roundRect(ctx, 0, 14, 860, 52, 6);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,10,0.5)';
    ctx.lineWidth = 2;
    for (let x = 20; x < 860; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 64);
      ctx.stroke();
    }
    ctx.fillStyle = '#4a2c18';
    ctx.fillRect(0, 10, 860, 6);
    ctx.fillRect(0, 64, 860, 6);
  });
  // Cầu An Hội (cuối sông)
  canvasTexture(scene, 'HoiAn-anhoi', 900, 130, (ctx) => {
    ctx.fillStyle = linear(ctx, 0, 30, 0, 110, [[0, '#d9cbb0'], [1, '#9c8e76']]);
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.quadraticCurveTo(450, 10, 900, 110);
    ctx.lineTo(900, 128);
    ctx.quadraticCurveTo(450, 40, 0, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i <= 18; i++) {
      const x = i * 50;
      const t = x / 900;
      const y = 110 - 4 * t * (1 - t) * 80;
      roundRect(ctx, x - 3, y - 26, 6, 26, 2);
      fillStroke(ctx, '#e8dcc0', INK, 1.5);
      if (i % 2) {
        ellipse(ctx, x, y - 34, 8, 10);
        fillStroke(ctx, LANTERN_COLORS[i % LANTERN_COLORS.length], INK, 1.5);
      }
    }
  });

  canvasTexture(scene, 'HoiAn-arrow', 48, 48, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(24, 4);
    ctx.lineTo(44, 40);
    ctx.lineTo(24, 30);
    ctx.lineTo(4, 40);
    ctx.closePath();
    fillStroke(ctx, '#ffd166', INK, 3);
  });
  const keyCap = (key, label, w) =>
    canvasTexture(scene, key, w, 46, (ctx) => {
      roundRect(ctx, 2, 6, w - 4, 38, 9);
      fillStroke(ctx, '#3a2a3f', INK, 2);
      roundRect(ctx, 4, 2, w - 8, 34, 8);
      fillStroke(ctx, '#ffffff', INK, 2.5);
      ctx.fillStyle = INK;
      ctx.font = 'bold 20px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, w / 2, 27);
    });
  keyCap('HoiAn-ekey', 'E', 46);
  keyCap('HoiAn-spacekey', 'Space', 92);

  // Viền tối ban đêm
  canvasTexture(scene, 'HoiAn-vignette', 1280, 720, (ctx, w, h) => {
    ctx.fillStyle = radial(ctx, w / 2, h / 2, h * 0.35, w * 0.72, [[0, 'rgba(10,5,30,0)'], [1, 'rgba(10,5,30,0.72)']]);
    ctx.fillRect(0, 0, w, h);
  });
}
