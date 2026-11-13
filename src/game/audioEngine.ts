import { LofiTrackId, VehicleType, WeatherType } from '../types/game';

interface TrackPreset {
  stepMs: number;
  chords: number[][];
  melody: number[];
  brightness: number;
  hasBrushHat: boolean;
  hasCrackle: boolean;
  musicActive: boolean;
}

const TRACK_PRESETS: Record<LofiTrackId, TrackPreset> = {
  aegean: {
    stepMs: 920,
    chords: [
      [146.83, 220.0, 261.63, 329.63], // Dm9
      [116.54, 174.61, 220.0, 293.66], // Bbmaj7
      [98.0, 146.83, 174.61, 220.0], // Gm9
      [110.0, 164.81, 220.0, 261.63], // Am7
    ],
    melody: [293.66, 329.63, 349.23, 440.0, 493.88, 523.25, 587.33, 659.25],
    brightness: 1150,
    hasBrushHat: false,
    hasCrackle: true,
    musicActive: true,
  },
  rainy_piano: {
    stepMs: 1080,
    chords: [
      [130.81, 196.0, 246.94, 293.66], // Cmaj9
      [110.0, 164.81, 196.0, 246.94], // Am9
      [87.31, 130.81, 164.81, 220.0], // Fmaj7
      [98.0, 146.83, 196.0, 246.94], // G6
    ],
    melody: [261.63, 329.63, 392.0, 440.0, 493.88, 523.25, 659.25, 587.33],
    brightness: 820,
    hasBrushHat: false,
    hasCrackle: true,
    musicActive: true,
  },
  night_lofi: {
    stepMs: 680,
    chords: [
      [164.81, 246.94, 293.66, 369.99], // Em9
      [130.81, 196.0, 246.94, 293.66], // Cmaj9
      [110.0, 164.81, 196.0, 261.63], // Am7
      [123.47, 185.0, 220.0, 293.66], // Bm7
    ],
    melody: [329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 739.99, 587.33],
    brightness: 980,
    hasBrushHat: true,
    hasCrackle: true,
    musicActive: true,
  },
  ambient_only: {
    stepMs: 1200,
    chords: [],
    melody: [],
    brightness: 600,
    hasBrushHat: false,
    hasCrackle: false,
    musicActive: false,
  },
};

