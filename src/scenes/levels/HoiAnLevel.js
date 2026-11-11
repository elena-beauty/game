import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createHoiAnTextures, LANTERN_TINTS } from '../../art/levels/HoiAnArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';

const W = 1280;
const H = 4200;
const STREET_L = 300;
const STREET_R = 980;
const CROSS = [3450, 2750, 2050]; // tâm các phố ngang có xe cộ
const CROSS_H = 120;
const BRIDGE_Y = 1420; // tâm ảnh Chùa Cầu
const GATE_Y = 1575; // dây chắn trước cầu
const DOCK_Y = 1265; // qua mốc này → lên thuyền
const RIVER_BOTTOM = 1250;
const POSTS = [
  [335, 3950], [945, 3700], [335, 3180], [945, 2480], [335, 1900], [945, 1720],
];
const SPOTS = [
  [470, 1030], [820, 850], [560, 560], [800, 410], [640, 250],
];
const LINES = {
  light: ['Đẹp quá anh ơi!', 'Lung linh ghê!', 'Thêm một ngọn nữa nè!', 'Như phim luôn á!'],
  spot: ['Ước gì mình mãi bên nhau ♥', 'Hoa đăng trôi xa quá!', 'Điều ước sẽ thành hiện thực!', 'Sông Hoài đẹp thật!'],
};

// Hội An — Phố cổ đèn lồng: thắp 6 đèn lồng, qua Chùa Cầu, thả hoa đăng trên sông Hoài.
export class HoiAnLevel extends BaseLevel {
  constructor() {
    super('HoiAn');
  }

  buildLevel() {
    createHoiAnTextures(this);
    this.cameras.main.setBackgroundColor('#1a1430');
    this.cameras.main.setBounds(0, 0, W, H);
    this.physics.world.setBounds(STREET_L, DOCK_Y - 40, STREET_R - STREET_L, H - DOCK_Y + 40);

    this.phase = 'street';
    this.lit = 0;
    this.bumps = 0;
    this.released = 0;
    this.perfect = 0;
    this.boatHits = 0;
    this.won = false;
    this.knock = 0;
    this.knockV = new Phaser.Math.Vector2();
    this.slip = 0;
    this.bumpCool = 0;
    this.hintCool = 4;
    this.warnCool = 0;
    this.releaseCool = 0;
    this.slowCool = 0;
    this.gateOpen = false;
    this.loseReason = 'Hết giờ — lỡ mất đêm hoa đăng rồi!';

    this.buildRiver();
    this.buildBridge();
    this.buildTown();
    this.buildLanternStrings();

    // Người chơi + bạn đồng hành (nắm tay đi cạnh)
    this.player = new Player(this, 640, H - 110, this.characterKey, { mode: 'topdown', scale: 0.55 });
    this.player.body.setSize(50, 36).setOffset(23, 88);
    this.physics.add.collider(this.player, this.walls);
    this.companion = new Companion(this, 600, H - 95, this.characterKey, { scale: 0.55 });
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 80);
    // Bóng thoại mặc định depth 1000 → bị dây đèn lồng (depth 9000) che: nâng lên trên.
    const say = this.companion.say.bind(this.companion);
    this.companion.say = (text, opts) => {
      const n = this.children.list.length;
      say(text, opts);
      const last = this.children.list[this.children.list.length - 1];
      if (this.children.list.length > n && last?.type === 'Container') last.setDepth(9700);
    };

    this.buildCrowd();

    // Mũi tên chỉ đường + phím gợi ý
    this.arrow = this.add.image(0, 0, 'HoiAn-arrow').setDepth(9500).setScale(0.7).setAlpha(0.9);
    this.eKey = this.add.image(0, 0, 'HoiAn-ekey').setDepth(9600).setVisible(false);
    this.tweens.add({ targets: this.eKey, scale: 1.12, duration: 400, yoyo: true, repeat: -1 });
    this.spaceKey = this.add.image(0, 0, 'HoiAn-spacekey').setDepth(9600).setVisible(false).setScale(0.8);

