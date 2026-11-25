import * as THREE from 'three';
import {
  avatarConfigToAppearance,
  createSculptedHumanRig,
  SculptedHumanRig,
} from '../../game/sculptedHumans';
import { AvatarConfig, CozyRoomState } from '../../types/game';
import { FURNITURE_RADII, resolveFurnitureTransform } from './roomConstants';

function enableMeshShadows(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createCatRig(): {
  group: THREE.Group;
  tail: THREE.Mesh;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xd9904b,
    roughness: 0.7,
    metalness: 0.04,
    flatShading: false,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4e7d3,
    roughness: 0.7,
    metalness: 0.02,
    flatShading: false,
  });
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xe39b96,
    roughness: 0.65,
    metalness: 0.02,
    flatShading: false,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x241d18,
    roughness: 0.35,
    metalness: 0.08,
    flatShading: false,
  });

  // Sculpted organic torso capsule
  const body = enableMeshShadows(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.32, 10, 22), furMat)
  );
  body.rotation.x = Math.PI / 2;
  body.scale.set(1.12, 1.0, 0.96);
  body.position.set(0, 0.25, 0);
  group.add(body);

  // Soft chest puff & shoulder cushion
  const chest = enableMeshShadows(
    new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 16), creamMat)
  );
  chest.scale.set(1.0, 1.08, 0.85);
  chest.position.set(0, 0.25, 0.23);
  group.add(chest);

  // Soft tapered neck connecting torso and head
  const neck = enableMeshShadows(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.09, 8, 18), furMat)
  );
  neck.position.set(0, 0.35, 0.25);
  neck.rotation.x = 0.28;
  group.add(neck);

  // Four smooth capsule legs with softened hip/shoulder joints & rounded paws
  const legGeo = new THREE.CapsuleGeometry(0.044, 0.13, 8, 16);
  const jointGeo = new THREE.SphereGeometry(0.058, 14, 12);
  const pawGeo = new THREE.SphereGeometry(0.052, 14, 12);
  [
    [-0.12, 0.11, 0.2],
    [0.12, 0.11, 0.2],
    [-0.12, 0.11, -0.2],
    [0.12, 0.11, -0.2],
  ].forEach(([lx, ly, lz]) => {
    const joint = enableMeshShadows(new THREE.Mesh(jointGeo, furMat));
    joint.position.set(lx, 0.21, lz);
    group.add(joint);

    const leg = enableMeshShadows(new THREE.Mesh(legGeo, furMat));
    leg.position.set(lx, ly, lz);
    group.add(leg);

    const paw = enableMeshShadows(new THREE.Mesh(pawGeo, creamMat));
    paw.scale.set(1.0, 0.62, 1.2);
    paw.position.set(lx, 0.032, lz + 0.018);
    group.add(paw);
  });

  // Rounded feline head with soft muzzle cheeks
  const head = enableMeshShadows(
    new THREE.Mesh(new THREE.SphereGeometry(0.165, 24, 18), furMat)
  );
  head.scale.set(1.06, 0.94, 0.98);
  head.position.set(0, 0.44, 0.32);
  group.add(head);

  [-0.048, 0.048].forEach((cx) => {
    const cheek = enableMeshShadows(
      new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), creamMat)
    );
    cheek.position.set(cx, 0.4, 0.455);
    group.add(cheek);
  });

  const nose = enableMeshShadows(
    new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), pinkMat)
  );
  nose.scale.set(1.2, 0.85, 0.85);
  nose.position.set(0, 0.425, 0.49);
  group.add(nose);

  // Smooth LatheGeometry sculpted feline ears
  const earProfile = [
    new THREE.Vector2(0.068, 0.0),
    new THREE.Vector2(0.058, 0.045),
    new THREE.Vector2(0.036, 0.105),
    new THREE.Vector2(0.012, 0.145),
    new THREE.Vector2(0.0, 0.155),
  ];
  const earGeo = new THREE.LatheGeometry(earProfile, 18);
  earGeo.computeVertexNormals();
  [-0.1, 0.1].forEach((ex) => {
    const ear = enableMeshShadows(new THREE.Mesh(earGeo, furMat));
    ear.position.set(ex, 0.54, 0.31);
    ear.rotation.z = ex < 0 ? 0.22 : -0.22;
    ear.scale.set(1.0, 1.0, 0.72);
    group.add(ear);
  });

  // Glossy spherical eyes
  const eyeGeo = new THREE.SphereGeometry(0.028, 14, 12);
  [-0.072, 0.072].forEach((ex) => {
    const eye = enableMeshShadows(new THREE.Mesh(eyeGeo, darkMat));
    eye.position.set(ex, 0.465, 0.458);
    group.add(eye);
  });

  // Gracefully curved TubeGeometry tail (centered at base for wag rotation)
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.14, -0.06),
    new THREE.Vector3(0, 0.28, -0.14),
    new THREE.Vector3(0, 0.38, -0.08),
  ]);
  const tailGeo = new THREE.TubeGeometry(tailCurve, 18, 0.036, 14, false);
  const tail = enableMeshShadows(new THREE.Mesh(tailGeo, furMat));
  tail.position.set(0, 0.3, -0.29);
  tail.rotation.x = -0.35;
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
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xc29864,
    roughness: 0.7,
    metalness: 0.04,
    flatShading: false,
  });
  const earMat = new THREE.MeshStandardMaterial({
    color: 0x6f4a2e,
    roughness: 0.7,
    metalness: 0.03,
    flatShading: false,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xb64b36,
    roughness: 0.58,
    metalness: 0.08,
    flatShading: false,
  });
  const tagMat = new THREE.MeshStandardMaterial({
    color: 0xd9b25f,
    roughness: 0.42,
    metalness: 0.3,
    flatShading: false,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x221b17,
    roughness: 0.35,
    metalness: 0.08,
    flatShading: false,
  });

  // Sculpted organic torso capsule
  const body = enableMeshShadows(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 10, 22), furMat)
  );
  body.rotation.x = Math.PI / 2;
  body.scale.set(1.12, 1.0, 0.96);
  body.position.set(0, 0.34, 0);
  group.add(body);

  // Soft chest & muscular neck blend
  const neck = enableMeshShadows(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.14, 8, 18), furMat)
  );
  neck.position.set(0, 0.46, 0.32);
  neck.rotation.x = 0.34;
  group.add(neck);

  // Four smooth capsule legs with shoulder/hip blend joints and rounded paws
  const legGeo = new THREE.CapsuleGeometry(0.054, 0.19, 8, 16);
  const jointGeo = new THREE.SphereGeometry(0.072, 14, 12);
  const pawGeo = new THREE.SphereGeometry(0.062, 14, 12);
  [
    [-0.145, 0.155, 0.25],
    [0.145, 0.155, 0.25],
    [-0.145, 0.155, -0.25],
    [0.145, 0.155, -0.25],
  ].forEach(([lx, ly, lz]) => {
    const joint = enableMeshShadows(new THREE.Mesh(jointGeo, furMat));
    joint.position.set(lx, 0.28, lz);
    group.add(joint);

    const leg = enableMeshShadows(new THREE.Mesh(legGeo, furMat));
    leg.position.set(lx, ly, lz);
    group.add(leg);

    const paw = enableMeshShadows(new THREE.Mesh(pawGeo, furMat));
    paw.scale.set(1.0, 0.62, 1.24);
    paw.position.set(lx, 0.038, lz + 0.022);
    group.add(paw);
  });

  // Smooth LatheGeometry collar ring + brass medallion tag
  const collarProfile = [
    new THREE.Vector2(0.132, -0.038),
    new THREE.Vector2(0.156, -0.025),
    new THREE.Vector2(0.16, 0.0),
    new THREE.Vector2(0.156, 0.025),
    new THREE.Vector2(0.132, 0.038),
  ];
  const collarGeo = new THREE.LatheGeometry(collarProfile, 24);
  collarGeo.computeVertexNormals();
  const collar = enableMeshShadows(new THREE.Mesh(collarGeo, collarMat));
  collar.position.set(0, 0.45, 0.34);
  collar.rotation.x = 0.36;
  group.add(collar);

  const tag = enableMeshShadows(new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), tagMat));
  tag.scale.set(1.0, 1.0, 0.45);
  tag.position.set(0, 0.39, 0.48);
  group.add(tag);

  // Rounded canine head + soft capsule snout + rounded dark nose
  const head = enableMeshShadows(
    new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), furMat)
  );
  head.scale.set(1.02, 0.96, 1.04);
  head.position.set(0, 0.58, 0.44);
  group.add(head);

  const snout = enableMeshShadows(
    new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.11, 8, 18), furMat)
  );
  snout.rotation.x = Math.PI / 2;
  snout.scale.set(1.12, 1.0, 0.84);
  snout.position.set(0, 0.535, 0.63);
  group.add(snout);

  const nose = enableMeshShadows(
    new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 12), darkMat)
  );
  nose.scale.set(1.18, 0.85, 0.85);
  nose.position.set(0, 0.565, 0.745);
  group.add(nose);

  // Soft drooping CapsuleGeometry floppy ears
  const earGeo = new THREE.CapsuleGeometry(0.055, 0.16, 8, 16);
  [-0.185, 0.185].forEach((ex) => {
    const ear = enableMeshShadows(new THREE.Mesh(earGeo, earMat));
    ear.scale.set(0.75, 1.0, 1.2);
    ear.position.set(ex, 0.54, 0.42);
    ear.rotation.z = ex < 0 ? 0.2 : -0.2;
    ear.rotation.x = 0.14;
    group.add(ear);
  });

  // Expressive spherical eyes
  const eyeGeo = new THREE.SphereGeometry(0.03, 14, 12);
  [-0.085, 0.085].forEach((ex) => {
    const eye = enableMeshShadows(new THREE.Mesh(eyeGeo, darkMat));
    eye.position.set(ex, 0.625, 0.605);
    group.add(eye);
  });

  // Curved TubeGeometry happy wagging tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.12, -0.07),
    new THREE.Vector3(0, 0.26, -0.11),
    new THREE.Vector3(0, 0.34, -0.06),
  ]);
  const tailGeo = new THREE.TubeGeometry(tailCurve, 18, 0.042, 14, false);
  const tail = enableMeshShadows(new THREE.Mesh(tailGeo, furMat));
  tail.position.set(0, 0.42, -0.37);
  tail.rotation.x = -0.35;
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
    castShadow: 'full',
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
