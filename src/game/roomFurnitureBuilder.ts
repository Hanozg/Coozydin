import * as THREE from 'three';
import { RoomFurnitureId } from '../types/game';

export interface BuiltFurnitureVisual {
  group: THREE.Group;
  spinPart?: THREE.Object3D;
  lampShadeMat?: THREE.MeshStandardMaterial;
}

export function disposeFurnitureVisualGroup(grp: THREE.Group): void {
  const mats = new Set<THREE.Material>();
  grp.traverse((obj) => {
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
  grp.clear();
}

export function buildFurnitureVariant(
  id: RoomFurnitureId,
  styleId = 'classic'
): BuiltFurnitureVisual {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x735036, roughness: 0.76 });
  const lightOakMat = new THREE.MeshStandardMaterial({ color: 0xb78b5c, roughness: 0.75 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xe6d4b5, roughness: 0.86 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a857, roughness: 0.35, metalness: 0.65 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x26282e, roughness: 0.45, metalness: 0.5 });

  let spinPart: THREE.Object3D | undefined;
  let lampShadeMat: THREE.MeshStandardMaterial | undefined;

  if (id === 'armchair') {
    if (styleId === 'mustard_velvet') {
      const mustardMat = new THREE.MeshStandardMaterial({ color: 0xd4923f, roughness: 0.88 });
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.54, 0.34, 16), mustardMat);
      seat.position.y = 0.34;
      seat.castShadow = true;
      const back = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.56, 0.7, 16, 1, false, Math.PI * 0.65, Math.PI * 1.7),
        mustardMat
      );
      back.position.set(0, 0.62, -0.05);
      back.castShadow = true;
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.16), creamMat);
      cushion.position.set(0, 0.62, -0.22);
      cushion.rotation.x = -0.22;
      // Brass legs
      [
        [-0.36, -0.32],
        [0.36, -0.32],
        [-0.36, 0.32],
        [0.36, 0.32],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.2, 8), brassMat);
        leg.position.set(lx, 0.1, lz);
        g.add(leg);
      });
      // Matching Footstool Ottoman
      const ottoman = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.2, 14), mustardMat);
      ottoman.position.set(0.18, 0.22, 0.78);
      ottoman.castShadow = true;
      const ottLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.14, 10), brassMat);
      ottLeg.position.set(0.18, 0.07, 0.78);
      g.add(seat, back, cushion, ottoman, ottLeg);
    } else if (styleId === 'ege_rattan') {
      const rattanMat = new THREE.MeshStandardMaterial({ color: 0xc29860, roughness: 0.84 });
      const blueCushionMat = new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.88 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.14, 1.06), lightOakMat);
      base.position.y = 0.22;
      base.castShadow = true;
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.2, 0.94), blueCushionMat);
      cushion.position.y = 0.38;
      cushion.castShadow = true;
      const backFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.78, 0.12), rattanMat);
      backFrame.position.set(0, 0.68, -0.46);
      const backCushion = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.52, 0.18), blueCushionMat);
      backCushion.position.set(0, 0.68, -0.3);
      backCushion.rotation.x = -0.18;
      const throwPillow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.14), creamMat);
      throwPillow.position.set(-0.22, 0.62, -0.16);
      throwPillow.rotation.set(-0.2, 0, 0.18);
      [-0.54, 0.54].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 1.0), lightOakMat);
        arm.position.set(ax, 0.44, 0);
        g.add(arm);
      });
      g.add(base, cushion, backFrame, backCushion, throwPillow);
    } else if (styleId === 'emerald_lounge') {
      const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x35644a, roughness: 0.8 });
      const throwMat = new THREE.MeshStandardMaterial({ color: 0xd9b98b, roughness: 0.92 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.4, 1.08), emeraldMat);
      seat.position.y = 0.3;
      seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.92, 0.28), emeraldMat);
      back.position.set(0, 0.74, -0.4);
      back.castShadow = true;
      [-0.54, 0.54].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.04, 10), emeraldMat);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(ax, 0.54, 0);
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.46, 1.02), emeraldMat);
        side.position.set(ax, 0.34, 0);
        g.add(arm, side);
      });
      // Gold button tufts
      [-0.25, 0, 0.25].forEach((bx) => {
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), brassMat);
        tuft.position.set(bx, 0.82, -0.25);
        g.add(tuft);
      });
      const throwBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.56), throwMat);
      throwBlanket.position.set(0.55, 0.46, 0.18);
      g.add(seat, back, throwBlanket);
    } else {
      // 'classic'
      const fabricMat = new THREE.MeshStandardMaterial({ color: 0x9b4f3a, roughness: 0.85 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.05), fabricMat);
      seat.position.y = 0.3;
      seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.25), fabricMat);
      back.position.set(0, 0.72, -0.4);
      back.castShadow = true;
      [-0.5, 0.5].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 1.02), fabricMat);
        arm.position.set(ax, 0.46, 0);
        g.add(arm);
      });
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.16), creamMat);
      pillow.position.set(0, 0.62, -0.2);
      pillow.rotation.x = -0.25;
      g.add(seat, back, pillow);
    }
  } else if (id === 'turntable') {
    const vinylMat = new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.3 });
    if (styleId === 'gramophone_stand') {
      const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x633322, roughness: 0.68 });
      const antiqueBrassMat = new THREE.MeshStandardMaterial({
        color: 0xd9ab52,
        roughness: 0.26,
        metalness: 0.78,
        side: THREE.DoubleSide,
      });
      // Four carved pedestal legs
      [
        [-0.24, -0.22],
        [0.24, -0.22],
        [-0.24, 0.22],
        [0.24, 0.22],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.028, 0.26, 8), mahoganyMat);
        leg.position.set(lx, 0.13, lz);
        leg.castShadow = true;
        g.add(leg);
      });
      // Tall record-storage cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.74, 0.58), mahoganyMat);
      cabinet.position.y = 0.63;
      cabinet.castShadow = true;
      const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.64), mahoganyMat);
      trimTop.position.y = 1.02;
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.03), woodMat);
      doorPanel.position.set(0, 0.62, 0.295);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), brassMat);
      knob.position.set(0.16, 0.62, 0.32);
      // Side hand-crank
      const crankShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), brassMat);
      crankShaft.rotation.z = Math.PI / 2;
      crankShaft.position.set(0.36, 0.9, 0.04);
      const crankHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), woodMat);
      crankHandle.rotation.x = Math.PI / 2;
      crankHandle.position.set(0.42, 0.86, 0.08);
      // Platter & spinning shellac disc
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.04, 20), brassMat);
      platter.position.set(-0.04, 1.07, 0.06);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 20), vinylMat);
      disc.position.set(-0.04, 1.1, 0.06);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 14), creamMat);
      label.position.set(0, 0.004, 0);
      disc.add(label);
      spinPart = disc;
      // Brass tonearm + big flared gramophone horn
      const armBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.16, 10), brassMat);
      armBase.position.set(0.19, 1.13, -0.14);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.38, 10), antiqueBrassMat);
      neck.position.set(0.16, 1.32, -0.17);
      neck.rotation.x = 0.25;
      const hornBell = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.48, 18, 1, true),
        antiqueBrassMat
      );
      hornBell.position.set(0.06, 1.56, 0.04);
      hornBell.rotation.set(-0.88, -0.15, 0.12);
      g.add(cabinet, trimTop, doorPanel, knob, crankShaft, crankHandle, platter, disc, armBase, neck, hornBell);
    } else if (styleId === 'mega_amp_stack') {
      const tolexMat = new THREE.MeshStandardMaterial({ color: 0x212329, roughness: 0.78 });
      const grilleMat = new THREE.MeshStandardMaterial({ color: 0x3b352f, roughness: 0.94 });
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.65 });
      const pilotGlowMat = new THREE.MeshStandardMaterial({
        color: 0xffaa44,
        emissive: 0xff7b1c,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      // Bottom 4x12 speaker cabinet on casters
      [
        [-0.44, -0.2],
        [0.44, -0.2],
        [-0.44, 0.2],
        [0.44, 0.2],
      ].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 10), darkMetalMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.045, wz);
        g.add(wheel);
      });
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.02, 0.56), tolexMat);
      cab.position.y = 0.6;
      cab.castShadow = true;
      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.04), grilleMat);
      grille.position.set(0, 0.6, 0.27);
      const borderFrame = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.94, 0.02), brassMat);
      borderFrame.position.set(0, 0.6, 0.262);
      g.add(cab, borderFrame, grille);
      // 4 visible speaker cones (2x2)
      [-0.24, 0.24].forEach((cx) => {
        [0.37, 0.83].forEach((cy) => {
          const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.11, 0.04, 18), coneMat);
          cone.rotation.x = Math.PI / 2;
          cone.position.set(cx, cy, 0.295);
          const dustCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), darkMetalMat);
          dustCap.position.set(cx, cy, 0.31);
          g.add(cone, dustCap);
        });
      });
      // Top tube-amplifier head
      const ampHead = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.36, 0.46), tolexMat);
      ampHead.position.y = 1.3;
      ampHead.castShadow = true;
      const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.03), brassMat);
      faceplate.position.set(0, 1.24, 0.225);
      const ventPanel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.03), grilleMat);
      ventPanel.position.set(0, 1.38, 0.225);
      const pilotLamp = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), pilotGlowMat);
      pilotLamp.position.set(-0.38, 1.24, 0.245);
      g.add(ampHead, faceplate, ventPanel, pilotLamp);
      for (let k = 0; k < 6; k++) {
        const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 10), darkMetalMat);
        knob.rotation.x = Math.PI / 2;
        knob.position.set(-0.22 + k * 0.11, 1.24, 0.245);
        g.add(knob);
      }
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.06), darkMetalMat);
      handle.position.set(0, 1.5, 0);
      g.add(handle);
    } else if (styleId === 'home_cinema_hifi') {
      const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x232730, roughness: 0.55 });
      const baffleMat = new THREE.MeshStandardMaterial({ color: 0x17191f, roughness: 0.72 });
      const copperConeMat = new THREE.MeshStandardMaterial({
        color: 0xc97b42,
        roughness: 0.35,
        metalness: 0.65,
      });
      const vfdGlowMat = new THREE.MeshStandardMaterial({
        color: 0x6ce3ff,
        emissive: 0x2f9bc9,
        emissiveIntensity: 1.25,
        roughness: 0.25,
      });
      // Center oak AV console + Hi-Fi receiver + Soundbar
      const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.44, 0.48), lightOakMat);
      consoleBox.position.y = 0.24;
      consoleBox.castShadow = true;
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.38), charcoalMat);
      receiver.position.set(-0.14, 0.54, -0.02);
      const receiverDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.02), vfdGlowMat);
      receiverDisplay.position.set(-0.18, 0.55, 0.175);
      const volDial = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 14), brassMat);
      volDial.rotation.x = Math.PI / 2;
      volDial.position.set(0.1, 0.54, 0.175);
      const soundbar = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.1, 0.12), baffleMat);
      soundbar.position.set(0, 0.51, 0.17);
      // Floor Subwoofer tucked front-right of receiver stand
      const subBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.38), charcoalMat);
      subBox.position.set(0.38, 0.21, 0.12);
      subBox.castShadow = true;
      const subCone = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.08, 0.03, 16), copperConeMat);
      subCone.rotation.x = Math.PI / 2;
      subCone.position.set(0.38, 0.21, 0.315);
      g.add(consoleBox, receiver, receiverDisplay, volDial, soundbar, subBox, subCone);
      // Twin tall Floorstanding Tower Speakers
      [-0.78, 0.78].forEach((tx) => {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.44, 0.34), woodMat);
        tower.position.set(tx, 0.74, -0.02);
        tower.castShadow = true;
        const baffle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.34, 0.03), baffleMat);
        baffle.position.set(tx, 0.74, 0.15);
        const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), brassMat);
        tweeter.rotation.x = Math.PI / 2;
        tweeter.position.set(tx, 1.24, 0.17);
        [0.98, 0.7, 0.42].forEach((wy) => {
          const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.055, 0.03, 14), copperConeMat);
          woofer.rotation.x = Math.PI / 2;
          woofer.position.set(tx, wy, 0.17);
          g.add(woofer);
        });
        g.add(tower, baffle, tweeter);
      });
    } else if (styleId === 'vintage_jukebox') {
      const walnutJukeMat = new THREE.MeshStandardMaterial({ color: 0x6e3a24, roughness: 0.62 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dfe6, roughness: 0.22, metalness: 0.85 });
      const neonAmberMat = new THREE.MeshStandardMaterial({
        color: 0xffbf5e,
        emissive: 0xff9124,
        emissiveIntensity: 1.35,
        roughness: 0.25,
      });
      const neonTealMat = new THREE.MeshStandardMaterial({
        color: 0x6be0d6,
        emissive: 0x2cb0a8,
        emissiveIntensity: 1.0,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.96, 0.56), walnutJukeMat);
      base.position.y = 0.48;
      base.castShadow = true;
      const archCrown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.47, 0.47, 0.56, 20, 1, false, 0, Math.PI),
        walnutJukeMat
      );
      archCrown.rotation.z = Math.PI / 2;
      archCrown.rotation.y = Math.PI / 2;
      archCrown.position.y = 0.96;
      archCrown.castShadow = true;
      // Glowing side neon tubes & upper arch ring
      [-0.41, 0.41].forEach((nx) => {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 10), neonAmberMat);
        tube.position.set(nx, 0.52, 0.27);
        g.add(tube);
      });
      const neonArch = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.036, 10, 22, Math.PI),
        neonTealMat
      );
      neonArch.position.set(0, 0.96, 0.275);
      // Lower speaker grille with chrome ribs
      const speakerFabric = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.03), neonAmberMat);
      speakerFabric.position.set(0, 0.38, 0.275);
      for (let r = -2; r <= 2; r++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.54, 0.045), chromeMat);
        rib.position.set(r * 0.11, 0.38, 0.285);
        g.add(rib);
      }
      // Illuminated song selector strip + visible horizontal spinning record stage
      const selectorBar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.12, 0.05), chromeMat);
      selectorBar.position.set(0, 0.74, 0.28);
      const recordStage = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.36), darkMetalMat);
      recordStage.position.set(0, 0.96, 0.08);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), vinylMat);
      disc.position.set(0, 1.0, 0.08);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 14), neonAmberMat);
      label.position.set(0, 0.004, 0);
      disc.add(label);
      spinPart = disc;
      g.add(base, archCrown, neonArch, speakerFabric, selectorBar, recordStage, disc);
    } else if (styleId === 'reel_to_reel') {
      const aluminumMat = new THREE.MeshStandardMaterial({ color: 0xc9cfd6, roughness: 0.32, metalness: 0.72 });
      const vuGlowMat = new THREE.MeshStandardMaterial({
        color: 0xffd78a,
        emissive: 0xffa83b,
        emissiveIntensity: 1.05,
        roughness: 0.3,
      });
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.76, 0.52), woodMat);
      rack.position.y = 0.38;
      rack.castShadow = true;
      const deckBody = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.36), aluminumMat);
      deckBody.position.set(0, 0.98, -0.02);
      deckBody.castShadow = true;
      // Twin horizontal open-reel tape platters on top deck (left spins)
      const reelPlate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.32), darkMetalMat);
      reelPlate.position.set(0, 1.21, -0.02);
      const leftReel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 20), aluminumMat);
      leftReel.position.set(-0.19, 1.24, -0.02);
      const leftTape = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18), vinylMat);
      leftReel.add(leftTape);
      spinPart = leftReel;
      const rightReel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 20), aluminumMat);
      rightReel.position.set(0.19, 1.24, -0.02);
      const rightTape = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 18), vinylMat);
      rightReel.add(rightTape);
      // Twin warm amber VU meters on front panel
      [-0.14, 0.14].forEach((vx) => {
        const vu = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.02), vuGlowMat);
        vu.position.set(vx, 1.02, 0.165);
        g.add(vu);
      });
      // Compact monitor speakers flanking the deck
      [-0.5, 0.5].forEach((sx) => {
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.24), darkMetalMat);
        mon.position.set(sx, 0.92, 0.02);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.02, 12), brassMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.set(sx, 0.91, 0.145);
        g.add(mon, cone);
      });
      g.add(rack, deckBody, reelPlate, leftReel, rightReel);
    } else if (styleId === 'retro_cream') {
      const creamCabMat = new THREE.MeshStandardMaterial({ color: 0xefe3ce, roughness: 0.7 });
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.54), creamCabMat);
      cabinet.position.y = 0.44;
      cabinet.castShadow = true;
      const platter = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.46), woodMat);
      platter.position.set(-0.08, 0.89, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 20), vinylMat);
      disc.position.set(-0.08, 0.96, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 14), brassMat);
      label.position.set(0, 0.005, 0);
      disc.add(label);
      spinPart = disc;

      // Gramophone Brass Horn
      const hornStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.34, 8), brassMat);
      hornStem.position.set(0.26, 1.04, -0.14);
      const hornBell = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.36, 14, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xd9ab52, roughness: 0.28, metalness: 0.72, side: THREE.DoubleSide })
      );
      hornBell.position.set(0.22, 1.24, -0.02);
      hornBell.rotation.set(-0.75, 0.2, 0.2);
      g.add(cabinet, platter, disc, hornStem, hornBell);
    } else if (styleId === 'vinyl_console') {
      const walnutMat = new THREE.MeshStandardMaterial({ color: 0x5d3d28, roughness: 0.72 });
      const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xb64c2e, roughness: 0.75 });
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.84, 0.56), walnutMat);
      cabinet.position.y = 0.46;
      cabinet.castShadow = true;
      // Vinyl record spines tucked in lower cubby
      for (let i = 0; i < 6; i++) {
        const rec = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.34, 0.34),
          i % 2 === 0 ? terracottaMat : creamMat
        );
        rec.position.set(-0.42 + i * 0.08, 0.3, 0.14);
        g.add(rec);
      }
      // Twin bookshelf speakers flanking turntable
      [-0.45, 0.45].forEach((sx) => {
        const spk = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.24), darkMetalMat);
        spk.position.set(sx, 1.06, -0.06);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), brassMat);
        cone.rotation.x = Math.PI / 2;
        cone.position.set(sx, 1.04, 0.065);
        g.add(spk, cone);
      });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.42), darkMetalMat);
      deck.position.set(0, 0.92, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), vinylMat);
      disc.position.set(0, 0.97, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 14), terracottaMat);
      label.position.set(0, 0.005, 0);
      disc.add(label);
      spinPart = disc;
      g.add(cabinet, deck, disc);
    } else if (styleId === 'neon_synth') {
      const navyMat = new THREE.MeshStandardMaterial({ color: 0x26384d, roughness: 0.55 });
      const glowMat = new THREE.MeshStandardMaterial({
        color: 0x6ce3ff,
        emissive: 0x3ba8db,
        emissiveIntensity: 1.3,
        roughness: 0.3,
      });
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.86, 0.56), navyMat);
      cabinet.position.y = 0.44;
      cabinet.castShadow = true;
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.04, 0.04), glowMat);
      ledBar.position.set(0, 0.85, 0.28);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.08, 0.44), darkMetalMat);
      deck.position.set(-0.12, 0.91, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), vinylMat);
      disc.position.set(-0.12, 0.96, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 14), glowMat);
      label.position.set(0, 0.005, 0);
      disc.add(label);
      spinPart = disc;
      // Studio amp + headphones
      const amp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.3), darkMetalMat);
      amp.position.set(0.38, 0.95, -0.05);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), glowMat);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0.38, 0.95, 0.11);
      g.add(cabinet, ledBar, deck, disc, amp, dial);
    } else {
      // 'classic'
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.88, 0.56), woodMat);
      cabinet.position.y = 0.44;
      cabinet.castShadow = true;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 0.44), darkMetalMat);
      deck.position.set(0, 0.92, 0);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 20), vinylMat);
      disc.position.set(-0.06, 0.98, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 14), brassMat);
      label.position.set(0, 0.005, 0);
      disc.add(label);
      spinPart = disc;
      g.add(cabinet, deck, disc);
    }
  } else if (id === 'rug') {
    if (styleId === 'aegean_round') {
      const juteMat = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 0.94 });
      const indigoMat = new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.9 });
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.03, 28), juteMat);
      outer.receiveShadow = true;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.036, 28), indigoMat);
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.042, 24), creamMat);
      g.add(outer, ring, center);
    } else if (styleId === 'anatolian_navy') {
      const navyMat = new THREE.MeshStandardMaterial({ color: 0x2a3f57, roughness: 0.92 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4a857, roughness: 0.88 });
      const outer = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.03, 2.55), navyMat);
      outer.receiveShadow = true;
      const border = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.035, 1.9), goldMat);
      const center = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 1.25), navyMat);
      const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.045, 0.7), creamMat);
      diamond.rotation.y = Math.PI / 4;
      g.add(outer, border, center, diamond);
    } else {
      const rugMat = new THREE.MeshStandardMaterial({ color: 0x9e4738, roughness: 0.92 });
      const outer = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.03, 2.5), rugMat);
      outer.receiveShadow = true;
      const inner = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.036, 1.8), creamMat);
      const center = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.04, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.9 })
      );
      g.add(outer, inner, center);
    }
  } else if (id === 'teatable') {
    if (styleId === 'marble_coffee') {
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf2ede3, roughness: 0.35 });
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 20), marbleMat);
      top.position.y = 0.44;
      top.castShadow = true;
      [-0.32, 0.32].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.44, 8), brassMat);
        leg.position.set(lx, 0.22, 0);
        g.add(leg);
      });
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.1, 10), creamMat);
      cup.position.set(0.14, 0.52, 0.08);
      const lokumPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.03, 14), brassMat);
      lokumPlate.position.set(-0.14, 0.49, -0.04);
      g.add(top, cup, lokumPlate);
    } else if (styleId === 'floor_sofra') {
      const copperMat = new THREE.MeshStandardMaterial({ color: 0xb85432, roughness: 0.32, metalness: 0.65 });
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.07, 20), lightOakMat);
      top.position.y = 0.32;
      top.castShadow = true;
      [-0.36, 0.36].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.56), woodMat);
        leg.position.set(lx, 0.16, 0);
        g.add(leg);
      });
      const samovarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.34, 12), copperMat);
      samovarBody.position.set(-0.14, 0.52, -0.05);
      const samovarTop = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), brassMat);
      samovarTop.position.set(-0.14, 0.72, -0.05);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.03, 12), creamMat);
      plate.position.set(0.18, 0.37, 0.12);
      g.add(top, samovarBody, samovarTop, plate);
    } else {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), woodMat);
      table.position.y = 0.42;
      table.castShadow = true;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.42, 10), woodMat);
      leg.position.y = 0.21;
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.04, 16), brassMat);
      tray.position.y = 0.47;
      const teaGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.045, 0.14, 10),
        new THREE.MeshStandardMaterial({ color: 0x9b2d20, roughness: 0.25 })
      );
      teaGlass.position.set(0.08, 0.56, 0.04);
      const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), brassMat);
      teapot.position.set(-0.1, 0.56, -0.04);
      g.add(table, leg, tray, teaGlass, teapot);
    }
  } else if (id === 'bookshelf') {
    const bookColors = [0xe6d4b5, 0x3b6e8c, 0x586f4e, 0xd4a857, 0x7b4c65];
    const redBookshelfMat = new THREE.MeshStandardMaterial({ color: 0xb83229, roughness: 0.76 });
    const bodyMat =
      styleId === 'library_arch'
        ? new THREE.MeshStandardMaterial({ color: 0xe6dac4, roughness: 0.8 })
        : styleId === 'plant_shelf'
          ? lightOakMat
          : redBookshelfMat;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.35, 0.44), bodyMat);
    frame.position.y = 1.175;
    frame.castShadow = true;
    g.add(frame);

    if (styleId === 'library_arch') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.44, 16, 1, false, 0, Math.PI), bodyMat);
      crown.rotation.z = Math.PI / 2;
      crown.rotation.y = Math.PI / 2;
      crown.position.y = 2.35;
      g.add(crown);
    }
    if (styleId === 'plant_shelf') {
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x5d8a48, roughness: 0.82 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.2, 10), creamMat);
      pot.position.set(0.38, 2.45, 0.05);
      const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), vineMat);
      foliage.position.set(0.38, 2.62, 0.08);
      const trail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.08), vineMat);
      trail.position.set(0.46, 2.15, 0.22);
      g.add(pot, foliage, trail);
    }

    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 0.52 + shelf * 0.68;
      for (let b = 0; b < 5; b++) {
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.36 + ((b + shelf) % 2) * 0.08, 0.28),
          new THREE.MeshStandardMaterial({
            color: bookColors[(b + shelf * 2) % bookColors.length],
            roughness: 0.75,
          })
        );
        book.position.set(-0.42 + b * 0.2, sy, 0.14);
        g.add(book);
      }
    }
  } else if (id === 'desk') {
    const deskWood = styleId === 'architect_draft' ? lightOakMat : woodMat;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.92), deskWood);
    top.position.y = 0.88;
    top.castShadow = true;
    [
      [-0.82, 0.44, -0.36],
      [0.82, 0.44, -0.36],
      [-0.82, 0.44, 0.36],
      [0.82, 0.44, 0.36],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.88, 0.1), deskWood);
      leg.position.set(lx, ly, lz);
      g.add(leg);
    });
    if (styleId === 'architect_draft') {
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.78), creamMat);
      drawer.position.set(0.45, 0.72, 0);
      g.add(drawer);
    }
    const agendaCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.04, 0.4),
      new THREE.MeshStandardMaterial({
        color: styleId === 'architect_draft' ? 0xb64c2e : 0x3b6e8c,
        roughness: 0.7,
      })
    );
    agendaCover.position.set(-0.22, 0.95, 0.08);
    const agendaPages = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.05, 0.36),
      new THREE.MeshStandardMaterial({ color: 0xf7efe0, roughness: 0.85 })
    );
    agendaPages.position.set(-0.22, 0.96, 0.08);

    const shadeColor = styleId === 'architect_draft' ? 0x3e7a56 : 0xf4deb3;
    lampShadeMat = new THREE.MeshStandardMaterial({
      color: shadeColor,
      emissive: styleId === 'architect_draft' ? 0x8ef5a8 : 0xffb764,
      emissiveIntensity: 1.1,
      roughness: 0.6,
    });
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12), brassMat);
    lampBase.position.set(0.58, 0.97, -0.18);
    const lampNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), brassMat);
    lampNeck.position.set(0.58, 1.2, -0.18);
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 14), lampShadeMat);
    lampShade.position.set(0.58, 1.45, -0.18);
    g.add(top, agendaCover, agendaPages, lampBase, lampNeck, lampShade);
  } else if (id === 'plant') {
    if (styleId === 'fig_ceramic') {
      const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.4 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.56, 14), ceramicMat);
      pot.position.y = 0.28;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.34, 0.14, 14), creamMat);
      band.position.y = 0.42;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.95, 8), woodMat);
      trunk.position.y = 0.9;
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x527a44, roughness: 0.82 });
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.58, 1), leafMat);
      crown.position.y = 1.54;
      crown.castShadow = true;
      const figMat = new THREE.MeshStandardMaterial({ color: 0x6c4266, roughness: 0.7 });
      [
        [0.24, 1.38, 0.3],
        [-0.22, 1.48, 0.24],
      ].forEach(([fx, fy, fz]) => {
        const fig = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), figMat);
        fig.position.set(fx, fy, fz);
        g.add(fig);
      });
      g.add(pot, band, trunk, crown);
    } else if (styleId === 'monstera_wicker') {
      const wickerMat = new THREE.MeshStandardMaterial({ color: 0x9c744a, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x3b6b42, roughness: 0.76 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.52, 14), wickerMat);
      pot.position.y = 0.26;
      g.add(pot);
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 6), leafMat);
        stem.position.set(Math.cos(ang) * 0.18, 0.85, Math.sin(ang) * 0.18);
        stem.rotation.z = -Math.cos(ang) * 0.35;
        stem.rotation.x = Math.sin(ang) * 0.35;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.44), leafMat);
        leaf.position.set(Math.cos(ang) * 0.34, 1.2 + (i % 2) * 0.14, Math.sin(ang) * 0.34);
        leaf.rotation.y = -ang;
        leaf.rotation.x = 0.25;
        g.add(stem, leaf);
      }
    } else {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.24, 0.52, 12),
        new THREE.MeshStandardMaterial({ color: 0xb66041, roughness: 0.85 })
      );
      pot.position.y = 0.26;
      pot.castShadow = true;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.95, 8), woodMat);
      trunk.position.y = 0.85;
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.56, 1),
        new THREE.MeshStandardMaterial({ color: 0x677e56, roughness: 0.84 })
      );
      crown.position.y = 1.48;
      crown.castShadow = true;
      g.add(pot, trunk, crown);
    }
  } else if (id === 'wallart') {
    if (styleId === 'aydin_mosaic') {
      const turqMat = new THREE.MeshStandardMaterial({ color: 0x2c6f7e, roughness: 0.55 });
      const cobaltMat = new THREE.MeshStandardMaterial({ color: 0x2b4670, roughness: 0.55 });
      [-0.52, 0, 0.52].forEach((px, idx) => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.88, 0.08), creamMat);
        frame.position.x = px;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.34, 0.76, 0.04),
          idx === 1 ? cobaltMat : turqMat
        );
        tile.position.set(px, 0, 0.04);
        const star = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02), brassMat);
        star.position.set(px, 0, 0.065);
        star.rotation.z = Math.PI / 4;
        g.add(frame, tile, star);
      });
    } else if (styleId === 'sunburst_mirror') {
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xdbe8f2,
        roughness: 0.12,
        metalness: 0.85,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 10, 24), brassMat);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), glassMat);
      glass.rotation.x = Math.PI / 2;
      g.add(ring, glass);
      for (let r = 0; r < 12; r++) {
        const ang = (r * Math.PI * 2) / 12;
        const ray = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.04), brassMat);
        ray.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.62, -0.01);
        ray.rotation.z = ang + Math.PI / 2;
        g.add(ray);
      }
    } else {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.0, 0.08), woodMat);
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.24, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xe6caa0, roughness: 0.9 })
      );
      canvas.position.z = 0.045;
      const archTint = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.42, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xb88154, roughness: 0.8 })
      );
      archTint.position.set(0, -0.05, 0.055);
      g.add(frame, canvas, archTint);
    }
  }

  return { group: g, spinPart, lampShadeMat };
}
