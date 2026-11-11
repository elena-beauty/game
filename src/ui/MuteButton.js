import { Music } from '../systems/Music.js';
import { FONT } from './theme.js';

/** Nút tròn bật/tắt nhạc (cũng có phím M). */
export function createMuteButton(scene, x, y) {
  const bg = scene.add.circle(0, 0, 26, 0x3a2a3f, 0.55).setStrokeStyle(3, 0xffffff, 0.8);
  const icon = scene.add.text(0, 1, '', { fontFamily: FONT, fontSize: '26px', padding: { x: 2, y: 4 } }).setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, icon]).setDepth(1000);
  const refresh = () => icon.setText(Music.muted ? '🔇' : '🔊');
  refresh();
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerup', () => {
    Music.toggleMute();
    refresh();
    scene.tweens.add({ targets: c, scale: 1.15, duration: 90, yoyo: true });
  });
  const onKey = () => refresh();
  window.addEventListener('music-mute-changed', onKey);
  scene.events.once('shutdown', () => window.removeEventListener('music-mute-changed', onKey));
  return c;
}
