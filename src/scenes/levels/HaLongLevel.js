import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createHaLongTextures } from '../../art/levels/HaLongArt.js';
import { burst, floatText } from '../../utils/fx.js';
import { FONT } from '../../ui/theme.js';

// Hạ Long — Chèo kayak đôi qua hang Luồn theo thủy triều. Xem CHALLENGES.md mục 6.
const WORLD_W = 2000;
const WORLD_H = 5000;
const START = { x: 1000, y: 4780 };
const CRUISE = { x: 1000, y: 300 };
const TUNNEL = { x1: 860, x2: 1140, top: 2150, bottom: 2700 };
const ARCHES = [2630, 2510, 2390, 2270];
const TIDE_TIME = 70; // giây tới khi triều đóng hang
const KAYAK_R = 30;
const FAMOUS = [
  { key: 'HaLong-trongmai', name: 'Hòn Trống Mái', x: 1300, y: 4100, r: 95 },
  { key: 'HaLong-dinhhuong', name: 'Hòn Đỉnh Hương', x: 1460, y: 3000, r: 70 },
  { key: 'HaLong-chouda', name: 'Hòn Chó Đá', x: 520, y: 1350, r: 95 },
];
const HOUSES = [
  [180, 3640], [420, 3500], [230, 3320], [560, 3720], [690, 3430], [160, 3020],
];
const NETS = [
  new Phaser.Geom.Rectangle(300, 3560, 220, 120),
  new Phaser.Geom.Rectangle(480, 3250, 220, 120),
  new Phaser.Geom.Rectangle(300, 4300, 220, 120),
  new Phaser.Geom.Rectangle(1300, 1550, 220, 120),
  new Phaser.Geom.Rectangle(700, 900, 220, 120),
];
const LANES = [
  { y: 3150, speed: 120 },
  { y: 1850, speed: -150 },
  { y: 1100, speed: 170 },
  { y: 640, speed: -130 },
];

export class HaLongLevel extends BaseLevel {
  constructor() {
    super('HaLong');
  }

