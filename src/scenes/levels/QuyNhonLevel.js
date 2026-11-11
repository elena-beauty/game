import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createQuyNhonTextures, createQuyNhonExtras } from '../../art/levels/QuyNhonArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';
import { titleStyle } from '../../ui/theme.js';

const W = 1280;
const H = 3000;
const BOAT = { x: 640, y: 230 };
const CURRENTS = [
  { y: 2050, h: 200, dir: 1 },
  { y: 1350, h: 220, dir: -1 },
  { y: 720, h: 200, dir: 1 },
];
const BOAT_LANES = [1700, 1050, 470];
const SHELLS = [
  [260, 2080],
  [1040, 1420],
  [300, 760],
];

// Quy Nhơn — Bơi vượt sóng ở Kỳ Co. Xem CHALLENGES.md mục 2.
export class QuyNhonLevel extends BaseLevel {
  constructor() {
    super('QuyNhon');
  }

  buildLevel() {
    createQuyNhonTextures(this);
    createQuyNhonExtras(this);
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    // --- Biển ---
    this.water = this.add.tileSprite(0, 0, W, H, 'QuyNhon-water').setOrigin(0);
    this.caustic = this.add.tileSprite(0, 0, W, H, 'QuyNhon-caustic').setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(0, 0, 'QuyNhon-depth').setOrigin(0).setDisplaySize(W, H);

    // Bóng cá bơi dưới nước
    this.fish = [];
    for (let i = 0; i < 14; i++) {
      const f = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(300, 2600), 'QuyNhon-fish').setAlpha(0.8);
      f.speed = Phaser.Math.Between(30, 70) * (Math.random() < 0.5 ? -1 : 1);
      f.setFlipX(f.speed > 0);
      this.fish.push(f);
    }

    // Dòng chảy ngang
    CURRENTS.forEach((c) => {
      c.tile = this.add.tileSprite(0, c.y - c.h / 2, W, c.h, 'QuyNhon-current').setOrigin(0).setAlpha(0.55).setFlipX(c.dir < 0);
      const band = this.add.rectangle(0, c.y - c.h / 2, W, c.h, 0xffffff, 0.06).setOrigin(0);
      band.setDepth(1);
    });

    // Bãi biển, cầu cảng, đá
    this.add.image(0, H - 300, 'QuyNhon-beach').setOrigin(0).setDepth(1);
    this.add.image(200, H - 470, 'QuyNhon-pier').setDepth(1);
    this.add.image(60, H - 120, 'palm').setOrigin(0.5, 1).setScale(1.1).setDepth(H);
    this.add.image(1210, H - 80, 'palm').setOrigin(0.5, 1).setScale(0.95).setFlipX(true).setDepth(H);
    this.add.image(1100, H - 60, 'QuyNhon-shell').setScale(0.7).setDepth(2);

    this.rocks = this.physics.add.staticGroup();
    for (let y = 400; y < 2600; y += 330) {
      [Phaser.Math.Between(20, 70), Phaser.Math.Between(1210, 1260)].forEach((x, i) => {
        if ((y / 330 + i) % 2 < 1) return;
        const r = this.rocks.create(x, y + Phaser.Math.Between(-60, 60), 'QuyNhon-rock');
        r.setScale(Phaser.Math.FloatBetween(0.8, 1.2)).refreshBody();
        r.body.setSize(r.displayWidth * 0.7, r.displayHeight * 0.55);
        r.setDepth(3);
      });
    }

    // Đảo đá Kỳ Co hai bên (vật cản)
    [[60, 1900, false], [1220, 1180, true], [70, 520, false], [1230, 2450, true]].forEach(([x, y, flip]) => {
      const isl = this.rocks.create(x, y, 'QuyNhon-islet').setFlipX(flip).setDepth(3);
      isl.refreshBody();
      isl.body.setSize(220, 170);
    });

