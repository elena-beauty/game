import Phaser from 'phaser';
import { SCENES } from '../config/keys.js';
import { SaveSystem, LEVELS } from '../systems/SaveSystem.js';
import { createButton } from '../ui/Button.js';
import { drawPanel, starRow } from '../ui/Panel.js';
import { titleStyle, textStyle, COLORS, FONT } from '../ui/theme.js';
import { canvasTexture, linear, radial, ellipse } from '../utils/canvas.js';
import { burst } from '../utils/fx.js';
import { hasMemory, memoryUnlocked, memoryKey, coverImage } from '../utils/memory.js';

// Đường viền Việt Nam (lat, lon) — giản lược, đủ để nhận ra hình chữ S.
const VN_OUTLINE = [
  [22.4, 102.15], [22.75, 102.5], [22.5, 103.0], [22.8, 103.6], [22.85, 104.3], [23.2, 104.8], [23.35, 105.3], [23.0, 105.9],
  [22.85, 106.6], [22.4, 106.7], [22.0, 107.0], [21.55, 107.95], [21.4, 107.6], [21.0, 107.2], [20.85, 106.75], [20.5, 106.55],
  [20.2, 106.3], [19.9, 105.95], [19.4, 105.8], [18.8, 105.75], [18.3, 106.1], [17.8, 106.45], [17.3, 106.9], [16.8, 107.2],
  [16.4, 107.7], [16.1, 108.2], [15.6, 108.55], [15.1, 108.85], [14.4, 109.05], [13.8, 109.25], [13.1, 109.35], [12.6, 109.4],
  [12.2, 109.25], [11.8, 109.2], [11.4, 109.0], [11.0, 108.6], [10.7, 108.0], [10.4, 107.2], [10.1, 106.8], [9.6, 106.5],
  [9.2, 106.0], [8.6, 105.1], [8.75, 104.75], [9.3, 104.8], [9.9, 104.85], [10.4, 104.5], [10.9, 105.1], [11.0, 105.85],
  [11.4, 106.0], [11.7, 106.4], [12.2, 107.3], [12.7, 107.5], [13.5, 107.4], [14.4, 107.4], [14.9, 107.5], [15.4, 107.25],
  [15.9, 107.4], [16.4, 106.85], [17.2, 106.3], [17.7, 105.9], [18.2, 105.3], [18.7, 105.1], [19.0, 104.3], [19.3, 103.9],
  [19.7, 104.0], [20.1, 104.5], [20.4, 104.4], [20.7, 104.0], [20.9, 103.4], [21.2, 103.0], [21.6, 102.8], [22.0, 102.45],
];
const project = ([lat, lon]) => [250 + (lon - 102) * 55, 30 + (23.5 - lat) * 42];

export class TravelMapScene extends Phaser.Scene {
  constructor() {
    super(SCENES.TRAVEL_MAP);
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.fadeIn(400, 20, 12, 34);
    this.drawSea(W, H);
    this.drawLand(W, H);
    this.drawRoute();

    this.characterKey = SaveSystem.get('character', 'husband');
    this.pins = {};
    LEVELS.forEach((lv) => this.buildPin(lv));

    // Thanh trên
    createButton(this, 96, 44, '← Menu', () => this.go(SCENES.MAIN_MENU), { theme: 'ghost', width: 150, height: 54, fontSize: 24 });
    this.add.text(186, 44, 'Bản đồ chuyến đi', titleStyle(34)).setOrigin(0, 0.5);
    const g = this.add.graphics();
    g.fillStyle(0x3a2a3f, 0.5).fillRoundedRect(620, 20, 170, 48, 24);
    this.add.image(650, 44, 'star').setDisplaySize(32, 32);
    this.add.text(674, 44, `${SaveSystem.totalStars()} / ${LEVELS.length * 3}`, textStyle(24, '#ffffff', { fontStyle: '800' })).setOrigin(0, 0.5);

    // Avatar người chơi trên bản đồ
    this.avatar = this.add.sprite(0, 0, this.characterKey).setScale(0.42).setOrigin(0.5, 1).setDepth(50).play(`${this.characterKey}-idle`);

    this.panel = this.add.container(0, 0).setDepth(100);
    const last = SaveSystem.get('lastLevel');
    const first = LEVELS.find((l) => l.key === last) ?? LEVELS.find((l) => SaveSystem.getStars(l.key) === 0) ?? LEVELS[0];
    this.select(first, true);

    this.input.keyboard.on('keydown-ENTER', () => this.play());
    this.input.keyboard.on('keydown-SPACE', () => this.play());
  }

