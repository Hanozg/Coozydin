import * as THREE from 'three';
import { ColliderBox, StreetInteractionType } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { createSculptedHumanRig, SculptedHumanRig } from './sculptedHumans';
import { SPARROW_PALETTE } from './sculptor';

interface EfeDancerRig {
  pivot: THREE.Group;
  rig: SculptedHumanRig;
  baseAngle: number;
}

export interface StreetMusiciansRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  center: [number, number];
  isDancing: () => boolean;
  triggerZeybek: () => void;
  update: (dt: number, elapsed: number) => void;
}

export interface LibraryVendorRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  vendorPos: [number, number];
  headWorldPos: THREE.Vector3;
  isBubbleVisible: () => boolean;
  triggerBubble: () => void;
  update: (dt: number, elapsed: number) => void;
}

export interface LokmaStandRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  pos: [number, number];
  triggerServeEffect: () => void;
  update: (dt: number, elapsed: number) => void;
}

function createEfeDancer(): EfeDancerRig {
  const pivot = new THREE.Group();
  const rig = createSculptedHumanRig(
    {
      skinHex: 0xe3b690,
      shirtHex: 0x202b3d,
      sleeveHex: 0xf4eee3,
      pantsHex: 0x202b3d,
      sashHex: 0x9e2b2b,
      goldTrim: true,
      hairHex: 0x2c2018,
      scarfHex: 0x202b3d,
      hairStyle: 'short',
      hatStyle: 'fes',
    },
    { forwardIsNegZ: false }
  );
  pivot.add(rig.root);
  return { pivot, rig, baseAngle: 0 };
}

function makeClickProxy(
  radius: number,
  height: number,
  type: StreetInteractionType
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), mat);
  mesh.position.y = height / 2;
  mesh.userData.interactionType = type;
  return mesh;
}

/**
 * 1. Interactive Street Musicians & Zeybek Efeler Circle (Kent Meydanı Promenade)
 */
