import { LofiTrackId, VehicleType, WeatherType } from '../types/game';

type InstrumentStyle = 'felt' | 'oud' | 'pad' | 'rhodes';

interface TrackPreset {
  stepMs: number;
  swingMs: number;
  chords: number[][];
  /** 32-step melodic pattern per bar-cycle (null = lyrical rest so music breathes) */
  melodyPattern: (number | null)[];
  /** Optional quiet emotional counter-note on sparse steps */
  counterPattern?: (number | null)[];
  brightness: number;
  hasBrushHat: boolean;
  hasSoftKick: boolean;
  hasRimSnare: boolean;
  hasCrackle: boolean;
  crackleLevel: number;
  musicActive: boolean;
  instrument: InstrumentStyle;
  reverbSend: number;
  tapeDetuneCents: number;
}

const TRACK_PRESETS: Record<LofiTrackId, TrackPreset> = {
  aegean: {
    // 92.4 FM · Kent Meydanı & Sevgi Yolu — Nostalgic warm Rhodes & felt ballad (Fmaj9 - Dm9 - Bbmaj7 - C6/9)
    stepMs: 430,
    swingMs: 28,
    chords: [
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
      [146.83, 220.0, 261.63, 329.63, 349.23], // Dm9
      [116.54, 174.61, 220.0, 293.66, 349.23], // Bbmaj7
      [130.81, 196.0, 220.0, 293.66, 329.63], // C6/9
    ],
    melodyPattern: [
      523.25, null, 440.0, null, 392.0, null, 440.0, 349.23,
      329.63, null, null, null, 293.66, 329.63, 349.23, null,
      440.0, null, 392.0, 349.23, 293.66, null, null, 349.23,
      329.63, null, 293.66, null, 261.63, null, null, null,
    ],
    counterPattern: [
      null, null, null, null, null, null, null, null,
      null, null, 659.25, null, null, null, null, null,
      null, null, null, null, null, null, 587.33, null,
      null, null, null, null, null, null, 392.0, null,
    ],
    brightness: 1080,
    hasBrushHat: true,
    hasSoftKick: true,
    hasRimSnare: false,
    hasCrackle: true,
    crackleLevel: 0.013,
    musicActive: true,
    instrument: 'rhodes',
    reverbSend: 0.42,
    tapeDetuneCents: 6,
  },
  bazaar_oud: {
    // 95.8 FM · Tarihi Çarşı & Nasuh Paşa — Emotional Anatolian Hijaz acoustic oud lo-fi
    stepMs: 410,
    swingMs: 24,
    chords: [
      [146.83, 220.0, 293.66, 369.99], // D Hijaz open chord
      [155.56, 233.08, 293.66, 392.0], // Ebmaj7
      [130.81, 196.0, 233.08, 293.66], // Cm9
      [146.83, 220.0, 261.63, 369.99], // D7sus/Hijaz
    ],
    melodyPattern: [
      587.33, null, 554.37, 587.33, 440.0, null, 466.16, 440.0,
      392.0, null, 369.99, null, 311.13, 293.66, null, null,
      466.16, null, 440.0, 392.0, 369.99, null, 392.0, 440.0,
      369.99, 311.13, 293.66, null, null, null, 369.99, null,
    ],
    brightness: 1260,
    hasBrushHat: true,
    hasSoftKick: true,
    hasRimSnare: true,
    hasCrackle: true,
    crackleLevel: 0.015,
    musicActive: true,
    instrument: 'oud',
    reverbSend: 0.48,
    tapeDetuneCents: 5,
  },
  tralleis_echo: {
    // 98.2 FM · Tralleis & Magnesia Antik — Deeply emotional ambient lo-fi across ancient marble
    stepMs: 560,
    swingMs: 0,
    chords: [
      [110.0, 164.81, 246.94, 329.63], // Am9
      [87.31, 130.81, 196.0, 261.63, 329.63], // Fmaj9
      [130.81, 196.0, 246.94, 329.63], // Cmaj7
      [98.0, 146.83, 220.0, 293.66], // G6/9
    ],
    melodyPattern: [
      659.25, null, null, 587.33, 523.25, null, null, null,
      493.88, null, 523.25, null, 440.0, null, null, null,
      392.0, null, 440.0, null, 523.25, null, 587.33, null,
      493.88, null, null, 440.0, 392.0, null, null, null,
    ],
    counterPattern: [
      null, null, null, null, null, null, 329.63, null,
      null, null, null, null, null, null, 261.63, null,
      null, null, null, null, null, null, null, null,
      null, null, 293.66, null, null, null, 220.0, null,
    ],
    brightness: 820,
    hasBrushHat: false,
    hasSoftKick: false,
    hasRimSnare: false,
    hasCrackle: true,
    crackleLevel: 0.008,
    musicActive: true,
    instrument: 'pad',
    reverbSend: 0.68,
    tapeDetuneCents: 9,
  },
  aytepe_campus: {
    // 101.6 FM · ADÜ Aytepe Üniversitesi — Cozy swung chillhop study beat (Em9 - A13 - Dmaj9 - Bm7)
    stepMs: 365,
    swingMs: 34,
    chords: [
      [164.81, 246.94, 293.66, 369.99], // Em9
      [110.0, 196.0, 277.18, 329.63], // A13
      [146.83, 220.0, 277.18, 329.63], // Dmaj9
      [123.47, 185.0, 220.0, 293.66], // Bm7
    ],
    melodyPattern: [
      587.33, null, 554.37, 493.88, null, 440.0, 493.88, null,
      554.37, null, 493.88, null, 440.0, null, null, null,
      369.99, null, 440.0, 493.88, null, 554.37, 587.33, null,
      493.88, null, 440.0, null, 369.99, null, null, null,
    ],
    brightness: 1180,
    hasBrushHat: true,
    hasSoftKick: true,
    hasRimSnare: true,
    hasCrackle: true,
    crackleLevel: 0.014,
    musicActive: true,
    instrument: 'rhodes',
    reverbSend: 0.36,
    tapeDetuneCents: 6,
  },
  rainy_piano: {
    // 103.5 FM · Tabakhane Dere Boyu — Intimate, emotional solo felt piano (Am9 - Fmaj7 - Cmaj9 - G6)
    stepMs: 520,
    swingMs: 14,
    chords: [
      [110.0, 164.81, 246.94, 261.63], // Am9
      [87.31, 130.81, 164.81, 220.0], // Fmaj7
      [130.81, 196.0, 246.94, 293.66], // Cmaj9
      [98.0, 146.83, 196.0, 246.94], // G6
    ],
    melodyPattern: [
      523.25, null, 493.88, null, 440.0, null, 392.0, null,
      329.63, null, null, 349.23, 392.0, null, null, null,
      493.88, null, 523.25, null, 587.33, null, 523.25, null,
      493.88, null, 440.0, null, 392.0, null, null, null,
    ],
    counterPattern: [
      null, null, null, null, null, null, null, 261.63,
      null, null, 220.0, null, null, null, 261.63, null,
      null, null, null, null, null, null, null, 293.66,
      null, null, null, null, null, null, 246.94, null,
    ],
    brightness: 740,
    hasBrushHat: false,
    hasSoftKick: false,
    hasRimSnare: false,
    hasCrackle: true,
    crackleLevel: 0.015,
    musicActive: true,
    instrument: 'felt',
    reverbSend: 0.56,
    tapeDetuneCents: 7,
  },
  night_lofi: {
    // 106.0 FM · İstasyon & Gece Bulvarı — Smoky midnight jazz-hop (Cm9 - Fm9 - Abmaj7 - G7alt)
    stepMs: 390,
    swingMs: 36,
    chords: [
      [130.81, 196.0, 233.08, 293.66], // Cm9
      [87.31, 130.81, 155.56, 207.65], // Fm9
      [103.83, 155.56, 196.0, 261.63], // Abmaj7
      [98.0, 146.83, 185.0, 233.08], // G7#9/soft
    ],
    melodyPattern: [
      587.33, null, 466.16, null, 392.0, null, 466.16, 523.25,
      415.3, null, null, 392.0, 349.23, null, null, null,
      466.16, null, 523.25, 587.33, null, 466.16, 415.3, null,
      392.0, null, 349.23, null, 293.66, null, null, null,
    ],
    brightness: 880,
    hasBrushHat: true,
    hasSoftKick: true,
    hasRimSnare: true,
    hasCrackle: true,
    crackleLevel: 0.016,
    musicActive: true,
    instrument: 'rhodes',
    reverbSend: 0.45,
    tapeDetuneCents: 8,
  },
  ambient_only: {
    stepMs: 1200,
    swingMs: 0,
    chords: [],
    melodyPattern: [],
    brightness: 600,
    hasBrushHat: false,
    hasSoftKick: false,
    hasRimSnare: false,
    hasCrackle: false,
    crackleLevel: 0,
    musicActive: false,
    instrument: 'felt',
    reverbSend: 0.3,
    tapeDetuneCents: 0,
  },
};

