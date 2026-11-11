import Phaser from 'phaser';
import { FONT } from '../ui/theme.js';

/** Nổ hạt (tim, sao, tia sáng...) tại (x, y). */
export function burst(scene, x, y, { texture = 'spark', count = 16, tint = 0xffffff, speed = 220, scale = 0.6, life = 700, depth = 2000, gravity = 0 } = {}) {
  const em = scene.add.particles(x, y, texture, {
    speed: { min: speed * 0.4, max: speed },
    angle: { min: 0, max: 360 },
    scale: { start: scale, end: 0 },
    alpha: { start: 1, end: 0 },
    lifespan: life,
    gravityY: gravity,
    tint,
    emitting: false,
  });
  em.setDepth(depth);
  em.explode(count);
  scene.time.delayedCall(life + 100, () => em.destroy());
  return em;
}

/** Chữ bay lên rồi mờ (vd "+1", "Perfect!"). */
export function floatText(scene, x, y, text, { color = '#ffffff', size = 28, depth = 2000 } = {}) {
  const t = scene.add
    .text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '800', color, stroke: '#3a2a3f', strokeThickness: 6, padding: { x: 4, y: 4 } })
    .setOrigin(0.5)
    .setDepth(depth);
  scene.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  return t;
}

/** Vật phẩm nhấp nhô + xoay nhẹ cho đẹp. */
export function bob(scene, target, { dy = 6, duration = 900 } = {}) {
  return scene.tweens.add({ targets: target, y: target.y - dy, duration, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Phaser.Math.Between(0, 400) });
}

/** Mây trôi trên trời (parallax nhẹ). */
export function driftClouds(scene, { count = 5, yMin = 30, yMax = 220, depth = 0, scrollFactor = 0.1, alpha = 0.95, width = null } = {}) {
  const w = width ?? scene.scale.width;
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const c = scene.add
      .image(Phaser.Math.Between(0, w), Phaser.Math.Between(yMin, yMax), Phaser.Utils.Array.GetRandom(['cloud1', 'cloud2', 'cloud3']))
      .setScrollFactor(scrollFactor)
      .setDepth(depth)
      .setAlpha(alpha)
      .setScale(Phaser.Math.FloatBetween(0.5, 1));
    const speed = Phaser.Math.FloatBetween(8, 20); // px/giây
    const loop = () =>
      scene.tweens.add({ targets: c, x: { from: -200, to: w + 200 }, duration: ((w + 400) / speed) * 1000, repeat: -1 });
    scene.tweens.add({ targets: c, x: w + 200, duration: ((w + 200 - c.x) / speed) * 1000, onComplete: loop });
    clouds.push(c);
  }
  return clouds;
}
