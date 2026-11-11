// Vẽ nhân vật chibi Chồng / Vợ bằng Canvas 2D → spritesheet nhiều frame + animation.
import { canvasSheet, roundRect, linear, radial, fillStroke, ellipse } from '../utils/canvas.js';
import { CHARACTERS } from '../config/keys.js';

export const FRAME_W = 96;
export const FRAME_H = 128;

const SKIN = '#ffd9bd';
const SKIN_SHADE = '#f2b994';
const OUTLINE = '#3a2a3f';

/**
 * Ảnh khuôn mặt thật (public/assets/images/characters). Nếu load được, đầu nhân vật
 * dùng ảnh cắt tròn thay cho đầu vẽ tay. cx, cy, r: vùng mặt cần cắt (pixel trong ảnh gốc).
 */
export const PHOTOS = {
  [CHARACTERS.HUSBAND]: { key: 'photo-husband', file: 'images/characters/boy.png', cx: 102, cy: 108, r: 92 },
  [CHARACTERS.WIFE]: { key: 'photo-wife', file: 'images/characters/girl.png', cx: 64, cy: 74, r: 60 },
};

export const LOOKS = {
  [CHARACTERS.HUSBAND]: {
    hair: '#2a2433',
    hairShine: '#4b4360',
    shirt: '#3d8bfd',
    shirtDark: '#2563c9',
    pattern: '#ffffff',
    bottom: '#e9d3a3',
    bottomDark: '#c9ac74',
    shoe: '#5b3a29',
    style: 'husband',
  },
  [CHARACTERS.WIFE]: {
    hair: '#6e3b24',
    hairShine: '#9a5a38',
    shirt: '#ff7eb3',
    shirtDark: '#e0558f',
    pattern: '#fff4f9',
    bottom: '#ff7eb3',
    bottomDark: '#e0558f',
    shoe: '#e86a5c',
    style: 'wife',
  },
};

const POSES = {
  idle0: { bob: 0 },
  idle1: { bob: 1.5, armL: 0.05, armR: -0.05 },
  walk0: { bob: 0, legL: 0.45, legR: -0.45, armL: -0.5, armR: 0.5 },
  walk1: { bob: -2.5, legL: 0.1, legR: -0.1, armL: -0.15, armR: 0.15 },
  walk2: { bob: 0, legL: -0.45, legR: 0.45, armL: 0.5, armR: -0.5 },
  walk3: { bob: -2.5, legL: -0.1, legR: 0.1, armL: 0.15, armR: -0.15 },
  jump: { bob: -4, legL: 0.6, legR: -0.25, armL: 2.4, armR: -2.4, mouth: 'open' },
  fall: { bob: -2, legL: -0.3, legR: 0.3, armL: 1.4, armR: -1.4, mouth: 'o' },
  cheer0: { bob: -3, armL: 2.6, armR: -2.6, eyes: 'happy', mouth: 'open' },
  cheer1: { bob: 0, armL: 2.2, armR: -2.2, eyes: 'happy', mouth: 'open' },
  sit: { bob: 6, legL: -1.3, legR: -1.3, armL: -0.6, armR: 0.6, sit: true },
  swim0: { swim: true, armL: 2.2, armR: -0.4 },
  swim1: { swim: true, armL: 0.4, armR: -2.2 },
  hurt: { bob: 0, armL: 0.9, armR: -0.9, eyes: 'closed', mouth: 'o' },
};

function limb(ctx, px, py, angle, w, len, color, tipColor, sleeve) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  roundRect(ctx, -w / 2, -2, w, len, w / 2);
  fillStroke(ctx, color, OUTLINE, 2.5);
  if (sleeve) {
    roundRect(ctx, -w / 2 - 1.5, -3, w + 3, 10, 4);
    fillStroke(ctx, sleeve, OUTLINE, 2.5);
  }
  ellipse(ctx, 0, len - 1, w / 2 + 1.5, w / 2 + 0.5);
  fillStroke(ctx, tipColor, OUTLINE, 2.5);
  ctx.restore();
}

function drawHairBack(ctx, look) {
  if (look.style !== 'wife' || look.photo) return;
  ctx.beginPath();
  ctx.moveTo(20, 46);
  ctx.bezierCurveTo(14, 70, 18, 92, 30, 96);
  ctx.lineTo(66, 96);
  ctx.bezierCurveTo(78, 92, 82, 70, 76, 46);
  ctx.bezierCurveTo(74, 18, 22, 18, 20, 46);
  ctx.closePath();
  fillStroke(ctx, linear(ctx, 0, 30, 0, 96, [[0, look.hair], [1, '#4f2918']]), OUTLINE, 2.5);
}

