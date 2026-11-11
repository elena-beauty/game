import Phaser from 'phaser';
import { BaseLevel } from './BaseLevel.js';
import { Player } from '../../objects/Player.js';
import { Companion } from '../../objects/Companion.js';
import { createDaNangTextures } from '../../art/levels/DaNangArt.js';
import { burst, floatText, driftClouds } from '../../utils/fx.js';

const W = 1280;
const H = 720;
const HORIZON = 250;
const FACE_BOTTOM = 650;
const PLAYER_X = 380;
const ZONE = 0.6; // |thăng bằng| < ZONE = vùng xanh

/**
 * Đà Nẵng — Lướt sóng Mỹ Khê (CHALLENGES.md mục 7).
 * Cưỡi mặt sóng: càng cao càng nhanh & nhiều điểm. Giữ thăng bằng bằng A/D,
 * Space bật nhảy (xoay 360 khi nhảy từ gần đỉnh sóng). Thắng: ≥ 1000 điểm khi hết giờ,
 * hoặc kết thúc sớm khi đạt 1500. Cuối ván: Cầu Rồng phun lửa.
 */
export class DaNangLevel extends BaseLevel {
  constructor() {
    super('DaNang');
  }

  buildLevel() {
    createDaNangTextures(this);
    this.t = 0;
    this.scroll = 0;
    this.speed = 320;
    this.score = 0;
    this.wipeouts = 0;
    this.bestTrick = 0;
    this.bal = 0;
    this.balVel = 0;
    this.outTimer = 0;
    this.air = false;
    this.wiped = false;
    this.py = 540;
    this.items = [];
    this.spawnIn = 1.2;
    this.milestone = 0;
    this.gulls = [];
    this.gullIn = 6;
    this.closeIn = 11;
    this.closeout = null;
    this.hits = 0;

    // Nền
    this.add.image(W / 2, H / 2, 'DaNang-sky').setDepth(0);
    this.add.image(980, 90, 'glow-warm').setScale(3.2).setAlpha(0.6).setDepth(1);
    this.add.image(980, 90, 'DaNang-sun').setDepth(1);
    driftClouds(this, { count: 5, yMin: 30, yMax: 170, scrollFactor: 0, depth: 2 });
    // Thành phố + Cầu Rồng xa xa (ban ngày) + bán đảo Sơn Trà với tượng trắng
    this.add.image(700, HORIZON + 4, 'DaNang-city').setOrigin(0.5, 1).setScale(0.42, 0.4).setTint(0xa9c6dc).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8).setDepth(2);
    this.add.image(700, HORIZON + 6, 'DaNang-bridge').setOrigin(0.5, 1).setScale(0.28).setAlpha(0.9).setDepth(2);
    this.add.image(0, HORIZON + 4, 'DaNang-mountain').setOrigin(0, 1).setDepth(3);
    this.add.image(190, HORIZON - 134, 'DaNang-statue').setOrigin(0.5, 1).setScale(0.6).setDepth(3);
    this.add.text(300, HORIZON - 112, 'Sơn Trà', { fontFamily: '"Baloo 2", sans-serif', fontSize: '16px', fontStyle: '800', color: '#ffffff', stroke: '#3a6b85', strokeThickness: 4, padding: { x: 2, y: 3 } }).setOrigin(0.5).setDepth(3);
    // Dù lượn, thuyền, chim — đời sống quanh bãi biển
    const para = this.add.image(-80, 120, 'DaNang-parasail').setDepth(2).setScale(0.7);
    this.tweens.add({ targets: para, x: W + 100, duration: 60000, repeat: -1 });
    this.tweens.add({ targets: para, y: 140, angle: 4, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    [[200, 0.5], [760, 0.4]].forEach(([x, sc]) => {
      const b = this.add.image(x, HORIZON + 6, 'DaNang-boat').setScale(sc).setDepth(5.5);
      this.tweens.add({ targets: b, x: x + 300, duration: 40000, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: b, y: b.y - 2, duration: 900, yoyo: true, repeat: -1 });
    });
    for (let i = 0; i < 3; i++) {
      const g = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(60, 180), 'DaNang-gull').setScale(0.35).setDepth(2);
      this.tweens.add({ targets: g, x: g.x - 1600, duration: Phaser.Math.Between(20000, 30000), repeat: -1, onRepeat: () => (g.x = W + 100) });
      this.tweens.add({ targets: g, scaleY: 0.18, duration: 260, yoyo: true, repeat: -1 });
    }
    this.beach = this.add.image(1010, HORIZON - 18, 'DaNang-beach').setDepth(4);
    [870, 1180, 1240].forEach((x, i) => this.add.image(x, HORIZON - 6, 'palm').setOrigin(0.5, 1).setScale(0.32 + i * 0.03).setDepth(4));
    this.add.image(W / 2, HORIZON, 'DaNang-sea').setOrigin(0.5, 0).setDepth(5);

    // Bạn đồng hành đứng trên bờ cổ vũ
    this.companion = new Companion(this, 1050, HORIZON - 12, this.characterKey, { scale: 0.42 });
    this.companion.setOrigin(0.5, 1).setDepth(6).setFlipX(true);
    this.companionCheer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this.companionWave() });

    // Lớp sóng vẽ lại mỗi frame
    this.waveG = this.add.graphics().setDepth(20);
    this.streaks = this.add.tileSprite(W / 2, 520, W, 300, 'DaNang-streak').setDepth(21).setAlpha(0.35);
    this.foamG = this.add.graphics().setDepth(22);

    // Bọt nước tung sau ván
    this.spray = this.add
      .particles(0, 0, 'spark', {
        speedX: { min: -260, max: -120 },
        speedY: { min: -160, max: -40 },
        gravityY: 500,
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 600,
        frequency: 30,
      })
      .setDepth(38);

    // Người chơi trên ván
    this.board = this.add.image(PLAYER_X, this.py + 36, 'DaNang-board').setDepth(39);
    this.player = new Player(this, PLAYER_X, this.py, this.characterKey, { mode: 'none', physics: false, scale: 0.62 });
    this.player.setDepth(40).play(`${this.characterKey}-fall`);

    this.gauge = this.add.graphics().setDepth(60);

    // Hoạt cảnh chạy cả lúc giới thiệu
    this.events.on('update', (_t, d) => this.animateScene(Math.min(d, 50) / 1000));
  }

  waveTop(x) {
    return 330 + 16 * Math.sin(x * 0.008 - this.t * 1.6) + 9 * Math.sin(x * 0.021 + this.t * 2.3);
  }

  animateScene(dt) {
    if (this.state === 'intro') this.speed = 260;
    this.t += dt;
    const g = this.waveG;
    g.clear();
    const band = (offset, color, alpha = 1, wob = 0) => {
      const pts = [];
      for (let x = -20; x <= W + 20; x += 20) pts.push({ x, y: this.waveTop(x) + offset + wob * Math.sin(x * 0.015 + this.t * 2) });
      pts.push({ x: W + 20, y: H + 10 }, { x: -20, y: H + 10 });
      g.fillStyle(color, alpha);
      g.fillPoints(pts, true);
    };
    band(0, 0x5fd0e6);
    band(26, 0x2fa6d2, 1, 4);
    band(110, 0x2290c2, 1, 8);
    band(230, 0x1a77ab, 1, 10);
    band(330, 0x15628f, 1, 8);

    // Bọt trắng trên đỉnh sóng
    const f = this.foamG;
    f.clear();
    f.fillStyle(0xffffff, 0.95);
    const off = (this.scroll * 0.6) % 26;
    for (let x = -26; x <= W + 26; x += 26) {
      const xx = x - off;
      f.fillCircle(xx, this.waveTop(xx) + 2, 9 + 4 * Math.sin(xx * 0.1 + this.t * 5));
    }
    f.fillStyle(0xffffff, 0.35);
    for (let x = 0; x <= W; x += 48) {
      const xx = x - ((this.scroll * 0.6) % 48);
      f.fillCircle(xx, this.waveTop(xx) + 20, 5);
    }

    this.streaks.tilePositionX += this.speed * dt * 0.9;
    this.beach.x = 1010 + Math.sin(this.t * 0.3) * 6;
  }

  onPlayStart() {
    this.companion.say('Cố lên! Em ở trên bờ nè!', { force: true });
  }

  companionWave() {
    if (this.state !== 'play') return;
    this.companion.playAnim('cheer');
    this.time.delayedCall(900, () => this.companion.playAnim('idle'));
  }

  updateLevel(dt) {
    const inp = this.inputManager;
    const top = this.waveTop(PLAYER_X) + 56;
    const range = FACE_BOTTOM - top;

    if (!this.wiped && !this.air) {
      const vy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      this.py = Phaser.Math.Clamp(this.py + vy * 280 * dt, top, FACE_BOTTOM);
    }
    if (!this.air) this.py = Phaser.Math.Clamp(this.py, top, FACE_BOTTOM);
    const h = Phaser.Math.Clamp(1 - (this.py - top) / range, 0, 1);

    // Tốc độ & điểm
    const targetSpeed = this.wiped ? 160 : 320 + 380 * h;
    this.speed = Phaser.Math.Linear(this.speed, targetSpeed, 0.05);
    this.scroll += this.speed * dt;
    if (!this.wiped) this.addScore((6 + 30 * h) * dt * (Math.abs(this.bal) < ZONE ? 1 : 0.4));

    this.updateBalance(dt, h);
    this.updateJump(dt, h, inp);
    this.updateItems(dt, top);
    this.updateGulls(dt);
    this.updateCloseout(dt, top, range);

    // Đặt vị trí người + ván
    const tilt = this.bal * 22 - h * 6;
    this.board.setPosition(PLAYER_X, this.py + 36).setAngle(this.air ? this.player.angle : tilt);
    this.player.setPosition(PLAYER_X + Math.sin(this.t * 3) * 2, this.py);
    if (!this.air && !this.wiped) this.player.setAngle(tilt * 0.6);
    this.spray.setPosition(PLAYER_X - 60, this.py + 40);
    this.spray.frequency = this.air || this.wiped ? -1 : Math.max(10, 60 - this.speed / 12);
    this.drawGauge();

    if (this.timeLeft <= 0 && this.score < 1000) this.loseReason = `Mới được ${Math.floor(this.score)}/1000 điểm, tiếc quá!`;
  }

  addScore(v) {
    this.score += v;
    if (this.milestone === 0 && this.score >= 500) {
      this.milestone = 1;
      this.companion.say('500 điểm rồi! Giỏi quá!', { force: true });
    } else if (this.milestone === 1 && this.score >= 1000) {
      this.milestone = 2;
      this.toast('1000 điểm! Lên 1500 nào!', '#ffd166');
      this.companion.cheer();
    }
  }

  updateBalance(dt, h) {
    const inp = this.inputManager;
    if (this.wiped) return;
    if (this.air) {
      this.bal *= 0.97;
      return;
    }
    // Sóng xô ngẫu nhiên — càng cao càng khó giữ
    this.balVel += Phaser.Math.FloatBetween(-1, 1) * dt * 3.6 * (0.6 + h);
    if (Math.random() < dt * 0.25) this.balVel += Phaser.Math.FloatBetween(-0.8, 0.8); // sóng lừng
    this.balVel = Phaser.Math.Clamp(this.balVel * 0.985, -0.9, 0.9);
    const ctrl = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    this.bal = Phaser.Math.Clamp(this.bal + (this.balVel + ctrl * 1.5) * dt, -1, 1);
    if (ctrl !== 0) this.balVel *= 0.96;

    if (Math.abs(this.bal) > ZONE) this.outTimer += dt;
    else this.outTimer = Math.max(0, this.outTimer - dt * 2);
    if (this.outTimer > 1.4 || Math.abs(this.bal) >= 1) this.wipeout('Mất thăng bằng!');
  }

  updateJump(dt, h, inp) {
    if (this.wiped) return;
    if (!this.air && inp.isJustDown('action')) {
      this.air = true;
      this.jumpBase = this.py;
      this.jumpH = h;
      this.vy = -(480 + 300 * h);
      this.spin = h > 0.55;
      this.spun = 0;
      this.player.playAnim('jump');
      burst(this, PLAYER_X, this.py + 40, { count: 12, speed: 200, scale: 0.6, depth: 45 });
    }
    if (!this.air) return;
    this.vy += 1500 * dt;
    this.py += this.vy * dt;
    if (this.spin && this.spun < 360) {
      const d = Math.min(360 - this.spun, 620 * dt);
      this.spun += d;
      this.player.angle += d;
    }
    if (this.vy > 0 && this.py >= this.jumpBase) {
      this.py = this.jumpBase;
      this.air = false;
      this.player.setAngle(0);
      this.player.playAnim('fall');
      const pts = Math.round(60 + 160 * this.jumpH + (this.spin ? 120 : 0));
      this.bestTrick = Math.max(this.bestTrick, pts);
      this.addScore(pts);
      floatText(this, PLAYER_X, this.py - 70, this.spin ? `Xoay 360! +${pts}` : `+${pts}`, { color: this.spin ? '#ffd166' : '#ffffff' });
      burst(this, PLAYER_X, this.py + 40, { count: 16, speed: 240, scale: 0.7, depth: 45, gravity: 400 });
      if (this.spin) this.companion.cheer();
    }
  }

  wipeout(msg) {
    if (this.wiped) return;
    this.wiped = true;
    this.air = false;
    this.wipeouts++;
    this.outTimer = 0;
    this.toast(`${msg} Ngã rồi!`, '#8fe9f2');
    floatText(this, PLAYER_X, this.py - 70, 'Ùm!', { color: '#ff6b6b' });
    this.player.setTint(0xff8080);
    this.time.delayedCall(500, () => this.player.clearTint());
    this.cameras.main.shake(200, 0.008);
    burst(this, PLAYER_X, this.py + 20, { count: 30, speed: 320, scale: 0.9, depth: 45, gravity: 500 });
    this.player.playAnim('hurt');
    this.tweens.add({ targets: this.player, angle: 140, alpha: 0.35, duration: 500 });
    this.tweens.add({ targets: this.board, angle: 200, duration: 500 });
    this.time.delayedCall(700, () => this.companion.say('Không sao, đứng dậy nào!', { force: true }));
    this.time.delayedCall(2200, () => {
      if (this.state === 'end') return;
      this.wiped = false;
      this.bal = 0;
      this.balVel = 0;
      this.player.setAlpha(1).setAngle(0).playAnim('fall');
    });
  }

  spawnItem(top) {
    const r = Math.random();
    let type;
    if (r < 0.34) type = 'star';
    else if (r < 0.52) type = 'shell';
    else if (r < 0.7) type = 'rock';
    else if (r < 0.85) type = 'jetski';
    else type = 'surfer';

    let y;
    let key;
    let extra = 0;
    if (type === 'star') {
      key = 'star';
      y = Math.random() < 0.35 ? top - 110 : Phaser.Math.Between(top + 10, FACE_BOTTOM - 10);
    } else if (type === 'shell') {
      key = 'DaNang-shell';
      y = Phaser.Math.Between(top + 60, FACE_BOTTOM);
    } else if (type === 'rock') {
      key = 'DaNang-rock';
      y = Phaser.Math.Between(FACE_BOTTOM - 70, FACE_BOTTOM + 10);
    } else if (type === 'jetski') {
      key = 'DaNang-jetski';
      y = Phaser.Math.Between(top + 20, FACE_BOTTOM - 20);
      extra = 200;
    } else {
      key = 'DaNang-surfer';
      y = Phaser.Math.Between(top + 30, FACE_BOTTOM - 30);
      extra = -140;
    }
    const s = this.add.image(W + 120, y, key).setDepth(type === 'rock' ? 35 : 36);
    if (type === 'star') s.setDisplaySize(44, 44);
    if (type === 'jetski') s.setScale(0.8);
    this.items.push({ s, type, baseY: y, extra, phase: Math.random() * 6 });
  }

  updateItems(dt, top) {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnItem(top);
      this.spawnIn = Phaser.Math.FloatBetween(0.6, 1.3) * (420 / Math.max(this.speed, 300));
    }
    this.items = this.items.filter((it) => {
      const { s } = it;
      s.x -= (this.speed + it.extra) * dt;
      it.phase += dt * 3;
      if (it.type === 'star' || it.type === 'shell') {
        s.y = it.baseY + Math.sin(it.phase) * 6;
        if (it.type === 'star') s.angle += dt * 90;
      } else if (it.type === 'jetski') s.y = it.baseY + Math.sin(it.phase * 1.5) * 4;
      else if (it.type === 'surfer') {
        s.y = it.baseY + Math.sin(it.phase * 0.6) * 60;
        s.angle = Math.sin(it.phase * 0.6) * 10;
      }

      const dx = Math.abs(s.x - PLAYER_X);
      const dy = Math.abs(s.y - this.py);
      if (!it.hit && !this.wiped && dx < 52 && dy < 52) {
        if (it.type === 'star' || it.type === 'shell') {
          it.hit = true;
          const pts = it.type === 'star' ? 50 : 30;
          this.addScore(pts);
          floatText(this, s.x, s.y - 30, `+${pts}`, { color: '#ffd166' });
          burst(this, s.x, s.y, { count: 10, tint: 0xffd166, scale: 0.5, depth: 50 });
          s.destroy();
          return false;
        }
        if (!this.air) {
          it.hit = true;
          this.wipeout({ rock: 'Đâm phải đá!', jetski: 'Va mô tô nước!', surfer: 'Va phải người lướt sóng!' }[it.type]);
        }
      }
      if (s.x < -160) {
        s.destroy();
        return false;
      }
      return true;
    });
  }

  /** Mòng biển bay tới rồi bổ nhào vào người chơi. */
  updateGulls(dt) {
    this.gullIn -= dt;
    if (this.gullIn <= 0) {
      this.gullIn = Phaser.Math.FloatBetween(5, 9);
      const g = this.add.image(W + 60, Phaser.Math.Between(120, 220), 'DaNang-gull').setDepth(55).setScale(0.8);
      this.tweens.add({ targets: g, scaleY: 0.4, duration: 180, yoyo: true, repeat: -1 });
      this.gulls.push({ g, state: 'fly' });
    }
    this.gulls = this.gulls.filter((o) => {
      const g = o.g;
      if (o.state === 'fly') {
        g.x -= 260 * dt;
        if (g.x < PLAYER_X + 330) {
          o.state = 'dive';
          o.tx = PLAYER_X - 40;
          o.ty = this.py - 10;
          floatText(this, g.x, g.y - 30, '!', { color: '#ff6b6b', size: 40 });
        }
      } else if (o.state === 'dive') {
        const a = Phaser.Math.Angle.Between(g.x, g.y, o.tx, o.ty);
        g.x += Math.cos(a) * 520 * dt;
        g.y += Math.sin(a) * 520 * dt;
        if (!o.hit && !this.wiped && Math.abs(g.x - PLAYER_X) < 50 && Math.abs(g.y - this.py) < 60) {
          o.hit = true;
          this.hits++;
          this.score = Math.max(0, this.score - 80);
          this.bal += this.bal >= 0 ? 0.45 : -0.45;
          floatText(this, PLAYER_X, this.py - 80, 'Mòng biển xà xuống! −80', { color: '#ff6b6b', size: 24 });
          this.player.setTint(0xff8080);
          this.time.delayedCall(350, () => this.player.clearTint());
          this.cameras.main.shake(150, 0.006);
          burst(this, PLAYER_X, this.py - 30, { count: 10, tint: 0xffffff, scale: 0.5, depth: 56 });
        }
        if (Phaser.Math.Distance.Between(g.x, g.y, o.tx, o.ty) < 20) o.state = 'away';
      } else {
        g.x -= 300 * dt;
        g.y -= 260 * dt;
      }
      if (g.x < -100 || g.y < -100) {
        g.destroy();
        return false;
      }
      return true;
    });
  }

  /** Sóng đổ (closeout): cảnh báo 2s rồi bức tường bọt quét nửa trên hoặc nửa dưới mặt sóng. */
  updateCloseout(dt, top, range) {
    if (!this.closeout) {
      this.closeIn -= dt;
      if (this.closeIn <= 0) {
        const low = Math.random() < 0.55;
        const warn = this.add.text(W - 150, low ? FACE_BOTTOM - 90 : top + 40, low ? '⚠ Sóng đổ phía dưới!\nLên cao!' : '⚠ Sóng đổ phía trên!\nXuống thấp!', {
          fontFamily: '"Baloo 2", sans-serif', fontSize: '24px', fontStyle: '800', color: '#ffd166', stroke: '#3a2a3f', strokeThickness: 6, align: 'center', padding: { x: 4, y: 4 },
        }).setOrigin(0.5).setDepth(70);
        this.tweens.add({ targets: warn, alpha: 0.3, duration: 200, yoyo: true, repeat: 4 });
        this.closeout = { low, t: 2, warn, wall: null };
        this.companion.say(low ? 'Sóng đổ kìa! Lên cao!' : 'Sóng đổ! Xuống thấp!', { force: true });
      }
      return;
    }
    const c = this.closeout;
    c.t -= dt;
    if (c.t <= 0 && !c.wall) {
      c.warn.destroy();
      const half = range / 2 + 40;
      const y = c.low ? FACE_BOTTOM - half / 2 + 30 : top + half / 2 - 20;
      c.wall = this.add.image(W + 140, y, 'DaNang-closeout').setDepth(37).setDisplaySize(240, half + 40);
      c.y0 = c.low ? FACE_BOTTOM + 40 - half : top - 60;
      c.y1 = c.low ? FACE_BOTTOM + 40 : top + half;
    }
    if (c.wall) {
      c.wall.x -= (this.speed + 260) * dt;
      c.wall.angle = Math.sin(this.t * 8) * 3;
      if (Math.random() < 0.5) burst(this, c.wall.x - 90, c.wall.y + Phaser.Math.Between(-80, 80), { count: 2, speed: 160, scale: 0.6, depth: 38 });
      if (!c.hit && Math.abs(c.wall.x - PLAYER_X) < 110 && this.py > c.y0 && this.py < c.y1) {
        c.hit = true;
        this.wipeout('Sóng đổ ập vào!');
      }
      if (c.wall.x < -200) {
        c.wall.destroy();
        this.closeout = null;
        this.closeIn = Phaser.Math.FloatBetween(9, 14);
      }
    }
  }

  drawGauge() {
    const g = this.gauge;
    g.clear();
    if (this.wiped) return;
    const x = PLAYER_X;
    const y = this.py - 78;
    const w = 120;
    g.fillStyle(0x3a2a3f, 0.7).fillRoundedRect(x - w / 2 - 4, y - 8, w + 8, 16, 8);
    g.fillStyle(0xff6b6b, 1).fillRoundedRect(x - w / 2, y - 4, w, 8, 4);
    g.fillStyle(0x48c774, 1).fillRect(x - (w / 2) * ZONE, y - 4, w * ZONE, 8);
    const px = x + (w / 2) * this.bal;
    g.fillStyle(0xffffff, 1).fillCircle(px, y, 7);
    g.lineStyle(2, 0x3a2a3f, 1).strokeCircle(px, y, 7);
  }

  isWin() {
    return this.score >= 1500 || (this.timeLeft <= 0 && this.score >= 1000);
  }

  getStars() {
    return 1 + (this.score >= 1500 ? 1 : 0) + (this.wipeouts === 0 ? 1 : 0);
  }

  getHudState() {
    // Chỉ cập nhật số điểm hiển thị mỗi 0.4s (HUD có hiệu ứng nảy mỗi lần số đổi).
    if (this.time.now - (this.shownAt ?? 0) > 400) {
      this.shownScore = Math.floor(this.score);
      this.shownAt = this.time.now;
    }
    const ok = Math.abs(this.bal) < ZONE;
    let hint = 'W/S: lên xuống mặt sóng · A/D: giữ thăng bằng · Space: nhảy';
    if (this.wiped) hint = 'Đang leo lại lên ván...';
    else if (this.bal < -0.4) hint = '← Lệch trái! Nhấn D';
    else if (this.bal > 0.4) hint = 'Lệch phải! Nhấn A →';
    return {
      bars: [{ key: 'bal', label: 'Thăng bằng', value: (1 - Math.abs(this.bal)) * 100, max: 100, color: ok ? '#48c774' : '#ff6b6b' }],
      counters: [
        { key: 'score', icon: 'star', value: this.shownScore, max: this.shownScore < 1000 ? 1000 : 1500 },
        { key: 'fall', icon: '🌊', value: this.wipeouts },
      ],
      hint,
    };
  }

  getSummary() {
    return [`Điểm lướt sóng: ${Math.floor(this.score)}`, `Số lần ngã: ${this.wipeouts} · Bị chim xà: ${this.hits}`, `Cú nhảy đẹp nhất: +${this.bestTrick}`];
  }

  /** Thắng → trời tối, Cầu Rồng phun lửa, rồi mới chụp ảnh kỷ niệm. */
  finish(win) {
    if (win && !this.duskShown && this.state === 'play') {
      this.duskShown = true;
      this.state = 'celebrate';
      this.showDragonBridge();
      this.time.delayedCall(2400, () => {
        this.state = 'play';
        super.finish(true);
      });
      return;
    }
    super.finish(win);
  }

  showDragonBridge() {
    this.companionCheer.remove();
    this.gauge.clear();
    this.spray.frequency = -1;
    this.items.forEach((it) => this.tweens.add({ targets: it.s, alpha: 0, duration: 400 }));
    this.gulls.forEach((o) => o.g.destroy());
    this.gulls = [];
    if (this.closeout) {
      this.closeout.warn?.destroy();
      this.closeout.wall?.destroy();
    }
    this.toast('Tối rồi — Cầu Rồng phun lửa!', '#ffb52e');
    const dusk = this.add.rectangle(W / 2, H / 2, W, H, 0x2a1850, 0).setDepth(30);
    this.tweens.add({ targets: dusk, fillAlpha: 0.55, duration: 900 });
    const city = this.add.image(W / 2, HORIZON + 2, 'DaNang-city').setOrigin(0.5, 1).setDepth(31).setAlpha(0);
    const bridge = this.add.image(W / 2, HORIZON + 30, 'DaNang-bridge').setOrigin(0.5, 1).setDepth(32).setAlpha(0);
    this.tweens.add({ targets: [city, bridge], alpha: 1, duration: 900 });
    this.time.delayedCall(800, () => {
      // Lửa từ miệng rồng (đầu rồng ở x≈1188 trong texture)
      const fx = W / 2 - 640 + 1188;
      const fy = HORIZON + 30 - 170 + 46;
      const fire = this.add
        .particles(fx, fy, 'glow-warm', {
          speedX: { min: 160, max: 320 },
          speedY: { min: -80, max: 20 },
          scale: { start: 0.45, end: 0.05 },
          alpha: { start: 1, end: 0 },
          tint: [0xffd166, 0xff7a2f, 0xff3d3d],
          lifespan: 700,
          frequency: 12,
          blendMode: 'ADD',
        })
        .setDepth(33);
      this.time.delayedCall(1500, () => fire.stop());
      this.cameras.main.shake(300, 0.004);
    });
    this.companion.playAnim('cheer');
  }
}
