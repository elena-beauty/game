import Phaser from 'phaser';
import { CHARACTER_STATS, otherCharacter } from '../config/characters.js';
import { speechBubble } from '../ui/Panel.js';

/**
 * Bạn đồng hành (NPC) = nhân vật KHÔNG được chọn. Đi theo, cổ vũ, nói chuyện.
 * Không có physics — level tự đặt vị trí hoặc gọi follow().
 */
export class Companion extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, playerKey, { scale = 0.6 } = {}) {
    const key = otherCharacter(playerKey);
    super(scene, x, y, key, 'idle0');
    this.key = key;
    this.stats = CHARACTER_STATS[key];
    this.lastSay = 0;
    scene.add.existing(this);
    this.setScale(scale);
    this.play(`${key}-idle`);
  }

  playAnim(name) {
    const k = `${this.key}-${name}`;
    if (this.anims.currentAnim?.key !== k) this.play(k);
  }

  /** Đi theo target với khoảng lệch (dx, dy), mượt bằng lerp. */
  follow(target, dx = -50, dy = 0, lerp = 0.08, { anim = 'walk', idle = 'idle' } = {}) {
    const tx = target.x + (target.flipX ? -dx : dx);
    const ty = target.y + dy;
    const mx = (tx - this.x) * lerp;
    const my = (ty - this.y) * lerp;
    this.x += mx;
    this.y += my;
    if (Math.abs(mx) > 0.3) this.setFlipX(mx < 0);
    this.playAnim(Math.abs(mx) + Math.abs(my) > 0.4 ? anim : idle);
    this.setDepth(this.y - 1);
  }

  /** Nói 1 câu (bóng thoại). Có cooldown để không spam. */
  say(text, { force = false, duration = 1800 } = {}) {
    const now = this.scene.time.now;
    if (!force && now - this.lastSay < 2500) return;
    this.lastSay = now;
    speechBubble(this.scene, this.x, this.y - this.displayHeight * 0.55, text, { duration });
  }

  cheer() {
    this.say(Phaser.Utils.Array.GetRandom(this.stats.cheers));
  }
}
