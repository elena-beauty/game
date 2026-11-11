import Phaser from 'phaser';

/**
 * Gom input bàn phím. Xem PLAN.md mục 3.
 * Tên phím: up/down/left/right (WASD + mũi tên), action (Space), secondary (Shift),
 * interact (E), photo (F), q, tab, pause (Esc).
 * Lưu ý: isJustDown() chỉ trả true MỘT lần cho mỗi lần nhấn — gọi 1 chỗ mỗi frame.
 */
export class InputManager {
  constructor(scene) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      w: K.W, s: K.S, a: K.A, d: K.D,
      up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT,
      action: K.SPACE, secondary: K.SHIFT, interact: K.E, photo: K.F, q: K.Q, tab: K.TAB, pause: K.ESC,
    });
  }

  get left() { return this.keys.a.isDown || this.keys.left.isDown; }
  get right() { return this.keys.d.isDown || this.keys.right.isDown; }
  get up() { return this.keys.w.isDown || this.keys.up.isDown; }
  get down() { return this.keys.s.isDown || this.keys.down.isDown; }

  /** Vector hướng đã chuẩn hóa từ WASD / mũi tên. */
  getDirection() {
    const x = (this.right ? 1 : 0) - (this.left ? 1 : 0);
    const y = (this.down ? 1 : 0) - (this.up ? 1 : 0);
    return new Phaser.Math.Vector2(x, y).normalize();
  }

  isDown(name) {
    if (name in this && typeof this[name] === 'boolean') return this[name];
    return this.keys[name]?.isDown ?? false;
  }

  isJustDown(name) {
    const k = this.keys[name];
    return k ? Phaser.Input.Keyboard.JustDown(k) : false;
  }

  /** "A hoặc ←" vừa nhấn (dùng cho cơ chế luân phiên A/D). */
  justLeft() { return this.isJustDown('a') || this.isJustDown('left'); }
  justRight() { return this.isJustDown('d') || this.isJustDown('right'); }
}
