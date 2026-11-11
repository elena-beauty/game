// Quản lý nhạc nền & SFX qua Phaser Sound Manager.
export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.music = null;
  }

  playMusic(key, { volume = 0.5, loop = true } = {}) {
    if (this.music?.key === key) return;
    this.music?.stop();
    if (!this.scene.cache.audio.exists(key)) return;
    this.music = this.scene.sound.add(key, { volume, loop });
    this.music.play();
  }

  playSfx(key, config = {}) {
    if (this.scene.cache.audio.exists(key)) this.scene.sound.play(key, config);
  }

  stopMusic() {
    this.music?.stop();
    this.music = null;
  }
}
