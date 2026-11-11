import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { CHARACTER_STATS, otherCharacter } from '../../config/characters.js';
import { CHARACTERS } from '../../config/keys.js';
import { createSingaporeTextures } from '../../art/levels/SingaporeArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';
import { textStyle } from '../../ui/theme.js';

const WORLD_W = 5400;
const GROUND = 600; // mặt sàn
const GOAL_X = 5150;
// Ga tàu: sân ga A kết thúc ở 1080, sân ga B bắt đầu ở 2080
const ST_A = 1080;
const ST_B = 2080;
const CAR_W = 380;
const SKY_Y = 330; // cầu đi bộ trên cao
const TOWER_X = 3300;
const TOWER_Y = 215;
const ZIP_END = { x: 4330, y: GROUND - 40 };
const WIND = [4480, 4900];

/**
 * Singapore — Chặng cuối (CHALLENGES.md mục 9). Platformer đêm qua cả thành phố:
 * sân bay (vali lăn, đám đông) → tàu điện (canh cửa mở) → cầu đi bộ giữa các siêu cây
 * (drone an ninh, đoạn bảo trì) → bậc cao chỉ Vợ nhảy tới → đu dây cáp ra vịnh →
 * đại lộ gió mạnh (chỉ Chồng đi khỏe) → vịnh Marina trước 20h. Tab: đổi nhân vật.
 */
export class SingaporeLevel extends BaseLevel {
  constructor() {
    super('Singapore');
  }

