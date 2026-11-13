import * as THREE from 'three';
import { VehicleConfig } from '../types/game';

export interface VehicleRig {
  root: THREE.Group;
  tiltGroup: THREE.Group;
  wheels: THREE.Object3D[];
  steerPivots: THREE.Object3D[];
  pedalCrank?: THREE.Object3D;
  headlightGlowMeshes: THREE.Mesh[];
  dispose: () => void;
}

function makePaintMaterial(config: VehicleConfig): THREE.MeshPhysicalMaterial {
  const isGloss = config.finish === 'gloss';
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(config.color),
    roughness: isGloss ? 0.22 : 0.68,
    metalness: isGloss ? 0.35 : 0.08,
    clearcoat: isGloss ? 0.9 : 0.08,
    clearcoatRoughness: isGloss ? 0.12 : 0.65,
  });
}

function addContactShadow(
  parent: THREE.Group,
  shadowTex: THREE.Texture,
  width: number,
  length: number
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, length), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.035;
  parent.add(plane);
  return plane;
}

function createWheel(
  radius: number,
  width: number,
  tireMat: THREE.Material,
  rimMat: THREE.Material,
  spokes = false
): THREE.Group {
  const wheel = new THREE.Group();

  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 20);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);

  const rimGeo = new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, width + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheel.add(rim);

  const hubGeo = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, width + 0.05, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, rimMat);
  wheel.add(hub);

  if (spokes) {
    const spokeGeo = new THREE.CylinderGeometry(0.014, 0.014, radius * 1.24, 6);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(spokeGeo, rimMat);
      sp.rotation.x = (i * Math.PI) / 4;
      wheel.add(sp);
    }
  }

  return wheel;
}

