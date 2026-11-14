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
import {
  createSculptedHumanRig,
  SculptedHumanAppearance,
  SculptedHumanRig,
} from './sculptedHumans';
import { SPARROW_PALETTE } from './sculptor';
import { getWalkableSurfaceHeightAt } from './terrain';

function hexToNum(hex: string | number): number {
  if (typeof hex === 'number') return hex;
  return Number.parseInt(hex.replace('#', ''), 16) || 0xffffff;
}

function avatarConfigToAppearance(cfg: AvatarConfig): SculptedHumanAppearance {
  const hairStyle =
    cfg.hairStyle === 'long' ? 'waves' : cfg.hairStyle === 'bun' ? 'bun' : 'short';
  const hatStyle = cfg.hairStyle === 'kasket' ? 'newsboy' : 'none';
  return {
    skinHex: hexToNum(cfg.skinColor),
    shirtHex: hexToNum(cfg.shirtColor),
    pantsHex: hexToNum(cfg.pantsColor),
    hairHex: hexToNum(cfg.hairColor),
    scarfHex: SPARROW_PALETTE.wallCreamTrim,
    hairStyle,
    hatStyle,
  };
}

function npcDefToAppearance(def: BuildingNpcDef): SculptedHumanAppearance {
  const hairStyle =
    def.hairStyle ??
    (def.hatStyle === 'headscarf'
      ? 'bun'
      : def.id.includes('zeynep') || def.id.includes('elif') || def.id.includes('ayse')
        ? 'waves'
        : 'short');
  const hatStyle =
    def.hatStyle === 'cap'
      ? 'newsboy'
      : def.hatStyle === 'chef'
        ? 'chef_toque'
        : def.hatStyle === 'headscarf'
          ? 'headscarf'
          : 'none';
  const apron =
    def.hatStyle === 'chef' ||
    def.propType === 'icecream_cart' ||
    def.propType === 'keskek_pot' ||
    def.propType === 'coffee_tray';
  return {
    skinHex: hexToNum(def.skinColor ?? '#E8BC98'),
    shirtHex: hexToNum(def.shirtColor),
    pantsHex: hexToNum(def.pantsColor),
    hairHex: hexToNum(def.hairColor ?? '#3B281E'),
    scarfHex: SPARROW_PALETTE.wallCreamTrim,
    hatHex: hexToNum(def.hatColor),
    hairStyle,
    hatStyle,
    facialHair: def.facialHair ?? 'none',
    glasses: Boolean(def.glasses),
    apron,
  };
}

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
  updateZeybek: (dt: number, elapsed: number, danceTime: number) => void;
  dispose: () => void;
}

/**
 * Player miniature walking avatar sculpted in Sparrow Sim gouache storybook style.
 */
export function createCityAvatarRig(
  initial: AvatarConfig,
  contactShadowTex?: THREE.Texture
): CityAvatarRig {
  const rig = createSculptedHumanRig(avatarConfigToAppearance(initial), {
    forwardIsNegZ: true,
    contactShadowTex,
  });

  const applyConfig = (cfg: AvatarConfig) => {
    rig.applyAppearance(avatarConfigToAppearance(cfg));
  };

  let currentTreat: HeldTreatType = 'none';
  let currentTreatMesh: THREE.Group | null = null;

  const setTreat = (treat: HeldTreatType) => {
    if (treat === currentTreat) return;
    currentTreat = treat;
    if (currentTreatMesh) {
      rig.rightHandMount.remove(currentTreatMesh);
      disposeGroupContents(currentTreatMesh);
      currentTreatMesh = null;
    }
    if (treat !== 'none') {
      currentTreatMesh = createTreatPropMesh(treat);
      currentTreatMesh.scale.setScalar(1.35);
      rig.rightHandMount.add(currentTreatMesh);
    }
  };

  return {
    root: rig.root,
    setTreat,
    applyConfig,
    updateWalk: (speed: number, dt: number, elapsed: number) =>
      rig.updateWalk(speed, dt, elapsed, currentTreat !== 'none'),
    updateZeybek: (dt: number, elapsed: number, danceTime: number) =>
      rig.updateZeybek(dt, elapsed, danceTime, 0),
    dispose: () => {
      if (currentTreatMesh) {
        disposeGroupContents(currentTreatMesh);
        currentTreatMesh = null;
      }
    },
  };
}

export interface BuildingNpcRuntime {
  def: BuildingNpcDef;
  group: THREE.Group;
  rig: SculptedHumanRig;
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