  buildLevel() {
    createSingaporeTextures(this);
    this.fines = 0;
    this.bumps = 0;
    this.maxX = 0;
    this.zip = null;
    this.t = 0;
    this.physics.world.gravity.y = 1400;
    this.physics.world.setBounds(0, -200, WORLD_W, 1100);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.cameras.main.setBounds(0, 0, WORLD_W, 720);

    this.buildBackground();
    this.solids = this.physics.add.staticGroup();
    this.buildAirport();
    this.buildTrain();
    this.buildGardens();
    this.buildZipline();
    this.buildPromenade();

    this.player = new Player(this, 120, GROUND - 60, this.characterKey, { mode: 'platformer', scale: 0.6 });
    this.player.setDepth(20);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.trainFloor);
    this.physics.add.collider(this.player, this.doorWalls);
    this.companion = new Companion(this, 60, GROUND - 40, this.characterKey, { scale: 0.56 });
    this.companion.setDepth(19);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, 0, 60);
    this.cameras.main.setDeadzone(120, 80);
    this.events.on('update', (_t, d) => this.animateAmbient(Math.min(d, 50) / 1000));
  }

  // ---------- Hỗ trợ dựng màn ----------
  solid(x, y, w, h, depth = 10) {
    this.add.tileSprite(x + w / 2, y + h / 2, w, h, 'Singapore-floor').setDepth(depth);
    const r = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
    this.solids.add(r);
    return r;
  }

  buildBackground() {
    this.add.image(640, 360, 'Singapore-sky').setScrollFactor(0).setDepth(0);
    for (let i = 0; i < 70; i++) {
      const s = this.add
        .image(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 380), 'spark')
        .setScrollFactor(0)
        .setDepth(1)
        .setScale(Phaser.Math.FloatBetween(0.15, 0.45));
      this.tweens.add({ targets: s, alpha: 0.2, duration: Phaser.Math.Between(600, 1800), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
    this.add.image(1080, 110, 'glow-warm').setScrollFactor(0).setDepth(1).setScale(1.6).setAlpha(0.35);
    this.add.image(1080, 110, 'Singapore-moon').setScrollFactor(0).setDepth(1);
    this.farSky = this.add.tileSprite(640, 640, 1280, 340, 'Singapore-sky-far').setOrigin(0.5, 1).setScrollFactor(0).setDepth(2);
    this.wheel = this.add.image(1500, 380, 'Singapore-wheel').setScrollFactor(0.25, 0).setDepth(3).setAlpha(0.85);
    this.nearSky = this.add.tileSprite(640, 680, 1280, 420, 'Singapore-sky-near').setOrigin(0.5, 1).setScrollFactor(0).setDepth(4);

    // Siêu cây xa (parallax)
    this.treeGlows = [];
    for (let i = 0; i < 6; i++) {
      const x = 900 + i * 260;
      const tr = this.add.image(x, 680, 'Singapore-tree').setOrigin(0.5, 1).setScrollFactor(0.55, 1).setDepth(5).setScale(0.55).setAlpha(0.75);
      const gl = this.add.image(x, 680 - 460 * 0.55 + 30, 'glow').setScrollFactor(0.55, 1).setDepth(5).setScale(1.6, 0.6).setBlendMode('ADD').setAlpha(0.5);
      this.treeGlows.push(gl);
      tr.setTint(0xccbbff);
    }
  }

  buildAirport() {
    this.add.image(480, GROUND + 10, 'Singapore-terminal').setOrigin(0.5, 1).setDepth(6);
    // Thác nước trong nhà
    this.add
      .particles(480, 330, 'spark', {
        x: { min: -26, max: 26 },
        speedY: { min: 200, max: 320 },
        scale: { start: 0.5, end: 0.2 },
        alpha: { start: 0.8, end: 0.1 },
        tint: [0x9ad8ff, 0xffffff],
        lifespan: 900,
        frequency: 18,
        blendMode: 'ADD',
      })
      .setDepth(7);
    this.add.image(480, 330, 'glow').setDepth(7).setScale(0.8).setBlendMode('ADD').setAlpha(0.6).setTint(0x9ad8ff);
    this.add.text(480, 248, '✈ SÂN BAY', textStyle(26, '#ffffff', { fontStyle: '800', stroke: '#22134a', strokeThickness: 5 })).setOrigin(0.5).setDepth(7);

    this.solid(0, GROUND, ST_A, 140);
    // Biển ga tàu
    this.add.rectangle(ST_A - 120, GROUND - 210, 200, 14, 0x7b5cff).setDepth(9);
    this.add.text(ST_A - 120, GROUND - 240, 'MRT ▶', textStyle(26, '#ffffff', { fontStyle: '800', backgroundColor: '#e94b6a', padding: { x: 10, y: 2 } })).setOrigin(0.5).setDepth(9);

    // Vali lăn & đám đông
    this.luggage = [];
    this.luggageTimer = 1.5;
    this.crowds = [];
    this.addCrowd(620, 420, 820);
    this.gums = [];
    [380, 760, 2640, 3160, 4620, 4990].forEach((x) => this.addGum(x, x > 2400 && x < 3300 ? SKY_Y - 36 : GROUND - 36));
  }

  addCrowd(x, minX, maxX) {
    const people = [0, 1, 2].map((i) =>
      this.add.image(x + i * 30, GROUND, `Singapore-npc${(i + Math.floor(x / 100)) % 5}`).setOrigin(0.5, 1).setDepth(14),
    );
    people.forEach((p) => bob(this, p, { dy: 4, duration: 260 }));
    this.crowds.push({ people, x, minX, maxX, dir: 1, cd: 0 });
  }

  addGum(x, y) {
    const g = this.add.image(x, y, 'Singapore-gum').setDepth(12);
    const glow = this.add.image(x, y, 'glow').setDepth(11).setScale(0.6).setTint(0xff9ad5).setBlendMode('ADD').setAlpha(0.6);
    bob(this, g, { dy: 6 });
    this.tweens.add({ targets: glow, scale: 0.8, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.gums.push({ g, glow, x, y, taken: false });
  }

  buildTrain() {
    // Đường ray trong khe
    const rail = this.add.graphics().setDepth(8);
    rail.fillStyle(0x140e28, 1).fillRect(ST_A, GROUND + 70, ST_B - ST_A, 80);
    rail.lineStyle(4, 0x9aa3c9, 1).lineBetween(ST_A, GROUND + 74, ST_B, GROUND + 74);
    rail.lineStyle(3, 0xffd166, 0.9).lineBetween(ST_A, GROUND + 86, ST_B, GROUND + 86);
    for (let x = ST_A + 40; x < ST_B; x += 120) rail.fillStyle(0x3b2f5a, 1).fillRect(x, GROUND + 20, 18, 60);
    this.railGlow = this.add.image((ST_A + ST_B) / 2, GROUND + 86, 'glow').setDepth(8).setScale(14, 0.25).setTint(0xffd166).setBlendMode('ADD').setAlpha(0.4);
    this.add.text((ST_A + ST_B) / 2, GROUND + 112, '⚡ Ray điện — đừng rơi!', textStyle(18, '#ffd166', { fontStyle: '800' })).setOrigin(0.5).setDepth(9);

    this.solid(ST_B, GROUND, 320, 140);

    this.carA = ST_A + CAR_W / 2 + 4;
    this.carB = ST_B - CAR_W / 2 - 4;
    const floor = this.add.rectangle(this.carA, GROUND + 10, CAR_W, 20, 0x000000, 0);
    this.physics.add.existing(floor);
    floor.body.setAllowGravity(false).setImmovable(true);
    this.trainFloor = floor;
    this.doorWalls = [-1, 1].map((side) => {
      const w = this.add.rectangle(this.carA + side * (CAR_W / 2 - 6), GROUND - 60, 12, 140, 0x000000, 0);
      this.physics.add.existing(w);
      w.body.setAllowGravity(false).setImmovable(true);
      w.side = side;
      return w;
    });
    this.trainBack = this.add.image(this.carA, GROUND + 20, 'Singapore-train-back').setOrigin(0.5, 1).setDepth(9);
    this.trainFront = this.add.image(this.carA, GROUND + 20, 'Singapore-train-front').setOrigin(0.5, 1).setDepth(22);
    this.doors = [-1, 1].map((side) => this.add.image(this.carA + side * (CAR_W / 2 - 14), GROUND - 50, 'Singapore-door').setDepth(23));
    this.train = { state: 'stopA', timer: 3.5 };
    this.setDoors(-1);
  }

  /** side: -1 mở cửa trái, 1 mở cửa phải, 0 đóng hết */
  setDoors(side) {
    this.doorWalls.forEach((w, i) => {
      const open = w.side === side;
      w.body.checkCollision.none = open;
      this.tweens.add({ targets: this.doors[i], alpha: open ? 0.12 : 1, scaleY: open ? 0.2 : 1, duration: 250 });
    });
  }

  buildGardens() {
    // Siêu cây gần
    this.nearTrees = [];
    [2440, 2800, 3120, 3360].forEach((x, i) => {
      const s = 1.05 + (i % 2) * 0.12;
      this.add.image(x, 720, 'Singapore-tree').setOrigin(0.5, 1).setDepth(6).setScale(s);
      const gl = this.add.image(x, 720 - 460 * s + 60, 'glow').setDepth(6).setScale(3.4, 1.1).setBlendMode('ADD').setAlpha(0.55);
      this.treeGlows.push(gl);
    });
    // Hồ nước
    this.lake = this.add.tileSprite((2400 + TOWER_X) / 2, GROUND + 60, TOWER_X - 2400, 120, 'Singapore-water').setDepth(8);

    // Bậc lên cầu
    this.solid(2180, 510, 90, 26);
    this.solid(2290, 420, 90, 26);
    // Cầu đi bộ trên cao (có đoạn bảo trì 2800–2900)
    this.skywalk = this.add.container(0, 0).setDepth(10);
    [[2390, 2800], [2900, TOWER_X]].forEach(([a, b]) => {
      const r = this.add.rectangle((a + b) / 2, SKY_Y + 10, b - a, 20, 0x000000, 0);
      this.solids.add(r);
      const g = this.add.graphics();
      g.fillStyle(0x3b2f5a, 1).fillRect(a, SKY_Y, b - a, 20);
      g.fillStyle(0xd9d2f0, 1).fillRect(a, SKY_Y, b - a, 5);
      g.lineStyle(3, 0xff9ae6, 0.9).lineBetween(a, SKY_Y - 34, b, SKY_Y - 34);
      for (let x = a + 6; x < b; x += 26) g.lineStyle(2, 0xff9ae6, 0.6).lineBetween(x, SKY_Y - 34, x, SKY_Y);
      for (let x = a + 20; x < b; x += 60) g.fillStyle(0xfff6a8, 1).fillCircle(x, SKY_Y + 14, 3);
      this.skywalk.add(g);
    });
    this.tweens.add({ targets: this.skywalk, y: 3, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    [2790, 2910].forEach((x) => this.add.image(x, SKY_Y - 16, 'Singapore-cone').setDepth(11));
    this.add.text(2850, SKY_Y - 90, '🚧 Đang bảo trì\nNhảy qua!', textStyle(18, '#ffd166', { fontStyle: '800', align: 'center', stroke: '#22134a', strokeThickness: 4 })).setOrigin(0.5).setDepth(11);

    // Drone an ninh trên cầu
    this.drones = [];
    [[2560, 2760], [2960, 3240], [4560, 4860]].forEach(([minX, maxX], i) => {
      const baseY = i < 2 ? SKY_Y - 70 : GROUND - 70;
      const img = this.add.image(minX, baseY, 'Singapore-drone').setDepth(15);
      const beam = this.add.image(minX, baseY + 60, 'glow').setDepth(14).setScale(0.6, 1.4).setTint(0xff4d6d).setBlendMode('ADD').setAlpha(0.35);
      this.drones.push({ img, beam, minX, maxX, baseY, dir: 1, phase: i * 2 });
    });

    // Tháp cao (chỉ Vợ nhảy tới được)
    this.solid(TOWER_X, TOWER_Y, 170, 720 - TOWER_Y);
    this.add.text(TOWER_X - 20, TOWER_Y - 70, 'Bậc cao!\nVợ nhảy cao hơn (Tab)', textStyle(16, '#ffffff', { fontStyle: '800', align: 'center', stroke: '#22134a', strokeThickness: 4 })).setOrigin(0.5).setDepth(11);
  }

  buildZipline() {
    const start = { x: TOWER_X + 150, y: TOWER_Y - 20 };
    this.zipStart = start;
    const g = this.add.graphics().setDepth(9);
    g.lineStyle(4, 0xc0c8e0, 1).lineBetween(start.x, start.y - 30, ZIP_END.x + 20, ZIP_END.y - 120);
    g.fillStyle(0x2a2240, 1).fillRect(start.x - 4, start.y - 60, 8, 60);
    g.fillRect(ZIP_END.x + 16, ZIP_END.y - 130, 8, 170);
    this.pulley = this.add.image(start.x, start.y - 30, 'Singapore-pulley').setOrigin(0.5, 0.15).setDepth(21);
    this.zipLine = { x1: start.x, y1: start.y - 30, x2: ZIP_END.x + 20, y2: ZIP_END.y - 120 };
    this.add.text(start.x - 30, start.y - 96, 'Đu dây ➘', textStyle(18, '#ffffff', { fontStyle: '800', stroke: '#22134a', strokeThickness: 4 })).setOrigin(0.5).setDepth(11);
    // Biển dưới dây cáp
    this.add.tileSprite((TOWER_X + 170 + 4300) / 2, GROUND + 60, 4300 - TOWER_X - 170, 120, 'Singapore-water').setDepth(8);
  }

  buildPromenade() {
    this.solid(4300, GROUND, WORLD_W - 4300 - 150, 140);
    this.add.tileSprite(WORLD_W - 75, GROUND + 60, 150, 120, 'Singapore-water').setDepth(8);
    for (let x = 4380; x < GOAL_X; x += 170) {
      this.add.image(x, GROUND, 'Singapore-lamp').setOrigin(0.5, 1).setDepth(9);
      const gl = this.add.image(x, GROUND - 180, 'glow-warm').setDepth(9).setScale(0.8).setBlendMode('ADD').setAlpha(0.7);
      this.tweens.add({ targets: gl, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, delay: x % 700 });
    }
    this.addCrowd(4400, 4340, 4470);
    this.addCrowd(4950, 4920, 5080);
    // Gió mạnh
    this.windFx = this.add
      .particles(0, 0, 'pixel', {
        x: { min: WIND[0], max: WIND[1] + 200 },
        y: { min: GROUND - 200, max: GROUND - 10 },
        speedX: { min: -700, max: -420 },
        scaleX: { min: 6, max: 14 },
        scaleY: 0.5,
        alpha: { start: 0.6, end: 0 },
        lifespan: 600,
        frequency: 25,
      })
      .setDepth(16);
    this.add.text((WIND[0] + WIND[1]) / 2, GROUND - 250, '💨 Gió biển rất mạnh!', textStyle(20, '#ffffff', { fontStyle: '800', stroke: '#22134a', strokeThickness: 4 })).setOrigin(0.5).setDepth(11);

    // Cổng đích + vịnh
    this.add.image(GOAL_X, GROUND, 'Singapore-arch').setOrigin(0.5, 1).setDepth(9);
    this.add.text(GOAL_X, GROUND - 170, 'Vịnh Marina', textStyle(24, '#3a2a3f', { fontStyle: '800' })).setOrigin(0.5).setDepth(10);
    this.bayFountain = this.add
      .particles(WORLD_W - 70, GROUND + 10, 'spark', {
        speedY: { min: -520, max: -360 },
        speedX: { min: -40, max: 40 },
        gravityY: 700,
        scale: { start: 0.5, end: 0.1 },
        tint: [0x8fe9f2, 0xff9ae6, 0xffffff],
        lifespan: 1400,
        frequency: 40,
        blendMode: 'ADD',
      })
      .setDepth(9);
  }

  animateAmbient(dt) {
    this.t += dt;
    const sx = this.cameras.main.scrollX;
    this.farSky.tilePositionX = sx * 0.15;
    this.nearSky.tilePositionX = sx * 0.35;
    this.wheel.rotation += dt * 0.08;
    this.lake.tilePositionX += dt * 20;
    // Đèn siêu cây đổi màu theo "nhạc"
    const hue = (this.t * 0.08) % 1;
    this.treeGlows.forEach((g, i) => {
      const c = Phaser.Display.Color.HSVToRGB((hue + i * 0.13) % 1, 0.7, 1);
      g.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      g.alpha = 0.4 + 0.25 * Math.sin(this.t * 4 + i);
    });
    this.railGlow.alpha = 0.3 + 0.2 * Math.sin(this.t * 10);
  }

  onPlayStart() {
    this.companion.say('Nhanh lên kẻo lỡ show 20h!', { force: true });
  }

  // ---------- Vòng lặp ----------
  updateLevel(dt) {
    const p = this.player;
    const inp = this.inputManager;
    this.maxX = Math.max(this.maxX, p.x);

    if (inp.isJustDown('tab')) this.swapCharacter();

    if (this.zip) this.updateZip(dt);
    else {
      let mul = 1;
      if (p.x > WIND[0] && p.x < WIND[1]) {
        mul = p.key === CHARACTERS.HUSBAND ? 0.9 : 0.42;
        if (p.key === CHARACTERS.WIFE && !this.windHint) {
          this.windHint = true;
          this.toast('Gió mạnh quá! Tab đổi sang Chồng', '#8fe9f2');
        }
      }
      p.update(inp, dt, { speedMul: mul });
      if (p.x > TOWER_X + 120 && p.y < TOWER_Y + 10 && p.body.blocked.down) this.startZip();
    }

    if (p.x > TOWER_X - 140 && p.x < TOWER_X && p.y > TOWER_Y + 40 && p.y < SKY_Y && p.key === CHARACTERS.HUSBAND && !this.ledgeHint) {
      this.ledgeHint = true;
      this.companion.say('Bậc cao quá! Để em nhảy (Tab)!', { force: true });
    }

    this.updateTrain(dt);
    this.updateHazards(dt);
    this.companion.follow(p, -60, 0, 0.1);
    if (this.time.now - (this.lastCheer ?? 0) > 9000) {
      this.lastCheer = this.time.now;
      this.companion.cheer();
    }

    if (p.y > 780) this.respawn('Rơi xuống rồi!');
  }

  swapCharacter() {
    const p = this.player;
    const c = this.companion;
    const nk = otherCharacter(p.key);
    p.key = nk;
    p.stats = CHARACTER_STATS[nk];
    p.speed = p.stats.speed;
    p.setTexture(nk, 'idle0');
    p.anims.stop();
    c.key = otherCharacter(nk);
    c.stats = CHARACTER_STATS[c.key];
    c.setTexture(c.key, 'idle0');
    c.anims.stop();
    burst(this, p.x, p.y - 20, { texture: 'heart', count: 10, scale: 0.5 });
    this.toast(`Đổi sang ${p.stats.name}!`, '#ff9ae6');
    this.swaps = (this.swaps ?? 0) + 1;
  }

  updateTrain(dt) {
    const tr = this.train;
    const body = this.trainFloor.body;
    tr.timer -= dt;
    if (tr.state === 'stopA' && tr.timer <= 0) {
      tr.state = 'go';
      this.setDoors(0);
      body.setVelocityX(240);
    } else if (tr.state === 'go' && this.trainFloor.x >= this.carB) {
      body.setVelocityX(0);
      body.reset(this.carB, GROUND + 10);
      tr.state = 'stopB';
      tr.timer = 3.5;
      this.setDoors(1);
    } else if (tr.state === 'stopB' && tr.timer <= 0) {
      tr.state = 'back';
      this.setDoors(0);
      body.setVelocityX(-240);
    } else if (tr.state === 'back' && this.trainFloor.x <= this.carA) {
      body.setVelocityX(0);
      body.reset(this.carA, GROUND + 10);
      tr.state = 'stopA';
      tr.timer = 3.5;
      this.setDoors(-1);
    }
    const cx = this.trainFloor.x;
    this.doorWalls.forEach((w) => w.body.reset(cx + w.side * (CAR_W / 2 - 6), GROUND - 60));
    this.trainBack.x = cx;
    this.trainFront.x = cx;
    this.doors.forEach((d, i) => (d.x = cx + (i ? 1 : -1) * (CAR_W / 2 - 14)));
    const p = this.player;
    if ((tr.state === 'stopA' || tr.state === 'stopB') && tr.timer < 1 && tr.timer > 0.95 && Math.abs(p.x - cx) < 500) this.toast('Cửa sắp đóng!', '#ffd166');
  }

  startZip() {
    const p = this.player;
    this.zip = { t: 0 };
    p.locked = true;
    p.body.setAllowGravity(false).setVelocity(0, 0);
    p.playAnim('jump');
    this.toast('Đu dây cáp! Wheee~', '#8fe9f2');
  }

  updateZip(dt) {
    const p = this.player;
    const z = this.zip;
    z.t = Math.min(1, z.t + dt / 2.4);
    const e = Phaser.Math.Easing.Sine.In(z.t);
    const L = this.zipLine;
    const x = Phaser.Math.Linear(L.x1, L.x2, e);
    const y = Phaser.Math.Linear(L.y1, L.y2, e);
    this.pulley.setPosition(x, y);
    p.body.reset(x, y + 52);
    if (Math.random() < 0.3) burst(this, x, y, { count: 2, tint: 0xffd166, scale: 0.3, speed: 80, depth: 22 });
    if (z.t >= 1) {
      this.zip = null;
      p.locked = false;
      p.body.setAllowGravity(true).setVelocity(180, -100);
      this.tweens.add({ targets: this.pulley, x: this.zipStart.x, y: this.zipStart.y - 30, duration: 1500, delay: 500 });
    }
  }

  checkpoint() {
    const cps = [[0, 120, GROUND - 60], [ST_B, ST_B + 80, GROUND - 60], [2380, 2420, SKY_Y - 60], [TOWER_X, TOWER_X + 60, TOWER_Y - 60], [4300, 4380, GROUND - 60]];
    let cp = cps[0];
    cps.forEach((c) => {
      if (this.maxX >= c[0]) cp = c;
    });
    return cp;
  }

  respawn(msg) {
    const p = this.player;
    const [, x, y] = this.checkpoint();
    this.elapsed += 5;
    p.body.reset(x, y);
    p.hurt(1200);
    floatText(this, x, y - 70, `${msg} −5 giây`, { color: '#ff6b6b', size: 24 });
    this.companion.setPosition(x - 60, y);
    this.companion.say('Không sao chứ? Đi tiếp nào!', { force: true });
  }

  /** Va chạm vật cản: nháy đỏ, bị đẩy lùi, chữ bay. */
  bump(src, msg, penalty = 2) {
    const p = this.player;
    if (!p.hurt(1000)) return;
    this.bumps++;
    this.elapsed += penalty;
    const dir = p.x < src.x ? -1 : 1;
    p.body.setVelocity(dir * 380, -380);
    floatText(this, p.x, p.y - 70, `${msg} −${penalty}s`, { color: '#ff6b6b', size: 22 });
    burst(this, p.x, p.y, { count: 12, tint: 0xff6b6b, scale: 0.5 });
  }

  overlap(x, y, w, h) {
    const b = this.player.body;
    return Math.abs(b.center.x - x) < w / 2 + b.halfWidth && Math.abs(b.center.y - y) < h / 2 + b.halfHeight;
  }

  updateHazards(dt) {
    const p = this.player;

    // Kẹo cao su — nhặt là bị phạt!
    this.gums.forEach((g) => {
      if (g.taken || !this.overlap(g.g.x, g.g.y, 36, 28)) return;
      g.taken = true;
      this.fines++;
      g.g.destroy();
      g.glow.destroy();
      p.hurt(600);
      floatText(this, g.x, g.y - 40, 'Phạt! Kẹo cao su bị cấm 💸', { color: '#ff9ad5', size: 22 });
      this.toast(`Bị phạt lần ${this.fines}!`, '#ff9ad5');
      this.companion.say('Ở đây cấm kẹo cao su đó anh/em!', { force: true });
    });

    // Vali lăn ở sân bay
    this.luggageTimer -= dt;
    if (this.luggageTimer <= 0 && p.x < ST_A - 150) {
      this.luggageTimer = Phaser.Math.FloatBetween(1.8, 3);
      const l = this.add.image(Math.min(p.x + 700, ST_A - 30), GROUND - 31, 'Singapore-luggage').setDepth(13);
      this.luggage.push({ img: l, v: Phaser.Math.Between(200, 280) });
    }
    this.luggage = this.luggage.filter((l) => {
      l.img.x -= l.v * dt;
      l.img.rotation -= (l.v * dt) / 30;
      if (this.overlap(l.img.x, l.img.y, 46, 46)) this.bump(l.img, 'Vali lăn trúng!');
      if (l.img.x < -60) {
        l.img.destroy();
        return false;
      }
      return true;
    });

    // Đám đông qua lại — đẩy lùi
    this.crowds.forEach((c) => {
      c.x += c.dir * 70 * dt;
      if (c.x > c.maxX) c.dir = -1;
      if (c.x < c.minX) c.dir = 1;
      c.people.forEach((pp, i) => {
        pp.x = c.x + i * 30;
        pp.setFlipX(c.dir < 0);
      });
      c.cd -= dt;
      if (c.cd <= 0 && this.overlap(c.x + 30, GROUND - 45, 100, 90)) {
        c.cd = 1.2;
        this.bump({ x: c.x + 30 }, 'Đông người quá!', 1);
      }
    });

    // Drone an ninh tuần tra
    this.drones.forEach((d) => {
      d.phase += dt;
      d.img.x += d.dir * 110 * dt;
      if (d.img.x > d.maxX) d.dir = -1;
      if (d.img.x < d.minX) d.dir = 1;
      d.img.y = d.baseY + Math.sin(d.phase * 2.2) * 34;
      d.img.setFlipX(d.dir < 0);
      d.beam.setPosition(d.img.x, d.img.y + 60);
      if (this.overlap(d.img.x, d.img.y + 10, 70, 40)) this.bump(d.img, 'Drone an ninh!', 3);
    });
  }

  gameClock() {
    const mins = Math.min(120, Math.floor((this.elapsed / this.timeLimit) * 120));
    const h = 18 + Math.floor(mins / 60);
    return `${h}:${String(mins % 60).padStart(2, '0')}`;
  }

  isWin() {
    return this.player.x >= GOAL_X;
  }

  isLose() {
    if (this.timeLeft <= 0) this.loseReason = 'Lỡ mất show nhạc nước lúc 20h rồi!';
    return false;
  }

  getStars() {
    return 1 + (this.fines === 0 ? 1 : 0) + (this.timeLeft > 30 ? 1 : 0);
  }

  getHudState() {
    const p = this.player;
    let hint = 'A/D di chuyển · Space nhảy · Tab đổi nhân vật';
    if (p.x > ST_A - 200 && p.x < ST_B) hint = 'Lên tàu khi cửa mở, xuống ở ga bên kia!';
    else if (p.x > TOWER_X - 160 && p.x < TOWER_X && p.key === CHARACTERS.HUSBAND) hint = 'Bậc quá cao — nhấn Tab đổi sang Vợ để nhảy cao hơn!';
    else if (p.x > WIND[0] - 100 && p.x < WIND[1] && p.key === CHARACTERS.WIFE) hint = 'Gió mạnh — nhấn Tab đổi sang Chồng cho khỏe!';
    else if (p.x > TOWER_X && p.x < TOWER_X + 170) hint = 'Đi tới mép tháp để đu dây cáp';
    return {
      bars: [{ key: 'trip', label: 'Hành trình', value: Math.min(p.x, GOAL_X), max: GOAL_X, color: '#a78bfa' }],
      counters: [
        { key: 'clock', icon: '🕗', value: this.gameClock() },
        { key: 'fine', icon: 'Singapore-gum', value: this.fines },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Tới vịnh lúc ${this.gameClock()} (còn ${Math.ceil(this.timeLeft)}s)`, `Bị phạt kẹo cao su: ${this.fines} lần`, `Va chạm: ${this.bumps} · Đổi người: ${this.swaps ?? 0} lần`];
  }

  /** Thắng → show nhạc nước + laser trên vịnh trước khi chụp ảnh. */
  finish(win) {
    if (win && !this.showDone && this.state === 'play') {
      this.showDone = true;
      this.state = 'celebrate';
      this.player.body.setVelocity(0, 0);
      this.player.playAnim('cheer');
      this.lightShow();
      this.time.delayedCall(2600, () => {
        this.state = 'play';
        super.finish(true);
      });
      return;
    }
    super.finish(win);
  }

  lightShow() {
    this.toast('20:00 — Show nhạc nước bắt đầu!', '#8fe9f2');
    const cx = WORLD_W - 120;
    const g = this.add.graphics().setDepth(17).setBlendMode('ADD');
    const colors = [0xff4d6d, 0x8fe9f2, 0xb56cff, 0xffd166, 0x7ee081];
    let a = 0;
    this.time.addEvent({
      delay: 30,
      repeat: 90,
      callback: () => {
        a += 0.06;
        g.clear();
        for (let i = 0; i < 7; i++) {
          const ang = -Math.PI / 2 + Math.sin(a + i * 0.7) * 1.1;
          g.lineStyle(4, colors[i % colors.length], 0.8);
          g.lineBetween(cx, GROUND - 20, cx + Math.cos(ang) * 900, GROUND - 20 + Math.sin(ang) * 900);
        }
      },
    });
    [-260, -140, 0].forEach((dx, i) => {
      const f = this.add
        .particles(cx + dx, GROUND + 10, 'spark', {
          speedY: { min: -900, max: -650 },
          speedX: { min: -80, max: 80 },
          gravityY: 900,
          scale: { start: 0.8, end: 0.1 },
          tint: colors,
          lifespan: 1600,
          frequency: 10,
          blendMode: 'ADD',
        })
        .setDepth(18);
      this.time.delayedCall(2400 + i * 100, () => f.stop());
    });
    this.companion.playAnim('cheer');
  }
}
