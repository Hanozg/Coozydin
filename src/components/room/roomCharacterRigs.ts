import * as THREE from 'three';
import {
  avatarConfigToAppearance,
  createSculptedHumanRig,
  SculptedHumanRig,
} from '../../game/sculptedHumans';
import { AvatarConfig, CozyRoomState } from '../../types/game';
import { FURNITURE_RADII, resolveFurnitureTransform } from './roomConstants';

export function createCatRig(): {
  group: THREE.Group;
  tail: THREE.Mesh;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0xd9904b, roughness: 0.78 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf4e7d3, roughness: 0.82 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.62), furMat);
  body.position.y = 0.24;
  body.castShadow = true;
  group.add(body);

  [
    [-0.13, 0.1, 0.21],
    [0.13, 0.1, 0.21],
    [-0.13, 0.1, -0.21],
    [0.13, 0.1, -0.21],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.09), furMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    group.add(leg);

    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.05, 0.11), creamMat);
    paw.position.set(lx, 0.025, lz + 0.012);
    group.add(paw);
  });

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.18), creamMat);
  chest.position.set(0, 0.22, 0.28);
  group.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), furMat);
  head.position.set(0, 0.45, 0.34);
  head.castShadow = true;
  group.add(head);

  const earGeo = new THREE.ConeGeometry(0.08, 0.16, 4);
  [-0.1, 0.1].forEach((ex) => {
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.position.set(ex, 0.64, 0.32);
    ear.rotation.y = Math.PI / 4;
    group.add(ear);
  });

  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), darkMat);
    eye.position.set(ex, 0.47, 0.5);
    group.add(eye);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.42, 8), furMat);
  tail.position.set(0, 0.42, -0.34);
  tail.rotation.x = -0.6;
  group.add(tail);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.9, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.4;
  hitMesh.userData.roomAction = 'pet-cat';
  group.add(hitMesh);

  return { group, tail, hitMesh };
}

export function createDogRig(): {
  group: THREE.Group;
  tail: THREE.Mesh;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0xc29864, roughness: 0.8 });
  const earMat = new THREE.MeshStandardMaterial({ color: 0x6f4a2e, roughness: 0.82 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xb64b36, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x221b17, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.78), furMat);
  body.position.y = 0.34;
  body.castShadow = true;
  group.add(body);

  [
    [-0.15, 0.14, 0.26],
    [0.15, 0.14, 0.26],
    [-0.15, 0.14, -0.26],
    [0.15, 0.14, -0.26],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.11), furMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.16), collarMat);
  collar.position.set(0, 0.44, 0.36);
  group.add(collar);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.38), furMat);
  head.position.set(0, 0.58, 0.46);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), furMat);
  snout.position.set(0, 0.52, 0.68);
  group.add(snout);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), darkMat);
  nose.position.set(0, 0.57, 0.77);
  group.add(nose);

  [-0.21, 0.21].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.16), earMat);
    ear.position.set(ex, 0.56, 0.42);
    group.add(ear);
  });

  [-0.09, 0.09].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), darkMat);
    eye.position.set(ex, 0.63, 0.65);
    group.add(eye);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.38, 8), furMat);
  tail.position.set(0, 0.5, -0.42);
  tail.rotation.x = -0.65;
  group.add(tail);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.0, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.45;
  hitMesh.userData.roomAction = 'pet-dog';
  group.add(hitMesh);

  return { group, tail, hitMesh };
}

export interface AvatarRig {
  root: THREE.Group;
  rig: SculptedHumanRig;
  applyConfig: (cfg: AvatarConfig) => void;
}

export function createAvatarRig(initial: AvatarConfig): AvatarRig {
  const rig = createSculptedHumanRig(avatarConfigToAppearance(initial), {
    scale: 0.138,
    forwardIsNegZ: false,
  });

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1e150e,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 18), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  rig.root.add(shadow);

  return {
    root: rig.root,
    rig,
    applyConfig: (cfg: AvatarConfig) => {
      rig.applyAppearance(avatarConfigToAppearance(cfg));
    },
  };
}

export interface PetWanderState {
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotY: number;
  wait: number;
}