function buildCar(
  config: VehicleConfig,
  shadowTex: THREE.Texture,
  isSoftwareGl: boolean
): VehicleRig {
  const root = new THREE.Group();
  addContactShadow(root, shadowTex, 2.3, 4.1);

  const tiltGroup = new THREE.Group();
  root.add(tiltGroup);

  const paintMat = makePaintMaterial(config);
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.accentColor),
    roughness: 0.35,
    metalness: 0.65,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x263847,
    roughness: 0.08,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.35,
    transparent: true,
    opacity: isSoftwareGl ? 0.72 : 0.92,
    ior: 1.5,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.88,
    metalness: 0.04,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd9dfe6,
    roughness: 0.2,
    metalness: 0.88,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff4d6,
    emissive: new THREE.Color(0xffd27d),
    emissiveIntensity: 0.25,
    roughness: 0.15,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xb92b27,
    emissive: new THREE.Color(0xff3b30),
    emissiveIntensity: 0.3,
    roughness: 0.25,
  });

  // 1. Extruded beveled main body silhouette (side profile extruded along X)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-1.62, 0.28);
  bodyShape.lineTo(1.62, 0.28);
  bodyShape.lineTo(1.68, 0.62);
  bodyShape.lineTo(1.52, 0.84);
  bodyShape.lineTo(0.88, 0.92);
  bodyShape.lineTo(0.45, 1.38);
  bodyShape.lineTo(-0.78, 1.38);
  bodyShape.lineTo(-1.42, 0.94);
  bodyShape.lineTo(-1.66, 0.74);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.46,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 2,
  });
  bodyGeo.translate(0, 0, -0.73);
  bodyGeo.rotateY(Math.PI / 2); // Forward is -Z or +Z: rotateY(PI/2) makes +X profile point to -Z
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  tiltGroup.add(bodyMesh);

  // 2. Cabin glass band
  const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.42, 1.42), glassMat);
  glassMesh.position.set(0, 1.13, 0.1);
  tiltGroup.add(glassMesh);

  // 3. Lower rocker / bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.14, 0.14), chromeMat);
  frontBumper.position.set(0, 0.36, -1.68);
  frontBumper.castShadow = true;
  tiltGroup.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.14, 0.14), chromeMat);
  rearBumper.position.set(0, 0.36, 1.66);
  rearBumper.castShadow = true;
  tiltGroup.add(rearBumper);

  // Front grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.06), accentMat);
  grille.position.set(0, 0.56, -1.69);
  tiltGroup.add(grille);

  // 4. Headlights & Taillights
  const headlightGlowMeshes: THREE.Mesh[] = [];
  [-0.5, 0.5].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 14), headMat);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(x, 0.62, -1.68);
    tiltGroup.add(hl);
    headlightGlowMeshes.push(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.06), tailMat);
    tl.position.set(x, 0.66, 1.66);
    tiltGroup.add(tl);

    // Side mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.12), paintMat);
    mirror.position.set(x > 0 ? 0.86 : -0.86, 0.96, -0.45);
    tiltGroup.add(mirror);
  });

  // 5. Optional Heritage Stripe
  if (config.hasStripe) {
    const hoodStripe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.72), accentMat);
    hoodStripe.position.set(0, 0.9, -1.16);
    hoodStripe.rotation.x = 0.12;
    tiltGroup.add(hoodStripe);

    const roofStripe = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 1.15), accentMat);
    roofStripe.position.set(0, 1.46, 0.15);
    tiltGroup.add(roofStripe);
  }

  // 6. Optional Roof Rack & Suitcase
  if (config.hasAccessory) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(0, 1.48, 0.18);
    const barGeo = new THREE.BoxGeometry(1.06, 0.04, 0.06);
    [-0.4, 0.4].forEach((z) => {
      const bar = new THREE.Mesh(barGeo, chromeMat);
      bar.position.z = z;
      rackGroup.add(bar);
    });
    [-0.5, 0.5].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.95), chromeMat);
      rail.position.x = x;
      rackGroup.add(rail);
    });
    const suitcaseMat = new THREE.MeshStandardMaterial({ color: 0x8f5632, roughness: 0.72 });
    const suitcase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.46), suitcaseMat);
    suitcase.position.set(0, 0.14, 0);
    suitcase.castShadow = true;
    rackGroup.add(suitcase);
    tiltGroup.add(rackGroup);
  }

  // 7. 4 Multi-part Wheels (Front in steering pivots)
  const wheels: THREE.Object3D[] = [];
  const steerPivots: THREE.Object3D[] = [];
  const wheelCoords: [number, number, boolean][] = [
    [-0.78, -1.04, true],
    [0.78, -1.04, true],
    [-0.78, 1.04, false],
    [0.78, 1.04, false],
  ];

  wheelCoords.forEach(([wx, wz, isFront]) => {
    const wheel = createWheel(0.33, 0.22, tireMat, accentMat, false);
    if (isFront) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, 0.33, wz);
      pivot.add(wheel);
      root.add(pivot);
      steerPivots.push(pivot);
    } else {
      wheel.position.set(wx, 0.33, wz);
      root.add(wheel);
    }
    wheels.push(wheel);
  });

  return {
    root,
    tiltGroup,
    wheels,
    steerPivots,
    headlightGlowMeshes,
    dispose: () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
          else m.material.dispose();
        }
      });
    },
  };
}