export function createStreetMusiciansZeybek(
  mats: CityMaterialLibrary
): StreetMusiciansRig {
  const group = new THREE.Group();
  const cx = -8.2;
  const cz = 20.6;
  group.position.set(cx, 0, cz);

  // Woven Kilim Rug on Plaza Stone
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x993e2f, roughness: 0.88 });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 2.6), rugMat);
  rug.position.y = 0.25;
  rug.receiveShadow = true;
  group.add(rug);

  const rugInnerMat = new THREE.MeshStandardMaterial({ color: 0xd99b43, roughness: 0.85 });
  const rugInner = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.07, 1.8), rugInnerMat);
  rugInner.position.y = 0.255;
  group.add(rugInner);

  // Musician 1: Davulcu & Musician 2: Zurna Player in Sparrow Sim sculpted style
  const buildMusician = (x: number, z: number, coatHex: number, isDrummer: boolean) => {
    const m = new THREE.Group();
    m.position.set(x, 0.25, z);

    const rig = createSculptedHumanRig(
      {
        skinHex: 0xe3b690,
        shirtHex: coatHex,
        pantsHex: 0x2e3b46,
        hairHex: 0x3b2a22,
        scarfHex: SPARROW_PALETTE.wallCreamTrim,
        hairStyle: 'short',
        hatStyle: 'newsboy',
      },
      { forwardIsNegZ: false }
    );
    m.add(rig.root);

    if (isDrummer) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12), mats.creamPlaster);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, 0.88, 0.3);
      drum.castShadow = true;
      m.add(drum);
      const drumRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.295, 0.295, 0.08, 12),
        mats.darkTimber
      );
      drumRim.rotation.z = Math.PI / 2;
      drumRim.position.set(0, 0.88, 0.3);
      m.add(drumRim);
    } else {
      const zurna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.55, 8), mats.brass);
      zurna.rotation.x = Math.PI * 0.36;
      zurna.position.set(0, 1.16, 0.28);
      m.add(zurna);
    }

    return { group: m, rig };
  };

  const drummer = buildMusician(-0.65, 0, 0x3b526b, true);
  const zurnaPlayer = buildMusician(0.65, 0.15, 0x6b4536, false);
  group.add(drummer.group, zurnaPlayer.group);

  // Subtle glowing stage ring around musicians
  const stageRingGeo = new THREE.RingGeometry(2.1, 2.35, 32);
  stageRingGeo.rotateX(-Math.PI / 2);
  const stageRingMat = new THREE.MeshStandardMaterial({
    color: 0xe3a84f,
    emissive: new THREE.Color(0xe3a84f),
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
  });
  const stageRing = new THREE.Mesh(stageRingGeo, stageRingMat);
  stageRing.position.y = 0.27;
  group.add(stageRing);

  // 6 Efeler Dancers circling around the musicians
  const dancers: EfeDancerRig[] = [];
  const dancerCount = 6;
  for (let i = 0; i < dancerCount; i++) {
    const efe = createEfeDancer();
    const ang = (i * Math.PI * 2) / dancerCount;
    efe.baseAngle = ang;
    efe.pivot.position.set(Math.cos(ang) * 3.1, 0.24, Math.sin(ang) * 3.1);
    efe.pivot.rotation.y = -ang + Math.PI / 2;
    group.add(efe.pivot);
    dancers.push(efe);
  }

  // Visual Festival Sparkles (Golden celebration bursts during Zeybek)
  const sparkCount = 24;
  const sparkGeo = new THREE.OctahedronGeometry(0.14, 0);
  const sparkMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: new THREE.Color(0xffb830),
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
  sparkInst.frustumCulled = false;
  group.add(sparkInst);
  const sparkDummy = new THREE.Object3D();

  const clickTarget = makeClickProxy(2.8, 2.4, 'musicians');
  group.add(clickTarget);

  let danceTimer = 0;
  let circleRotation = 0;

  return {
    group,
    clickTarget,
    center: [cx, cz],
    isDancing: () => danceTimer > 0,
    triggerZeybek: () => {
      danceTimer = 11.5;
    },
    update: (dt: number, elapsed: number) => {
      if (danceTimer > 0) {
        danceTimer = Math.max(0, danceTimer - dt);
        circleRotation += dt * 0.42;
        stageRingMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 8) * 0.4;

        // Musicians play energetically with the 9/8 beat
        drummer.group.position.y = 0.25 + Math.abs(Math.sin(elapsed * 7)) * 0.08;
        zurnaPlayer.group.rotation.z = Math.sin(elapsed * 4.5) * 0.08;
        drummer.rig.updateWalk(0, dt, elapsed, true);
        zurnaPlayer.rig.updateWalk(0, dt, elapsed, true);

        // Efeler perform expressive 9/8 Zeybek choreography (kneeling dips & curved wing arms)
        const danceTime = 11.5 - danceTimer;
        dancers.forEach((efe, idx) => {
          const ang = efe.baseAngle + circleRotation;
          const rad = 3.2 + Math.sin(elapsed * 2 + idx) * 0.15;
          efe.pivot.position.set(Math.cos(ang) * rad, 0.24, Math.sin(ang) * rad);
          efe.pivot.rotation.y = -ang;
          efe.rig.updateZeybek(dt, elapsed, danceTime, idx * 0.42);
        });

        // Festival golden sparkles swirling up
        for (let i = 0; i < sparkCount; i++) {
          const t = (elapsed * 0.9 + i / sparkCount) % 1;
          const ang = i * 1.3 + elapsed * 1.8;
          const rad = 1.6 + Math.sin(t * Math.PI) * 2.4;
          sparkDummy.position.set(Math.cos(ang) * rad, 0.6 + t * 4.2, Math.sin(ang) * rad);
          sparkDummy.rotation.set(elapsed * 2, elapsed * 3, 0);
          sparkDummy.scale.setScalar(Math.sin(t * Math.PI) * 1.15);
          sparkDummy.updateMatrix();
          sparkInst.setMatrixAt(i, sparkDummy.matrix);
        }
        sparkInst.instanceMatrix.needsUpdate = true;
      } else {
        stageRingMat.emissiveIntensity = 0.28 + Math.sin(elapsed * 2) * 0.08;
        drummer.group.position.y = 0.25;
        zurnaPlayer.group.rotation.z = 0;
        drummer.rig.updateWalk(0, dt, elapsed, true);
        zurnaPlayer.rig.updateWalk(0, dt, elapsed, true);

        dancers.forEach((efe, idx) => {
          const ang = efe.baseAngle;
          efe.pivot.position.set(Math.cos(ang) * 3.0, 0.24, Math.sin(ang) * 3.0);
          efe.pivot.rotation.y = -ang + Math.PI / 2;
          efe.rig.updateWalk(0, dt, elapsed + idx * 0.5, false);
        });

        for (let i = 0; i < sparkCount; i++) {
          sparkDummy.position.set(0, -10, 0);
          sparkDummy.scale.setScalar(0.001);
          sparkDummy.updateMatrix();
          sparkInst.setMatrixAt(i, sparkDummy.matrix);
        }
        sparkInst.instanceMatrix.needsUpdate = true;
      }
    },
  };
}

