import Phaser from 'phaser';
import { SCENES } from '../config/keys.js';
import { otherCharacter } from '../config/characters.js';
import { SaveSystem, LEVELS, getLevel } from '../systems/SaveSystem.js';
import { createButton } from '../ui/Button.js';
import { drawPanel } from '../ui/Panel.js';
import { titleStyle, textStyle, COLORS } from '../ui/theme.js';
import { burst } from '../utils/fx.js';
import { memoryUnlocked, memoryKey, coverImage } from '../utils/memory.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.RESULT);
  }

  init(data) {
    this.result = data; // { levelKey, win, stars, summary, photo, reason, time }
  }

  create() {
    const { width: W, height: H } = this.scale;
    const { levelKey, win, stars, summary = [], photo, reason } = this.result;
    const lv = getLevel(levelKey);
    const prev = SaveSystem.getStars(levelKey);
    if (win) {
      SaveSystem.setStars(levelKey, stars);
      if (photo) SaveSystem.setPhoto(levelKey, photo);
    }
    this.cameras.main.fadeIn(400, 20, 12, 34);

    // Nền
    const base = Phaser.Display.Color.HexStringToColor(lv.color).color;
    const g = this.add.graphics();
    g.fillGradientStyle(base, base, 0x2a1b3d, 0x2a1b3d, 1);
    g.fillRect(0, 0, W, H);
    const rays = this.add.graphics({ x: W / 2, y: 250 });
    rays.fillStyle(0xffffff, 0.08);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      rays.fillTriangle(0, 0, Math.cos(a) * 900, Math.sin(a) * 900, Math.cos(a + 0.18) * 900, Math.sin(a + 0.18) * 900);
    }
    this.tweens.add({ targets: rays, angle: 360, duration: 40000, repeat: -1 });

    const cx = W / 2;
    const cy = H / 2 + 10;
    drawPanel(this, cx, cy, 640, 600, { header: win ? 0xffb733 : 0x8b7fd6 });
    this.add.text(cx, cy - 264, win ? 'Hoàn thành!' : 'Thử lại nhé!', titleStyle(48)).setOrigin(0.5);
    this.add.text(cx, cy - 200, `${lv.icon} ${lv.name} — ${lv.title}`, textStyle(24, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5);

    if (win) {
      // Sao bật ra lần lượt
      for (let i = 0; i < 3; i++) {
        const x = cx + (i - 1) * 96;
        const y = cy - 120 + (i === 1 ? -14 : 0);
        this.add.image(x, y, 'star-empty').setDisplaySize(84, 84).setTint(0x8a7a99);
        if (i < stars) {
          const s = this.add.image(x, y, 'star').setDisplaySize(84, 84).setScale(0);
          this.tweens.add({
            targets: s,
            scale: 84 / 64,
            angle: { from: -90, to: 0 },
            duration: 450,
            delay: 400 + i * 350,
            ease: 'Back.Out',
            onStart: () => burst(this, x, y, { count: 14, tint: 0xffd166, scale: 0.6, speed: 260 }),
          });
        }
      }
      if (stars > prev) {
        const nb = this.add.text(cx + 220, cy - 150, 'Kỷ lục mới!', titleStyle(24, '#ffffff', '#d94a7b')).setOrigin(0.5).setAngle(12).setScale(0);
        this.tweens.add({ targets: nb, scale: 1, delay: 1500, duration: 400, ease: 'Back.Out' });
      }
      // Ảnh polaroid
      if (memoryUnlocked(this, levelKey)) this.memoryPolaroid(levelKey, lv, cx, cy + 28, prev === 0);
      else if (photo) this.polaroid(photo, cx, cy + 28);
      else this.add.image(cx, cy + 28, 'icon-camera').setScale(1.5);

      this.time.addEvent({
        delay: 280,
        repeat: 18,
        callback: () =>
          burst(this, Phaser.Math.Between(80, W - 80), Phaser.Math.Between(40, 200), {
            texture: Phaser.Utils.Array.GetRandom(['heart', 'star', 'spark']),
            count: 6,
            scale: 0.35,
            gravity: 300,
            tint: Phaser.Utils.Array.GetRandom([0xffffff, 0xffd166, 0xff8fb8, 0x8fe9f2]),
          }),
      });
    } else {
      this.add.text(cx, cy - 110, reason || 'Không sao, mình làm lại nhé!', textStyle(28, COLORS.pinkDark, { fontStyle: '800', align: 'center', wordWrap: { width: 560 } })).setOrigin(0.5);
    }

    // Tóm tắt
    const sy = win ? cy + 140 : cy - 40;
    summary.slice(0, 3).forEach((line, i) => this.add.text(cx, sy + i * 28, line, textStyle(20, '#5b4a6b', { fontStyle: '700' })).setOrigin(0.5));

    // Nhân vật hai bên
    const me = SaveSystem.get('character', 'husband');
    const partner = otherCharacter(me);
    [[me, cx - 420], [partner, cx + 420]].forEach(([key, x], i) => {
      const sp = this.add.sprite(x, H - 40, key).setOrigin(0.5, 1).setScale(1.5).setFlipX(i === 1);
      sp.play(`${key}-${win ? 'cheer' : i === 0 ? 'hurt' : 'idle'}`);
    });
    if (!win) {
      const p = this.add.text(cx + 420, H - 260, 'Không sao đâu,\nthử lại nha!', textStyle(20, COLORS.ink, { backgroundColor: '#ffffff', padding: { x: 12, y: 8 }, align: 'center', fontStyle: '700' })).setOrigin(0.5);
      this.tweens.add({ targets: p, y: p.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // Nút
    const by = cy + 246;
    const next = LEVELS.find((l) => l.order === lv.order + 1);
    const nextOk = win && next && SaveSystem.isUnlocked(next);
    createButton(this, cx - (nextOk ? 210 : 140), by, 'Chơi lại', () => this.go(levelKey, { level: lv }), { theme: 'sun', width: 200, height: 62, fontSize: 26 });
    createButton(this, nextOk ? cx : cx + 140, by, 'Bản đồ', () => this.go(SCENES.TRAVEL_MAP), { theme: 'sea', width: 200, height: 62, fontSize: 26 });
    if (nextOk) {
      createButton(this, cx + 210, by, 'Ván tiếp →', () => {
        SaveSystem.set('lastLevel', next.key);
        this.go(next.key, { level: next });
      }, { theme: 'leaf', width: 200, height: 62, fontSize: 26 });
    }
  }

  /** Ảnh kỷ niệm thật của địa điểm (mở khóa khi thắng). */
  memoryPolaroid(levelKey, lv, x, y, isNew) {
    const c = this.add.container(x, y).setScale(0);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRect(-150 + 6, -95 + 8, 300, 200);
    g.fillStyle(0xffffff, 1).fillRect(-150, -95, 300, 200);
    const img = coverImage(this, 0, -12, memoryKey(levelKey), 280, 157);
    const cap = this.add.text(0, 84, `♥ Kỷ niệm ở ${lv.name}`, textStyle(16, COLORS.pinkDark, { fontStyle: '800' })).setOrigin(0.5);
    c.add([g, img, cap]);
    this.tweens.add({ targets: c, scale: 0.85, duration: 500, delay: 300, ease: 'Back.Out' });
    if (isNew) {
      const tag = this.add.text(x - 150, y - 92, 'Mở khóa ảnh mới!', titleStyle(20, '#ffffff', '#d94a7b')).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: tag, scale: 1, duration: 400, delay: 1200, ease: 'Back.Out' });
    }
  }

  polaroid(dataUrl, x, y) {
    const key = `result-photo-${Date.now()}`;
    this.textures.once(`addtexture-${key}`, () => {
      const c = this.add.container(x, y).setScale(0);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25).fillRect(-150 + 6, -95 + 8, 300, 200);
      g.fillStyle(0xffffff, 1).fillRect(-150, -95, 300, 200);
      const img = this.add.image(0, -10, key).setDisplaySize(276, 155);
      c.add([g, img]);
      this.tweens.add({ targets: c, scale: 0.8, duration: 500, delay: 300, ease: 'Back.Out' });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.remove(key));
    });
    this.textures.addBase64(key, dataUrl);
  }

  go(scene, data) {
    this.cameras.main.fadeOut(300, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(scene, data));
  }
}
