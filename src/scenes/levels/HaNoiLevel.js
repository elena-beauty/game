import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createHaNoiTextures, STALLS } from '../../art/levels/HaNoiArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';

const W = 1280;
const H = 2700;
const LAKE_BOTTOM = 560;
const LEFT = 140;
const RIGHT = 1140;
const LANE_H = 80;

// Bố cục từ trên xuống: hồ → đường → vỉa hè → ...
const ROWS = [
  { type: 'street', y0: 670, lanes: 3 },
  { type: 'side', y0: 910, y1: 1170, market: true, stalls: [[3, 'right']] },
  { type: 'street', y0: 1170, lanes: 2 },
  { type: 'side', y0: 1330, y1: 1570, stalls: [[1, 'right'], [2, 'left']] },
  { type: 'street', y0: 1570, lanes: 3 },
  { type: 'side', y0: 1810, y1: 2050, stalls: [[0, 'left']] },
  { type: 'street', y0: 2050, lanes: 2 },
  { type: 'side', y0: 2210, y1: H, start: true },
];

// Hà Nội — Phố cổ & qua đường. Xem CHALLENGES.md mục 1.
export class HaNoiLevel extends BaseLevel {
  constructor() {
    super('HaNoi');
  }

  buildLevel() {
    createHaNoiTextures(this);
    this.physics.world.setBounds(LEFT, 0, RIGHT - LEFT, H);
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor('#1b1530');

    this.walls = this.physics.add.staticGroup();
    this.buildLake();
    this.buildPromenade();
    this.lanes = [];
    this.sideRows = [];
    this.stalls = [];
    ROWS.forEach((r) => (r.type === 'street' ? this.buildStreet(r) : this.buildSide(r)));

    // Người chơi + bạn đồng hành
    this.player = new Player(this, 640, H - 140, this.characterKey, { mode: 'topdown', scale: 0.55 });
    this.player.body.setSize(50, 36).setOffset(23, 88);
    this.physics.add.collider(this.player, this.walls);
    this.companion = new Companion(this, 590, H - 110, this.characterKey, { scale: 0.55 });
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 60);

    this.loveHearts = this.add
      .particles(0, 0, 'heart', { speedY: { min: -60, max: -30 }, scale: { start: 0.35, end: 0.1 }, alpha: { start: 1, end: 0 }, lifespan: 1200, frequency: 500 })
      .setDepth(H + 10);