function drawBody(ctx, look, p) {
  if (look.style === 'husband') {
    // Quần short
    roundRect(ctx, 32, 90, 32, 15, 5);
    fillStroke(ctx, linear(ctx, 0, 90, 0, 105, [[0, look.bottom], [1, look.bottomDark]]), OUTLINE, 2.5);
    // Áo sơ mi hoa
    roundRect(ctx, 29, 67, 38, 29, 10);
    fillStroke(ctx, linear(ctx, 0, 67, 0, 96, [[0, look.shirt], [1, look.shirtDark]]), OUTLINE, 2.5);
    ctx.fillStyle = look.pattern;
    [[36, 76], [57, 74], [45, 87], [60, 88], [38, 91]].forEach(([x, y]) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(ctx, x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.6, 1.6);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#ffd166';
    [[36, 76], [57, 74], [45, 87], [60, 88], [38, 91]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 1.1, 1.1);
      ctx.fill();
    });
    // Cổ áo chữ V
    ctx.beginPath();
    ctx.moveTo(41, 67);
    ctx.lineTo(48, 76);
    ctx.lineTo(55, 67);
    ctx.closePath();
    fillStroke(ctx, SKIN, OUTLINE, 2);
  } else {
    // Váy xòe
    ctx.beginPath();
    ctx.moveTo(35, 84);
    ctx.lineTo(22, 108);
    ctx.quadraticCurveTo(48, 116, 74, 108);
    ctx.lineTo(61, 84);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 84, 0, 112, [[0, look.shirt], [1, look.shirtDark]]), OUTLINE, 2.5);
    ctx.fillStyle = look.pattern;
    [[32, 101], [42, 106], [54, 106], [64, 101], [48, 96], [38, 93], [58, 93]].forEach(([x, y]) => {
      ellipse(ctx, x, y, 1.8, 1.8);
      ctx.fill();
    });
    // Thân áo
    roundRect(ctx, 33, 67, 30, 22, 9);
    fillStroke(ctx, linear(ctx, 0, 67, 0, 89, [[0, look.shirt], [1, look.shirtDark]]), OUTLINE, 2.5);
    // Nơ eo
    ellipse(ctx, 48, 86, 4, 3);
    fillStroke(ctx, '#fff', OUTLINE, 2);
  }
}