    // Đêm: viền tối + cánh hoa giấy bay
    this.add.image(0, 0, 'HoiAn-vignette').setOrigin(0).setScrollFactor(0).setDepth(9900);
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: W },
        y: { min: -20, max: 0 },
        speedY: { min: 20, max: 50 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.35, end: 0.15 },
        tint: [0xff7ec0, 0xff4fa3, 0xffd166],
        alpha: { start: 0.9, end: 0 },
        lifespan: 9000,
        frequency: 260,
      })
      .setScrollFactor(0)
      .setDepth(9800);

    // Phím bấm 1 lần → dùng sự kiện keydown (không lỡ khi FPS thấp)
    this.wantLight = false;
    this.wantRelease = false;
    this.input.keyboard.on('keydown-E', () => (this.wantLight = true));
    this.input.keyboard.on('keydown-SPACE', () => (this.wantRelease = true));
  }

  // ================= DỰNG CẢNH =================
  buildTown() {
    this.walls = this.physics.add.staticGroup();

    // Phố chính lát đá + phố ngang
    this.add.tileSprite(STREET_L, 1560, STREET_R - STREET_L, H - 1560, 'HoiAn-stone').setOrigin(0).setTint(0xd8c0a8);
    this.add.rectangle(0, 1560, STREET_L, H - 1560, 0x2a1d24).setOrigin(0);
    this.add.rectangle(STREET_R, 1560, W - STREET_R, H - 1560, 0x2a1d24).setOrigin(0);
    CROSS.forEach((cy) => {
      this.add.tileSprite(0, cy - CROSS_H / 2, W, CROSS_H, 'HoiAn-road').setOrigin(0).setDepth(1);
      for (let x = 20; x < W; x += 70) this.add.rectangle(x, cy, 36, 4, 0xffffff, 0.35).setOrigin(0, 0.5).setDepth(1);
      [cy - CROSS_H / 2, cy + CROSS_H / 2].forEach((y) => this.add.rectangle(0, y, W, 6, 0x8a786c).setOrigin(0, 0.5).setDepth(1));
    });

    // Dãy nhà phố cổ hai bên
    const inCross = (y0, y1) => CROSS.some((c) => y1 > c - CROSS_H / 2 && y0 < c + CROSS_H / 2);
    let v = 0;
    for (let y = 1600; y < H; y += 290) {
      [150, 1130].forEach((x) => {
        if (inCross(y, y + 290)) return;
        const h = this.add.image(x, y, `HoiAn-house-${v++ % 3}`).setOrigin(0.5, 0).setDepth(y + 290);
        // ánh đèn cửa
        this.add.image(x, y + 250, 'glow-warm').setScale(1.4, 0.8).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 291);
        if (x < 640) h.setFlipX(v % 2 === 0);
      });
    }

    // Vũng nước (trơn)
    this.puddles = [[520, 3800], [800, 3250], [470, 2600], [760, 2300], [620, 1820]].map(([x, y]) => {
      const p = this.add.image(x, y, 'HoiAn-puddle').setDepth(2);
      return { x, y, img: p, inside: false };
    });

    // Cột đèn lồng chưa thắp
    this.posts = POSTS.map(([x, y], i) => {
      this.add.image(x, y, 'HoiAn-post').setOrigin(0.5, 1).setDepth(y);
      const lan = this.add.image(x, y - 122, 'HoiAn-lantern-off').setOrigin(0.5, 0).setDepth(y + 1);
      this.tweens.add({ targets: lan, angle: { from: -4, to: 4 }, duration: 1600 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const glow = this.add.image(x, y - 96, 'glow-warm').setScale(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 2);
      return { x, y, lan, glow, lit: false, color: i % LANTERN_TINTS.length };
    });
  }

  buildBridge() {
    // Kênh nước chảy dưới Chùa Cầu
    this.add.tileSprite(0, BRIDGE_Y + 40, W, 140, 'HoiAn-water').setOrigin(0).setDepth(0);
    this.add.image(640, BRIDGE_Y, 'HoiAn-chuacau').setDepth(BRIDGE_Y + 150);
    this.add.image(640, BRIDGE_Y + 30, 'glow-warm').setScale(3, 1.4).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(BRIDGE_Y + 151);
    [[355, BRIDGE_Y + 10], [925, BRIDGE_Y + 10], [560, BRIDGE_Y - 30], [720, BRIDGE_Y - 30]].forEach(([x, y], i) => {
      const l = this.add.image(x, y, `HoiAn-lantern-${i % 2 ? 0 : 1}`).setOrigin(0.5, 0).setDepth(BRIDGE_Y + 152);
      this.tweens.add({ targets: l, angle: { from: -5, to: 5 }, duration: 1500 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    // Bến thuyền
    this.add.tileSprite(400, DOCK_Y - 110, 480, 150, 'HoiAn-plank').setOrigin(0).setDepth(1);
    this.add.rectangle(400, DOCK_Y - 110, 480, 150).setOrigin(0).setStrokeStyle(4, 0x3a2416).setDepth(1);
    [410, 870].forEach((x) => this.add.image(x, DOCK_Y - 100, 'HoiAn-post').setScale(0.6).setOrigin(0.5, 1).setDepth(DOCK_Y));

    this.wallsReady = () => {
      const block = (x, y, w, h) => {
        const r = this.add.rectangle(x, y, w, h).setOrigin(0);
        this.physics.add.existing(r, true);
        this.walls.add(r);
        return r;
      };
      // thân cầu hai bên lối đi + mép bến
      block(STREET_L, BRIDGE_Y - 120, 560 - STREET_L, 270);
      block(720, BRIDGE_Y - 120, STREET_R - 720, 270);
      block(STREET_L, DOCK_Y - 40, 100, 160);
      block(880, DOCK_Y - 40, 100, 160);
      // dây chắn (mở khi thắp đủ 6 đèn)
      this.gate = block(560, GATE_Y - 8, 160, 16);
      const rope = this.add.graphics().setDepth(GATE_Y + 5);
      rope.lineStyle(6, 0xc0392b, 1);
      rope.beginPath();
      rope.moveTo(565, GATE_Y - 20);
      rope.lineTo(640, GATE_Y);
      rope.lineTo(715, GATE_Y - 20);
      rope.strokePath();
      rope.fillStyle(0xc9a227, 1).fillCircle(565, GATE_Y - 20, 9).fillCircle(715, GATE_Y - 20, 9);
      this.gateRope = rope;
    };
  }

  buildRiver() {
    this.water = this.add.tileSprite(0, 0, W, RIVER_BOTTOM, 'HoiAn-water').setOrigin(0);
    // Ánh trăng phản chiếu
    this.add.image(880, 380, 'glow').setScale(3, 7).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 220, max: 1060 },
        y: { min: 0, max: RIVER_BOTTOM },
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: [0xffd166, 0xff8fa3, 0xffffff, 0x7fb2ff],
        lifespan: 1400,
        frequency: 70,
        blendMode: 'ADD',
      })
      .setDepth(5);

    // Bờ sông: kè đá + nhà phố + đèn lồng soi bóng xuống nước
    [[0, 210], [1070, 210]].forEach(([x, w]) => {
      this.add.rectangle(x, 0, w, RIVER_BOTTOM, 0x2a1d24).setOrigin(0).setDepth(6);
      this.add.rectangle(x === 0 ? 206 : 1070, 0, 8, RIVER_BOTTOM, 0x8a7d70).setOrigin(0).setDepth(7);
    });
    let v = 0;
    for (let y = -40; y < RIVER_BOTTOM - 150; y += 200) {
      [100, 1180].forEach((x) => this.add.image(x, y, `HoiAn-house-${v++ % 3}`).setOrigin(0.5, 0).setScale(0.68).setDepth(8));
    }
    for (let y = 40; y < RIVER_BOTTOM; y += 70) {
      [230, 1050].forEach((x, k) => {
        const c = (y / 70 + k) % LANTERN_TINTS.length | 0;
        const l = this.add.image(x + (k ? 6 : -6), y - 30, `HoiAn-lantern-${c}`).setOrigin(0.5, 0).setScale(0.8).setDepth(9);
        this.tweens.add({ targets: l, angle: { from: -6, to: 6 }, duration: 1400 + (y % 500), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        const refl = this.add
          .image(x + (k ? -26 : 26), y + 20, 'glow-warm')
          .setScale(0.5, 1.4)
          .setTint(LANTERN_TINTS[c])
          .setAlpha(0.35)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(4);
        this.tweens.add({ targets: refl, alpha: 0.15, scaleY: 1.1, duration: 700 + (y % 400), yoyo: true, repeat: -1 });
      });
    }

    // Hoa đăng của du khách khác trôi lững lờ (trang trí)
    this.ambientLanterns = [];
    for (let i = 0; i < 12; i++) {
      const h = this.add.image(Phaser.Math.Between(260, 1020), Phaser.Math.Between(0, RIVER_BOTTOM), 'HoiAn-hoadang').setScale(0.55).setDepth(10);
      const g = this.add.image(h.x, h.y, 'glow-warm').setScale(0.7).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(10);
      this.ambientLanterns.push({ h, g, vy: Phaser.Math.FloatBetween(10, 22), ph: Math.random() * 6 });
    }

    // Điểm sáng thả hoa đăng
    this.spots = SPOTS.map(([x, y], i) => {
      const glow = this.add.image(x, y, 'glow-warm').setScale(2.2).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
      const ring = this.add.image(x, y, 'HoiAn-ring').setScale(0.95).setDepth(12);
      this.tweens.add({ targets: glow, scale: 2.6, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: ring, angle: 360, duration: 9000, repeat: -1 });
      return { x, y, glow, ring, done: false, final: i === SPOTS.length - 1 };
    });

    // Cầu gỗ giữa sông (trụ cầu là chướng ngại) + cầu An Hội cuối sông
    this.pillars = this.physics.add.staticGroup();
    this.add.image(640, 680, 'HoiAn-footbridge').setDepth(3000);
    [300, 520, 760, 980].forEach((x) => {
      const p = this.add.rectangle(x, 700, 34, 46, 0x5a3825).setStrokeStyle(3, 0x3a2a3f).setDepth(2999);
      this.physics.add.existing(p, true);
      this.pillars.add(p);
    });
    this.add.image(640, 95, 'HoiAn-anhoi').setDepth(3000);
    this.add.image(640, 70, 'glow-warm').setScale(6, 1.5).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(3001);

    // Lưới đánh cá
    this.nets = [[390, 900], [900, 540]].map(([x, y]) => {
      const n = this.add.image(x, y, 'HoiAn-net').setDepth(13).setAlpha(0.9);
      this.physics.add.existing(n, true);
      n.body.setSize(150, 100);
      return n;
    });
  }

  buildLanternStrings() {
    // Hàng trăm đèn lồng lụa giăng ngang phố
    const g = this.add.graphics().setDepth(9000);
    g.lineStyle(2, 0x2a1d24, 0.9);
    const inCross = (y) => CROSS.some((c) => Math.abs(y - c) < CROSS_H / 2 + 30);
    let n = 0;
    for (let y = 1680; y < H - 60; y += 165) {
      if (inCross(y)) continue;
      const sag = 34;
      const pts = [];
      for (let x = STREET_L - 20; x <= STREET_R + 20; x += 10) {
        const t = (x - STREET_L + 20) / (STREET_R - STREET_L + 40);
        pts.push(new Phaser.Math.Vector2(x, y + 4 * sag * t * (1 - t)));
      }
      g.strokePoints(pts);
      for (let x = STREET_L + 20; x <= STREET_R - 20; x += 46) {
        const t = (x - STREET_L + 20) / (STREET_R - STREET_L + 40);
        const ly = y + 4 * sag * t * (1 - t);
        const c = Phaser.Math.Between(0, LANTERN_TINTS.length - 1);
        const l = this.add.image(x, ly, `HoiAn-lantern-${c}`).setOrigin(0.5, 0).setScale(0.75).setDepth(9001);
        this.tweens.add({ targets: l, angle: { from: -5, to: 5 }, duration: Phaser.Math.Between(1300, 2100), yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: Phaser.Math.Between(0, 800) });
        if (n++ % 3 === 0) {
          const gl = this.add.image(x, ly + 30, 'glow-warm').setScale(0.9).setTint(LANTERN_TINTS[c]).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(9002);
          this.tweens.add({ targets: gl, alpha: 0.3, duration: Phaser.Math.Between(600, 1200), yoyo: true, repeat: -1 });
        }
      }
    }
  }

  buildCrowd() {
    this.wallsReady();
    this.people = this.physics.add.group({ allowGravity: false });
    this.vehicles = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.people, (_p, o) => this.bump(o, 220, Phaser.Utils.Array.GetRandom(['Xin lỗi ạ!', 'Ối!', 'Sorry!'])));
    this.physics.add.overlap(this.player, this.vehicles, (_p, o) => this.bump(o, 420, o.getData('kind') === 'cyclo' ? 'Suýt đụng xích lô!' : 'Cẩn thận xe!'));

    const person = (x, y, tex) => {
      const p = this.people.create(x, y, tex);
      p.setScale(tex === 'HoiAn-vendor' ? 0.85 : 0.95);
      p.body.setSize(tex === 'HoiAn-vendor' ? 120 : 28, 18).setOffset(tex === 'HoiAn-vendor' ? 15 : 8, tex === 'HoiAn-vendor' ? 54 : 56);
      return p;
    };

    // Đoàn khách du lịch đi thành nhóm
    this.groups = [];
    for (let i = 0; i < 5; i++) {
      const gy = 3800 - i * 520;
      const gx = Phaser.Math.Between(420, 860);
      const members = [];
      for (let k = 0; k < 3 + (i % 2); k++) {
        const ox = (k % 2 ? 1 : -1) * Phaser.Math.Between(10, 50);
        const oy = Math.floor(k / 2) * 34;
        members.push({ sp: person(gx + ox, gy + oy, `HoiAn-person-${(i * 3 + k) % 7}`), ox, oy });
      }
      this.groups.push({ x: gx, y: gy, vx: Phaser.Math.Between(-30, 30), vy: Phaser.Math.Between(35, 65) * (i % 3 === 2 ? -1 : 1), members });
    }

    // Người bán hàng gánh đi ngang phố
    this.vendors = [3600, 2920, 2260, 1760].map((y, i) => {
      const v = person(i % 2 ? 900 : 380, y, 'HoiAn-vendor');
      v.setVelocityX(i % 2 ? -55 : 55);
      bob(this, v, { dy: 3, duration: 300 });
      return v;
    });

    // Thợ ảnh: đi chậm rồi khựng lại chụp bất ngờ
    this.photogs = [[600, 3550], [760, 2850], [520, 2150]].map(([x, y]) => {
      const p = person(x, y, 'HoiAn-photog');
      p.setData('t', Phaser.Math.FloatBetween(1, 3));
      p.setData('stopped', false);
      p.setVelocityY(40);
      return p;
    });

    // Xe cộ chạy trên phố ngang
    this.lanes = [];
    CROSS.forEach((cy) => {
      this.lanes.push({ y: cy - 28, dir: 1, t: Phaser.Math.FloatBetween(0, 1) });
      this.lanes.push({ y: cy + 30, dir: -1, t: Phaser.Math.FloatBetween(0.5, 2) });
    });
    this.lanes.forEach((ln) => {
      for (let x = 150; x < W; x += Phaser.Math.Between(420, 650)) this.spawnVehicle(ln, x);
    });
  }

  spawnVehicle(lane, x = null) {
    const kind = Phaser.Utils.Array.GetRandom(['cyclo', 'cyclo', 'bike', 'moto']);
    const speed = { cyclo: 95, bike: 140, moto: 210 }[kind] * Phaser.Math.FloatBetween(0.85, 1.15);
    const sx = x ?? (lane.dir > 0 ? -120 : W + 120);
    const v = this.vehicles.create(sx, lane.y, `HoiAn-${kind}`);
    v.setScale(kind === 'cyclo' ? 0.75 : 0.8).setFlipX(lane.dir < 0).setDepth(lane.y + 20);
    v.setData('kind', kind);
    if (kind === 'cyclo') v.body.setSize(150, 40).setOffset(10, 66);
    else v.body.setSize(100, 30).setOffset(5, 55);
    v.setVelocityX(speed * lane.dir);
    if (kind === 'moto') {
      const beam = this.add.image(sx, lane.y, 'glow-warm').setScale(1.4, 0.5).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(lane.y + 19);
      v.setData('beam', beam);
    }
    return v;
  }

  // ================= LOGIC =================
  updateLevel(dt) {
    this.bumpCool = Math.max(0, this.bumpCool - dt);
    this.hintCool -= dt;
    this.warnCool = Math.max(0, this.warnCool - dt);
    if (this.phase === 'street') this.updateStreet(dt);
    else if (this.phase === 'boat') this.updateBoat(dt);
    this.updateAmbient(dt);
    this.wantLight = false;
    this.wantRelease = false;
  }

  updateStreet(dt) {
    const P = this.player;
    // Bị va / trượt: tạm mất điều khiển
    if (this.knock > 0) {
      this.knock -= dt;
      P.body.setVelocity(this.knockV.x, this.knockV.y);
      this.knockV.scale(0.9);
    } else if (this.slip > 0) {
      this.slip -= dt;
      P.body.velocity.scale(0.985);
      if (this.slip <= 0) P.setAngle(0);
    } else {
      P.update(this.inputManager, dt);
    }
    P.setDepth(P.y);
    this.companion.follow(P, -40, 14, 0.12);

    // Vũng nước → trượt
    this.puddles.forEach((pd) => {
      const inside = ((P.x - pd.x) / 58) ** 2 + ((P.y + 20 - pd.y) / 26) ** 2 < 1;
      if (inside && !pd.inside && this.knock <= 0) {
        this.slip = 0.7;
        const v = P.body.velocity;
        if (v.lengthSq() < 100) v.set(0, -120);
        v.scale(1.25).rotate(Phaser.Math.FloatBetween(-0.6, 0.6));
        this.tweens.add({ targets: P, angle: { from: -12, to: 12 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => P.setAngle(0) });
        floatText(this, P.x, P.y - 50, 'Trơn quá!', { color: '#9fd3ff', size: 24, depth: 9700 });
      }
      pd.inside = inside;
    });

    // Thắp đèn lồng
    const near = this.posts.filter((p) => !p.lit).sort((a, b) => Phaser.Math.Distance.Between(P.x, P.y, a.x, a.y) - Phaser.Math.Distance.Between(P.x, P.y, b.x, b.y))[0];
    const canLight = near && Phaser.Math.Distance.Between(P.x, P.y, near.x, near.y - 20) < 95;
    this.eKey.setVisible(!!canLight);
    if (canLight) this.eKey.setPosition(near.x, near.y - 160);
    if (canLight && this.wantLight) this.lightPost(near);

    // Đám đông, thợ ảnh, người bán hàng
    this.groups.forEach((g) => {
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.x < 380 || g.x > 900) g.vx *= -1;
      // ra khỏi tầm nhìn → xuất hiện lại phía trước người chơi
      if (g.y > P.y + 650 || g.y < P.y - 1300) {
        g.y = Phaser.Math.Clamp(P.y - Phaser.Math.Between(650, 900), 1700, H - 200);
        g.x = Phaser.Math.Between(420, 860);
        g.members.forEach((m) => m.sp.body.reset(g.x + m.ox, g.y + m.oy));
      }
      g.members.forEach((m, k) => {
        const tx = g.x + m.ox + Math.sin(this.elapsed * 2 + k) * 6;
        const ty = g.y + m.oy;
        m.sp.setVelocity((tx - m.sp.x) * 4, (ty - m.sp.y) * 4);
        m.sp.setDepth(m.sp.y);
        m.sp.setFlipX(g.vx < 0);
      });
    });
    this.vendors.forEach((v) => {
      if ((v.x < 380 && v.body.velocity.x < 0) || (v.x > 900 && v.body.velocity.x > 0)) v.setVelocityX(-v.body.velocity.x);
      v.setFlipX(v.body.velocity.x < 0).setDepth(v.y);
    });
    this.photogs.forEach((p) => {
      let t = p.getData('t') - dt;
      if (t <= 0) {
        const stopped = !p.getData('stopped');
        p.setData('stopped', stopped);
        t = stopped ? 1.4 : Phaser.Math.FloatBetween(1.5, 3);
        if (stopped) {
          p.setVelocity(0, 0);
          const f = this.add.image(p.x, p.y - 30, 'glow').setScale(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(9700);
          this.tweens.add({ targets: f, scale: 2.2, alpha: 0, duration: 300, onComplete: () => f.destroy() });
        } else {
          const dir = p.y > P.y + 500 ? -1 : p.y < P.y - 900 ? 1 : Phaser.Math.RND.sign();
          p.setVelocity(Phaser.Math.Between(-25, 25), 45 * dir);
        }
      }
      p.setData('t', t);
      if (p.x < 340 || p.x > 940) p.setVelocityX(-p.body.velocity.x);
      p.setDepth(p.y);
    });

    // Xe cộ
    this.lanes.forEach((ln) => {
      ln.t -= dt;
      if (ln.t <= 0) {
        this.spawnVehicle(ln);
        ln.t = Phaser.Math.FloatBetween(1.8, 3.4);
      }
    });
    this.vehicles.getChildren().slice().forEach((v) => {
      const beam = v.getData('beam');
      if (beam) beam.setPosition(v.x + (v.flipX ? -70 : 70), v.y + 6);
      if (v.x < -200 || v.x > W + 200) {
        beam?.destroy();
        v.destroy();
        return;
      }
      // Bạn đồng hành nhắc khi xe sắp tới
      const toward = Math.sign(P.x - v.x) === Math.sign(v.body.velocity.x);
      if (this.warnCool <= 0 && toward && Math.abs(P.y - v.y) < 110 && Math.abs(P.x - v.x) < 320) {
        this.warnCool = 4;
        this.companion.say(v.getData('kind') === 'cyclo' ? 'Xích lô tới kìa anh!' : 'Coi chừng xe!', { force: true, duration: 1300 });
      }
    });

    // Cổng Chùa Cầu
    if (!this.gateOpen && P.y < GATE_Y + 70 && this.hintCool <= 0) {
      this.hintCool = 4;
      this.companion.say(`Thắp đủ 6 đèn lồng rồi mới qua cầu nhé! (${this.lit}/6)`, { force: true });
    }
    if (this.gateOpen && P.y < DOCK_Y) this.startBoat();

    // Gợi ý hướng đèn tiếp theo
    if (this.hintCool <= 0 && near) {
      this.hintCool = 7;
      const side = near.x < 640 ? 'bên trái' : 'bên phải';
      const where = near.y < P.y - 150 ? `phía trước ${side}` : near.y > P.y + 150 ? `phía sau ${side}` : side;
      this.companion.say(`Còn đèn chưa thắp ở ${where} kìa!`);
    }

    // Mũi tên chỉ đường
    const target = near ?? { x: 640, y: DOCK_Y - 60 };
    this.pointArrow(target.x, target.y - 40);
  }

  lightPost(post) {
    post.lit = true;
    this.lit++;
    post.lan.setTexture(`HoiAn-lantern-${post.color}`);
    post.glow.setTint(LANTERN_TINTS[post.color]);
    this.tweens.add({ targets: post.glow, scale: 2.4, alpha: { from: 1, to: 0.65 }, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: post.glow, alpha: 0.4, duration: 900, yoyo: true, repeat: -1, delay: 600 });
    burst(this, post.x, post.y - 100, { count: 22, tint: LANTERN_TINTS[post.color], scale: 0.6, speed: 200, depth: 9700 });
    floatText(this, post.x, post.y - 150, `Đèn lồng ${this.lit}/6 ✨`, { color: '#ffd166', depth: 9700 });
    this.companion.say(Phaser.Utils.Array.GetRandom(LINES.light), { force: true });
    if (this.lit === 6 && !this.gateOpen) {
      this.gateOpen = true;
      this.gate.destroy();
      this.gateRope?.destroy();
      this.toast('Phố đã sáng đèn! Qua Chùa Cầu nào!', '#ffd166');
    }
  }

  bump(obj, power, text) {
    if (this.phase !== 'street' || this.bumpCool > 0 || this.state !== 'play') return;
    const P = this.player;
    this.bumpCool = 1;
    this.bumps++;
    const dir = new Phaser.Math.Vector2(P.x - obj.x, P.y - obj.y);
    if (dir.lengthSq() < 1) dir.set(0, 1);
    this.knockV.copy(dir.normalize().scale(power));
    this.knock = 0.25;
    P.hurt(600);
    floatText(this, P.x, P.y - 60, text, { color: '#ff8fa3', size: 24, depth: 9700 });
    burst(this, P.x, P.y - 20, { count: 8, tint: 0xffffff, scale: 0.4, depth: 9700 });
  }

  // ---------- Pha 2: thuyền trên sông Hoài ----------
  startBoat() {
    this.phase = 'transition';
    this.player.body.setVelocity(0, 0);
    this.eKey.setVisible(false);
    this.cameras.main.fadeOut(300, 10, 5, 30);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.physics.world.setBounds(270, 0, 740, RIVER_BOTTOM - 20);
      this.boat = this.physics.add.image(640, RIVER_BOTTOM - 140, 'HoiAn-boat').setScale(0.8).setDepth(2000);
      this.boat.body.setSize(90, 200).setCollideWorldBounds(true).setDrag(150, 150).setMaxVelocity(210, 210);
      this.physics.add.collider(this.boat, this.pillars, () => this.boatHit('Ui, đụng trụ cầu!'));
      this.player.body.enable = false;
      this.player.locked = true;
      this.player.playAnim('sit');
      this.companion.playAnim('sit');
      this.wake = this.add
        .particles(0, 0, 'spark', { speed: { min: 10, max: 40 }, scale: { start: 0.4, end: 0 }, alpha: { start: 0.6, end: 0 }, lifespan: 800, frequency: 70, tint: 0xbfe0ff })
        .setDepth(1999);
      this.wake.startFollow(this.boat, 0, 70);

      // Thuyền du lịch qua lại, đám hoa đăng trôi
      this.tourBoats = [[960, 90], [760, -70], [480, 100], [330, -80]].map(([y, sp], i) => {
        const b = this.physics.add.image(Phaser.Math.Between(350, 930), y, i % 2 ? 'HoiAn-boat2' : 'HoiAn-boat3').setScale(0.7).setDepth(1990);
        b.setAngle(sp > 0 ? 90 : -90);
        b.body.setSize(230, 110, true);
        b.setVelocityX(sp);
        b.setData('sp', sp);
        this.add.image(b.x, b.y, 'glow-warm').setScale(1).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(1991).setName(`tbglow${i}`);
        return b;
      });
      this.physics.add.overlap(this.boat, this.tourBoats, (_b, o) => this.boatHit('Ối, va thuyền khác!', o));
      this.clusters = [0, 1, 2].map((i) => {
        const c = this.physics.add.image(Phaser.Math.Between(330, 950), 200 + i * 350, 'HoiAn-cluster').setDepth(15).setScale(0.9);
        c.body.setSize(120, 80);
        c.setVelocityY(24);
        return c;
      });
      this.physics.add.overlap(this.boat, this.clusters, () => this.slowBoat('Vướng đám hoa đăng!'));
      this.physics.add.overlap(this.boat, this.nets, () => this.slowBoat('Mắc lưới cá rồi!'));

      this.phase = 'boat';
      this.cameras.main.startFollow(this.boat, true, 0.1, 0.1, 0, 120);
      this.cameras.main.fadeIn(400, 10, 5, 30);
      this.toast('Lên thuyền thả hoa đăng!', '#ffd166');
      this.time.delayedCall(600, () => this.companion.say('Lái vào vòng sáng rồi thả hoa đăng nha!', { force: true, duration: 2200 }));
    });
  }

  updateBoat(dt) {
    const B = this.boat;
    const inp = this.inputManager;
    const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const ay = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    B.setAcceleration(ax * 300, ay * 300 + 28); // dòng nước đẩy nhẹ về hạ lưu
    B.setAngle(Phaser.Math.Linear(B.angle, B.body.velocity.x * 0.08, 0.1));
    this.player.setPosition(B.x, B.y + 16).setDepth(2001).setFlipX(false);
    this.companion.setPosition(B.x, B.y - 34).setDepth(2001);
    this.slowCool = Math.max(0, this.slowCool - dt);
    this.releaseCool = Math.max(0, this.releaseCool - dt);

    // Thuyền du lịch
    this.tourBoats.forEach((b, i) => {
      if ((b.x < 330 && b.body.velocity.x < 0) || (b.x > 950 && b.body.velocity.x > 0)) {
        b.setVelocityX(-b.body.velocity.x);
        b.setAngle(b.body.velocity.x > 0 ? 90 : -90);
      }
      this.children.getByName(`tbglow${i}`)?.setPosition(b.x, b.y);
    });
    this.clusters.forEach((c) => {
      c.setVelocityX(Math.sin(this.elapsed * 0.7 + c.y * 0.01) * 25);
      if (c.y > RIVER_BOTTOM + 60) c.body.reset(Phaser.Math.Between(330, 950), -60);
    });

    // Thả hoa đăng
    const spot = this.spots.filter((s) => !s.done).sort((a, b) => Phaser.Math.Distance.Between(B.x, B.y, a.x, a.y) - Phaser.Math.Distance.Between(B.x, B.y, b.x, b.y))[0];
    const inSpot = spot && Phaser.Math.Distance.Between(B.x, B.y, spot.x, spot.y) < 85;
    this.spaceKey.setVisible(!!inSpot);
    if (inSpot) this.spaceKey.setPosition(spot.x, spot.y - 90);
    if (this.wantRelease && this.releaseCool <= 0) this.releaseLantern(inSpot ? spot : null);

    // Tới cầu An Hội
    if (B.y < 190 && !this.won) {
      if (this.released > 0) this.win();
      else if (this.hintCool <= 0) {
        this.hintCool = 3;
        this.companion.say('Thả ít nhất một hoa đăng đã anh!', { force: true });
      }
    }
    if (this.hintCool <= 0 && spot) {
      this.hintCool = 8;
      this.companion.say(spot.x < B.x ? 'Vòng sáng bên trái kìa!' : 'Vòng sáng bên phải kìa!');
    }
    this.pointArrow(spot ? spot.x : 640, spot ? spot.y : 120, B);
  }

  releaseLantern(spot) {
    const B = this.boat;
    this.releaseCool = 0.7;
    this.released++;
    const x = spot ? spot.x : B.x + 50;
    const y = spot ? spot.y : B.y;
    const h = this.add.image(B.x + 40, B.y, 'HoiAn-hoadang').setDepth(14).setScale(0);
    const g = this.add.image(B.x + 40, B.y, 'glow-warm').setDepth(14).setScale(0).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: [h], x, y, scale: 0.9, duration: 600, ease: 'Sine.Out' });
    this.tweens.add({ targets: [g], x, y, scale: 1.6, alpha: 0.7, duration: 600, ease: 'Sine.Out' });
    this.tweens.add({ targets: [h, g], y: y + 400, duration: 16000, delay: 600 });
    this.tweens.add({ targets: h, angle: 360, duration: 8000, repeat: -1 });
    if (spot) {
      spot.done = true;
      this.perfect++;
      spot.ring.setTint(0xffd166);
      this.tweens.add({ targets: spot.glow, scale: 4, alpha: 0, duration: 700 });
      this.tweens.add({ targets: spot.ring, scale: 1.6, alpha: 0, duration: 700 });
      burst(this, x, y, { count: 26, tint: 0xffd166, scale: 0.7, speed: 220, depth: 3100 });
      floatText(this, x, y - 70, `Hoàn hảo! ${this.perfect}/5 ✨`, { color: '#ffd166', depth: 3100 });
      this.companion.say(Phaser.Utils.Array.GetRandom(LINES.spot), { force: true });
      if (spot.final) this.time.delayedCall(500, () => this.win());
    } else {
      floatText(this, B.x + 40, B.y - 60, 'Thả hoa đăng 🌸', { color: '#ffb3cb', size: 22, depth: 3100 });
    }
  }

  boatHit(text, other = null) {
    if (this.slowCool > 0) return;
    this.slowCool = 1;
    this.boatHits++;
    const B = this.boat;
    const dx = other ? Math.sign(B.x - other.x) || 1 : 0;
    B.setVelocity(dx * 180, 160);
    this.cameras.main.shake(150, 0.006);
    this.tweens.add({ targets: B, alpha: 0.5, duration: 90, yoyo: true, repeat: 3 });
    floatText(this, B.x, B.y - 90, text, { color: '#ff8fa3', size: 24, depth: 3100 });
  }

  slowBoat(text) {
    this.boat.body.velocity.scale(0.9);
    if (this.slowCool > 0) return;
    this.slowCool = 1.2;
    this.boatHits++;
    this.boat.body.velocity.scale(0.3);
    floatText(this, this.boat.x, this.boat.y - 90, text, { color: '#ffd166', size: 22, depth: 3100 });
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.spaceKey.setVisible(false);
    this.arrow.setVisible(false);
    const B = this.boat;
    // Hoa đăng & đèn trời bay lên ước nguyện
    for (let i = 0; i < 16; i++) {
      const tex = i % 2 ? 'HoiAn-hoadang' : `HoiAn-lantern-${i % LANTERN_TINTS.length}`;
      const s = this.add.image(B.x + Phaser.Math.Between(-200, 200), B.y + Phaser.Math.Between(-40, 120), tex).setDepth(3200).setScale(0.6).setAlpha(0);
      const g = this.add.image(s.x, s.y, 'glow-warm').setDepth(3199).setScale(1.2).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: [s, g], alpha: { from: 0, to: 1 }, y: s.y - Phaser.Math.Between(300, 520), duration: 3200, delay: i * 90, ease: 'Sine.Out' });
    }
    this.companion.say('Ước gì mình mãi bên nhau ♥', { force: true, duration: 2600 });
  }

  updateAmbient(dt) {
    this.water.tilePositionY -= 14 * dt;
    this.ambientLanterns.forEach((a) => {
      a.h.y += a.vy * dt;
      a.h.x += Math.sin(this.elapsed * 0.8 + a.ph) * 0.3;
      if (a.h.y > RIVER_BOTTOM + 30) {
        a.h.y = -30;
        a.h.x = Phaser.Math.Between(260, 1020);
      }
      a.g.setPosition(a.h.x, a.h.y);
    });
  }

  pointArrow(tx, ty, from = this.player) {
    const ang = Phaser.Math.Angle.Between(from.x, from.y, tx, ty);
    const d = Phaser.Math.Distance.Between(from.x, from.y, tx, ty);
    this.arrow.setVisible(d > 160 && !this.won);
    this.arrow.setPosition(from.x + Math.cos(ang) * 90, from.y - 20 + Math.sin(ang) * 90);
    this.arrow.setRotation(ang + Math.PI / 2);
  }

  // ================= KẾT QUẢ =================
  isWin() {
    // chờ 1.2s cho hoa đăng & đèn trời bay lên rồi mới ăn mừng
    return this.won && this.time.now - (this.wonAt ??= this.time.now) > 1200;
  }

  getStars() {
    return 1 + (this.bumps === 0 ? 1 : 0) + (this.perfect >= 5 ? 1 : 0);
  }

  getHudState() {
    const P = this.phase === 'street' || !this.boat ? this.player : this.boat;
    const trip = this.phase === 'street' ? ((H - P.y) / (H - DOCK_Y)) * 0.6 : 0.6 + ((RIVER_BOTTOM - P.y) / (RIVER_BOTTOM - 190)) * 0.4;
    return {
      bars: [{ key: 'trip', label: 'Hành trình', value: Phaser.Math.Clamp(trip, 0, 1), max: 1, color: '#ffbe0b' }],
      counters: [
        { key: 'lantern', icon: 'HoiAn-lantern-0', value: this.lit, max: 6 },
        { key: 'hoadang', icon: 'HoiAn-hoadang', value: this.perfect, max: 5 },
        { key: 'bump', icon: '💥', value: this.bumps },
      ],
      hint:
        this.phase === 'street'
          ? this.lit < 6
            ? 'Đến gần cột đèn và nhấn E để thắp đèn lồng · tránh va người & xe'
            : 'Phố đã sáng! Qua Chùa Cầu ra bến thuyền'
          : 'WASD lái thuyền · vào vòng sáng rồi nhấn Space thả hoa đăng',
    };
  }

  getSummary() {
    return [
      `Đèn lồng: ${this.lit}/6 · Va chạm trên phố: ${this.bumps}`,
      `Hoa đăng: ${this.released} (đúng điểm sáng ${this.perfect}/5)`,
      `Thời gian: ${this.elapsed.toFixed(1)}s`,
    ];
  }
}