function buildBicycle(config: VehicleConfig, shadowTex: THREE.Texture): VehicleRig {
  const root = new THREE.Group();
  addContactShadow(root, shadowTex, 0.9, 2.3);

  const tiltGroup = new THREE.Group();
  root.add(tiltGroup);

  const frameMat = makePaintMaterial(config);
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.accentColor),
    roughness: 0.32,
    metalness: 0.72,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x7b4728,
    roughness: 0.68,
    metalness: 0.05,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x262626,
    roughness: 0.85,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff2cf,
    emissive: new THREE.Color(0xffcc66),
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });

  // Wheels
  const rearWheel = createWheel(0.38, 0.08, tireMat, accentMat, true);
  rearWheel.position.set(0, 0.38, 0.66);
  tiltGroup.add(rearWheel);

  const forkPivot = new THREE.Group();
  forkPivot.position.set(0, 0.38, -0.68);
  tiltGroup.add(forkPivot);

  const frontWheel = createWheel(0.38, 0.08, tireMat, accentMat, true);
  forkPivot.add(frontWheel);

  // Fork tubes + Stem + Curved Handlebars
  const forkGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.62, 8);
  const fork = new THREE.Mesh(forkGeo, frameMat);
  fork.position.set(0, 0.3, 0.06);
  fork.rotation.x = -0.22;
  fork.castShadow = true;
  forkPivot.add(fork);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.68, 8), accentMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 0.68, 0.12);
  forkPivot.add(handleBar);

  [-0.31, 0.31].forEach((gx) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 8), leatherMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(gx, 0.68, 0.15);
    forkPivot.add(grip);
  });

  // Brass front headlamp
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.09, 12), headMat);
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(0, 0.56, -0.02);
  forkPivot.add(lamp);

  // Optional Wicker Basket with Aydın Figs
  if (config.hasAccessory) {
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xc29864, roughness: 0.88 });
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.28), basketMat);
    basket.position.set(0, 0.54, -0.14);
    basket.castShadow = true;
    forkPivot.add(basket);

    const figMat = new THREE.MeshStandardMaterial({ color: 0x623b4e, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const fig = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), figMat);
      fig.position.set(-0.08 + i * 0.08, 0.68, -0.14);
      forkPivot.add(fig);
    }
  }

  // Tubular frame (seat tube, top tube, down tube, rear stays)
  const addTube = (p1: THREE.Vector3, p2: THREE.Vector3, r = 0.025, mat: THREE.Material = frameMat) => {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    cyl.position.copy(p1).addScaledVector(dir, 0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    cyl.castShadow = true;
    tiltGroup.add(cyl);
  };

  const bb = new THREE.Vector3(0, 0.34, 0.1);
  const seatTop = new THREE.Vector3(0, 0.88, 0.26);
  const headTop = new THREE.Vector3(0, 0.88, -0.52);
  const headBot = new THREE.Vector3(0, 0.68, -0.58);
  const rearAxle = new THREE.Vector3(0, 0.38, 0.66);

  addTube(bb, seatTop);
  addTube(seatTop, headTop);
  addTube(bb, headBot);
  addTube(headBot, headTop, 0.03);
  addTube(bb, rearAxle, 0.018);
  addTube(seatTop.clone().add(new THREE.Vector3(0, -0.06, 0.02)), rearAxle, 0.018);

  if (config.hasStripe) {
    addTube(
      new THREE.Vector3(0, 0.88, -0.12),
      new THREE.Vector3(0, 0.88, -0.36),
      0.029,
      accentMat
    );
  }

  // Saddle
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.28), leatherMat);
  saddle.position.set(0, 0.96, 0.3);
  saddle.castShadow = true;
  tiltGroup.add(saddle);

  // Crank & Pedals
  const pedalCrank = new THREE.Group();
  pedalCrank.position.copy(bb);
  const crankBar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.04), accentMat);
  pedalCrank.add(crankBar);
  const pedalL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.08), leatherMat);
  pedalL.position.set(-0.14, -0.1, 0);
  pedalCrank.add(pedalL);
  const pedalR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.08), leatherMat);
  pedalR.position.set(0.14, 0.1, 0);
  pedalCrank.add(pedalR);
  tiltGroup.add(pedalCrank);

  return {
    root,
    tiltGroup,
    wheels: [frontWheel, rearWheel],
    steerPivots: [forkPivot],
    pedalCrank,
    headlightGlowMeshes: [lamp],
    dispose: () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
          else m.material.dispose();
        }
      });
    },
  };
}