  BUILDING_NPCS.forEach((def) => {
    const [nx, nz] = def.position;
    const ny = getWalkableSurfaceHeightAt(nx, nz);

    const npcGroup = new THREE.Group();
    npcGroup.position.set(nx, ny, nz);
    npcGroup.rotation.y = def.facingRad;

    // Subtle interactive spot ring
    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 0.98, 24),
      new THREE.MeshStandardMaterial({
        color: 0xe3a84f,
        emissive: 0xd98834,
        emissiveIntensity: 0.65,
        side: THREE.DoubleSide,
        roughness: 0.45,
        polygonOffset: true,
        polygonOffsetFactor: -3,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.06;
    npcGroup.add(ringMesh);

    const npcRig = createSculptedHumanRig(npcDefToAppearance(def), {
      forwardIsNegZ: false,
    });
    npcGroup.add(npcRig.root);

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
    npcs.push({ def, group: npcGroup, rig: npcRig, ringMesh, baseY: ny });

    // Tight collider around NPC & prop station
    const colPad = def.propType === 'icecream_cart' ? 1.1 : 0.72;
    colliders.push({
      minX: nx - colPad,
      maxX: nx + colPad,
      minZ: nz - colPad,
      maxZ: nz + colPad,
    });
  });

  let frameCounter = 0;

  return {
    group,
    clickTargets,
    npcs,
    update: (dt: number, elapsed: number, playerX: number, playerZ: number) => {
      frameCounter += 1;
      for (let idx = 0; idx < npcs.length; idx++) {
        const npc = npcs[idx];
        const dx = playerX - npc.def.position[0];
        const dz = playerZ - npc.def.position[1];
        const distSq = dx * dx + dz * dz;
        const near = distSq < 60.84; // 7.8^2

        if (distSq <= 3600) {
          let lookYaw: number | undefined;
          if (distSq < 81 && distSq > 0.04) {
            const worldAngleToPlayer = Math.atan2(dx, dz);
            let rel = worldAngleToPlayer - npc.def.facingRad;
            while (rel > Math.PI) rel -= Math.PI * 2;
            while (rel < -Math.PI) rel += Math.PI * 2;
            lookYaw = rel;
          }
          npc.rig.updateWave(near, dt, elapsed, npc.def.position[0], lookYaw);
        } else if ((frameCounter + idx) % 8 === 0) {
          npc.rig.updateWave(false, Math.min(0.1, dt * 8), elapsed, npc.def.position[0], undefined);
        }

        if (distSq <= 5625) {
          npc.ringMesh.scale.setScalar(
            near ? 1.18 + Math.sin(elapsed * 4.5) * 0.1 : 1.0 + Math.sin(elapsed * 2.2) * 0.05
          );
        }
      }
    },
  };
}

export interface CompanionWalkerRig {
  root: THREE.Group;
  configure: (npc: BuildingNpcDef, treat: HeldTreatType) => void;
  updateWalk: (speed: number, dt: number, elapsed: number) => void;
  updateZeybek: (dt: number, elapsed: number, danceTime: number) => void;
  dispose: () => void;
}

/**
 * Companion 3D NPC sculpted in Sparrow Sim gouache style who strolls alongside the player.
 */
export function createCompanionWalkerRig(): CompanionWalkerRig {
  const rig = createSculptedHumanRig(
    {
      skinHex: 0xe3b690,
      shirtHex: 0xf3ece0,
      pantsHex: 0x3b5978,
      hairHex: 0x4b3629,
      scarfHex: SPARROW_PALETTE.wallCreamTrim,
      hairStyle: 'short',
      hatStyle: 'newsboy',
    },
    { forwardIsNegZ: true }
  );
  rig.root.visible = false;

  let treatMesh: THREE.Group | null = null;
  const configure = (npc: BuildingNpcDef, treat: HeldTreatType) => {
    rig.applyAppearance(npcDefToAppearance(npc));
    if (treatMesh) {
      rig.rightHandMount.remove(treatMesh);
      disposeGroupContents(treatMesh);
      treatMesh = null;
    }
    if (treat !== 'none') {
      treatMesh = createTreatPropMesh(treat);
      treatMesh.scale.setScalar(1.3);
      rig.rightHandMount.add(treatMesh);
    }
  };

  return {
    root: rig.root,
    configure,
    updateWalk: (speed: number, dt: number, elapsed: number) =>
      rig.updateWalk(speed, dt, elapsed, treatMesh !== null),
    updateZeybek: (dt: number, elapsed: number, danceTime: number) =>
      rig.updateZeybek(dt, elapsed, danceTime, 0.35),
    dispose: () => {
      if (treatMesh) {
        disposeGroupContents(treatMesh);
        treatMesh = null;
      }
    },
  };
}
