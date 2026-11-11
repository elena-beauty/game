import Phaser from 'phaser';
import { SCENES, CHARACTERS } from '../config/keys.js';
import { CHARACTER_STATS } from '../config/characters.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { createButton } from '../ui/Button.js';
import { drawPanel } from '../ui/Panel.js';
import { titleStyle, textStyle, COLORS } from '../ui/theme.js';
import { skyTexture, canvasTexture } from '../utils/canvas.js';
import { burst, driftClouds } from '../utils/fx.js';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.CHARACTER_SELECT);
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.fadeIn(400, 20, 12, 34);
    skyTexture(this, 'select-bg', W, H, [[0, '#8fd3fe'], [0.6, '#ffd6e8'], [1, '#ffeacc']]);
    this.add.image(W / 2, H / 2, 'select-bg');
    // Họa tiết chấm bi
    canvasTexture(this, 'polka', 64, 64, (ctx) => {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.arc(48, 48, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    const polka = this.add.tileSprite(W / 2, H / 2, W, H, 'polka');
    this.events.on('update', () => {
      polka.tilePositionX += 0.3;
      polka.tilePositionY += 0.3;
    });
    driftClouds(this, { count: 4, yMin: 20, yMax: 160, scrollFactor: 0, alpha: 0.7 });

    this.add.text(W / 2, 70, 'Bạn sẽ là ai?', titleStyle(64)).setOrigin(0.5);
    this.add.text(W / 2, 128, 'Người còn lại sẽ là bạn đồng hành cổ vũ & giúp đỡ bạn', textStyle(22, COLORS.ink)).setOrigin(0.5);

    this.selected = SaveSystem.get('character', null);
    this.cards = {};
    [CHARACTERS.HUSBAND, CHARACTERS.WIFE].forEach((key, i) => this.buildCard(key, W / 2 + (i === 0 ? -250 : 250), 400));

    this.goBtn = createButton(this, W / 2, H - 52, 'Xuất phát!', () => this.confirm(), { theme: 'leaf', width: 300, height: 70, fontSize: 34 });
    createButton(this, 100, H - 52, '← Quay lại', () => this.scene.start(SCENES.MAIN_MENU), { theme: 'ghost', width: 170, height: 56, fontSize: 24 });
    this.refresh();
  }

  buildCard(key, x, y) {
    const s = CHARACTER_STATS[key];
    const c = this.add.container(x, y);
    const glow = this.add.graphics();
    const panel = drawPanel(this, 0, 0, 400, 440, { header: s.color });
    // Bệ đứng
    const ped = this.add.ellipse(0, 40, 200, 50, s.color, 0.35);
    const sprite = this.add.sprite(0, 52, key).setOrigin(0.5, 1).setScale(1.55).play(`${key}-idle`);
    const name = this.add.text(0, -186, s.name, titleStyle(44)).setOrigin(0.5);
    const title = this.add.text(0, 70, s.title, textStyle(24, COLORS.ink, { fontStyle: '800' })).setOrigin(0.5);
    const desc = this.add.text(0, 100, s.desc, textStyle(17, '#6b5b78', { align: 'center', wordWrap: { width: 340 } })).setOrigin(0.5, 0);
    c.add([glow, panel, ped, sprite, name, title, desc]);

    [['Tốc độ', s.bars.speed, '#ff7a59'], ['Nhảy', s.bars.jump, '#8b7fd6'], ['Sức bền', s.bars.stamina, '#33b36b']].forEach(([label, v, color], i) => {
      const yy = 150 + i * 26;
      c.add(this.add.text(-150, yy, label, textStyle(17, COLORS.ink, { fontStyle: '700' })).setOrigin(0, 0.5));
      const g = this.add.graphics();
      g.fillStyle(0x3a2a3f, 0.15).fillRoundedRect(-60, yy - 8, 210, 16, 8);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1).fillRoundedRect(-60, yy - 8, 210 * v, 16, 8);
      c.add(g);
    });

    c.setSize(400, 440);
    c.setInteractive(new Phaser.Geom.Rectangle(-200, -220, 400, 440), Phaser.Geom.Rectangle.Contains);
    c.input.cursor = 'pointer';
    c.on('pointerover', () => sprite.play(`${key}-cheer`));
    c.on('pointerout', () => sprite.play(`${key}-idle`));
    c.on('pointerup', () => {
      this.selected = key;
      burst(this, x, y - 40, { texture: 'heart', count: 12, scale: 0.6 });
      this.refresh();
    });
    this.cards[key] = { c, glow, sprite };
  }

  refresh() {
    Object.entries(this.cards).forEach(([key, { c, glow }]) => {
      const on = key === this.selected;
      glow.clear();
      if (on) {
        glow.fillStyle(0xffd166, 1).fillRoundedRect(-216, -236, 432, 472, 36);
        glow.fillStyle(0xffffff, 0.6).fillRoundedRect(-210, -230, 420, 460, 34);
      }
      this.tweens.add({ targets: c, scale: on ? 1.04 : this.selected ? 0.94 : 1, duration: 200, ease: 'Back.Out' });
      c.setAlpha(!this.selected || on ? 1 : 0.75);
    });
    this.goBtn.setEnabled(!!this.selected);
  }

  confirm() {
    if (!this.selected) return;
    SaveSystem.set('character', this.selected);
    this.cameras.main.fadeOut(300, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.TRAVEL_MAP));
  }
}