function drawFace(ctx, p) {
  const eyes = p.eyes || 'open';
  ctx.lineCap = 'round';
  if (eyes === 'open') {
    [38, 58].forEach((x) => {
      ellipse(ctx, x, 51, 4.6, 6.2);
      ctx.fillStyle = linear(ctx, 0, 45, 0, 57, [[0, '#2b1f35'], [1, '#5b3d74']]);
      ctx.fill();
      ellipse(ctx, x + 1.5, 48.5, 1.9, 2.3);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ellipse(ctx, x - 1.5, 54, 0.9, 0.9);
      ctx.fill();
    });
  } else {
    ctx.strokeStyle = '#2b1f35';
    ctx.lineWidth = 2.6;
    [38, 58].forEach((x) => {
      ctx.beginPath();
      if (eyes === 'happy') ctx.arc(x, 53, 4.5, Math.PI * 1.1, Math.PI * 1.9);
      else {
        ctx.moveTo(x - 4.5, 51);
        ctx.lineTo(x + 4.5, 51);
      }
      ctx.stroke();
    });
  }
  // Má hồng
  ctx.fillStyle = 'rgba(255,120,140,0.45)';
  ellipse(ctx, 31, 59, 5, 3);
  ctx.fill();
  ellipse(ctx, 65, 59, 5, 3);
  ctx.fill();
  // Miệng
  ctx.strokeStyle = '#7a2f3b';
  ctx.lineWidth = 2.2;
  const mouth = p.mouth || 'smile';
  ctx.beginPath();
  if (mouth === 'smile') {
    ctx.arc(48, 58, 4, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (mouth === 'open') {
    ctx.moveTo(43, 59);
    ctx.quadraticCurveTo(48, 68, 53, 59);
    ctx.closePath();
    fillStroke(ctx, '#c2415a', '#7a2f3b', 2);
  } else {
    ellipse(ctx, 48, 62, 2.5, 3);
    fillStroke(ctx, '#c2415a', '#7a2f3b', 1.5);
  }
}

function drawHairFront(ctx, look) {
  if (look.style === 'husband') {
    ctx.beginPath();
    ctx.moveTo(19, 52);
    ctx.bezierCurveTo(14, 22, 36, 12, 52, 15);
    ctx.bezierCurveTo(70, 15, 82, 28, 77, 52);
    ctx.lineTo(72, 40);
    ctx.lineTo(66, 44);
    ctx.lineTo(62, 34);
    ctx.lineTo(54, 40);
    ctx.lineTo(48, 32);
    ctx.lineTo(40, 40);
    ctx.lineTo(34, 33);
    ctx.lineTo(28, 42);
    ctx.lineTo(24, 38);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 14, 0, 50, [[0, look.hairShine], [1, look.hair]]), OUTLINE, 2.5);
    // Kính râm đẩy lên đầu
    ctx.fillStyle = 'rgba(30,30,40,0.95)';
    roundRect(ctx, 30, 22, 14, 8, 3);
    ctx.fill();
    roundRect(ctx, 52, 22, 14, 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#1e1e28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(44, 25);
    ctx.lineTo(52, 25);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(32, 23, 4, 2);
    ctx.fillRect(54, 23, 4, 2);
  } else {
    // Tóc mái
    ctx.beginPath();
    ctx.moveTo(20, 54);
    ctx.bezierCurveTo(16, 26, 34, 18, 50, 18);
    ctx.bezierCurveTo(68, 18, 82, 28, 76, 54);
    ctx.bezierCurveTo(72, 42, 66, 36, 58, 34);
    ctx.quadraticCurveTo(46, 44, 30, 38);
    ctx.bezierCurveTo(26, 42, 22, 48, 20, 54);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 18, 0, 54, [[0, look.hairShine], [1, look.hair]]), OUTLINE, 2.5);
    // Mũ cói
    ellipse(ctx, 48, 24, 42, 9, -0.06);
    fillStroke(ctx, linear(ctx, 0, 15, 0, 33, [[0, '#ffe3a3'], [1, '#e6bb6a']]), OUTLINE, 2.5);
    ctx.beginPath();
    ctx.moveTo(28, 24);
    ctx.bezierCurveTo(28, 2, 68, 2, 68, 22);
    ctx.closePath();
    fillStroke(ctx, linear(ctx, 0, 4, 0, 24, [[0, '#ffefc4'], [1, '#f0c879']]), OUTLINE, 2.5);
    // Ruy băng + hoa
    ctx.beginPath();
    ctx.moveTo(28.5, 19);
    ctx.bezierCurveTo(40, 22, 56, 22, 67.5, 17);
    ctx.lineTo(67.8, 22);
    ctx.bezierCurveTo(56, 26, 40, 26, 28.3, 23.5);
    ctx.closePath();
    fillStroke(ctx, '#ff5d8f', OUTLINE, 2);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, 63 + Math.cos(a) * 3.6, 18 + Math.sin(a) * 3.6, 3, 3);
      fillStroke(ctx, '#fff', '#e0558f', 1.2);
    }
    ellipse(ctx, 63, 18, 2.2, 2.2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
  }
}

/** Đầu bằng ảnh thật: cắt tròn, viền đậm, má hồng nhẹ. */
function drawPhotoHead(ctx, look, p) {
  const { img, cx, cy, r } = look.photo;
  const hx = 48;
  const hy = 40;
  const hr = 33;
  roundRect(ctx, 43, 60, 10, 10, 3);
  fillStroke(ctx, SKIN_SHADE, OUTLINE, 2);
  // viền ngoài màu áo cho nổi bật
  ellipse(ctx, hx, hy, hr + 3, hr + 3);
  fillStroke(ctx, look.shirt, OUTLINE, 2.5);
  ctx.save();
  ellipse(ctx, hx, hy, hr, hr);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2, hx - hr, hy - hr, hr * 2, hr * 2);
  if (p.eyes === 'closed') {
    ctx.fillStyle = 'rgba(255,80,80,0.25)';
    ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
  }
  // ánh sáng nhẹ phía trên
  ctx.fillStyle = radial(ctx, hx - 10, hy - 16, 2, hr, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
  ctx.restore();
  ellipse(ctx, hx, hy, hr, hr);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (p.mouth === 'open' || p.eyes === 'happy') {
    // tim nhỏ khi vui
    ctx.save();
    ctx.translate(hx + hr - 2, hy - hr + 4);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-7, -2, -3, -8, 0, -3);
    ctx.bezierCurveTo(3, -8, 7, -2, 0, 4);
    fillStroke(ctx, '#ff5d8f', OUTLINE, 1.5);
    ctx.restore();
  }
}

