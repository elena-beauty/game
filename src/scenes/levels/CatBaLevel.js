import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createCatBaTextures, createCatBaHazards, rockTexture } from '../../art/levels/CatBaArt.js';
import { burst, floatText, bob } from '../../utils/fx.js';

const WORLD_W = 4900;
const WORLD_H = 1400;
const WATER_Y = 1310;
const GRAVITY = 1200;

// Cát Bà — Leo núi nhảy đá (platformer). Xem CHALLENGES.md mục 3.
export class CatBaLevel extends BaseLevel {
  constructor() {
    super('CatBa');
  }

  buildLevel() {
    createCatBaTextures(this);
    createCatBaHazards(this);
    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(0, -200, WORLD_W, WORLD_H + 200);
    this.physics.world.checkCollision.down = false;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);

    this.buildBackground();
    this.buildPlatforms();

    // Suối dưới chân
    this.stream = this.add.tileSprite(0, WATER_Y, WORLD_W, WORLD_H - WATER_Y + 20, 'CatBa-stream').setOrigin(0).setDepth(20);
    this.add
      .particles(0, 0, 'spark', {
        x: { min: 0, max: WORLD_W },
        y: { min: WATER_Y + 4, max: WATER_Y + 60 },
        scale: { start: 0.5, end: 0 },
        lifespan: 900,
        frequency: 40,
        blendMode: 'ADD',
      })
      .setDepth(21);

    // Người chơi
    const start = this.checkpoints[0];
    this.player = new Player(this, start.x, start.y - 60, this.characterKey, { mode: 'platformer', scale: 0.6 });
    this.player.body.setCollideWorldBounds(true);
    this.player.setDepth(30);
    this.physics.add.collider(this.player, this.platforms, (p, plat) => this.onLand(plat), (p, plat) => p.body.velocity.y >= 0 && p.body.bottom <= plat.body.top + 14);
    cam.startFollow(this.player, true, 0.09, 0.09, 0, 60);
    cam.setDeadzone(160, 120);

    // Bạn đồng hành đi trước, chờ ở trạm nghỉ kế tiếp
    this.companion = new Companion(this, start.x + 70, start.y, this.characterKey, { scale: 0.6 });
    this.companion.setOrigin(0.5, 1).setDepth(29);
    this.companionTarget = 1;

    this.buildMonkeys();
    this.buildSnakes();
    this.rocksFalling = this.physics.add.group();
    this.rockTimer = 4;

