import Phaser from 'phaser';
import { SCENES } from '../config/keys.js';
import { SaveSystem, LEVELS } from '../systems/SaveSystem.js';
import { createButton } from '../ui/Button.js';
import { titleStyle, textStyle, COLORS } from '../ui/theme.js';
import { canvasTexture, linear } from '../utils/canvas.js';
import { starRow, dimOverlay } from '../ui/Panel.js';
import { hasMemory, memoryUnlocked, memoryKey, coverImage } from '../utils/memory.js';

/**
 * Album Kỷ Niệm: ảnh polaroid ghim trên bảng gỗ.
 * Ưu tiên ảnh kỷ niệm thật (mở khóa khi thắng ván), không có thì dùng ảnh chụp trong game.
 * Bấm vào ảnh để xem to.
 */
export class AlbumScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ALBUM);
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.fadeIn(400, 20, 12, 34);
    canvasTexture(this, 'album-board', W, H, (ctx, w, h) => {
      ctx.fillStyle = linear(ctx, 0, 0, 0, h, [[0, '#c98e5a'], [1, '#a86e3f']]);
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(90,50,20,0.25)';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.random() * 6);
        ctx.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 8, w, y + Math.random() * 6);
        ctx.stroke();
      }
    });
    this.add.image(W / 2, H / 2, 'album-board');

    const count = LEVELS.filter((l) => memoryUnlocked(this, l.key) || SaveSystem.getPhoto(l.key)).length;
    this.add.text(W / 2, 50, `Album Kỷ Niệm  ${count}/${LEVELS.length}`, titleStyle(46)).setOrigin(0.5);
    this.add.text(W / 2, 96, 'Thắng mỗi ván để mở ảnh kỷ niệm — bấm vào ảnh để xem to', textStyle(18, '#fff3e0', { fontStyle: '700' })).setOrigin(0.5);

    const cols = 5;
    const cw = 238;
    const ch = 250;
    LEVELS.forEach((lv, i) => {
      const r = Math.floor(i / cols);
      const col = i % cols;
      const rowCount = r === 0 ? cols : LEVELS.length - cols;
      const x = W / 2 + (col - (rowCount - 1) / 2) * cw;
      const y = 245 + r * ch;
      this.card(lv, x, y, (i % 2 ? 1 : -1) * Phaser.Math.Between(1, 3));
    });

    createButton(this, 100, H - 40, '← Menu', () => this.go(SCENES.MAIN_MENU), { theme: 'ghost', width: 160, height: 54, fontSize: 24 });
    createButton(this, W - 130, H - 40, 'Bản đồ', () => this.go(SCENES.TRAVEL_MAP), { theme: 'sea', width: 200, height: 54, fontSize: 24 });
  }

  card(lv, x, y, angle) {
    const PW = 200;
    const PH = 112;
    const PY = -34;
    const c = this.add.container(x, y).setAngle(angle);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRect(-110 + 5, -100 + 8, 220, 200);
    g.fillStyle(0xfffdf7, 1).fillRect(-110, -100, 220, 200);
    g.fillStyle(0x3a2a3f, 0.12).fillRect(-PW / 2, PY - PH / 2, PW, PH);
    c.add(g);

    let viewKey = null;
    const snapshot = SaveSystem.getPhoto(lv.key);
    if (memoryUnlocked(this, lv.key)) {
      viewKey = memoryKey(lv.key);
      c.add(coverImage(this, 0, PY, viewKey, PW, PH));
      c.add(this.add.text(PW / 2 - 6, PY + PH / 2 - 4, '♥', textStyle(20, '#ff5d8f', { fontStyle: '800', stroke: '#ffffff', strokeThickness: 4 })).setOrigin(1, 1));
    } else if (snapshot) {
      const key = `album-${lv.key}`;
      viewKey = key;
      const place = () => c.addAt(coverImage(this, 0, PY, key, PW, PH), 1);
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.once(`addtexture-${key}`, place);
      this.textures.addBase64(key, snapshot);
    } else {
      c.add(this.add.text(0, PY - 8, '?', titleStyle(52, '#ffffff', '#b8a8c8')).setOrigin(0.5));
      if (hasMemory(this, lv.key)) c.add(this.add.text(0, PY + 36, '📷 Có ảnh kỷ niệm thật', textStyle(14, '#8a7a99', { fontStyle: '700' })).setOrigin(0.5));
    }
    c.add(this.add.text(0, 44, `${lv.icon} ${lv.name}`, textStyle(20, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5));
    c.add(starRow(this, 0, 74, SaveSystem.getStars(lv.key), { size: 18, gap: 2 }));
    c.add(this.add.circle(0, -98, 9, Phaser.Display.Color.HexStringToColor(lv.color).color).setStrokeStyle(3, 0x3a2a3f));

    if (viewKey) {
      c.setSize(220, 200);
      c.setInteractive(new Phaser.Geom.Rectangle(-110, -100, 220, 200), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 120 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerup', () => this.lightbox(viewKey, lv));
    }
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 400, delay: lv.order * 60, ease: 'Back.Out' });
  }

  /** Xem ảnh to. Bấm bất kỳ đâu hoặc Esc để đóng. */
  lightbox(key, lv) {
    const { width: W, height: H } = this.scale;
    const layer = this.add.container(0, 0).setDepth(100);
    const dim = dimOverlay(this, 0.75);
    const fw = 920;
    const fh = 590;
    const frame = this.add.graphics();
    frame.fillStyle(0x000000, 0.35).fillRect(W / 2 - fw / 2 + 8, H / 2 - fh / 2 + 12, fw, fh);
    frame.fillStyle(0xfffdf7, 1).fillRect(W / 2 - fw / 2, H / 2 - fh / 2, fw, fh);
    const img = coverImage(this, W / 2, H / 2 - 30, key, fw - 40, 495);
    const cap = this.add.text(W / 2, H / 2 + fh / 2 - 32, `${lv.icon} ${lv.name} — ${lv.title}`, textStyle(26, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5);
    const hint = this.add.text(W / 2, H - 16, 'Bấm để đóng', textStyle(16, '#ffffff')).setOrigin(0.5, 1);
    layer.add([dim, frame, img, cap, hint]);
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 200 });
    const close = () => {
      this.input.keyboard.off('keydown-ESC', close);
      this.tweens.add({ targets: layer, alpha: 0, duration: 150, onComplete: () => layer.destroy() });
    };
    dim.on('pointerup', close);
    this.input.keyboard.once('keydown-ESC', close);
  }

  go(scene) {
    this.cameras.main.fadeOut(300, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene));
  }
}
