import Phaser from 'phaser';
import { BUTTON_THEMES, FONT } from './theme.js';
import { roundRect, linear, hex } from '../utils/canvas.js';

/** Texture 2 frame (up/down) cho nút — gradient thật bằng Canvas. */
function buttonTexture(scene, theme, t, width, height) {
  const key = `btn-${theme}-${width}x${height}`;
  if (scene.textures.exists(key)) return key;
  const pad = 6;
  const fw = width + pad * 2;
  const fh = height + pad * 2 + 6;
  const tex = scene.textures.createCanvas(key, fw * 2, fh);
  const ctx = tex.getContext();
  const r = height / 2;
  ['up', 'down'].forEach((name, i) => {
    const ox = i * fw + pad;
    const oy = pad;
    const dy = name === 'down' ? 4 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, ox, oy + 8, width, height, r);
    ctx.fill();
    ctx.fillStyle = hex(t.edge);
    roundRect(ctx, ox, oy + 6, width, height - 2, r);
    ctx.fill();
    roundRect(ctx, ox, oy + dy, width, height - 6, r - 2);
    ctx.fillStyle = linear(ctx, 0, oy + dy, 0, oy + dy + height - 6, [[0, hex(t.top)], [1, hex(t.bottom)]]);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = hex(t.edge);
    ctx.stroke();
    const hh = (height - 6) * 0.32;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    roundRect(ctx, ox + 14, oy + 6 + dy, width - 28, hh, hh / 2);
    ctx.fill();
    tex.add(name, 0, i * fw, 0, fw, fh);
  });
  tex.refresh();
  return key;
}

/**
 * Nút kiểu game: nền gradient bo tròn, viền đậm, bóng đổ, nảy khi hover/nhấn.
 * createButton(scene, x, y, label, onClick, { theme, width, height, fontSize, icon })
 */
export function createButton(scene, x, y, label, onClick, opts = {}) {
  const { theme = 'primary', width = 260, height = 66, fontSize = 30, icon = null, iconScale = 0.55 } = opts;
  const t = BUTTON_THEMES[theme] ?? BUTTON_THEMES.primary;
  const r = height / 2;

  const key = buttonTexture(scene, theme, t, width, height);
  const bg = scene.add.image(0, 3, key, 'up');
  const draw = (pressed) => {
    bg.setFrame(pressed ? 'down' : 'up');
    const dy = pressed ? 4 : 0;
    txt.y = -3 + dy;
    if (img) img.y = -3 + dy;
  };

  const txt = scene.add
    .text(0, -3, label, {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      fontStyle: '800',
      color: t.text,
      stroke: Phaser.Display.Color.IntegerToColor(t.edge).rgba,
      strokeThickness: t.text === '#ffffff' ? 5 : 0,
      padding: { x: 4, y: 4 },
    })
    .setOrigin(0.5);

  let img = null;
  if (icon) {
    img = scene.add.image(0, -3, icon).setScale(iconScale);
    const gap = 10;
    const total = img.displayWidth + gap + txt.width;
    img.x = -total / 2 + img.displayWidth / 2;
    txt.x = img.x + img.displayWidth / 2 + gap + txt.width / 2;
  }

  const container = scene.add.container(x, y, img ? [bg, img, txt] : [bg, txt]);
  container.setSize(width, height);
  container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
  if (container.input) container.input.cursor = 'pointer';
  draw(false);

  let enabled = true;
  container.on('pointerover', () => enabled && scene.tweens.add({ targets: container, scale: 1.06, duration: 120, ease: 'Back.Out' }));
  container.on('pointerout', () => {
    draw(false);
    scene.tweens.add({ targets: container, scale: 1, duration: 120 });
  });
  container.on('pointerdown', () => enabled && draw(true));
  container.on('pointerup', () => {
    if (!enabled) return;
    draw(false);
    onClick?.();
  });

  container.setLabel = (s) => txt.setText(s);
  container.setEnabled = (on) => {
    enabled = on;
    container.setAlpha(on ? 1 : 0.5);
  };
  return container;
}
