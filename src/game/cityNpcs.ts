import * as THREE from 'three';
import { BUILDING_NPCS } from '../data/npcData';
import {
  AvatarConfig,
  AvatarHairStyle,
  BuildingNpcDef,
  ColliderBox,
  HeldTreatType,
} from '../types/game';
import { CityMaterialLibrary } from './materials';
import { getSurfaceHeightAt } from './terrain';

export function createTreatPropMesh(treat: HeldTreatType): THREE.Group {
  const g = new THREE.Group();
  if (treat === 'none') return g;

  if (treat === 'icecream') {
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xd99b56, roughness: 0.78 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 10), coneMat);
    cone.rotation.x = Math.PI;
    cone.position.y = 0.08;
    const scoop1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xf7efe1, roughness: 0.48 })
    );
    scoop1.position.set(0, 0.22, 0);
    const scoop2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe87b88, roughness: 0.45 })
    );
    scoop2.position.set(0.015, 0.31, 0);
    g.add(cone, scoop1, scoop2);
  } else if (treat === 'coffee') {
    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.09, 0.025, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.35 })
    );
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.052, 0.095, 12),
      new THREE.MeshStandardMaterial({ color: 0xd9614a, roughness: 0.38 })
    );
    cup.position.y = 0.055;
    const foam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.01, 12),
      new THREE.MeshStandardMaterial({ color: 0x5c361e, roughness: 0.55 })
    );
    foam.position.y = 0.1;
    g.add(saucer, cup, foam);
  } else if (treat === 'simit') {
    const simit = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.036, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xd89342, roughness: 0.72 })
    );
    simit.position.y = 0.11;
    simit.rotation.y = Math.PI / 4;
    g.add(simit);
  } else if (treat === 'kumpir') {
    const foil = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 0.65, roughness: 0.32 })
    );
    foil.scale.set(1.25, 0.8, 1.0);
    foil.position.y = 0.07;
    const filling = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xf0be4a, roughness: 0.55 })
    );
    filling.position.y = 0.13;
    g.add(foil, filling);
  } else if (treat === 'keskek') {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.085, 0.085, 12),
      new THREE.MeshStandardMaterial({ color: 0xb85a38, roughness: 0.65 })
    );
    bowl.position.y = 0.04;
    const porridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0xede0c4, roughness: 0.6 })
    );
    porridge.position.y = 0.08;
    const butter = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xc9422b, roughness: 0.45 })
    );
    butter.scale.set(1.3, 0.45, 1.3);
    butter.position.y = 0.095;
    g.add(bowl, porridge, butter);
  }

  return g;
}

function disposeGroupContents(root: THREE.Object3D): void {
  const mats = new Set<THREE.Material>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => mats.add(m));
      } else if (mesh.material) {
        mats.add(mesh.material);
      }
    }
  });
  mats.forEach((m) => m.dispose());
}

export interface CityAvatarRig {
  root: THREE.Group;
  setTreat: (treat: HeldTreatType) => void;
  applyConfig: (cfg: AvatarConfig) => void;
  updateWalk: (speed: number, dt: number, elapsed: number) => void;
  dispose: () => void;
}

/**
 * Player miniature walking avatar matching CozyRoomView styling.
 * Internal body is rotated Math.PI around Y so forward travel (-Z at heading=0) faces forward.
 */
