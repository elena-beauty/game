import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createNinhBinhTextures } from '../../art/levels/NinhBinhArt.js';
import { canvasTexture } from '../../utils/canvas.js';
import { burst, floatText, bob } from '../../utils/fx.js';

// ---------- Phase A: đò Tràng An ----------
const LANES = [528, 600, 672]; // mực nước của từng làn
const BOAT_X = 330;
const DIST_A = 9000;
const BASE_SPEED = 215;
const CAVES = [
  { start: 2500, end: 3900, name: 'Hang Sáng' },
  { start: 5900, end: 7400, name: 'Hang Tối' },
];
const HORIZON = 482;

// ---------- Phase B: Hang Múa ----------
const B_GROUND = 3520;
const B_FLIGHTS = 30;
const B_GAP = 100;
const B_TOP = B_GROUND - (B_FLIGHTS + 1) * B_GAP;
const GRAVITY = 1300;

/**
 * Ninh Bình — Đò Tràng An & leo Hang Múa.
 *  Phase A: ngồi đò (người lái chèo bằng chân) luồn qua hang, W/S đổi làn, Space cúi người.
 *  Phase B: leo 500 bậc đá Hang Múa lên rồng đá Ngọa Long (platformer).
 */
export class NinhBinhLevel extends BaseLevel {
  constructor() {
    super('NinhBinh');
  }