    // --- Thuyền thúng + bạn đồng hành ---
    this.boat = this.add.image(BOAT.x, BOAT.y, 'QuyNhon-thung').setDepth(4000);
    this.companion = new Companion(this, BOAT.x, BOAT.y + 20, this.characterKey, { scale: 0.6 });
    this.companion.setDepth(4001).playAnim('cheer');
    this.add.image(BOAT.x, BOAT.y, 'glow').setScale(4).setAlpha(0.25).setDepth(3999).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: [this.boat, this.companion], y: '+=8', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.tweens.add({ targets: this.boat, angle: { from: -4, to: 4 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // --- Người chơi ---
    this.player = new Player(this, 640, H - 330, this.characterKey, { mode: 'swim', scale: 0.6 });
    this.player.body.setSize(60, 60).setOffset(18, 56);
    this.physics.add.collider(this.player, this.rocks);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 80);

    // --- Vỏ sò ---
    this.shells = this.physics.add.group({ allowGravity: false });
    SHELLS.forEach(([x, y]) => {
      const s = this.shells.create(x, y, 'QuyNhon-shell').setDepth(5);
      s.body.setCircle(24, 4, 2);
      bob(this, s, { dy: 6 });
      this.add.image(x, y, 'glow').setScale(1.1).setAlpha(0.45).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    });
    this.physics.add.overlap(this.player, this.shells, (_p, s) => {
      s.destroy();
      this.shellCount++;
      burst(this, s.x, s.y, { tint: 0xffb3c6, count: 16 });
      floatText(this, s.x, s.y - 20, `Vỏ sò ${this.shellCount}/3`, { color: '#ffd1dc' });
    });

    // --- Sứa ---
    this.jellies = this.physics.add.group({ allowGravity: false });
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(140, W - 140);
      const y = Phaser.Math.Between(500, 2450);
      const j = this.jellies.create(x, y, 'QuyNhon-jelly').setDepth(6).setAlpha(0.9);
      j.body.setCircle(26, 14, 10);
      this.tweens.add({ targets: j, x: x + Phaser.Math.Between(-90, 90), duration: Phaser.Math.Between(2500, 4000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: j, scaleY: 0.85, scaleX: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Phaser.Math.Between(0, 600) });
    }
    this.physics.add.overlap(this.player, this.jellies, () => {
      if (this.slowTimer > 0 || this.state !== 'play') return;
      this.slowTimer = 2.2;
      this.stings++;
      this.player.setTint(0xd8a5ff);
      floatText(this, this.player.x, this.player.y - 40, 'Sứa! Chậm lại...', { color: '#e9c2ff', size: 22 });
    });

    // --- Ca nô ---
    this.speedboats = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.speedboats, (p, b) => {
      if (this.state !== 'play' || this.diving) return;
      if (this.player.hurt(900)) {
        this.boatHits++;
        this.pushV = 420;
        this.toast('Cẩn thận ca nô!', '#ffb3b3');
      }
    });
    this.laneTimers = BOAT_LANES.map((_, i) => 1.5 + i * 2.2);

    // --- Cá mập tuần tra ---
    this.sharks = [2300, 1550, 900, 380].map((y, i) => {
      const sh = this.add.image(Phaser.Math.Between(200, 1080), y, 'QuyNhon-shark').setDepth(7);
      sh.vx = (i % 2 ? -1 : 1) * 90;
      sh.homeY = y;
      sh.chase = 0;
      sh.cool = 0;
      return sh;
    });

    // --- Bạch tuộc phun mực ---
    this.octopi = [[420, 2350], [900, 1850], [560, 1150], [980, 620]].map(([x, y]) => {
      const o = this.add.image(x, y, 'QuyNhon-octopus').setDepth(6).setScale(0.8);
      this.tweens.add({ targets: o, angle: 10, scale: 0.88, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      o.cool = Phaser.Math.FloatBetween(0, 2);
      return o;
    });
    this.inkOverlay = this.add.container(0, 0).setScrollFactor(0).setDepth(19000).setAlpha(0);
    this.inkOverlay.add(this.add.rectangle(640, 360, 1280, 720, 0x1a1028, 0.55));
    for (let i = 0; i < 9; i++) {
      this.inkOverlay.add(this.add.image(Phaser.Math.Between(100, 1180), Phaser.Math.Between(80, 640), 'QuyNhon-ink').setScale(Phaser.Math.FloatBetween(3, 6)));
    }
    this.blind = 0;

    // --- Sóng lớn ---
    this.waves = [];
    this.waveTimer = 4;
    this.warning = this.add
      .text(W / 2, 110, '⚠ Sóng lớn! Nhấn Space để lặn', titleStyle(30, '#ffffff', '#c2415a'))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20000)
      .setAlpha(0);

    // Lấp lánh trên mặt nước (không gian màn hình)
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: W },
        y: { min: 0, max: 720 },
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 1000,
        frequency: 70,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(10);

    // --- Trạng thái ---
    this.maxStamina = 100 * this.player.stats.stamina;
    this.stamina = this.maxStamina;
    this.breath = 100;
    this.exhausted = false;
    this.diving = false;
    this.diveTimer = 0;
    this.slowTimer = 0;
    this.pushV = 0;
    this.shellCount = 0;
    this.waveHits = 0;
    this.dodges = 0;
    this.boatHits = 0;
    this.stings = 0;
    this.buoyUsed = false;
    this.sharkBites = 0;
    this.inked = 0;
    this.wantDive = false;
    this.input.keyboard.on('keydown-SPACE', () => (this.wantDive = true));
  }