export function createCityAvatarRig(
  initial: AvatarConfig,
  contactShadowTex?: THREE.Texture
): CityAvatarRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  bodyPivot.rotation.y = Math.PI;
  root.add(bodyPivot);

  if (contactShadowTex) {
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    root.add(shadowPlane);
  }

  const skinMat = new THREE.MeshStandardMaterial({ color: initial.skinColor, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: initial.shirtColor, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: initial.pantsColor, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: initial.hairColor, roughness: 0.82 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x4b5663, roughness: 0.8 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x241914 });

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.1, 0.52, 0);
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.1, 0.52, 0);

  const legGeo = new THREE.BoxGeometry(0.15, 0.46, 0.16);
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.09, 0.22);

  [leftLegPivot, rightLegPivot].forEach((lp) => {
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.y = -0.22;
    leg.castShadow = true;
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.47, 0.03);
    shoe.castShadow = true;
    lp.add(leg, shoe);
    bodyPivot.add(lp);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.25), shirtMat);
  torso.position.y = 0.76;
  torso.castShadow = true;
  bodyPivot.add(torso);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.28, 0.94, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.28, 0.94, 0);

  const sleeveGeo = new THREE.BoxGeometry(0.12, 0.24, 0.13);
  const handGeo = new THREE.BoxGeometry(0.1, 0.18, 0.11);

  [leftArmPivot, rightArmPivot].forEach((ap) => {
    const sleeve = new THREE.Mesh(sleeveGeo, shirtMat);
    sleeve.position.y = -0.11;
    sleeve.castShadow = true;
    const forearm = new THREE.Mesh(handGeo, skinMat);
    forearm.position.y = -0.29;
    forearm.castShadow = true;
    ap.add(sleeve, forearm);
    bodyPivot.add(ap);
  });

  const rightHandMount = new THREE.Group();
  rightHandMount.position.set(0, -0.36, 0.1);
  rightArmPivot.add(rightHandMount);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.35, 0.34), skinMat);
  head.position.y = 1.18;
  head.castShadow = true;
  bodyPivot.add(head);

  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.03), eyeMat);
    eye.position.set(ex, 1.19, 0.175);
    bodyPivot.add(eye);
  });

  const hairGroups: Record<AvatarHairStyle, THREE.Group> = {
    kasket: new THREE.Group(),
    short: new THREE.Group(),
    long: new THREE.Group(),
    bun: new THREE.Group(),
  };

  {
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.12, 0.39), capMat);
    crown.position.set(0, 1.38, 0.01);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.18), capMat);
    brim.position.set(0, 1.33, 0.22);
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.1), hairMat);
    backHair.position.set(0, 1.26, -0.16);
    hairGroups.kasket.add(crown, brim, backHair);
  }
  {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.12, 0.37), hairMat);
    top.position.set(0, 1.37, -0.01);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.12), hairMat);
    back.position.set(0, 1.24, -0.15);
    hairGroups.short.add(top, back);
  }
  {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.38), hairMat);
    top.position.set(0, 1.37, -0.01);
    const drape = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.44, 0.15), hairMat);
    drape.position.set(0, 1.12, -0.16);
    [-0.18, 0.18].forEach((sx) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.18), hairMat);
      side.position.set(sx, 1.14, -0.02);
      hairGroups.long.add(side);
    });
    hairGroups.long.add(top, drape);
  }
  {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.11, 0.37), hairMat);
    top.position.set(0, 1.37, -0.01);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), hairMat);
    bun.position.set(0, 1.4, -0.19);
    hairGroups.bun.add(top, bun);
  }
  Object.values(hairGroups).forEach((hg) => bodyPivot.add(hg));

  const applyConfig = (cfg: AvatarConfig) => {
    skinMat.color.set(cfg.skinColor);
    shirtMat.color.set(cfg.shirtColor);
    pantsMat.color.set(cfg.pantsColor);
    hairMat.color.set(cfg.hairColor);
    (Object.keys(hairGroups) as AvatarHairStyle[]).forEach((style) => {
      hairGroups[style].visible = style === cfg.hairStyle;
    });
  };
  applyConfig(initial);

  let currentTreat: HeldTreatType = 'none';
  let currentTreatMesh: THREE.Group | null = null;

  const setTreat = (treat: HeldTreatType) => {
    if (treat === currentTreat) return;
    currentTreat = treat;
    if (currentTreatMesh) {
      rightHandMount.remove(currentTreatMesh);
      disposeGroupContents(currentTreatMesh);
      currentTreatMesh = null;
    }
    if (treat !== 'none') {
      currentTreatMesh = createTreatPropMesh(treat);
      currentTreatMesh.scale.setScalar(1.35);
      rightHandMount.add(currentTreatMesh);
    }
  };

  let walkPhase = 0;
  const updateWalk = (speed: number, dt: number, elapsed: number) => {
    const absSpeed = Math.abs(speed);
    if (absSpeed > 0.18) {
      walkPhase += dt * Math.max(4.5, absSpeed * 2.1);
      const swing = Math.sin(walkPhase) * Math.min(0.68, absSpeed * 0.13);
      leftLegPivot.rotation.x = swing;
      rightLegPivot.rotation.x = -swing;
      leftArmPivot.rotation.x = -swing * 0.72;
      rightArmPivot.rotation.x =
        currentTreat !== 'none' ? -0.68 + swing * 0.12 : swing * 0.72;
      bodyPivot.position.y = Math.abs(Math.sin(walkPhase)) * 0.055;
    } else {
      leftLegPivot.rotation.x = THREE.MathUtils.damp(leftLegPivot.rotation.x, 0, 10, dt);
      rightLegPivot.rotation.x = THREE.MathUtils.damp(rightLegPivot.rotation.x, 0, 10, dt);
      leftArmPivot.rotation.x = THREE.MathUtils.damp(leftArmPivot.rotation.x, 0, 10, dt);
      const holdAngle = currentTreat !== 'none' ? -0.72 : 0;
      rightArmPivot.rotation.x = THREE.MathUtils.damp(rightArmPivot.rotation.x, holdAngle, 10, dt);
      bodyPivot.position.y = Math.sin(elapsed * 2.2) * 0.014;
    }
  };

  return {
    root,
    setTreat,
    applyConfig,
    updateWalk,
    dispose: () => {
      disposeGroupContents(root);
    },
  };
}

