'use client';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on: boolean) { this.enabled = on; }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.15,
    startDelay = 0,
    endFreq?: number
  ): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + startDelay + duration);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + startDelay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + duration + 0.01);
  }

  playButtonClick() { this.tone(600, 0.04, 'sine', 0.12); }

  playSpeechPop() { this.tone(900, 0.08, 'sine', 0.1, 0, 1300); }

  playAccuse() {
    this.tone(220, 0.12, 'square', 0.08, 0);
    this.tone(262, 0.12, 'square', 0.07, 0.06);
    this.tone(196, 0.18, 'square', 0.09, 0.12);
  }

  playCorrectReveal() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.14, 'sine', 0.18, i * 0.1));
  }

  playWrongReveal() {
    this.tone(349, 0.25, 'sawtooth', 0.12, 0);
    this.tone(247, 0.3,  'sawtooth', 0.1,  0.1);
  }

  playWin() {
    const melody = [523, 659, 784, 659, 784, 1047];
    melody.forEach((f, i) => this.tone(f, 0.2, 'sine', 0.2, i * 0.12));
  }

  playLose() {
    const notes = [440, 415, 392, 370, 349, 330];
    notes.forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.15, i * 0.1));
    this.tone(80, 0.8, 'sine', 0.2, 0.6);
  }

  playTimerWarning(urgency: number) {
    // urgency 0-1 increases pitch and volume
    const freq = 440 + urgency * 440;
    const gain = 0.1 + urgency * 0.15;
    this.tone(freq, 0.15, 'square', gain);
  }

  playDieRoll() {
    for (let i = 0; i < 8; i++) {
      const delay = i * i * 0.015;
      this.tone(200 + Math.random() * 400, 0.06, 'square', 0.08, delay);
    }
  }

  playRevealDrum() {
    this.tone(60, 0.18, 'sine', 0.25);
    this.tone(80, 0.12, 'sine', 0.2, 0.05);
  }

  playQuarantine() {
    this.tone(300, 0.08, 'square', 0.12);
    this.tone(200, 0.15, 'square', 0.1, 0.1);
  }
}

export const soundEngine = new SoundEngine();