// Harmandalı / Zeybek-inspired Hijaz-kar phrase in D (D, Eb, F#, G, A, Bb, C, D)
const ZEYBEK_PHRASE: { freq: number; beat: number; len: number }[] = [
  { freq: 587.33, beat: 0, len: 0.5 },
  { freq: 554.37, beat: 2, len: 0.4 },
  { freq: 587.33, beat: 3, len: 0.35 },
  { freq: 440.0, beat: 4, len: 0.62 },
  { freq: 466.16, beat: 6, len: 0.4 },
  { freq: 440.0, beat: 7, len: 0.45 },
  { freq: 369.99, beat: 9, len: 0.5 },
  { freq: 392.0, beat: 11, len: 0.38 },
  { freq: 369.99, beat: 12, len: 0.4 },
  { freq: 311.13, beat: 14, len: 0.48 },
  { freq: 293.66, beat: 16, len: 1.05 },
];

function createSoftTapeCurve(): Float32Array<ArrayBuffer> {
  const n = 1024;
  const buffer = new ArrayBuffer(n * 4);
  const curve = new Float32Array(buffer);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * 1.45) * 0.92;
  }
  return curve;
}

function createWarmReverbBuffer(ctx: AudioContext, durationSec = 2.4): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * durationSec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // Smooth exponential room decay + gentle early reflection swell
      const env = Math.pow(1 - t, 2.55) * (0.28 + 0.72 * Math.min(1, i / (ctx.sampleRate * 0.035)));
      const white = Math.random() * 2 - 1;
      // Lowpass smoothing inside the impulse response for silky warm reverb tail
      lp = lp * 0.76 + white * 0.24;
      data[i] = lp * env;
    }
  }
  return buf;
}

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicWarmFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbReturn: GainNode | null = null;
  private musicReverbSend: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineNoiseGain: GainNode | null = null;

  private weatherFilter: BiquadFilterNode | null = null;
  private weatherGain: GainNode | null = null;
  private crackleGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private chiffBuf: AudioBuffer | null = null;
  private flapBuf: AudioBuffer | null = null;
  private waterBuf: AudioBuffer | null = null;

  private musicTimer: number | null = null;
  private thunderTimer: number | null = null;
  private zeybekTimers: number[] = [];
  private guitarJamTimers: number[] = [];
  private step = 0;
  private isMuted = false;
  private musicEnabled = true;
  private sfxEnabled = true;
  private zeybekPlaying = false;
  private guitarJamPlaying = false;
  private initialized = false;
  private audioUnlocked = false;
  private globalUnlockBound = false;

  private currentTrack: LofiTrackId = 'aegean';
  private currentWeather: WeatherType = 'clear';

  private playSilentUnlockBuffer(ctx: AudioContext) {
    if (this.audioUnlocked) return;
    try {
      const silentBuf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
      this.audioUnlocked = true;
    } catch {
      // Ignore if context is not ready yet
    }
  }

  public unlock() {
    if (!this.initialized) {
      this.init();
    }
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => {
        this.playSilentUnlockBuffer(ctx);
      });
    }
    this.playSilentUnlockBuffer(ctx);
  }

  public bindGlobalUnlock() {
    if (this.globalUnlockBound || typeof window === 'undefined') return;
    this.globalUnlockBound = true;

    const handleGesture = () => {
      this.unlock();
      if (this.ctx && this.ctx.state === 'running' && this.audioUnlocked) {
        window.removeEventListener('touchstart', handleGesture, true);
        window.removeEventListener('touchend', handleGesture, true);
        window.removeEventListener('pointerdown', handleGesture, true);
        window.removeEventListener('keydown', handleGesture, true);
      }
    };

    window.addEventListener('touchstart', handleGesture, { capture: true, passive: true });
    window.addEventListener('touchend', handleGesture, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleGesture, { capture: true, passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ctx && this.ctx.state !== 'running') {
        void this.ctx.resume();
      }
    });
  }

  public init() {
    if (this.initialized) {
      if (this.ctx) {
        if (this.ctx.state !== 'running') {
          void this.ctx.resume();
        }
        this.playSilentUnlockBuffer(this.ctx);
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx({ latencyHint: 'playback' });
    this.ctx = ctx;

    // Gentle master warmth compressor/limiter so overlapping chords & chimes never clip
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.2;
    compressor.attack.value = 0.015;
    compressor.release.value = 0.25;

    const master = ctx.createGain();
    master.gain.value = this.isMuted ? 0 : 0.78;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    this.masterGain = master;

    // Lush shared stereo warm hall reverb (lightweight 1.75s IR for mobile CPU efficiency)
    const reverb = ctx.createConvolver();
    reverb.buffer = createWarmReverbBuffer(ctx, 1.75);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.42;
    const reverbWarm = ctx.createBiquadFilter();
    reverbWarm.type = 'lowpass';
    reverbWarm.frequency.value = 1650;
    reverb.connect(reverbWarm);
    reverbWarm.connect(reverbReturn);
    reverbReturn.connect(master);
    this.reverbNode = reverb;
    this.reverbReturn = reverbReturn;

    // Warm Tape Bus for Music (Soft Saturator -> Gentle Lowpass -> Music Gain -> Master & Reverb)
    const music = ctx.createGain();
    music.gain.value = this.musicEnabled ? 0.58 : 0;

    const tapeSat = ctx.createWaveShaper();
    tapeSat.curve = createSoftTapeCurve();
    tapeSat.oversample = 'none';

    const musicWarmFilter = ctx.createBiquadFilter();
    musicWarmFilter.type = 'lowpass';
    musicWarmFilter.frequency.value = 2150;
    musicWarmFilter.Q.value = 0.6;

    const musicReverbSend = ctx.createGain();
    musicReverbSend.gain.value = TRACK_PRESETS[this.currentTrack].reverbSend;

    musicWarmFilter.connect(tapeSat);
    tapeSat.connect(music);
    music.connect(master);
    music.connect(musicReverbSend);
    musicReverbSend.connect(reverb);

    this.musicGain = music;
    this.musicWarmFilter = musicWarmFilter;
    this.musicReverbSend = musicReverbSend;

    const ambient = ctx.createGain();
    ambient.gain.value = 0.6;
    ambient.connect(master);
    this.ambientGain = ambient;

    const sfx = ctx.createGain();
    sfx.gain.value = this.sfxEnabled ? 0.64 : 0;
    sfx.connect(master);
    this.sfxGain = sfx;

    // Soft analog tape echo feeding into musicWarmFilter
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.39;
    const fb = ctx.createGain();
    fb.gain.value = 0.26;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1050;

    delay.connect(delayFilter);
    delayFilter.connect(fb);
    fb.connect(delay);
    delayFilter.connect(musicWarmFilter);
    this.delayNode = delay;

    // Smooth Pink/Brown noise buffer for soothing weather, rain & tire whisper
    const bufLen = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.024 * white) / 1.024;
      lastOut = data[i];
      data[i] *= 2.5;
    }
    this.noiseBuffer = buf;

    // Short filtered noise buffers for sparrow syrinx chiff, wingbeat whoosh, and water splash
    const chiffLen = Math.floor(ctx.sampleRate * 0.045);
    const chiffBuf = ctx.createBuffer(1, chiffLen, ctx.sampleRate);
    const chiffData = chiffBuf.getChannelData(0);
    for (let i = 0; i < chiffLen; i++) {
      const env = Math.sin((i / chiffLen) * Math.PI);
      chiffData[i] = (Math.random() * 2 - 1) * env * 0.85;
    }
    this.chiffBuf = chiffBuf;

    const flapLen = Math.floor(ctx.sampleRate * 0.095);
    const flapBuf = ctx.createBuffer(1, flapLen, ctx.sampleRate);
    const flapData = flapBuf.getChannelData(0);
    let lpFlap = 0;
    for (let i = 0; i < flapLen; i++) {
      const env = Math.sin((i / flapLen) * Math.PI);
      lpFlap = lpFlap * 0.72 + (Math.random() * 2 - 1) * 0.28;
      flapData[i] = lpFlap * env * 1.9;
    }
    this.flapBuf = flapBuf;

    const waterLen = Math.floor(ctx.sampleRate * 0.085);
    const waterBuf = ctx.createBuffer(1, waterLen, ctx.sampleRate);
    const waterData = waterBuf.getChannelData(0);
    for (let i = 0; i < waterLen; i++) {
      const env = Math.pow(1 - i / waterLen, 1.4);
      waterData[i] = (Math.random() * 2 - 1) * env;
    }
    this.waterBuf = waterBuf;

    const weatherSrc = ctx.createBufferSource();
    weatherSrc.buffer = buf;
    weatherSrc.loop = true;

    const weatherFilter = ctx.createBiquadFilter();
    weatherFilter.type = 'lowpass';
    weatherFilter.frequency.value = 320;
    weatherFilter.Q.value = 0.6;

    const weatherGain = ctx.createGain();
    weatherGain.gain.value = 0.03;

    weatherSrc.connect(weatherFilter);
    weatherFilter.connect(weatherGain);
    weatherGain.connect(ambient);
    weatherSrc.start();
    this.weatherFilter = weatherFilter;
    this.weatherGain = weatherGain;

    // Warm Vintage Vinyl Crackle & Dust (gentle low-mid dusty pops, zero harsh fizz)
    const crackleLen = ctx.sampleRate * 5;
    const crackleBuf = ctx.createBuffer(1, crackleLen, ctx.sampleRate);
    const cData = crackleBuf.getChannelData(0);
    let dustLp = 0;
    for (let i = 0; i < crackleLen; i++) {
      const pop = Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.5 : 0;
      const bed = (Math.random() * 2 - 1) * 0.012;
      dustLp = dustLp * 0.55 + (pop + bed) * 0.45;
      cData[i] = dustLp;
    }
    const crackleSrc = ctx.createBufferSource();
    crackleSrc.buffer = crackleBuf;
    crackleSrc.loop = true;
    const crackleBp = ctx.createBiquadFilter();
    crackleBp.type = 'bandpass';
    crackleBp.frequency.value = 1250;
    crackleBp.Q.value = 0.8;
    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.014;
    crackleSrc.connect(crackleBp);
    crackleBp.connect(crackleGain);
    crackleGain.connect(music);
    crackleSrc.start();
    this.crackleGain = crackleGain;

    // Silky Muffled Vehicle Purr + Gentle Tire Road Whisper (no harsh oscillator buzz)
    const engOsc = ctx.createOscillator();
    engOsc.type = 'sine';
    engOsc.frequency.value = 48;
    const engSub = ctx.createOscillator();
    engSub.type = 'triangle';
    engSub.frequency.value = 72;
    const engSubMix = ctx.createGain();
    engSubMix.gain.value = 0.25;

    const engFilter = ctx.createBiquadFilter();
    engFilter.type = 'lowpass';
    engFilter.frequency.value = 145;
    const engGain = ctx.createGain();
    engGain.gain.value = 0;

    engOsc.connect(engFilter);
    engSub.connect(engSubMix);
    engSubMix.connect(engFilter);
    engFilter.connect(engGain);
    engGain.connect(sfx);
    engOsc.start();
    engSub.start();
    this.engineOsc = engOsc;
    this.engineSubOsc = engSub;
    this.engineGain = engGain;

    const tireSrc = ctx.createBufferSource();
    tireSrc.buffer = buf;
    tireSrc.loop = true;
    const tireFilter = ctx.createBiquadFilter();
    tireFilter.type = 'bandpass';
    tireFilter.frequency.value = 260;
    tireFilter.Q.value = 0.7;
    const tireGain = ctx.createGain();
    tireGain.gain.value = 0;
    tireSrc.connect(tireFilter);
    tireFilter.connect(tireGain);
    tireGain.connect(sfx);
    tireSrc.start();
    this.engineNoiseGain = tireGain;

    this.initialized = true;
    this.playSilentUnlockBuffer(ctx);
    if (ctx.state !== 'running') {
      void ctx.resume().then(() => {
        this.playSilentUnlockBuffer(ctx);
      });
    }
    this.applyWeatherAudio();
    this.applyTrackTexture();
    this.startMusicLoop();
    this.scheduleThunderCheck();
  }

  private applyTrackTexture() {
    if (!this.ctx || !this.crackleGain) return;
    const preset = TRACK_PRESETS[this.currentTrack];
    const target =
      this.musicEnabled && preset.hasCrackle && preset.musicActive ? preset.crackleLevel : 0;
    this.crackleGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25);
    if (this.musicReverbSend) {
      this.musicReverbSend.gain.setTargetAtTime(preset.reverbSend, this.ctx.currentTime, 0.35);
    }
  }

  private applyWeatherAudio() {
    if (!this.ctx || !this.weatherFilter || !this.weatherGain) return;
    const now = this.ctx.currentTime;
    if (this.currentWeather === 'rain') {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(760, now, 0.5);
      this.weatherGain.gain.setTargetAtTime(0.095, now, 0.5);
    } else if (this.currentWeather === 'storm') {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(520, now, 0.5);
      this.weatherGain.gain.setTargetAtTime(0.135, now, 0.5);
    } else if (this.currentWeather === 'snow') {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(220, now, 0.5);
      this.weatherGain.gain.setTargetAtTime(0.045, now, 0.5);
    } else {
      this.weatherFilter.type = 'lowpass';
      this.weatherFilter.frequency.setTargetAtTime(260, now, 0.5);
      this.weatherGain.gain.setTargetAtTime(0.022, now, 0.5);
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
        Math.random() < 0.45
      ) {
        this.playDistantThunder();
      }
      this.thunderTimer = window.setTimeout(check, 7000 + Math.random() * 8000);
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
    filter.frequency.setValueAtTime(125, now);
    filter.frequency.exponentialRampToValueAtTime(48, now + 3.2);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.ambientGain);
    if (this.reverbNode) g.connect(this.reverbNode);
    src.start(now);
    src.stop(now + 3.6);
  }

  public setLofiTrack(trackId: LofiTrackId, withTuneClick = false) {
    const changed = this.currentTrack !== trackId;
    this.currentTrack = trackId;
    this.step = 0;
    this.applyTrackTexture();
    if (withTuneClick && changed) {
      this.playRadioTuneClick();
    }
  }

  public playRadioTuneClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Soft analog knob click
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(520, now);
    clickOsc.frequency.exponentialRampToValueAtTime(160, now + 0.03);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.06, now);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
    clickOsc.connect(cg);
    cg.connect(this.sfxGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);

    // Warm muffled FM band breath
    if (this.noiseBuffer) {
      const staticSrc = this.ctx.createBufferSource();
      staticSrc.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1350, now);
      bp.Q.value = 1.1;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0.001, now);
      sg.gain.linearRampToValueAtTime(0.024, now + 0.03);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      staticSrc.connect(bp);
      bp.connect(sg);
      sg.connect(this.sfxGain);
      staticSrc.start(now);
      staticSrc.stop(now + 0.18);
    }
  }

  public setWeatherAudio(weather: WeatherType) {
    this.currentWeather = weather;
    this.applyWeatherAudio();
  }

  private startMusicLoop() {
    if (this.musicTimer !== null) return;
    const tickMusic = () => {
      const preset = TRACK_PRESETS[this.currentTrack];
      const swingOffset = this.step % 2 === 1 ? preset.swingMs : -preset.swingMs * 0.4;
      if (
        this.ctx &&
        this.ctx.state === 'running' &&
        this.musicEnabled &&
        !this.isMuted &&
        !this.zeybekPlaying &&
        !this.guitarJamPlaying &&
        preset.musicActive
      ) {
        this.playMusicBeat(this.step, preset);
        this.step++;
      }
      const nextDelay = Math.max(180, preset.stepMs + swingOffset);
      this.musicTimer = window.setTimeout(tickMusic, nextDelay);
    };
    tickMusic();
  }

  private playMusicBeat(step: number, preset: TrackPreset) {
    if (!this.ctx || !this.musicWarmFilter) return;
    const now = this.ctx.currentTime;
    const inst = preset.instrument;
    const barStep = step % 32;

    // Gentle chord pad / rolled emotional voicing every 8 steps (1 bar)
    if (barStep % 8 === 0 && preset.chords.length > 0) {
      const chordIdx = Math.floor(barStep / 8) % preset.chords.length;
      const chord = preset.chords[chordIdx];
      const strumGap = inst === 'oud' ? 0.055 : inst === 'pad' ? 0.11 : 0.075;
      const chordDur = (preset.stepMs / 1000) * 7.6;
      const chordGain = inst === 'pad' ? 0.028 : inst === 'felt' ? 0.032 : 0.03;

      chord.forEach((freq, i) => {
        const humanTime = now + i * strumGap + (Math.random() - 0.5) * 0.014;
        this.triggerLoFiVoice(
          freq,
          humanTime,
          chordDur,
          chordGain,
          preset.brightness * 0.85,
          inst,
          preset.tapeDetuneCents
        );
      });

      // Warm sub-bass root gently hugging the chord
      this.triggerBassNote(chord[0] * 0.5, now + 0.015, chordDur * 0.72);
    }

    // Subtle secondary warm bass pulse on beat 3 (step % 8 === 4) for groove stations
    if (barStep % 8 === 4 && preset.hasSoftKick && preset.chords.length > 0) {
      const chordIdx = Math.floor(barStep / 8) % preset.chords.length;
      const chord = preset.chords[chordIdx];
      this.triggerBassNote(chord[0] * 0.5, now + 0.02, 1.1, 0.042);
    }

    // Lyrical emotional melody pattern (with breathing rests!)
    const melodyFreq =
      preset.melodyPattern.length > 0
        ? preset.melodyPattern[barStep % preset.melodyPattern.length]
        : null;
    if (melodyFreq !== null) {
      const humanDelay = 0.02 + Math.random() * 0.025;
      const velocityVar = 0.86 + Math.random() * 0.24;
      const noteDur = inst === 'pad' ? 3.2 : inst === 'felt' ? 2.4 : inst === 'oud' ? 1.45 : 1.85;
      const baseGain = inst === 'pad' ? 0.04 : inst === 'felt' ? 0.052 : 0.046;

      // Occasional expressive grace-slide on oud
      this.triggerLoFiVoice(
        melodyFreq,
        now + humanDelay,
        noteDur,
        baseGain * velocityVar,
        preset.brightness,
        inst,
        preset.tapeDetuneCents,
        inst === 'oud' && Math.random() < 0.35
      );
    }

    // Sparse tender counter-note
    const counterFreq =
      preset.counterPattern && preset.counterPattern.length > 0
        ? preset.counterPattern[barStep % preset.counterPattern.length]
        : null;
    if (counterFreq !== null) {
      this.triggerLoFiVoice(
        counterFreq,
        now + 0.04,
        2.6,
        0.028,
        preset.brightness * 0.75,
        'felt',
        preset.tapeDetuneCents
      );
    }

    // Dusty Lo-Fi Drum Pocket (Kick on 0 & 3/5, soft rim/snare on 2 & 6, gentle brush hats)
    if (preset.hasSoftKick && (barStep % 8 === 0 || barStep % 8 === 5)) {
      this.triggerSoftKick(now + Math.random() * 0.01);
    }

    if (preset.hasRimSnare && (barStep % 8 === 2 || barStep % 8 === 6)) {
      this.triggerLoFiSnare(now + 0.012 + Math.random() * 0.012);
    }

    if (preset.hasBrushHat && barStep % 2 === 1) {
      this.triggerBrushHat(now + Math.random() * 0.01, barStep % 4 === 3 ? 0.014 : 0.02);
    }
  }

  private triggerSoftKick(startTime: number) {
    if (!this.ctx || !this.musicWarmFilter) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, startTime);
    osc.frequency.exponentialRampToValueAtTime(38, startTime + 0.14);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 210;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(0.11, startTime + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

    osc.connect(lp);
    lp.connect(g);
    g.connect(this.musicWarmFilter);
    osc.start(startTime);
    osc.stop(startTime + 0.27);
  }

  private triggerLoFiSnare(startTime: number) {
    if (!this.ctx || !this.musicWarmFilter) return;
    // Soft wooden rim tone
    const body = this.ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(195, startTime);
    body.frequency.exponentialRampToValueAtTime(115, startTime + 0.065);
    const bg = this.ctx.createGain();
    bg.gain.setValueAtTime(0.0001, startTime);
    bg.gain.linearRampToValueAtTime(0.042, startTime + 0.006);
    bg.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.08);
    body.connect(bg);
    bg.connect(this.musicWarmFilter);
    body.start(startTime);
    body.stop(startTime + 0.1);

    // Muffled vinyl brush puff
    if (this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1150;
      bp.Q.value = 0.9;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.0001, startTime);
      ng.gain.linearRampToValueAtTime(0.026, startTime + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13);
      src.connect(bp);
      bp.connect(ng);
      ng.connect(this.musicWarmFilter);
      src.start(startTime);
      src.stop(startTime + 0.15);
    }
  }

  private triggerBassNote(freq: number, startTime: number, duration: number, peak = 0.062) {
    if (!this.ctx || !this.musicWarmFilter) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peak, startTime + 0.075);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(env);
    env.connect(this.musicWarmFilter);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.06);
  }

  private triggerBrushHat(startTime: number, level = 0.018) {
    if (!this.ctx || !this.musicWarmFilter || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 1.0;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(level, startTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.075);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.musicWarmFilter);
    src.start(startTime);
    src.stop(startTime + 0.09);
  }

  private triggerLoFiVoice(
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    brightness: number,
    instrument: InstrumentStyle,
    tapeDetuneCents: number,
    slideFromBelow = false
  ) {
    if (!this.ctx || !this.musicWarmFilter || !this.delayNode) return;
    // Subtle analog tape wow/drift per note
    const driftCents = (Math.random() - 0.5) * tapeDetuneCents * 2;

    const oscA = this.ctx.createOscillator();
    oscA.type = instrument === 'oud' ? 'triangle' : 'sine';
    if (slideFromBelow) {
      oscA.frequency.setValueAtTime(freq * 0.94, startTime);
      oscA.frequency.exponentialRampToValueAtTime(freq, startTime + 0.085);
    } else {
      oscA.frequency.setValueAtTime(freq, startTime);
    }
    oscA.detune.setValueAtTime(driftCents - 3.5, startTime);

    // Warm slightly detuned second voice for organic Rhodes / felt tape chorus
    const oscB = this.ctx.createOscillator();
    oscB.type = instrument === 'pad' ? 'sine' : 'triangle';
    oscB.frequency.setValueAtTime(instrument === 'oud' ? freq * 2.0 : freq, startTime);
    oscB.detune.setValueAtTime(driftCents + 4.5, startTime);

    const mixB = this.ctx.createGain();
    mixB.gain.setValueAtTime(
      instrument === 'oud' ? 0.18 : instrument === 'pad' ? 0.35 : 0.24,
      startTime
    );

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(brightness, startTime);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(240, brightness * 0.28),
      startTime + duration
    );

    const attack =
      instrument === 'pad' ? 0.36 : instrument === 'oud' ? 0.016 : instrument === 'felt' ? 0.032 : 0.026;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Soft mechanical felt hammer thump on intimate felt piano
    if (instrument === 'felt' && this.flapBuf) {
      const hammer = this.ctx.createBufferSource();
      hammer.buffer = this.flapBuf;
      const hLp = this.ctx.createBiquadFilter();
      hLp.type = 'lowpass';
      hLp.frequency.value = 380;
      const hg = this.ctx.createGain();
      hg.gain.value = peakGain * 0.16;
      hammer.connect(hLp);
      hLp.connect(hg);
      hg.connect(this.musicWarmFilter);
      hammer.start(startTime);
    }

    oscA.connect(filter);
    oscB.connect(mixB);
    mixB.connect(filter);
    filter.connect(env);
    env.connect(this.musicWarmFilter);
    env.connect(this.delayNode);

    oscA.start(startTime);
    oscB.start(startTime);
    oscA.stop(startTime + duration + 0.08);
    oscB.stop(startTime + duration + 0.08);
  }

  public playPetSound(pet: 'cat' | 'dog') {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (pet === 'cat') {
      // Soft, affectionate warm meow through gentle formant filter + reverb
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(660, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.44);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1100, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.068, now + 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.sfxGain);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Warm muffled playful double-woof (no harsh sawtooth)
      [0, 0.18].forEach((offset) => {
        const t = now + offset;
        const osc = this.ctx!.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(125, t + 0.12);
        const lp = this.ctx!.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 460;
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.075, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(lp);
        lp.connect(g);
        g.connect(this.sfxGain!);
        if (this.reverbNode) g.connect(this.reverbNode);
        osc.start(t);
        osc.stop(t + 0.17);
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

        // Deep warm Davul skin beats
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
          osc.frequency.setValueAtTime(h.low ? 88 : 145, t);
          osc.frequency.exponentialRampToValueAtTime(h.low ? 38 : 68, t + 0.24);
          const lp = this.ctx!.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 260;
          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(h.low ? 0.15 : 0.075, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          osc.connect(lp);
          lp.connect(g);
          g.connect(this.sfxGain!);
          if (this.reverbNode) g.connect(this.reverbNode);
          osc.start(t);
          osc.stop(t + 0.32);
        });

        // Expressive, warm Ney/Keman-style Hijaz lead with gentle vibrato & lush reverb
        ZEYBEK_PHRASE.forEach((n) => {
          const t = now + n.beat * beatSec;
          const osc = this.ctx!.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq * 0.96, t);
          osc.frequency.exponentialRampToValueAtTime(n.freq, t + 0.06);

          const oscWarm = this.ctx!.createOscillator();
          oscWarm.type = 'sine';
          oscWarm.frequency.setValueAtTime(n.freq, t);
          oscWarm.detune.value = 5;

          const vib = this.ctx!.createOscillator();
          vib.type = 'sine';
          vib.frequency.value = 5.2;
          const vibGain = this.ctx!.createGain();
          vibGain.gain.value = 6.5;
          vib.connect(vibGain);
          vibGain.connect(osc.frequency);
          vibGain.connect(oscWarm.frequency);

          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1400, t);
          filter.frequency.exponentialRampToValueAtTime(680, t + n.len);

          const g = this.ctx!.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.065, t + 0.065);
          g.gain.exponentialRampToValueAtTime(0.0001, t + n.len);

          osc.connect(filter);
          oscWarm.connect(filter);
          filter.connect(g);
          g.connect(this.sfxGain!);
          if (this.reverbNode) g.connect(this.reverbNode);
          if (this.delayNode) g.connect(this.delayNode);
          osc.start(t);
          oscWarm.start(t);
          vib.start(t);
          osc.stop(t + n.len + 0.06);
          oscWarm.stop(t + n.len + 0.06);
          vib.stop(t + n.len + 0.06);
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

  public playParkGuitarJam(durationSec = 12.0) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    this.guitarJamTimers.forEach((t) => clearTimeout(t));
    this.guitarJamTimers = [];
    this.guitarJamPlaying = true;

    const pluckAcousticString = (freq: number, startTime: number, dur: number, peak: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const oscA = this.ctx.createOscillator();
      oscA.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, startTime);

      const oscB = this.ctx.createOscillator();
      oscB.type = 'sine';
      oscB.frequency.setValueAtTime(freq * 2, startTime);
      const harmG = this.ctx.createGain();
      harmG.gain.value = 0.22;

      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.setValueAtTime(2400, startTime);
      bodyFilter.frequency.exponentialRampToValueAtTime(420, startTime + Math.min(dur, 0.9));

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, startTime);
      env.gain.linearRampToValueAtTime(peak, startTime + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      oscA.connect(bodyFilter);
      oscB.connect(harmG);
      harmG.connect(bodyFilter);
      bodyFilter.connect(env);
      env.connect(this.sfxGain);
      if (this.reverbNode) env.connect(this.reverbNode);

      oscA.start(startTime);
      oscB.start(startTime);
      oscA.stop(startTime + dur + 0.05);
      oscB.stop(startTime + dur + 0.05);
    };

    const triggerCajonTap = (startTime: number, bass: boolean) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(bass ? 95 : 185, startTime);
      osc.frequency.exponentialRampToValueAtTime(bass ? 48 : 95, startTime + 0.09);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.linearRampToValueAtTime(bass ? 0.085 : 0.045, startTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    };

    // Warm Aegean park acoustic progression: Em9 -> Cmaj7 -> G6 -> Dsus4
    const guitarChords = [
      [164.81, 246.94, 293.66, 369.99, 493.88], // Em9
      [130.81, 196.0, 246.94, 329.63, 392.0], // Cmaj7
      [196.0, 246.94, 293.66, 329.63, 392.0], // G6
      [146.83, 220.0, 293.66, 369.99, 440.0], // Dadd4
    ];
    const fingerLead = [659.25, 587.33, 493.88, 587.33, 659.25, 739.99, 587.33, 493.88];

    const scheduleBar = (barIdx: number, delayMs: number) => {
      const id = window.setTimeout(() => {
        if (!this.ctx || !this.sfxGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = guitarChords[barIdx % guitarChords.length];

        // Down-strum on beat 1 & light up-strum on beat 2.5
        chord.forEach((f, si) => {
          pluckAcousticString(f, now + si * 0.026, 1.45, 0.048);
        });
        chord.slice(1).forEach((f, si) => {
          pluckAcousticString(f, now + 0.72 + (3 - si) * 0.022, 0.85, 0.032);
        });
        // Expressive fingerpicked acoustic melody notes
        pluckAcousticString(fingerLead[(barIdx * 2) % fingerLead.length], now + 0.36, 0.9, 0.055);
        pluckAcousticString(fingerLead[(barIdx * 2 + 1) % fingerLead.length], now + 1.08, 1.05, 0.058);

        // Soft cajon pocket (bass-slap-bass-slap)
        triggerCajonTap(now + 0.01, true);
        triggerCajonTap(now + 0.38, false);
        triggerCajonTap(now + 0.72, true);
        triggerCajonTap(now + 1.1, false);
      }, delayMs);
      this.guitarJamTimers.push(id);
    };

    for (let b = 0; b < 8; b++) {
      scheduleBar(b, b * 1450);
    }

    const endId = window.setTimeout(() => {
      this.guitarJamPlaying = false;
    }, durationSec * 1000);
    this.guitarJamTimers.push(endId);
  }

  public playLokmaGain() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Warm golden harp/celesta chord (Gmaj9)
    [392.0, 493.88, 587.33, 739.99].forEach((f, i) => {
      const t = now + i * 0.075;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      const harm = this.ctx!.createOscillator();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime(f * 2, t);
      const harmG = this.ctx!.createGain();
      harmG.gain.value = 0.08;

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.022);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      osc.connect(g);
      harm.connect(harmG);
      harmG.connect(g);
      g.connect(this.sfxGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t);
      harm.start(t);
      osc.stop(t + 1.0);
      harm.stop(t + 1.0);
    });
  }

  public playVendorCallout() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Cozy warm wooden marimba greeting (E4 -> A4 -> B4)
    [329.63, 440.0, 493.88].forEach((f, i) => {
      const t = now + i * 0.095;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
      osc.connect(g);
      g.connect(this.sfxGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  public updateEngineSound(speedAbs: number, vehicleType: VehicleType, isPlaying: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    if (!isPlaying || !this.sfxEnabled || this.isMuted || speedAbs < 0.4) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.16);
      if (this.engineNoiseGain) this.engineNoiseGain.gain.setTargetAtTime(0, now, 0.16);
      return;
    }

    const speedRatio = Math.min(1, speedAbs / 18);
    if (vehicleType === 'bicycle') {
      // Pure soft rolling breeze/tire whisper on bicycle (zero oscillator hum!)
      this.engineGain.gain.setTargetAtTime(0, now, 0.15);
      if (this.engineNoiseGain) {
        this.engineNoiseGain.gain.setTargetAtTime(0.008 * speedRatio, now, 0.15);
      }
    } else if (vehicleType === 'motorcycle') {
      const baseFreq = 58 + speedAbs * 2.1;
      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.12);
      if (this.engineSubOsc) this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.12);
      this.engineGain.gain.setTargetAtTime(0.014 + speedRatio * 0.008, now, 0.14);
      if (this.engineNoiseGain) {
        this.engineNoiseGain.gain.setTargetAtTime(0.01 * speedRatio, now, 0.15);
      }
    } else {
      const baseFreq = 44 + speedAbs * 1.65;
      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.12);
      if (this.engineSubOsc) this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.12);
      this.engineGain.gain.setTargetAtTime(0.012 + speedRatio * 0.007, now, 0.14);
      if (this.engineNoiseGain) {
        this.engineNoiseGain.gain.setTargetAtTime(0.011 * speedRatio, now, 0.15);
      }
    }
  }

  public playHorn(vehicleType: VehicleType) {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (vehicleType === 'bicycle') {
      // Warm sparkling brass bell into lush reverb
      [0, 0.15].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1567.98, now + offset);
        const harm = this.ctx!.createOscillator();
        harm.type = 'sine';
        harm.frequency.setValueAtTime(2349.32, now + offset);
        const harmG = this.ctx!.createGain();
        harmG.gain.value = 0.25;
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.001, now + offset);
        g.gain.linearRampToValueAtTime(0.085, now + offset + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.65);
        osc.connect(g);
        harm.connect(harmG);
        harmG.connect(g);
        g.connect(this.sfxGain!);
        if (this.reverbNode) g.connect(this.reverbNode);
        osc.start(now + offset);
        harm.start(now + offset);
        osc.stop(now + offset + 0.7);
        harm.stop(now + offset + 0.7);
      });
      return;
    }

    // Warm rounded vintage two-tone horn (no harsh sawtooth buzz)
    const freqs = vehicleType === 'motorcycle' ? [440, 554.37] : [329.63, 415.3];
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 620;

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.025);
      g.gain.setValueAtTime(0.052, now + 0.14);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

      osc.connect(filter);
      filter.connect(g);
      g.connect(this.sfxGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  public playDiscoveryChime() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Emotional warm Dmaj9 celesta/harp arpeggio blooming in reverb
    const notes = [293.66, 440.0, 554.37, 659.25, 739.99];
    notes.forEach((f, idx) => {
      const start = now + idx * 0.095;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);
      const shimmer = this.ctx!.createOscillator();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(f * 2, start);
      const shimmerG = this.ctx!.createGain();
      shimmerG.gain.value = 0.07;

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.082, start + 0.028);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 1.65);

      osc.connect(g);
      shimmer.connect(shimmerG);
      shimmerG.connect(g);
      g.connect(this.sfxGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(start);
      shimmer.start(start);
      osc.stop(start + 1.7);
      shimmer.stop(start + 1.7);
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, this.ctx.currentTime, 0.1);
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(enabled ? 0.58 : 0, this.ctx.currentTime, 0.16);
    }
    this.applyTrackTexture();
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(enabled ? 0.64 : 0, this.ctx.currentTime, 0.1);
    }
  }

  private triggerSyrinxSyllable(opts: {
    t0: number;
    dur: number;
    fStart: number;
    fPeak: number;
    fEnd: number;
    peakRatio?: number;
    voice2Ratio?: number;
    voice2Mix?: number;
    trillHz?: number;
    trillDepth?: number;
    gain: number;
  }) {
    if (!this.ctx || !this.sfxGain) return;
    const { t0, dur, fStart, fPeak, fEnd } = opts;
    const peakT = t0 + dur * (opts.peakRatio ?? 0.36);
    const endT = t0 + dur;

    const oscA = this.ctx.createOscillator();
    oscA.type = 'triangle';
    oscA.frequency.setValueAtTime(fStart, t0);
    oscA.frequency.exponentialRampToValueAtTime(Math.max(400, fPeak), peakT);
    oscA.frequency.exponentialRampToValueAtTime(Math.max(400, fEnd), endT);

    const oscB = this.ctx.createOscillator();
    oscB.type = 'sine';
    const r2 = opts.voice2Ratio ?? 1.49;
    oscB.frequency.setValueAtTime(fStart * r2, t0);
    oscB.frequency.exponentialRampToValueAtTime(Math.max(500, fPeak * r2), peakT);
    oscB.frequency.exponentialRampToValueAtTime(Math.max(500, fEnd * r2), endT);

    const mixB = this.ctx.createGain();
    mixB.gain.value = opts.voice2Mix ?? 0.28;

    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (opts.trillHz && opts.trillDepth) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = opts.trillHz;
      lfoGain = this.ctx.createGain();
      lfoGain.gain.value = opts.trillDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(oscA.frequency);
      lfo.start(t0);
      lfo.stop(endT + 0.02);
    }

    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(fPeak * 1.1, t0);
    formant.Q.value = 1.65;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(opts.gain, t0 + Math.min(0.014, dur * 0.2));
    env.gain.exponentialRampToValueAtTime(0.0001, endT);

    if (this.chiffBuf) {
      const chiff = this.ctx.createBufferSource();
      chiff.buffer = this.chiffBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fPeak * 1.3;
      bp.Q.value = 1.8;
      const cg = this.ctx.createGain();
      cg.gain.value = opts.gain * 0.35;
      chiff.connect(bp);
      bp.connect(cg);
      cg.connect(this.sfxGain);
      chiff.start(t0);
    }

    oscA.connect(formant);
    oscB.connect(mixB);
    mixB.connect(formant);
    formant.connect(env);
    env.connect(this.sfxGain);
    if (this.reverbNode) {
      const revSend = this.ctx.createGain();
      revSend.gain.value = 0.22;
      env.connect(revSend);
      revSend.connect(this.reverbNode);
    }

    oscA.start(t0);
    oscB.start(t0);
    oscA.stop(endT + 0.02);
    oscB.stop(endT + 0.02);
  }

  public playSparrowChirp(melodicTrill = false) {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const baseHz = 2550 + Math.random() * 480;
    const jitter = 0.96 + Math.random() * 0.08;
    const style = melodicTrill ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3);

    if (style === 0) {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.082,
        fStart: baseHz * 0.84 * jitter,
        fPeak: baseHz * 1.28 * jitter,
        fEnd: baseHz * 0.92 * jitter,
        voice2Ratio: 1.33,
        voice2Mix: 0.32,
        gain: 0.115,
      });
      this.triggerSyrinxSyllable({
        t0: now + 0.095,
        dur: 0.056,
        fStart: baseHz * 1.12 * jitter,
        fPeak: baseHz * 1.44 * jitter,
        fEnd: baseHz * 1.06 * jitter,
        gain: 0.098,
      });
      this.triggerSyrinxSyllable({
        t0: now + 0.165,
        dur: 0.105,
        fStart: baseHz * 0.98 * jitter,
        fPeak: baseHz * 1.26 * jitter,
        fEnd: baseHz * 0.82 * jitter,
        trillHz: 46,
        trillDepth: 110,
        gain: 0.108,
      });
    } else if (style === 1) {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.072,
        fStart: baseHz * 0.88 * jitter,
        fPeak: baseHz * 1.34 * jitter,
        fEnd: baseHz * 1.02 * jitter,
        gain: 0.11,
      });
      this.triggerSyrinxSyllable({
        t0: now + 0.086,
        dur: 0.092,
        fStart: baseHz * 1.02 * jitter,
        fPeak: baseHz * 1.42 * jitter,
        fEnd: baseHz * 0.88 * jitter,
        trillHz: 38,
        trillDepth: 90,
        gain: 0.105,
      });
    } else {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.086,
        fStart: baseHz * 0.9 * jitter,
        fPeak: baseHz * 1.35 * jitter,
        fEnd: baseHz * 0.95 * jitter,
        trillHz: 42,
        trillDepth: 95,
        gain: 0.11,
      });
    }
  }

  public playSparrowMicroChirp(mood: 'idle' | 'hop' | 'takeoff' | 'perch' = 'idle') {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const rootHz = 2600 + Math.random() * 440;
    const jitter = 0.95 + Math.random() * 0.1;

    if (mood === 'takeoff') {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.045,
        fStart: rootHz * 0.86 * jitter,
        fPeak: rootHz * 1.18 * jitter,
        fEnd: rootHz * 1.04 * jitter,
        gain: 0.075,
      });
      this.triggerSyrinxSyllable({
        t0: now + 0.055,
        dur: 0.068,
        fStart: rootHz * 1.04 * jitter,
        fPeak: rootHz * 1.38 * jitter,
        fEnd: rootHz * 1.16 * jitter,
        peakRatio: 0.65,
        gain: 0.082,
      });
    } else if (mood === 'perch') {
      this.triggerSyrinxSyllable({
        t0: now + 0.02,
        dur: 0.085,
        fStart: rootHz * 1.06 * jitter,
        fPeak: rootHz * 1.22 * jitter,
        fEnd: rootHz * 0.78 * jitter,
        trillHz: 40,
        trillDepth: 85,
        gain: 0.072,
      });
    } else if (mood === 'hop') {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.042,
        fStart: rootHz * 0.92 * jitter,
        fPeak: rootHz * 1.24 * jitter,
        fEnd: rootHz * 0.98 * jitter,
        gain: 0.06,
      });
    } else {
      this.triggerSyrinxSyllable({
        t0: now,
        dur: 0.072,
        fStart: rootHz * 0.82 * jitter,
        fPeak: rootHz * 1.26 * jitter,
        fEnd: rootHz * 0.88 * jitter,
        trillHz: 36,
        trillDepth: 65,
        gain: 0.065,
      });
    }
  }

  public playWingFlap(strength = 1.0) {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.flapBuf || !this.sfxEnabled || this.isMuted) return;
    const baseTime = this.ctx.currentTime;
    for (let beat = 0; beat < 3; beat++) {
      const t0 = baseTime + beat * 0.048;
      const src = this.ctx.createBufferSource();
      src.buffer = this.flapBuf;
      src.playbackRate.value = 0.94 + Math.random() * 0.12;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(460 - beat * 50, t0);
      bp.frequency.exponentialRampToValueAtTime(195, t0 + 0.05);
      bp.Q.value = 1.0;
      const g = this.ctx.createGain();
      g.gain.value = 0.075 * strength * (1.0 - beat * 0.22);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.sfxGain);
      src.start(t0);
    }
  }

  public playFlightWingbeat(intensity = 0.5) {
    if (!this.ctx || !this.sfxGain || !this.flapBuf || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const amp = Math.max(0.08, Math.min(1.0, intensity));
    const jitter = 0.91 + Math.random() * 0.18;
    const whoosh = this.ctx.createBufferSource();
    whoosh.buffer = this.flapBuf;
    whoosh.playbackRate.value = 0.92 * jitter;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400 * jitter, now);
    bp.frequency.exponentialRampToValueAtTime(180, now + 0.052);
    bp.Q.value = 0.85;
    const wg = this.ctx.createGain();
    wg.gain.value = 0.025 * amp;
    whoosh.connect(bp);
    bp.connect(wg);
    wg.connect(this.sfxGain);
    whoosh.start(now);

    if (this.chiffBuf) {
      const quill = this.ctx.createBufferSource();
      quill.buffer = this.chiffBuf;
      quill.playbackRate.value = 0.82 * jitter;
      const qbp = this.ctx.createBiquadFilter();
      qbp.type = 'bandpass';
      qbp.frequency.setValueAtTime(1950 * jitter, now + 0.004);
      qbp.frequency.exponentialRampToValueAtTime(1220, now + 0.022);
      qbp.Q.value = 1.2;
      const qg = this.ctx.createGain();
      qg.gain.value = 0.008 * amp;
      quill.connect(qbp);
      qbp.connect(qg);
      qg.connect(this.sfxGain);
      quill.start(now + 0.004);
    }
  }

  public playSparrowHop(
    surface: 'stone' | 'wood' | 'foliage' | 'metal' | 'water' | 'fabric' = 'stone'
  ) {
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    if (surface === 'water') {
      this.playWaterPlop();
      return;
    }
    const now = this.ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.12;
    const bodyPitch =
      surface === 'wood'
        ? 230
        : surface === 'metal'
          ? 680
          : surface === 'fabric'
            ? 140
            : surface === 'foliage'
              ? 290
              : 380;

    for (let tap = 0; tap < 2; tap++) {
      const t0 = now + tap * 0.026;
      const ampScale = tap === 0 ? 0.72 : 1.0;
      const bodyOsc = this.ctx.createOscillator();
      bodyOsc.type = surface === 'metal' ? 'sine' : 'triangle';
      bodyOsc.frequency.setValueAtTime(bodyPitch * jitter * (tap === 1 ? 1.08 : 1.0), t0);
      bodyOsc.frequency.exponentialRampToValueAtTime(bodyPitch * 0.44, t0 + 0.042);
      const bg = this.ctx.createGain();
      bg.gain.setValueAtTime(0.065 * ampScale, t0);
      bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.048);
      bodyOsc.connect(bg);
      bg.connect(this.sfxGain);
      bodyOsc.start(t0);
      bodyOsc.stop(t0 + 0.055);
    }
  }

  public playWaterPlop() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    const jitter = 0.92 + Math.random() * 0.16;

    if (this.waterBuf) {
      const slap = this.ctx.createBufferSource();
      slap.buffer = this.waterBuf;
      slap.playbackRate.value = 1.15 * jitter;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1750 * jitter, now);
      bp.frequency.exponentialRampToValueAtTime(840, now + 0.065);
      bp.Q.value = 1.3;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0.075, now);
      sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.072);
      slap.connect(bp);
      bp.connect(sg);
      sg.connect(this.sfxGain);
      slap.start(now);
    }

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(720 * jitter, now + 0.082);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(g);
    g.connect(this.sfxGain);
    if (this.reverbNode) g.connect(this.reverbNode);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCrumbEat() {
    this.init();
    if (!this.ctx || !this.sfxGain || !this.sfxEnabled || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Soft warm marimba-like double note
    [523.25, 783.99].forEach((f, idx) => {
      const t = now + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(g);
      g.connect(this.sfxGain!);
      if (this.reverbNode) g.connect(this.reverbNode);
      osc.start(t);
      osc.stop(t + 0.26);
    });
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
    this.zeybekPlaying = false;
    this.guitarJamTimers.forEach((t) => clearTimeout(t));
    this.guitarJamTimers = [];
    this.guitarJamPlaying = false;
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const audioEngine = new CozyAudioEngine();
