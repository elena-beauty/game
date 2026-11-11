import Phaser from 'phaser';
import { SCENES } from '../config/keys.js';

// Chờ web font (Baloo 2) tải xong để chữ không bị nhảy font, rồi sang Preload.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  create() {
    const go = () => this.scene.start(SCENES.PRELOAD);
    if (!document.fonts?.load) return go();
    const timeout = new Promise((r) => setTimeout(r, 2500));
    Promise.race([Promise.all([document.fonts.load('800 32px "Baloo 2"'), document.fonts.load('600 20px "Baloo 2"')]), timeout])
      .catch(() => {})
      .finally(go);
  }
}
