import Phaser from 'phaser';

/** Vẽ panel bo góc kiểu thẻ game (nền kem, viền đậm, bóng). Trả về Graphics. */
export function drawPanel(scene, x, y, w, h, opts = {}) {
  const { fill = 0xfff8ee, edge = 0x3a2a3f, radius = 28, header = null, alpha = 1, shadow = true } = opts;
  const g = scene.add.graphics();
  if (shadow) {
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(x - w / 2 + 6, y - h / 2 + 12, w, h, radius);
  }
  g.fillStyle(edge, alpha);
  g.fillRoundedRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, radius + 4);
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
  if (header) {
    g.fillStyle(header, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, 70, { tl: radius, tr: radius, bl: 0, br: 0 });
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(x - w / 2 + 16, y - h / 2 + 8, w - 32, 18, 9);
  }
  return g;
}

/** Màn tối mờ phủ toàn màn hình, chặn click xuyên xuống. */
export function dimOverlay(scene, alpha = 0.55) {
  const { width, height } = scene.scale;
  return scene.add
    .rectangle(width / 2, height / 2, width, height, 0x140c22, alpha)
    .setInteractive()
    .setScrollFactor(0);
}

/** Hàng sao 0–3 (sao vàng + sao rỗng). */
export function starRow(scene, x, y, filled, { size = 40, gap = 6, total = 3, emptyTint = 0x9a8aa9 } = {}) {
  const c = scene.add.container(x, y);
  const step = size + gap;
  for (let i = 0; i < total; i++) {
    const img = scene.add.image((i - (total - 1) / 2) * step, i === 1 && total === 3 ? -size * 0.15 : 0, i < filled ? 'star' : 'star-empty');
    img.setDisplaySize(size, size);
    if (i >= filled) img.setTint(emptyTint);
    c.add(img);
  }
  return c;
}

/** Bóng thoại trên đầu nhân vật, tự biến mất. */
export function speechBubble(scene, x, y, text, { duration = 1800, depth = 1000 } = {}) {
  const t = scene.add
    .text(0, 0, text, {
      fontFamily: '"Baloo 2", sans-serif',
      fontSize: '20px',
      fontStyle: '700',
      color: '#3a2a3f',
      padding: { x: 4, y: 2 },
      align: 'center',
      wordWrap: { width: 220 },
    })
    .setOrigin(0.5);
  const w = t.width + 28;
  const h = t.height + 16;
  const g = scene.add.graphics();
  g.fillStyle(0x3a2a3f, 1);
  g.fillRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 16);
  g.fillTriangle(-10, h / 2, 10, h / 2, 0, h / 2 + 16);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
  g.fillTriangle(-7, h / 2 - 2, 7, h / 2 - 2, 0, h / 2 + 11);
  const c = scene.add.container(x, y - h / 2 - 14, [g, t]).setDepth(depth).setScale(0);
  scene.tweens.add({ targets: c, scale: 1, duration: 220, ease: 'Back.Out' });
  scene.time.delayedCall(duration, () =>
    scene.tweens.add({ targets: c, scale: 0, alpha: 0, duration: 180, onComplete: () => c.destroy() }),
  );
  return c;
}

export const lerpColor = (a, b, t) => {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  return Phaser.Display.Color.GetColor(
    Math.round(ca.red + (cb.red - ca.red) * t),
    Math.round(ca.green + (cb.green - ca.green) * t),
    Math.round(ca.blue + (cb.blue - ca.blue) * t),
  );
};
