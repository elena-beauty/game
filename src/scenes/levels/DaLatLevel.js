import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createDaLatTextures, createDaLatExtraTextures } from '../../art/levels/DaLatArt.js';
import { canvasTexture } from '../../utils/canvas.js';
import { burst, floatText, driftClouds } from '../../utils/fx.js';
import { FONT } from '../../ui/theme.js';

// Đà Lạt — Xe đạp đôi trong sương quanh hồ Xuân Hương. Xem CHALLENGES.md mục 4.
const START_X = 300;
const TRACK = 15000; // vạch đích (px)
const BEAT = 0.55; // giây giữa 2 nhịp đạp
const GOOD_WINDOW = 0.16;
const PERFECT_WINDOW = 0.07;
const SCALE = 0.9;
const HALF_BASE = 80 * SCALE; // nửa khoảng cách 2 trục bánh
const WHEEL_R = 31 * SCALE;
const FOG_ZONES = [
  [3200, 5200],
  [7800, 10000],
  [11800, 13600],
];

const smooth = (t) => t * t * (3 - 2 * t);

export class DaLatLevel extends BaseLevel {
  constructor() {
    super('DaLat');
  }

  /** Độ cao mặt đường tại x (dốc lên xuống nhẹ, bằng phẳng ở đầu & cuối). */
  groundY(x) {
    const ramp = smooth(Phaser.Math.Clamp((x - 600) / 900, 0, 1)) * smooth(Phaser.Math.Clamp((TRACK + 300 - x) / 700, 0, 1));
    return 560 + ramp * (48 * Math.sin(x / 520) + 22 * Math.sin(x / 210 + 1.3));
  }

  fogDensity(x) {
    let d = 0;
    FOG_ZONES.forEach(([a, b]) => {
      const fade = 500;
      if (x > a - fade && x < b + fade) d = Math.max(d, smooth(Phaser.Math.Clamp(Math.min(x - (a - fade), b + fade - x) / fade, 0, 1)));
    });
    return d;
  }

  buildLevel() {
    createDaLatTextures(this);
    createDaLatExtraTextures(this);
    const { width: W, height: H } = this.scale;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, TRACK + 900, H);

