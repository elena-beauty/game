import Phaser from 'phaser';
import { SCENES, EVENTS } from '../../config/keys.js';
import { SaveSystem, getLevel } from '../../systems/SaveSystem.js';
import { InputManager } from '../../systems/InputManager.js';
import { burst } from '../../utils/fx.js';
import { Music, LEVEL_MUSIC } from '../../systems/Music.js';

/**
 * Lớp cha cho mọi ván. Vòng đời:
 *   create() → buildLevel() → HUD hiện bảng giới thiệu → người chơi bấm Space → state 'play'
 *   update() → updateLevel(dt) mỗi frame → isWin()/isLose()/hết giờ → finish()
 *
 * Ván con override:
 *   buildLevel()            dựng thế giới, this.player, this.companion...
 *   updateLevel(dt)         logic mỗi frame (chỉ chạy khi state === 'play')
 *   isWin() / isLose()      điều kiện thắng / thua
 *   getStars()              1–3 sao (chỉ gọi khi thắng)
 *   getHudState()           { bars: [{ key, label, value, max, color }], counters: [{ key, icon, value, max }], hint }
 *   getSummary()            mảng chuỗi tóm tắt hiển thị ở màn kết quả
 *   onPlayStart()           (tùy chọn) khi người chơi bấm bắt đầu
 *
 * Tiện ích: this.toast(text, color), this.loseReason, this.elapsed, this.timeLeft, this.inputManager.
 */
export class BaseLevel extends Phaser.Scene {
  init(data = {}) {
    this.levelConfig = data.level ?? getLevel(this.scene.key);
    this.characterKey = SaveSystem.get('character', 'husband');
    this.timeLimit = this.levelConfig.timeLimit ?? 120;
    this.timeLeft = this.timeLimit;
    this.elapsed = 0;
    this.state = 'intro'; // intro | play | end
    this.loseReason = '';
  }

  create() {
    this.inputManager = new InputManager(this);
    this.cameras.main.fadeIn(400, 20, 12, 34);
    Music.play(LEVEL_MUSIC[this.scene.key] ?? 'map');
    this.buildLevel();
    this.scene.launch(SCENES.HUD, { levelScene: this });
    this.scene.bringToTop(SCENES.HUD);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop(SCENES.HUD));
  }

  /** HUD gọi khi người chơi bấm "Bắt đầu". */
  startPlay() {
    if (this.state !== 'intro') return;
    this.state = 'play';
    this.onPlayStart();
    this.events.emit(EVENTS.PLAY_START);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.state === 'intro') {
      this.updateIntro(dt);
      return;
    }
    if (this.state !== 'play') return;

    this.elapsed += dt;
    this.timeLeft = Math.max(0, this.timeLimit - this.elapsed);
    this.updateLevel(dt);
    this.events.emit(EVENTS.HUD_UPDATE, this.getHudState());

    if (this.state !== 'play') return; // updateLevel có thể đã gọi finish()
    if (this.isWin()) this.finish(true);
    else if (this.isLose()) this.finish(false);
    else if (this.timeLeft <= 0) {
      this.loseReason ||= 'Hết giờ mất rồi!';
      this.finish(false);
    }
  }

  toast(text, color = '#ffffff') {
    this.events.emit(EVENTS.TOAST, { text, color });
  }

  /** Kết thúc ván: thắng → ăn mừng + chụp ảnh kỷ niệm → màn kết quả. */
  finish(win) {
    if (this.state === 'end') return;
    this.state = 'end';
    this.physics?.world?.pause();
    const stars = win ? Phaser.Math.Clamp(this.getStars(), 1, 3) : 0;
    const summary = this.getSummary();

    const hud = this.scene.get(SCENES.HUD);
    if (!win) {
      this.cameras.main.shake(250, 0.008);
      this.player?.playAnim?.('hurt');
      hud?.failBanner?.(this.loseReason || 'Hết giờ mất rồi!');
      Music.jingle('fail');
      this.time.delayedCall(1800, () => this.goResult({ win, stars, summary }));
      return;
    }

    this.player?.celebrate?.();
    this.companion?.playAnim?.('cheer');
    const cam = this.cameras.main;
    const p = this.player ?? { x: cam.midPoint.x, y: cam.midPoint.y };
    burst(this, p.x, p.y - 40, { texture: 'heart', count: 14, scale: 0.7, speed: 260, depth: 5000 });

    this.time.delayedCall(900, () => {
      this.scene.setVisible(false, SCENES.HUD);
      this.time.delayedCall(60, () => {
        this.game.renderer.snapshot((img) => {
          const done = (photo) => {
            // "Tách!" — chụp xong ảnh kỷ niệm, rồi ăn mừng chiến thắng trên HUD
            cam.flash(350, 255, 255, 255);
            this.scene.setVisible(true, SCENES.HUD);
            hud?.celebrate?.(stars);
            Music.jingle('victory');
            this.time.delayedCall(3000, () => this.goResult({ win, stars, summary, photo }));
          };
          const capture = () => done(downscale(img, 384, 216));
          if (img.complete) capture();
          else img.onload = capture;
        });
      });
    });
  }

  goResult({ win, stars, summary, photo = null }) {
    this.cameras.main.fadeOut(350, 20, 12, 34);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start(SCENES.RESULT, {
        levelKey: this.levelConfig.key,
        win,
        stars,
        summary,
        photo,
        reason: this.loseReason,
        time: this.elapsed,
      }),
    );
  }

  // --- Hook cho ván con ---
  buildLevel() {}
  updateIntro(_dt) {}
  onPlayStart() {}
  updateLevel(_dt) {}
  isWin() { return false; }
  isLose() { return false; }
  getStars() { return 1; }
  getHudState() { return { bars: [], counters: [], hint: '' }; }
  getSummary() { return [`Thời gian: ${this.elapsed.toFixed(1)}s`]; }
}

/** Thu nhỏ ảnh chụp màn hình thành JPEG nhỏ để lưu localStorage. */
function downscale(img, w, h) {
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  }
}