  drawSea(W, H) {
    canvasTexture(this, 'map-sea', W, H, (ctx, w, h) => {
      ctx.fillStyle = radial(ctx, w * 0.35, h * 0.45, 50, w * 0.9, [[0, '#7fd6ea'], [1, '#2a86b8']]);
      ctx.fillRect(0, 0, w, h);
    });
    this.add.image(W / 2, H / 2, 'map-sea');
    canvasTexture(this, 'map-waves', 128, 64, (ctx) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      [[20, 18], [84, 50]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 9, Math.PI * 1.1, Math.PI * 1.9);
        ctx.arc(x + 17, y, 9, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
    });
    const waves = this.add.tileSprite(W / 2, H / 2, W, H, 'map-waves');
    this.events.on('update', (_t, dt) => {
      waves.tilePositionX += dt * 0.01;
    });
  }

  drawLand(W, H) {
    canvasTexture(this, 'map-land', W, H, (ctx) => {
      const pts = VN_OUTLINE.map(project);
      const path = () => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const n = pts[(i + 1) % pts.length];
          const mx = (p[0] + n[0]) / 2;
          const my = (p[1] + n[1]) / 2;
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.quadraticCurveTo(p[0], p[1], mx, my);
        }
        const p0 = pts[0];
        const n0 = pts[1];
        ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + n0[0]) / 2, (p0[1] + n0[1]) / 2);
        ctx.closePath();
      };
      // Bóng + viền sáng ven biển
      ctx.save();
      ctx.translate(6, 10);
      path();
      ctx.fillStyle = 'rgba(10,40,80,0.35)';
      ctx.fill();
      ctx.restore();
      path();
      ctx.lineWidth = 18;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
      ctx.fillStyle = linear(ctx, 0, 40, 0, 640, [[0, '#7cc576'], [0.45, '#a8d98a'], [0.75, '#c9e39a'], [1, '#8fd27a']]);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#3a6b45';
      ctx.stroke();
      // Đảo
      const islands = [[10.2, 103.95, 9, 16], [8.7, 106.6, 4, 3], [20.75, 107.05, 6, 4]];
      islands.forEach(([lat, lon, rx, ry]) => {
        const [x, y] = project([lat, lon]);
        ellipse(ctx, x, y, rx, ry);
        ctx.fillStyle = '#a8d98a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3a6b45';
        ctx.stroke();
      });
      // Hoàng Sa, Trường Sa (đặt gần bờ cho gọn bản đồ)
      [[745, 300], [770, 560]].forEach(([x, y]) => {
        [[0, 0], [14, 8], [-10, 12], [6, -10], [20, -4]].forEach(([dx, dy]) => {
          ellipse(ctx, x + dx, y + dy, 4, 3);
          ctx.fillStyle = '#c9e39a';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#3a6b45';
          ctx.stroke();
        });
      });
      // Ô Singapore
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(70, 590, 170, 110, 18);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ellipse(ctx, 150, 668, 46, 16);
      ctx.fillStyle = '#a8d98a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#3a6b45';
      ctx.stroke();
    });
    this.add.image(W / 2, H / 2, 'map-land');

    const label = (x, y, s, size = 16, color = '#ffffff') =>
      this.add.text(x, y, s, textStyle(size, color, { fontStyle: '700', stroke: '#1f5f86', strokeThickness: 4 })).setOrigin(0.5);
    label(745, 324, 'Hoàng Sa');
    label(770, 584, 'Trường Sa');
    label(560, 470, 'Biển Đông', 22, 'rgba(255,255,255,0.8)');
    label(150, 690, 'Singapore', 16);

    // Trang trí: cây trên đất liền
    [[440, 110, 'pine'], [480, 205, 'pine'], [560, 380, 'pine'], [580, 455, 'pine'], [535, 545, 'palm'], [455, 590, 'palm'], [500, 290, 'pine']].forEach(([x, y, k]) =>
      this.add.image(x, y, k).setScale(0.16).setOrigin(0.5, 1).setAlpha(0.9),
    );
  }

  drawRoute() {
    // Đường đi theo địa lý Bắc → Nam rồi bay sang Singapore (số trên ghim = thứ tự độ khó).
    const route = ['HaNoi', 'HaLong', 'CatBa', 'DaNang', 'QuyNhon', 'DaLat', 'NinhThuan', 'PhuQuoc', 'Singapore'];
    const pts = route.map((k) => LEVELS.find((l) => l.key === k)?.map).filter(Boolean);
    const g = this.add.graphics();
    g.lineStyle(4, 0xffffff, 0.85);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(a.x, a.y),
        new Phaser.Math.Vector2((a.x + b.x) / 2 + (b.y - a.y) * 0.12, (a.y + b.y) / 2 - (b.x - a.x) * 0.12),
        new Phaser.Math.Vector2(b.x, b.y),
      );
      const ps = curve.getSpacedPoints(Math.ceil(curve.getLength() / 14));
      for (let k = 0; k < ps.length - 1; k += 2) g.lineBetween(ps[k].x, ps[k].y, ps[k + 1].x, ps[k + 1].y);
    }
    // Máy bay nhỏ trên đường bay tới Singapore
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    const plane = this.add.text((a.x + b.x) / 2 - 20, (a.y + b.y) / 2 - 10, '✈', { fontFamily: FONT, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setAngle(200);
    this.tweens.add({ targets: plane, y: plane.y - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  buildPin(lv) {
    const { x, y } = lv.map;
    const unlocked = SaveSystem.isUnlocked(lv);
    const stars = SaveSystem.getStars(lv.key);
    const color = Phaser.Display.Color.HexStringToColor(unlocked ? lv.color : '#9aa3b5').color;
    const c = this.add.container(x, y).setDepth(10 + lv.order);

    const shadow = this.add.image(0, 2, 'shadow').setScale(0.7);
    const pin = this.add.image(0, -36, 'pin').setScale(0.82);
    const disc = this.add.circle(0, -45, 15, color);
    const icon = unlocked
      ? this.add.text(0, -45, lv.icon, { fontFamily: FONT, fontSize: '20px', padding: { x: 2, y: 4 } }).setOrigin(0.5)
      : this.add.image(0, -45, 'lock').setScale(0.6);
    const num = this.add.circle(18, -64, 11, 0x3a2a3f);
    const numT = this.add.text(18, -64, String(lv.order), textStyle(14, '#ffffff', { fontStyle: '800' })).setOrigin(0.5);
    c.add([shadow, pin, disc, icon, num, numT]);
    if (stars > 0) c.add(starRow(this, 0, 10, stars, { size: 16, gap: 1 }));

    c.setSize(60, 80);
    c.setInteractive(new Phaser.Geom.Rectangle(-28, -76, 56, 86), Phaser.Geom.Rectangle.Contains);
    c.input.cursor = 'pointer';
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.18, duration: 150, ease: 'Back.Out' }));
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: this.current === lv ? 1.1 : 1, duration: 150 }));
    c.on('pointerup', () => this.select(lv));

    // Nhảy nhẹ khi mới thả ghim
    c.y -= 30;
    c.alpha = 0;
    this.tweens.add({ targets: c, y, alpha: 1, duration: 500, delay: 80 * lv.order, ease: 'Bounce.Out' });
    this.pins[lv.key] = c;
  }

  select(lv, instant = false) {
    this.current = lv;
    SaveSystem.set('lastLevel', lv.key);
    Object.entries(this.pins).forEach(([k, c]) => this.tweens.add({ targets: c, scale: k === lv.key ? 1.1 : 1, duration: 150 }));

    // Avatar nhảy tới ghim
    const tx = lv.map.x + 26;
    const ty = lv.map.y + 4;
    if (instant) this.avatar.setPosition(tx, ty);
    else {
      this.avatar.play(`${this.characterKey}-jump`);
      this.tweens.add({ targets: this.avatar, x: tx, duration: 450, ease: 'Sine.InOut' });
      this.tweens.add({
        targets: this.avatar,
        y: { from: this.avatar.y, to: ty },
        duration: 450,
        ease: 'Quad.Out',
        onComplete: () => this.avatar.play(`${this.characterKey}-idle`),
      });
      burst(this, lv.map.x, lv.map.y - 40, { count: 10, tint: 0xffd166, scale: 0.5 });
    }
    this.renderPanel(lv);
  }

  renderPanel(lv) {
    this.panel.removeAll(true);
    const unlocked = SaveSystem.isUnlocked(lv);
    const best = SaveSystem.getStars(lv.key);
    const cx = 1040;
    const cy = 392;
    const pw = 420;
    const ph = 600;
    const top = cy - ph / 2;
    const headerColor = Phaser.Display.Color.HexStringToColor(lv.color).color;
    const P = this.panel;
    P.add(drawPanel(this, cx, cy, pw, ph, { header: headerColor }));
    P.add(this.add.text(cx, top + 36, `${lv.icon} ${lv.name}`, titleStyle(40)).setOrigin(0.5));
    P.add(this.add.text(cx, top + 96, lv.title, textStyle(25, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5));

    // Độ khó
    P.add(this.add.text(cx - 170, top + 136, 'Độ khó', textStyle(18, '#8a7a99', { fontStyle: '700' })).setOrigin(0, 0.5));
    P.add(this.add.text(cx - 90, top + 136, '●'.repeat(lv.difficulty) + '○'.repeat(5 - lv.difficulty), textStyle(20, COLORS.pinkDark, { fontStyle: '800' })).setOrigin(0, 0.5));
    P.add(this.add.text(cx + 60, top + 136, 'Kỷ lục', textStyle(18, '#8a7a99', { fontStyle: '700' })).setOrigin(0, 0.5));
    P.add(starRow(this, cx + 155, top + 136, best, { size: 24, gap: 2 }));

    P.add(this.add.text(cx, top + 166, lv.desc, textStyle(18, '#5b4a6b', { align: 'center', wordWrap: { width: pw - 50 } })).setOrigin(0.5, 0));

    // Ảnh kỷ niệm (nếu có) hoặc khung trống
    const photoY = top + 360;
    const frame = this.add.graphics();
    frame.fillStyle(0x000000, 0.18).fillRoundedRect(cx - 150 + 4, photoY - 90 + 6, 300, 180, 10);
    frame.fillStyle(0xffffff, 1).fillRoundedRect(cx - 150, photoY - 90, 300, 180, 10);
    frame.fillStyle(0xeae3f0, 1).fillRoundedRect(cx - 140, photoY - 80, 280, 140, 6);
    P.add(frame);
    const photo = SaveSystem.getPhoto(lv.key);
    if (memoryUnlocked(this, lv.key)) P.add(coverImage(this, cx, photoY - 10, memoryKey(lv.key), 280, 140));
    else if (photo) this.showPhoto(lv.key, photo, cx, photoY - 10, 280, 140);
    else {
      P.add(this.add.image(cx, photoY - 18, 'icon-camera').setAlpha(0.35));
      const msg = hasMemory(this, lv.key) ? 'Thắng ván để mở ảnh kỷ niệm thật' : 'Chưa có ảnh kỷ niệm';
      P.add(this.add.text(cx, photoY + 30, msg, textStyle(16, '#9a8aa9')).setOrigin(0.5));
    }
    P.add(this.add.text(cx, photoY + 74, lv.name, textStyle(18, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5));

    if (unlocked) {
      P.add(createButton(this, cx, top + ph - 52, best > 0 ? 'Chơi lại' : 'Lên đường!', () => this.play(), { theme: best > 0 ? 'sun' : 'primary', width: 300, height: 70, fontSize: 32 }));
    } else {
      const need = lv.unlock;
      P.add(this.add.image(cx - 150, top + ph - 60, 'lock'));
      P.add(
        this.add
          .text(cx + 10, top + ph - 60, `Hoàn thành ${need.levels} ván\nhoặc đạt ${need.orStars} ★ để mở khóa`, textStyle(18, COLORS.ink, { align: 'center', fontStyle: '700' }))
          .setOrigin(0.5),
      );
    }
    P.setAlpha(0);
    P.x = 30;
    this.tweens.add({ targets: P, alpha: 1, x: 0, duration: 250, ease: 'Cubic.Out' });
  }

  showPhoto(levelKey, dataUrl, x, y, w, h) {
    const key = `photo-${levelKey}`;
    const place = () => {
      if (this.current?.key !== levelKey) return;
      this.panel.add(this.add.image(x, y, key).setDisplaySize(w, h));
    };
    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.once(`addtexture-${key}`, place);
    this.textures.addBase64(key, dataUrl);
  }

  play() {
    const lv = this.current;
    if (!lv || !SaveSystem.isUnlocked(lv)) return;
    this.go(lv.key, { level: lv });
  }

  go(scene, data) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene, data));
  }
}
