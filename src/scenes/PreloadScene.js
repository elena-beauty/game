import Phaser from 'phaser';
import { SCENES } from '../config/keys.js';
import { createCharacterTextures, PHOTOS } from '../art/CharacterArt.js';
import { LEVELS } from '../systems/SaveSystem.js';
import { memoryKeys, trimTexture, loadMemoryPhotos } from '../utils/memory.js';
import { createCommonTextures } from '../art/CommonArt.js';
import { titleStyle } from '../ui/theme.js';

/**
 * Tạo toàn bộ texture dùng chung bằng code (nhân vật, sao, mây...).
 * Khi có asset thật: this.load.image(...) trong preload() — thư mục public/assets/.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    this.load.setPath('assets');
    // Ảnh khuôn mặt thật cho nhân vật — thiếu file thì tự dùng đầu vẽ tay.
    Object.values(PHOTOS).forEach((p) => this.load.image(p.key, p.file));
    // Ảnh kỷ niệm thật — tự ghép theo tên file (src/utils/memory.js)
    loadMemoryPhotos(this);
    this.load.on('loaderror', (file) => console.warn('Không tải được', file.src));
    // this.load.audio('bgm-menu', 'audio/music/menu.mp3');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a1b3d');
    this.add.text(width / 2, height / 2 - 40, 'Đang chuẩn bị hành lý...', titleStyle(40)).setOrigin(0.5);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.2).fillRoundedRect(width / 2 - 200, height / 2 + 20, 400, 24, 12);
    const bar = this.add.graphics();

    const trimMemories = () => LEVELS.forEach((l) => memoryKeys(l.key).forEach((k) => this.textures.exists(k) && trimTexture(this, k)));
    const steps = [() => createCommonTextures(this), () => createCharacterTextures(this), trimMemories];
    steps.forEach((fn, i) =>
      this.time.delayedCall(i * 120, () => {
        fn();
        bar.clear().fillStyle(0xffd166, 1).fillRoundedRect(width / 2 - 200, height / 2 + 20, 400 * ((i + 1) / steps.length), 24, 12);
        if (i === steps.length - 1) this.time.delayedCall(200, () => this.scene.start(SCENES.MAIN_MENU));
      }),
    );
  }
}
