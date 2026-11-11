import Phaser from 'phaser';
import { SCENES, EVENTS } from '../config/keys.js';
import { FONT, COLORS, titleStyle, textStyle } from '../ui/theme.js';
import { drawPanel, dimOverlay } from '../ui/Panel.js';
import { createButton } from '../ui/Button.js';
import { burst } from '../utils/fx.js';
import { Music } from '../systems/Music.js';
import { createMuteButton } from '../ui/MuteButton.js';

/**
 * HUD chạy song song phía trên scene ván: bảng giới thiệu, đồng hồ, thanh chỉ số,
 * bộ đếm vật phẩm, gợi ý, thông báo (toast), menu tạm dừng (Esc).
 */
export class HUDScene extends Phaser.Scene {
  constructor() {
    super(SCENES.HUD);
  }

  init(data) {
    this.levelScene = data.levelScene;
    this.cfg = this.levelScene.levelConfig;
    this.bars = new Map();
    this.counters = new Map();
  }

  create() {
    const L = this.levelScene;
    this.hud = this.add.container(0, 0).setAlpha(0);
    this.buildTopBar();

    this.hint = this.add.text(this.scale.width / 2, this.scale.height - 34, '', textStyle(22, '#ffffff', { stroke: '#3a2a3f', strokeThickness: 5, fontStyle: '700' })).setOrigin(0.5);
    this.hud.add(this.hint);

    L.events.on(EVENTS.HUD_UPDATE, this.onUpdate, this);
    L.events.on(EVENTS.TOAST, this.onToast, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      L.events.off(EVENTS.HUD_UPDATE, this.onUpdate, this);
      L.events.off(EVENTS.TOAST, this.onToast, this);
    });

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.showIntro();
  }

  // ---------- Thanh trên cùng ----------
  buildTopBar() {
    const g = this.add.graphics();
    g.fillStyle(0x3a2a3f, 0.55);
    g.fillRoundedRect(16, 14, 300, 52, 26);
    g.fillRoundedRect(this.scale.width / 2 - 80, 14, 160, 52, 26);
    this.hud.add(g);

    const name = this.add.text(36, 40, `${this.cfg.icon ?? ''} ${this.cfg.name}`, textStyle(26, '#ffffff', { fontStyle: '800' })).setOrigin(0, 0.5);
    this.hud.add(name);

    const clock = this.add.image(this.scale.width / 2 - 50, 40, 'icon-clock').setScale(0.8);
    this.timerText = this.add.text(this.scale.width / 2 + 14, 40, '', titleStyle(30)).setOrigin(0.5);
    this.hud.add([clock, this.timerText]);
  }

  onUpdate(state = {}) {
    const L = this.levelScene;
    const t = Math.ceil(L.timeLeft);
    const mm = Math.floor(t / 60);
    const ss = String(t % 60).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);
    const low = L.timeLeft < 10;
    this.timerText.setColor(low ? '#ff6b6b' : '#ffffff');
    if (low && !this.timerPulse) {
      this.timerPulse = this.tweens.add({ targets: this.timerText, scale: 1.18, duration: 250, yoyo: true, repeat: -1 });
    }

    (state.bars ?? []).forEach((b, i) => this.updateBar(b, i));
    (state.counters ?? []).forEach((c, i) => this.updateCounter(c, i));
    this.hint.setText(state.hint ?? '');
  }

  updateBar(b, i) {
    let bar = this.bars.get(b.key);
    const x = 24;
    const y = 86 + i * 40;
    const w = 220;
    if (!bar) {
      const bg = this.add.graphics();
      bg.fillStyle(0x3a2a3f, 0.6);
      bg.fillRoundedRect(x - 6, y - 6, w + 112, 32, 16);
      bg.fillStyle(0x000000, 0.35);
      bg.fillRoundedRect(x + 100, y, w, 20, 10);
      const label = this.add.text(x + 4, y + 10, b.label, textStyle(18, '#ffffff', { fontStyle: '700' })).setOrigin(0, 0.5);
      const fill = this.add.graphics();
      bar = { fill, shown: b.value / b.max };
      this.hud.add([bg, label, fill]);
      this.bars.set(b.key, bar);
    }
    const ratio = Phaser.Math.Clamp(b.value / b.max, 0, 1);
    bar.shown = Phaser.Math.Linear(bar.shown, ratio, 0.2);
    bar.fill.clear();
    if (bar.shown > 0.01) {
      const color = Phaser.Display.Color.HexStringToColor(b.color ?? COLORS.sea).color;
      bar.fill.fillStyle(color, 1);
      bar.fill.fillRoundedRect(x + 100, y, Math.max(20, w * bar.shown), 20, 10);
      bar.fill.fillStyle(0xffffff, 0.35);
      bar.fill.fillRoundedRect(x + 106, y + 3, Math.max(8, w * bar.shown - 12), 6, 3);
    }
  }

  updateCounter(c, i) {
    let item = this.counters.get(c.key);
    const x = this.scale.width - 24 - i * 150;
    if (!item) {
      const bg = this.add.graphics();
      bg.fillStyle(0x3a2a3f, 0.55);
      bg.fillRoundedRect(x - 136, 14, 136, 52, 26);
      const isTex = this.textures.exists(c.icon);
      const icon = isTex
        ? this.add.image(x - 108, 40, c.icon).setDisplaySize(36, 36)
        : this.add.text(x - 108, 40, c.icon ?? '•', { fontFamily: FONT, fontSize: '28px', padding: { x: 2, y: 4 } }).setOrigin(0.5);
      const text = this.add.text(x - 56, 40, '', titleStyle(26)).setOrigin(0.5);
      text.baseScale = text.scale;
      icon.baseScale = icon.scale;
      item = { text, icon, last: null };
      this.hud.add([bg, icon, text]);
      this.counters.set(c.key, item);
    }
    const str = c.max != null ? `${c.value}/${c.max}` : `${c.value}`;
    if (str !== item.last) {
      if (item.last !== null) {
        // Nảy nhẹ về đúng scale gốc — hủy tween cũ để không cộng dồn khi số đổi liên tục.
        [item.text, item.icon].forEach((o) => {
          this.tweens.killTweensOf(o);
          o.setScale(o.baseScale);
          this.tweens.add({ targets: o, scale: o.baseScale * 1.3, duration: 120, yoyo: true });
        });
      }
      item.text.setText(str);
      item.last = str;
    }
  }

  onToast({ text, color = '#ffffff' }) {
    const t = this.add.text(this.scale.width / 2, this.scale.height * 0.3, text, titleStyle(44, color)).setOrigin(0.5).setScale(0);
    this.tweens.chain({
      targets: t,
      tweens: [
        { scale: 1, duration: 250, ease: 'Back.Out' },
        { alpha: 0, y: t.y - 40, duration: 400, delay: 700, onComplete: () => t.destroy() },
      ],
    });
  }

  // ---------- Bảng giới thiệu ván ----------
  showIntro() {
    const { width, height } = this.scale;
    const c = this.add.container(0, 0);
    const dim = dimOverlay(this, 0.6);
    const pw = 760;
    const ph = 560;
    const cx = width / 2;
    const cy = height / 2 + 6;
    const headerColor = Phaser.Display.Color.HexStringToColor(this.cfg.color ?? '#ff6f9f').color;
    const panel = drawPanel(this, cx, cy, pw, ph, { header: headerColor });
    const top = cy - ph / 2;

    const title = this.add.text(cx, top + 36, `${this.cfg.icon ?? ''} ${this.cfg.name}`, titleStyle(42)).setOrigin(0.5);
    const sub = this.add.text(cx, top + 98, this.cfg.title, textStyle(28, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5);
    const desc = this.add
      .text(cx, top + 136, this.cfg.desc, textStyle(19, '#6b5b78', { align: 'center', wordWrap: { width: pw - 90 } }))
      .setOrigin(0.5, 0);
    const goal = this.add.text(cx, top + 222, `🎯 ${this.cfg.goal}`, textStyle(22, COLORS.pinkDark, { fontStyle: '800' })).setOrigin(0.5);
    c.add([dim, panel, title, sub, desc, goal]);

    // Phím điều khiển
    const ctrlTop = top + 262;
    (this.cfg.controls ?? []).forEach(([key, action], i) => {
      const y = ctrlTop + i * 40;
      const kx = cx - 150;
      const kt = this.add.text(kx, y + 16, key, textStyle(18, '#ffffff', { fontStyle: '800' })).setOrigin(0.5);
      const kw = Math.max(54, kt.width + 22);
      const g = this.add.graphics();
      g.fillStyle(0x3a2a3f, 1);
      g.fillRoundedRect(kx - kw / 2, y + 2, kw, 32, 8);
      g.fillStyle(0x5b4a6b, 1);
      g.fillRoundedRect(kx - kw / 2 + 2, y + 2, kw - 4, 26, 7);
      const at = this.add.text(cx - 100, y + 16, action, textStyle(20)).setOrigin(0, 0.5);
      c.add([g, kt, at]);
    });

    // Điều kiện sao
    const starTop = ctrlTop + Math.max(3, (this.cfg.controls ?? []).length) * 40 + 8;
    (this.cfg.stars ?? []).forEach((s, i) => {
      const x = cx - 230 + i * 230;
      const row = this.add.container(x, starTop + 14);
      for (let k = 0; k <= i; k++) row.add(this.add.image((k - i / 2) * 22, 0, 'star').setDisplaySize(24, 24));
      const st = this.add.text(x, starTop + 44, s, textStyle(16, '#6b5b78', { align: 'center', wordWrap: { width: 210 } })).setOrigin(0.5, 0);
      c.add([row, st]);
    });

    const start = () => {
      if (this.introClosed) return;
      this.introClosed = true;
      this.tweens.add({
        targets: c,
        alpha: 0,
        duration: 250,
        onComplete: () => {
          c.destroy();
          this.countdown();
        },
      });
    };
    const btn = createButton(this, cx, cy + ph / 2 - 10, 'Bắt đầu!', start, { theme: 'sun', width: 280 });
    c.add(btn);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-ENTER', start);

    c.setAlpha(0);
    c.y = 30;
    this.tweens.add({ targets: c, alpha: 1, y: 0, duration: 350, ease: 'Back.Out' });
  }

  countdown() {
    const { width, height } = this.scale;
    const steps = ['3', '2', '1', 'Đi nào!'];
    const t = this.add.text(width / 2, height / 2, '', titleStyle(110, '#ffd166')).setOrigin(0.5);
    steps.forEach((s, i) =>
      this.time.delayedCall(i * 450, () => {
        t.setText(s).setScale(1.8).setAlpha(1);
        this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.Out' });
        if (i === steps.length - 1) {
          this.tweens.add({ targets: t, alpha: 0, delay: 350, duration: 250, onComplete: () => t.destroy() });
          this.tweens.add({ targets: this.hud, alpha: 1, duration: 300 });
          this.levelScene.startPlay();
        }
      }),
    );
  }

  // ---------- Hiệu ứng thắng / thua ----------
  /** Ăn mừng chiến thắng: tia sáng xoay, banner, sao, pháo hoa, mưa giấy màu. */
  celebrate(stars = 1) {
    const { width: W, height: H } = this.scale;
    this.pauseMenu?.destroy();
    this.tweens.add({ targets: this.hud, alpha: 0, duration: 200 });
    const layer = this.add.container(0, 0);
    const cy = H * 0.4;

    // Nền tối nhẹ + tia sáng vàng xoay
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x140c22, 0.35));
    const rays = this.add.graphics({ x: W / 2, y: cy });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.fillStyle(i % 2 ? 0xffe39a : 0xffffff, 0.16);
      rays.fillTriangle(0, 0, Math.cos(a) * 900, Math.sin(a) * 900, Math.cos(a + 0.2) * 900, Math.sin(a + 0.2) * 900);
    }
    rays.setScale(0);
    layer.add(rays);
    this.tweens.add({ targets: rays, scale: 1, duration: 500, ease: 'Cubic.Out' });
    this.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });
    layer.add(this.add.image(W / 2, cy, 'glow-warm').setScale(6).setAlpha(0.6).setBlendMode('ADD'));

    // Dải ruy băng + chữ
    const ribbon = this.add.graphics({ x: W / 2, y: cy });
    ribbon.fillStyle(0xb83266, 1);
    ribbon.fillTriangle(-330, -30, -380, 10, -330, 50);
    ribbon.fillTriangle(330, -30, 380, 10, 330, 50);
    ribbon.fillStyle(0x3a2a3f, 1).fillRoundedRect(-334, -54, 668, 108, 20);
    ribbon.fillStyle(0xff5c93, 1).fillRoundedRect(-330, -50, 660, 100, 18);
    ribbon.fillStyle(0xffffff, 0.3).fillRoundedRect(-310, -42, 620, 26, 13);
    const title = this.add.text(W / 2, cy - 2, 'CHIẾN THẮNG!', titleStyle(72, '#ffd166', '#3a2a3f')).setOrigin(0.5);
    const sub = this.add.text(W / 2, cy + 86, `${this.cfg.icon ?? ''} ${this.cfg.name} — ảnh kỷ niệm đã lưu!`, titleStyle(26)).setOrigin(0.5);
    [ribbon, title, sub].forEach((o, i) => {
      o.setScale(0);
      layer.add(o);
      this.tweens.add({ targets: o, scale: 1, duration: 500, delay: 150 + i * 120, ease: 'Back.Out' });
    });
    this.tweens.add({ targets: title, scale: 1.08, duration: 500, yoyo: true, repeat: -1, delay: 800, ease: 'Sine.InOut' });

    // Sao rơi vào
    for (let i = 0; i < 3; i++) {
      const x = W / 2 + (i - 1) * 110;
      const y = cy - 120 - (i === 1 ? 18 : 0);
      const empty = this.add.image(x, y, 'star-empty').setDisplaySize(90, 90).setTint(0x8a7a99);
      layer.add(empty);
      if (i < stars) {
        const st = this.add.image(x, y - 200, 'star').setDisplaySize(96, 96).setAlpha(0);
        layer.add(st);
        this.tweens.add({
          targets: st,
          y,
          alpha: 1,
          duration: 450,
          delay: 500 + i * 300,
          ease: 'Bounce.Out',
          onComplete: () => burst(this, x, y, { count: 18, tint: 0xffd166, scale: 0.7, speed: 300 }),
        });
      }
    }

    // Pháo hoa nổ khắp màn hình
    const colors = [0xff5c93, 0xffd166, 0x8fe9f2, 0xa6ec9b, 0xc4a5ff, 0xffffff];
    this.time.addEvent({
      delay: 260,
      repeat: 10,
      callback: () => {
        const x = Phaser.Math.Between(120, W - 120);
        const y = Phaser.Math.Between(70, H * 0.55);
        const tint = Phaser.Utils.Array.GetRandom(colors);
        const fw = this.add.particles(x, y, 'spark', {
          speed: { min: 120, max: 340 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.9, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 1100,
          gravityY: 220,
          tint,
          blendMode: 'ADD',
          emitting: false,
        });
        fw.explode(48);
        const flash = this.add.image(x, y, 'glow').setTint(tint).setBlendMode('ADD').setScale(1.4).setAlpha(0.8);
        layer.add(flash);
        this.tweens.add({ targets: flash, alpha: 0, scale: 2.2, duration: 500, onComplete: () => flash.destroy() });
        this.time.delayedCall(1300, () => fw.destroy());
      },
    });

    // Mưa giấy màu
    const confetti = this.add.particles(0, -20, 'pixel', {
      x: { min: 0, max: W },
      speedY: { min: 160, max: 320 },
      speedX: { min: -60, max: 60 },
      scaleX: { min: 2, max: 3.5 },
      scaleY: { min: 1, max: 2 },
      rotate: { start: 0, end: 720 },
      lifespan: 3500,
      quantity: 4,
      frequency: 40,
      tint: colors,
    });
    layer.add(confetti);
    this.time.delayedCall(1800, () => confetti.stop());

    // Tim bay từ dưới lên
    const hearts = this.add.particles(0, H + 20, 'heart', {
      x: { min: 100, max: W - 100 },
      speedY: { min: -260, max: -160 },
      speedX: { min: -30, max: 30 },
      scale: { start: 0.7, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 2600,
      frequency: 140,
    });
    layer.add(hearts);
    this.time.delayedCall(1800, () => hearts.stop());
  }

  /** Banner khi thua: lắc nhẹ + lý do. */
  failBanner(reason) {
    const { width: W, height: H } = this.scale;
    this.pauseMenu?.destroy();
    this.tweens.add({ targets: this.hud, alpha: 0, duration: 200 });
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x140c22, 0).setDepth(10);
    this.tweens.add({ targets: dim, fillAlpha: 0.45, duration: 300 });
    const c = this.add.container(W / 2, H * 0.42).setDepth(11).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(0x3a2a3f, 1).fillRoundedRect(-304, -74, 608, 148, 26);
    g.fillStyle(0x8b7fd6, 1).fillRoundedRect(-300, -70, 600, 140, 24);
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(-280, -60, 560, 28, 14);
    const t = this.add.text(0, -18, 'Ôi không!', titleStyle(56)).setOrigin(0.5);
    const r = this.add.text(0, 40, reason, titleStyle(24)).setOrigin(0.5);
    c.add([g, t, r]);
    this.tweens.add({ targets: c, scale: 1, duration: 450, ease: 'Back.Out' });
    this.tweens.add({ targets: c, x: W / 2 + 10, duration: 60, yoyo: true, repeat: 5, delay: 450 });
  }

  // ---------- Tạm dừng ----------
  togglePause() {
    const L = this.levelScene;
    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
      L.scene.resume();
      Music.duck(false);
      return;
    }
    if (L.state !== 'play') return;
    L.scene.pause();
    Music.duck(true);
    const { width, height } = this.scale;
    const c = this.add.container(0, 0);
    c.add(dimOverlay(this, 0.55));
    c.add(drawPanel(this, width / 2, height / 2, 420, 380, { header: 0x8b7fd6 }));
    c.add(this.add.text(width / 2, height / 2 - 154, 'Tạm dừng', titleStyle(40)).setOrigin(0.5));
    c.add(createButton(this, width / 2, height / 2 - 50, 'Tiếp tục', () => this.togglePause(), { theme: 'leaf' }));
    c.add(createButton(this, width / 2, height / 2 + 40, 'Chơi lại', () => L.scene.restart({ level: this.cfg }), { theme: 'sun' }));
    c.add(createButton(this, width / 2, height / 2 + 130, 'Về bản đồ', () => L.scene.start(SCENES.TRAVEL_MAP), { theme: 'ghost' }));
    c.add(createMuteButton(this, width / 2 + 170, height / 2 - 150));
    this.pauseMenu = c;
  }
}
