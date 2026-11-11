import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

import { Music } from './systems/Music.js';

const game = new Phaser.Game(gameConfig);

// Phím M: bật/tắt nhạc ở mọi màn hình
window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    Music.toggleMute();
    window.dispatchEvent(new Event('music-mute-changed'));
  }
});

// Truy cập game từ DevTools khi dev: __game.scene.start('QuyNhon')
if (import.meta.env.DEV) window.__game = game;

export default game;
