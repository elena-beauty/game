import Phaser from 'phaser';
import { CHARACTER_STATS } from '../config/characters.js';

/**
 * Nhân vật người chơi (sprite chibi có animation + Arcade body).
 * mode: 'topdown' | 'platformer' | 'swim' | 'none' (ván tự điều khiển, vd ngồi xe).
 *
 * Animation có sẵn: `${key}-idle|walk|run|jump|fall|cheer|swim|sit|hurt`.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, characterKey, { mode = 'topdown', scale = 0.6, physics = true } = {}) {
    super(scene, x, y, characterKey, 'idle0');
    this.key = characterKey;
    this.stats = CHARACTER_STATS[characterKey];
    this.mode = mode;
    this.speed = this.stats.speed;
    this.invulnerable = false;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.locked = false;

    scene.add.existing(this);
    this.setScale(scale);
    if (physics) {
      scene.physics.add.existing(this);
      this.body.setSize(44, 96).setOffset(26, 26);
      this.body.setCollideWorldBounds(true);
      if (mode !== 'platformer') this.body.setAllowGravity(false);
    }
    this.play(`${this.key}-${mode === 'swim' ? 'swim' : 'idle'}`);

    // Bắt sự kiện nhấn Space ngay khi xảy ra → không mất cú nhảy khi FPS thấp.
    if (mode === 'platformer') {
      const onJump = () => (this.jumpBuffer = 0.12);
      scene.input.keyboard.on('keydown-SPACE', onJump);
      this.once(Phaser.GameObjects.Events.DESTROY, () => scene.input?.keyboard?.off('keydown-SPACE', onJump));
    }
  }

  playAnim(name) {
    const k = `${this.key}-${name}`;
    if (this.anims.currentAnim?.key !== k) this.play(k);
  }

  update(input, dt, { speedMul = 1 } = {}) {
    if (this.locked || !this.body) return;
    if (this.mode === 'platformer') this.updatePlatformer(input, dt, speedMul);
    else if (this.mode === 'topdown' || this.mode === 'swim') this.updateTopDown(input, speedMul);
  }

  updateTopDown(input, speedMul) {
    const dir = input.getDirection();
    const spd = this.speed * speedMul;
    this.body.setVelocity(dir.x * spd, dir.y * spd);
    if (dir.x !== 0) this.setFlipX(dir.x < 0);
    if (this.mode === 'swim') this.playAnim('swim');
    else if (this.invulnerable && this.anims.currentAnim?.key.endsWith('hurt')) {
      /* giữ anim hurt */
    } else this.playAnim(dir.lengthSq() > 0 ? (speedMul > 1.2 ? 'run' : 'walk') : 'idle');
    this.setDepth(this.y);
  }

  /** Platformer có coyote time + jump buffer + nhảy thay đổi độ cao (PLAN.md mục 9). */
  updatePlatformer(input, dt, speedMul) {
    const onGround = this.body.blocked.down || this.body.touching.down;
    this.coyote = onGround ? 0.1 : Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const target = x * this.speed * speedMul;
    const accel = onGround ? 0.35 : 0.15;
    this.body.setVelocityX(Phaser.Math.Linear(this.body.velocity.x, target, accel));
    if (x !== 0) this.setFlipX(x < 0);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.body.setVelocityY(-this.stats.jump);
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.scene.tweens.add({ targets: this, scaleY: this.scaleY * 1.12, scaleX: this.scaleX * 0.9, duration: 90, yoyo: true });
    }
    if (!input.isDown('action') && this.body.velocity.y < -150) this.body.setVelocityY(this.body.velocity.y * 0.85);

    if (!onGround) this.playAnim(this.body.velocity.y < 0 ? 'jump' : 'fall');
    else this.playAnim(Math.abs(this.body.velocity.x) > 20 ? 'walk' : 'idle');
  }

  /** Bị thương: nháy đỏ + bất tử 1s. Trả về false nếu đang bất tử. */
  hurt(duration = 1000) {
    if (this.invulnerable) return false;
    this.invulnerable = true;
    this.setTint(0xff8080);
    this.playAnim('hurt');
    this.scene.cameras.main.shake(150, 0.006);
    this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 90, yoyo: true, repeat: Math.floor(duration / 180) });
    this.scene.time.delayedCall(duration, () => {
      this.invulnerable = false;
      this.clearTint();
      this.setAlpha(1);
    });
    return true;
  }

  celebrate() {
    this.locked = true;
    this.body?.setVelocity(0, 0);
    this.playAnim('cheer');
  }
}