  buildLevel() {
    createHaLongTextures(this);
    const { width: W, height: H } = this.scale;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    this.loseReason = 'Hết giờ rồi, du thuyền đã nhổ neo!';
    const rnd = new Phaser.Math.RandomDataGenerator(['halong']);

    // --- Nước ---
    this.water = this.add.tileSprite(W / 2, H / 2, W, H, 'HaLong-water').setScrollFactor(0).setDepth(-200);
    this.water2 = this.add.tileSprite(W / 2, H / 2, W, H, 'HaLong-water').setScrollFactor(0).setDepth(-199).setAlpha(0.25).setTileScale(1.7).setTint(0xbff4e8);
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: W },
        y: { min: 0, max: H },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1000,
        frequency: 70,
        blendMode: 'ADD',
      })
      .setScrollFactor(0)
      .setDepth(-150);
    this.tideTint = this.add.rectangle(W / 2, H / 2, W, H, 0x0a3d4a, 0).setScrollFactor(0).setDepth(-140);

    // Vách đá 2 bên mép bản đồ
    for (let y = 0; y < WORLD_H; y += 240) {
      [-40, WORLD_W + 40].forEach((x, i) =>
        this.add.image(x + rnd.between(-20, 20), y, `HaLong-karst${rnd.between(0, 2)}`).setScale(rnd.realInRange(1, 1.4)).setFlipX(i === 1).setDepth(y + 100),
      );
    }

    // --- Hang Luồn (dải vách đá chắn ngang, chừa đường hầm) ---
    this.walls = [
      new Phaser.Geom.Rectangle(0, TUNNEL.top, TUNNEL.x1, TUNNEL.bottom - TUNNEL.top),
      new Phaser.Geom.Rectangle(TUNNEL.x2, TUNNEL.top, WORLD_W - TUNNEL.x2, TUNNEL.bottom - TUNNEL.top),
    ];
    this.walls.forEach((rc) => {
      this.add.tileSprite(rc.centerX, rc.centerY, rc.width, rc.height, 'HaLong-rockwall').setDepth(TUNNEL.bottom - 10);
      const g = this.add.graphics().setDepth(TUNNEL.bottom - 9);
      g.lineStyle(5, 0x3a2a3f, 1).strokeRect(rc.x, rc.y, rc.width, rc.height);
      g.fillStyle(0x0a3d3a, 0.35).fillRect(rc.x, rc.bottom - 30, rc.width, 30);
      for (let x = rc.x + 80; x < rc.right - 40; x += 210) {
        this.add.image(x, TUNNEL.bottom + 10, `HaLong-karst${rnd.between(0, 2)}`).setOrigin(0.5, 1).setScale(rnd.realInRange(1, 1.3)).setDepth(TUNNEL.bottom + 20);
      }
    });
    // Lòng hang tối
    this.add.rectangle((TUNNEL.x1 + TUNNEL.x2) / 2, (TUNNEL.top + TUNNEL.bottom) / 2, TUNNEL.x2 - TUNNEL.x1, TUNNEL.bottom - TUNNEL.top, 0x0b2f33, 0.55).setDepth(-130);
    this.add
      .text(1000, TUNNEL.bottom + 70, '⛰️ Hang Luồn', { fontFamily: FONT, fontSize: '30px', fontStyle: '800', color: '#ffffff', stroke: '#1b6b70', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(9000);
    this.arches = ARCHES.map((y) => {
      const img = this.add.image(1000, y, 'HaLong-arch').setDepth(8000).setDisplaySize(TUNNEL.x2 - TUNNEL.x1 + 20, 60);
      return { y, img, hit: false, warned: false, passed: false };
    });
    this.caveDark = this.add.rectangle(W / 2, H / 2, W, H, 0x050a14, 0).setScrollFactor(0).setDepth(8500);
    this.lamp = this.add.image(0, 0, 'glow-warm').setScale(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(8600);

    // --- Đảo đá ---
    this.rocks = [];
    const blocked = (x, y, d) =>
      Phaser.Math.Distance.Between(x, y, START.x, START.y) < 320 + d ||
      Phaser.Math.Distance.Between(x, y, CRUISE.x, CRUISE.y) < 380 + d ||
      FAMOUS.some((f) => Phaser.Math.Distance.Between(x, y, f.x, f.y) < 300 + d) ||
      HOUSES.some(([hx, hy]) => Phaser.Math.Distance.Between(x, y, hx, hy) < 200 + d) ||
      (y > TUNNEL.top - 260 && y < TUNNEL.bottom + 300) ||
      LANES.some((l) => Math.abs(y - l.y) < 110) ||
      this.rocks.some((r) => Phaser.Math.Distance.Between(x, y, r.x, r.y) < 250 + d);
    let tries = 0;
    while (this.rocks.length < 34 && tries++ < 3000) {
      const x = rnd.between(140, WORLD_W - 140);
      const y = rnd.between(500, WORLD_H - 200);
      if (blocked(x, y, 0)) continue;
      const s = rnd.realInRange(0.55, 1.05);
      this.add.image(x, y, `HaLong-karst${rnd.between(0, 2)}`).setOrigin(0.5, 0.88).setScale(s).setDepth(y);
      this.rocks.push({ x, y: y - 10, r: 95 * s });
    }
    this.famous = FAMOUS.map((f) => {
      this.add.image(f.x, f.y, f.key).setOrigin(0.5, 0.88).setDepth(f.y);
      const ring = this.add.graphics().setDepth(f.y - 5);
      ring.lineStyle(4, 0xffffff, 0.7);
      for (let a = 0; a < Math.PI * 2; a += 0.35) ring.beginPath().arc(f.x, f.y - 10, 280, a, a + 0.18).strokePath();
      const label = this.add
        .text(f.x, f.y - 290, `📸 ${f.name}`, { fontFamily: FONT, fontSize: '24px', fontStyle: '800', color: '#ffffff', stroke: '#1b6b70', strokeThickness: 6 })
        .setOrigin(0.5)
        .setDepth(9000);
      this.tweens.add({ targets: label, y: label.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.rocks.push({ x: f.x, y: f.y - 10, r: f.r });
      return { ...f, ring, label, shot: false };
    });

    // --- Làng chài + lưới ---
    this.houses = HOUSES.map(([x, y]) => {
      const img = this.add.image(x, y, 'HaLong-house').setDepth(y + 50);
      this.tweens.add({ targets: img, y: y + 4, duration: 1600 + rnd.between(0, 600), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.rocks.push({ x, y: y + 20, r: 70 });
      return img;
    });
    this.add
      .text(420, 3180, '🏘️ Làng chài Cửa Vạn', { fontFamily: FONT, fontSize: '24px', fontStyle: '800', color: '#ffffff', stroke: '#1b6b70', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(9000);
    this.nets = NETS.map((rc) => {
      this.add.image(rc.centerX, rc.centerY, 'HaLong-net').setDisplaySize(rc.width, rc.height).setDepth(rc.y);
      return { rc, warnedAt: -9999 };
    });

    // --- Tàu du lịch ---
    this.boats = LANES.map((l, i) => {
      const img = this.add.image(rnd.between(0, WORLD_W), l.y, 'HaLong-boat').setFlipX(l.speed < 0).setDepth(l.y + 40);
      const wake = this.add.particles(0, 0, 'spark', {
        speed: { min: 20, max: 60 },
        scale: { start: 0.9, end: 0.2 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 1600,
        frequency: 40,
        follow: img,
        followOffset: { x: l.speed > 0 ? -150 : 150, y: 0 },
      });
      wake.setDepth(l.y - 30);
      return { ...l, img, x: img.x, cooldown: 0, i };
    });

    // --- Rác trôi ---
    this.debris = Array.from({ length: 16 }, (_, i) => {
      let x;
      let y;
      do {
        x = rnd.between(150, WORLD_W - 150);
        y = rnd.between(600, WORLD_H - 400);
      } while (y > TUNNEL.top - 100 && y < TUNNEL.bottom + 100);
      const log = i % 3 !== 0;
      const img = this.add.image(x, y, log ? 'HaLong-log' : 'HaLong-crate').setAngle(rnd.between(0, 180)).setDepth(y);
      return { img, x, y, vx: rnd.between(-25, 25), vy: rnd.between(-10, 15), r: log ? 34 : 24, spin: rnd.realInRange(-0.4, 0.4), cooldown: 0, log };
    });

    // --- Cá nhảy ---
    this.fishTimer = 2;

    // --- Mòng biển ---
    this.gulls = Array.from({ length: 5 }, (_, i) => {
      const g = this.add.image(rnd.between(0, W), rnd.between(40, 300), 'HaLong-gull').setScrollFactor(0).setDepth(9500).setScale(rnd.realInRange(0.7, 1.2));
      this.tweens.add({ targets: g, scaleY: g.scaleY * 0.4, duration: 260 + i * 30, yoyo: true, repeat: -1 });
      return { g, vx: rnd.between(30, 70) };
    });

    // --- Du thuyền ---
    this.add.image(CRUISE.x, CRUISE.y + 20, 'glow').setScale(5).setAlpha(0.35).setDepth(CRUISE.y - 10);
    this.cruise = this.add.image(CRUISE.x, CRUISE.y, 'HaLong-cruise').setDepth(CRUISE.y + 100);
    this.tweens.add({ targets: this.cruise, y: CRUISE.y + 5, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add
      .text(CRUISE.x, CRUISE.y - 150, '🛳️ Du thuyền', { fontFamily: FONT, fontSize: '28px', fontStyle: '800', color: '#ffffff', stroke: '#1b6b70', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(9000);
    this.rocks.push({ x: CRUISE.x - 160, y: CRUISE.y + 40, r: 90 }, { x: CRUISE.x + 160, y: CRUISE.y + 40, r: 90 });

    // --- Kayak ---
    this.pos = new Phaser.Math.Vector2(START.x, START.y);
    this.vel = new Phaser.Math.Vector2();
    this.heading = 0;
    this.angVel = 0;
    this.lastKey = null;
    this.lastStroke = -10;
    this.duck = 0;
    this.kayakShadow = this.add.image(0, 0, 'shadow').setScale(1.2, 3);
    this.kayak = this.add.image(0, 0, 'HaLong-kayak');
    this.paddle = this.add.image(0, 0, 'HaLong-paddle');
    this.player = new Player(this, 0, 0, this.characterKey, { mode: 'none', physics: false, scale: 0.36 });
    this.player.setOrigin(0.5, 0.82).playAnim('sit');
    this.companion = new Companion(this, 0, 0, this.characterKey, { scale: 0.36 });
    this.companion.setOrigin(0.5, 0.82).playAnim('sit');
    this.callee = this.companion.key === 'wife' ? 'anh' : 'em';
    this.ripples = this.add.particles(0, 0, 'spark', {
      speed: { min: 5, max: 30 },
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 900,
      emitting: false,
    });
    this.placeKayak();
    cam.centerOn(this.pos.x, this.pos.y - 120);

    this.good = 0;
    this.bad = 0;
    this.ceilingHits = 0;
    this.otherHits = 0;
    this.photos = 0;
    this.tide = 0;
    this.caveCleared = false;
    this.inCave = false;
  }

  at(lx, ly) {
    const c = Math.cos(this.heading);
    const s = Math.sin(this.heading);
    return [this.pos.x + lx * c - ly * s, this.pos.y + lx * s + ly * c];
  }

  placeKayak() {
    const { x, y } = this.pos;
    const rock = Math.sin(this.elapsed * 3) * 0.03 + this.angVel * 0.02;
    this.kayak.setPosition(x, y).setRotation(this.heading + rock).setDepth(y + 20);
    this.kayakShadow.setPosition(x + 6, y + 10).setRotation(this.heading).setDepth(y + 19).setAlpha(0.35);
    const duckK = this.duck > 0 ? 0.72 : 1;
    const [px, py] = this.at(0, 30);
    const [cx, cy] = this.at(0, -30);
    this.player.setPosition(px, py + (1 - duckK) * 14).setScale(0.36, 0.36 * duckK).setDepth(y + 22);
    this.companion.setPosition(cx, cy + (1 - duckK) * 14).setScale(0.36, 0.36 * duckK).setDepth(y + 21);
    this.paddle.setPosition(px, py - 8).setDepth(y + 23);
    this.lamp.setPosition(cx, cy - 20);
  }

  onPlayStart() {
    this.companion.say(`Chèo luân phiên A — D nhé ${this.callee}! Phải qua hang trước khi triều lên!`, { force: true, duration: 2600 });
  }

  hitFeedback(text, color = '#ff9b9b') {
    [this.kayak, this.player, this.companion].forEach((s) => s.setTint(0xff8080));
    this.time.delayedCall(260, () => [this.kayak, this.player, this.companion].forEach((s) => s.clearTint()));
    this.tweens.add({ targets: [this.player, this.companion], alpha: 0.4, duration: 90, yoyo: true, repeat: 2 });
    this.cameras.main.shake(180, 0.008);
    floatText(this, this.pos.x, this.pos.y - 80, text, { color, size: 24, depth: 9800 });
  }

  collideCircle(ox, oy, r, bounce = 0.45) {
    const dx = this.pos.x - ox;
    const dy = this.pos.y - oy;
    const d = Math.hypot(dx, dy);
    const min = r + KAYAK_R;
    if (d >= min || d === 0) return false;
    const nx = dx / d;
    const ny = dy / d;
    this.pos.set(ox + nx * min, oy + ny * min);
    const vn = this.vel.x * nx + this.vel.y * ny;
    if (vn < 0) this.vel.set(this.vel.x - (1 + bounce) * vn * nx, this.vel.y - (1 + bounce) * vn * ny);
    this.vel.scale(0.6);
    return true;
  }

  updateLevel(dt) {
    const input = this.inputManager;
    const t = this.elapsed;

    // --- Chèo ---
    const strokeL = input.justLeft();
    const strokeR = input.justRight();
    if (strokeL || strokeR) {
      const key = strokeL ? 'A' : 'D';
      const gap = t - this.lastStroke;
      const restart = gap > 1.2; // nghỉ lâu rồi chèo lại: không tính nhịp
      const good = key !== this.lastKey && (restart || gap > 0.22);
      if (!restart) {
        if (good) this.good++;
        else this.bad++;
      }
      const imp = good ? 120 : 65;
      this.vel.x += Math.sin(this.heading) * imp;
      this.vel.y += -Math.cos(this.heading) * imp;
      this.angVel += (key === 'A' ? 1 : -1) * (good ? 0.9 : 1.5);
      this.lastKey = key;
      this.lastStroke = t;
      this.tweens.add({ targets: this.paddle, rotation: this.heading + (key === 'A' ? -0.6 : 0.6), duration: 120, yoyo: true });
      const [sx, sy] = this.at(key === 'A' ? -55 : 55, 20);
      this.ripples.emitParticleAt(sx, sy, 5);
      if (this.good > 0 && this.good % 14 === 0 && good) this.companion.cheer();
    }
    this.paddle.rotation = Phaser.Math.Linear(this.paddle.rotation, this.heading, 0.1);

    // Cúi người
    if (input.isJustDown('action')) this.duck = 0.9;
    this.duck = Math.max(0, this.duck - dt);

    // Vật lý thuyền: cản nước, chống trượt ngang
    const fx = Math.sin(this.heading);
    const fy = -Math.cos(this.heading);
    const fwd = this.vel.x * fx + this.vel.y * fy;
    let lat = -this.vel.x * fy + this.vel.y * fx;
    lat *= Math.exp(-3.5 * dt);
    const f2 = Phaser.Math.Clamp(fwd * Math.exp(-1.0 * dt), -120, 300);
    this.vel.set(fx * f2 - fy * lat, fy * f2 + fx * lat);
    this.angVel *= Math.exp(-3 * dt);
    this.heading += this.angVel * dt;

    // Lưới: rất chậm
    this.nets.forEach((n) => {
      if (n.rc.contains(this.pos.x, this.pos.y)) {
        this.vel.scale(Math.exp(-3.5 * dt));
        if (t - n.warnedAt > 3) {
          n.warnedAt = t;
          this.otherHits++;
          this.hitFeedback('Vướng lưới cá!', '#ffe39a');
        }
      }
    });

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.x = Phaser.Math.Clamp(this.pos.x, 90, WORLD_W - 90);
    this.pos.y = Phaser.Math.Clamp(this.pos.y, 120, WORLD_H - 60);

    // --- Va chạm đá / nhà ---
    this.rocks.forEach((r) => {
      if (this.collideCircle(r.x, r.y, r.r) && t - (r.hitAt ?? -9) > 1) {
        r.hitAt = t;
        this.otherHits++;
        this.hitFeedback('Cộp! Va vào đá!');
        burst(this, this.pos.x, this.pos.y - 20, { count: 12, tint: 0xffffff, scale: 0.5, depth: 9800 });
      }
    });
    // Vách hang
    this.walls.forEach((rc) => {
      const cx = Phaser.Math.Clamp(this.pos.x, rc.left, rc.right);
      const cy = Phaser.Math.Clamp(this.pos.y, rc.top, rc.bottom);
      if (this.collideCircle(cx, cy, 0) && t - (rc.hitAt ?? -9) > 1) {
        rc.hitAt = t;
        this.otherHits++;
        this.hitFeedback('Vách đá! Tìm cửa hang!');
      }
    });

    // --- Tàu du lịch + sóng tàu ---
    this.boats.forEach((b) => {
      b.x += b.speed * dt;
      if (b.speed > 0 && b.x > WORLD_W + 300) b.x = -300;
      if (b.speed < 0 && b.x < -300) b.x = WORLD_W + 300;
      b.img.setPosition(b.x, b.y + Math.sin(t * 2 + b.i) * 3);
      b.cooldown = Math.max(0, b.cooldown - dt);
      const dir = Math.sign(b.speed);
      let hit = false;
      [-100, 0, 100].forEach((o) => {
        if (this.collideCircle(b.x + o, b.y, 45, 0.9)) hit = true;
      });
      if (hit && b.cooldown <= 0) {
        b.cooldown = 1.5;
        this.otherHits++;
        this.vel.x += dir * 160;
        this.hitFeedback('Rầm! Đụng tàu du lịch!');
        burst(this, this.pos.x, this.pos.y, { count: 16, tint: 0xffffff, scale: 0.6, speed: 260, depth: 9800 });
      }
      // vệt sóng phía sau tàu
      const wx = b.x - dir * 260;
      if (Math.abs(this.pos.y - b.y) < 140 && Math.abs(this.pos.x - wx) < 180) {
        this.angVel += Math.sin(t * 9) * 4 * dt;
        this.vel.y += Math.sin(t * 7) * 140 * dt;
        if (b.cooldown <= 0) {
          b.cooldown = 2;
          floatText(this, this.pos.x, this.pos.y - 70, 'Sóng tàu! Giữ thăng bằng!', { color: '#bff4ff', size: 22, depth: 9800 });
          this.cameras.main.shake(300, 0.004);
        }
      }
    });

    // --- Rác trôi ---
    this.debris.forEach((d) => {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x < 60 || d.x > WORLD_W - 60) d.vx *= -1;
      if (d.y > TUNNEL.top - 120 && d.y < TUNNEL.bottom + 120) d.vy *= -1;
      d.img.setPosition(d.x, d.y + Math.sin(t * 2 + d.r) * 3).setRotation(d.img.rotation + d.spin * dt).setDepth(d.y);
      d.cooldown = Math.max(0, d.cooldown - dt);
      if (this.collideCircle(d.x, d.y, d.r, 0.3) && d.cooldown <= 0) {
        d.cooldown = 1.2;
        this.otherHits++;
        this.vel.scale(0.4);
        d.vx += this.vel.x * 0.3;
        d.vy += this.vel.y * 0.3;
        this.hitFeedback(d.log ? 'Khúc gỗ trôi!' : 'Thùng xốp trôi!', '#ffe39a');
      }
    });

    // --- Cá nhảy ---
    this.fishTimer -= dt;
    if (this.fishTimer <= 0) {
      this.fishTimer = Phaser.Math.FloatBetween(1.2, 2.2);
      this.spawnFish();
    }

    // --- Hang Luồn: thạch nhũ + thủy triều ---
    this.tide = Math.min(1, t / TIDE_TIME);
    const inside = this.pos.x > TUNNEL.x1 - 40 && this.pos.x < TUNNEL.x2 + 40 && this.pos.y > TUNNEL.top - 60 && this.pos.y < TUNNEL.bottom + 60;
    if (inside && !this.inCave) this.companion.say('Em bật đèn nhé, tối quá!'.replace('Em', this.companion.key === 'wife' ? 'Em' : 'Anh'), { force: true });
    this.inCave = inside;
    this.caveDark.setAlpha(Phaser.Math.Linear(this.caveDark.alpha, inside ? 0.62 : 0, 0.08));
    this.lamp.setAlpha(this.caveDark.alpha * 1.3);
    this.arches.forEach((a) => {
      const dy = this.pos.y - a.y;
      const inTunnelX = this.pos.x > TUNNEL.x1 - 20 && this.pos.x < TUNNEL.x2 + 20;
      if (!a.warned && inTunnelX && dy > 0 && dy < 200) {
        a.warned = true;
        this.companion.say('Cúi xuống! (Space)', { force: true, duration: 1000 });
      }
      if (!a.passed && inTunnelX && Math.abs(dy) < 26) {
        a.passed = true;
        if (this.duck > 0) floatText(this, this.pos.x, this.pos.y - 70, 'Cúi kịp!', { color: '#7cf29a', size: 22, depth: 9800 });
        else {
          a.hit = true;
          this.ceilingHits++;
          this.vel.scale(0.25);
          this.hitFeedback('Cốp! Đụng trần hang!');
          burst(this, a.img.x, a.y, { count: 12, tint: 0x9aa69a, scale: 0.5, depth: 9800 });
        }
      }
      // triều lên → vòm hang trông thấp & tối hơn
      a.img.setTint(Phaser.Display.Color.GetColor(255 - this.tide * 90, 255 - this.tide * 90, 255 - this.tide * 70));
    });
    if (!this.caveCleared && this.pos.y < TUNNEL.top - 40) {
      this.caveCleared = true;
      this.toast('Qua hang Luồn rồi! 🎉', '#7cf29a');
      this.companion.cheer();
    }
    if (!this.caveCleared && this.tide > 0.7 && !this.tideWarned) {
      this.tideWarned = true;
      this.toast('🌊 Triều đang lên nhanh!', '#bff4ff');
      this.companion.say(`Nhanh lên ${this.callee}, hang sắp đóng!`, { force: true });
    }
    this.tideTint.setAlpha(this.tide * 0.25);

    // --- Chụp ảnh 3 hòn đá nổi tiếng ---
    this.famous.forEach((f) => {
      if (f.shot) return;
      if (Phaser.Math.Distance.Between(this.pos.x, this.pos.y, f.x, f.y) < 290) {
        f.shot = true;
        this.photos++;
        this.cameras.main.flash(250, 255, 255, 255);
        this.toast(`📸 ${f.name}! (${this.photos}/3)`, '#ffffff');
        this.tweens.add({ targets: f.ring, alpha: 0, duration: 500 });
        f.label.setText(`✅ ${f.name}`);
        burst(this, f.x, f.y - 120, { texture: 'star', count: 10, scale: 0.4, depth: 9800 });
      }
    });

    // Môi trường
    this.water.tilePositionX = this.cameras.main.scrollX + Math.sin(t * 0.5) * 20;
    this.water.tilePositionY = this.cameras.main.scrollY - t * 8;
    this.water2.tilePositionX = this.cameras.main.scrollX * 0.6 - t * 10;
    this.water2.tilePositionY = this.cameras.main.scrollY * 0.6;
    this.gulls.forEach((g) => {
      g.g.x += g.vx * dt;
      if (g.g.x > this.scale.width + 50) g.g.x = -50;
    });
    if (this.vel.lengthSq() > 3000 && Math.random() < 0.4) {
      const [sx, sy] = this.at(Phaser.Math.Between(-20, 20), 90);
      this.ripples.emitParticleAt(sx, sy, 1);
    }
    this.ripples.setDepth(this.pos.y + 10);

    this.placeKayak();
    const cam = this.cameras.main;
    cam.centerOn(Phaser.Math.Linear(cam.midPoint.x, this.pos.x + this.vel.x * 0.3, 0.1), Phaser.Math.Linear(cam.midPoint.y, this.pos.y - 120 + this.vel.y * 0.3, 0.1));
  }

  spawnFish() {
    // Cá nhảy vọt qua gần thuyền; bóng báo trước chỗ rơi
    const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const land = new Phaser.Math.Vector2(this.pos.x + Phaser.Math.Between(-60, 60) + this.vel.x * 0.8, this.pos.y + Phaser.Math.Between(-60, 60) + this.vel.y * 0.8);
    const from = new Phaser.Math.Vector2(land.x + Math.cos(ang) * 160, land.y + Math.sin(ang) * 160);
    const shadow = this.add.image(land.x, land.y, 'shadow').setScale(0.6).setAlpha(0.6).setDepth(land.y);
    this.tweens.add({ targets: shadow, scale: 1.1, duration: 800 });
    const fish = this.add.image(from.x, from.y, 'HaLong-fish').setDepth(9700).setFlipX(land.x > from.x);
    burst(this, from.x, from.y, { count: 6, tint: 0xffffff, scale: 0.4, depth: 9600 });
    this.tweens.add({
      targets: fish,
      x: land.x,
      duration: 800,
      onUpdate: (tw) => {
        const p = tw.progress;
        fish.y = Phaser.Math.Linear(from.y, land.y, p) - Math.sin(p * Math.PI) * 120;
        fish.rotation = (p - 0.5) * (land.x > from.x ? 1.6 : -1.6);
      },
      onComplete: () => {
        burst(this, land.x, land.y, { count: 8, tint: 0xffffff, scale: 0.45, depth: 9600 });
        fish.destroy();
        shadow.destroy();
        if (this.state === 'play' && Phaser.Math.Distance.Between(this.pos.x, this.pos.y, land.x, land.y) < 45) {
          this.otherHits++;
          this.angVel += Phaser.Math.FloatBetween(-2, 2);
          this.vel.scale(0.5);
          this.hitFeedback('Cá nhảy vào thuyền!', '#bff4ff');
        }
      },
    });
  }

  isWin() {
    return Phaser.Math.Distance.Between(this.pos.x, this.pos.y, CRUISE.x, CRUISE.y + 120) < 170;
  }

  isLose() {
    if (!this.caveCleared && this.tide >= 1) {
      this.loseReason = 'Thủy triều lên, hang Luồn đã đóng lối!';
      return true;
    }
    return false;
  }

  getStars() {
    return 1 + (this.ceilingHits === 0 ? 1 : 0) + (this.photos >= 3 ? 1 : 0);
  }

  accuracy() {
    const n = this.good + this.bad;
    return n ? this.good / n : 0;
  }

  getHudState() {
    let hint = 'A / D chèo luân phiên để đi thẳng • chèo 1 bên để rẽ';
    if (this.inCave) hint = 'Trong hang tối! Nhấn Space để cúi qua thạch nhũ';
    else if (!this.caveCleared && this.pos.y < TUNNEL.bottom + 600) hint = 'Cửa hang Luồn ở giữa vách đá phía trước — vào trước khi triều lên!';
    else if (this.caveCleared) hint = 'Chèo tới du thuyền phía trên • né tàu, rác trôi, lưới cá';
    return {
      bars: [
        { key: 'tide', label: 'Thủy triều', value: this.caveCleared ? 0 : this.tide * 100, max: 100, color: this.tide > 0.7 && !this.caveCleared ? '#ff6b6b' : '#2ec4d6' },
        { key: 'rhythm', label: 'Đúng nhịp', value: this.accuracy() * 100, max: 100, color: '#33b36b' },
      ],
      counters: [
        { key: 'photo', icon: 'icon-camera', value: this.photos, max: 3 },
        { key: 'ceiling', icon: '⛰️', value: this.ceilingHits },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s • đúng nhịp ${Math.round(this.accuracy() * 100)}%`, `Ảnh đá nổi tiếng: ${this.photos}/3`, `Đụng trần hang: ${this.ceilingHits} • va chạm khác: ${this.otherHits}`];
  }
}