  onPlayStart() {
    this.wantDive = false;
    this.companion.say(this.companion.stats.cheers[0], { force: true });
  }

  updateLevel(dt) {
    const p = this.player;
    const input = this.inputManager;

    // Nước chuyển động
    this.water.tilePositionX += dt * 8;
    this.water.tilePositionY -= dt * 14;
    this.caustic.tilePositionX -= dt * 12;
    this.caustic.tilePositionY += dt * 6;
    CURRENTS.forEach((c) => (c.tile.tilePositionX -= c.dir * dt * 140));
    this.fish.forEach((f) => {
      f.x += f.speed * dt;
      if (f.x < -60) f.x = W + 60;
      if (f.x > W + 60) f.x = -60;
    });

    // Lặn
    const dive = this.wantDive;
    this.wantDive = false;
    if (dive && !this.diving) {
      if (this.breath >= 30) this.startDive();
      else floatText(this, p.x, p.y - 50, 'Hết hơi!', { color: '#9be7ff', size: 22 });
    }
    if (this.diving) {
      this.diveTimer -= dt;
      if (this.diveTimer <= 0) this.endDive();
    } else {
      this.breath = Math.min(100, this.breath + dt * 16);
    }

    // Sức bền
    const moving = input.getDirection().lengthSq() > 0;
    let speedMul = 1;
    if (this.exhausted) {
      speedMul = 0.55;
      this.stamina += dt * 18;
      if (this.stamina >= 35) this.exhausted = false;
    } else if (input.isDown('secondary') && moving) {
      speedMul = 1.65;
      this.stamina -= (dt * 30) / this.player.stats.stamina;
      if (this.stamina <= 0) {
        this.stamina = 0;
        this.exhausted = true;
        floatText(this, p.x, p.y - 50, 'Mệt quá...', { color: '#ffd166', size: 22 });
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * (moving ? 6 : 14));
    }
    if (this.diving) speedMul *= 0.8;
    if (this.slowTimer > 0) {
      speedMul *= 0.5;
      this.slowTimer -= dt;
      if (this.slowTimer <= 0 && !this.diving) p.clearTint();
    }
    // Bạn đồng hành ném phao khi sắp đuối (1 lần)
    if (!this.buoyUsed && (this.stamina < 15 || this.exhausted)) this.throwBuoy();

    p.update(input, dt, { speedMul });

    // Dòng chảy đẩy ngang
    CURRENTS.forEach((c) => {
      if (Math.abs(p.y - c.y) < c.h / 2) p.body.velocity.x += c.dir * 130;
    });
    // Bị sóng/ca nô đẩy lùi
    if (this.pushV > 1) {
      p.body.velocity.y += this.pushV;
      this.pushV *= Math.pow(0.04, dt);
    }

    this.updateWaves(dt);
    this.updateSpeedboats(dt);
    this.updateSharks(dt);
    this.updateOctopi(dt);

    // Cổ vũ khi tới gần
    const dist = p.y - BOAT.y;
    if (dist < 650 && Math.random() < dt * 0.5) this.companion.cheer();
  }

