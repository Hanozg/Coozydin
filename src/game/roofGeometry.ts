import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Builds a pitched 2-slope gable roof geometry centered at (0, 0, 0) on XZ
 * with base at y = 0 and ridge at y = peakHeight running along the X axis.
 */
export function createGableRoofGeometry(
  width: number,
  depth: number,
  peakHeight: number
): THREE.BufferGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const h = peakHeight;

  const positions: number[] = [
    // South slope (+Z)
    -hw, 0, hd,
    hw, 0, hd,
    hw, h, 0,

    -hw, 0, hd,
    hw, h, 0,
    -hw, h, 0,

    // North slope (-Z)
    hw, 0, -hd,
    -hw, 0, -hd,
    -hw, h, 0,

    hw, 0, -hd,
    -hw, h, 0,
    hw, h, 0,

    // West gable (-X)
    -hw, 0, -hd,
    -hw, 0, hd,
    -hw, h, 0,

    // East gable (+X)
    hw, 0, hd,
    hw, 0, -hd,
    hw, h, 0,
  ];

  const slopeLen = Math.hypot(hd, h);
  const uW = width * 0.22;
  const vS = slopeLen * 0.25;

  const uvs: number[] = [
    0, 0, uW, 0, uW, vS,
    0, 0, uW, vS, 0, vS,
    0, 0, uW, 0, uW, vS,
    0, 0, uW, vS, 0, vS,
    0, 0, depth * 0.2, 0, depth * 0.1, h * 0.2,
    0, 0, depth * 0.2, 0, depth * 0.1, h * 0.2,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a wall-plaster triangular prism filling the attic gable cleanly under an overhanging roof.
 * When ridgeAlongZ is true, the gable triangles face +Z and -Z (street-facing gable!).
 */
export function createGableWallPrismGeometry(
  width: number,
  depth: number,
  peakHeight: number,
  ridgeAlongZ = false
): THREE.BufferGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const h = peakHeight;

  const positions: number[] = ridgeAlongZ
    ? [
        // Front gable (+Z)
        -hw, 0, hd,
        hw, 0, hd,
        0, h, hd,
        // Back gable (-Z)
        hw, 0, -hd,
        -hw, 0, -hd,
        0, h, -hd,
        // East slope cap
        hw, 0, hd,
        hw, 0, -hd,
        0, h, -hd,
        hw, 0, hd,
        0, h, -hd,
        0, h, hd,
        // West slope cap
        -hw, 0, -hd,
        -hw, 0, hd,
        0, h, hd,
        -hw, 0, -hd,
        0, h, hd,
        0, h, -hd,
      ]
    : [
        // West gable (-X)
        -hw, 0, -hd,
        -hw, 0, hd,
        -hw, h, 0,
        // East gable (+X)
        hw, 0, hd,
        hw, 0, -hd,
        hw, h, 0,
        // South slope cap
        -hw, 0, hd,
        hw, 0, hd,
        hw, h, 0,
        -hw, 0, hd,
        hw, h, 0,
        -hw, h, 0,
        // North slope cap
        hw, 0, -hd,
        -hw, 0, -hd,
        -hw, h, 0,
        hw, 0, -hd,
        -hw, h, 0,
        hw, h, 0,
      ];

  const uvs = new Array((positions.length / 3) * 2).fill(0).map((_, i) => (i % 2 === 0 ? 0.5 : 0.5));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Thick overhanging pitched roof slabs (extruded slopes with clean eaves) for diorama houses.
 * Ridge runs along Z when ridgeAlongZ is true, otherwise along X.
 */
export function createDioramaRoofSlabsGeometry(
  width: number,
  depth: number,
  peakHeight: number,
  thickness = 0.16,
  ridgeAlongZ = false
): THREE.BufferGeometry {
  const halfSpan = (ridgeAlongZ ? width : depth) / 2;
  const runLen = ridgeAlongZ ? depth : width;
  const slopeLen = Math.hypot(halfSpan, peakHeight) + 0.14;
  const angle = Math.atan2(peakHeight, halfSpan);

  const parts: THREE.BufferGeometry[] = [];
  [-1, 1].forEach((side) => {
    const slab = ridgeAlongZ
      ? new THREE.BoxGeometry(slopeLen, thickness, runLen)
      : new THREE.BoxGeometry(runLen, thickness, slopeLen);
    if (ridgeAlongZ) {
      slab.rotateZ(side < 0 ? angle : -angle);
      slab.translate(side * (halfSpan / 2), peakHeight / 2 + thickness * 0.35, 0);
    } else {
      slab.rotateX(side < 0 ? -angle : angle);
      slab.translate(0, peakHeight / 2 + thickness * 0.35, side * (halfSpan / 2));
    }
    parts.push(slab);
  });

  // Crisp ridge cap along apex
  const ridgeCap = ridgeAlongZ
    ? new THREE.BoxGeometry(0.28, thickness * 1.1, runLen + 0.06)
    : new THREE.BoxGeometry(runLen + 0.06, thickness * 1.1, 0.28);
  ridgeCap.translate(0, peakHeight + thickness * 0.42, 0);
  parts.push(ridgeCap);

  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Thick crisp white/cream gable bargeboard trim (alın tahtası) framing the roof overhang on both gable ends.
 */
export function createGableBargeboardGeometry(
  width: number,
  depth: number,
  peakHeight: number,
  thickness = 0.18,
  ridgeAlongZ = false
): THREE.BufferGeometry {
  const halfSpan = (ridgeAlongZ ? width : depth) / 2;
  const endOffset = (ridgeAlongZ ? depth : width) / 2 - 0.05;
  const slopeLen = Math.hypot(halfSpan, peakHeight) + 0.14;
  const angle = Math.atan2(peakHeight, halfSpan);

  const parts: THREE.BufferGeometry[] = [];
  [-1, 1].forEach((endSide) => {
    [-1, 1].forEach((slopeSide) => {
      const board = ridgeAlongZ
        ? new THREE.BoxGeometry(slopeLen, thickness * 1.12, 0.14)
        : new THREE.BoxGeometry(0.14, thickness * 1.12, slopeLen);
      if (ridgeAlongZ) {
        board.rotateZ(slopeSide < 0 ? angle : -angle);
        board.translate(
          slopeSide * (halfSpan / 2),
          peakHeight / 2 + thickness * 0.3,
          endSide * endOffset
        );
      } else {
        board.rotateX(slopeSide < 0 ? -angle : angle);
        board.translate(
          endSide * endOffset,
          peakHeight / 2 + thickness * 0.3,
          slopeSide * (halfSpan / 2)
        );
      }
      parts.push(board);
    });
  });

  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Builds a pitched 4-slope hipped roof (kırma çatı) centered at (0, 0, 0) on XZ
 * with base at y = 0 and ridge at y = peakHeight.
 */
export function createHipRoofGeometry(
  width: number,
  depth: number,
  peakHeight: number
): THREE.BufferGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const h = peakHeight;

  const ridgeAlongX = width >= depth;
  const ridgeHalf = ridgeAlongX
    ? Math.max(0.2, hw - hd * 0.65)
    : Math.max(0.2, hd - hw * 0.65);

  const rx1 = ridgeAlongX ? -ridgeHalf : 0;
  const rz1 = ridgeAlongX ? 0 : -ridgeHalf;
  const rx2 = ridgeAlongX ? ridgeHalf : 0;
  const rz2 = ridgeAlongX ? 0 : ridgeHalf;

  const positions: number[] = [];
  const uvs: number[] = [];

  const pushTri = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    uA: number, vA: number,
    uB: number, vB: number,
    uC: number, vC: number
  ) => {
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    uvs.push(uA, vA, uB, vB, uC, vC);
  };

  if (ridgeAlongX) {
    pushTri(-hw, 0, hd, hw, 0, hd, rx2, h, 0, 0, 0, width * 0.22, 0, (hw + rx2) * 0.22, 1);
    pushTri(-hw, 0, hd, rx2, h, 0, rx1, h, 0, 0, 0, (hw + rx2) * 0.22, 1, (hw + rx1) * 0.22, 1);
    pushTri(hw, 0, -hd, -hw, 0, -hd, rx1, h, 0, 0, 0, width * 0.22, 0, (hw - rx1) * 0.22, 1);
    pushTri(hw, 0, -hd, rx1, h, 0, rx2, h, 0, 0, 0, (hw - rx1) * 0.22, 1, (hw - rx2) * 0.22, 1);
    pushTri(-hw, 0, -hd, -hw, 0, hd, rx1, h, 0, 0, 0, depth * 0.22, 0, hd * 0.22, 1);
    pushTri(hw, 0, hd, hw, 0, -hd, rx2, h, 0, 0, 0, depth * 0.22, 0, hd * 0.22, 1);
  } else {
    pushTri(hw, 0, hd, hw, 0, -hd, 0, h, rz1, 0, 0, depth * 0.22, 0, (hd - rz1) * 0.22, 1);
    pushTri(hw, 0, hd, 0, h, rz1, 0, h, rz2, 0, 0, (hd - rz1) * 0.22, 1, (hd - rz2) * 0.22, 1);
    pushTri(-hw, 0, -hd, -hw, 0, hd, 0, h, rz2, 0, 0, depth * 0.22, 0, (hd + rz2) * 0.22, 1);
    pushTri(-hw, 0, -hd, 0, h, rz2, 0, h, rz1, 0, 0, (hd + rz2) * 0.22, 1, (hd + rz1) * 0.22, 1);
    pushTri(-hw, 0, hd, hw, 0, hd, 0, h, rz2, 0, 0, width * 0.22, 0, hw * 0.22, 1);
    pushTri(hw, 0, -hd, -hw, 0, -hd, 0, h, rz1, 0, 0, width * 0.22, 0, hw * 0.22, 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
