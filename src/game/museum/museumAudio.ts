import { MuseumSurfaceType } from '../../types/game';

/**
 * Dynamic surface-aware and environment-aware Web Audio engine for Tralleis Open-Air Museum:
 * - Marble/mosaic echoed stone footsteps vs soft dirt footsteps vs vaulted crypt reverberant footsteps
 * - Outdoor warm Aegean wind + summer cicadas crossfading into deep underground vault resonance + torch crackle
 * - Smooth acoustic pitch/filter response during exhibit inspection slow-motion
 */
export class MuseumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private cryptReverb: ConvolverNode | null = null;
  private outdoorReverb: ConvolverNode | null = null;

  // Continuous ambience nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private cicadaGain: GainNode | null = null;
  private cicadaModOsc: OscillatorNode | null = null;
  private cryptDroneGain: GainNode | null = null;
  private cryptDroneFilter: BiquadFilterNode | null = null;
  private torchCrackleGain: GainNode | null = null;

  private activeSources: AudioScheduledSourceNode[] = [];
  private muted = false;
  private initialized = false;
  private dripTimer = 0;

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.72;
      master.connect(ctx.destination);
      this.masterGain = master;

      // 3-second pink-tinted noise buffer for wind, footsteps, and fire crackle
      const len = ctx.sampleRate * 3;
      const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.95 * b2 + w * 0.048;
        ch[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.18) * 1.4));
      }
      this.noiseBuffer = noiseBuf;

      // Procedural impulse responses: deep vaulted stone crypt (2.4s) & subtle outdoor courtyard bounce (0.55s)
      this.cryptReverb = ctx.createConvolver();
      this.cryptReverb.buffer = this.createStoneImpulse(ctx, 2.4, 2.8, 1200);
      const cryptRevGain = ctx.createGain();
      cryptRevGain.gain.value = 0.72;
      this.cryptReverb.connect(cryptRevGain);
      cryptRevGain.connect(master);

      this.outdoorReverb = ctx.createConvolver();
      this.outdoorReverb.buffer = this.createStoneImpulse(ctx, 0.55, 4.5, 2400);
      const outRevGain = ctx.createGain();
      outRevGain.gain.value = 0.24;
      this.outdoorReverb.connect(outRevGain);
      outRevGain.connect(master);

      this.startAmbienceLoops(ctx, master, noiseBuf);
      this.initialized = true;
    } catch {
      // Gracefully ignore blocked audio context until user gesture
    }
  }

  private createStoneImpulse(
    ctx: AudioContext,
    durationSec: number,
    decay: number,
    cutoffHz: number
  ): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * durationSec);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const alpha = Math.exp((-2 * Math.PI * cutoffHz) / ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        const white = (Math.random() * 2 - 1) * env;
        lp = lp * alpha + white * (1 - alpha);
        data[i] = lp * 0.75;
      }
    }
    return impulse;
  }

  private startAmbienceLoops(
    ctx: AudioContext,
    master: GainNode,
    noiseBuf: AudioBuffer
  ): void {
    // 1. Warm Aegean afternoon wind (soft modulated bandpass noise)
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 410;
    windFilter.Q.value = 1.6;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.085;

    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.13;
    const windLfoDepth = ctx.createGain();
    windLfoDepth.gain.value = 150;
    windLfo.connect(windLfoDepth);
    windLfoDepth.connect(windFilter.frequency);

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSrc.start();
    windLfo.start();
    this.activeSources.push(windSrc, windLfo);
    this.windFilter = windFilter;
    this.windGain = windGain;

    // 2. Summer Aydın cicadas (ağustos böceği) — gentle high-frequency harmonic pulsing shimmer
    const cicadaSrc = ctx.createBufferSource();
    cicadaSrc.buffer = noiseBuf;
    cicadaSrc.loop = true;

    const cicadaBp = ctx.createBiquadFilter();
    cicadaBp.type = 'bandpass';
    cicadaBp.frequency.value = 4650;
    cicadaBp.Q.value = 8.5;

    const cicadaPulseGain = ctx.createGain();
    cicadaPulseGain.gain.value = 0.5;

    const cicadaMod = ctx.createOscillator();
    cicadaMod.type = 'sine';
    cicadaMod.frequency.value = 14.5;
    const cicadaModDepth = ctx.createGain();
    cicadaModDepth.gain.value = 0.42;
    cicadaMod.connect(cicadaModDepth);
    cicadaModDepth.connect(cicadaPulseGain.gain);

    const cicadaMaster = ctx.createGain();
    cicadaMaster.gain.value = 0.016;

    cicadaSrc.connect(cicadaBp);
    cicadaBp.connect(cicadaPulseGain);
    cicadaPulseGain.connect(cicadaMaster);
    cicadaMaster.connect(master);
    cicadaSrc.start();
    cicadaMod.start();
    this.activeSources.push(cicadaSrc, cicadaMod);
    this.cicadaGain = cicadaMaster;
    this.cicadaModOsc = cicadaMod;

    // 3. Vaulted crypt subterranean air resonance
    const cryptSrc = ctx.createBufferSource();
    cryptSrc.buffer = noiseBuf;
    cryptSrc.loop = true;

    const cryptFilter = ctx.createBiquadFilter();
    cryptFilter.type = 'lowpass';
    cryptFilter.frequency.value = 185;
    cryptFilter.Q.value = 2.4;

    const cryptGain = ctx.createGain();
    cryptGain.gain.value = 0.001;

    cryptSrc.connect(cryptFilter);
    cryptFilter.connect(cryptGain);
    cryptGain.connect(master);
    cryptSrc.start();
    this.activeSources.push(cryptSrc);
    this.cryptDroneFilter = cryptFilter;
    this.cryptDroneGain = cryptGain;

    // 4. Torch flame warm crackle bed
    const torchSrc = ctx.createBufferSource();
    torchSrc.buffer = noiseBuf;
    torchSrc.loop = true;

    const torchBp = ctx.createBiquadFilter();
    torchBp.type = 'bandpass';
    torchBp.frequency.value = 1150;
    torchBp.Q.value = 1.1;

    const torchGain = ctx.createGain();
    torchGain.gain.value = 0.0001;

    torchSrc.connect(torchBp);
    torchBp.connect(torchGain);
    torchGain.connect(master);
    torchSrc.start();
    this.activeSources.push(torchSrc);
    this.torchCrackleGain = torchGain;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
  }

  public updateAmbience(
    dt: number,
    cryptFactor: number,
    timeScale: number,
    torchActive: boolean
  ): void {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    const outdoor = Math.max(0, 1 - cryptFactor);
    const slowMult = 0.45 + 0.55 * timeScale;

    if (this.windGain && this.windFilter) {
      this.windGain.gain.setTargetAtTime(0.088 * outdoor * slowMult, now, 0.25);
      this.windFilter.frequency.setTargetAtTime(280 + 180 * timeScale, now, 0.3);
    }

    if (this.cicadaGain && this.cicadaModOsc) {
      this.cicadaGain.gain.setTargetAtTime(0.017 * outdoor * slowMult, now, 0.3);
      this.cicadaModOsc.frequency.setTargetAtTime(5 + 10 * timeScale, now, 0.25);
    }

    if (this.cryptDroneGain && this.cryptDroneFilter) {
      this.cryptDroneGain.gain.setTargetAtTime(0.11 * cryptFactor * slowMult, now, 0.25);
      this.cryptDroneFilter.frequency.setTargetAtTime(140 + 70 * timeScale, now, 0.25);
    }

    if (this.torchCrackleGain) {
      const targetTorch = torchActive ? 0.048 * (0.65 + 0.35 * cryptFactor) : 0.0001;
      this.torchCrackleGain.gain.setTargetAtTime(targetTorch, now, 0.16);
    }

    // Occasional distant reverberant water drip inside the vaulted crypt
    if (cryptFactor > 0.55 && !this.muted) {
      this.dripTimer -= dt * timeScale;
      if (this.dripTimer <= 0) {
        this.dripTimer = 3.2 + Math.random() * 4.5;
        this.playCryptDrip(cryptFactor);
      }
    }
  }

  private playCryptDrip(cryptFactor: number): void {
    if (!this.ctx || !this.cryptReverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const baseFreq = 980 + Math.random() * 520;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.48, now + 0.045);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.022 * cryptFactor, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(g);
    g.connect(this.cryptReverb);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playFootstep(
    surface: MuseumSurfaceType,
    cryptFactor: number,
    isRunning: boolean
  ): void {
    if (!this.initialized || !this.ctx || !this.masterGain || !this.noiseBuffer || this.muted) {
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const energy = isRunning ? 1.0 : 0.68;

    if (surface === 'dirt') {
      // Soft earthy gravel crunch
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const offset = Math.random() * 2.0;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(620 + Math.random() * 220, now);
      bp.Q.value = 0.85;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.11 * energy, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

      src.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain);
      src.start(now, offset, 0.15);
      return;
    }

    // Hard stone / marble / mosaic / vaulted crypt footstep
    const isMarble = surface === 'marble' || surface === 'mosaic';
    const isCrypt = surface === 'crypt_stone' || cryptFactor > 0.45;

    // 1. Crisp heel impact click (noise burst)
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = this.noiseBuffer;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(
      isMarble ? 1950 + Math.random() * 480 : isCrypt ? 1120 + Math.random() * 260 : 1420 + Math.random() * 340,
      now
    );
    clickFilter.Q.value = isMarble ? 2.4 : 1.5;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.linearRampToValueAtTime((isMarble ? 0.16 : 0.13) * energy, now + 0.006);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + (isMarble ? 0.075 : 0.095));

    clickSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.masterGain);

    // Route reverb by environment
    if (isCrypt && this.cryptReverb) {
      const send = ctx.createGain();
      send.gain.value = 0.55 + cryptFactor * 0.45;
      clickGain.connect(send);
      send.connect(this.cryptReverb);
    } else if (this.outdoorReverb) {
      const send = ctx.createGain();
      send.gain.value = isMarble ? 0.48 : 0.25;
      clickGain.connect(send);
      send.connect(this.outdoorReverb);
    }

    clickSrc.start(now, Math.random() * 2.0, 0.12);

    // 2. Low resonant stone body thud (sine pitch drop)
    const thud = ctx.createOscillator();
    thud.type = 'triangle';
    const startHz = isMarble ? 215 + Math.random() * 35 : isCrypt ? 138 + Math.random() * 22 : 168 + Math.random() * 28;
    thud.frequency.setValueAtTime(startHz, now);
    thud.frequency.exponentialRampToValueAtTime(52, now + 0.065);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.0001, now);
    thudGain.gain.linearRampToValueAtTime(0.11 * energy, now + 0.005);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    if (isCrypt && this.cryptReverb) {
      thudGain.connect(this.cryptReverb);
    }
    thud.start(now);
    thud.stop(now + 0.085);
  }

  public playExhibitFocusChime(): void {
    if (!this.initialized || !this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33]; // Warm Aegean G major harmonic triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + idx * 0.06);
      g.gain.linearRampToValueAtTime(0.045, now + idx * 0.06 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.85);
      osc.connect(g);
      g.connect(this.masterGain!);
      if (this.outdoorReverb) g.connect(this.outdoorReverb);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.9);
    });
  }

  public playLightToggleClick(mode: 'torch' | 'flashlight'): void {
    if (!this.initialized || !this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (mode === 'flashlight') {
      // Crisp mechanical aluminum click
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.028);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.055, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.038);
    } else if (this.noiseBuffer) {
      // Warm torch ignition whoosh
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(340, now);
      lp.frequency.exponentialRampToValueAtTime(980, now + 0.14);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      src.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      src.start(now, Math.random() * 1.5, 0.3);
    }
  }

  public dispose(): void {
    for (const s of this.activeSources) {
      try {
        s.stop();
        s.disconnect();
      } catch {
        // Ignore already stopped sources
      }
    }
    this.activeSources = [];
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.initialized = false;
  }
}