  startDive() {
    this.diving = true;
    this.diveTimer = 1.1;
    this.breath -= 30;
    this.player.setAlpha(0.45).setTint(0x3b82c4);
    this.tweens.add({ targets: this.player, scale: 0.5, duration: 150 });
    burst(this, this.player.x, this.player.y, { count: 14, tint: 0xd9fbff, speed: 160, depth: 3500 });
  }

  endDive() {
    this.diving = false;
    this.player.setAlpha(1).clearTint();
    this.tweens.add({ targets: this.player, scale: 0.6, duration: 150 });
    burst(this, this.player.x, this.player.y, { count: 10, tint: 0xffffff, speed: 120, depth: 3500 });
  }

  throwBuoy() {
    this.buoyUsed = true;
    const cam = this.cameras.main;
    const p = this.player;
    const buoy = this.add.image(p.x + 120, cam.worldView.y - 60, 'QuyNhon-buoy').setDepth(4600);
    this.toast('Phao cứu sinh!', '#ffd166');
    this.tweens.add({ targets: buoy, angle: 540, duration: 700 });
    this.tweens.add({
      targets: buoy,
      x: p.x + 30,
      y: p.y - 10,
      duration: 700,
      ease: 'Quad.In',
      onComplete: () => {
        this.stamina = this.maxStamina;
        this.exhausted = false;
        burst(this, buoy.x, buoy.y, { texture: 'heart', count: 10, scale: 0.5 });
        floatText(this, p.x, p.y - 60, 'Sức bền đầy!', { color: '#a6ec9b' });
        this.tweens.add({ targets: buoy, alpha: 0, scale: 0.5, delay: 600, duration: 400, onComplete: () => buoy.destroy() });
      },
    });
  }