  buildLevel() {
    createNinhBinhTextures(this);
    canvasTexture(this, 'NinhBinh-icon-cave', 40, 40, (ctx) => {
      ctx.beginPath();
      ctx.moveTo(4, 36);
      ctx.bezierCurveTo(4, 10, 14, 4, 20, 4);
      ctx.bezierCurveTo(28, 4, 36, 10, 36, 36);
      ctx.closePath();
      ctx.fillStyle = '#8f9a92';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3a2a3f';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 36);
      ctx.quadraticCurveTo(20, 16, 28, 36);
      ctx.fillStyle = '#1d2420';
      ctx.fill();
    });
    this.physics.world.gravity.y = 0;
    this.phase = 'A';
    this.dist = 0;
    this.speed = BASE_SPEED;
    this.lane = 1;
    this.duckTimer = 0;
    this.lotus = 0;
    this.wallHits = 0;
    this.otherHits = 0;
    this.falls = 0;
    this.won = false;

    this.layerA = this.add.layer();
    this.buildPhaseA();

    const kb = this.input.keyboard;
    const up = () => this.changeLane(-1);
    const down = () => this.changeLane(1);
    const duck = () => this.duck();
    kb.on('keydown-W', up);
    kb.on('keydown-UP', up);
    kb.on('keydown-S', down);
    kb.on('keydown-DOWN', down);
    kb.on('keydown-SPACE', duck);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown-W', up);
      kb.off('keydown-UP', up);
      kb.off('keydown-S', down);
      kb.off('keydown-DOWN', down);
      kb.off('keydown-SPACE', duck);
    });
  }

  /** Thêm object vào layer của phase A (để xóa gọn khi lên bờ). */
  A(obj) {
    this.layerA.add(obj);
    return obj;
  }

  // ============================================================
  // PHASE A — ĐÒ TRÀNG AN
  // ============================================================
  buildPhaseA() {
    const W = 1280;
    // Phản chiếu núi trên mặt nước
    canvasTexture(this, 'NinhBinh-karst-refl', 1600, 520, (ctx, w, h) => {
      ctx.translate(0, h);
      ctx.scale(1, -1);
      ctx.drawImage(this.textures.get('NinhBinh-karst-near').getSourceImage(), 0, 0);
    });

    this.A(this.add.image(0, 0, 'NinhBinh-sky').setOrigin(0).setDepth(-100));
    const sun = this.A(this.add.image(1040, 150, 'glow-warm').setScale(3.2).setAlpha(0.7).setDepth(-99));
    this.tweens.add({ targets: sun, alpha: 0.5, duration: 3000, yoyo: true, repeat: -1 });
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.A(this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(40, 200), Phaser.Utils.Array.GetRandom(['cloud1', 'cloud2', 'cloud3'])).setDepth(-98).setAlpha(0.9).setScale(Phaser.Math.FloatBetween(0.5, 0.9)));
      c.driftSpeed = Phaser.Math.FloatBetween(4, 10);
      this.clouds.push(c);
    }

    this.farK = this.A(this.add.tileSprite(0, 440, W, 420, 'NinhBinh-karst-far').setOrigin(0, 1).setDepth(-90));
    this.midK = this.A(this.add.tileSprite(0, 452, W, 440, 'NinhBinh-karst-mid').setOrigin(0, 1).setDepth(-80));
    // sương giữa các lớp núi
    for (let i = 0; i < 5; i++) {
      const m = this.A(this.add.image(i * 300, 400, 'glow').setScale(9, 1.6).setAlpha(0.35).setDepth(-79));
      this.tweens.add({ targets: m, x: m.x + 120, duration: Phaser.Math.Between(7000, 11000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.rice = this.A(this.add.tileSprite(0, HORIZON + 2, W, 70, 'NinhBinh-rice').setOrigin(0, 1).setDepth(-75));
    this.nearK = this.A(this.add.tileSprite(0, HORIZON - 30, W, 520, 'NinhBinh-karst-near').setOrigin(0, 1).setDepth(-70));
    this.bankDecor = [];

    this.water = this.A(this.add.tileSprite(0, HORIZON - 6, W, 720 - HORIZON + 6, 'NinhBinh-water').setOrigin(0).setDepth(-60));
    this.refl = this.A(this.add.tileSprite(0, HORIZON - 6, W, 260, 'NinhBinh-karst-refl').setOrigin(0).setDepth(-59).setAlpha(0.18).setTint(0x2f6b5a));
    this.A(
      this.add
        .particles(0, 0, 'spark', {
          x: { min: 0, max: W },
          y: { min: HORIZON + 10, max: 715 },
          scale: { start: 0.45, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 900,
          frequency: 70,
          blendMode: 'ADD',
        })
        .setDepth(-58),
    );

    // Cò bay
    this.herons = [];
    for (let i = 0; i < 3; i++) {
      const h = this.A(this.add.image(Phaser.Math.Between(200, 1200), Phaser.Math.Between(90, 260), 'NinhBinh-heron').setDepth(-85).setScale(Phaser.Math.FloatBetween(0.5, 0.8)));
      this.tweens.add({ targets: h, scaleY: h.scaleY * 0.35, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 120 });
      h.vx = Phaser.Math.FloatBetween(30, 60);
      this.herons.push(h);
    }

    // Hang động: bóng tối, trần thạch nhũ, đèn lồng
    this.darkness = this.A(this.add.rectangle(0, 0, W, 720, 0x0b120f, 0).setOrigin(0).setDepth(-40));
    this.ceiling = this.A(this.add.tileSprite(0, 0, W, 170, 'NinhBinh-ceiling').setOrigin(0).setDepth(-39).setAlpha(0));
    this.caveLights = [];
    this.mouths = [];
    CAVES.forEach((cave) => {
      [cave.start, cave.end].forEach((d, k) => {
        const m = this.A(this.add.image(0, 720, 'NinhBinh-cavemouth').setOrigin(0.5, 1).setDepth(720).setVisible(false).setTint(0x9aa49e));
        m.d = d + (k === 0 ? 180 : -180);
        if (k === 1) m.setFlipX(true);
        this.mouths.push(m);
      });
      for (let d = cave.start + 300; d < cave.end - 200; d += 330) {
        const lamp = this.A(this.add.image(0, 220, 'glow-warm').setScale(1.4).setDepth(-38).setBlendMode('ADD').setVisible(false));
        lamp.d = d;
        this.caveLights.push(lamp);
      }
      cave.label = false;
    });

    // Bờ sông: chùa, tre
    this.decor = [];
    for (let d = 600; d < DIST_A; d += Phaser.Math.Between(900, 1400)) {
      if (CAVES.some((c) => d > c.start - 300 && d < c.end + 300)) continue;
      const t = this.A(this.add.image(0, HORIZON + 4, 'NinhBinh-temple').setOrigin(0.5, 1).setDepth(-65).setScale(0.8));
      t.d = d;
      t.par = 0.75;
      this.decor.push(t);
    }

    this.buildBoat();
    this.buildObstacles();
  }

  buildBoat() {
    const y = LANES[this.lane];
    this.boat = this.A(this.add.container(BOAT_X, y).setDepth(y + 1));
    this.companion = new Companion(this, -70, -12, this.characterKey, { scale: 0.5 });
    this.companion.setOrigin(0.5, 1).playAnim('sit');
    this.player = new Player(this, 20, -12, this.characterKey, { mode: 'none', physics: false, scale: 0.5 });
    this.player.setOrigin(0.5, 1).playAnim('sit');
    this.player.setFlipX(false);
    this.companion.setFlipX(false);
    const hull = this.add.image(0, 18, 'NinhBinh-sampan').setScale(0.9).setOrigin(0.5, 0.75);
    this.rower = this.add.sprite(118, -4, 'NinhBinh-rower', 'r0').setOrigin(0.5, 1).setScale(0.7);
    this.lantern = this.add.image(0, -40, 'glow-warm').setScale(4).setAlpha(0).setBlendMode('ADD');
    this.boat.add([this.lantern, this.companion, this.player, hull, this.rower]);
    // Bóng thoại: companion đang nằm trong container → đổi sang tọa độ màn hình khi nói
    const comp = this.companion;
    const boat = this.boat;
    comp.say = (text, opts) => {
      if (!comp.parentContainer) return Companion.prototype.say.call(comp, text, opts);
      const lx = comp.x;
      const ly = comp.y;
      comp.x = boat.x + lx;
      comp.y = boat.y + ly;
      Companion.prototype.say.call(comp, text, opts);
      comp.x = lx;
      comp.y = ly;
    };
    this.rowT = 0;
    this.wake = this.A(
      this.add
        .particles(0, 0, 'spark', {
          speedX: { min: -160, max: -80 },
          speedY: { min: -10, max: 10 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 700,
          frequency: 45,
          follow: this.boat,
          followOffset: { x: -140, y: 14 },
        })
        .setDepth(y),
    );
  }

  buildObstacles() {
    const rnd = new Phaser.Math.RandomDataGenerator(['ninhbinh-trang-an']);
    this.items = [];
    const inCave = (d) => CAVES.some((c) => d > c.start + 150 && d < c.end - 150);
    let d = 850;
    while (d < DIST_A - 500) {
      if (inCave(d)) {
        if (rnd.frac() < 0.55) this.items.push({ type: 'stal', d, lane: -1 });
        else this.items.push({ type: 'caverock', d, lane: rnd.between(0, 2) });
        d += rnd.between(300, 420);
      } else {
        const r = rnd.frac();
        const type = r < 0.28 ? 'rock' : r < 0.46 ? 'log' : r < 0.62 ? 'ducks' : r < 0.78 ? 'net' : 'tourboat';
        const lane = rnd.between(0, 2);
        this.items.push({ type, d, lane });
        if (type === 'rock' && rnd.frac() < 0.4) this.items.push({ type: 'rock', d: d + 40, lane: (lane + rnd.between(1, 2)) % 3 });
        d += rnd.between(380, 560);
      }
    }
    // 7 bông sen (cần 5), đặt ở làn trống
    const lotusD = [700, 1500, 2150, 4400, 5100, 7900, 8500];
    lotusD.forEach((ld, i) => {
      const busy = this.items.filter((it) => Math.abs(it.d - ld) < 200).map((it) => it.lane);
      let lane = i % 3;
      for (let k = 0; k < 3 && busy.includes(lane); k++) lane = (lane + 1) % 3;
      this.items.push({ type: 'lotus', d: ld, lane });
    });
    this.items.sort((a, b) => a.d - b.d);
  }

  spawnItem(it) {
    const y = it.lane >= 0 ? LANES[it.lane] : 0;
    let s;
    switch (it.type) {
      case 'rock':
      case 'caverock':
        s = this.add.image(0, y + 10, 'NinhBinh-rock').setOrigin(0.5, 1).setScale(it.type === 'caverock' ? 0.85 : 0.75);
        if (it.type === 'caverock') s.setTint(0x8a9a90);
        it.half = 45;
        break;
      case 'log':
        s = this.add.image(0, y + 6, 'NinhBinh-log').setOrigin(0.5, 1).setScale(0.8);
        this.tweens.add({ targets: s, angle: 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        it.half = 55;
        break;
      case 'ducks': {
        s = this.add.container(0, y);
        for (let k = 0; k < 4; k++) {
          const dk = this.add.image(k * 34 - 50, 6 - (k % 2) * 10, 'NinhBinh-duck').setOrigin(0.5, 1).setScale(0.7).setFlipX(true);
          this.tweens.add({ targets: dk, y: dk.y - 3, duration: 500 + k * 70, yoyo: true, repeat: -1 });
          s.add(dk);
        }
        it.half = 60;
        it.vx = -30;
        break;
      }
      case 'net':
        s = this.add.image(0, y + 14, 'NinhBinh-net').setOrigin(0.5, 1).setScale(0.75);
        it.half = 45;
        break;
      case 'tourboat':
        s = this.add.image(0, y + 18, 'NinhBinh-tourboat').setOrigin(0.5, 0.95).setScale(0.75);
        it.half = 95;
        it.vx = -110;
        break;
      case 'stal':
        s = this.add.image(0, 60, 'NinhBinh-stalactite').setOrigin(0.5, 0);
        it.half = 40;
        break;
      case 'lotus': {
        s = this.add.container(0, y + 2);
        const glow = this.add.image(0, -16, 'glow').setScale(0.8).setAlpha(0.45).setBlendMode('ADD');
        const lo = this.add.image(0, 0, 'NinhBinh-lotus').setOrigin(0.5, 1).setScale(0.85);
        s.add([glow, lo]);
        bob(this, lo, { dy: 4 });
        it.half = 40;
        break;
      }
      default:
        return;
    }
    s.setDepth(it.type === 'stal' ? 900 : y);
    it.sprite = this.A(s);
  }

  changeLane(dir) {
    if (this.phase !== 'A' || this.state !== 'play') return;
    this.lane = Phaser.Math.Clamp(this.lane + dir, 0, 2);
  }

  duck() {
    if (this.phase !== 'A' || this.state !== 'play') return;
    if (this.duckTimer > 0) return;
    this.duckTimer = 0.85;
  }

  caveFactor() {
    let f = 0;
    CAVES.forEach((c) => {
      const a = Phaser.Math.Clamp((this.dist - c.start) / 260, 0, 1);
      const b = Phaser.Math.Clamp((c.end - this.dist) / 260, 0, 1);
      f = Math.max(f, Math.min(a, b));
    });
    return f;
  }

  currentCave() {
    return CAVES.find((c) => this.dist > c.start && this.dist < c.end);
  }

  scrollScenery(dx, dt) {
    this.farK.tilePositionX += dx * 0.08;
    this.midK.tilePositionX += dx * 0.2;
    this.rice.tilePositionX += dx * 0.45;
    this.nearK.tilePositionX += dx * 0.5;
    this.refl.tilePositionX += dx * 0.5;
    this.water.tilePositionX += dx * 1;
    this.ceiling.tilePositionX += dx * 1;
    this.clouds.forEach((c) => {
      c.x -= (c.driftSpeed + dx * 0.02 / Math.max(dt, 0.001)) * dt;
      if (c.x < -200) c.x = 1480;
    });
    this.herons.forEach((h) => {
      h.x -= (h.vx + dx * 0.15 / Math.max(dt, 0.001)) * dt * 0.5;
      if (h.x < -100) {
        h.x = 1400;
        h.y = Phaser.Math.Between(90, 260);
      }
    });
  }

  updateIntro(dt) {
    if (this.phase !== 'A') return;
    this.scrollScenery(25 * dt, dt);
    this.updateBoatVisual(dt, 0.6);
  }

  updateBoatVisual(dt, rowRate = 1) {
    const targetY = LANES[this.lane];
    const t = this.time.now / 1000;
    this.boatBaseY = Phaser.Math.Linear(this.boatBaseY ?? targetY, targetY, Math.min(1, dt * 7));
    this.boat.y = this.boatBaseY + Math.sin(t * 2.2) * 3;
    this.boat.angle = Math.sin(t * 1.7) * 1.2;
    this.boat.setDepth(this.boatBaseY + 1);
    this.wake.setDepth(this.boatBaseY);
    // người lái đò đạp chèo bằng chân
    this.rowT += dt * rowRate * (this.speed / BASE_SPEED);
    this.rower.setFrame(Math.floor(this.rowT * 2.4) % 2 === 0 ? 'r0' : 'r1');
    // cúi người
    const ducking = this.duckTimer > 0;
    const sy = ducking ? 0.5 * 0.55 : 0.5;
    this.player.scaleY = Phaser.Math.Linear(this.player.scaleY, sy, 0.35);
    this.companion.scaleY = Phaser.Math.Linear(this.companion.scaleY, sy, 0.35);
    this.rower.scaleY = Phaser.Math.Linear(this.rower.scaleY, ducking ? 0.7 * 0.6 : 0.7, 0.35);
  }

  updatePhaseA(dt) {
    this.duckTimer = Math.max(0, this.duckTimer - dt);
    this.speed = Phaser.Math.Linear(this.speed, BASE_SPEED, Math.min(1, dt * 1.2));
    const dx = this.speed * dt;
    this.dist += dx;
    this.scrollScenery(dx, dt);
    this.updateBoatVisual(dt);

    // Hang động
    const f = this.caveFactor();
    this.darkness.fillAlpha = 0.82 * f;
    this.ceiling.setAlpha(f);
    this.lantern.setAlpha(0.75 * f);
    this.water.setTint(Phaser.Display.Color.GetColor(255 - 150 * f, 255 - 130 * f, 255 - 110 * f));
    const cave = this.currentCave();
    if (cave && !cave.label) {
      cave.label = true;
      this.toast(`${cave.name}`, '#ffd166');
      this.companion.say(cave.name === 'Hang Tối' ? 'Hang Tối đó, cẩn thận nha!' : 'Vào hang rồi, nhớ cúi đầu!', { force: true });
    }
    this.mouths.forEach((m) => {
      const x = BOAT_X + (m.d - this.dist);
      m.setVisible(x > -400 && x < 1700);
      m.x = x;
    });
    this.caveLights.forEach((l) => {
      const x = BOAT_X + (l.d - this.dist);
      l.setVisible(x > -100 && x < 1400);
      l.x = x;
      l.setAlpha((0.5 + Math.sin(this.time.now / 180 + l.d) * 0.15) * f);
    });
    this.decor.forEach((t) => {
      t.x = BOAT_X + (t.d - this.dist) * t.par;
      t.setVisible(t.x > -200 && t.x < 1500);
    });

    // Chướng ngại & sen
    const boatLane = Math.round(Phaser.Math.Clamp((this.boatBaseY - LANES[0]) / 72, 0, 2));
    const laneSettled = Math.abs(this.boatBaseY - LANES[boatLane]) < 30;
    this.items.forEach((it) => {
      if (it.done) return;
      if (it.vx) it.d += it.vx * dt;
      const x = BOAT_X + (it.d - this.dist);
      if (!it.sprite) {
        if (x < 1500) this.spawnItem(it);
        else return;
      }
      it.sprite.x = x;
      if (it.type === 'stal') {
        const tipY = this.boatBaseY - 46;
        it.sprite.setDisplaySize(90, Math.max(60, tipY - 60));
        if (!it.warned && x - BOAT_X < 430 && x > BOAT_X) {
          it.warned = true;
          this.companion.say('Cúi xuống!', { force: true, duration: 900 });
        }
      }
      if (it.type === 'lotus' && !it.warned && x - BOAT_X < 520 && x > BOAT_X + 200) {
        it.warned = true;
        this.companion.say(it.lane < this.lane ? 'Bông sen phía trên kìa!' : it.lane > this.lane ? 'Bông sen phía dưới kìa!' : 'Có bông sen kìa!');
      }
      if (x < -320) {
        it.sprite.destroy();
        it.done = true;
        return;
      }
      if (it.hit) return;
      const overlapX = Math.abs(x - BOAT_X) < it.half + (it.type === 'lotus' ? 70 : it.type === 'stal' ? 20 : 105);
      if (!overlapX) return;
      if (it.type === 'stal') {
        if (this.duckTimer <= 0) this.onHit(it, true);
        else if (!it.passed) {
          it.passed = true;
          floatText(this, BOAT_X, this.boatBaseY - 90, 'Khéo quá!', { color: '#a6ec9b', size: 22 });
        }
        return;
      }
      if (it.lane !== boatLane || !laneSettled) return;
      if (it.type === 'lotus') this.collectLotus(it);
      else this.onHit(it, it.type === 'caverock');
    });

    if (this.dist >= DIST_A) this.dock();
  }

  collectLotus(it) {
    it.hit = true;
    it.done = true;
    this.lotus++;
    burst(this, it.sprite.x, it.sprite.y - 20, { tint: 0xff8fb8, count: 14 });
    floatText(this, it.sprite.x, it.sprite.y - 50, `Sen ${this.lotus}/5`, { color: '#ff8fb8' });
    this.tweens.add({ targets: it.sprite, y: it.sprite.y - 80, alpha: 0, scale: 0.4, duration: 400, onComplete: () => it.sprite.destroy() });
    if (this.lotus === 5) this.companion.say('Đủ 5 bông sen rồi! Thơm quá!', { force: true });
  }

  onHit(it, cave) {
    it.hit = true;
    const msgs = {
      rock: 'Va đá!',
      caverock: 'Va vách hang!',
      stal: 'Đụng thạch nhũ!',
      log: 'Vướng khúc gỗ!',
      ducks: 'Quạc quạc!',
      net: 'Mắc lưới!',
      tourboat: 'Suýt đâm đò!',
    };
    if (cave) this.wallHits++;
    else this.otherHits++;
    this.speed = it.type === 'net' ? 40 : it.type === 'ducks' ? 120 : 70;
    this.player.hurt(900);
    this.cameras.main.shake(180, 0.007);
    floatText(this, BOAT_X, this.boatBaseY - 100, msgs[it.type] ?? 'Ối!', { color: cave ? '#ff6b6b' : '#ffd166' });
    if (it.type === 'ducks') {
      it.sprite.list?.forEach((dk, k) => this.tweens.add({ targets: dk, x: dk.x + (k - 1.5) * 40, y: dk.y - 50, alpha: 0, duration: 600 }));
    } else if (it.type === 'tourboat') {
      this.companion.say('Xin lỗi cô chú nha!');
    }
    if (it.type !== 'ducks' && it.sprite) this.tweens.add({ targets: it.sprite, alpha: 0.5, duration: 200 });
  }

  dock() {
    if (this.phase !== 'A') return;
    this.phase = 'dock';
    this.toast('Lên bờ — leo Hang Múa!', '#ffd166');
    this.companion.say('Leo 500 bậc lên đỉnh nào!', { force: true });
    const cam = this.cameras.main;
    this.time.delayedCall(900, () => {
      cam.fadeOut(450, 20, 12, 34);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.tweens.killAll();
        this.layerA.destroy(true);
        this.layerA = null;
        this.items = [];
        this.buildPhaseB();
        cam.fadeIn(450, 20, 12, 34);
      });
    });
  }

  // ============================================================
  // PHASE B — HANG MÚA
  // ============================================================
  buildPhaseB() {
    this.phase = 'B';
    const W = 1280;
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, -400, W, B_GROUND + 600);
    this.physics.world.checkCollision.down = false;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, B_GROUND + 200);

    // Nền
    this.add.image(0, 0, 'NinhBinh-sky2').setOrigin(0).setScrollFactor(0).setDepth(-100);
    this.add.image(980, 140, 'glow-warm').setScale(4).setAlpha(0.65).setScrollFactor(0).setDepth(-99);
    this.panorama = this.add.image(W / 2, 330, 'NinhBinh-panorama').setScrollFactor(0, 0.22).setOrigin(0.5, 0).setDepth(-90);
    this.cliffBg = this.add.tileSprite(0, 0, W, 720, 'NinhBinh-cliff').setOrigin(0).setScrollFactor(0).setDepth(-80);
    this.sunset = this.add.rectangle(0, 0, W, 720, 0xff9a4a, 0).setOrigin(0).setScrollFactor(0).setDepth(-70);
    this.add.tileSprite(0, 0, 130, B_GROUND + 200, 'NinhBinh-cliff').setOrigin(0).setDepth(-60).setTint(0x8aa190);
    this.add.tileSprite(W - 130, 0, 130, B_GROUND + 200, 'NinhBinh-cliff').setOrigin(0).setDepth(-60).setTint(0x8aa190);
    for (let i = 0; i < 8; i++) {
      const m = this.add.image(Phaser.Math.Between(0, W), B_GROUND - i * 420, 'glow').setScale(9, 1.8).setAlpha(0.3).setDepth(40);
      this.tweens.add({ targets: m, x: m.x + 160, duration: Phaser.Math.Between(8000, 12000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.herons = [];
    for (let i = 0; i < 3; i++) {
      const h = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(80, 300), 'NinhBinh-heron').setScrollFactor(0).setDepth(-75).setScale(0.6);
      this.tweens.add({ targets: h, scaleY: 0.2, duration: 400, yoyo: true, repeat: -1 });
      h.vx = Phaser.Math.FloatBetween(30, 55);
      this.herons.push(h);
    }

    this.buildStairs();

    // Người chơi (platformer)
    const start = this.checkpoints[0];
    this.player = new Player(this, start.x - 60, start.y - 60, this.characterKey, { mode: 'platformer', scale: 0.6 });
    this.player.setDepth(30);
    this.physics.add.collider(this.player, this.platforms, (p, plat) => this.onLand(plat), (p, plat) => p.body.velocity.y >= 0 && p.body.bottom <= plat.body.top + 16);
    cam.startFollow(this.player, true, 0.1, 0.1, 0, 80);
    cam.setDeadzone(200, 120);

    this.companion = new Companion(this, start.x + 60, start.y, this.characterKey, { scale: 0.6 });
    this.companion.setOrigin(0.5, 1).setDepth(29);
    this.companionAt = 0;
    this.respawn = { x: start.x - 60, y: start.y - 60 };
    this.cpIndex = 0;

    this.stones = this.physics.add.group({ bounceY: 0.45, bounceX: 0.2 });
    this.physics.add.collider(this.stones, this.platforms);
    this.physics.add.overlap(this.player, this.stones, (p, st) => this.hitByStone(st));
    this.stoneTimer = 3;
    this.toast('Hang Múa — 500 bậc đá', '#ffffff');
  }

  buildStairs() {
    this.platforms = this.physics.add.staticGroup();
    this.checkpoints = [];
    this.goats = [];
    this.tourists = [];

    const addPlat = (x, top, key, opts = {}) => {
      const p = this.platforms.create(x, top, key).setOrigin(0.5, 0);
      p.refreshBody();
      if (key === 'NinhBinh-landing') {
        p.body.setSize(270, 20, false).setOffset(15, 26);
      } else {
        p.body.setSize(170, 20, false).setOffset(10, 16);
      }
      p.setDepth(10);
      if (opts.flip) p.setFlipX(true);
      if (opts.moss) {
        p.setTint(0x9fd59a);
        p.mossy = true;
      }
      return p;
    };

    // Chân núi
    const ground = addPlat(330, B_GROUND - 26, 'NinhBinh-landing');
    ground.landingIndex = 0;
    this.checkpoints.push(this.makeCheckpoint(330, B_GROUND, 0));

    let x = 330;
    let dir = 1;
    let sinceLanding = 0;
    for (let i = 1; i <= B_FLIGHTS; i++) {
      const top = B_GROUND - i * B_GAP;
      sinceLanding++;
      let nx = x + dir * 195;
      if (nx > 1050 || nx < 230) {
        dir *= -1;
        nx = x + dir * 195;
      }
      if (sinceLanding >= 6 && i < B_FLIGHTS) {
        // chiếu nghỉ + đổi hướng
        const p = addPlat(nx, top - 20, 'NinhBinh-landing');
        p.landingIndex = this.checkpoints.length;
        this.checkpoints.push(this.makeCheckpoint(nx, top + 6, this.checkpoints.length));
        if (this.checkpoints.length % 2 === 0) this.addGoat(p, nx, top + 6, 120);
        sinceLanding = 0;
        dir *= -1;
        x = nx;
        continue;
      }
      const moss = i % 7 === 3;
      const p = addPlat(nx, top, 'NinhBinh-steps', { flip: dir < 0, moss });
      if (i % 9 === 5) this.addTourist(p, nx, top + 16);
      else if (i % 11 === 8) this.addGoat(p, nx, top + 16, 70);
      x = nx;
    }

    // Đỉnh Ngọa Long
    const sx = 640;
    const sy = B_TOP;
    const summit = this.platforms.create(sx, sy, 'pixel').setOrigin(0.5, 0).setVisible(false);
    summit.setDisplaySize(380, 20);
    summit.refreshBody();
    this.dragon = this.add.image(sx + 40, sy + 70, 'NinhBinh-dragon').setOrigin(0.5, 1).setDepth(8);
    this.add.image(sx + 40, sy - 60, 'glow-warm').setScale(3).setAlpha(0.45).setDepth(7).setBlendMode('ADD');
    this.summitPos = { x: sx, y: sy };
    // bậc nối lên đỉnh
    const lastTop = B_GROUND - B_FLIGHTS * B_GAP;
    if (Math.abs(x - sx) > 230) addPlat((x + sx) / 2, lastTop - 66, 'NinhBinh-steps', { flip: sx < x });
  }

  makeCheckpoint(x, y, index) {
    const flag = this.add.image(x - 110, y - 22, 'NinhBinh-flag').setOrigin(0.2, 1).setDepth(9).setScale(0.8);
    if (index > 0) flag.setTint(0x9a9a9a);
    return { x, y, flag, index, active: index === 0 };
  }

  addGoat(plat, x, y, range) {
    const g = this.add.image(x, y, 'NinhBinh-goat').setOrigin(0.5, 1).setScale(0.75).setDepth(25);
    g.minX = x - range;
    g.maxX = x + range;
    g.vx = 90;
    g.cool = 0;
    this.goats.push(g);
  }

  addTourist(plat, x, y) {
    const t = this.add.image(x + 30, y, 'NinhBinh-tourist').setOrigin(0.5, 1).setScale(0.7).setDepth(24);
    this.tweens.add({ targets: t, scaleY: 0.72, duration: 700, yoyo: true, repeat: -1 });
    this.tourists.push(t);
  }

  onLand(plat) {
    if (plat.landingIndex != null) {
      const cp = this.checkpoints[plat.landingIndex];
      if (cp && !cp.active) {
        cp.active = true;
        cp.flag.clearTint();
        this.tweens.add({ targets: cp.flag, scaleY: 1, duration: 300, ease: 'Back.Out' });
        this.respawn = { x: cp.x, y: cp.y - 70 };
        this.cpIndex = cp.index;
        floatText(this, cp.x, cp.y - 90, 'Chiếu nghỉ!', { color: '#a6ec9b', size: 24 });
        this.moveCompanion();
      }
    }
    this.onMoss = !!plat.mossy;
  }

  moveCompanion() {
    const next = this.checkpoints[this.cpIndex + 1];
    const target = next ? { x: next.x + 50, y: next.y } : { x: this.summitPos.x - 90, y: this.summitPos.y };
    this.companion.cheer();
    this.companion.playAnim('jump');
    this.tweens.add({ targets: this.companion, x: target.x, duration: 900, ease: 'Sine.InOut' });
    this.tweens.add({
      targets: this.companion,
      y: { from: this.companion.y, to: target.y },
      duration: 900,
      ease: 'Quad.Out',
      onComplete: () => this.companion.playAnim('idle'),
    });
  }

  hitByStone(st) {
    if (st.hitDone) return;
    st.hitDone = true;
    if (this.player.hurt(900)) {
      this.player.body.setVelocity(st.body.velocity.x > 0 ? 260 : -260, -320);
      floatText(this, this.player.x, this.player.y - 60, 'Đá lăn!', { color: '#ff6b6b' });
      this.otherHits++;
    }
  }

  updatePhaseB(dt) {
    const p = this.player;
    const prevVx = p.body.velocity.x;
    p.update(this.inputManager, dt);
    // Bậc rêu trơn: giữ quán tính
    const onGround = p.body.blocked.down || p.body.touching.down;
    if (onGround && this.onMoss) {
      p.body.setVelocityX(Phaser.Math.Linear(prevVx, p.body.velocity.x, 0.05));
      if (!this.mossHint) {
        this.mossHint = true;
        this.companion.say('Bậc rêu trơn lắm!', { force: true });
      }
    }
    if (!onGround) this.onMoss = false;

    const cam = this.cameras.main;
    const progress = this.climbProgress();
    this.cliffBg.tilePositionY = cam.scrollY * 0.45;
    this.cliffBg.setAlpha(Phaser.Math.Clamp(1.15 - progress * 1.3, 0, 1));
    this.sunset.fillAlpha = this.reachedTop ? this.sunset.fillAlpha : progress * 0.16;
    this.herons.forEach((h) => {
      h.x -= h.vx * dt;
      if (h.x < -80) h.x = 1360;
    });

    // Dê núi húc
    this.goats.forEach((g) => {
      g.cool = Math.max(0, g.cool - dt);
      g.x += g.vx * dt;
      if (g.x > g.maxX || g.x < g.minX) {
        g.vx *= -1;
        g.x = Phaser.Math.Clamp(g.x, g.minX, g.maxX);
      }
      g.setFlipX(g.vx < 0);
      if (g.cool <= 0 && Math.abs(g.x - p.x) < 40 && Math.abs(g.y - 30 - p.y) < 50) {
        g.cool = 1.5;
        if (p.hurt(900)) {
          p.body.setVelocity(g.vx > 0 ? 300 : -300, -380);
          floatText(this, p.x, p.y - 60, 'Dê húc!', { color: '#ffd166' });
          this.otherHits++;
        }
      }
    });
    // Du khách đứng chắn đường
    this.tourists.forEach((t) => {
      if (Math.abs(t.x - p.x) < 26 && p.y > t.y - 70 && p.y < t.y + 10) {
        p.x += p.x < t.x ? -6 : 6;
        p.body.setVelocityX(0);
        if (!t.said) {
          t.said = true;
          floatText(this, t.x, t.y - 80, 'Cho mình qua với!', { color: '#ffffff', size: 18 });
        }
      }
    });

    // Đá lăn từ trên xuống
    this.stoneTimer -= dt;
    if (this.stoneTimer <= 0 && !this.reachedTop) {
      this.stoneTimer = Phaser.Math.FloatBetween(2.2, 3.4);
      const sx = Phaser.Math.Clamp(p.x + Phaser.Math.Between(-260, 260), 180, 1100);
      const warn = this.add.text(sx, cam.scrollY + 40, '!', { fontFamily: '"Baloo 2", sans-serif', fontSize: '40px', fontStyle: '800', color: '#ff6b6b', stroke: '#3a2a3f', strokeThickness: 6 }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: warn, alpha: 0, duration: 200, yoyo: true, repeat: 2, onComplete: () => warn.destroy() });
      this.time.delayedCall(650, () => {
        if (this.phase !== 'B' || this.state !== 'play') return;
        const st = this.stones.create(sx, this.cameras.main.scrollY - 30, 'NinhBinh-boulder').setDepth(28);
        st.body.setCircle(18, 4, 4);
        st.setVelocityX(Phaser.Math.Between(-140, 140));
        st.setAngularVelocity(Phaser.Math.Between(-300, 300));
      });
    }
    this.stones.getChildren().forEach((st) => {
      if (st.y > cam.scrollY + 900) st.destroy();
    });

    // Té xuống
    const cp = this.checkpoints[this.cpIndex];
    if (p.y > cp.y + 420 && !this.respawning) {
      this.respawning = true;
      this.falls++;
      floatText(this, p.x, cam.scrollY + 300, 'Té rồi!', { color: '#ff6b6b' });
      cam.flash(200, 255, 255, 255);
      p.setPosition(this.respawn.x, this.respawn.y);
      p.body.setVelocity(0, 0);
      this.time.delayedCall(300, () => (this.respawning = false));
    }

    // Lên tới rồng đá
    if (!this.reachedTop && Math.abs(p.x - this.summitPos.x) < 170 && p.y < this.summitPos.y + 10 && onGround) {
      this.reachedTop = true;
      p.celebrate();
      this.tweens.killTweensOf(this.companion);
      this.companion.setPosition(p.x - 80, this.summitPos.y);
      this.companion.playAnim('cheer');
      burst(this, this.companion.x, this.companion.y - 40, { texture: 'heart', count: 8, scale: 0.5 });
      this.companion.say('Đẹp quá! Cả Tam Cốc dưới chân mình!', { force: true, duration: 2200 });
      this.tweens.add({ targets: this.sunset, fillAlpha: 0.32, duration: 900 });
      burst(this, this.dragon.x, this.dragon.y - 140, { texture: 'glow-warm', count: 10, scale: 0.5, speed: 120 });
      this.time.delayedCall(1000, () => (this.won = true));
    }
  }

  climbProgress() {
    if (this.phase !== 'B') return 0;
    return Phaser.Math.Clamp((B_GROUND - this.player.y) / (B_GROUND - B_TOP), 0, 1);
  }

  // ============================================================
  updateLevel(dt) {
    if (this.phase === 'A') this.updatePhaseA(dt);
    else if (this.phase === 'B') this.updatePhaseB(dt);
  }

  isWin() {
    return this.won;
  }

  isLose() {
    if (this.timeLeft <= 0) this.loseReason = this.phase === 'B' ? 'Trời tối rồi, chưa lên tới đỉnh Ngọa Long!' : 'Hết giờ, đò chưa tới bến!';
    return false;
  }

  getStars() {
    return 1 + (this.wallHits === 0 ? 1 : 0) + (this.lotus >= 5 ? 1 : 0);
  }

  getHudState() {
    const a = Phaser.Math.Clamp(this.dist / DIST_A, 0, 1);
    const overall = this.phase === 'A' || this.phase === 'dock' ? a * 0.55 : 0.55 + this.climbProgress() * 0.45;
    const counters = [
      { key: 'lotus', icon: 'NinhBinh-lotus', value: this.lotus, max: 5 },
      { key: 'wall', icon: 'NinhBinh-icon-cave', value: this.wallHits },
    ];
    let hint = 'W/S đổi làn · Space cúi người · hái sen trên sông';
    if (this.phase === 'A' && this.caveFactor() > 0.3) hint = 'Trong hang — Space để cúi khi gặp thạch nhũ!';
    if (this.phase === 'B') {
      const steps = Math.round(this.climbProgress() * 500);
      counters.push({ key: 'steps', icon: '⛰', value: steps, max: 500 });
      hint = this.reachedTop ? 'Rồng đá Ngọa Long!' : `A/D di chuyển · Space nhảy · né dê núi & đá lăn — bậc ${steps}/500`;
    }
    return {
      bars: [{ key: 'trip', label: 'Hành trình', value: overall * 100, max: 100, color: '#c9a227' }],
      counters,
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Bông sen: ${this.lotus}/5 · Va vách hang: ${this.wallHits}`, `Té trên Hang Múa: ${this.falls}`];
  }
}