export interface BuildingNpcRuntime {
  def: BuildingNpcDef;
  group: THREE.Group;
  waveArm: THREE.Group;
  ringMesh: THREE.Mesh;
  baseY: number;
}

export interface BuildingNpcSystem {
  group: THREE.Group;
  clickTargets: THREE.Object3D[];
  npcs: BuildingNpcRuntime[];
  update: (dt: number, elapsed: number, playerX: number, playerZ: number) => void;
}

function createPropStation(propType: BuildingNpcDef['propType'], mats: CityMaterialLibrary): THREE.Group {
  const p = new THREE.Group();
  if (propType === 'none') return p;

  if (propType === 'icecream_cart') {
    const cartBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.85, 0.72),
      mats.creamPlaster
    );
    cartBody.position.y = 0.58;
    cartBody.castShadow = true;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.22, 0.12, 0.78),
      new THREE.MeshStandardMaterial({ color: 0xe68491, roughness: 0.6 })
    );
    trim.position.y = 0.98;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.45, 8), mats.wroughtIron);
    pole.position.set(0.35, 1.65, -0.2);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.42, 8),
      new THREE.MeshStandardMaterial({
        color: 0xf4a092,
        map: mats.stripedAwningMap,
        roughness: 0.7,
      })
    );
    canopy.position.set(0.35, 2.38, -0.2);
    canopy.castShadow = true;
    [-0.4, 0.4].forEach((wx) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), mats.darkTimber);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.22, 0.36);
      p.add(wheel);
    });
    const coneDisplay = createTreatPropMesh('icecream');
    coneDisplay.scale.setScalar(1.4);
    coneDisplay.position.set(-0.22, 1.05, 0);
    p.add(cartBody, trim, pole, canopy, coneDisplay);
  } else if (propType === 'simit_tray') {
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6), mats.darkTimber);
    leg1.position.set(-0.2, 0.47, 0);
    leg1.rotation.z = -0.22;
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6), mats.darkTimber);
    leg2.position.set(0.2, 0.47, 0);
    leg2.rotation.z = 0.22;
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.46, 0.08, 14), mats.shutterWood);
    tray.position.y = 0.92;
    tray.castShadow = true;
    p.add(leg1, leg2, tray);
    for (let i = 0; i < 4; i++) {
      const simit = createTreatPropMesh('simit');
      simit.rotation.x = Math.PI / 2;
      simit.position.set((i % 2 === 0 ? -0.15 : 0.15), 0.98 + Math.floor(i / 2) * 0.07, (i < 2 ? -0.1 : 0.12));
      p.add(simit);
    }
  } else if (propType === 'coffee_tray') {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 0.08, 12), mats.shutterWood);
    table.position.y = 0.72;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.18, 0.7, 8), mats.darkTimber);
    stand.position.y = 0.35;
    const cezve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.1, 0.16, 10),
      new THREE.MeshStandardMaterial({ color: 0xb8733e, metalness: 0.65, roughness: 0.32 })
    );
    cezve.position.set(-0.14, 0.84, 0);
    const cup = createTreatPropMesh('coffee');
    cup.scale.setScalar(1.25);
    cup.position.set(0.14, 0.77, 0.06);
    p.add(table, stand, cezve, cup);
  } else if (propType === 'keskek_pot') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.45, 10), mats.travertine);
    base.position.y = 0.22;
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.32, 0.42, 12),
      new THREE.MeshStandardMaterial({ color: 0xb46938, metalness: 0.62, roughness: 0.35 })
    );
    pot.position.y = 0.56;
    pot.castShadow = true;
    const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), mats.shutterWood);
    spoon.position.set(0.14, 0.85, 0);
    spoon.rotation.z = -0.35;
    p.add(base, pot, spoon);
  } else if (propType === 'notebook') {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.95, 8), mats.darkTimber);
    post.position.y = 0.48;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.46), mats.shutterWood);
    board.position.y = 0.98;
    board.rotation.x = 0.35;
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.02, 0.34), mats.creamPlaster);
    paper.position.set(0, 1.01, 0);
    paper.rotation.x = 0.35;
    p.add(post, board, paper);
  }

  return p;
}

