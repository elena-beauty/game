import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene.js';
import { PreloadScene } from '../scenes/PreloadScene.js';
import { MainMenuScene } from '../scenes/MainMenuScene.js';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene.js';
import { TravelMapScene } from '../scenes/TravelMapScene.js';
import { ResultScene } from '../scenes/ResultScene.js';
import { AlbumScene } from '../scenes/AlbumScene.js';
import { HUDScene } from '../scenes/HUDScene.js';
import { HaNoiLevel } from '../scenes/levels/HaNoiLevel.js';
import { QuyNhonLevel } from '../scenes/levels/QuyNhonLevel.js';
import { CatBaLevel } from '../scenes/levels/CatBaLevel.js';
import { DaLatLevel } from '../scenes/levels/DaLatLevel.js';
import { NinhThuanLevel } from '../scenes/levels/NinhThuanLevel.js';
import { HaLongLevel } from '../scenes/levels/HaLongLevel.js';
import { DaNangLevel } from '../scenes/levels/DaNangLevel.js';
import { PhuQuocLevel } from '../scenes/levels/PhuQuocLevel.js';
import { SingaporeLevel } from '../scenes/levels/SingaporeLevel.js';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Mỗi ván là 1 scene, key trùng với "key" trong levels.json.
export const LEVEL_SCENES = [HaNoiLevel, QuyNhonLevel, CatBaLevel, DaLatLevel, NinhThuanLevel, HaLongLevel, DaNangLevel, PhuQuocLevel, SingaporeLevel];

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#2a1b3d',
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, PreloadScene, MainMenuScene, CharacterSelectScene, TravelMapScene, ...LEVEL_SCENES, ResultScene, AlbumScene, HUDScene],
};