function isPetPointBlocked(
  px: number,
  pz: number,
  st: CozyRoomState,
  petRadius: number,
  avatarPos: { x: number; z: number }
): boolean {
  for (const item of st.furniture) {
    if (!item.enabled) continue;
    const r = FURNITURE_RADII[item.id];
    if (!r) continue;
    const tf = resolveFurnitureTransform(item.id, item);
    if (Math.hypot(px - tf.x, pz - tf.z) < r + petRadius) {
      return true;
    }
  }
  if (st.avatarPlaced ?? true) {
    if (Math.hypot(px - avatarPos.x, pz - avatarPos.z) < 0.44 + petRadius) {
      return true;
    }
  }
  return false;
}

function pickFreePetTarget(
  st: CozyRoomState,
  petRadius: number,
  avatarPos: { x: number; z: number }
): [number, number] {
  for (let attempt = 0; attempt < 18; attempt++) {
    const tx = -2.65 + Math.random() * 5.3;
    const tz = -2.65 + Math.random() * 5.3;
    if (!isPetPointBlocked(tx, tz, st, petRadius + 0.14, avatarPos)) {
      return [tx, tz];
    }
  }
  return [0, 1.65];
}

export function stepPetWander(
  pet: PetWanderState,
  otherPet: PetWanderState | null,
  st: CozyRoomState,
  petRadius: number,
  speed: number,
  dt: number,
  avatarPos: { x: number; z: number }
): boolean {
  let moving = false;
  if (pet.wait > 0) {
    pet.wait -= dt;
    if (pet.wait <= 0) {
      const [tx, tz] = pickFreePetTarget(st, petRadius, avatarPos);
      pet.targetX = tx;
      pet.targetZ = tz;
    }
  } else {
    const dx = pet.targetX - pet.x;
    const dz = pet.targetZ - pet.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.16) {
      pet.wait = 1.4 + Math.random() * 2.2;
    } else {
      moving = true;
      const vx = dx / dist;
      const vz = dz / dist;
      pet.x = THREE.MathUtils.clamp(pet.x + vx * speed * dt, -2.95, 2.95);
      pet.z = THREE.MathUtils.clamp(pet.z + vz * speed * dt, -2.95, 2.95);
      const targetRot = Math.atan2(vx, vz);
      let diff = targetRot - pet.rotY;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      pet.rotY += diff * Math.min(1, dt * 7);
    }
  }

  let bumped = false;
  for (const item of st.furniture) {
    if (!item.enabled) continue;
    const r = FURNITURE_RADII[item.id];
    if (!r) continue;
    const tf = resolveFurnitureTransform(item.id, item);
    const odx = pet.x - tf.x;
    const odz = pet.z - tf.z;
    const oDist = Math.hypot(odx, odz);
    const minD = r + petRadius;
    if (oDist < minD) {
      const nx = oDist > 0.001 ? odx / oDist : 1;
      const nz = oDist > 0.001 ? odz / oDist : 0;
      pet.x = tf.x + nx * minD;
      pet.z = tf.z + nz * minD;
      bumped = true;
    }
  }
  if (st.avatarPlaced ?? true) {
    const adx = pet.x - avatarPos.x;
    const adz = pet.z - avatarPos.z;
    const aDist = Math.hypot(adx, adz);
    const minA = 0.38 + petRadius;
    if (aDist < minA) {
      const nx = aDist > 0.001 ? adx / aDist : 1;
      const nz = aDist > 0.001 ? adz / aDist : 0;
      pet.x = avatarPos.x + nx * minA;
      pet.z = avatarPos.z + nz * minA;
      bumped = true;
    }
  }
  if (otherPet) {
    const pdx = pet.x - otherPet.x;
    const pdz = pet.z - otherPet.z;
    const pDist = Math.hypot(pdx, pdz);
    const minP = 0.62;
    if (pDist < minP && pDist > 0.001) {
      pet.x = otherPet.x + (pdx / pDist) * minP;
      pet.z = otherPet.z + (pdz / pDist) * minP;
      bumped = true;
    }
  }
  pet.x = THREE.MathUtils.clamp(pet.x, -2.95, 2.95);
  pet.z = THREE.MathUtils.clamp(pet.z, -2.95, 2.95);
  if (bumped && moving) {
    const [tx, tz] = pickFreePetTarget(st, petRadius, avatarPos);
    pet.targetX = tx;
    pet.targetZ = tz;
  }
  return moving;
}