/**
 * 2. Aydın İl Halk Kütüphanesi & Mendil/Lif Satıcısı (Across from Kent Meydanı)
 */
export function createLibraryAndVendor(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): LibraryVendorRig {
  const group = new THREE.Group();

  // A. Library Building at [-27.5, 0, 25.5] facing East toward Kent Meydanı
  const libX = -27.5;
  const libZ = 25.5;
  const lib = new THREE.Group();
  lib.position.set(libX, 0, libZ);

  const podium = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.4, 11.4), mats.travertine);
  podium.position.y = 0.2;
  podium.receiveShadow = true;
  lib.add(podium);

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(7.6, 5.2, 9.8), mats.creamPlaster);
  mainHall.position.set(-0.3, 3.0, 0);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  lib.add(mainHall);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.1, 10.4), mats.terracottaRoof);
  roof.position.set(-0.3, 6.1, 0);
  roof.castShadow = true;
  lib.add(roof);

  // Reading Room Tall Windows facing Sevgi Yolu & Kent Meydanı (+X)
  [-3.2, -1.6, 1.6, 3.2].forEach((wz) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 1.0), mats.windowLit);
    win.position.set(3.52, 2.8, wz);
    lib.add(win);
  });

  // Entrance Pediment & Sign Plaque
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.8), mats.darkTimber);
  door.position.set(3.52, 1.6, 0);
  lib.add(door);

  const signPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 3.6), mats.brass);
  signPlate.position.set(3.56, 4.7, 0);
  lib.add(signPlate);

  group.add(lib);
  colliders.push({
    minX: libX - 4.6,
    maxX: libX + 4.6,
    minZ: libZ - 5.7,
    maxZ: libZ + 5.7,
  });

  // B. Mendil & Lif Satıcısı (on sidewalk at [-21.4, 0, 21.5], facing Kent Meydanı)
  const vx = -21.4;
  const vz = 21.5;
  const vendor = new THREE.Group();
  vendor.position.set(vx, 0, vz);
  vendor.rotation.y = Math.PI / 2; // Facing East toward Kent Meydanı

  const vendorRig = createSculptedHumanRig(
    {
      skinHex: 0xe3b690,
      shirtHex: 0x4b6a7a,
      pantsHex: 0x2e3b46,
      hairHex: 0xf4eee3,
      scarfHex: SPARROW_PALETTE.wallCreamTrim,
      hairStyle: 'bun',
      hatStyle: 'headscarf',
      apron: true,
    },
    { forwardIsNegZ: false }
  );
  vendor.add(vendorRig.root);

  // Wooden Portable Display Tray with Colorful Lif & White Mendil Packs
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.56), mats.darkTimber);
  tray.position.set(0, 0.76, 0.48);
  tray.castShadow = true;
  vendor.add(tray);

  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), mats.darkTimber);
  legL.position.set(-0.36, 0.37, 0.58);
  const legR = legL.clone();
  legR.position.x = 0.36;
  vendor.add(legL, legR);

  // White Wet-Wipe Packs (Islak Mendil)
  const packMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), packMat);
    pack.position.set(-0.24 + i * 0.18, 0.86, 0.42);
    vendor.add(pack);
  }

  // Colorful Knitted Bath Puffs (Lif)
  const lifColors = [0xd96b86, 0x5aa8b0, 0xe8b954];
  lifColors.forEach((c, i) => {
    const lif = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.035, 6, 12),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    );
    lif.rotation.x = Math.PI / 2;
    lif.position.set(-0.22 + i * 0.22, 0.86, 0.6);
    vendor.add(lif);
  });

  const clickTarget = makeClickProxy(1.1, 1.8, 'vendor');
  vendor.add(clickTarget);
  group.add(vendor);

  colliders.push({
    minX: vx - 0.8,
    maxX: vx + 0.8,
    minZ: vz - 0.8,
    maxZ: vz + 0.8,
  });

  // Auto-callout cycle: first greeting at 6s, then every ~48s for 7.5s
  let bubbleTimer = 6.5;
  let cycleTimer = 8.0;

  return {
    group,
    clickTarget,
    vendorPos: [vx, vz],
    headWorldPos: new THREE.Vector3(vx, 1.75, vz),
    isBubbleVisible: () => bubbleTimer > 0,
    triggerBubble: () => {
      bubbleTimer = 7.5;
      cycleTimer = 48.0;
    },
    update: (dt: number, elapsed: number) => {
      // Gentle vendor greeting & waving when calling out
      vendorRig.updateWave(bubbleTimer > 0, dt, elapsed, 1.2);

      if (bubbleTimer > 0) {
        bubbleTimer = Math.max(0, bubbleTimer - dt);
      } else {
        cycleTimer -= dt;
        if (cycleTimer <= 0) {
          bubbleTimer = 7.5;
          cycleTimer = 48.0;
        }
      }
    },
  };
}

