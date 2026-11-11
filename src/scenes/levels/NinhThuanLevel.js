import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createNinhThuanTextures } from '../../art/levels/NinhThuanArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';
import { lerpColor } from '../../ui/Panel.js';
import { FONT } from '../../ui/theme.js';
import { canvasTexture, roundRect, linear, fillStroke, ellipse } from '../../utils/canvas.js';

// Ninh Thuận — Lái jeep vượt đồi cát Nam Cương tới điểm ngắm hoàng hôn. Xem CHALLENGES.md mục 5.
const WORLD_W = 4200;
const WORLD_H = 2800;
const START = { x: 320, y: 2560 };
const GOAL = { x: 3920, y: 330 };
const GRAPES = [
  { x: 1100, y: 2050 },
  { x: 2250, y: 1180 },
  { x: 3350, y: 1950 },
];
const WIND_ZONE = new Phaser.Geom.Rectangle(1500, 850, 1400, 1250);
const STORM = { x: 3250, y: 820, r: 520 };
const JEEP_R = 34;
const MAX_SPEED = 300;
const BOOST_SPEED = 470;

export class NinhThuanLevel extends BaseLevel {
  constructor() {
    super('NinhThuan');
  }

  buildLevel() {
    createNinhThuanTextures(this);
    this.makeExtraTextures();
    const { width: W, height: H } = this.scale;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    this.loseReason = 'Mặt trời lặn mất rồi!';

    // --- Mặt đất ---
    this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'NinhThuan-sand').setDepth(-100);
    const rnd = new Phaser.Math.RandomDataGenerator(['ninhthuan']);
    for (let i = 0; i < 70; i++) {
      this.add
        .image(rnd.between(0, WORLD_W), rnd.between(0, WORLD_H), 'NinhThuan-dune')
        .setScale(rnd.realInRange(0.8, 2.2), rnd.realInRange(0.7, 1.6))
        .setAngle(rnd.between(-20, 20))
        .setDepth(-90)
        .setAlpha(0.9);
    }
    // Vết bánh xe cũ
    const tracks = this.add.graphics().setDepth(-85);
    tracks.lineStyle(5, 0xc98a4a, 0.25);
    const trackCurve = new Phaser.Curves.Spline([START.x, START.y, 1100, 2150, 1800, 1700, 2600, 1300, 3300, 900, GOAL.x, GOAL.y]);
    trackCurve.draw(tracks, 120);
    tracks.lineStyle(5, 0xc98a4a, 0.18);
    const t2 = new Phaser.Curves.Spline([START.x + 30, START.y, 1130, 2150, 1830, 1700, 2630, 1300, 3330, 900, GOAL.x + 30, GOAL.y]);
    t2.draw(tracks, 120);

    // --- Vườn nho + nho ---
    this.grapes = GRAPES.map((p) => {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          const vx = p.x - 240 + c * 300 + (r % 2) * 20;
          const vy = p.y - 120 + r * 70;
          this.add.image(vx, vy, 'NinhThuan-vine').setDepth(vy);
        }
      }
      const glow = this.add.image(p.x, p.y, 'glow').setScale(1.4).setAlpha(0.6).setDepth(p.y - 1).setTint(0xd7a6ff);
      this.tweens.add({ targets: glow, scale: 1.8, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      const img = this.add.image(p.x, p.y, 'NinhThuan-grape').setDepth(p.y + 40);
      bob(this, img);
      return { ...p, img, glow, taken: false, warned: false };
    });