function buildMotorcycle(
  config: VehicleConfig,
  shadowTex: THREE.Texture,
  isSoftwareGl: boolean
): VehicleRig {
  const root = new THREE.Group();
  addContactShadow(root, shadowTex, 1.15, 2.5);

  const tiltGroup = new THREE.Group();
  root.add(tiltGroup);

  const paintMat = makePaintMaterial(config);
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.accentColor),
    roughness: 0.28,
    metalness: 0.75,
  });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3621,
    roughness: 0.65,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.86,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd5dce3,
    roughness: 0.18,
    metalness: 0.9,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d8,
    emissive: new THREE.Color(0xffcf70),
    emissiveIntensity: 0.3,
    roughness: 0.15,
  });

  // Wheels
  const rearWheel = createWheel(0.28, 0.16, tireMat, accentMat, false);
  rearWheel.position.set(0, 0.28, 0.68);
  tiltGroup.add(rearWheel);

  const frontPivot = new THREE.Group();
  frontPivot.position.set(0, 0.28, -0.72);
  tiltGroup.add(frontPivot);

  const frontWheel = createWheel(0.28, 0.15, tireMat, accentMat, false);
  frontPivot.add(frontWheel);

  // Front mudguard + fork + sculpted legshield
  const fender = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.38), paintMat);
  fender.position.set(0, 0.24, -0.02);
  fender.castShadow = true;
  frontPivot.add(fender);

  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 0.16), paintMat);
  shield.position.set(0, 0.56, 0.08);
  shield.rotation.x = -0.22;
  shield.castShadow = true;
  frontPivot.add(shield);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 10), chromeMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 0.88, 0.14);
  frontPivot.add(handleBar);

  const headlamp = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 14), headMat);
  headlamp.rotation.x = Math.PI / 2;
  headlamp.position.set(0, 0.88, 0.02);
  frontPivot.add(headlamp);

  // Main rear body cowl (extruded scooter rear)
  const cowlGeo = new THREE.BoxGeometry(0.54, 0.44, 1.05);
  const cowl = new THREE.Mesh(cowlGeo, paintMat);
  cowl.position.set(0, 0.54, 0.48);
  cowl.castShadow = true;
  tiltGroup.add(cowl);

  // Floorboard
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.75), tireMat);
  floor.position.set(0, 0.28, -0.18);
  tiltGroup.add(floor);

  // Twin leather seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.74), leatherMat);
  seat.position.set(0, 0.82, 0.42);
  seat.castShadow = true;
  tiltGroup.add(seat);

  // Chrome exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 10), chromeMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.3, 0.3, 0.58);
  tiltGroup.add(exhaust);

  // Optional Retro Stripe
  if (config.hasStripe) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.69, 0.18), accentMat);
    stripe.position.set(0, 0.56, 0.075);
    stripe.rotation.x = -0.22;
    frontPivot.add(stripe);
  }

  // Optional Windshield + Rear Top-box
  if (config.hasAccessory) {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdff1f7,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.65,
      transparent: true,
      opacity: isSoftwareGl ? 0.45 : 0.85,
    });
    const shieldGlass = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.03), glassMat);
    shieldGlass.position.set(0, 1.08, 0.08);
    shieldGlass.rotation.x = -0.18;
    frontPivot.add(shieldGlass);

    const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.36), paintMat);
    topBox.position.set(0, 0.94, 1.02);
    topBox.castShadow = true;
    tiltGroup.add(topBox);

    const topBoxTrim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.38), accentMat);
    topBoxTrim.position.set(0, 0.94, 1.02);
    tiltGroup.add(topBoxTrim);
  }

  return {
    root,
    tiltGroup,
    wheels: [frontWheel, rearWheel],
    steerPivots: [frontPivot],
    headlightGlowMeshes: [headlamp],
    dispose: () => {
      root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
          else m.material.dispose();
        }
      });
    },
  };
}

export function createVehicleModel(
  config: VehicleConfig,
  shadowTex: THREE.Texture,
  isSoftwareGl: boolean
): VehicleRig {
  if (config.type === 'bicycle') {
    return buildBicycle(config, shadowTex);
  }
  if (config.type === 'motorcycle') {
    return buildMotorcycle(config, shadowTex, isSoftwareGl);
  }
  return buildCar(config, shadowTex, isSoftwareGl);
}