function drawHead(ctx, look, p) {
  if (look.photo) return drawPhotoHead(ctx, look, p);
  // Cổ
  roundRect(ctx, 43, 60, 10, 10, 3);
  fillStroke(ctx, SKIN_SHADE, OUTLINE, 2);
  // Tai
  ellipse(ctx, 20, 52, 5, 6);
  fillStroke(ctx, SKIN, OUTLINE, 2.5);
  ellipse(ctx, 76, 52, 5, 6);
  fillStroke(ctx, SKIN, OUTLINE, 2.5);
  // Đầu
  ellipse(ctx, 48, 45, 28, 26);
  fillStroke(ctx, radial(ctx, 42, 38, 4, 34, [[0, '#fff0e3'], [0.6, SKIN], [1, SKIN_SHADE]]), OUTLINE, 2.5);
  drawFace(ctx, p);
  drawHairFront(ctx, look);
}

function drawChibi(ctx, look, p) {
  ctx.lineJoin = 'round';
  // Bóng đổ
  if (!p.swim) {
    ellipse(ctx, 48, 122, 22, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();
  }

  if (p.swim) {
    // Nửa người trên nhô khỏi mặt nước, nhìn từ trên xuống
    ctx.save();
    ctx.translate(0, 30);
    ellipse(ctx, 48, 86, 36, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
    limb(ctx, 30, 76, p.armL, 10, 24, SKIN, SKIN, null);
    limb(ctx, 66, 76, p.armR, 10, 24, SKIN, SKIN, null);
    drawHairBack(ctx, look);
    roundRect(ctx, 31, 68, 34, 18, 9);
    fillStroke(ctx, look.shirt, OUTLINE, 2.5);
    drawHead(ctx, look, { eyes: 'open', mouth: 'smile' });
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(10, 118);
    ctx.quadraticCurveTo(48, 108, 86, 118);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.stroke();
    return;
  }

  ctx.save();
  ctx.translate(0, p.bob || 0);
  drawHairBack(ctx, look);
  // Chân
  const legLen = p.sit ? 18 : 20;
  limb(ctx, 41, 100, p.legL || 0, 11, legLen, SKIN, look.shoe, null);
  limb(ctx, 55, 100, p.legR || 0, 11, legLen, SKIN, look.shoe, null);
  drawBody(ctx, look, p);
  // Tay
  limb(ctx, 31, 72, p.armL || 0.15, 10, 22, SKIN, SKIN, look.shirt);
  limb(ctx, 65, 72, p.armR || -0.15, 10, 22, SKIN, SKIN, look.shirt);
  drawHead(ctx, look, p);
  ctx.restore();
}

/** Tạo texture + animation cho cả 2 nhân vật. Gọi 1 lần trong PreloadScene. */
export function createCharacterTextures(scene) {
  Object.entries(LOOKS).forEach(([key, baseLook]) => {
    const ph = PHOTOS[key];
    const look = { ...baseLook };
    if (ph && scene.textures.exists(ph.key)) {
      const img = scene.textures.get(ph.key).getSourceImage();
      const r = Math.min(ph.r, ph.cx, ph.cy, img.width - ph.cx, img.height - ph.cy);
      look.photo = { img, cx: ph.cx, cy: ph.cy, r };
    }
    const frames = {};
    Object.entries(POSES).forEach(([name, pose]) => {
      frames[name] = (ctx) => drawChibi(ctx, look, pose);
    });
    canvasSheet(scene, key, FRAME_W, FRAME_H, frames);

    const anim = (suffix, names, frameRate, repeat = -1) => {
      const animKey = `${key}-${suffix}`;
      if (scene.anims.exists(animKey)) return;
      scene.anims.create({ key: animKey, frames: names.map((frame) => ({ key, frame })), frameRate, repeat });
    };
    anim('idle', ['idle0', 'idle1'], 3);
    anim('walk', ['walk0', 'walk1', 'walk2', 'walk3'], 10);
    anim('run', ['walk0', 'walk1', 'walk2', 'walk3'], 16);
    anim('jump', ['jump'], 1, 0);
    anim('fall', ['fall'], 1, 0);
    anim('cheer', ['cheer0', 'cheer1'], 5);
    anim('swim', ['swim0', 'swim1'], 4);
    anim('sit', ['sit'], 1, 0);
    anim('hurt', ['hurt'], 1, 0);
  });
}
