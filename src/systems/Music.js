/**
 * Nhạc nền tổng hợp bằng Web Audio (không cần file mp3).
 * Mỗi bài = tempo + giọng + vòng hợp âm + phong cách trống/bass; giai điệu sinh từ seed
 * nên luôn giống nhau mỗi lần chơi.
 *
 *   Music.play('menu')      // đổi bài (crossfade), gọi lại cùng tên thì bỏ qua
 *   Music.jingle('victory') // đoạn nhạc ngắn chạy 1 lần
 *   Music.toggleMute()
 *
 * Muốn dùng file nhạc thật: đặt vào public/assets/audio/music/ và thay Music.play bằng this.sound.play.
 */
import { SaveSystem } from './SaveSystem.js';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// Phong cách trống / bass / hợp âm (16 bước = 1 ô nhịp)
const STYLES = {
  pop: {
    kick: 'x...x...x...x...',
    snare: '....x.......x...',
    hat: 'x.x.x.x.x.x.x.x.',
    open: '..............x.',
    bass: 'R..R..R.R..R.O..',
    stab: '..x...x...x...x.',
  },
  tropical: {
    kick: 'x.....x...x.....',
    snare: '....x.......x...',
    hat: 'x.xxx.xxx.xxx.xx',
    open: '',
    bass: 'R.....R.O.....F.',
    stab: '..x...x...x...x.',
  },
  electro: {
    kick: 'x...x...x...x...',
    snare: '....x.......x..x',
    hat: '..x...x...x...x.',
    open: '..x...x...x...x.',
    bass: 'RRORRRORRRORRROR',
    stab: 'x..x..x...x..x..',
  },
  folk: {
    kick: 'x......x..x.....',
    snare: '....x.......x...',
    hat: 'xxxxxxxxxxxxxxxx',
    open: '',
    bass: 'R...F...R...O...',
    stab: '..x.x...x.x.x...',
  },
  drive: {
    kick: 'x...x...x...x.x.',
    snare: '....x.......x...',
    hat: 'x.xxx.xxx.xxx.xx',
    open: '......x.......x.',
    bass: 'RRRRRRRRRRRRRROO',
    stab: 'x.....x.....x...',
  },
};

export const SONGS = {
  menu: { bpm: 118, root: 60, scale: 'major', prog: [0, 4, 5, 3], style: 'pop', lead: 'square', seed: 3 },
  map: { bpm: 126, root: 62, scale: 'major', prog: [5, 3, 0, 4], style: 'pop', lead: 'triangle', seed: 7 },
  beach: { bpm: 124, root: 65, scale: 'major', prog: [0, 5, 3, 4], style: 'tropical', lead: 'triangle', seed: 11 },
  city: { bpm: 132, root: 57, scale: 'minor', prog: [0, 5, 2, 6], style: 'electro', lead: 'sawtooth', seed: 21 },
  nature: { bpm: 122, root: 62, scale: 'major', prog: [0, 3, 0, 4], style: 'folk', lead: 'triangle', seed: 5, penta: true },
  lantern: { bpm: 116, root: 63, scale: 'major', prog: [0, 5, 3, 4], style: 'folk', lead: 'triangle', seed: 31, penta: true },
  desert: { bpm: 138, root: 64, scale: 'minor', prog: [0, 6, 5, 6], style: 'drive', lead: 'square', seed: 9 },
};