/**
 * 3. Bey Camii Önü Hayır Lokması Standı (Grants +1 Lokma Gücü)
 */
export function createBeyCamiiLokmaStand(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): LokmaStandRig {
  const group = new THREE.Group();
  const lx = 33.8;
  const lz = -26.8;
  group.position.set(lx, 0, lz);

  // Stone Serving Counter Base
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 1.35), mats.travertine);
  counter.position.y = 0.46;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.1, 1.5), mats.darkTimber);
  counterTop.position.y = 0.96;
  group.add(counterTop);

  // Copper Cauldron (Bakır Kazan) & Glowing Embers
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb86538,
    roughness: 0.28,
    metalness: 0.8,
  });
  const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.52, 16), copperMat);
  cauldron.position.set(-0.75, 1.18, 0);
  cauldron.castShadow = true;
  group.add(cauldron);

  // Golden Sizzling Lokma Rings inside Cauldron
  const lokmaMat = new THREE.MeshStandardMaterial({ color: 0xe6a135, roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    const lok = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 6, 10), lokmaMat);
    lok.rotation.x = Math.PI / 2;
    lok.position.set(-0.75 + Math.cos(ang) * 0.24, 1.44, Math.sin(ang) * 0.24);
    group.add(lok);
  }

  // Stack of Paper Serving Plates & Syrup Bowl
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf6f3eb, roughness: 0.65 });
  const plates = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.22, 12), plateMat);
  plates.position.set(0.55, 1.12, 0.15);
  group.add(plates);

  const syrupBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.2, 12), mats.brass);
  syrupBowl.position.set(1.05, 1.1, -0.15);
  group.add(syrupBowl);

  // Friendly Attendant pouring Lokma (Sparrow Sim sculpted chef figure)
  const attendantRig = createSculptedHumanRig(
    {
      skinHex: 0xe3b690,
      shirtHex: 0xf0ece1,
      pantsHex: 0x3b4856,
      hairHex: 0x3b2a22,
      scarfHex: SPARROW_PALETTE.coatRose,
      hairStyle: 'short',
      hatStyle: 'chef_toque',
      apron: true,
    },
    { forwardIsNegZ: false }
  );
  attendantRig.root.position.set(-0.2, 0, -1.0);
  group.add(attendantRig.root);

  // Subtle Warm Steam Puffs over Cauldron
  const steamGeo = new THREE.SphereGeometry(0.16, 6, 6);
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xf7f2e8,
    transparent: true,
    opacity: 0.42,
  });
  const steamPuffs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(steamGeo, steamMat);
    puff.position.set(-0.75, 1.6 + i * 0.25, 0);
    group.add(puff);
    steamPuffs.push(puff);
  }

  // Interactive Amber Ground Ring
  const ringGeo = new THREE.RingGeometry(1.4, 1.75, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xe6a135,
    emissive: new THREE.Color(0xe6a135),
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.08, 1.75);
  group.add(ring);

  const clickTarget = makeClickProxy(1.8, 2.0, 'lokma');
  group.add(clickTarget);

  colliders.push({
    minX: lx - 1.75,
    maxX: lx + 1.75,
    minZ: lz - 1.2,
    maxZ: lz + 0.85,
  });

  let servePopTimer = 0;

  return {
    group,
    clickTarget,
    pos: [lx, lz],
    triggerServeEffect: () => {
      servePopTimer = 1.4;
    },
    update: (dt: number, elapsed: number) => {
      steamPuffs.forEach((puff, i) => {
        const t = (elapsed * 0.55 + i * 0.2) % 1;
        puff.position.y = 1.55 + t * 1.45;
        puff.position.x = -0.75 + Math.sin(elapsed * 2 + i) * 0.14;
        puff.scale.setScalar(0.55 + Math.sin(t * Math.PI) * 0.75);
      });

      attendantRig.updateWave(servePopTimer > 0, dt, elapsed, 2.5);

      if (servePopTimer > 0) {
        servePopTimer = Math.max(0, servePopTimer - dt);
        ringMat.emissiveIntensity = 1.5;
        ring.scale.setScalar(1.25);
      } else {
        ringMat.emissiveIntensity = 0.55 + Math.sin(elapsed * 2.5) * 0.15;
        ring.scale.setScalar(1.0 + Math.sin(elapsed * 2.5) * 0.05);
      }
    },
  };
}