// Harmandalı / Zeybek-inspired Hijaz-kar phrase in D (D, Eb, F#, G, A, Bb, C, D)
const ZEYBEK_PHRASE: { freq: number; beat: number; len: number }[] = [
  { freq: 587.33, beat: 0, len: 0.45 },
  { freq: 554.37, beat: 2, len: 0.35 },
  { freq: 587.33, beat: 3, len: 0.3 },
  { freq: 440.0, beat: 4, len: 0.55 },
  { freq: 466.16, beat: 6, len: 0.35 },
  { freq: 440.0, beat: 7, len: 0.4 },
  { freq: 369.99, beat: 9, len: 0.45 },
  { freq: 392.0, beat: 11, len: 0.35 },
  { freq: 369.99, beat: 12, len: 0.35 },
  { freq: 311.13, beat: 14, len: 0.4 },
  { freq: 293.66, beat: 16, len: 0.9 },
];

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private weatherFilter: BiquadFilterNode | null = null;
  private weatherGain: GainNode | null = null;
  private crackleGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private musicTimer: number | null = null;
  private thunderTimer: number | null = null;
  private zeybekTimers: number[] = [];
  private step = 0;
  private isMuted = false;
  private musicEnabled = true;
  private sfxEnabled = true;
  private zeybekPlaying = false;
  private initialized = false;

  private currentTrack: LofiTrackId = 'aegean';
  private currentWeather: WeatherType = 'clear';

  public init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.isMuted ? 0 : 0.74;
    master.connect(ctx.destination);
    this.masterGain = master;

    const music = ctx.createGain();
    music.gain.value = this.musicEnabled ? 0.54 : 0;
    music.connect(master);
    this.musicGain = music;

    const ambient = ctx.createGain();
    ambient.gain.value = 0.65;
    ambient.connect(master);
    this.ambientGain = ambient;

    const sfx = ctx.createGain();
    sfx.gain.value = this.sfxEnabled ? 0.68 : 0;
    sfx.connect(master);
    this.sfxGain = sfx;

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1400;

    delay.connect(delayFilter);
    delayFilter.connect(fb);
    fb.connect(delay);
    delayFilter.connect(music);
    this.delayNode = delay;

    // Pink/Brown noise buffer for soothing weather & vinyl texture
    const bufLen = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 2.4;
    }
    this.noiseBuffer = buf;

    const weatherSrc = ctx.createBufferSource();
    weatherSrc.buffer = buf;
    weatherSrc.loop = true;

    const weatherFilter = ctx.createBiquadFilter();
    weatherFilter.type = 'bandpass';
    weatherFilter.frequency.value = 280;
    weatherFilter.Q.value = 0.7;

    const weatherGain = ctx.createGain();
    weatherGain.gain.value = 0.035;

    weatherSrc.connect(weatherFilter);
    weatherFilter.connect(weatherGain);
    weatherGain.connect(ambient);
    weatherSrc.start();
    this.weatherFilter = weatherFilter;
    this.weatherGain = weatherGain;

    // Subtle warm vinyl crackle buffer
    const crackleLen = ctx.sampleRate * 4;
    const crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
    const cData = crackleBuf.getChannelData(0);
    for (let i = 0; i < crackleLen; i++) {
      cData[i] = Math.random() < 0.0025 ? (Math.random() * 2 - 1) * 0.45 : (Math.random() * 2 - 1) * 0.015;
    }
    const crackleSrc = ctx.createBufferSource();
    crackleSrc.buffer = crackleBuf;
    crackleSrc.loop = true;
    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 1800;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.016;
    crackleSrc.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(music);
    crackleSrc.start();
    this.crackleGain = crackleGain;

    // Engine oscillator
    const engOsc = ctx.createOscillator();
    engOsc.type = 'triangle';
    engOsc.frequency.value = 64;
    const engFilter = ctx.createBiquadFilter();
    engFilter.type = 'lowpass';
    engFilter.frequency.value = 210;
    const engGain = ctx.createGain();
    engGain.gain.value = 0;

    engOsc.connect(engFilter);
    engFilter.connect(engGain);
    engGain.connect(sfx);
    engOsc.start();
    this.engineOsc = engOsc;
    this.engineGain = engGain;

    this.initialized = true;
    this.applyWeatherAudio();
    this.applyTrackTexture();
    this.startMusicLoop();
    this.scheduleThunderCheck();
  }

  private applyTrackTexture() {
    if (!this.ctx || !this.crackleGain) return;
    const preset = TRACK_PRESETS[this.currentTrack];
    const target = this.musicEnabled && preset.hasCrackle && preset.musicActive ? 0.018 : 0;
    this.crackleGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  private applyWeatherAudio() {
    if (!this.ctx || !this.weatherFilter || !this.weatherGain) return;
    const now = this.ctx.currentTime;
    if (this.currentWeather === 'rain') {
      this.weatherFilter.type = 'bandpass';
      this.weatherFilter.frequency.setTargetAtTime(860, now, 0.4);
      this.weatherFilter.Q.setTargetAtTime(0.65, now, 0.3);
      this.weatherGain.gain.setTargetAtTime(0.11, now, 0.4);
    } else if (this.currentWeather === 'storm') {
      this.weatherFilter.type = 'bandpass';
      this.weatherFilter.frequency.setTargetAtTime(580, now, 0.4);
      this.weatherFilter.Q.setTargetAtTime(0.55, now, 0.3);
      this.weatherGain.gain.setTargetAtTime(0.16, now, 0.4);
    } else if (this.currentWeather === 'snow') {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(240, now, 0.4);
      this.weatherGain.gain.setTargetAtTime(0.055, now, 0.4);
    } else {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(290, now, 0.4);
      this.weatherGain.gain.setTargetAtTime(0.025, now, 0.4);
    }
  }

  private scheduleThunderCheck() {
    if (this.thunderTimer !== null) return;
    const check = () => {
      if (
        this.ctx &&
        this.ctx.state === 'running' &&
        this.currentWeather === 'storm' &&
        !this.isMuted &&
        Math.random() < 0.48
      ) {
        this.playDistantThunder();
      }
      this.thunderTimer = window.setTimeout(check, 6500 + Math.random() * 7500);
    };
    this.thunderTimer = window.setTimeout(check, 4500);
  }

  private playDistantThunder() {
    if (!this.ctx || !this.ambientGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 2.8);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambientGain);
    src.start(now);
    src.stop(now + 3.3);
  }

  public setLofiTrack(trackId: LofiTrackId) {
    this.currentTrack = trackId;
    this.step = 0;
    this.applyTrackTexture();
  }

  public setWeatherAudio(weather: WeatherType) {
    this.currentWeather = weather;
    this.applyWeatherAudio();
  }

  private startMusicLoop() {
    if (this.musicTimer !== null) return;
    const tickMusic = () => {
      const preset = TRACK_PRESETS[this.currentTrack];
      if (
        this.ctx &&
        this.ctx.state === 'running' &&
        this.musicEnabled &&
        !this.isMuted &&
        !this.zeybekPlaying &&
        preset.musicActive
      ) {
        this.playMusicBeat(this.step, preset);
        this.step++;
      }
      this.musicTimer = window.setTimeout(tickMusic, preset.stepMs);
    };
    tickMusic();
  }

  private playMusicBeat(step: number, preset: TrackPreset) {
    if (!this.ctx || !this.musicGain || !this.delayNode) return;
    const now = this.ctx.currentTime;

    if (step % 8 === 0 && preset.chords.length > 0) {
      const chordIdx = Math.floor(step / 8) % preset.chords.length;
      const chord = preset.chords[chordIdx];
      chord.forEach((freq, i) => {
        this.triggerFeltNote(freq, now + i * 0.08, 4.4, 0.038, preset.brightness);
      });
      // Soft sub bass root
      this.triggerBassNote(chord[0] * 0.5, now, 2.2);
    }

    if ((step % 2 === 0 || step % 7 === 3) && preset.melody.length > 0) {
      const noteIdx = (step * 3 + Math.floor(step / 4)) % preset.melody.length;
      const freq = preset.melody[noteIdx];
      this.triggerFeltNote(freq, now + 0.04, 2.2, 0.052, preset.brightness);
    }

    if (preset.hasBrushHat && step % 2 === 1) {
      this.triggerBrushHat(now);
    }
  }

  private triggerBassNote(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(0.065, startTime + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private triggerBrushHat(startTime: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(0.022, startTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.musicGain);
    src.start(startTime);
    src.stop(startTime + 0.11);
  }

  private triggerFeltNote(
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    brightness: number
  ) {
    if (!this.ctx || !this.musicGain || !this.delayNode) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(freq * 2, startTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.14, startTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(brightness, startTime);
    filter.frequency.exponentialRampToValueAtTime(340, startTime + duration);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + 0.045);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);
    env.connect(this.delayNode);

    osc.start(startTime);
    sub.start(startTime);
    osc.stop(startTime + duration + 0.05);
    sub.stop(startTime + duration + 0.05);
  }

  public playPetSound(pet: 'cat' | 'dog') {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (pet === 'cat') {
      // Gentle warm meow + soft purr
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(760, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.42);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.48);
    } else {
      // Friendly playful double woof
      [0, 0.16].forEach((offset) => {
        const t = now + offset;
        const osc = this.ctx!.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(145, t + 0.11);
        const lp = this.ctx!.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 680;
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        osc.connect(lp);
        lp.connect(g);
        g.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }
  }

  public playZeybekDance(durationSec = 11.5) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    this.zeybekTimers.forEach((t) => clearTimeout(t));
    this.zeybekTimers = [];
    this.zeybekPlaying = true;

    const schedulePhrase = (offsetMs: number) => {
      const id = window.setTimeout(() => {
        if (!this.ctx || !this.sfxGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const beatSec = 0.28;

        const drumHits = [
          { beat: 0, low: true },
          { beat: 4, low: false },
          { beat: 6, low: false },
          { beat: 9, low: true },
          { beat: 12, low: false },
          { beat: 14, low: true },
          { beat: 16, low: false },
        ];
        drumHits.forEach((h) => {
          const t = now + h.beat * beatSec;
          const osc = this.ctx!.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(h.low ? 96 : 165, t);
          osc.frequency.exponentialRampToValueAtTime(h.low ? 42 : 75, t + 0.22);
          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(h.low ? 0.16 : 0.08, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          osc.connect(g);
          g.connect(this.sfxGain!);
          osc.start(t);
          osc.stop(t + 0.3);
        });

        ZEYBEK_PHRASE.forEach((n) => {
          const t = now + n.beat * beatSec;
          const osc = this.ctx!.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(n.freq, t);

          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(n.freq * 1.8, t);
          filter.Q.value = 1.6;

          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.085, t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + n.len);

          osc.connect(filter);
          filter.connect(g);
          g.connect(this.sfxGain!);
          if (this.delayNode) g.connect(this.delayNode);
          osc.start(t);
          osc.stop(t + n.len + 0.05);
        });
      }, offsetMs);
      this.zeybekTimers.push(id);
    };

    schedulePhrase(0);
    schedulePhrase(5200);

    const endId = window.setTimeout(() => {
      this.zeybekPlaying = false;
    }, durationSec * 1000);
    this.zeybekTimers.push(endId);
  }

  public playLokmaGain() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const t = now + i * 0.07;
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playVendorCallout() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    [440, 523.25].forEach((f, i) => {
      const t = now + i * 0.11;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public updateEngineSound(speedAbs: number, vehicleType: VehicleType, isPlaying: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    if (!isPlaying || !this.sfxEnabled || this.isMuted || speedAbs < 0.35) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.12);
      return;
    }

    if (vehicleType === 'bicycle') {
      this.engineOsc.frequency.setTargetAtTime(110 + speedAbs * 3.5, now, 0.1);
      this.engineGain.gain.setTargetAtTime(0.008, now, 0.12);
    } else if (vehicleType === 'motorcycle') {
      this.engineOsc.frequency.setTargetAtTime(72 + speedAbs * 3.2, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.032, now, 0.1);
    } else {
      this.engineOsc.frequency.setTargetAtTime(52 + speedAbs * 2.4, now, 0.08);
      this.engineGain.gain.setTargetAtTime(0.025, now, 0.1);
    }
  }

  public playHorn(vehicleType: VehicleType) {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (vehicleType === 'bicycle') {
      [0, 0.14].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1980, now + offset);
        const harm = this.ctx!.createOscillator();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(2970, now + offset);
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.001, now + offset);
        g.gain.linearRampToValueAtTime(0.12, now + offset + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45);
        osc.connect(g);
        harm.connect(g);
        g.connect(this.sfxGain!);
        osc.start(now + offset);
        harm.start(now + offset);
        osc.stop(now + offset + 0.5);
        harm.stop(now + offset + 0.5);
      });
      return;
    }

    const freqs = vehicleType === 'motorcycle' ? [440, 554.37] : [329.63, 415.3];
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.02);
      g.gain.setValueAtTime(0.06, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.36);
    });
  }

  public playDiscoveryChime() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((f, idx) => {
      const start = now + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.11, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(start);
      osc.stop(start + 1.15);
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.74, this.ctx.currentTime, 0.08);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.54 : 0, this.ctx.currentTime, 0.12);
    }
    this.applyTrackTexture();
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 0.68 : 0, this.ctx.currentTime, 0.08);
    }
  }

  public dispose() {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.thunderTimer !== null) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    this.zeybekTimers.forEach((t) => clearTimeout(t));
    this.zeybekTimers = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const audioEngine = new CozyAudioEngine();