    // Xe cộ & người đi đường
    this.vehicles = this.physics.add.group({ allowGravity: false });
    this.movers = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.vehicles, (_p, v) => this.hitVehicle(v));
    this.physics.add.overlap(this.player, this.movers, (_p, m) => this.hitMover(m));

    // Bong bóng phím E
    this.eKey = this.add.image(0, 0, 'HaNoi-ekey').setDepth(H + 20).setVisible(false).setScale(0.8);
    this.tweens.add({ targets: this.eKey, scale: 0.92, duration: 400, yoyo: true, repeat: -1 });

    // Đêm: viền tối
    this.add.image(0, 0, 'HaNoi-vignette').setOrigin(0).setScrollFactor(0).setDepth(H + 50);

    // Xe chạy sẵn trên đường từ đầu
    this.lanes.forEach((ln) => {
      for (let x = 100 + Math.random() * 300; x < W; x += Phaser.Math.Between(380, 620)) this.spawnVehicle(ln, x);
    });

    this.conn = 100;
    this.minConn = 100;
    this.foods = 0;
    this.closeCalls = 0;
    this.hits = 0;
    this.bumps = 0;
    this.pushV = 0;
    this.pushX = 0;
    this.crowdSlow = 0;
    this.bumpCool = 0;
    this.callCool = 0;
    this.boost = 0;
    this.stillTime = 0;
    this.gateOpen = false;
    // Dùng sự kiện keydown để không lỡ phím nhấn nhanh khi FPS thấp
    this.wantBuy = false;
    this.wantCall = false;
    this.input.keyboard.on('keydown-E', () => (this.wantBuy = true));
    this.input.keyboard.on('keydown-SPACE', () => (this.wantCall = true));
  }

  // ---------- Dựng cảnh ----------
  buildLake() {
    this.lake = this.add.tileSprite(0, 0, W, LAKE_BOTTOM, 'HaNoi-lake').setOrigin(0);
    // phản chiếu ánh đèn trên mặt hồ
    this.add.particles(0, 0, 'spark', {
      x: { min: 0, max: W },
      y: { min: 40, max: LAKE_BOTTOM - 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffd166, 0xff8fa3, 0xffffff],
      lifespan: 1400,
      frequency: 60,
      blendMode: 'ADD',
    });
    this.add.image(320, 260, 'HaNoi-turtle').setScale(1.1);
    this.add.image(320, 300, 'glow-warm').setScale(2.2).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(640, 110, 'HaNoi-temple');
    this.add.image(640, 120, 'glow-warm').setScale(4).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(640, 200 + (LAKE_BOTTOM - 200) / 2, 'HaNoi-bridge').setDisplaySize(150, LAKE_BOTTOM - 180);
    // Đèn lồng dọc cầu
    for (let y = 240; y < LAKE_BOTTOM; y += 70) {
      [575, 705].forEach((x) => {
        this.add.image(x, y, 'glow-warm').setScale(0.7).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
      });
    }
    // Bờ hồ đá + liễu
    this.add.rectangle(0, LAKE_BOTTOM - 8, W, 16, 0xa8a29e).setOrigin(0).setStrokeStyle(2, 0x3a2a3f);
    [180, 420, 860, 1100].forEach((x) => this.add.image(x, LAKE_BOTTOM - 30, 'HaNoi-willow').setDepth(LAKE_BOTTOM + 200).setAlpha(0.95));
    // Va chạm: chỉ đi được trên cầu
    const block = (x, y, w, h) => {
      const r = this.add.rectangle(x, y, w, h).setOrigin(0);
      this.physics.add.existing(r, true);
      this.walls.add(r);
    };
    block(0, 0, 578, LAKE_BOTTOM);
    block(702, 0, W - 702, LAKE_BOTTOM);
    block(0, 0, W, 190);
  }

  buildPromenade() {
    this.add.tileSprite(0, LAKE_BOTTOM, W, 110, 'HaNoi-brick').setOrigin(0).setTint(0xb7a8c8);
    this.add.tileSprite(0, LAKE_BOTTOM + 100, W, 10, 'HaNoi-curb').setOrigin(0);
    // Dây chắn lối lên cầu (mở khi mua đủ món)
    this.gateParts = [];
    [585, 640, 695].forEach((x) => this.gateParts.push(this.add.image(x, LAKE_BOTTOM + 14, 'HaNoi-post').setDepth(LAKE_BOTTOM + 40)));
    const rope = this.add.graphics().setDepth(LAKE_BOTTOM + 39);
    rope.lineStyle(4, 0xef4444, 1);
    rope.beginPath();
    rope.moveTo(585, LAKE_BOTTOM + 4);
    rope.lineTo(640, LAKE_BOTTOM + 12);
    rope.lineTo(695, LAKE_BOTTOM + 4);
    rope.strokePath();
    this.gateParts.push(rope);
    const sign = this.add
      .text(640, LAKE_BOTTOM + 52, 'Mua đủ 4 món rồi mới ra cầu nhé!', { fontFamily: '"Baloo 2", sans-serif', fontSize: '20px', fontStyle: '800', color: '#ffd166', stroke: '#3a2a3f', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(LAKE_BOTTOM + 41);
    this.gateParts.push(sign);
    this.gate = this.add.rectangle(640, LAKE_BOTTOM + 10, 140, 30);
    this.physics.add.existing(this.gate, true);
    this.walls.add(this.gate);
    // Đèn lồng dọc bờ hồ
    this.lanternString(LAKE_BOTTOM + 30, 0);
  }

  buildStreet(r) {
    const y1 = r.y0 + r.lanes * LANE_H;
    for (let i = 0; i < r.lanes; i++) {
      const y = r.y0 + i * LANE_H;
      this.add.tileSprite(0, y, W, LANE_H, 'HaNoi-road').setOrigin(0);
      const dir = (i + r.y0 / 10) % 2 < 1 ? 1 : -1;
      const fast = Phaser.Math.Between(170, 320);
      this.lanes.push({ y: y + LANE_H / 2, dir, speed: fast, timer: Phaser.Math.FloatBetween(0.5, 2), cyclo: i === 1 || r.lanes === 2 });
    }
    // vạch qua đường
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.35);
    for (let y = r.y0 + 6; y < y1 - 6; y += 22) g.fillRect(860, y, 120, 12);
    this.add.tileSprite(0, r.y0 - 4, W, 10, 'HaNoi-curb').setOrigin(0);
  }

  buildSide(r) {
    const h = r.y1 - r.y0;
    this.add.tileSprite(0, r.y0, W, h, 'HaNoi-brick').setOrigin(0).setTint(0xa898c0);
    // Nhà ống hai bên
    this.add.tileSprite(0, r.y0, 140, h, 'HaNoi-houses').setOrigin(0).setDepth(r.y1 + 100);
    this.add.tileSprite(W - 140, r.y0, 140, h, 'HaNoi-houses').setOrigin(0).setFlipX(true).setDepth(r.y1 + 100);
    // Đèn đường
    [190, 1090].forEach((x) => {
      this.add.image(x, r.y0 + h / 2, 'glow-warm').setScale(3).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
      this.add.image(x, r.y0 + h / 2, 'HaNoi-lamp').setDepth(r.y0 + h / 2);
    });
    this.lanternString(r.y0 + 26, r.y0);
    if (!r.start) this.lanternString(r.y1 - 30, r.y0 + 1);

    (r.stalls ?? []).forEach(([idx, side]) => {
      const x = side === 'left' ? 290 : 990;
      const y = r.y0 + h / 2 + 10;
      const img = this.add.image(x, y, `HaNoi-stall-${idx}`).setDepth(y + 60);
      const body = this.add.rectangle(x, y + 50, 160, 40);
      this.physics.add.existing(body, true);
      this.walls.add(body);
      // khói bếp
      this.add
        .particles(x, y - 20, 'spark', { speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 }, scale: { start: 0.6, end: 1.4 }, alpha: { start: 0.35, end: 0 }, lifespan: 1500, frequency: 220 })
        .setDepth(y + 61);
      this.add.image(x, y + 10, 'glow-warm').setScale(2.6).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 59);
      this.stalls.push({ ...STALLS[idx], idx, x, y, img, bought: false });
    });

    if (r.start) {
      this.add.text(640, H - 40, 'Phố Cổ Hà Nội', { fontFamily: '"Baloo 2", sans-serif', fontSize: '30px', fontStyle: '800', color: '#ffd166', stroke: '#3a2a3f', strokeThickness: 6 }).setOrigin(0.5).setDepth(H);
    }
    this.sideRows.push({ ...r, timer: Phaser.Math.FloatBetween(0.3, 1.5) });
  }

  /** Dây đèn lồng giăng ngang phố. */
  lanternString(y, seed) {
    const g = this.add.graphics().setDepth(y + 300);
    g.lineStyle(2, 0x3a2a3f, 0.8);
    g.beginPath();
    for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin((x / W) * Math.PI * 4) * 6);
    g.strokePath();
    let k = seed % 4;
    for (let x = 150; x < W - 140; x += 66) {
      const ly = y + Math.sin((x / W) * Math.PI * 4) * 6 + 18;
      const glow = this.add.image(x, ly, 'glow-warm').setScale(0.9).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 301);
      const l = this.add.image(x, ly, `HaNoi-lantern-${k++ % 4}`).setDepth(y + 302);
      this.tweens.add({ targets: l, angle: { from: -6, to: 6 }, duration: Phaser.Math.Between(1200, 1800), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: glow, alpha: 0.3, duration: Phaser.Math.Between(400, 900), yoyo: true, repeat: -1 });
    }
  }

  // ---------- Xe cộ / người đi đường ----------
  spawnVehicle(ln, x = null) {
    const cyclo = ln.cyclo && Math.random() < 0.25;
    const key = cyclo ? 'HaNoi-cyclo' : `HaNoi-bike-${Phaser.Math.Between(0, 4)}`;
    const startX = x ?? (ln.dir > 0 ? -120 : W + 120);
    const v = this.vehicles.create(startX, ln.y - 14, key).setFlipX(ln.dir < 0);
    v.setScale(cyclo ? 0.8 : 0.85);
    v.body.setSize(v.width * 0.62, 30).setOffset(v.width * 0.19, v.height - 42);
    v.setVelocityX(ln.dir * (cyclo ? 110 : ln.speed * Phaser.Math.FloatBetween(0.85, 1.2)));
    v.setDepth(ln.y + 20);
    v.side = Math.sign(v.x - (this.player?.x ?? 0));
    v.kind = cyclo ? 'cyclo' : 'bike';
    // lắc nhẹ như đang chạy
    this.tweens.add({ targets: v, y: v.y - 2, duration: 120, yoyo: true, repeat: -1 });
  }

  spawnMover(row) {
    const pool = row.market ? ['walker', 'walker', 'walker', 'vendor', 'dog'] : row.start ? ['walker', 'walker', 'cart'] : ['cart', 'vendor', 'dog', 'walker', 'walker'];
    const kind = Phaser.Utils.Array.GetRandom(pool);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = Phaser.Math.Between(row.y0 + 70, (row.y1 ?? H) - 50);
    const key = kind === 'walker' ? `HaNoi-walker-${Phaser.Math.Between(0, 5)}` : `HaNoi-${kind}`;
    const m = this.movers.create(dir > 0 ? LEFT - 60 : RIGHT + 60, y, key).setFlipX(dir < 0);
    const speed = { walker: Phaser.Math.Between(45, 90), vendor: 60, cart: 55, dog: 230 }[kind];
    if (kind === 'walker') m.setScale(0.9);
    if (kind === 'cart' || kind === 'vendor') m.setScale(0.8);
    if (kind === 'dog') m.setScale(0.8);
    m.body.setSize(m.width * 0.6, 26).setOffset(m.width * 0.2, m.height - 34);
    m.setVelocityX(dir * speed);
    m.kind = kind;
    m.setDepth(y + 20);
    this.tweens.add({ targets: m, y: y - (kind === 'dog' ? 6 : 3), duration: kind === 'dog' ? 110 : 260, yoyo: true, repeat: -1 });
    if (kind === 'dog') floatText(this, m.x + dir * 60, y - 50, 'Gâu gâu!', { color: '#ffd166', size: 20 });
  }

  hitVehicle(v) {
    if (this.state !== 'play') return;
    if (this.player.hurt(1100)) {
      this.hits++;
      this.closeCalls++;
      this.pushV = 560;
      this.pushX = Math.sign(v.body.velocity.x) * 260;
      burst(this, this.player.x, this.player.y - 20, { count: 16, tint: 0xffd166, speed: 220, depth: H + 30 });
      floatText(this, this.player.x, this.player.y - 70, v.kind === 'cyclo' ? 'Bị xích lô quẹt!' : 'Bị xe máy quẹt!', { color: '#ff8080', size: 24, depth: H + 30 });
      this.companion.say('Cẩn thận!!', { force: true });
    }
  }

  hitMover(m) {
    if (this.state !== 'play') return;
    if (m.kind === 'walker') {
      this.crowdSlow = 0.2;
      return;
    }
    if (m.kind === 'dog') {
      if (this.player.hurt(900)) {
        this.pushV = 380;
        this.pushX = Math.sign(this.player.x - m.x) * 200;
        floatText(this, this.player.x, this.player.y - 70, 'Gâu! Chó đuổi!', { color: '#ffd166', size: 24, depth: H + 30 });
      }
      return;
    }
    if (this.bumpCool > 0) return;
    this.bumpCool = 1;
    this.bumps++;
    this.pushV = 300;
    this.crowdSlow = 0.8;
    this.player.setTint(0xffd0a0);
    this.time.delayedCall(300, () => !this.player.invulnerable && this.player.clearTint());
    floatText(this, this.player.x, this.player.y - 70, m.kind === 'cart' ? 'Ối, xe đẩy!' : 'Xin lỗi cô ạ!', { color: '#ffe7a3', size: 22, depth: H + 30 });
  }

  onPlayStart() {
    this.wantCall = false;
    this.wantBuy = false;
    this.companion.say('Danh sách món ngon đây!', { force: true });
  }

  // ---------- Vòng lặp ----------
  updateLevel(dt) {
    const p = this.player;
    const c = this.companion;
    const input = this.inputManager;
    this.lake.tilePositionX += dt * 10;

    // Spawn xe
    this.lanes.forEach((ln) => {
      ln.timer -= dt;
      if (ln.timer <= 0) {
        ln.timer = Phaser.Math.FloatBetween(1.3, 3.0) * (260 / ln.speed);
        this.spawnVehicle(ln);
      }
    });
    this.sideRows.forEach((r) => {
      r.timer -= dt;
      if (r.timer <= 0) {
        r.timer = r.market ? Phaser.Math.FloatBetween(0.5, 1.1) : Phaser.Math.FloatBetween(2.2, 4);
        this.spawnMover(r);
      }
    });

    // Suýt va: xe vượt ngang qua sát người chơi
    this.vehicles.getChildren().forEach((v) => {
      const side = Math.sign(v.x - p.x);
      if (side !== v.side && v.side !== 0 && !v.counted) {
        const dy = Math.abs(v.body.center.y - p.body.center.y);
        if (dy < 62 && !p.invulnerable) {
          v.counted = true;
          this.closeCalls++;
          floatText(this, p.x, p.y - 70, 'Suýt va!', { color: '#ffb347', size: 26, depth: H + 30 });
          this.cameras.main.shake(120, 0.004);
        }
      }
      v.side = side;
      if (v.x < -220 || v.x > W + 220) v.destroy();
    });
    this.movers.getChildren().forEach((m) => {
      if (m.x < LEFT - 120 || m.x > RIGHT + 120) m.destroy();
    });

    // Di chuyển
    let speedMul = input.isDown('secondary') ? 1.5 : 1;
    this.crowdSlow -= dt;
    this.bumpCool -= dt;
    if (this.crowdSlow > 0) speedMul *= 0.55;
    p.update(input, dt, { speedMul });
    if (this.pushV > 1 || Math.abs(this.pushX) > 1) {
      p.body.velocity.y += this.pushV;
      p.body.velocity.x += this.pushX;
      this.pushV *= Math.pow(0.03, dt);
      this.pushX *= Math.pow(0.03, dt);
    }
    // Đứng khựng giữa đường → bị bấm còi
    const inStreet = this.lanes.some((ln) => Math.abs(p.y - ln.y) < LANE_H / 2);
    this.stillTime = inStreet && p.body.velocity.lengthSq() < 10 ? this.stillTime + dt : 0;
    if (this.stillTime > 1.2) {
      this.stillTime = 0;
      floatText(this, p.x + Phaser.Math.Between(-80, 80), p.y - 90, 'Bíp bíp!', { color: '#ffffff', size: 22, depth: H + 30 });
    }

    // Gọi to (Space): người kia chạy nhanh lại
    this.callCool -= dt;
    if (this.wantCall && this.callCool <= 0) {
      this.callCool = 4;
      this.boost = 2;
      floatText(this, p.x, p.y - 80, 'Ơi! Lại đây!', { color: '#ffd1e8', size: 22, depth: H + 30 });
      c.say(c.key === 'wife' ? 'Em tới đây!' : 'Anh tới đây!', { force: true });
    }
    this.wantCall = false;
    this.boost -= dt;
    this.updateCompanion(dt);

    // Thanh kết nối
    const d = Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y);
    if (d > 200) this.conn -= (4 + ((d - 200) / 100) * 9) * dt;
    else this.conn = Math.min(100, this.conn + 10 * dt);
    this.conn = Math.max(0, this.conn);
    this.minConn = Math.min(this.minConn, this.conn);
    if (d > 320 && Math.random() < dt * 0.6) c.say(Phaser.Utils.Array.GetRandom(['Đợi với!', 'Đi chậm thôi!', 'Ơi, đâu rồi?']));
    this.loveHearts.setPosition((p.x + c.x) / 2, (p.y + c.y) / 2 - 50);
    this.loveHearts.emitting = d < 90;

    this.updateStalls();
  }

  updateCompanion(dt) {
    const p = this.player;
    const c = this.companion;
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = p.x + (dx / len) * 55;
    const ty = p.y + (dy / len) * 45;
    const mx = tx - c.x;
    const my = ty - c.y;
    const dist = Math.hypot(mx, my);
    const maxSpeed = p.speed * (this.boost > 0 ? 1.4 : 0.76);
    if (dist > 6) {
      const step = Math.min(dist, maxSpeed * dt);
      c.x += (mx / dist) * step;
      c.y += (my / dist) * step;
      if (Math.abs(mx) > 2) c.setFlipX(mx < 0);
      c.playAnim(this.boost > 0 ? 'run' : 'walk');
    } else c.playAnim('idle');
    c.setDepth(c.y);
  }

  updateStalls() {
    const p = this.player;
    let near = null;
    this.stalls.forEach((s) => {
      if (!s.bought && Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y + 60) < 150) near = s;
    });
    this.eKey.setVisible(!!near);
    if (near) this.eKey.setPosition(near.x, near.y - 100);
    const buy = this.wantBuy;
    this.wantBuy = false;
    if (buy && near) {
      near.bought = true;
      this.foods++;
      burst(this, near.x, near.y - 30, { count: 20, tint: 0xffd166, depth: H + 30 });
      floatText(this, near.x, near.y - 80, `${near.food} ${near.name}!`, { color: '#ffd166', size: 28, depth: H + 30 });
      const check = this.add.text(near.x + 70, near.y - 70, '✓', { fontFamily: '"Baloo 2", sans-serif', fontSize: '44px', fontStyle: '800', color: '#4ade80', stroke: '#3a2a3f', strokeThickness: 6 }).setOrigin(0.5).setDepth(H + 25);
      bob(this, check, { dy: 4 });
      this.companion.say(Phaser.Utils.Array.GetRandom(['Ngon quá!', 'Thơm ghê!', 'Món này tuyệt!']), { force: true });
      if (this.foods === STALLS.length) this.openGate();
    }
  }

  openGate() {
    this.gateOpen = true;
    this.gate.body.enable = false;
    this.tweens.add({ targets: this.gateParts, alpha: 0, duration: 600, onComplete: () => this.gateParts.forEach((g) => g.destroy()) });
    this.toast('Mua đủ rồi! Ra cầu Thê Húc thôi!', '#ffd166');
  }

  finish(win) {
    if (win && this.state === 'play') {
      const p = this.player;
      this.tweens.add({ targets: this.companion, x: p.x + 46, y: p.y, duration: 500, ease: 'Quad.Out', onComplete: () => this.companion.setFlipX(true) });
      // thả đèn trời
      for (let i = 0; i < 12; i++) {
        const l = this.add.image(p.x + Phaser.Math.Between(-400, 400), p.y + Phaser.Math.Between(0, 300), `HaNoi-lantern-${i % 4}`).setDepth(H + 40);
        this.tweens.add({ targets: l, y: l.y - 700, alpha: 0, duration: Phaser.Math.Between(3000, 5000), delay: i * 120 });
      }
    }
    super.finish(win);
  }

  isWin() {
    return this.foods === STALLS.length && this.player.y < 330;
  }

  isLose() {
    if (this.conn <= 0) {
      this.loseReason = 'Lạc mất nhau giữa phố đông rồi!';
      return true;
    }
    return false;
  }

  getStars() {
    let stars = 1;
    if (this.minConn > 50) stars++;
    if (this.closeCalls === 0) stars++;
    return stars;
  }

  getHudState() {
    const list = STALLS.map((s) => `${this.stalls.find((x) => x.idx === STALLS.indexOf(s))?.bought ? '✓' : '•'} ${s.name}`).join('   ');
    let hint = list;
    if (this.foods === STALLS.length) hint = 'Đi tới cầu Thê Húc ở Hồ Gươm!';
    else if (this.conn < 40) hint = 'Xa nhau quá! Đợi người ấy hoặc nhấn Space để gọi';
    return {
      bars: [{ key: 'conn', label: 'Kết nối', value: this.conn, max: 100, color: '#ff6f9f' }],
      counters: [
        { key: 'food', icon: '🍜', value: this.foods, max: STALLS.length },
        { key: 'near', icon: '🛵', value: this.closeCalls },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Món đã mua: ${this.foods}/4 · Kết nối thấp nhất: ${Math.round(this.minConn)}%`, `Suýt va xe: ${this.closeCalls} lần`];
  }
}
