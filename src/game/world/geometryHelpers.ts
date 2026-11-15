import * as THREE from 'three';
import { RAIL_TRACK_Z, sampleNearestRoad } from '../../data/aydinRoads';
import { ColliderBox } from '../../types/game';
import { PerchSystem } from '../perchSystem';
import {
  getBaseTerrainHeight,
  getTabakhaneCenterX,
  getTabakhaneHalfWidth,
  getTerrainHeightAt,
} from '../terrain';

export function overlapsAny(
  x: number,
  z: number,
  w: number,
  d: number,
  existing: ColliderBox[],
  margin = 2.0
): boolean {
  const minX = x - w / 2 - margin;
  const maxX = x + w / 2 + margin;
  const minZ = z - d / 2 - margin;
  const maxZ = z + d / 2 + margin;
  for (const b of existing) {
    if (minX < b.maxX && maxX > b.minX && minZ < b.maxZ && maxZ > b.minZ) {
      return true;
    }
  }
  return false;
}

export function nearRoad(x: number, z: number, w: number, d: number): boolean {
  const sample = sampleNearestRoad(x, z, 12);
  if (sample.road && sample.dist < sample.road.width * 0.5 + Math.max(w, d) * 0.5 + 2.0) {
    return true;
  }
  if (Math.abs(x - getTabakhaneCenterX(z)) < w / 2 + getTabakhaneHalfWidth() + 2.2) {
    return true;
  }
  if (Math.abs(z - RAIL_TRACK_Z) < d / 2 + 2.5) {
    return true;
  }
  return false;
}

export function createTerrainConformingPatch(
  cx: number,
  cz: number,
  width: number,
  depth: number,
  segsX: number,
  segsZ: number,
  yOffset: number,
  useBase = true
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const wx = cx + pos.getX(i);
    const wz = cz + pos.getZ(i);
    const wy = (useBase ? getBaseTerrainHeight(wx, wz) : getTerrainHeightAt(wx, wz)) + yOffset;
    pos.setY(i, wy);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createStoneArchBridgeGeometry(depth = 0.54): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-6.2, 0);
  shape.lineTo(-2.75, 0);
  shape.absellipse(0, 0, 2.75, 1.38, Math.PI, 0, true, 0);
  shape.lineTo(6.2, 0);
  shape.lineTo(6.2, 1.85);
  shape.quadraticCurveTo(0, 2.99, -6.2, 1.85);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

export function createBridgeVaultSoffitGeometry(spanWidth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-5.8, 0);
  shape.lineTo(-2.75, 0);
  shape.absellipse(0, 0, 2.75, 1.38, Math.PI, 0, true, 0);
  shape.lineTo(5.8, 0);
  shape.lineTo(5.8, 1.04);
  shape.quadraticCurveTo(0, 2.2, -5.8, 1.04);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: spanWidth,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -spanWidth / 2);
  return geo;
}

export function registerHousePerches(
  perches: PerchSystem,
  idPrefix: string,
  cx: number,
  gy: number,
  cz: number,
  w: number,
  d: number,
  h: number,
  variant: number,
  rotY = 0
): number {
  const ridgeAlongZ = variant % 2 === 0;
  const peakH = Math.max(1.9, (ridgeAlongZ ? w : d) * 0.42 + (variant % 2) * 0.25);
  const ridgeY = gy + h + 0.22 + peakH + 0.14;
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const toWorld = (lx: number, wy: number, lz: number) =>
    new THREE.Vector3(cx + lx * cosR + lz * sinR, wy, cz - lx * sinR + lz * cosR);

  if (ridgeAlongZ) {
    perches.addStaticSegment(
      `${idPrefix}_ridge`,
      toWorld(0, ridgeY, -d * 0.48),
      toWorld(0, ridgeY, d * 0.48),
      0.16,
      'stone'
    );
  } else {
    perches.addStaticSegment(
      `${idPrefix}_ridge`,
      toWorld(-w * 0.48, ridgeY, 0),
      toWorld(w * 0.48, ridgeY, 0),
      0.16,
      'stone'
    );
  }

  // Front porch eave ridge perch
  const porchW = Math.min(w * 0.78, 4.4);
  const porchZ = d / 2 + 0.75;
  const porchY = gy + 0.54 + 2.15 + 0.85 + 0.12;
  perches.addStaticSegment(
    `${idPrefix}_porch`,
    toWorld(-porchW * 0.42, porchY, porchZ),
    toWorld(porchW * 0.42, porchY, porchZ),
    0.13,
    'wood'
  );
  return peakH;
}
