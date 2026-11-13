import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface CityMaterialLibrary {
  asphalt: THREE.MeshStandardMaterial;
  roadStripe: THREE.MeshStandardMaterial;
  cobble: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  plaza: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  travertine: THREE.MeshStandardMaterial;
  almasik: THREE.MeshStandardMaterial;
  industrialBrick: THREE.MeshStandardMaterial;
  terracottaRoof: THREE.MeshStandardMaterial;
  leadDome: THREE.MeshStandardMaterial;
  whitePlaster: THREE.MeshStandardMaterial;
  creamPlaster: THREE.MeshStandardMaterial;
  peachPlaster: THREE.MeshStandardMaterial;
  mustardYellow: THREE.MeshStandardMaterial;
  darkTimber: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  wroughtIron: THREE.MeshStandardMaterial;
  water: THREE.MeshPhysicalMaterial;
  glassAtrium: THREE.MeshPhysicalMaterial;
  windowLit: THREE.MeshStandardMaterial;
  lampBulb: THREE.MeshStandardMaterial;
  railSteel: THREE.MeshStandardMaterial;
  signpostFace: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createCityMaterials(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): CityMaterialLibrary {
  const asphalt = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.88,
    metalness: 0.04,
  });

  const roadStripe = new THREE.MeshStandardMaterial({
    color: 0xe9dec8,
    roughness: 0.72,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const cobble = new THREE.MeshStandardMaterial({
    map: textures.cobblestone,
    roughness: 0.84,
    metalness: 0.05,
  });

  const sidewalk = new THREE.MeshStandardMaterial({
    color: 0xd6cab6,
    roughness: 0.86,
    metalness: 0.02,
  });

  const plaza = new THREE.MeshStandardMaterial({
    map: textures.plazaTile,
    roughness: 0.78,
    metalness: 0.05,
  });

  const ground = new THREE.MeshStandardMaterial({
    map: textures.grassGround,
    roughness: 0.94,
    metalness: 0.0,
  });

  const travertine = new THREE.MeshStandardMaterial({
    map: textures.travertine,
    roughness: 0.82,
    metalness: 0.04,
  });

  const almasik = new THREE.MeshStandardMaterial({
    map: textures.almasik,
    roughness: 0.84,
    metalness: 0.04,
  });

  const industrialBrick = new THREE.MeshStandardMaterial({
    map: textures.industrialBrick,
    roughness: 0.86,
    metalness: 0.04,
  });

  const terracottaRoof = new THREE.MeshStandardMaterial({
    map: textures.terracottaRoof,
    roughness: 0.78,
    metalness: 0.05,
  });

  const leadDome = new THREE.MeshStandardMaterial({
    color: 0x6f7b82,
    roughness: 0.36,
    metalness: 0.62,
  });

  const whitePlaster = new THREE.MeshStandardMaterial({
    color: 0xf0e7d8,
    roughness: 0.85,
    metalness: 0.02,
  });

  const creamPlaster = new THREE.MeshStandardMaterial({
    color: 0xe6d4b5,
    roughness: 0.83,
    metalness: 0.02,
  });

  const peachPlaster = new THREE.MeshStandardMaterial({
    color: 0xdfb99b,
    roughness: 0.83,
    metalness: 0.02,
  });

  const mustardYellow = new THREE.MeshStandardMaterial({
    color: 0xdda83c,
    roughness: 0.78,
    metalness: 0.04,
  });

  const darkTimber = new THREE.MeshStandardMaterial({
    color: 0x5c3d28,
    roughness: 0.76,
    metalness: 0.04,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd4a857,
    roughness: 0.25,
    metalness: 0.88,
  });

  const wroughtIron = new THREE.MeshStandardMaterial({
    color: 0x2b2f33,
    roughness: 0.42,
    metalness: 0.72,
  });

  const water = new THREE.MeshPhysicalMaterial({
    color: 0x4ba3b3,
    roughness: 0.08,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.65,
    transparent: true,
    opacity: isSoftwareGl ? 0.78 : 0.92,
    ior: 1.33,
    thickness: 0.6,
  });

  const glassAtrium = new THREE.MeshPhysicalMaterial({
    color: 0xb7dce8,
    roughness: 0.1,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.65,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.82,
    ior: 1.48,
  });

  const windowLit = new THREE.MeshStandardMaterial({
    color: 0x3b4d5e,
    emissive: new THREE.Color(0xffbe66),
    emissiveIntensity: 0.08,
    roughness: 0.22,
    metalness: 0.15,
  });

  const lampBulb = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: new THREE.Color(0xffbd59),
    emissiveIntensity: 0.1,
    roughness: 0.2,
    metalness: 0.0,
  });

  const railSteel = new THREE.MeshStandardMaterial({
    color: 0x6c737a,
    roughness: 0.35,
    metalness: 0.85,
  });

  const signpostFace = new THREE.MeshStandardMaterial({
    map: textures.ancientSignpost,
    roughness: 0.65,
    metalness: 0.05,
  });

  const all = [
    asphalt,
    roadStripe,
    cobble,
    sidewalk,
    plaza,
    ground,
    travertine,
    almasik,
    industrialBrick,
    terracottaRoof,
    leadDome,
    whitePlaster,
    creamPlaster,
    peachPlaster,
    mustardYellow,
    darkTimber,
    brass,
    wroughtIron,
    water,
    glassAtrium,
    windowLit,
    lampBulb,
    railSteel,
    signpostFace,
  ];

  return {
    asphalt,
    roadStripe,
    cobble,
    sidewalk,
    plaza,
    ground,
    travertine,
    almasik,
    industrialBrick,
    terracottaRoof,
    leadDome,
    whitePlaster,
    creamPlaster,
    peachPlaster,
    mustardYellow,
    darkTimber,
    brass,
    wroughtIron,
    water,
    glassAtrium,
    windowLit,
    lampBulb,
    railSteel,
    signpostFace,
    dispose: () => {
      all.forEach((m) => m.dispose());
    },
  };
}
