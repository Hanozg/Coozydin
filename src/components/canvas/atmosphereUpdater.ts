import { type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  getTimeOfDayFromPhase,
  pickAutoWeatherForCycle,
  SampledSolarMood,
  sampleSolarCurve,
  TIME_MOODS,
  TIME_PHASE_ANCHORS,
} from '../../data/efelerData';
import { CityMaterialLibrary } from '../../game/materials';
import { VehicleRig } from '../../game/vehicles';
import { GamePhase, SeasonType, TimeOfDay, WeatherType } from '../../types/game';

const _targetSky = new THREE.Color();
const _targetSkyB = new THREE.Color();
const _targetSun = new THREE.Color();
const _targetSunB = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiSkyB = new THREE.Color();
const _targetHemiGround = new THREE.Color();
const _targetHemiGroundB = new THREE.Color();
const _targetRim = new THREE.Color();
const _stormTint = new THREE.Color(0x3a4354);
const _rainTint = new THREE.Color(0x6c7c8e);
const _snowTint = new THREE.Color(0xdde6ef);
const _lightningTint = new THREE.Color(0xdbe8ff);
const _dayRimColor = new THREE.Color(0xfff1dc);
const _goldenRimColor = new THREE.Color(0xffcfa0);
const _nightRimColor = new THREE.Color(0x7c9ad4);

export interface AtmosphereRuntimeState {
  solarPhase: number;
  sampledSolar: SampledSolarMood;
  weatherWeights: {
    clear: number;
    rain: number;
    snow: number;
    storm: number;
  };
  frostFactor: number;
  wetFactor: number;
  autoWeatherTimer: number;
  lightningTimer: number;
  lightningFlash: number;
}

export function createAtmosphereRuntimeState(
  initialTod: TimeOfDay,
  initialSeason: SeasonType,
  initialWeather: WeatherType
): AtmosphereRuntimeState {
  return {
    solarPhase: TIME_PHASE_ANCHORS[initialTod],
    sampledSolar: {
      a: TIME_MOODS.golden,
      b: TIME_MOODS.golden,
      t: 0,
      sunIntensity: 2.0,
      hemiIntensity: 0.78,
      windowGlow: 0.4,
      lampLevel: 0.5,
      sunPos: [0, 50, 40],
    },
    weatherWeights: {
      clear: initialWeather === 'clear' ? 1 : 0,
      rain: initialWeather === 'rain' ? 1 : 0,
      snow: initialWeather === 'snow' ? 1 : 0,
      storm: initialWeather === 'storm' ? 1 : 0,
    },
    frostFactor: initialSeason === 'winter' || initialWeather === 'snow' ? 0.85 : 0,
    wetFactor: initialWeather === 'rain' || initialWeather === 'storm' ? 0.8 : 0,
    autoWeatherTimer: 34,
    lightningTimer: 4.2,
    lightningFlash: 0,
  };
}

export interface AtmosphereUpdateParams {
  dt: number;
  state: AtmosphereRuntimeState;
  phase: GamePhase;
  season: SeasonType;
  weather: WeatherType;
  autoAtmosphere: boolean;
  manualTargetPhaseRef: MutableRefObject<number | null>;
  lastAutoSyncedTodRef: MutableRefObject<TimeOfDay>;
  onAutoTimeSync?: (nextTod: TimeOfDay) => void;
  onAutoWeatherSync?: (nextWeather: WeatherType) => void;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  rimLight: THREE.DirectionalLight;
  mats: CityMaterialLibrary;
  vehicleRig: VehicleRig;
}