export function createBuildingNpcSystem(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): BuildingNpcSystem {
  const group = new THREE.Group();
  const clickTargets: THREE.Object3D[] = [];
  const npcs: BuildingNpcRuntime[] = [];

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe3b690, roughness: 0.72 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x36281d, roughness: 0.85 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221712 });

  BUILDING_NPCS.forEach((def) => {
    const [nx, nz] = def.position;
    const ny = getSurfaceHeightAt(nx, nz);

    const npcGroup = new THREE.Group();
    npcGroup.position.set(nx, ny, nz);
    npcGroup.rotation.y = def.facingRad;

    const shirtMat = new THREE.MeshStandardMaterial({ color: def.shirtColor, roughness: 0.72 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: def.pantsColor, roughness: 0.82 });
    const hatMat = new THREE.MeshStandardMaterial({ color: def.hatColor, roughness: 0.75 });

    // Subtle interactive spot ring
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.98, 24),
      new THREE.MeshStandardMaterial({
        color: 0xe3a84f,
        emissive: 0xd98834,
        emissiveIntensity: 0.65,
        side: THREE.DoubleSide,
        roughness: 0.45,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.06;
    npcGroup.add(ringMesh);

    // Legs
    [-0.1, 0.1].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.48, 0.16), pantsMat);
      leg.position.set(lx, 0.3, 0);
      leg.castShadow = true;
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.21), shoeMat);
      shoe.position.set(lx, 0.04, 0.03);
      npcGroup.add(leg, shoe);
    });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.25), shirtMat);
    torso.position.y = 0.78;
    torso.castShadow = true;
    npcGroup.add(torso);

    // Left resting arm
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.13), shirtMat);
    leftArm.position.set(-0.28, 0.76, 0);
    leftArm.castShadow = true;
    npcGroup.add(leftArm);

    // Right waving arm pivot
    const waveArm = new THREE.Group();
    waveArm.position.set(0.28, 0.96, 0);
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.13), shirtMat);
    rArmMesh.position.y = -0.18;
    rArmMesh.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.11), skinMat);
    rHand.position.y = -0.38;
    waveArm.add(rArmMesh, rHand);
    npcGroup.add(waveArm);

    // Head & eyes (facing +Z locally)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.34, 0.33), skinMat);
    head.position.y = 1.19;
    head.castShadow = true;
    npcGroup.add(head);

    [-0.08, 0.08].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.03), eyeMat);
      eye.position.set(ex, 1.2, 0.17);
      npcGroup.add(eye);
    });

    if (def.hatStyle === 'cap') {
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.37), hatMat);
      crown.position.set(0, 1.38, 0.01);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.16), hatMat);
      brim.position.set(0, 1.33, 0.21);
      npcGroup.add(crown, brim);
    } else if (def.hatStyle === 'chef') {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.14, 12), hatMat);
      band.position.set(0, 1.4, 0);
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), hatMat);
      puff.position.set(0, 1.52, 0);
      npcGroup.add(band, puff);
    } else if (def.hatStyle === 'headscarf') {
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.38), hatMat);
      top.position.set(0, 1.37, -0.01);
      const drape = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.34, 0.18), hatMat);
      drape.position.set(0, 1.16, -0.14);
      npcGroup.add(top, drape);
    } else {
      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.36), hatMat);
      hair.position.set(0, 1.37, -0.01);
      const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.28, 0.12), hatMat);
      backHair.position.set(0, 1.18, -0.14);
      npcGroup.add(hair, backHair);
    }

    // Accompanying street prop station beside NPC
    if (def.propType !== 'none') {
      const propStation = createPropStation(def.propType, mats);
      propStation.position.set(1.08, 0, 0.18);
      npcGroup.add(propStation);
    }

    // Invisible click target for 3D raycasting
    const clickTarget = new THREE.Mesh(
      new THREE.CylinderGeometry(1.45, 1.45, 2.8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    clickTarget.position.set(0.35, 1.4, 0);
    clickTarget.userData = { npcId: def.id };
    npcGroup.add(clickTarget);
    clickTargets.push(clickTarget);

    group.add(npcGroup);
    npcs.push({ def, group: npcGroup, waveArm, ringMesh, baseY: ny });

    // Tight collider around NPC & prop station
    const colPad = def.propType === 'icecream_cart' ? 1.1 : 0.72;
    colliders.push({
      minX: nx - colPad,
      maxX: nx + colPad,
      minZ: nz - colPad,
      maxZ: nz + colPad,
    });
  });

  return {
    group,
    clickTargets,
    npcs,
    update: (dt: number, elapsed: number, playerX: number, playerZ: number) => {
      for (const npc of npcs) {
        const dist = Math.hypot(playerX - npc.def.position[0], playerZ - npc.def.position[1]);
        const near = dist < 7.5;
        const waveTarget = near
          ? -2.2 + Math.sin(elapsed * 7.2 + npc.def.position[0]) * 0.42
          : Math.sin(elapsed * 1.4 + npc.def.position[1]) * 0.08;
        npc.waveArm.rotation.z = THREE.MathUtils.damp(npc.waveArm.rotation.z, waveTarget, 8, dt);
        npc.ringMesh.scale.setScalar(
          near ? 1.18 + Math.sin(elapsed * 4.5) * 0.1 : 1.0 + Math.sin(elapsed * 2.2) * 0.05
        );
      }
    },
  };
}

