// Lưu tiến trình bằng localStorage. Xem PLAN.md mục 7.
import levels from '../config/levels.json';

const STORAGE_KEY = 'di-du-lich-cung-vo:save';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function persist(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // storage đầy hoặc bị chặn
  }
}

export const SaveSystem = {
  get(key, fallback = null) {
    return load()[key] ?? fallback;
  },
  set(key, value) {
    const data = load();
    data[key] = value;
    return persist(data);
  },
  getStars(levelKey) {
    return this.get('stars', {})[levelKey] ?? 0;
  },
  setStars(levelKey, stars) {
    const all = this.get('stars', {});
    all[levelKey] = Math.max(all[levelKey] ?? 0, stars);
    this.set('stars', all);
  },
  totalStars() {
    return Object.values(this.get('stars', {})).reduce((a, b) => a + b, 0);
  },
  completedCount() {
    return Object.values(this.get('stars', {})).filter((s) => s > 0).length;
  },
  /** Ván trong nước luôn mở; Singapore cần MỌI địa điểm trong nước đạt ≥ minStarsEach sao. */
  isUnlocked(level) {
    if (!level.unlock) return true;
    const { done, total } = this.unlockProgress(level);
    return done >= total;
  },
  /** Tiến độ mở khóa: số địa điểm trong nước đã đạt đủ sao / tổng số. */
  unlockProgress(level) {
    const min = level.unlock?.minStarsEach ?? 2;
    const domestic = LEVELS.filter((l) => !l.unlock);
    const done = domestic.filter((l) => this.getStars(l.key) >= min).length;
    const missing = domestic.filter((l) => this.getStars(l.key) < min);
    return { done, total: domestic.length, min, missing };
  },
  getPhoto(levelKey) {
    return this.get('album', {})[levelKey] ?? null;
  },
  setPhoto(levelKey, dataUrl) {
    const album = this.get('album', {});
    album[levelKey] = dataUrl;
    return this.set('album', album);
  },
  reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
  },
};

export const LEVELS = [...levels].sort((a, b) => a.order - b.order);
export const getLevel = (key) => LEVELS.find((l) => l.key === key);
