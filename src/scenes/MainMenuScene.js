import Phaser from 'phaser';
import { SCENES, CHARACTERS } from '../config/keys.js';
import { SaveSystem, LEVELS } from '../systems/SaveSystem.js';
import { createButton } from '../ui/Button.js';
import { titleStyle, textStyle } from '../ui/theme.js';
import { canvasTexture, skyTexture, ridgeTexture, linear, radial, ellipse } from '../utils/canvas.js';
import { driftClouds } from '../utils/fx.js';

/** Màn hình chính: bãi biển hoàng hôn, 2 vợ chồng nắm tay, tim bay. */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MAIN_MENU);
  }

  create() {
    const { width: W, height: H } = this.scale;
    const horizon = 430;
    this.cameras.main.fadeIn(500, 20, 12, 34);

    // Trời hoàng hôn
    skyTexture(this, 'menu-sky', W, H, [[0, '#6a5acd'], [0.35, '#ff8fa3'], [0.6, '#ffc49b'], [1, '#ffe8b8']]);
    this.add.image(W / 2, H / 2, 'menu-sky');

    // Mặt trời
    canvasTexture(this, 'menu-sun', 220, 220, (ctx) => {
      ellipse(ctx, 110, 110, 100, 100);
      ctx.fillStyle = radial(ctx, 110, 110, 10, 100, [[0, '#fffbe0'], [0.6, '#ffd36e'], [1, '#ff9f5a']]);
      ctx.fill();
    });
    this.add.image(880, horizon - 10, 'glow-warm').setScale(7).setAlpha(0.55);
    const sun = this.add.image(880, horizon + 20, 'menu-sun');
    this.tweens.add({ targets: sun, y: horizon + 10, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    driftClouds(this, { count: 6, yMin: 40, yMax: 260, scrollFactor: 0 });

    // Đảo xa
    ridgeTexture(this, 'menu-islands', W, 120, { base: 0.75, amp: 0.4, bumps: 3, color: '#8a6aa8', top: '#b48cc4', seed: 7 });
    this.add.image(W / 2, horizon - 60 + 2, 'menu-islands').setAlpha(0.9);

    // Biển
    canvasTexture(this, 'menu-sea', W, H - horizon, (ctx, w, h) => {
      ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#ffb28a'], [0.08, '#7fd3e0'], [0.5, '#3aa6c9'], [1, '#1f6fa3']]);
      ctx.fillRect(0, 0, w, h);
      // vệt nắng phản chiếu
      ctx.fillStyle = 'rgba(255,240,200,0.55)';
      for (let i = 0; i < 26; i++) {
        const y = 6 + i * 9 + i * i * 0.4;
        const half = 60 - i * 1.6 + Math.random() * 30;
        ctx.fillRect(880 - half, y, half * 2, 2 + i * 0.1);
      }
    });
    this.add.image(W / 2, horizon, 'menu-sea').setOrigin(0.5, 0);

    // Lấp lánh trên mặt nước
    this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: W },
      y: { min: horizon + 10, max: H - 120 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1200,
      frequency: 60,
      blendMode: 'ADD',
    });

    // Bãi cát
    canvasTexture(this, 'menu-sand', W, 260, (ctx, w, h) => {
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.bezierCurveTo(w * 0.3, 20, w * 0.6, 110, w, 60);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = linear(ctx, 0, 30, 0, h, [[0, '#fff1c9'], [1, '#f2c98a']]);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.bezierCurveTo(w * 0.3, 20, w * 0.6, 110, w, 60);
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,150,90,0.35)';
      for (let i = 0; i < 120; i++) {
        ellipse(ctx, Math.random() * w, 90 + Math.random() * (h - 90), 2, 1.2);
        ctx.fill();
      }
    });
    const sand = this.add.image(W / 2, H - 130, 'menu-sand');
    this.tweens.add({ targets: sand, y: sand.y + 3, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Cây dừa
    this.add.image(90, H - 140, 'palm').setScale(1.5).setOrigin(0.5, 1).setAngle(-6);
    this.add.image(1210, H - 120, 'palm').setScale(1.25).setOrigin(0.5, 1).setFlipX(true).setAngle(8);

    // Hai vợ chồng
    const husband = this.add.sprite(530, H - 60, CHARACTERS.HUSBAND).setScale(1.35).setOrigin(0.5, 1).play('husband-idle');
    const wife = this.add.sprite(640, H - 60, CHARACTERS.WIFE).setScale(1.35).setOrigin(0.5, 1).setFlipX(true).play('wife-idle');
    this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        const who = Phaser.Utils.Array.GetRandom([husband, wife]);
        who.play(`${who.texture.key}-cheer`);
        this.time.delayedCall(1200, () => who.play(`${who.texture.key}-idle`));
      },
    });
    this.add.particles(585, H - 210, 'heart', {
      speedY: { min: -70, max: -40 },
      speedX: { min: -25, max: 25 },
      scale: { start: 0.55, end: 0.15 },
      alpha: { start: 1, end: 0 },
      lifespan: 2200,
      frequency: 650,
    });

    // Tiêu đề
    const t1 = this.add.text(W / 2, 92, 'Du Lịch', titleStyle(96, '#ffffff')).setOrigin(0.5);
    const t2 = this.add.text(W / 2, 186, 'Cùng Khủng Long ♥', titleStyle(76, '#ffd166', '#b83266')).setOrigin(0.5);
    [t1, t2].forEach((t, i) => {
      t.setScale(0);
      this.tweens.add({ targets: t, scale: 1, duration: 600, delay: 200 + i * 180, ease: 'Back.Out' });
      this.tweens.add({ targets: t, y: t.y - 8, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 900 + i * 400 });
    });

    // Nút
    const hasChar = !!SaveSystem.get('character');
    const bx = 1030;
    createButton(this, bx, 300, hasChar ? 'Chơi tiếp' : 'Bắt đầu', () => this.go(hasChar ? SCENES.TRAVEL_MAP : SCENES.CHARACTER_SELECT), { theme: 'primary', width: 300, height: 72, fontSize: 34 });
    createButton(this, bx, 388, 'Chọn nhân vật', () => this.go(SCENES.CHARACTER_SELECT), { theme: 'sea', width: 300 });
    createButton(this, bx, 468, 'Album kỷ niệm', () => this.go(SCENES.ALBUM), { theme: 'sun', width: 300, icon: 'icon-camera', iconScale: 0.55 });

    // Tiến trình
    const stars = SaveSystem.totalStars();
    const g = this.add.graphics();
    g.fillStyle(0x3a2a3f, 0.45).fillRoundedRect(20, 20, 200, 48, 24);
    this.add.image(50, 44, 'star').setDisplaySize(34, 34);
    this.add.text(76, 44, `${stars} / ${LEVELS.length * 3}`, textStyle(24, '#ffffff', { fontStyle: '800' })).setOrigin(0, 0.5);
  }

  go(scene) {
    this.cameras.main.fadeOut(300, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene));
  }
}