    // --- Nền nhiều lớp (parallax thủ công) ---
    this.add.image(W / 2, H / 2, 'DaLat-sky').setScrollFactor(0).setDepth(-20);
    this.add.image(980, 170, 'glow-warm').setScrollFactor(0).setScale(4).setAlpha(0.6).setDepth(-19);
    this.add.circle(980, 170, 46, 0xfff4d6).setScrollFactor(0).setDepth(-19);
    driftClouds(this, { count: 5, yMin: 40, yMax: 200, scrollFactor: 0, depth: -18, alpha: 0.85 });
    this.layers = [
      [this.add.tileSprite(W / 2, 330, W, 300, 'DaLat-mountains'), 0.05],
      [this.add.tileSprite(W / 2, 400, W, 260, 'DaLat-hills'), 0.12],
      [this.add.tileSprite(W / 2, 362, W, 260, 'DaLat-pines-far'), 0.22],
      [this.add.tileSprite(W / 2, 372, W, 200, 'DaLat-villas'), 0.3],
      [this.add.tileSprite(W / 2, 500, W, 120, 'DaLat-lake'), 0.4],
      [this.add.tileSprite(W / 2, 382, W, 340, 'DaLat-pines-near'), 0.65],
    ];
    this.layers.forEach(([ts], i) => ts.setScrollFactor(0).setDepth(-17 + i));
    // Luống hoa tiền cảnh (trôi nhanh hơn camera → cảm giác chiều sâu)
    this.layers.push([this.add.tileSprite(W / 2, H - 40, W, 90, 'DaLat-flowerbed').setScrollFactor(0).setDepth(26), 1.25]);
    this.lakeSparkle = this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: W },
      y: { min: 448, max: 550 },
      scale: { start: 0.35, end: 0 },
      lifespan: 900,
      frequency: 110,
      blendMode: 'ADD',
    });
    this.lakeSparkle.setScrollFactor(0).setDepth(-13);

    // --- Mặt đất + đường: vẽ sẵn thành các mảnh texture 1024px (nhẹ hơn Graphics) ---
    const CH = 1024;
    const TOP = 470;
    for (let i = 0; i * CH < TRACK + 950; i++) {
      const key = `DaLat-ground-${i}`;
      const x0 = i * CH;
      canvasTexture(this, key, CH, H - TOP, (ctx, w, h) => {
        const gy = (lx) => this.groundY(x0 + lx) - TOP;
        const band = (off, color) => {
          ctx.beginPath();
          ctx.moveTo(-2, gy(-2) + off);
          for (let lx = 0; lx <= w + 4; lx += 8) ctx.lineTo(lx, gy(lx) + off);
          ctx.lineTo(w + 4, h);
          ctx.lineTo(-2, h);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        };
        band(6, '#7dbb5c');
        band(60, '#5f9c47');
        const road = (width, color) => {
          ctx.beginPath();
          for (let lx = -4; lx <= w + 4; lx += 8) (lx === -4 ? ctx.moveTo : ctx.lineTo).call(ctx, lx, gy(lx) + 12);
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          ctx.stroke();
        };
        road(30, '#3a2a3f');
        road(24, '#d7b48a');
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 3;
        for (let lx = (90 - (x0 % 90)) % 90; lx < w; lx += 90) {
          ctx.beginPath();
          ctx.moveTo(lx, gy(lx) + 12);
          ctx.lineTo(lx + 40, gy(lx + 40) + 12);
          ctx.stroke();
        }
      });
      this.add.image(x0, TOP, key).setOrigin(0, 0).setDepth(5);
    }

    // Hoa cẩm tú cầu, thông nhỏ, biển báo
    for (let x = 200; x < TRACK + 800; x += Phaser.Math.Between(140, 320)) {
      this.add.image(x, this.groundY(x) + Phaser.Math.Between(48, 110), 'DaLat-hydrangea').setScale(Phaser.Math.FloatBetween(0.7, 1.15)).setDepth(6);
    }
    for (let x = 500; x < TRACK; x += Phaser.Math.Between(500, 900)) {
      this.add.image(x, this.groundY(x) - 2, 'pine').setOrigin(0.5, 1).setScale(Phaser.Math.FloatBetween(0.45, 0.7)).setDepth(4);
    }
    for (let k = 1; k <= 4; k++) {
      const x = START_X + ((TRACK - START_X) * k) / 5;
      this.add.image(x, this.groundY(x) - 4, 'DaLat-sign').setOrigin(0.5, 1).setDepth(6);
      this.add
        .text(x, this.groundY(x) - 84, `Còn ${(((TRACK - x) / 1000) * 0.6).toFixed(1)} km`, { fontFamily: FONT, fontSize: '15px', fontStyle: '800', color: '#5a3410', padding: { x: 2, y: 2 } })
        .setOrigin(0.5)
        .setDepth(6);
    }
    this.add.image(TRACK, this.groundY(TRACK) + 6, 'DaLat-gate').setOrigin(0.5, 1).setDepth(7);
    this.add.text(TRACK, this.groundY(TRACK) - 210, 'VỀ ĐÍCH', { fontFamily: FONT, fontSize: '30px', fontStyle: '800', color: '#ffffff', stroke: '#b83266', strokeThickness: 6 }).setOrigin(0.5).setDepth(8);

    // Chướng ngại trên đường: ổ gà, cành thông gãy, chó hoang, người qua đường, xe ngựa
    this.obstacles = [];
    const types = ['pothole', 'pothole', 'branch', 'dog', 'walker', 'cart', 'pothole', 'branch', 'walker', 'dog'];
    let k = 0;
    for (let x = 1300; x < TRACK - 500; x += Phaser.Math.Between(430, 720)) {
      const type = k < 2 ? ['pothole', 'branch'][k] : Phaser.Utils.Array.GetRandom(types);
      k++;
      this.obstacles.push(this.makeObstacle(type, x));
    }
    this.potholes = this.obstacles.filter((o) => o.type === 'pothole');
    // Xe ngựa trang trí chạy ven hồ (phía xa)
    this.decoCarts = [800, 5200, 9800].map((x, i) => {
      const img = this.add.image(x, 0, 'DaLat-cart').setScale(0.55).setDepth(-12.5).setScrollFactor(0);
      return { img, x, speed: 40 + i * 10 };
    });

    // Sương mù trong thế giới
    this.fogSprites = [];
    for (let x = 0; x < TRACK + 800; x += Phaser.Math.Between(260, 520)) {
      const dense = this.fogDensity(x);
      if (dense < 0.05 && Math.random() < 0.6) continue;
      const front = Math.random() < 0.35 + dense * 0.4;
      const f = this.add
        .image(x, Phaser.Math.Between(420, 620), 'DaLat-fog')
        .setScale(Phaser.Math.FloatBetween(1.4, 3))
        .setAlpha(front ? 0.18 + dense * 0.3 : 0.3 + dense * 0.6)
        .setDepth(front ? 30 : 3);
      this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(80, 200), duration: Phaser.Math.Between(6000, 11000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.fogSprites.push(f);
    }
    // Lớp sương phủ cảnh vật & ổ gà phía trước nhưng nằm dưới xe (depth 15) để vẫn thấy 2 người
    this.fogOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xf4f1fb, 0).setScrollFactor(0).setDepth(15);

    // Cánh hoa bay
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: W + 200 },
        y: -10,
        speedX: { min: -60, max: -20 },
        speedY: { min: 30, max: 70 },
        scale: { start: 0.45, end: 0.2 },
        tint: [0xff9ecb, 0xffffff, 0xb8a0ff],
        lifespan: 9000,
        frequency: 260,
      })
      .setScrollFactor(0)
      .setDepth(35);

    // --- Xe đạp đôi ---
    this.bx = START_X;
    this.v = 0;
    this.air = 0;
    this.vy = 0;
    this.pedal = 0;
    this.wheelRot = 0;
    this.rearWheel = this.add.image(0, 0, 'DaLat-wheel').setScale(SCALE).setDepth(20);
    this.frontWheel = this.add.image(0, 0, 'DaLat-wheel').setScale(SCALE).setDepth(20);
    this.bikeShadow = this.add.image(0, 0, 'shadow').setScale(3.2, 0.9).setDepth(19).setAlpha(0.7);
    this.frame = this.add.image(0, 0, 'DaLat-bike').setOrigin(115 / 230, 75 / 110).setScale(SCALE).setDepth(22);
    // Người chơi ngồi trước (cầm lái), bạn đồng hành ngồi sau
    this.player = new Player(this, 0, 0, this.characterKey, { mode: 'none', physics: false, scale: 0.55 });
    this.player.setOrigin(0.5, 0.8).setDepth(24).playAnim('sit');
    this.companion = new Companion(this, 0, 0, this.characterKey, { scale: 0.55 });
    this.companion.setOrigin(0.5, 0.8).setDepth(23).playAnim('sit');
    this.callee = this.companion.key === 'wife' ? 'anh' : 'em';
    this.placeBike(0);
    cam.scrollX = this.bx - 380;

    // --- Nhịp đạp ---
    this.beatT = 0;
    this.lastKey = 'D'; // phím mong đợi tiếp theo là A
    this.lastBeatIdx = -1;
    this.lastCallBeat = -1;
    this.good = 0;
    this.bad = 0;
    this.potholeHits = 0;
    this.obstacleHits = 0;
    this.buildRhythmUI(W);
    this.loseReason = 'Hết giờ rồi, chưa kịp về đích!';
  }

  buildRhythmUI(W) {
    const x = W / 2;
    const y = 612;
    const c = this.add.container(x, y).setScrollFactor(0).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(0x3a2a3f, 0.55).fillRoundedRect(-170, -48, 340, 96, 48);
    bg.fillStyle(0xffffff, 0.95).fillCircle(0, 0, 30);
    bg.lineStyle(4, 0x3a2a3f, 1).strokeCircle(0, 0, 30);
    this.ring = this.add.graphics();
    this.keyText = this.add.text(0, 0, 'A', { fontFamily: FONT, fontSize: '30px', fontStyle: '800', color: '#3a2a3f', padding: { x: 2, y: 4 } }).setOrigin(0.5);
    this.leftKey = this.add.text(-112, 0, 'A', { fontFamily: FONT, fontSize: '26px', fontStyle: '800', color: '#ffffff', stroke: '#3a2a3f', strokeThickness: 5 }).setOrigin(0.5);
    this.rightKey = this.add.text(112, 0, 'D', { fontFamily: FONT, fontSize: '26px', fontStyle: '800', color: '#ffffff', stroke: '#3a2a3f', strokeThickness: 5 }).setOrigin(0.5);
    const foot = this.add.text(-112, 28, 'trái', { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5);
    const foot2 = this.add.text(112, 28, 'phải', { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5);
    c.add([bg, this.ring, this.keyText, this.leftKey, this.rightKey, foot, foot2]);
    this.rhythmUI = c;
    this.ringFlash = 0;
    this.ringColor = 0xffd166;
  }

  placeBike(dt) {
    const rx = this.bx - HALF_BASE;
    const fx = this.bx + HALF_BASE;
    const ry = this.groundY(rx);
    const fy = this.groundY(fx);
    const ang = Math.atan2(fy - ry, fx - rx);
    this.bikeAngle = ang;
    const cx = this.bx;
    const cy = (ry + fy) / 2 - WHEEL_R - this.air;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const at = (lx, ly) => [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];

    this.wheelRot += (this.v * dt) / WHEEL_R;
    const [rwx, rwy] = at(-HALF_BASE, 0);
    const [fwx, fwy] = at(HALF_BASE, 0);
    this.rearWheel.setPosition(rwx, rwy).setRotation(this.wheelRot);
    this.frontWheel.setPosition(fwx, fwy).setRotation(this.wheelRot);
    this.frame.setPosition(cx, cy).setRotation(ang);
    this.bikeShadow.setPosition(cx, (ry + fy) / 2 + 8).setAlpha(Math.max(0.2, 0.7 - this.air / 200));

    // Đạp: 2 người nhún xen kẽ
    this.pedal += (this.v * dt) / 40;
    const b1 = Math.abs(Math.sin(this.pedal)) * 3;
    const b2 = Math.abs(Math.cos(this.pedal)) * 3;
    const [p1x, p1y] = at((140 - 115) * SCALE + 2, (32 - 75) * SCALE + 4 - b1);
    const [p2x, p2y] = at((70 - 115) * SCALE + 2, (32 - 75) * SCALE + 4 - b2);
    this.player.setPosition(p1x, p1y).setRotation(ang);
    this.companion.setPosition(p2x, p2y).setRotation(ang);
  }

  onPlayStart() {
    this.companion.say('Một — Hai! Mình đạp đều nhé!', { force: true });
  }

  updateLevel(dt) {
    const input = this.inputManager;
    this.beatT += dt;
    const phase = (this.beatT % BEAT) / BEAT;
    const beatIdx = Math.round(this.beatT / BEAT);

    // Bạn đồng hành hô nhịp
    const curBeat = Math.floor(this.beatT / BEAT);
    if (curBeat !== this.lastCallBeat) {
      this.lastCallBeat = curBeat;
      const word = curBeat % 2 === 0 ? 'Một!' : 'Hai!';
      if (this.fogDensity(this.bx) < 0.5 || curBeat % 2 === 0) {
        floatText(this, this.companion.x - 10, this.companion.y - 70, word, { size: 20, color: '#ffd166', depth: 60 });
      }
    }

    // Phím đạp
    const pressA = input.justLeft();
    const pressD = input.justRight();
    if (pressA || pressD) this.onPedal(pressA ? 'A' : 'D', phase, beatIdx);

    // Nhảy
    if (input.isJustDown('action') && this.air <= 0.01) {
      this.vy = 430;
      this.air = 0.1;
      this.tweens.add({ targets: [this.player, this.companion], scaleY: '*=1.08', duration: 100, yoyo: true });
    }
    if (this.air > 0) {
      this.vy -= 1300 * dt;
      this.air += this.vy * dt;
      if (this.air <= 0) {
        this.air = 0;
        this.vy = 0;
        this.cameras.main.shake(80, 0.003);
        burst(this, this.bx, this.groundY(this.bx) + 4, { count: 8, tint: 0xd7b48a, scale: 0.4, speed: 120, depth: 25 });
      }
    }

    // Dốc + ma sát
    const slopeAng = this.bikeAngle ?? 0;
    this.v += Math.sin(slopeAng) * 380 * dt;
    this.v -= (30 + this.v * 0.22) * dt;
    this.v = Phaser.Math.Clamp(this.v, 0, 560);
    this.bx = Math.min(this.bx + this.v * dt, TRACK + 400);

    // Chướng ngại
    this.obstacles.forEach((o) => this.updateObstacle(o, dt));
    // Xe ngựa xa (parallax 0.4 như mặt hồ)
    this.decoCarts.forEach((c) => {
      c.x += c.speed * dt;
      const sx = ((c.x - this.cameras.main.scrollX * 0.4) % 1700 + 1700) % 1700 - 200;
      c.img.setPosition(sx, 452 + Math.abs(Math.sin(this.elapsed * 6 + c.x)) * -2);
    });

    this.placeBike(dt);

    // Camera + parallax
    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, this.bx - 380, 0.15);
    this.layers.forEach(([ts, f]) => (ts.tilePositionX = cam.scrollX * f));

    // Sương
    const fog = this.fogDensity(this.bx + 300);
    this.fogOverlay.setAlpha(fog * 0.7);

    // Vòng nhịp
    this.drawRing(phase, dt);
  }

  onPedal(key, phase, beatIdx) {
    const off = Math.min(phase, 1 - phase) * BEAT;
    const expected = this.lastKey === 'A' ? 'D' : 'A';
    let ok = true;
    let msg = '';
    if (key !== expected) {
      ok = false;
      msg = 'Sai chân!';
    } else if (beatIdx === this.lastBeatIdx) {
      ok = false;
      msg = 'Vội quá!';
    } else if (off > GOOD_WINDOW) {
      ok = false;
      msg = 'Lệch nhịp';
    }
    this.lastKey = key;
    this.lastBeatIdx = beatIdx;
    if (ok) {
      this.good++;
      const perfect = off <= PERFECT_WINDOW;
      this.v += perfect ? 92 : 72;
      this.ringFlash = 1;
      this.ringColor = perfect ? 0x7cf29a : 0x8fe9f2;
      if (perfect) floatText(this, this.player.x + 40, this.player.y - 60, 'Tuyệt!', { size: 22, color: '#7cf29a', depth: 60 });
      if (this.good % 12 === 0) this.companion.cheer();
    } else {
      this.bad++;
      this.v = this.v * 0.86 + 8;
      this.ringFlash = 1;
      this.ringColor = 0xff6b6b;
      floatText(this, this.player.x + 40, this.player.y - 60, msg, { size: 20, color: '#ff9b9b', depth: 60 });
    }
    const t = key === 'A' ? this.leftKey : this.rightKey;
    this.tweens.add({ targets: t, scale: 1.4, duration: 80, yoyo: true });
  }

  drawRing(phase, dt) {
    const r = 30 + 56 * (1 - phase);
    this.ringFlash = Math.max(0, this.ringFlash - dt * 3);
    const g = this.ring;
    g.clear();
    const near = Math.min(phase, 1 - phase) * BEAT <= GOOD_WINDOW;
    g.lineStyle(5, near ? 0x7cf29a : 0xffd166, 0.95).strokeCircle(0, 0, r);
    if (this.ringFlash > 0) g.fillStyle(this.ringColor, this.ringFlash * 0.7).fillCircle(0, 0, 30);
    const expected = this.lastKey === 'A' ? 'D' : 'A';
    this.keyText.setText(expected);
    this.leftKey.setAlpha(expected === 'A' ? 1 : 0.45);
    this.rightKey.setAlpha(expected === 'D' ? 1 : 0.45);
  }

  makeObstacle(type, x) {
    const gy = this.groundY(x);
    const o = { type, x, baseX: x, hit: false, warned: false, passed: false, cooldown: 0, t: Math.random() * 4 };
    if (type === 'pothole') Object.assign(o, { img: this.add.image(x, gy + 10, 'DaLat-pothole').setDepth(6), w: 34, h: 8 });
    else if (type === 'branch') Object.assign(o, { img: this.add.image(x, gy + 4, 'DaLat-branch').setOrigin(0.5, 0.8).setDepth(18), w: 55, h: 26 });
    else if (type === 'dog') Object.assign(o, { img: this.add.image(x, gy, 'DaLat-dog0').setOrigin(0.5, 0.9).setDepth(18), w: 26, h: 30, running: false });
    else if (type === 'walker') Object.assign(o, { img: this.add.image(x, gy, 'DaLat-walker0').setOrigin(0.5, 1).setScale(0.85).setDepth(4), w: 26, h: 9999, onRoad: false });
    else if (type === 'cart') Object.assign(o, { img: this.add.image(x, gy, 'DaLat-cart').setOrigin(0.5, 0.95).setScale(0.75).setDepth(18), w: 50, h: 30, speed: 70 });
    if (type === 'branch' || type === 'dog') this.add.image(x, gy + 12, 'shadow').setScale(1.4, 0.6).setDepth(6);
    return o;
  }

  updateObstacle(o, dt) {
    o.t += dt;
    o.cooldown = Math.max(0, o.cooldown - dt);
    let dx = o.x - this.bx;
    if (o.type === 'dog') {
      if (!o.running && dx < 900) o.running = true;
      if (o.running && o.x > this.bx - 1200) o.x -= 170 * dt;
      o.img.setTexture(Math.floor(o.t * 10) % 2 ? 'DaLat-dog1' : 'DaLat-dog0');
      o.img.setPosition(o.x, this.groundY(o.x) + 6 - Math.abs(Math.sin(o.t * 10)) * 6);
      if (o.running && Math.floor(o.t * 2) !== Math.floor((o.t - dt) * 2) && Math.abs(dx) < 700 && Math.random() < 0.4) {
        floatText(this, o.x, o.img.y - 50, 'Gâu gâu!', { size: 18, color: '#ffe39a', depth: 60 });
      }
    } else if (o.type === 'cart') {
      o.x += o.speed * dt;
      o.img.setPosition(o.x, this.groundY(o.x) + 8 + Math.abs(Math.sin(o.t * 6)) * -2);
    } else if (o.type === 'walker') {
      // Đi ngang qua đường theo chu kỳ 4.5s: từ phía sau (xa) ra phía trước (gần)
      const cyc = (o.t % 4.5) / 4.5;
      const off = Phaser.Math.Linear(-46, 40, Math.min(1, cyc * 1.6));
      o.onRoad = off > -14 && off < 16;
      o.img.setTexture(Math.floor(o.t * 5) % 2 ? 'DaLat-walker1' : 'DaLat-walker0');
      o.img.setPosition(o.x, this.groundY(o.x) + 10 + off).setDepth(off > 0 ? 26 : 4);
      o.img.setAlpha(cyc > 0.85 ? (1 - cyc) / 0.15 : cyc < 0.08 ? cyc / 0.08 : 1);
    }
    dx = o.x - this.bx;

    if (!o.warned && dx > 0 && dx < 560) {
      o.warned = true;
      const foggy = this.fogDensity(o.x) > 0.3;
      const lines = {
        pothole: foggy ? `Ổ gà phía trước, nhảy đi ${this.callee}!` : 'Có ổ gà kìa!',
        branch: 'Cành thông gãy! Nhảy qua!',
        dog: 'Chó chạy ra kìa, coi chừng!',
        walker: 'Có người qua đường, chậm lại!',
        cart: 'Xe ngựa chậm quá, nhảy vượt đi!',
      };
      if (foggy || o.type !== 'pothole' || Math.random() < 0.5) this.companion.say(lines[o.type], { force: true, duration: 1300 });
    }

    const hitting = o.type === 'walker' ? o.onRoad && o.img.alpha > 0.5 && Math.abs(dx) < o.w : Math.abs(dx) < o.w && this.air < o.h;
    const once = o.type === 'pothole' || o.type === 'branch';
    if (hitting && o.cooldown <= 0 && !(once && o.hit)) {
      o.hit = true;
      o.cooldown = 1.2;
      this.hitObstacle(o);
    }
    if (!o.passed && dx < -o.w - 30 && once) {
      o.passed = true;
      if (!o.hit) floatText(this, o.x, o.img.y - 60, 'Vượt!', { size: 22, color: '#8fe9f2', depth: 60 });
    }
  }

  hitObstacle(o) {
    const texts = { pothole: 'Ối! Vấp ổ gà!', branch: 'Vướng cành thông!', dog: 'Ối! Suýt cán chó!', walker: 'Xin lỗi ạ!', cart: 'Đụng xe ngựa!' };
    if (o.type === 'pothole') this.potholeHits++;
    this.obstacleHits++;
    this.v *= o.type === 'cart' || o.type === 'walker' ? 0.15 : 0.3;
    if (o.type === 'cart' || o.type === 'walker' || o.type === 'dog') this.bx = Math.min(this.bx, o.x - o.w - 10);
    this.cameras.main.shake(220, 0.01);
    burst(this, this.bx + 40, this.groundY(this.bx) - 10, { count: 14, tint: o.type === 'branch' ? 0x3f9a62 : 0x8a6a4a, scale: 0.5, speed: 200, depth: 25 });
    [this.player, this.companion, this.frame].forEach((s) => {
      s.setTint(0xff9b9b);
      this.time.delayedCall(400, () => s.clearTint());
    });
    this.tweens.add({ targets: [this.player, this.companion], alpha: 0.4, duration: 90, yoyo: true, repeat: 3 });
    floatText(this, this.player.x, this.player.y - 80, texts[o.type], { size: 26, color: '#ff9b9b', depth: 60 });
    if (o.type === 'dog') {
      this.tweens.add({ targets: o.img, y: o.img.y - 60, alpha: 0, duration: 500 });
      o.x = -9999;
    }
    this.time.delayedCall(500, () => this.companion.say(`${this.callee === 'anh' ? 'Anh' : 'Em'} có sao không?`, { force: true, duration: 1300 }));
  }

  accuracy() {
    const total = this.good + this.bad;
    return total ? this.good / total : 0;
  }

  isWin() {
    return this.bx >= TRACK;
  }

  getStars() {
    return 1 + (this.accuracy() >= 0.7 ? 1 : 0) + (this.potholeHits === 0 ? 1 : 0);
  }

  getHudState() {
    const acc = this.accuracy();
    const foggy = this.fogDensity(this.bx + 300) > 0.4;
    return {
      bars: [
        { key: 'dist', label: 'Quãng đường', value: this.bx - START_X, max: TRACK - START_X, color: '#8b7fd6' },
        { key: 'rhythm', label: 'Đúng nhịp', value: acc * 100, max: 100, color: acc >= 0.7 ? '#33b36b' : '#ff7a59' },
      ],
      counters: [
        { key: 'speed', icon: '🚲', value: `${Math.round(this.v / 12)}` },
        { key: 'hits', icon: '💥', value: this.obstacleHits },
      ],
      hint: foggy ? 'Sương dày quá! Nghe bạn đồng hành báo chướng ngại — Space để nhảy' : 'A ⇄ D đúng nhịp • Space nhảy qua ổ gà, cành cây, chó, xe ngựa • người qua đường: chờ!',
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Đúng nhịp: ${Math.round(this.accuracy() * 100)}%`, `Vấp ổ gà: ${this.potholeHits} • va chạm khác: ${this.obstacleHits - this.potholeHits}`];
  }
}
