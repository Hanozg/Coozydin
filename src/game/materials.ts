import * as THREE from 'three';
import { ProceduralTextureSet } from './textures';

export interface CityMaterialLibrary {
  asphalt: THREE.MeshStandardMaterial;
  roadStripe: THREE.MeshStandardMaterial;
  cobble: THREE.MeshStandardMaterial;
  sidewalk: THREE.MeshStandardMaterial;
  plaza: THREE.MeshStandardMaterial;
  dirtPath: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  wheatField: THREE.MeshStandardMaterial;
  lavenderField: THREE.MeshStandardMaterial;
  travertine: THREE.MeshStandardMaterial;
  almasik: THREE.MeshStandardMaterial;
  industrialBrick: THREE.MeshStandardMaterial;
  terracottaRoof: THREE.MeshStandardMaterial;
  terracottaRidge: THREE.MeshStandardMaterial;
  slateRoof: THREE.MeshStandardMaterial;
  aegeanBlueRoof: THREE.MeshStandardMaterial;
  leadDome: THREE.MeshStandardMaterial;
  whitePlaster: THREE.MeshStandardMaterial;
  creamPlaster: THREE.MeshStandardMaterial;
  peachPlaster: THREE.MeshStandardMaterial;
  terracottaPlaster: THREE.MeshStandardMaterial;
  sagePlaster: THREE.MeshStandardMaterial;
  skyBluePlaster: THREE.MeshStandardMaterial;
  ochrePlaster: THREE.MeshStandardMaterial;
  mustardYellow: THREE.MeshStandardMaterial;
  darkTimber: THREE.MeshStandardMaterial;
  shutterWood: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  wroughtIron: THREE.MeshStandardMaterial;
  water: THREE.MeshPhysicalMaterial;
  glassAtrium: THREE.MeshPhysicalMaterial;
  windowLit: THREE.MeshStandardMaterial;
  lampBulb: THREE.MeshStandardMaterial;
  railSteel: THREE.MeshStandardMaterial;
  signpostFace: THREE.MeshStandardMaterial;
  stripedAwningMap: THREE.CanvasTexture;
  dispose: () => void;
}