  updateWaves(dt) {
    const cam = this.cameras.main;
    const p = this.player;
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = Phaser.Math.FloatBetween(5, 6.8);
      const wave = this.add.image(0, cam.worldView.y - 100, 'QuyNhon-wave').setOrigin(0, 0.75).setDepth(5000);
      wave.hit = false;
      wave.speed = Phaser.Math.Between(300, 360);
      this.waves.push(wave);
      this.warning.setAlpha(1);
      this.tweens.add({ targets: this.warning, alpha: 0.2, duration: 200, yoyo: true, repeat: 3, onComplete: () => this.warning.setAlpha(0) });
    }
    this.waves = this.waves.filter((wave) => {
      wave.y += wave.speed * dt;
      if (!wave.hit && Math.abs(wave.y - p.y) < 28) {
        wave.hit = true;
        if (this.diving) {
          this.dodges++;
          floatText(this, p.x, p.y - 50, 'Lặn qua!', { color: '#9be7ff' });
        } else {
          this.waveHits++;
          this.player.hurt(700);
          this.pushV = 520;
          burst(this, p.x, p.y, { count: 20, tint: 0xffffff, speed: 260, depth: 5100 });
          this.toast('Bị sóng đánh!', '#9be7ff');
        }
      }
      if (wave.y > cam.worldView.bottom + 200 || wave.y > H + 100) {
        wave.destroy();
        return false;
      }
      return true;
    });
  }

  updateSpeedboats(dt) {
    BOAT_LANES.forEach((y, i) => {
      this.laneTimers[i] -= dt;
      if (this.laneTimers[i] > 0) return;
      this.laneTimers[i] = Phaser.Math.FloatBetween(5.5, 8.5);
      const dir = Math.random() < 0.5 ? 1 : -1;
      const b = this.speedboats.create(dir > 0 ? -120 : W + 120, y, 'QuyNhon-speedboat').setDepth(4500).setFlipX(dir < 0);
      b.body.setSize(170, 56);
      b.setVelocityX(dir * Phaser.Math.Between(320, 420));
      b.wake = this.add
        .particles(0, 0, 'spark', {
          speed: { min: 10, max: 40 },
          scale: { start: 0.8, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 900,
          frequency: 25,
          tint: 0xffffff,
        })
        .setDepth(4400);
      b.wake.startFollow(b, -90 * dir, 0);
    });
    this.speedboats.getChildren().forEach((b) => {
      if (b.x < -200 || b.x > W + 200) {
        b.wake?.destroy();
        b.destroy();
      }
    });
  }

  updateSharks(dt) {
    const p = this.player;
    this.sharks.forEach((sh) => {
      const d = Phaser.Math.Distance.Between(sh.x, sh.y, p.x, p.y);
      sh.cool -= dt;
      if (sh.chase <= 0 && sh.cool <= 0 && d < 300 && !this.diving) {
        sh.chase = 2.6;
        floatText(this, sh.x, sh.y - 40, 'Cá mập!', { color: '#ff8080', size: 24 });
      }
      if (sh.chase > 0) {
        sh.chase -= dt;
        if (sh.chase <= 0) sh.cool = 3;
        const a = Phaser.Math.Angle.Between(sh.x, sh.y, p.x, p.y);
        sh.x += Math.cos(a) * 175 * dt;
        sh.y += Math.sin(a) * 175 * dt;
        sh.setFlipX(Math.cos(a) < 0);
      } else {
        sh.x += sh.vx * dt;
        sh.y += (sh.homeY - sh.y) * dt;
        if (sh.x < 120 || sh.x > W - 120) sh.vx *= -1;
        sh.setFlipX(sh.vx < 0);
      }
      sh.y += Math.sin(this.time.now / 300 + sh.homeY) * 0.4;
      if (d < 55 && !this.diving && p.hurt(1000)) {
        this.sharkBites++;
        this.pushV = 450;
        sh.chase = 0;
        sh.cool = 3;
        burst(this, p.x, p.y, { count: 18, tint: 0xffffff, speed: 240, depth: 5100 });
        this.toast('Cá mập đớp hụt! Lặn để trốn!', '#ff8080');
      }
    });
  }

  updateOctopi(dt) {
    const p = this.player;
    this.octopi.forEach((o) => {
      o.cool -= dt;
      const d = Phaser.Math.Distance.Between(o.x, o.y, p.x, p.y);
      if (o.cool <= 0 && d < 240) {
        o.cool = 3.5;
        const em = this.add.particles(o.x, o.y, 'QuyNhon-ink', {
          speed: { min: 80, max: 220 },
          angle: { min: Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(o.x, o.y, p.x, p.y)) - 25, max: Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(o.x, o.y, p.x, p.y)) + 25 },
          scale: { start: 0.6, end: 2.2 },
          alpha: { start: 0.9, end: 0 },
          lifespan: 1100,
          emitting: false,
        }).setDepth(4300);
        em.explode(22);
        this.time.delayedCall(1300, () => em.destroy());
        if (d < 170 && !this.diving) {
          this.blind = 2.4;
          this.inked++;
          this.slowTimer = Math.max(this.slowTimer, 1.5);
          floatText(this, p.x, p.y - 50, 'Bạch tuộc phun mực!', { color: '#c4b5fd', size: 22 });
        }
      }
    });
    this.blind = Math.max(0, this.blind - dt);
    this.inkOverlay.setAlpha(Phaser.Math.Linear(this.inkOverlay.alpha, this.blind > 0 ? 1 : 0, 0.15));
  }

  isWin() {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, BOAT.x, BOAT.y) < 110;
  }

  getStars() {
    let stars = 1;
    if (this.elapsed < 60) stars++;
    if (this.waveHits === 0 && this.shellCount === 3) stars++;
    return stars;
  }

  getHudState() {
    const meters = Math.max(0, Math.round((this.player.y - BOAT.y) / 10));
    let hint = `Còn ${meters}m tới thuyền thúng`;
    if (this.diving) hint = 'Đang lặn...';
    else if (this.exhausted) hint = 'Mệt quá! Bơi chậm lại để hồi sức';
    else if (this.waves.some((w) => !w.hit && w.y < this.player.y)) hint = 'Sóng tới! Nhấn Space để lặn';
    return {
      bars: [
        { key: 'stamina', label: 'Sức bền', value: this.stamina, max: this.maxStamina, color: '#33b36b' },
        { key: 'breath', label: 'Hơi thở', value: this.breath, max: 100, color: '#2ec4d6' },
      ],
      counters: [
        { key: 'shell', icon: 'QuyNhon-shell', value: this.shellCount, max: 3 },
        { key: 'wave', icon: '🌊', value: this.waveHits },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Bị sóng đánh: ${this.waveHits} lần · Lặn qua: ${this.dodges}`, `Vỏ sò: ${this.shellCount}/3`];
  }
}
