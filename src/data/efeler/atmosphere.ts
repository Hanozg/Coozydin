import { SeasonType, TimeOfDay, WeatherType } from '../../types/game';

export const SEASON_OPTIONS: { id: SeasonType; label: string }[] = [
  { id: 'spring', label: 'İlkbahar' },
  { id: 'summer', label: 'Yaz' },
  { id: 'autumn', label: 'Sonbahar' },
  { id: 'winter', label: 'Kış' },
];

export const WEATHER_OPTIONS: { id: WeatherType; label: string }[] = [
  { id: 'clear', label: 'Açık' },
  { id: 'rain', label: 'Yağmur' },
  { id: 'snow', label: 'Kar' },
  { id: 'storm', label: 'Fırtına' },
];

export interface LightingMood {
  label: string;
  skyColor: string;
  fogColor: string;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  lampOn: boolean;
  windowGlow: number;
}

export const TIME_MOODS: Record<TimeOfDay, LightingMood> = {
  morning: {
    label: 'Sabah',
    skyColor: '#E8DFCE',
    fogColor: '#E8DFCE',
    sunColor: '#FFE8BF',
    sunIntensity: 1.95,
    sunPosition: [68, 54, 42],
    hemiSky: '#DCE8EE',
    hemiGround: '#9C8362',
    hemiIntensity: 0.78,
    lampOn: false,
    windowGlow: 0.1,
  },
  noon: {
    label: 'Öğle',
    skyColor: '#DCE8EC',
    fogColor: '#DCE8EC',
    sunColor: '#FFF5DE',
    sunIntensity: 2.1,
    sunPosition: [44, 82, 34],
    hemiSky: '#DDF0FA',
    hemiGround: '#A98E6E',
    hemiIntensity: 0.82,
    lampOn: false,
    windowGlow: 0.06,
  },
  golden: {
    label: 'Altın Saat',
    skyColor: '#EAD0AA',
    fogColor: '#E8CC9F',
    sunColor: '#FFC985',
    sunIntensity: 2.2,
    sunPosition: [-72, 36, 48],
    hemiSky: '#FFF0D4',
    hemiGround: '#8B6846',
    hemiIntensity: 0.78,
    lampOn: true,
    windowGlow: 0.55,
  },
  evening: {
    label: 'Akşam',
    skyColor: '#25293B',
    fogColor: '#262A3C',
    sunColor: '#98B2DF',
    sunIntensity: 0.72,
    sunPosition: [-50, 58, -40],
    hemiSky: '#4B5B82',
    hemiGround: '#332820',
    hemiIntensity: 0.56,
    lampOn: true,
    windowGlow: 1.15,
  },
};

export const TIME_PHASE_ANCHORS: Record<TimeOfDay, number> = {
  morning: 0.0,
  noon: 0.28,
  golden: 0.58,
  evening: 0.82,
};

const SOLAR_KEYFRAMES: { phase: number; mood: LightingMood }[] = [
  { phase: 0.0, mood: TIME_MOODS.morning },
  { phase: 0.28, mood: TIME_MOODS.noon },
  { phase: 0.58, mood: TIME_MOODS.golden },
  { phase: 0.82, mood: TIME_MOODS.evening },
  { phase: 1.0, mood: TIME_MOODS.morning },
];

export function getTimeOfDayFromPhase(phase: number): TimeOfDay {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.14 || p >= 0.94) return 'morning';
  if (p < 0.44) return 'noon';
  if (p < 0.71) return 'golden';
  return 'evening';
}

export function getSolarClockLabel(phase: number): string {
  const p = ((phase % 1) + 1) % 1;
  const totalMinutes = Math.round((7 * 60 + p * 24 * 60) % (24 * 60));
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface SampledSolarMood {
  a: LightingMood;
  b: LightingMood;
  t: number;
  sunIntensity: number;
  hemiIntensity: number;
  windowGlow: number;
  lampLevel: number;
  sunPos: [number, number, number];
}

export function sampleSolarCurve(phase: number, out: SampledSolarMood): void {
  const p = ((phase % 1) + 1) % 1;
  let k0 = SOLAR_KEYFRAMES[0];
  let k1 = SOLAR_KEYFRAMES[1];
  for (let i = 0; i < SOLAR_KEYFRAMES.length - 1; i++) {
    if (p >= SOLAR_KEYFRAMES[i].phase && p <= SOLAR_KEYFRAMES[i + 1].phase) {
      k0 = SOLAR_KEYFRAMES[i];
      k1 = SOLAR_KEYFRAMES[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, k1.phase - k0.phase);
  const rawT = (p - k0.phase) / span;
  const t = rawT * rawT * (3 - 2 * rawT);

  out.a = k0.mood;
  out.b = k1.mood;
  out.t = t;
  out.sunIntensity = k0.mood.sunIntensity + (k1.mood.sunIntensity - k0.mood.sunIntensity) * t;
  out.hemiIntensity = k0.mood.hemiIntensity + (k1.mood.hemiIntensity - k0.mood.hemiIntensity) * t;
  out.windowGlow = k0.mood.windowGlow + (k1.mood.windowGlow - k0.mood.windowGlow) * t;
  const lamp0 = k0.mood.lampOn ? 1 : 0;
  const lamp1 = k1.mood.lampOn ? 1 : 0;
  out.lampLevel = lamp0 + (lamp1 - lamp0) * t;
  out.sunPos[0] = k0.mood.sunPosition[0] + (k1.mood.sunPosition[0] - k0.mood.sunPosition[0]) * t;
  out.sunPos[1] = k0.mood.sunPosition[1] + (k1.mood.sunPosition[1] - k0.mood.sunPosition[1]) * t;
  out.sunPos[2] = k0.mood.sunPosition[2] + (k1.mood.sunPosition[2] - k0.mood.sunPosition[2]) * t;
}

export function pickAutoWeatherForCycle(phase: number, season: SeasonType, roll: number): WeatherType {
  const p = ((phase % 1) + 1) % 1;
  if (season === 'winter') {
    if (roll < 0.48) return 'snow';
    if (roll < 0.68 && p > 0.65) return 'storm';
    return 'clear';
  }
  if (season === 'autumn') {
    if (roll < 0.36) return 'rain';
    if (roll < 0.5 && p > 0.52) return 'storm';
    return 'clear';
  }
  if (season === 'spring') {
    if (roll < 0.28 && p > 0.2 && p < 0.72) return 'rain';
    return 'clear';
  }
  if (roll < 0.14 && p > 0.35 && p < 0.62) return 'rain';
  return 'clear';
}