    // Sương mù trôi
    for (let i = 0; i < 6; i++) {
      const m = this.add
        .image(Phaser.Math.Between(0, 1280), Phaser.Math.Between(200, 650), 'glow')
        .setScale(Phaser.Math.FloatBetween(6, 10), Phaser.Math.FloatBetween(1.5, 2.5))
        .setAlpha(0.28)
        .setScrollFactor(0.3)
        .setDepth(25);
      this.tweens.add({ targets: m, x: m.x + 300, duration: Phaser.Math.Between(9000, 15000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    // Lá rơi
    this.add
      .particles(0, 0, 'flower', {
        x: { min: 0, max: 1280 },
        y: -20,
        speedY: { min: 30, max: 60 },
        speedX: { min: -20, max: 20 },
        scale: { min: 0.25, max: 0.4 },
        rotate: { min: 0, max: 360 },
        lifespan: 9000,
        frequency: 900,
        alpha: 0.8,
      })
      .setScrollFactor(0)
      .setDepth(26);

    this.respawn = { x: start.x, y: start.y - 60 };
    this.cpIndex = 0;
    this.falls = 0;
    this.flowers = 0;
    this.stolen = 0;
    this.onMoss = false;
    this.onWobble = false;
    this.warnedWobble = false;
    this.respawning = false;
  }

  buildBackground() {
    this.add.image(0, 0, 'CatBa-sky').setOrigin(0).setScrollFactor(0).setDepth(-100);
    driftCloudsLocal(this);
    this.far = this.add.tileSprite(0, 0, 1280, 360, 'CatBa-far').setOrigin(0).setScrollFactor(0).setDepth(-90);
    this.mid = this.add.tileSprite(0, 0, 1280, 360, 'CatBa-mid').setOrigin(0).setScrollFactor(0).setDepth(-80);
    this.near = this.add.tileSprite(0, 0, 1024, 260, 'CatBa-near').setOrigin(0).setScrollFactor(0).setDepth(-70).setDisplaySize(1280, 260);
    this.nearFill = this.add.rectangle(0, 0, 1280, 900, 0x2f6b4a).setOrigin(0).setScrollFactor(0).setDepth(-70);

    // Cây lớn phía sau (trong thế giới, parallax nhẹ)
    for (let x = 150; x < WORLD_W; x += Phaser.Math.Between(260, 420)) {
      this.add
        .image(x, WATER_Y + 30, Math.random() < 0.5 ? 'CatBa-tree' : 'pine')
        .setOrigin(0.5, 1)
        .setScale(Phaser.Math.FloatBetween(1.2, 2.0))
        .setScrollFactor(0.85, 1)
        .setTint(0xb8d8c0)
        .setDepth(-60);
    }
    // Dương xỉ ven suối
    for (let x = 0; x < WORLD_W; x += Phaser.Math.Between(120, 220)) {
      this.add.image(x, WATER_Y + 12, 'CatBa-fern').setOrigin(0.5, 1).setScale(Phaser.Math.FloatBetween(0.8, 1.3)).setDepth(22);
    }
  }

  buildPlatforms() {
    const rnd = new Phaser.Math.RandomDataGenerator(['catba-v2']);
    this.platforms = this.physics.add.staticGroup();
    this.checkpoints = [];
    const flowerSpots = [];

    const addPlat = (cx, top, w, type) => {
      const plat = this.platforms.create(cx, top - 6, rockTexture(this, w, type)).setOrigin(0.5, 0);
      plat.refreshBody();
      plat.body.setSize(w - 12, 22, false);
      plat.body.setOffset(6, 6);
      plat.ptype = type;
      plat.homeY = plat.y;
      plat.setDepth(10);
      return plat;
    };

    // Trạm xuất phát
    let x = 220;
    let y = 1180;
    let plat = addPlat(x, y, 320, 'rock');
    this.checkpoints.push(this.makeCheckpoint(x - 80, y, 0));
    let right = x + 160;
    let lastCp = x;
    let i = 0;
    while (right < 3900) {
      i++;
      const gap = rnd.between(70, 130);
      let w = rnd.between(130, 210);
      const targetY = 1180 - ((right - 220) / 3680) * 780;
      const dy = Phaser.Math.Clamp(targetY - y + rnd.between(-50, 40), -85, 60);
      let type = 'rock';
      const isCp = right - lastCp > 1050;
      if (isCp) w = 300;
      else if (i > 2) {
        const r = rnd.frac();
        if (r < 0.22) type = 'wobble';
        else if (r < 0.38) type = 'moss';
      }
      x = right + gap + w / 2;
      y += dy;
      plat = addPlat(x, y, w, type);
      right = x + w / 2;
      if (isCp) {
        lastCp = x;
        this.checkpoints.push(this.makeCheckpoint(x - 70, y, this.checkpoints.length));
      } else if (i % 3 === 2) flowerSpots.push({ x, y: y - 70, type });
    }

    // Đỉnh Ngự Lâm
    const sx = right + 140 + 230;
    const sy = y - 70;
    this.summit = addPlat(sx, sy, 460, 'rock');
    this.summit.setDepth(11);
    this.add.image(sx + 150, sy - 6, 'CatBa-sign').setOrigin(0.5, 1).setDepth(9);
    this.add.image(sx + 80, sy + 40, 'CatBa-bay').setOrigin(0.5, 1).setScale(0.9).setScrollFactor(0.9, 1).setDepth(-50);
    this.summitPos = { x: sx, y: sy };
    this.checkpoints.push({ x: sx - 120, y: sy, flag: null, pole: null, active: false, index: this.checkpoints.length, summit: true });
    burstGlow(this, sx, sy - 40);

    // 5 bông hoa rừng
    this.flowerGroup = this.physics.add.group({ allowGravity: false });
    const picks = Phaser.Utils.Array.Shuffle([...flowerSpots], rnd).slice(0, 5);
    while (picks.length < 5) picks.push(flowerSpots[picks.length % flowerSpots.length]);
    picks.forEach((s) => {
      this.add.image(s.x, s.y, 'glow').setScale(0.9).setAlpha(0.5).setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
      const f = this.flowerGroup.create(s.x, s.y, 'flower').setDepth(13).setScale(0.9);
      f.body.setCircle(18, 2, 2);
      bob(this, f, { dy: 8 });
      this.tweens.add({ targets: f, angle: 360, duration: 6000, repeat: -1 });
    });
  }

  makeCheckpoint(x, y, index) {
    const pole = this.add.image(x, y, 'CatBa-pole').setOrigin(0.5, 1).setDepth(9);
    const flag = this.add.image(x + 4, y - 30, 'CatBa-flag').setOrigin(0, 0.5).setDepth(9).setScale(0.7).setTint(0x9a9a9a);
    return { x, y, pole, flag, index, active: index === 0 };
  }

  buildMonkeys() {
    this.monkeys = [];
    [1, 2, 3].forEach((k) => {
      const cpA = this.checkpoints[k - 1];
      const cpB = this.checkpoints[k] ?? this.summitPos;
      const mx = cpA.x + (cpB.x - cpA.x) * 0.55;
      const plats = this.platforms.getChildren().filter((p) => Math.abs(p.x - mx) < 260);
      const base = plats[0] ?? { x: mx, y: cpA.y };
      const m = this.add.image(base.x, base.y - 190, 'CatBa-monkey').setDepth(28).setScale(0.75);
      const branch = this.add.rectangle(base.x, base.y - 160, 120, 10, 0x7a4a2a).setStrokeStyle(2, 0x3a2a3f).setDepth(27);
      this.tweens.add({ targets: m, y: m.y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.monkeys.push({ sprite: m, home: { x: m.x, y: m.y }, branch, busy: false, cooldown: 0, hit: false });
    });
  }

  buildSnakes() {
    this.snakes = [];
    const cands = this.platforms
      .getChildren()
      .filter((p) => p.ptype === 'rock' && p.displayWidth >= 140 && p.displayWidth < 300 && p.x > 600 && p !== this.summit);
    const step = Math.max(1, Math.floor(cands.length / 6));
    for (let i = 1; i < cands.length && this.snakes.length < 6; i += step) {
      const p = cands[i];
      const half = p.displayWidth / 2 - 30;
      const s = this.add.image(p.x - half, p.y + 2, 'CatBa-snake').setOrigin(0.5, 1).setScale(0.75).setDepth(14);
      this.tweens.add({
        targets: s,
        x: p.x + half,
        duration: Phaser.Math.Between(2200, 3200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        onYoyo: () => s.setFlipX(true),
        onRepeat: () => s.setFlipX(false),
      });
      this.tweens.add({ targets: s, scaleY: 0.68, duration: 300, yoyo: true, repeat: -1 });
      this.snakes.push(s);
    }
  }

  updateSnakes() {
    const p = this.player;
    this.snakes.forEach((s) => {
      if (Math.abs(s.x - p.x) < 40 && Math.abs(s.y - 14 - p.body.bottom + 10) < 26 && p.hurt(900)) {
        const dir = p.x < s.x ? -1 : 1;
        p.body.setVelocity(dir * 300, -380);
        floatText(this, p.x, p.y - 60, 'Rắn cắn! Ui da!', { color: '#a6ec9b', size: 22 });
        burst(this, p.x, p.y, { count: 10, tint: 0x5fc36a, depth: 40 });
      }
    });
  }

  updateFallingRocks(dt) {
    const p = this.player;
    this.rockTimer -= dt;
    if (this.rockTimer <= 0 && !this.respawning) {
      this.rockTimer = Phaser.Math.FloatBetween(3.2, 5);
      const cam = this.cameras.main;
      const x = Phaser.Math.Clamp(p.x + p.body.velocity.x * 0.7 + Phaser.Math.Between(-60, 60), 40, WORLD_W - 40);
      const warn = this.add.text(x, cam.worldView.y + 120, '!', { fontFamily: '"Baloo 2", sans-serif', fontSize: '54px', fontStyle: '800', color: '#ff5d5d', stroke: '#3a2a3f', strokeThickness: 8 }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: warn, alpha: 0.2, duration: 120, yoyo: true, repeat: 3, onComplete: () => warn.destroy() });
      this.time.delayedCall(900, () => {
        if (this.state !== 'play') return;
        const r = this.rocksFalling.create(x, cam.worldView.y - 40, 'CatBa-boulder').setDepth(35);
        r.body.setCircle(26, 6, 4);
        r.setAngularVelocity(Phaser.Math.Between(-240, 240));
        r.hit = false;
      });
    }
    this.rocksFalling.getChildren().forEach((r) => {
      if (!r.hit && Phaser.Math.Distance.Between(r.x, r.y, p.x, p.y) < 46) {
        r.hit = true;
        if (p.hurt(900)) {
          p.body.setVelocity((p.x < r.x ? -1 : 1) * 260, -200);
          floatText(this, p.x, p.y - 60, 'Đá lở!', { color: '#ffd166', size: 24 });
        }
        burst(this, r.x, r.y, { count: 14, tint: 0xcbbfae, speed: 200, depth: 40 });
        r.destroy();
        return;
      }
      if (r.y > WATER_Y + 20) {
        burst(this, r.x, WATER_Y, { count: 12, tint: 0xd9fbff, speed: 180, gravity: 500, depth: 40 });
        r.destroy();
      }
    });
  }

  onLand(plat) {
    const body = this.player.body;
    if (!(body.touching.down || body.blocked.down)) return;
    if (plat.ptype === 'moss') this.onMoss = true;
    if (plat.ptype === 'wobble') {
      this.onWobble = true;
      if (!plat.triggered) this.triggerWobble(plat);
    }
  }

  triggerWobble(plat) {
    plat.triggered = true;
    if (!this.warnedWobble) {
      this.warnedWobble = true;
      this.companion.say('Đá lung lay! Nhảy nhanh lên!', { force: true });
    }
    this.tweens.add({ targets: plat, x: plat.x + 3, duration: 50, yoyo: true, repeat: 9 });
    this.time.delayedCall(1000, () => {
      plat.body.enable = false;
      burst(this, plat.x, plat.y + 20, { count: 12, tint: 0xcbbfae, speed: 140, depth: 15 });
      this.tweens.add({
        targets: plat,
        y: plat.homeY + 500,
        alpha: 0,
        angle: Phaser.Math.Between(-25, 25),
        duration: 900,
        ease: 'Quad.In',
        onComplete: () =>
          this.time.delayedCall(2500, () => {
            plat.setPosition(plat.x, plat.homeY).setAngle(0);
            plat.body.enable = true;
            plat.triggered = false;
            this.tweens.add({ targets: plat, alpha: 1, duration: 400 });
          }),
      });
    });
  }

  updateLevel(dt) {
    const p = this.player;
    const cam = this.cameras.main;

    // Parallax
    this.far.tilePositionX = cam.scrollX * 0.1;
    this.far.y = 300 - cam.scrollY * 0.05;
    this.mid.tilePositionX = cam.scrollX * 0.25;
    this.mid.y = 380 - cam.scrollY * 0.12;
    this.near.tilePositionX = cam.scrollX * 0.45;
    this.near.y = 520 - cam.scrollY * 0.2;
    this.nearFill.y = this.near.y + 256;
    this.stream.tilePositionX += dt * 60;

    if (this.respawning) return;

    const prevVx = p.body.velocity.x;
    p.update(this.inputManager, dt);
    // Đá rêu trơn: giữ quán tính
    if (this.onMoss) p.body.velocity.x = prevVx + (p.body.velocity.x - prevVx) * 0.1;
    const wasOnWobble = this.onWobble;
    this.onMoss = false;
    this.onWobble = false;

    // Hoa
    this.physics.overlap(p, this.flowerGroup, (_p, f) => {
      f.destroy();
      this.flowers++;
      burst(this, f.x, f.y, { texture: 'flower', count: 8, scale: 0.35 });
      floatText(this, f.x, f.y - 20, `Hoa rừng ${this.flowers}/5`, { color: '#ffd1e8' });
    });

    // Trạm nghỉ
    this.checkpoints.forEach((cp) => {
      if (cp.active || cp.summit) return;
      if (Math.abs(p.x - cp.x) < 90 && Math.abs(p.body.bottom - cp.y) < 30) this.activateCheckpoint(cp);
    });

    this.updateCompanion(dt);
    this.updateMonkeys(dt);
    this.updateSnakes();
    this.updateFallingRocks(dt);

    // Té xuống suối
    if (p.y > WATER_Y + 20) this.fall();
    this.hintWobble = wasOnWobble;
  }

  activateCheckpoint(cp) {
    cp.active = true;
    this.cpIndex = cp.index;
    this.respawn = { x: cp.x + 40, y: cp.y - 60 };
    cp.flag.clearTint();
    this.tweens.add({ targets: cp.flag, y: cp.y - 120, duration: 600, ease: 'Back.Out' });
    burst(this, cp.x, cp.y - 120, { count: 16, tint: 0xffd166 });
    this.toast('Trạm nghỉ!', '#ffd166');
  }

  updateCompanion(dt) {
    const c = this.companion;
    const target = this.checkpoints[Math.min(this.companionTarget, this.checkpoints.length - 1)];
    // Khi người chơi tới gần trạm đồng hành đang đứng → nhảy sang trạm tiếp
    if (!c.hopping) {
      const standX = target.x + 60;
      const standY = target.y;
      if (Math.abs(c.x - standX) > 4 || Math.abs(c.y - standY) > 4) this.hopCompanion(standX, standY);
      else if (this.player.x > target.x - 60 && this.companionTarget < this.checkpoints.length - 1 && target.active) {
        this.companionTarget++;
        c.say(Phaser.Utils.Array.GetRandom(['Theo em nè!', 'Đi tiếp thôi!', 'Lối này!', 'Sắp tới đỉnh rồi!']), { force: true });
      } else {
        c.setFlipX(this.player.x < c.x);
        const near = Math.abs(this.player.x - c.x) < 500;
        c.playAnim(near && Math.random() < 0.02 ? 'cheer' : c.anims.currentAnim?.key.endsWith('cheer') && Math.random() > 0.01 ? 'cheer' : 'idle');
        if (near && Math.random() < dt * 0.15) c.cheer();
      }
    }
  }

  hopCompanion(x, y) {
    const c = this.companion;
    c.hopping = true;
    c.setFlipX(x < c.x);
    c.playAnim('jump');
    const sx = c.x;
    const sy = c.y;
    const peak = Math.min(sy, y) - 160;
    const dur = Phaser.Math.Clamp(Math.abs(x - sx) * 0.9, 500, 1600);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: dur,
      ease: 'Sine.InOut',
      onUpdate: (tw) => {
        const t = tw.getValue();
        c.x = Phaser.Math.Linear(sx, x, t);
        // Parabol qua đỉnh peak
        const a = Phaser.Math.Linear(sy, peak, Math.min(1, t * 2));
        const b = Phaser.Math.Linear(peak, y, Math.max(0, t * 2 - 1));
        c.y = t < 0.5 ? a : b;
      },
      onComplete: () => {
        c.hopping = false;
        c.playAnim('cheer');
      },
    });
  }

  updateMonkeys(dt) {
    const p = this.player;
    this.monkeys.forEach((m) => {
      m.cooldown -= dt;
      if (!m.busy && m.cooldown <= 0 && Math.abs(p.x - m.home.x) < 260 && p.y > m.home.y) {
        m.busy = true;
        m.hit = false;
        const dir = p.x > m.home.x ? 1 : -1;
        m.sprite.setFlipX(dir < 0);
        const tx = p.x + dir * 30;
        const ty = p.y - 10;
        floatText(this, m.sprite.x, m.sprite.y - 40, 'Chí chí!', { color: '#ffe7a3', size: 22 });
        this.tweens.chain({
          targets: m.sprite,
          tweens: [
            { x: tx, y: ty, duration: 550, ease: 'Quad.In' },
            { x: tx + dir * 160, y: ty - 120, duration: 450, ease: 'Quad.Out' },
            { x: m.home.x, y: m.home.y, duration: 900, ease: 'Sine.InOut' },
          ],
          onComplete: () => {
            m.busy = false;
            m.cooldown = 4;
          },
        });
      }
      if (m.busy && !m.hit && Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, p.x, p.y) < 48) {
        m.hit = true;
        if (this.flowers > 0) {
          this.flowers--;
          this.stolen++;
          floatText(this, p.x, p.y - 60, 'Voọc giật mất 1 bông hoa!', { color: '#ffb3b3', size: 22 });
        } else if (p.hurt(800)) {
          p.body.setVelocity(-p.body.velocity.x * 0.5 - 180 * (m.sprite.flipX ? 1 : -1), -320);
          floatText(this, p.x, p.y - 60, 'Ui da!', { color: '#ffb3b3', size: 22 });
        }
      }
    });
  }

  fall() {
    if (this.respawning) return;
    this.respawning = true;
    this.falls++;
    const p = this.player;
    burst(this, p.x, WATER_Y, { count: 24, tint: 0xd9fbff, speed: 260, gravity: 600, depth: 40 });
    this.toast('Ối! Té xuống suối', '#9be7ff');
    p.body.setVelocity(0, 0);
    p.body.setAllowGravity(false);
    p.setVisible(false);
    this.companion.say('Anh/em có sao không?'.replace('Anh/em', this.companion.key === 'wife' ? 'Anh' : 'Em'), { force: true });
    this.time.delayedCall(700, () => {
      p.body.reset(this.respawn.x, this.respawn.y);
      p.body.setAllowGravity(true);
      p.setVisible(true);
      burst(this, p.x, p.y, { count: 12, tint: 0xffffff });
      this.respawning = false;
    });
  }

  isWin() {
    const p = this.player;
    const s = this.summitPos;
    return p.x > s.x - 200 && (p.body.blocked.down || p.body.touching.down) && Math.abs(p.body.bottom - s.y) < 30;
  }

  getStars() {
    let stars = 1;
    if (this.falls <= 2) stars++;
    if (this.falls === 0 && this.flowers === 5) stars++;
    return stars;
  }

  getHudState() {
    const start = this.checkpoints[0];
    const progress = Phaser.Math.Clamp((this.player.x - start.x) / (this.summitPos.x - start.x), 0, 1);
    let hint = `Đỉnh Ngự Lâm còn ${Math.max(0, Math.round((this.summitPos.x - this.player.x) / 10))}m`;
    if (this.elapsed < 8) hint = 'Giữ Space lâu để nhảy cao hơn';
    else if (this.hintWobble) hint = 'Đá lung lay — sẽ rơi sau 1 giây!';
    return {
      bars: [{ key: 'progress', label: 'Hành trình', value: progress * 100, max: 100, color: '#8b7fd6' }],
      counters: [
        { key: 'flower', icon: 'flower', value: this.flowers, max: 5 },
        { key: 'fall', icon: '💦', value: this.falls },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Thời gian: ${this.elapsed.toFixed(1)}s`, `Số lần té: ${this.falls}`, `Hoa rừng: ${this.flowers}/5${this.stolen ? ` · Voọc giật: ${this.stolen}` : ''}`];
  }
}

function driftCloudsLocal(scene) {
  for (let i = 0; i < 4; i++) {
    const c = scene.add
      .image(Phaser.Math.Between(0, 1280), Phaser.Math.Between(40, 200), Phaser.Utils.Array.GetRandom(['cloud1', 'cloud2', 'cloud3']))
      .setScrollFactor(0)
      .setDepth(-95)
      .setAlpha(0.9)
      .setScale(Phaser.Math.FloatBetween(0.5, 0.9));
    scene.tweens.add({ targets: c, x: c.x + 200, duration: Phaser.Math.Between(20000, 30000), yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }
}

function burstGlow(scene, x, y) {
  const g = scene.add.image(x, y, 'glow-warm').setScale(5).setAlpha(0.35).setDepth(8).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: g, alpha: 0.6, scale: 5.6, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
}
