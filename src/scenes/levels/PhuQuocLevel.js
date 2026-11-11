import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createPhuQuocTextures } from '../../art/levels/PhuQuocArt.js';
import { burst, floatText, bob, driftClouds } from '../../utils/fx.js';

const WORLD_W = 3200;
const WORLD_H = 1300;
const SURFACE = 150;
const FLOOR = 1172; // mặt cát
const PHOTO_RANGE = 170;

const SPECIES = [
  { key: 'clown', name: 'Cá hề', tex: 'PhuQuoc-clown', x: 640, y: 1090 },
  { key: 'star', name: 'Sao biển', tex: 'PhuQuoc-starfish', x: 1290, y: FLOOR - 20 },
  { key: 'turtle', name: 'Rùa biển', tex: 'PhuQuoc-turtle', x: 1900, y: 520 },
  { key: 'seahorse', name: 'Cá ngựa', tex: 'PhuQuoc-seahorse', x: 2560, y: 930 },
  { key: 'brain', name: 'San hô não', tex: 'PhuQuoc-brain', x: 3020, y: FLOOR - 30 },
];

/**
 * Phú Quốc — Lặn ngắm san hô (CHALLENGES.md mục 8).
 * Bơi tự do dưới nước, chụp 5 loài bằng F trước khi hết oxy (Shift ở mặt nước để lấy hơi).
 * Nguy hiểm: cá mập tuần tra/rượt đuổi, bạch tuộc phun mực, sứa trôi, lươn biển thò ra từ hang,
 * nhím biển (tính sao), cá mú tò mò húc nhẹ.
 */
export class PhuQuocLevel extends BaseLevel {
  constructor() {
    super('PhuQuoc');
  }

