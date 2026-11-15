import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { getTerrainHeightAt, getWalkableSurfaceHeightAt } from '../terrain';

export interface BuiltLandmark {
  def: LandmarkDef;
  group: THREE.Group;
  ringMesh: THREE.Mesh;
  colliders: ColliderBox[];
}

export type LandmarkBuilder = (
  def: LandmarkDef,
  mats: CityMaterialLibrary
) => BuiltLandmark;

export function addBoxCollider(
  list: ColliderBox[],
  cx: number,
  cz: number,
  w: number,
  d: number,
  topH?: number
) {
  list.push({
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    maxY: topH !== undefined ? getTerrainHeightAt(cx, cz) + topH : undefined,
  });
}

export function makeDiscoveryRing(x: number, z: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(1.6, 2.05, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe3a84f,
    emissive: new THREE.Color(0xe3a84f),
    emissiveIntensity: 0.65,
    roughness: 0.3,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, getWalkableSurfaceHeightAt(x, z) + 0.08, z);
  return mesh;
}

export function createTurkishFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 212;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d61c26';
  ctx.fillRect(0, 0, 320, 212);

  // Subtle fabric fold shading
  const shade = ctx.createLinearGradient(0, 0, 320, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.08)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0.08)');
  shade.addColorStop(0.7, 'rgba(0,0,0,0.10)');
  shade.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 320, 212);

  // White Crescent
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(118, 106, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d61c26';
  ctx.beginPath();
  ctx.arc(131, 106, 38, 0, Math.PI * 2);
  ctx.fill();

  // White 5-Point Star
  ctx.fillStyle = '#ffffff';
  ctx.save();
  ctx.translate(182, 106);
  ctx.rotate(-Math.PI / 10);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? 22 : 9;
    const a = (i * Math.PI) / 5;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStoreSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  fgHex: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 144);

  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 130, 512, 14);

  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(title, 256, subtitle ? 60 : 74);

  if (subtitle) {
    ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText(subtitle, 256, 105);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