export interface CompanionWalkerRig {
  root: THREE.Group;
  configure: (npc: BuildingNpcDef, treat: HeldTreatType) => void;
  updateWalk: (speed: number, dt: number, elapsed: number) => void;
  dispose: () => void;
}

/**
 * Companion 3D NPC who walks alongside the player on Cornet Dondurma / Kahve boulevard strolls.
 */
export function createCompanionWalkerRig(): CompanionWalkerRig {
  const root = new THREE.Group();
  root.visible = false;

  const bodyPivot = new THREE.Group();
  bodyPivot.rotation.y = Math.PI;
  root.add(bodyPivot);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe3b690, roughness: 0.72 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf3ece0, roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3b5978, roughness: 0.8 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd95a38, roughness: 0.75 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x36281d, roughness: 0.85 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x221712 });

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.1, 0.5, 0);
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.1, 0.5, 0);

  [leftLegPivot, rightLegPivot].forEach((lp) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.15), pantsMat);
    leg.position.y = -0.22;
    leg.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.2), shoeMat);
    shoe.position.set(0, -0.45, 0.03);
    lp.add(leg, shoe);
    bodyPivot.add(lp);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.46, 0.24), shirtMat);
  torso.position.y = 0.74;
  torso.castShadow = true;
  bodyPivot.add(torso);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.27, 0.92, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.27, 0.92, 0);

  [leftArmPivot, rightArmPivot].forEach((ap) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.36, 0.12), shirtMat);
    arm.position.y = -0.17;
    arm.castShadow = true;
    ap.add(arm);
    bodyPivot.add(ap);
  });

  const handMount = new THREE.Group();
  handMount.position.set(0, -0.34, 0.1);
  rightArmPivot.add(handMount);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.33, 0.32), skinMat);
  head.position.y = 1.14;
  head.castShadow = true;
  bodyPivot.add(head);

  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.03), eyeMat);
    eye.position.set(ex, 1.15, 0.165);
    bodyPivot.add(eye);
  });

  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.14, 0.36), hatMat);
  hat.position.set(0, 1.34, 0);
  bodyPivot.add(hat);

  let treatMesh: THREE.Group | null = null;
  const configure = (npc: BuildingNpcDef, treat: HeldTreatType) => {
    shirtMat.color.set(npc.shirtColor);
    pantsMat.color.set(npc.pantsColor);
    hatMat.color.set(npc.hatColor);
    if (treatMesh) {
      handMount.remove(treatMesh);
      disposeGroupContents(treatMesh);
      treatMesh = null;
    }
    if (treat !== 'none') {
      treatMesh = createTreatPropMesh(treat);
      treatMesh.scale.setScalar(1.3);
      handMount.add(treatMesh);
    }
  };

  let walkPhase = 0;
  const updateWalk = (speed: number, dt: number, elapsed: number) => {
    const absSpeed = Math.abs(speed);
    if (absSpeed > 0.15) {
      walkPhase += dt * Math.max(4.5, absSpeed * 2.1);
      const swing = Math.sin(walkPhase) * Math.min(0.62, absSpeed * 0.13);
      leftLegPivot.rotation.x = swing;
      rightLegPivot.rotation.x = -swing;
      leftArmPivot.rotation.x = -swing * 0.7;
      rightArmPivot.rotation.x = -0.68 + swing * 0.1;
      bodyPivot.position.y = Math.abs(Math.sin(walkPhase)) * 0.045;
    } else {
      leftLegPivot.rotation.x = THREE.MathUtils.damp(leftLegPivot.rotation.x, 0, 10, dt);
      rightLegPivot.rotation.x = THREE.MathUtils.damp(rightLegPivot.rotation.x, 0, 10, dt);
      leftArmPivot.rotation.x = THREE.MathUtils.damp(leftArmPivot.rotation.x, 0, 10, dt);
      rightArmPivot.rotation.x = THREE.MathUtils.damp(rightArmPivot.rotation.x, -0.7, 10, dt);
      bodyPivot.position.y = Math.sin(elapsed * 2.5) * 0.015;
    }
  };

  return {
    root,
    configure,
    updateWalk,
    dispose: () => {
      disposeGroupContents(root);
    },
  };
}