  buildLevel() {
    createPhuQuocTextures(this);
    this.oxy = 100;
    this.photos = new Set();
    this.urchinHits = 0;
    this.hits = 0;
    this.photoCd = 0;
    this.t = 0;

    this.physics.world.setBounds(0, SURFACE - 34, WORLD_W, FLOOR - (SURFACE - 34));
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.buildBackground();
    this.buildReef();
    this.buildSpecies();
    this.buildHazards();

    // Người chơi + bạn đồng hành
    this.player = new Player(this, 220, SURFACE + 10, this.characterKey, { mode: 'none', scale: 0.64 });
    this.player.setDepth(20);
    this.player.body.setDrag(520, 520).setMaxVelocity(this.player.stats.speed * 1.05);
    this.player.body.setSize(60, 80).setOffset(18, 30);
    this.companion = new Companion(this, 140, SURFACE + 30, this.characterKey, { scale: 0.58 });
    this.companion.setDepth(19);
    this.prevComp = { x: this.companion.x, y: this.companion.y };

    this.arrow = this.add.image(0, 0, 'PhuQuoc-arrow').setDepth(30).setScale(0.8);
    this.tweens.add({ targets: this.arrow, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });

    this.playerBubbles = this.add
      .particles(0, 0, 'PhuQuoc-bubble', {
        speedY: { min: -90, max: -40 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.5, end: 0.2 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 1600,
        frequency: 260,
      })
      .setDepth(21);
    this.playerBubbles.startFollow(this.player, 0, -30);

    // Lớp mực che màn hình
    this.ink = this.add.image(640, 360, 'PhuQuoc-ink').setScrollFactor(0).setDepth(900).setDisplaySize(1600, 1100).setAlpha(0);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.events.on('update', (_t, d) => this.animateAmbient(Math.min(d, 50) / 1000));
  }

  // ---------- Thế giới ----------
  buildBackground() {
    this.add.image(640, WORLD_H / 2, 'PhuQuoc-water').setScrollFactor(0, 1).setDepth(0);
    driftClouds(this, { count: 4, yMin: 10, yMax: 60, scrollFactor: 0.2, depth: 1, alpha: 0.8, width: WORLD_W });
    this.add.tileSprite(1300, SURFACE - 4, 2600, 90, 'PhuQuoc-islands').setOrigin(0.5, 1).setScrollFactor(0.5, 1).setDepth(1);
    this.boat = this.add.image(300, SURFACE + 8, 'PhuQuoc-boat').setOrigin(0.5, 0.7).setDepth(2);
    this.tweens.add({ targets: this.boat, y: this.boat.y + 5, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Tia nắng xuyên nước
    for (let i = 0; i < 9; i++) {
      const r = this.add
        .image(200 + i * 360 + Phaser.Math.Between(-60, 60), SURFACE, 'PhuQuoc-ray')
        .setOrigin(0.5, 0)
        .setScrollFactor(0.7, 1)
        .setDepth(2)
        .setBlendMode('ADD')
        .setAlpha(0.25)
        .setScale(Phaser.Math.FloatBetween(0.7, 1.3), 1);
      this.tweens.add({ targets: r, alpha: 0.08, duration: Phaser.Math.Between(1800, 3200), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.add.tileSprite(1200, FLOOR + 40, 2400, 420, 'PhuQuoc-reef-far').setOrigin(0.5, 1).setScrollFactor(0.5, 1).setDepth(3).setAlpha(0.7);
    this.add.tileSprite(1500, FLOOR + 30, 3000, 300, 'PhuQuoc-reef-mid').setOrigin(0.5, 1).setScrollFactor(0.75, 1).setDepth(3).setAlpha(0.85);

    // Đàn cá nền
    for (let s = 0; s < 6; s++) {
      const tex = Phaser.Utils.Array.GetRandom(['PhuQuoc-fish1', 'PhuQuoc-fish2', 'PhuQuoc-fish3']);
      const y = Phaser.Math.Between(SURFACE + 120, FLOOR - 200);
      const x0 = Phaser.Math.Between(0, WORLD_W);
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (let k = 0; k < 7; k++) {
        const f = this.add.image(x0 + k * 26 * -dir + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-30, 30), tex).setDepth(4).setFlipX(dir < 0).setScale(0.8);
        this.tweens.add({ targets: f, x: f.x + dir * 900, duration: Phaser.Math.Between(9000, 12000), yoyo: true, repeat: -1, ease: 'Sine.InOut', onYoyo: () => f.setFlipX(dir > 0), onRepeat: () => f.setFlipX(dir < 0) });
        bob(this, f, { dy: 8, duration: 700 });
      }
    }

    // Mặt nước nhìn từ dưới
    this.surface = this.add.tileSprite(WORLD_W / 2, SURFACE - 14, WORLD_W, 40, 'PhuQuoc-surface').setOrigin(0.5, 0).setDepth(26);
    this.caustic = this.add.tileSprite(WORLD_W / 2, FLOOR - 160, WORLD_W, 360, 'PhuQuoc-caustic').setOrigin(0.5, 0).setDepth(12).setBlendMode('ADD').setAlpha(0.22);

    // Bong bóng từ đáy biển
    this.add
      .particles(0, FLOOR, 'PhuQuoc-bubble', {
        x: { min: 0, max: WORLD_W },
        speedY: { min: -120, max: -60 },
        speedX: { min: -10, max: 10 },
        scale: { min: 0.3, max: 0.8 },
        alpha: { start: 0.8, end: 0.1 },
        lifespan: 9000,
        frequency: 140,
      })
      .setDepth(11);
  }

  buildReef() {
    this.add.image(0, FLOOR - 30, 'PhuQuoc-sand').setOrigin(0, 0).setDepth(6);
    const decor = [
      ['PhuQuoc-coral1', 120], ['PhuQuoc-coral2', 380], ['PhuQuoc-coral3', 820], ['PhuQuoc-coral1', 1060], ['PhuQuoc-coral2', 1500],
      ['PhuQuoc-coral3', 1720], ['PhuQuoc-coral1', 2140], ['PhuQuoc-coral2', 2380], ['PhuQuoc-coral3', 2760], ['PhuQuoc-coral1', 2900], ['PhuQuoc-coral2', 3150],
    ];
    decor.forEach(([tex, x]) => {
      const c = this.add.image(x, FLOOR + 4, tex).setOrigin(0.5, 1).setDepth(7).setScale(Phaser.Math.FloatBetween(0.9, 1.3));
      this.tweens.add({ targets: c, scaleY: c.scaleY * 1.04, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Phaser.Math.Between(0, 800) });
    });
    // Rong biển đung đưa
    for (let x = 60; x < WORLD_W; x += Phaser.Math.Between(110, 220)) {
      const k = this.add.image(x, FLOOR + 10, 'PhuQuoc-kelp').setOrigin(0.5, 1).setDepth(8).setScale(Phaser.Math.FloatBetween(0.7, 1.4));
      k.angle = -4;
      this.tweens.add({ targets: k, angle: 4, duration: Phaser.Math.Between(1600, 2400), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  buildSpecies() {
    this.species = SPECIES.map((sp) => {
      let img;
      if (sp.key === 'clown') {
        this.add.image(sp.x, FLOOR + 4, 'PhuQuoc-anemone').setOrigin(0.5, 1).setDepth(9).setScale(1.2);
        img = this.add.image(sp.x, sp.y, sp.tex).setDepth(10);
        this.tweens.add({ targets: img, x: sp.x + 50, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut', onYoyo: () => img.setFlipX(true), onRepeat: () => img.setFlipX(false) });
        bob(this, img, { dy: 10, duration: 800 });
      } else if (sp.key === 'turtle') {
        img = this.add.image(sp.x, sp.y, sp.tex).setDepth(10);
        this.tweens.add({ targets: img, x: sp.x + 380, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.InOut', onYoyo: () => img.setFlipX(true), onRepeat: () => img.setFlipX(false) });
        bob(this, img, { dy: 22, duration: 1800 });
      } else if (sp.key === 'seahorse') {
        img = this.add.image(sp.x, sp.y, sp.tex).setDepth(10);
        bob(this, img, { dy: 16, duration: 1300 });
      } else {
        img = this.add.image(sp.x, sp.y, sp.tex).setDepth(10);
        if (sp.key === 'star') this.tweens.add({ targets: img, angle: 360, duration: 20000, repeat: -1 });
      }
      const glow = this.add.image(sp.x, sp.y, 'glow').setDepth(9).setScale(1.4).setAlpha(0.35).setBlendMode('ADD');
      this.tweens.add({ targets: glow, alpha: 0.1, scale: 1.8, duration: 900, yoyo: true, repeat: -1 });
      return { ...sp, img, glow };
    });
  }

  buildHazards() {
    // Nhím biển (tính sao)
    this.urchins = [];
    const urchinSpots = [[930, FLOOR + 2], [1460, FLOOR + 2], [1640, 780], [2060, FLOOR + 2], [2330, 680], [2700, FLOOR + 2], [2860, FLOOR + 2], [1180, 640]];
    urchinSpots.forEach(([x, y]) => {
      if (y < FLOOR) this.add.image(x, y + 72, 'PhuQuoc-rock').setDepth(8).setScale(0.8);
      const u = this.add.image(x, y, 'PhuQuoc-urchin').setOrigin(0.5, 1).setDepth(9);
      this.tweens.add({ targets: u, scaleX: 1.08, duration: 700, yoyo: true, repeat: -1 });
      this.urchins.push(u);
    });

    // Cá mập tuần tra
    this.sharks = [[1100, 420, 900, 1500], [2000, 820, 1700, 2500], [2700, 380, 2400, 3100]].map(([x, y, minX, maxX]) => ({
      img: this.add.image(x, y, 'PhuQuoc-shark').setDepth(18).setScale(0.85),
      minX,
      maxX,
      baseY: y,
      dir: 1,
      mode: 'patrol',
      timer: 0,
    }));

    // Bạch tuộc phun mực
    this.octopi = [[1350, FLOOR - 2], [2450, FLOOR - 2]].map(([x, y]) => {
      const img = this.add.image(x, y, 'PhuQuoc-octopus').setOrigin(0.5, 1).setDepth(10);
      this.tweens.add({ targets: img, scaleY: 0.92, scaleX: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return { img, cd: 2, charging: 0 };
    });

    // Sứa trôi
    this.jellies = [];
    [[760, 480], [1020, 820], [1560, 360], [1820, 900], [2240, 470], [2620, 560], [2980, 760], [480, 700]].forEach(([x, y]) => {
      const j = this.add.image(x, y, 'PhuQuoc-jelly').setDepth(17).setAlpha(0.92);
      this.tweens.add({ targets: j, y: y - Phaser.Math.Between(90, 160), duration: Phaser.Math.Between(2600, 3600), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: j, scaleY: 0.85, scaleX: 1.1, duration: 500, yoyo: true, repeat: -1 });
      this.add.image(x, y, 'glow').setDepth(16).setScale(0.8).setAlpha(0.25).setTint(0xff8fd0).setBlendMode('ADD');
      this.jellies.push(j);
    });

    // Lươn biển trong hang đá
    this.eels = [[1150, FLOOR + 6, 1], [2200, FLOOR + 6, -1], [2950, 520, -1]].map(([x, y, dir]) => {
      const cave = this.add.image(x, y, 'PhuQuoc-cave').setOrigin(0.5, 1).setDepth(9);
      const hx = x;
      const hy = y - 46;
      const eel = this.add.image(hx, hy, 'PhuQuoc-eel').setDepth(8).setFlipX(dir < 0).setScale(0.2, 1).setAlpha(0);
      if (y < FLOOR) this.add.image(x, y + 6, 'PhuQuoc-rock').setOrigin(0.5, 0).setDepth(8).setScale(0.9);
      return { cave, eel, hx, hy, dir, timer: Phaser.Math.FloatBetween(1, 3), state: 'hide' };
    });

    // Cá mú tò mò
    this.grouper = { img: this.add.image(-300, 600, 'PhuQuoc-grouper').setDepth(18), active: false, timer: 9, life: 0 };
  }

  animateAmbient(dt) {
    this.t += dt;
    this.surface.tilePositionX += dt * 30;
    this.caustic.tilePositionX += dt * 12;
    this.caustic.tilePositionY = Math.sin(this.t * 0.5) * 20;
  }

  onPlayStart() {
    this.companion.say('Mình cùng lặn chụp ảnh nhé!', { force: true });
  }

  // ---------- Vòng lặp ----------
  updateLevel(dt) {
    const p = this.player;
    const inp = this.inputManager;
    const dir = inp.getDirection();
    if (!p.locked) p.body.setAcceleration(dir.x * 800, dir.y * 800);

    const atSurface = p.y < SURFACE + 40;
    const moving = p.body.speed > 40;
    if (atSurface) {
      p.rotation = Phaser.Math.Angle.RotateTo(p.rotation, 0, 0.15);
      p.playAnim('swim');
    } else if (moving) {
      const target = Math.atan2(p.body.velocity.x, -p.body.velocity.y);
      p.rotation = Phaser.Math.Angle.RotateTo(p.rotation, target, 0.12);
      p.playAnim('walk');
    } else {
      p.rotation = Phaser.Math.Angle.RotateTo(p.rotation, Math.sin(this.t * 2) * 0.1, 0.05);
      p.playAnim('idle');
    }
    p.setFlipX(false);
    this.playerBubbles.frequency = atSurface ? -1 : 260;

    // Oxy
    if (atSurface && inp.isDown('secondary')) {
      if (this.oxy < 99 && !this.breathing) floatText(this, p.x, p.y - 60, 'Hít sâu...', { color: '#8fe9f2', size: 22 });
      this.breathing = true;
      this.oxy = Math.min(100, this.oxy + 40 * dt);
    } else {
      this.breathing = false;
      if (!atSurface) this.oxy = Math.max(0, this.oxy - (100 / 70 / p.stats.stamina) * dt);
    }

    this.photoCd -= dt;
    if (inp.isJustDown('photo')) this.takePhoto();

    this.updateHazards(dt);
    this.updateCompanion();
  }

  nearestSpecies(maxDist = Infinity) {
    let best = null;
    let bd = maxDist;
    this.species.forEach((sp) => {
      if (this.photos.has(sp.key)) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, sp.img.x, sp.img.y);
      if (d < bd) {
        bd = d;
        best = sp;
      }
    });
    return best;
  }

  takePhoto() {
    if (this.photoCd > 0) return;
    this.photoCd = 0.6;
    const sp = this.nearestSpecies(PHOTO_RANGE);
    this.cameras.main.flash(160, 255, 255, 255);
    if (!sp) {
      floatText(this, this.player.x, this.player.y - 60, 'Chưa có gì để chụp...', { size: 20 });
      return;
    }
    this.photos.add(sp.key);
    this.toast(`📸 ${sp.name}! (${this.photos.size}/5)`, '#ffd166');
    burst(this, sp.img.x, sp.img.y, { texture: 'star', count: 12, scale: 0.4, tint: 0xffffff });
    this.tweens.add({ targets: sp.img, scale: sp.img.scale * 1.3, duration: 180, yoyo: true });
    sp.glow.destroy();
    const check = this.add.image(sp.img.x, sp.img.y - 60, 'PhuQuoc-check').setDepth(25).setScale(0);
    this.tweens.add({ targets: check, scale: 1, duration: 300, ease: 'Back.Out' });
    if (sp.key === 'turtle' || sp.key === 'clown' || sp.key === 'seahorse') this.time.addEvent({ delay: 16, loop: true, callback: () => check.setPosition(sp.img.x, sp.img.y - 60) });
    this.showPolaroid(sp);
    this.companion.say(this.photos.size === 5 ? 'Đủ 5 loài rồi! Tuyệt quá!' : 'Ảnh đẹp quá!', { force: true });
  }

  showPolaroid(sp) {
    const c = this.add.container(1280 - 130, 720 - 150).setScrollFactor(0).setDepth(950);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRect(-86 + 5, -96 + 7, 172, 196);
    g.fillStyle(0xfffdf7, 1).fillRect(-86, -96, 172, 196);
    g.fillStyle(0x1b8ea6, 1).fillRect(-76, -86, 152, 140);
    const img = this.add.image(0, -16, sp.tex);
    img.setScale(Math.min(120 / img.width, 110 / img.height));
    const t = this.add.text(0, 76, sp.name, { fontFamily: '"Baloo 2", sans-serif', fontSize: '22px', fontStyle: '800', color: '#3a2a3f', padding: { x: 2, y: 3 } }).setOrigin(0.5);
    c.add([g, img, t]);
    c.setScale(0);
    this.tweens.chain({
      targets: c,
      tweens: [
        { scale: 1, duration: 300, ease: 'Back.Out' },
        { y: c.y + 260, alpha: 0, delay: 1500, duration: 400, onComplete: () => c.destroy() },
      ],
    });
  }

  hurtPlayer(src, msg, oxyLoss, force = 420) {
    const p = this.player;
    if (!p.hurt(1100)) return false;
    this.hits++;
    this.oxy = Math.max(0, this.oxy - oxyLoss);
    const ang = Phaser.Math.Angle.Between(src.x, src.y, p.x, p.y);
    p.body.setVelocity(Math.cos(ang) * force, Math.sin(ang) * force);
    floatText(this, p.x, p.y - 60, `${msg} -${oxyLoss} oxy`, { color: '#ff6b6b', size: 22 });
    burst(this, p.x, p.y, { texture: 'PhuQuoc-bubble', count: 14, speed: 200, scale: 0.6, depth: 30 });
    return true;
  }

  updateHazards(dt) {
    const p = this.player;
    const near = (o, r) => Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < r;

    this.urchins.forEach((u) => {
      if (Math.abs(p.x - u.x) < 34 && p.y > u.y - 70 && p.y < u.y + 10 && this.hurtPlayer({ x: u.x, y: u.y }, 'Nhím biển!', 8)) {
        this.urchinHits++;
        this.companion.say('Cẩn thận nhím biển!', { force: true });
      }
    });

    this.jellies.forEach((j) => {
      if (near(j, 46)) this.hurtPlayer(j, 'Sứa chích!', 6, 300);
    });

    // Cá mập: tuần tra, thấy người thì rượt 3s rồi bỏ đi
    this.sharks.forEach((s) => {
      const img = s.img;
      s.timer -= dt;
      const dist = Phaser.Math.Distance.Between(p.x, p.y, img.x, img.y);
      if (s.mode === 'patrol') {
        img.x += s.dir * 90 * dt;
        img.y = s.baseY + Math.sin(this.time.now / 700 + s.minX) * 20;
        if (img.x > s.maxX) s.dir = -1;
        if (img.x < s.minX) s.dir = 1;
        if (dist < 330 && p.y > SURFACE + 60 && s.timer <= 0) {
          s.mode = 'chase';
          s.timer = 3;
          floatText(this, img.x, img.y - 70, '!!', { color: '#ff6b6b', size: 40 });
          this.companion.say('Cá mập! Bơi lên nhanh!', { force: true });
        }
      } else if (s.mode === 'chase') {
        const a = Phaser.Math.Angle.Between(img.x, img.y, p.x, p.y);
        img.x += Math.cos(a) * 175 * dt;
        img.y += Math.sin(a) * 175 * dt;
        img.y = Math.max(img.y, SURFACE + 60);
        s.dir = Math.cos(a) >= 0 ? 1 : -1;
        if (s.timer <= 0 || p.y < SURFACE + 50) {
          s.mode = 'patrol';
          s.timer = 3.5;
          s.baseY = img.y;
          s.minX = Math.min(s.minX, img.x - 100);
          s.maxX = Math.max(s.maxX, img.x + 100);
        }
      }
      img.setFlipX(s.dir < 0);
      img.rotation = Phaser.Math.Linear(img.rotation, s.mode === 'chase' ? Math.sin(this.time.now / 90) * 0.08 : 0, 0.2);
      const mx = img.x + s.dir * 70;
      if (Phaser.Math.Distance.Between(p.x, p.y, mx, img.y) < 62 && this.hurtPlayer(img, 'Cá mập cắn!', 15, 520)) {
        s.mode = 'patrol';
        s.timer = 3;
        this.cameras.main.shake(250, 0.012);
      }
    });

    // Bạch tuộc phun mực khi lại gần
    this.octopi.forEach((o) => {
      o.cd -= dt;
      const d = Phaser.Math.Distance.Between(p.x, p.y, o.img.x, o.img.y - 50);
      if (o.charging > 0) {
        o.charging -= dt;
        o.img.setTint(Math.floor(this.time.now / 80) % 2 ? 0xffffff : 0xb26bff);
        if (o.charging <= 0) {
          o.img.clearTint();
          o.cd = 6;
          const a = Phaser.Math.Angle.Between(o.img.x, o.img.y - 50, p.x, p.y);
          const cloud = this.add
            .particles(o.img.x, o.img.y - 50, 'glow', {
              speed: { min: 80, max: 260 },
              angle: { min: Phaser.Math.RadToDeg(a) - 25, max: Phaser.Math.RadToDeg(a) + 25 },
              scale: { start: 0.6, end: 1.6 },
              alpha: { start: 0.9, end: 0 },
              tint: 0x1a0f26,
              lifespan: 1400,
              emitting: false,
            })
            .setDepth(24);
          cloud.explode(26);
          this.time.delayedCall(1600, () => cloud.destroy());
          if (Phaser.Math.Distance.Between(p.x, p.y, o.img.x, o.img.y) < 260) {
            this.hits++;
            floatText(this, p.x, p.y - 60, 'Bị phun mực! Không thấy gì!', { color: '#c792ea', size: 22 });
            this.ink.setAlpha(0.95);
            this.tweens.killTweensOf(this.ink);
            this.tweens.add({ targets: this.ink, alpha: 0, duration: 2600, delay: 600, ease: 'Quad.In' });
            p.body.setVelocity(Math.cos(a) * 300, Math.sin(a) * 300);
          }
        }
      } else if (o.cd <= 0 && d < 230) {
        o.charging = 0.6;
        floatText(this, o.img.x, o.img.y - 120, '!', { color: '#c792ea', size: 36 });
      }
    });

    // Lươn biển thò ra theo chu kỳ (có bong bóng báo trước)
    this.eels.forEach((e) => {
      e.timer -= dt;
      if (e.state === 'hide' && e.timer <= 0) {
        e.state = 'warn';
        e.timer = 0.7;
        burst(this, e.hx, e.hy, { texture: 'PhuQuoc-bubble', count: 8, speed: 80, scale: 0.4, depth: 12 });
      } else if (e.state === 'warn' && e.timer <= 0) {
        e.state = 'out';
        e.timer = 1.3;
        this.tweens.add({ targets: e.eel, x: e.hx + e.dir * 80, scaleX: 1, alpha: 1, duration: 160, ease: 'Back.Out' });
      } else if (e.state === 'out') {
        if (Phaser.Math.Distance.Between(p.x, p.y, e.hx + e.dir * 140, e.hy) < 56) this.hurtPlayer({ x: e.hx, y: e.hy }, 'Lươn biển đớp!', 10);
        if (e.timer <= 0) {
          e.state = 'hide';
          e.timer = Phaser.Math.FloatBetween(2, 3.5);
          this.tweens.add({ targets: e.eel, x: e.hx, scaleX: 0.2, alpha: 0, duration: 300 });
        }
      }
    });

    // Cá mú tò mò: thỉnh thoảng bơi theo và húc nhẹ (không mất máu)
    const gr = this.grouper;
    if (!gr.active) {
      gr.timer -= dt;
      if (gr.timer <= 0 && p.y > SURFACE + 100) {
        gr.active = true;
        gr.life = 5;
        gr.side = Math.random() < 0.5 ? -1 : 1;
        gr.img.setPosition(p.x + gr.side * 700, p.y + Phaser.Math.Between(-80, 80));
        if (!this.grouperSeen) {
          this.grouperSeen = true;
          this.toast('Cá mú tò mò bơi theo!', '#ffd166');
        }
      }
    } else {
      gr.life -= dt;
      const tx = gr.life > 0 ? p.x : p.x + gr.side * 1200;
      const ty = gr.life > 0 ? p.y : gr.img.y;
      const a = Phaser.Math.Angle.Between(gr.img.x, gr.img.y, tx, ty);
      gr.img.x += Math.cos(a) * 150 * dt;
      gr.img.y += Math.sin(a) * 150 * dt;
      gr.img.setFlipX(Math.cos(a) < 0);
      if (gr.life > 0 && near(gr.img, 80) && !p.invulnerable) {
        p.body.setVelocity(Math.cos(a) * 380, Math.sin(a) * 380);
        floatText(this, p.x, p.y - 60, 'Ọc! Bị cá mú húc', { color: '#ffd166', size: 22 });
        burst(this, p.x, p.y, { texture: 'PhuQuoc-bubble', count: 10, speed: 160, scale: 0.5, depth: 30 });
        gr.life = 0;
      }
      if (gr.life < -6) {
        gr.active = false;
        gr.timer = Phaser.Math.Between(10, 16);
      }
    }
  }

  updateCompanion() {
    const p = this.player;
    const side = p.body.velocity.x >= 0 ? -1 : 1;
    const c = this.companion;
    c.follow({ x: p.x + side * 80, y: p.y + 40, flipX: false }, 0, 0, 0.05);
    const dx = c.x - this.prevComp.x;
    const dy = c.y - this.prevComp.y;
    if (Math.abs(dx) + Math.abs(dy) > 0.6) c.rotation = Phaser.Math.Angle.RotateTo(c.rotation, Math.atan2(dx, -dy), 0.1);
    else c.rotation = Phaser.Math.Angle.RotateTo(c.rotation, 0, 0.05);
    c.setFlipX(false);
    this.prevComp = { x: c.x, y: c.y };

    const target = this.nearestSpecies();
    if (target) {
      this.arrow.setVisible(true);
      const a = Phaser.Math.Angle.Between(c.x, c.y, target.img.x, target.img.y);
      this.arrow.setPosition(c.x + Math.cos(a) * 50, c.y + Math.sin(a) * 50 - 20).setRotation(a);
      const d = Phaser.Math.Distance.Between(p.x, p.y, target.img.x, target.img.y);
      if (d < 260) c.say(`Kìa ${target.name}! Nhấn F chụp đi!`);
      else if (this.time.now - (this.lastPoint ?? 0) > 7000) {
        this.lastPoint = this.time.now;
        const where = Math.abs(target.img.x - p.x) > 200 ? (target.img.x > p.x ? 'bên phải' : 'bên trái') : target.img.y > p.y ? 'phía dưới' : 'phía trên';
        c.say(`${target.name} ở ${where} kìa!`, { force: true });
      }
    } else this.arrow.setVisible(false);

    if (this.oxy < 30 && this.time.now - (this.lastOxyWarn ?? 0) > 6000) {
      this.lastOxyWarn = this.time.now;
      c.say('Sắp hết oxy! Lên lấy hơi đi!', { force: true });
    }
  }

  isWin() {
    return this.photos.size >= 5;
  }

  isLose() {
    if (this.oxy <= 0) {
      this.loseReason = 'Hết bình oxy mất rồi!';
      return true;
    }
    return false;
  }

  getStars() {
    return 1 + (this.oxy > 30 ? 1 : 0) + (this.urchinHits === 0 ? 1 : 0);
  }

  getHudState() {
    const p = this.player;
    const sp = this.nearestSpecies(PHOTO_RANGE);
    let hint = 'WASD bơi · F chụp ảnh · Shift ở mặt nước để lấy hơi';
    if (sp) hint = `📸 Nhấn F để chụp ${sp.name}!`;
    else if (p.y < SURFACE + 40 && this.oxy < 99) hint = 'Giữ Shift để hít thở';
    else if (this.oxy < 35) hint = 'Sắp hết oxy! Bơi lên mặt nước, giữ Shift';
    return {
      bars: [{ key: 'oxy', label: 'Oxy', value: this.oxy, max: 100, color: this.oxy > 30 ? '#4cc9f0' : '#ff6b6b' }],
      counters: [
        { key: 'photo', icon: 'icon-camera', value: this.photos.size, max: 5 },
        { key: 'urchin', icon: 'PhuQuoc-urchin', value: this.urchinHits },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Đã chụp: ${this.photos.size}/5 loài`, `Oxy còn lại: ${Math.round(this.oxy)}%`, `Chạm nhím biển: ${this.urchinHits} lần · Va chạm: ${this.hits}`];
  }
}