    // --- Cánh đồng điện gió ---
    const zone = this.add.graphics().setDepth(-80);
    zone.fillStyle(0xffffff, 0.08).fillRoundedRect(WIND_ZONE.x, WIND_ZONE.y, WIND_ZONE.width, WIND_ZONE.height, 80);
    this.windmills = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = WIND_ZONE.x + 170 + c * 360 + (r % 2) * 150;
        const y = WIND_ZONE.y + 220 + r * 420;
        this.add.image(x, y + 6, 'shadow').setScale(1.4, 1).setDepth(y - 2);
        this.add.image(x, y, 'NinhThuan-tower').setOrigin(0.5, 1).setDepth(y);
        const bl = this.add.image(x, y - 248, 'NinhThuan-blades').setDepth(y + 1).setScale(0.9);
        this.tweens.add({ targets: bl, angle: 360, duration: rnd.between(2600, 4200), repeat: -1 });
        this.windmills.push({ x, y, r: 22 });
      }
    }
    this.add
      .text(WIND_ZONE.centerX, WIND_ZONE.y - 40, '⚡ Cánh đồng điện gió — Gió mạnh!', { fontFamily: FONT, fontSize: '28px', fontStyle: '800', color: '#ffffff', stroke: '#b7741a', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(5000);

    // --- Vách cát dựng đứng (không vượt qua được) ---
    this.cliffs = [
      new Phaser.Geom.Rectangle(600, 1500, 520, 110),
      new Phaser.Geom.Rectangle(2350, 2150, 600, 110),
      new Phaser.Geom.Rectangle(3000, 1350, 120, 520),
      new Phaser.Geom.Rectangle(1150, 600, 650, 110),
      new Phaser.Geom.Rectangle(3500, 1200, 520, 110),
    ];
    this.cliffs.forEach((rc, i) => {
      const key = `NinhThuan-cliff-${i}`;
      canvasTexture(this, key, rc.width + 20, rc.height + 40, (ctx, w, h) => {
        roundRect(ctx, 10, 30, w - 20, h - 40, 30);
        ctx.fillStyle = 'rgba(120,70,20,0.35)';
        ctx.fill();
        roundRect(ctx, 10, 6, w - 20, h - 40, 30);
        fillStroke(ctx, linear(ctx, 0, 6, 0, h - 34, [[0, '#ffe3a6'], [0.45, '#f0b964'], [1, '#c9873e']]), '#8a5524', 3);
        ctx.strokeStyle = 'rgba(138,85,36,0.5)';
        ctx.lineWidth = 2;
        for (let k = 0; k < (w + h) / 40; k++) {
          const x = 30 + ((k * 53) % (w - 60));
          ctx.beginPath();
          ctx.moveTo(x, 14);
          ctx.lineTo(x + 8, h - 40);
          ctx.stroke();
        }
      });
      this.add.image(rc.centerX, rc.centerY + 10, key).setDepth(rc.bottom);
    });

    // --- Xương rồng ---
    this.cacti = [];
    let tries = 0;
    while (this.cacti.length < 55 && tries++ < 2000) {
      const x = rnd.between(150, WORLD_W - 150);
      const y = rnd.between(150, WORLD_H - 150);
      const near = (p, d) => Phaser.Math.Distance.Between(x, y, p.x, p.y) < d;
      if (near(START, 260) || near(GOAL, 280) || GRAPES.some((g) => near(g, 260)) || this.windmills.some((m) => near(m, 90))) continue;
      if (this.cliffs.some((rc) => Phaser.Geom.Rectangle.Contains(Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(rc), 60, 60), x, y))) continue;
      if (this.cacti.some((c) => near(c, 120))) continue;
      const img = this.add.image(x, y, 'NinhThuan-cactus').setOrigin(0.5, 0.92).setDepth(y).setScale(rnd.realInRange(0.85, 1.2));
      this.cacti.push({ x, y, r: 24, img });
    }

    // --- Đàn cừu ---
    this.herds = [
      { cx: 1150, cy: 1650, ax: 380, ay: 60, speed: 0.25, phase: 0 },
      { cx: 2700, cy: 600, ax: 300, ay: 120, speed: 0.3, phase: 2 },
      { cx: 3600, cy: 2350, ax: 260, ay: 80, speed: 0.35, phase: 4 },
    ].map((h) => ({
      ...h,
      sheep: Array.from({ length: 6 }, (_, i) => {
        const img = this.add.image(h.cx, h.cy, 'NinhThuan-sheep').setScale(1.1);
        return { img, ox: (i % 3) * 52 - 52, oy: Math.floor(i / 3) * 40 - 20, r: 22, x: h.cx, y: h.cy, scare: 0 };
      }),
    }));

    // --- Cỏ lăn ---
    this.tumbleweeds = Array.from({ length: 7 }, (_, i) => {
      const y = 400 + i * 330;
      const img = this.add.image(-100, y, 'NinhThuan-tumble').setDepth(y);
      return { img, x: rnd.between(0, WORLD_W), y, vx: rnd.between(170, 260) * (i % 2 ? -1 : 1), r: 26 };
    });

    // --- Jeep khác chạy tuần tra ---
    this.bots = [
      { path: [[700, 900], [1400, 1200], [900, 1900], [500, 1300]] },
      { path: [[2000, 2500], [3100, 2500], [3800, 1700], [2700, 1800]] },
      { path: [[2600, 300], [3600, 450], [3700, 900], [2500, 700]] },
    ].map((b, i) => {
      const img = this.add.image(b.path[0][0], b.path[0][1], 'NinhThuan-jeep2').setScale(0.9);
      return { ...b, img, x: b.path[0][0], y: b.path[0][1], target: 1, speed: 170 + i * 20, r: 34, cooldown: 0 };
    });

    // --- Điểm ngắm hoàng hôn ---
    this.add.image(GOAL.x, GOAL.y - 30, 'glow-warm').setScale(5).setAlpha(0.7).setDepth(GOAL.y - 10);
    const vp = this.add.image(GOAL.x, GOAL.y, 'NinhThuan-viewpoint').setOrigin(0.5, 0.85).setDepth(GOAL.y);
    this.tweens.add({ targets: vp, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add
      .text(GOAL.x, GOAL.y - 170, '🌅 Điểm ngắm hoàng hôn', { fontFamily: FONT, fontSize: '26px', fontStyle: '800', color: '#ffffff', stroke: '#e0558f', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(5000);

    // --- Xe jeep của 2 vợ chồng ---
    this.pos = new Phaser.Math.Vector2(START.x, START.y);
    this.heading = Phaser.Math.Angle.Between(START.x, START.y, GOAL.x, GOAL.y) + Math.PI / 2;
    this.speed = 0;
    this.knock = new Phaser.Math.Vector2();
    this.boost = 100;
    this.jeepShadow = this.add.image(0, 0, 'shadow').setScale(2, 1.6);
    this.jeep = this.add.image(0, 0, 'NinhThuan-jeep');
    this.player = new Player(this, 0, 0, this.characterKey, { mode: 'none', physics: false, scale: 0.4 });
    this.player.setOrigin(0.5, 0.85).playAnim('sit');
    this.companion = new Companion(this, 0, 0, this.characterKey, { scale: 0.4 });
    this.companion.setOrigin(0.5, 0.85).playAnim('sit');
    this.arrow = this.add.graphics().setDepth(6000);
    this.dust = this.add.particles(0, 0, 'spark', {
      speed: { min: 10, max: 50 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.55, end: 0 },
      tint: 0xe8c48a,
      lifespan: 700,
      emitting: false,
    });
    this.dustAcc = 0;
    this.placeJeep();
    cam.centerOn(this.pos.x, this.pos.y);

    // --- Hiệu ứng màn hình: gió, bão cát, hoàng hôn ---
    this.windFx = this.add
      .particles(0, 0, 'NinhThuan-streak', {
        x: { min: -200, max: W },
        y: { min: -50, max: H },
        speedX: { min: 500, max: 800 },
        speedY: { min: 120, max: 220 },
        rotate: 15,
        alpha: { start: 0.8, end: 0 },
        lifespan: 1200,
        frequency: 40,
      })
      .setScrollFactor(0)
      .setDepth(7000);
    this.windFx.setVisible(false);
    this.stormOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xe0b36e, 0).setScrollFactor(0).setDepth(7100);
    this.stormFx = this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: W + 100 },
        y: { min: 0, max: H },
        speedX: { min: -700, max: -400 },
        speedY: { min: -60, max: 60 },
        scale: { start: 0.6, end: 0.2 },
        tint: [0xf3cf8a, 0xc98a4a, 0xffffff],
        lifespan: 1600,
        frequency: 12,
      })
      .setScrollFactor(0)
      .setDepth(7150);
    this.stormFx.setVisible(false);
    this.sunset = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1).setScrollFactor(0).setDepth(7200).setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.cactusHits = 0;
    this.otherHits = 0;
    this.grapesTaken = 0;
    this.navTimer = 2;
    this.windWarned = false;
    this.stormWarned = false;
    this.windStrength = 0;
  }

  makeExtraTextures() {
    // Cỏ lăn
    canvasTexture(this, 'NinhThuan-tumble', 60, 60, (ctx) => {
      ellipse(ctx, 30, 30, 26, 26);
      ctx.fillStyle = 'rgba(160,110,50,0.35)';
      ctx.fill();
      ctx.strokeStyle = '#9a6a32';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(30 + Math.cos(a) * 8, 30 + Math.sin(a) * 8, 16, a, a + 2.4);
        ctx.stroke();
      }
      ellipse(ctx, 30, 30, 26, 26);
      ctx.strokeStyle = '#3a2a3f';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    // Jeep du khách khác (màu xanh)
    if (!this.textures.exists('NinhThuan-jeep2')) {
      const src = this.textures.get('NinhThuan-jeep').getSourceImage();
      canvasTexture(this, 'NinhThuan-jeep2', src.width, src.height, (ctx) => {
        ctx.drawImage(src, 0, 0);
        ctx.globalCompositeOperation = 'hue';
        ctx.fillStyle = '#2ec4d6';
        ctx.fillRect(0, 0, src.width, src.height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(src, 0, 0);
      });
    }
  }

  placeJeep() {
    const { x, y } = this.pos;
    this.jeep.setPosition(x, y).setRotation(this.heading).setDepth(y + 10);
    this.jeepShadow.setPosition(x + 6, y + 14).setRotation(this.heading).setDepth(y + 9);
    const at = (lx, ly) => {
      const c = Math.cos(this.heading);
      const s = Math.sin(this.heading);
      return [x + lx * c - ly * s, y + lx * s + ly * c];
    };
    const [px, py] = at(-14, 8);
    const [cx, cy] = at(14, 8);
    this.player.setPosition(px, py).setDepth(y + 11);
    this.companion.setPosition(cx, cy).setDepth(y + 11);
  }

  onPlayStart() {
    this.companion.say('Em cầm bản đồ, mình đi thôi!'.replace('Em', this.companion.key === 'wife' ? 'Em' : 'Anh'), { force: true });
  }

  hitFeedback(text, color = '#ff9b9b') {
    this.jeep.setTint(0xff8080);
    this.time.delayedCall(250, () => this.jeep.clearTint());
    this.cameras.main.shake(180, 0.008);
    floatText(this, this.pos.x, this.pos.y - 70, text, { color, size: 24, depth: 6500 });
  }

  /** Đẩy jeep ra khỏi vật tròn, nảy lại. Trả về true nếu va chạm. */
  collideCircle(ox, oy, r, push = 1) {
    const dx = this.pos.x - ox;
    const dy = this.pos.y - oy;
    const d = Math.hypot(dx, dy);
    const min = r + JEEP_R;
    if (d >= min || d === 0) return false;
    const nx = dx / d;
    const ny = dy / d;
    this.pos.x = ox + nx * min;
    this.pos.y = oy + ny * min;
    this.knock.set(nx * 260 * push, ny * 260 * push);
    this.speed *= -0.35;
    return true;
  }

  updateLevel(dt) {
    const input = this.inputManager;
    const t = this.elapsed;

    // --- Lái ---
    const boosting = input.isDown('action') && this.boost > 0 && input.up;
    if (boosting) this.boost = Math.max(0, this.boost - 32 * dt);
    else this.boost = Math.min(100, this.boost + 7 * dt);
    const maxS = boosting ? BOOST_SPEED : MAX_SPEED;
    if (input.up) this.speed = Math.min(maxS, this.speed + (boosting ? 520 : 300) * dt);
    else if (input.down) this.speed = Math.max(-140, this.speed - 380 * dt);
    else this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 200 * dt);
    if (this.speed > maxS) this.speed -= 300 * dt;
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.heading += steer * 2.6 * dt * Phaser.Math.Clamp(this.speed / 160, -1, 1);

    const fwd = new Phaser.Math.Vector2(Math.sin(this.heading), -Math.cos(this.heading));
    this.pos.x += fwd.x * this.speed * dt + this.knock.x * dt;
    this.pos.y += fwd.y * this.speed * dt + this.knock.y * dt;
    this.knock.scale(Math.pow(0.02, dt));

    // --- Gió ---
    const inWind = WIND_ZONE.contains(this.pos.x, this.pos.y);
    this.windStrength = Phaser.Math.Linear(this.windStrength, inWind ? 1 : 0, dt * 2);
    if (this.windStrength > 0.02) {
      const gust = 120 + 90 * Math.sin(t * 1.7) + 40 * Math.sin(t * 4.3);
      this.pos.x += 0.97 * gust * this.windStrength * dt;
      this.pos.y += 0.25 * gust * this.windStrength * dt;
    }
    this.windFx.setVisible(this.windStrength > 0.2);
    if (inWind && !this.windWarned) {
      this.windWarned = true;
      this.toast('💨 Gió mạnh đẩy xe sang phải!', '#ffffff');
      this.companion.say('Gió mạnh quá, giữ chặt tay lái!', { force: true });
    }

    // --- Bão cát ---
    const sd = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, STORM.x, STORM.y);
    const storm = Phaser.Math.Clamp(1 - (sd - STORM.r * 0.4) / (STORM.r * 0.8), 0, 1);
    this.stormOverlay.setAlpha(storm * 0.72);
    this.stormFx.setVisible(storm > 0.05);
    if (storm > 0.3) {
      this.pos.x += Math.sin(t * 3.1) * 70 * storm * dt;
      this.pos.y += Math.cos(t * 2.3) * 70 * storm * dt;
      if (!this.stormWarned) {
        this.stormWarned = true;
        this.toast('🌪️ Bão cát! Không thấy đường!', '#ffe39a');
        this.companion.say('Bão cát! Đi chậm theo mũi tên nhé!', { force: true });
      }
    }

    // --- Va chạm ---
    this.pos.x = Phaser.Math.Clamp(this.pos.x, 40, WORLD_W - 40);
    this.pos.y = Phaser.Math.Clamp(this.pos.y, 40, WORLD_H - 40);
    this.cacti.forEach((c) => {
      if (this.collideCircle(c.x, c.y, c.r)) {
        if (this.time.now - (c.hitAt ?? -9999) > 800) {
          c.hitAt = this.time.now;
          this.cactusHits++;
          this.hitFeedback('Ái! Xương rồng!');
          burst(this, c.x, c.y - 30, { count: 10, tint: 0x5fc36a, scale: 0.45, depth: 6500 });
          this.tweens.add({ targets: c.img, angle: { from: -12, to: 0 }, duration: 400, ease: 'Elastic.Out' });
        }
      }
    });
    this.windmills.forEach((m) => this.collideCircle(m.x, m.y, m.r));
    this.cliffs.forEach((rc) => {
      const cx = Phaser.Math.Clamp(this.pos.x, rc.left, rc.right);
      const cy = Phaser.Math.Clamp(this.pos.y, rc.top, rc.bottom);
      if (Phaser.Math.Distance.Between(this.pos.x, this.pos.y, cx, cy) < JEEP_R) {
        this.collideCircle(cx, cy, 0, 1.3);
        if (this.time.now - (rc.hitAt ?? -9999) > 900) {
          rc.hitAt = this.time.now;
          this.otherHits++;
          this.hitFeedback('Vách cát dốc quá!', '#ffe39a');
          burst(this, cx, cy, { count: 14, tint: 0xf0b964, scale: 0.6, speed: 180, depth: 6500 });
        }
      }
    });

    // Cừu
    this.herds.forEach((h) => {
      h.phase += dt * h.speed;
      const hx = h.cx + Math.cos(h.phase) * h.ax;
      const hy = h.cy + Math.sin(h.phase * 2) * h.ay;
      const dir = -Math.sin(h.phase);
      h.sheep.forEach((s, i) => {
        s.scare = Math.max(0, s.scare - dt);
        const tx = hx + s.ox + Math.sin(t * 2 + i) * 6;
        const ty = hy + s.oy;
        if (s.scare <= 0) {
          s.x = Phaser.Math.Linear(s.x, tx, 0.08);
          s.y = Phaser.Math.Linear(s.y, ty, 0.08);
        }
        s.img.setPosition(s.x, s.y + Math.abs(Math.sin(t * 8 + i)) * -3).setDepth(s.y).setFlipX(dir < 0);
        if (this.collideCircle(s.x, s.y, s.r, 0.8) && s.scare <= 0) {
          s.scare = 1.2;
          this.otherHits++;
          this.hitFeedback('Beee! Đụng cừu!', '#ffffff');
          const ang = Phaser.Math.Angle.Between(this.pos.x, this.pos.y, s.x, s.y);
          this.tweens.add({ targets: s, x: s.x + Math.cos(ang) * 120, y: s.y + Math.sin(ang) * 120, duration: 500, ease: 'Cubic.Out' });
        }
      });
    });

    // Cỏ lăn
    this.tumbleweeds.forEach((tw) => {
      tw.x += tw.vx * dt;
      if (tw.x > WORLD_W + 100) tw.x = -100;
      if (tw.x < -100) tw.x = WORLD_W + 100;
      const yy = tw.y + Math.abs(Math.sin(t * 5 + tw.y)) * -24;
      tw.img.setPosition(tw.x, yy).setRotation(tw.img.rotation + (tw.vx / 26) * dt).setDepth(tw.y);
      if (Math.abs(tw.x - this.pos.x) < 50 && Math.abs(tw.y - this.pos.y) < 50 && this.time.now - (tw.hitAt ?? -9999) > 1000) {
        tw.hitAt = this.time.now;
        this.otherHits++;
        this.speed *= 0.4;
        this.knock.set(Math.sign(tw.vx) * 220, 0);
        this.hitFeedback('Bụi cỏ lăn!', '#ffe39a');
        burst(this, tw.x, tw.y, { count: 10, tint: 0x9a6a32, scale: 0.4, depth: 6500 });
      }
    });

    // Jeep khác
    this.bots.forEach((b) => {
      const [tx, ty] = b.path[b.target];
      const ang = Phaser.Math.Angle.Between(b.x, b.y, tx, ty);
      b.x += Math.cos(ang) * b.speed * dt;
      b.y += Math.sin(ang) * b.speed * dt;
      if (Phaser.Math.Distance.Between(b.x, b.y, tx, ty) < 20) b.target = (b.target + 1) % b.path.length;
      b.img.setPosition(b.x, b.y).setRotation(ang + Math.PI / 2).setDepth(b.y + 10);
      b.cooldown = Math.max(0, b.cooldown - dt);
      if (this.collideCircle(b.x, b.y, b.r, 1.4) && b.cooldown <= 0) {
        b.cooldown = 1.2;
        this.otherHits++;
        this.hitFeedback('Rầm! Đụng xe khác!');
        burst(this, (b.x + this.pos.x) / 2, (b.y + this.pos.y) / 2, { count: 16, tint: 0xffd166, scale: 0.5, depth: 6500 });
      }
    });

    // --- Hái nho ---
    this.grapes.forEach((g) => {
      if (g.taken) return;
      const d = Phaser.Math.Distance.Between(this.pos.x, this.pos.y, g.x, g.y);
      if (d < 85) {
        if (Math.abs(this.speed) < 110) {
          g.taken = true;
          this.grapesTaken++;
          burst(this, g.x, g.y, { texture: 'heart', count: 10, scale: 0.5, depth: 6500 });
          floatText(this, g.x, g.y - 40, `+1 chùm nho (${this.grapesTaken}/3)`, { color: '#d7a6ff', depth: 6500 });
          this.tweens.add({ targets: [g.img, g.glow], scale: 0, alpha: 0, duration: 300 });
          this.companion.say('Nho ngọt quá!', { force: true });
        } else if (!g.warned) {
          g.warned = true;
          this.companion.say('Chậm lại để hái nho!', { force: true });
        }
      }
    });

    // --- Hoa tiêu ---
    const goalAng = Phaser.Math.Angle.Between(this.pos.x, this.pos.y, GOAL.x, GOAL.y);
    this.navTimer -= dt;
    if (this.navTimer <= 0) {
      this.navTimer = 4;
      const diff = Phaser.Math.Angle.Wrap(goalAng + Math.PI / 2 - this.heading);
      if (Math.abs(diff) > 0.5) this.companion.say(diff < 0 ? 'Rẽ trái!' : 'Rẽ phải!', { duration: 1200 });
      else if (Math.random() < 0.4) this.companion.say('Thẳng tiến!', { duration: 1200 });
    }

    // Bụi bánh xe
    if (Math.abs(this.speed) > 60) {
      this.dustAcc += dt * (boosting ? 60 : 25);
      while (this.dustAcc > 1) {
        this.dustAcc -= 1;
        this.dust.emitParticleAt(this.pos.x - fwd.x * 50 + Phaser.Math.Between(-14, 14), this.pos.y - fwd.y * 50, 1);
      }
    }
    this.dust.setDepth(this.pos.y + 5);

    this.placeJeep();
    this.cameras.main.centerOn(Phaser.Math.Linear(this.cameras.main.midPoint.x, this.pos.x + fwd.x * 80, 0.12), Phaser.Math.Linear(this.cameras.main.midPoint.y, this.pos.y + fwd.y * 80, 0.12));

    // Mũi tên chỉ đích
    const ax = this.pos.x + Math.cos(goalAng) * 95;
    const ay = this.pos.y + Math.sin(goalAng) * 95;
    this.arrow.clear();
    const tip = (r, a) => [ax + Math.cos(goalAng + a) * r, ay + Math.sin(goalAng + a) * r];
    const [x1, y1] = tip(22, 0);
    const [x2, y2] = tip(16, 2.4);
    const [x3, y3] = tip(16, -2.4);
    this.arrow.fillStyle(0x3a2a3f, 1).fillTriangle(x1 + 2, y1 + 3, x2 + 2, y2 + 3, x3 + 2, y3 + 3);
    this.arrow.fillStyle(0xff6f9f, 1).fillTriangle(x1, y1, x2, y2, x3, y3);

    // Hoàng hôn: trắng → vàng → cam hồng
    const k = this.elapsed / this.timeLimit;
    const col = k < 0.5 ? lerpColor(0xffffff, 0xffe0a8, k * 2) : lerpColor(0xffe0a8, 0xff9a7a, (k - 0.5) * 2);
    this.sunset.setFillStyle(col, 1);
  }

  isWin() {
    return Phaser.Math.Distance.Between(this.pos.x, this.pos.y, GOAL.x, GOAL.y) < 150;
  }

  getStars() {
    return 1 + (this.cactusHits === 0 ? 1 : 0) + (this.grapesTaken >= 3 ? 1 : 0);
  }

  getHudState() {
    const near = this.grapes.some((g) => !g.taken && Phaser.Math.Distance.Between(this.pos.x, this.pos.y, g.x, g.y) < 220);
    let hint = 'W ga • A/D lái • giữ Space + W để tăng tốc • theo mũi tên hồng';
    if (near) hint = '🍇 Đi chậm lại gần chùm nho để hái!';
    else if (this.windStrength > 0.3) hint = '💨 Gió thổi từ trái sang phải — lái lệch về bên trái!';
    else if (this.stormOverlay.alpha > 0.2) hint = '🌪️ Bão cát! Bám theo mũi tên hồng';
    return {
      bars: [
        { key: 'sun', label: 'Mặt trời', value: this.timeLeft, max: this.timeLimit, color: '#ff9f4a' },
        { key: 'boost', label: 'Tăng tốc', value: this.boost, max: 100, color: '#2ec4d6' },
      ],
      counters: [
        { key: 'grape', icon: 'NinhThuan-grape', value: this.grapesTaken, max: 3 },
        { key: 'cactus', icon: 'NinhThuan-cactus', value: this.cactusHits },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Nho hái được: ${this.grapesTaken}/3`, `Đâm xương rồng: ${this.cactusHits} • va chạm khác: ${this.otherHits}`];
  }
}
