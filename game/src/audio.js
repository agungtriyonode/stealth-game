// Suara sintetis WebAudio — tanpa satu pun file audio. Langkah kaki (bunyi
// pelan berfilter), bip curiga (nada naik), sirene alarm (dua nada bergantian),
// petik artefak dan jingle menang. Semua aman bila AudioContext tidak ada
// (mis. saat screenshot headless): panggilannya jadi no-op.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.alarmNodes = null;
    this.muted = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
  }

  tone(freq, dur, type, gain, when = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio tidak pernah boleh mematikan game.
    }
  }

  footstep(run) {
    if (!this.ctx) return;
    this.tone(run ? 95 : 70, 0.07, 'sine', run ? 0.12 : 0.07);
  }

  // Bip curiga: nada naik seiring kecurigaan 0..1.
  suspicionBeep(level) {
    this.tone(420 + level * 380, 0.09, 'square', 0.05);
  }

  alarmStart() {
    if (!this.ctx || this.alarmNodes) return;
    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, this.ctx.currentTime);
      g.gain.setValueAtTime(0.045, this.ctx.currentTime);
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(2.4, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
      lfo.connect(lfoGain).connect(osc.frequency);
      osc.connect(g).connect(this.ctx.destination);
      osc.start();
      lfo.start();
      this.alarmNodes = { osc, lfo, g };
    } catch {
      this.alarmNodes = null;
    }
  }

  alarmStop() {
    if (!this.alarmNodes) return;
    try {
      const { osc, lfo, g } = this.alarmNodes;
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.1);
      lfo.stop(this.ctx.currentTime + 0.1);
    } catch {
      // abaikan
    }
    this.alarmNodes = null;
  }

  pickup() {
    this.tone(880, 0.1, 'sine', 0.1);
    this.tone(1318, 0.14, 'sine', 0.09, 0.07);
  }

  caught() {
    this.tone(220, 0.3, 'sawtooth', 0.12);
    this.tone(147, 0.45, 'sawtooth', 0.12, 0.18);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, i * 0.11));
  }

  click() {
    this.tone(660, 0.06, 'sine', 0.08);
  }
}