/** Bài nhạc cho từng ván. */
export const LEVEL_MUSIC = {
  HaNoi: 'city',
  Singapore: 'city',
  QuyNhon: 'beach',
  DaNang: 'beach',
  PhuQuoc: 'beach',
  CatBa: 'nature',
  DaLat: 'nature',
  HaLong: 'nature',
  NinhThuan: 'desert',
  NinhBinh: 'nature',
  HoiAn: 'lantern',
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

const RHYTHMS = [
  [[0, 2], [2, 2], [4, 3], [7, 1], [8, 2], [10, 2], [12, 4]],
  [[0, 3], [3, 3], [6, 2], [8, 2], [10, 1], [11, 1], [12, 2], [14, 2]],
  [[0, 1], [2, 1], [3, 2], [6, 2], [8, 4], [12, 2], [14, 2]],
  [[2, 2], [4, 2], [6, 2], [8, 3], [11, 3], [14, 2]],
  [[0, 2], [3, 1], [4, 2], [6, 2], [8, 2], [11, 1], [12, 2], [14, 1], [15, 1]],
];
const CADENCE = [[0, 2], [2, 2], [4, 4], [8, 8]];

/** Sinh giai điệu 8 ô nhịp: A (4 ô) + B (4 ô), bám nốt hợp âm ở phách mạnh. */
function composeMelody(song) {
  const r = rng(song.seed);
  const chordAt = (bar) => song.prog[bar % song.prog.length];
  const chordTones = (deg) => [deg, deg + 2, deg + 4, deg + 7, deg + 9, deg + 11];
  const nearestChordTone = (d, chord) => {
    let best = d;
    let dist = 99;
    chordTones(chord).forEach((c) => [c - 7, c, c + 7].forEach((t) => {
      if (Math.abs(t - d) < dist) {
        dist = Math.abs(t - d);
        best = t;
      }
    }));
    return best;
  };
  const pentaFix = (d) => {
    if (!song.penta) return d;
    const m = ((d % 7) + 7) % 7;
    return m === 3 || m === 6 ? d + 1 : d; // bỏ bậc 4 & 7 → ngũ cung
  };
  const notes = [];
  const sectionMotif = () => RHYTHMS[Math.floor(r() * RHYTHMS.length)];
  [0, 4].forEach((start) => {
    const motif = sectionMotif();
    const alt = sectionMotif();
    let deg = 7 + Math.floor(r() * 3) + (start ? 2 : 0);
    for (let b = 0; b < 4; b++) {
      const bar = start + b;
      const chord = chordAt(bar);
      const rhythm = b === 3 && start === 4 ? CADENCE : b === 2 ? alt : motif;
      rhythm.forEach(([pos, len], i) => {
        if (i > 0) deg += Math.round((r() - 0.5) * 4);
        deg = Math.max(5, Math.min(15, deg));
        if (pos % 4 === 0) deg = nearestChordTone(deg, chord);
        if (b === 3 && start === 4 && i === rhythm.length - 1) deg = 7; // kết về chủ âm
        notes.push({ step: bar * 16 + pos, len, deg: pentaFix(deg) });
      });
    }
  });
  return notes;
}

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.current = null; // { name, gain, timer }
    this.muted = SaveSystem.get('muted', false);
    this.volume = 0.55;
    this.pending = null;
  }

  ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, len);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    // Trình duyệt chỉ cho phát âm thanh sau khi người chơi tương tác
    const resume = () => {
      this.ctx.resume();
      if (this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
      }
    };
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return true;
  }

  // ---------- Nhạc cụ ----------
  env(gainNode, t, peak, attack, decay) {
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  kick(out, t) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    this.env(g, t, 0.9, 0.003, 0.28);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.32);
  }

  noiseHit(out, t, { freq = 7000, peak = 0.12, decay = 0.05, type = 'highpass' } = {}) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    this.env(g, t, peak, 0.002, decay);
    s.connect(f).connect(g).connect(out);
    s.start(t, Math.random() * 0.5);
    s.stop(t + decay + 0.05);
  }

  snare(out, t) {
    this.noiseHit(out, t, { freq: 1800, peak: 0.38, decay: 0.16 });
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    this.env(g, t, 0.3, 0.002, 0.1);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.15);
  }

  tone(out, t, midi, dur, { type = 'square', peak = 0.12, cutoff = 2500, cutoffEnd = null, attack = 0.005, detune = 0, vibrato = 0 } = {}) {
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    if (cutoffEnd) f.frequency.exponentialRampToValueAtTime(cutoffEnd, t + dur);
    f.Q.value = 2;
    this.env(g, t, peak, attack, Math.max(0.05, dur));
    f.connect(g).connect(out);
    const oscs = detune ? [-detune, detune] : [0];
    oscs.forEach((d) => {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = mtof(midi);
      o.detune.value = d;
      if (vibrato) {
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.frequency.value = 5.5;
        lg.gain.value = vibrato;
        lfo.connect(lg).connect(o.detune);
        lfo.start(t + 0.12);
        lfo.stop(t + dur + 0.1);
      }
      o.connect(f);
      o.start(t);
      o.stop(t + attack + dur + 0.05);
    });
  }

  // ---------- Bài nhạc ----------
  play(name) {
    if (!this.ensure()) return;
    this.duck(false); // vào màn mới thì bỏ giảm âm (vd thoát từ menu tạm dừng)
    if (this.current?.name === name) return;
    this.stopCurrent();
    const song = SONGS[name];
    if (!song) return;
    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.6);
    gain.connect(this.master);

    const style = STYLES[song.style];
    const scale = SCALES[song.scale];
    const semis = (d) => Math.floor(d / 7) * 12 + scale[((d % 7) + 7) % 7];
    const melody = composeMelody(song);
    const melodyAt = new Map();
    melody.forEach((n) => melodyAt.set(n.step, n));
    const stepDur = 60 / song.bpm / 4;
    const LOOP = 128;
    let step = 0;
    let nextTime = ctx.currentTime + 0.1;
    const on = (pattern, pos) => pattern && pattern[pos] === 'x';

    const scheduleStep = (s, t) => {
      const bar = Math.floor(s / 16);
      const pos = s % 16;
      const chordDeg = song.prog[bar % song.prog.length];
      const chordRoot = song.root - 12 + semis(chordDeg);
      const swingT = pos % 2 === 1 && song.style === 'tropical' ? t + stepDur * 0.15 : t;
      // Trống (bỏ trống ô cuối mỗi 8 ô để tạo fill)
      const fill = bar === 7 && pos >= 12;
      if (on(style.kick, pos) && !fill) this.kick(gain, t);
      if (on(style.snare, pos) || fill) this.snare(gain, t);
      if (on(style.hat, pos)) this.noiseHit(gain, swingT, { peak: pos % 4 === 0 ? 0.09 : 0.06, decay: 0.035 });
      if (on(style.open, pos)) this.noiseHit(gain, swingT, { peak: 0.07, decay: 0.18 });
      // Bass
      const b = style.bass[pos];
      if (b && b !== '.') {
        const off = b === 'O' ? 12 : b === 'F' ? 7 : 0;
        this.tone(gain, t, chordRoot - 12 + off, stepDur * 1.6, { type: 'sawtooth', peak: 0.22, cutoff: 900, cutoffEnd: 220 });
      }
      // Hợp âm nảy (stab)
      if (on(style.stab, pos)) {
        [0, 2, 4].forEach((k) => {
          const m = song.root + semis(chordDeg + k);
          this.tone(gain, swingT, m, stepDur * 1.2, { type: song.style === 'tropical' || song.style === 'folk' ? 'triangle' : 'square', peak: 0.045, cutoff: 3200, cutoffEnd: 700 });
        });
      }
      // Pad nền mỗi đầu ô nhịp
      if (pos === 0) {
        [0, 2, 4].forEach((k) => this.tone(gain, t, song.root - 12 + semis(chordDeg + k) + 12, stepDur * 15, { type: 'sawtooth', peak: 0.018, cutoff: 1100, attack: 0.2, detune: 8 }));
      }
      // Giai điệu
      const n = melodyAt.get(s % LOOP);
      if (n) {
        this.tone(gain, t, song.root + semis(n.deg), stepDur * n.len * 0.9, {
          type: song.lead,
          peak: song.lead === 'sawtooth' ? 0.07 : 0.1,
          cutoff: song.lead === 'triangle' ? 5000 : 3000,
          detune: song.lead === 'triangle' ? 0 : 6,
          vibrato: 12,
        });
      }
    };

    const timer = setInterval(() => {
      if (ctx.state !== 'running') {
        nextTime = ctx.currentTime + 0.1;
        return;
      }
      while (nextTime < ctx.currentTime + 0.15) {
        scheduleStep(step % LOOP, nextTime);
        nextTime += stepDur;
        step++;
      }
    }, 25);
    this.current = { name, gain, timer };
  }

  stopCurrent(fade = 0.5) {
    const cur = this.current;
    if (!cur) return;
    clearInterval(cur.timer);
    const t = this.ctx.currentTime;
    cur.gain.gain.cancelScheduledValues(t);
    cur.gain.gain.setValueAtTime(Math.max(0.0001, cur.gain.gain.value), t);
    cur.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => cur.gain.disconnect(), (fade + 0.3) * 1000);
    this.current = null;
  }

  stop() {
    if (this.ctx) this.stopCurrent();
  }

  /** Đoạn nhạc ngắn: 'victory' (kèn chiến thắng) hoặc 'fail'. */
  jingle(kind) {
    if (!this.ensure()) return;
    this.stopCurrent(0.2);
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.connect(this.master);
    const t0 = ctx.currentTime + 0.05;
    const seq =
      kind === 'victory'
        ? [[72, 0, 0.12], [76, 0.12, 0.12], [79, 0.24, 0.12], [84, 0.36, 0.3], [79, 0.7, 0.12], [84, 0.84, 0.7]]
        : [[67, 0, 0.25], [66, 0.28, 0.25], [65, 0.56, 0.25], [64, 0.84, 0.7]];
    seq.forEach(([m, at, d]) => {
      this.tone(out, t0 + at, m, d, { type: 'square', peak: 0.13, cutoff: 3500, detune: 7, vibrato: kind === 'victory' ? 15 : 30 });
      this.tone(out, t0 + at, m - 12, d, { type: 'triangle', peak: 0.12, cutoff: 2000 });
    });
    if (kind === 'victory') {
      [0, 0.36, 0.84].forEach((at) => this.kick(out, t0 + at));
      [0.36, 0.84].forEach((at) => this.noiseHit(out, t0 + at, { peak: 0.15, decay: 0.6, freq: 5000 }));
      [[60, 64, 67, 72]].forEach((ch) => ch.forEach((m) => this.tone(out, t0 + 0.84, m, 1.2, { type: 'sawtooth', peak: 0.035, cutoff: 2500, detune: 10 })));
    }
    setTimeout(() => out.disconnect(), 3000);
  }

  setMuted(m) {
    this.muted = m;
    SaveSystem.set('muted', m);
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Giảm âm lượng khi tạm dừng. */
  duck(on) {
    if (!this.master || this.muted) return;
    this.master.gain.setTargetAtTime(on ? this.volume * 0.3 : this.volume, this.ctx.currentTime, 0.1);
  }
}

export const Music = new MusicEngine();