export function updateAtmosphereAndLighting(params: AtmosphereUpdateParams): {
  frostFactor: number;
  wetFactor: number;
  windStrength: number;
  goldenWarmth: number;
  nightMix: number;
} {
  const {
    dt,
    state,
    phase,
    season,
    weather,
    autoAtmosphere,
    manualTargetPhaseRef,
    lastAutoSyncedTodRef,
    onAutoTimeSync,
    onAutoWeatherSync,
    scene,
    renderer,
    sunLight,
    hemiLight,
    rimLight,
    mats,
    vehicleRig,
  } = params;

  // 1. Continuous Solar Clock Progression (Auto-Cycle or Smooth Manual Glide)
  if (manualTargetPhaseRef.current !== null) {
    const targetP = manualTargetPhaseRef.current;
    let diff = targetP - state.solarPhase;
    if (diff > 0.6) diff -= 1;
    if (diff < -0.6) diff += 1;
    if (Math.abs(diff) < 0.004) {
      state.solarPhase = targetP;
      manualTargetPhaseRef.current = null;
    } else {
      state.solarPhase = ((state.solarPhase + diff * Math.min(1, dt * 1.65)) % 1 + 1) % 1;
    }
  } else if (autoAtmosphere && phase === 'playing') {
    state.solarPhase = (state.solarPhase + dt * 0.0042) % 1;
    const bucket = getTimeOfDayFromPhase(state.solarPhase);
    if (bucket !== lastAutoSyncedTodRef.current) {
      lastAutoSyncedTodRef.current = bucket;
      onAutoTimeSync?.(bucket);
    }
  }

  sampleSolarCurve(state.solarPhase, state.sampledSolar);

  // 2. Gradual Multi-Second Weather Crossfade & Auto Weather Drift
  if (autoAtmosphere && phase === 'playing') {
    state.autoWeatherTimer -= dt;
    if (state.autoWeatherTimer <= 0) {
      state.autoWeatherTimer = 36 + Math.random() * 24;
      const candidate = pickAutoWeatherForCycle(state.solarPhase, season, Math.random());
      if (candidate !== weather) {
        onAutoWeatherSync?.(candidate);
      }
    }
  }

  const wFadeRate = Math.min(1, dt * 0.28);
  state.weatherWeights.clear = THREE.MathUtils.lerp(
    state.weatherWeights.clear,
    weather === 'clear' ? 1 : 0,
    wFadeRate
  );
  state.weatherWeights.rain = THREE.MathUtils.lerp(
    state.weatherWeights.rain,
    weather === 'rain' ? 1 : 0,
    wFadeRate
  );
  state.weatherWeights.snow = THREE.MathUtils.lerp(
    state.weatherWeights.snow,
    weather === 'snow' ? 1 : 0,
    wFadeRate
  );
  state.weatherWeights.storm = THREE.MathUtils.lerp(
    state.weatherWeights.storm,
    weather === 'storm' ? 1 : 0,
    wFadeRate
  );

  const targetFrost =
    season === 'winter'
      ? Math.max(0.76, state.weatherWeights.snow)
      : state.weatherWeights.snow * 0.92;
  state.frostFactor = THREE.MathUtils.damp(state.frostFactor, targetFrost, 0.35, dt);

  const targetWet = Math.min(1, state.weatherWeights.rain + state.weatherWeights.storm * 1.15);
  state.wetFactor = THREE.MathUtils.damp(state.wetFactor, targetWet, 0.45, dt);

  const windStrength =
    0.55 +
    state.weatherWeights.rain * 0.35 +
    state.weatherWeights.storm * 1.15 +
    state.weatherWeights.snow * 0.25;

  if (state.weatherWeights.storm > 0.35) {
    state.lightningTimer -= dt;
    if (state.lightningTimer <= 0) {
      state.lightningFlash = state.weatherWeights.storm;
      state.lightningTimer = 4.5 + Math.random() * 6.5;
    }
    state.lightningFlash = Math.max(0, state.lightningFlash - dt * 3.8);
  } else {
    state.lightningFlash = 0;
  }

  const sampledSolar = state.sampledSolar;
  _targetSky.set(sampledSolar.a.fogColor);
  _targetSkyB.set(sampledSolar.b.fogColor);
  _targetSky.lerp(_targetSkyB, sampledSolar.t);
  _targetSky.lerp(_stormTint, state.weatherWeights.storm * 0.68);
  _targetSky.lerp(_rainTint, state.weatherWeights.rain * 0.45);
  _targetSky.lerp(_snowTint, state.weatherWeights.snow * 0.35);
  if (state.lightningFlash > 0.02) {
    _targetSky.lerp(_lightningTint, state.lightningFlash * 0.55);
  }

  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.lerp(_targetSky, Math.min(1, dt * 2.6));
    const targetFogDensity =
      0.0026 +
      state.weatherWeights.storm * 0.0056 +
      state.weatherWeights.rain * 0.0032 +
      state.weatherWeights.snow * 0.0024;
    scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetFogDensity, 1.8, dt);
  }

  _targetSun.set(sampledSolar.a.sunColor);
  _targetSunB.set(sampledSolar.b.sunColor);
  _targetSun.lerp(_targetSunB, sampledSolar.t);
  _targetSun.lerp(_stormTint, state.weatherWeights.storm * 0.55);
  sunLight.color.lerp(_targetSun, Math.min(1, dt * 2.6));
  const weatherSunScale =
    1.0 -
    state.weatherWeights.storm * 0.45 -
    state.weatherWeights.rain * 0.28 -
    state.weatherWeights.snow * 0.15;
  sunLight.intensity = THREE.MathUtils.damp(
    sunLight.intensity,
    sampledSolar.sunIntensity * weatherSunScale + state.lightningFlash * 1.6,
    2.6,
    dt
  );

  _targetHemiSky.set(sampledSolar.a.hemiSky);
  _targetHemiSkyB.set(sampledSolar.b.hemiSky);
  _targetHemiSky.lerp(_targetHemiSkyB, sampledSolar.t);
  _targetHemiGround.set(sampledSolar.a.hemiGround);
  _targetHemiGroundB.set(sampledSolar.b.hemiGround);
  _targetHemiGround.lerp(_targetHemiGroundB, sampledSolar.t);
  hemiLight.color.lerp(_targetHemiSky, Math.min(1, dt * 2.6));
  hemiLight.groundColor.lerp(_targetHemiGround, Math.min(1, dt * 2.6));
  hemiLight.intensity = THREE.MathUtils.damp(
    hemiLight.intensity,
    sampledSolar.hemiIntensity,
    2.6,
    dt
  );

  const nightMix = THREE.MathUtils.clamp((sampledSolar.lampLevel - 0.35) / 0.65, 0, 1);
  const goldenWarmth = Math.max(0, 1 - Math.abs(state.solarPhase - 0.58) / 0.18);
  _targetRim
    .copy(_dayRimColor)
    .lerp(_goldenRimColor, goldenWarmth * 0.85)
    .lerp(_nightRimColor, nightMix * 0.9);
  rimLight.color.lerp(_targetRim, Math.min(1, dt * 2.6));
  rimLight.intensity = THREE.MathUtils.damp(
    rimLight.intensity,
    0.32 + goldenWarmth * 0.16 - nightMix * 0.14,
    2.6,
    dt
  );
  renderer.toneMappingExposure = THREE.MathUtils.damp(
    renderer.toneMappingExposure,
    1.18 - nightMix * 0.12 + goldenWarmth * 0.05,
    2.4,
    dt
  );

  const lampActiveLevel = Math.max(
    sampledSolar.lampLevel,
    state.weatherWeights.storm * 0.85 + state.weatherWeights.rain * 0.55
  );
  mats.windowLit.emissiveIntensity = THREE.MathUtils.damp(
    mats.windowLit.emissiveIntensity,
    Math.max(sampledSolar.windowGlow, lampActiveLevel * 0.72),
    3.0,
    dt
  );
  mats.lampBulb.emissiveIntensity = THREE.MathUtils.damp(
    mats.lampBulb.emissiveIntensity,
    0.08 + lampActiveLevel * 1.77,
    3.0,
    dt
  );
  vehicleRig.headlightGlowMeshes.forEach((hm) => {
    const mat = hm.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.25 + lampActiveLevel * 1.45;
  });

  return {
    frostFactor: state.frostFactor,
    wetFactor: state.wetFactor,
    windStrength,
    goldenWarmth,
    nightMix,
  };
}