export function createCityMaterials(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): CityMaterialLibrary {
  const asphalt = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.88,
    metalness: 0.03,
  });

  const roadStripe = new THREE.MeshStandardMaterial({
    color: 0xf6eedc,
    roughness: 0.72,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const cobble = new THREE.MeshStandardMaterial({
    map: textures.cobblestone,
    roughness: 0.84,
    metalness: 0.04,
  });

  const sidewalk = new THREE.MeshStandardMaterial({
    color: 0xe6dac4,
    roughness: 0.84,
    metalness: 0.02,
  });

  const plaza = new THREE.MeshStandardMaterial({
    map: textures.plazaTile,
    roughness: 0.78,
    metalness: 0.04,
  });

  const dirtPath = new THREE.MeshStandardMaterial({
    map: textures.dirtPath,
    roughness: 0.92,
    metalness: 0.0,
  });

  const ground = new THREE.MeshStandardMaterial({
    map: textures.grassGround,
    roughness: 0.94,
    metalness: 0.0,
  });

  const wheatField = new THREE.MeshStandardMaterial({
    map: textures.wheatField,
    roughness: 0.92,
    metalness: 0.0,
  });

  const lavenderField = new THREE.MeshStandardMaterial({
    map: textures.lavenderField,
    roughness: 0.92,
    metalness: 0.0,
  });

  const travertine = new THREE.MeshStandardMaterial({
    map: textures.travertine,
    roughness: 0.8,
    metalness: 0.04,
  });

  const almasik = new THREE.MeshStandardMaterial({
    map: textures.almasik,
    roughness: 0.82,
    metalness: 0.04,
  });

  const industrialBrick = new THREE.MeshStandardMaterial({
    map: textures.industrialBrick,
    roughness: 0.84,
    metalness: 0.04,
  });

  const terracottaRoof = new THREE.MeshStandardMaterial({
    map: textures.terracottaRoof,
    roughness: 0.74,
    metalness: 0.04,
  });

  const terracottaRidge = new THREE.MeshStandardMaterial({
    color: 0xb64c2e,
    roughness: 0.76,
    metalness: 0.04,
  });

  const slateRoof = new THREE.MeshStandardMaterial({
    map: textures.slateRoof,
    roughness: 0.66,
    metalness: 0.16,
  });

  const aegeanBlueRoof = new THREE.MeshStandardMaterial({
    map: textures.aegeanBlueRoof,
    roughness: 0.62,
    metalness: 0.06,
  });

  const leadDome = new THREE.MeshStandardMaterial({
    color: 0x6a7c87,
    roughness: 0.36,
    metalness: 0.58,
  });

  const whitePlaster = new THREE.MeshStandardMaterial({
    color: 0xf9f1e4,
    map: textures.stuccoGrain,
    roughness: 0.84,
    metalness: 0.02,
  });

  const creamPlaster = new THREE.MeshStandardMaterial({
    color: 0xefe0be,
    map: textures.stuccoGrain,
    roughness: 0.82,
    metalness: 0.02,
  });

  const peachPlaster = new THREE.MeshStandardMaterial({
    color: 0xebb796,
    map: textures.stuccoGrain,
    roughness: 0.82,
    metalness: 0.02,
  });

  const terracottaPlaster = new THREE.MeshStandardMaterial({
    color: 0xdc8868,
    map: textures.stuccoGrain,
    roughness: 0.82,
    metalness: 0.02,
  });

  const sagePlaster = new THREE.MeshStandardMaterial({
    color: 0xbcca9f,
    map: textures.stuccoGrain,
    roughness: 0.84,
    metalness: 0.02,
  });

  const skyBluePlaster = new THREE.MeshStandardMaterial({
    color: 0x9ab9c9,
    map: textures.stuccoGrain,
    roughness: 0.82,
    metalness: 0.02,
  });

  const ochrePlaster = new THREE.MeshStandardMaterial({
    color: 0xe6bb6a,
    map: textures.stuccoGrain,
    roughness: 0.8,
    metalness: 0.03,
  });

  const mustardYellow = new THREE.MeshStandardMaterial({
    color: 0xe5b044,
    map: textures.stuccoGrain,
    roughness: 0.76,
    metalness: 0.04,
  });

  const darkTimber = new THREE.MeshStandardMaterial({
    color: 0x64432a,
    roughness: 0.74,
    metalness: 0.04,
  });

  const shutterWood = new THREE.MeshStandardMaterial({
    color: 0x5c7863,
    roughness: 0.76,
    metalness: 0.03,
  });

  const brass = new THREE.MeshStandardMaterial({
    color: 0xd9ac59,
    roughness: 0.26,
    metalness: 0.86,
  });

  const wroughtIron = new THREE.MeshStandardMaterial({
    color: 0x35322e,
    roughness: 0.44,
    metalness: 0.68,
  });

  const water = new THREE.MeshPhysicalMaterial({
    color: 0x579ea8,
    roughness: 0.09,
    metalness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.62,
    transparent: true,
    opacity: isSoftwareGl ? 0.84 : 0.92,
    ior: 1.33,
    thickness: 0.65,
  });

  const glassAtrium = new THREE.MeshPhysicalMaterial({
    color: 0xc2e2ec,
    roughness: 0.1,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.65,
    transparent: true,
    opacity: isSoftwareGl ? 0.58 : 0.84,
    ior: 1.48,
  });

  const windowLit = new THREE.MeshStandardMaterial({
    color: 0x3f4e5c,
    emissive: new THREE.Color(0xffc670),
    emissiveIntensity: 0.14,
    roughness: 0.22,
    metalness: 0.14,
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
    dirtPath,
    ground,
    wheatField,
    lavenderField,
    travertine,
    almasik,
    industrialBrick,
    terracottaRoof,
    terracottaRidge,
    slateRoof,
    aegeanBlueRoof,
    leadDome,
    whitePlaster,
    creamPlaster,
    peachPlaster,
    terracottaPlaster,
    sagePlaster,
    skyBluePlaster,
    ochrePlaster,
    mustardYellow,
    darkTimber,
    shutterWood,
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
    dirtPath,
    ground,
    wheatField,
    lavenderField,
    travertine,
    almasik,
    industrialBrick,
    terracottaRoof,
    terracottaRidge,
    slateRoof,
    aegeanBlueRoof,
    leadDome,
    whitePlaster,
    creamPlaster,
    peachPlaster,
    terracottaPlaster,
    sagePlaster,
    skyBluePlaster,
    ochrePlaster,
    mustardYellow,
    darkTimber,
    shutterWood,
    brass,
    wroughtIron,
    water,
    glassAtrium,
    windowLit,
    lampBulb,
    railSteel,
    signpostFace,
    stripedAwningMap: textures.stripedAwning,
    dispose: () => {
      all.forEach((m) => m.dispose());
    },
  };
}
