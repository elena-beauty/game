import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';

const game = new Phaser.Game(gameConfig);

// Truy cập game từ DevTools khi dev: __game.scene.start('QuyNhon')
if (import.meta.env.DEV) window.__game = game;

export default game;
