import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import {
  addBoxCollider,
  BuiltLandmark,
  createStoreSignTexture,
  createTurkishFlagTexture,
  makeDiscoveryRing,
} from './shared';

function createKentMeydaniPoolTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 384);
  grad.addColorStop(0, '#0ebde4');
  grad.addColorStop(0.5, '#19d2f2');
  grad.addColorStop(1, '#0eb6de');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Subtle ceramic tile grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y <= 384; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Geometric circular star & compass motifs matching Aydın Kent Meydanı pool floor
  const drawMosaicCircle = (cx: number, cy: number, r: number) => {
    ctx.strokeStyle = 'rgba(9, 78, 108, 0.48)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.16, cy + Math.sin(a) * r * 0.16);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
  };

  drawMosaicCircle(155, 192, 86);
  drawMosaicCircle(345, 180, 104);
  ctx.strokeStyle = 'rgba(10, 88, 120, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(32, 310);
  ctx.lineTo(480, 68);
  ctx.moveTo(58, 72);
  ctx.lineTo(445, 320);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 6. Atatürk Kent Meydanı & Efeler Anıtı (Based on Real Aydın Atatürk Kent Meydanı Photo)
 * - Huge Turquoise Geometric Pool + Green Circular Island Decks + Towering Turkish Flag
 * - Atatürk & Efeler Monument directly across from the Pool
 * - Municipal Cafés (Belediye Kafeleri) with cream umbrellas right beside the Pool
 * - Large Open Paved Square featuring Burger King, Popeyes & Usta Döner
 */
export function buildKentMeydani(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // 1. Expansive Travertine Plaza Floor (x in [-13.5..+13.5], z in [-27.2..+15.8], flush with Menderes & Hükümet sidewalks)
  const plazaSkirt = new THREE.Mesh(new THREE.BoxGeometry(27.2, 2.2, 43.4), mats.travertine);
  plazaSkirt.position.set(0, -1.08, -5.7);
  plazaSkirt.receiveShadow = true;
  group.add(plazaSkirt);

  const plazaSlab = new THREE.Mesh(new THREE.BoxGeometry(27.0, 0.24, 43.0), mats.plaza);
  plazaSlab.position.set(0, 0.12, -5.7);
  plazaSlab.receiveShadow = true;
  group.add(plazaSlab);

  // Travertine Outer Border Curbs & North/South Approach Thresholds
  const westCurb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.27, 43.2), mats.travertine);
  westCurb.position.set(-13.3, 0.135, -5.7);
  const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.27, 43.2), mats.travertine);
  eastCurb.position.set(13.3, 0.135, -5.7);
  const northCurb = new THREE.Mesh(new THREE.BoxGeometry(27.2, 0.27, 0.6), mats.travertine);
  northCurb.position.set(0, 0.135, -27.2);
  const southCurb = new THREE.Mesh(new THREE.BoxGeometry(27.2, 0.27, 0.6), mats.travertine);
  southCurb.position.set(0, 0.135, 15.8);
  const northGateStep = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.22, 0.9), mats.travertine);
  northGateStep.position.set(0, 0.11, -27.6);
  const southGateStep = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.22, 0.9), mats.travertine);
  southGateStep.position.set(0, 0.11, 16.2);
  group.add(westCurb, eastCurb, northCurb, southCurb, northGateStep, southGateStep);

  // Open Event Square ("Büyük Boş Alan", local z in [-20.8..-8.4]) Stone Paving Bands
  for (let gz = -20.0; gz <= -9.0; gz += 3.6) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.02, 0.28), mats.travertine);
    band.position.set(0, 0.25, gz);
    band.receiveShadow = true;
    group.add(band);
  }
  [-7.8, 0, 7.8].forEach((gx) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 12.0), mats.travertine);
    strip.position.set(gx, 0.25, -14.6);
    strip.receiveShadow = true;
    group.add(strip);
  });

  // Festive Red-and-White Pennant Strings across the Open Square (as in the reference photo)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x383c42, roughness: 0.55 });
  const redBannerMat = new THREE.MeshStandardMaterial({ color: 0xd63232, roughness: 0.6 });
  const creamBannerMat = new THREE.MeshStandardMaterial({ color: 0xf7efe2, roughness: 0.7 });
  [-18.2, -13.0].forEach((bz) => {
    [-12.2, 12.2].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), mats.wroughtIron);
      pole.position.set(px, 2.42, bz);
      pole.castShadow = true;
      group.add(pole);
    });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 24.4, 6), cableMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0, 4.4, bz);
    group.add(wire);

    for (let k = -10.8; k <= 10.8; k += 1.35) {
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.42, 3),
        Math.round(k * 2) % 2 === 0 ? redBannerMat : creamBannerMat
      );
      flag.rotation.x = Math.PI;
      flag.position.set(k, 4.18, bz);
      group.add(flag);
    }
  });

  // 2. Huge Turquoise Geometric Reflecting Pool ("Büyük Havuz", local [-2.3, 0, +0.6])
  const poolCX = -2.3;
  const poolCZ = 0.6;
  const poolW = 14.6;
  const poolD = 9.6;

  // Travertine Pool Coping Walls (North, South, West, East)
  const rimH = 0.26;
  const rimY = 0.35;
  const northRim = new THREE.Mesh(new THREE.BoxGeometry(poolW + 0.5, rimH, 0.45), mats.travertine);
  northRim.position.set(poolCX, rimY, poolCZ - poolD / 2);
  northRim.castShadow = true;
  const southRim = new THREE.Mesh(new THREE.BoxGeometry(poolW + 0.5, rimH, 0.45), mats.travertine);
  southRim.position.set(poolCX, rimY, poolCZ + poolD / 2);
  southRim.castShadow = true;
  const westRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, rimH, poolD + 0.5), mats.travertine);
  westRim.position.set(poolCX - poolW / 2, rimY, poolCZ);
  westRim.castShadow = true;
  const eastRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, rimH, poolD + 0.5), mats.travertine);
  eastRim.position.set(poolCX + poolW / 2, rimY, poolCZ);
  eastRim.castShadow = true;
  group.add(northRim, southRim, westRim, eastRim);

  // Turquoise Geometric Mosaic Pool Floor + Translucent Water Surface
  const mosaicMat = new THREE.MeshStandardMaterial({
    map: createKentMeydaniPoolTexture(),
    roughness: 0.32,
    metalness: 0.05,
  });
  const poolFloor = new THREE.Mesh(new THREE.PlaneGeometry(poolW - 0.3, poolD - 0.3), mosaicMat);
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(poolCX, 0.36, poolCZ);
  poolFloor.receiveShadow = true;
  group.add(poolFloor);

  const waterSurfaceMat = new THREE.MeshStandardMaterial({
    color: 0x1fd8f7,
    transparent: true,
    opacity: 0.36,
    roughness: 0.08,
    metalness: 0.16,
  });
  const waterSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW - 0.32, poolD - 0.32),
    waterSurfaceMat
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.set(poolCX, 0.44, poolCZ);
  group.add(waterSurface);

  // Fountain Spray Jets inside the Turquoise Pool
  const jetMat = new THREE.MeshStandardMaterial({
    color: 0xe6fbff,
    transparent: true,
    opacity: 0.78,
    roughness: 0.1,
  });
  [-4.2, -1.2, 1.8].forEach((jx) => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.2, 10), mats.travertine);
    nozzle.position.set(jx, 0.45, poolCZ);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.85, 8), jetMat);
    jet.position.set(jx, 0.92, poolCZ);
    group.add(nozzle, jet);
  });

  // Two Circular Green-Roofed Island Viewing Decks overlapping the Pool (matching photo)
  const islandGreenMat = new THREE.MeshStandardMaterial({ color: 0x5c8f3e, roughness: 0.88 });
  const buildPoolIsland = (ix: number, iz: number, rad: number) => {
    const isl = new THREE.Group();
    isl.position.set(ix, 0.24, iz);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.15, 0.36, 20), mats.travertine);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    isl.add(base);

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.95, 6), mats.darkTimber);
      post.position.set(Math.cos(a) * (rad * 0.68), 1.25, Math.sin(a) * (rad * 0.68));
      post.castShadow = true;
      isl.add(post);
    }

    const fascia = new THREE.Mesh(
      new THREE.CylinderGeometry(rad + 0.12, rad + 0.12, 0.24, 24),
      mats.darkTimber
    );
    fascia.position.y = 2.25;
    fascia.castShadow = true;
    const roofTop = new THREE.Mesh(
      new THREE.CylinderGeometry(rad + 0.04, rad + 0.1, 0.14, 24),
      islandGreenMat
    );
    roofTop.position.y = 2.4;
    roofTop.receiveShadow = true;
    isl.add(fascia, roofTop);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(rad * 1.0, 0.32, 0.55), mats.darkTimber);
    bench.position.set(0, 0.5, 0);
    isl.add(bench);

    group.add(isl);
  };
  buildPoolIsland(-7.8, 3.5, 2.05);
  buildPoolIsland(-8.0, -2.5, 1.65);

  // 3. Equestrian Atatürk Monument Directly Across from the Pool (Based on User's Reference Illustration)
  const monGroup = new THREE.Group();
  monGroup.position.set(8.8, 0.24, 0.6);
  monGroup.rotation.y = -Math.PI / 2; // Facing West directly across the turquoise pool

  // 3a. Outer Square Lawn Plot + Low Perimeter Stone-Post Railings
  const monLawnMat = new THREE.MeshStandardMaterial({ color: 0x76994b, roughness: 0.92 });
  const monLawn = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.08, 6.6), monLawnMat);
  monLawn.position.y = 0.04;
  monLawn.receiveShadow = true;
  monGroup.add(monLawn);

  const railPipeMat = new THREE.MeshStandardMaterial({ color: 0x5c6369, roughness: 0.5, metalness: 0.55 });
  const postOffsets = [-3.2, -1.6, 0, 1.6, 3.2];
  [
    { axis: 'x', fixed: -3.2 },
    { axis: 'x', fixed: 3.2 },
    { axis: 'z', fixed: -3.2 },
    { axis: 'z', fixed: 3.2 },
  ].forEach(({ axis, fixed }) => {
    const rail = new THREE.Mesh(
      axis === 'x' ? new THREE.BoxGeometry(0.05, 0.05, 6.4) : new THREE.BoxGeometry(6.4, 0.05, 0.05),
      railPipeMat
    );
    rail.position.set(axis === 'x' ? fixed : 0, 0.36, axis === 'z' ? fixed : 0);
    monGroup.add(rail);
    postOffsets.forEach((p) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), mats.travertine);
      post.position.set(axis === 'x' ? fixed : p, 0.21, axis === 'z' ? fixed : p);
      post.castShadow = true;
      monGroup.add(post);
    });
  });

  // 3b. Cruciform Stepped Travertine Base + 4 Corner Bushes + Ceremonial Stairs
  const crossArmA = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 3.6), mats.travertine);
  crossArmA.position.y = 0.13;
  crossArmA.receiveShadow = true;
  const crossArmB = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 5.6), mats.travertine);
  crossArmB.position.y = 0.13;
  crossArmB.receiveShadow = true;

  const midArmA = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 2.8), mats.creamPlaster);
  midArmA.position.y = 0.35;
  midArmA.receiveShadow = true;
  const midArmB = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 4.6), mats.creamPlaster);
  midArmB.position.y = 0.35;
  midArmB.receiveShadow = true;

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.22, 3.65), mats.travertine);
  upperDeck.position.y = 0.57;
  upperDeck.receiveShadow = true;
  monGroup.add(crossArmA, crossArmB, midArmA, midArmB, upperDeck);

  // 4 Corner Rounded Bushes on the Grass Square
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x5c8b42, roughness: 0.88 });
  [
    [-2.25, -2.25],
    [2.25, -2.25],
    [-2.25, 2.25],
    [2.25, 2.25],
  ].forEach(([bx, bz]) => {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), bushMat);
    bush.position.set(bx, 0.34, bz);
    bush.scale.set(1.05, 0.92, 1.05);
    bush.castShadow = true;
    monGroup.add(bush);
  });

  // Small Corner Turkish Flagpole on the Front Terrace Landing (matching the illustration)
  const monFlagGroup = new THREE.Group();
  monFlagGroup.position.set(1.65, 0.24, 2.35);
  const monMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 2.25, 8), railPipeMat);
  monMast.position.y = 1.12;
  const monFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.54, 4, 2),
    new THREE.MeshStandardMaterial({
      map: createTurkishFlagTexture(),
      side: THREE.DoubleSide,
      roughness: 0.65,
    })
  );
  monFlag.position.set(0.42, 1.94, 0.02);
  monFlag.rotation.y = 0.15;
  monFlagGroup.add(monMast, monFlag);
  monGroup.add(monFlagGroup);

  // 3c. Tall Tapered Cream Ashlar Stone Pedestal
  const tierHeights = [0.58, 0.56, 0.56, 0.52];
  const tierWidths = [2.22, 2.04, 1.88, 1.72];
  const tierDepths = [2.42, 2.24, 2.08, 1.92];
  let curY = 0.68;
  tierHeights.forEach((h, idx) => {
    const mat = idx % 2 === 0 ? mats.creamPlaster : mats.travertine;
    const block = new THREE.Mesh(new THREE.BoxGeometry(tierWidths[idx], h, tierDepths[idx]), mat);
    block.position.y = curY + h / 2;
    block.castShadow = true;
    block.receiveShadow = true;
    monGroup.add(block);
    curY += h;
  });

  const pedCap = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 2.15), mats.travertine);
  pedCap.position.y = curY + 0.09;
  pedCap.castShadow = true;
  monGroup.add(pedCap);

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x6b533b,
    roughness: 0.34,
    metalness: 0.72,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x4c3a29,
    roughness: 0.38,
    metalness: 0.7,
  });

  const statuePlinth = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 2.12), darkBronzeMat);
  statuePlinth.position.y = curY + 0.27;
  statuePlinth.castShadow = true;
  monGroup.add(statuePlinth);

  // 3d. Flanking Bronze Soldiers & Citizens Around Pedestal Base
  const buildStandingFigure = (
    fx: number,
    fz: number,
    rotY: number,
    variant: 'soldier' | 'salute' | 'citizen'
  ) => {
    const fig = new THREE.Group();
    fig.position.set(fx, 0.68, fz);
    fig.rotation.y = rotY;

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.58, 8), bronzeMat);
    legs.position.y = 0.29;
    legs.castShadow = true;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.52, 8), bronzeMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    const fHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bronzeMat);
    fHead.position.y = 1.18;
    fig.add(legs, torso, fHead);

    if (variant === 'soldier') {
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), darkBronzeMat);
      helmet.position.y = 1.21;
      const rifle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.92, 6), darkBronzeMat);
      rifle.position.set(0.16, 0.96, -0.05);
      rifle.rotation.z = -0.25;
      fig.add(helmet, rifle);
    } else if (variant === 'salute') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.07, 8), darkBronzeMat);
      cap.position.y = 1.26;
      const raisedArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.44, 6), bronzeMat);
      raisedArm.position.set(-0.2, 1.14, 0.06);
      raisedArm.rotation.z = 0.45;
      fig.add(cap, raisedArm);
    } else {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 0.62, 8), bronzeMat);
      skirt.position.y = 0.34;
      const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 8), darkBronzeMat);
      scarf.position.set(0, 1.19, -0.02);
      fig.add(skirt, scarf);
    }
    monGroup.add(fig);
  };

  // Front & Back Soldier Plinths + Side Citizen/Officer Plinths
  [
    { px: 0, pz: 1.48 },
    { px: 0, pz: -1.48 },
    { px: 1.38, pz: 0 },
    { px: -1.38, pz: 0 },
  ].forEach(({ px, pz }) => {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.36, 0.74), mats.travertine);
    ledge.position.set(px, 0.68, pz);
    ledge.castShadow = true;
    monGroup.add(ledge);
  });

  buildStandingFigure(0, 1.48, 0, 'soldier');
  buildStandingFigure(0, -1.48, Math.PI, 'soldier');
  buildStandingFigure(1.32, -0.15, Math.PI / 2, 'salute');
  buildStandingFigure(1.42, 0.2, Math.PI / 2, 'citizen');
  buildStandingFigure(-1.38, 0, -Math.PI / 2, 'soldier');

  // 3e. Heroic Bronze Equestrian Atatürk Statue atop the Pedestal (y = ~3.17 up to ~6.15)
  const eqBaseY = curY + 0.36;
  const eqGroup = new THREE.Group();
  eqGroup.position.set(0, eqBaseY, 0);

  // Horse Body (facing local +Z -> West toward pool)
  const horseBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 1.42, 12), bronzeMat);
  horseBarrel.rotation.x = Math.PI / 2;
  horseBarrel.position.set(0, 1.06, 0);
  horseBarrel.castShadow = true;
  const horseChest = new THREE.Mesh(new THREE.SphereGeometry(0.39, 12, 10), bronzeMat);
  horseChest.position.set(0, 1.08, 0.64);
  const horseRump = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bronzeMat);
  horseRump.position.set(0, 1.06, -0.62);
  eqGroup.add(horseBarrel, horseChest, horseRump);

  // Horse Arched Neck, Head, Ears & Flowing Tail
  const horseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.78, 10), bronzeMat);
  horseNeck.position.set(0, 1.44, 0.84);
  horseNeck.rotation.x = 0.56;
  horseNeck.castShadow = true;
  const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.54), bronzeMat);
  horseHead.position.set(0, 1.72, 1.15);
  horseHead.rotation.x = 0.52;
  horseHead.castShadow = true;
  [-0.08, 0.08].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), bronzeMat);
    ear.position.set(ex, 1.9, 1.02);
    eqGroup.add(ear);
  });
  const tailUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.62, 8), darkBronzeMat);
  tailUpper.position.set(0, 1.06, -0.98);
  tailUpper.rotation.x = -0.52;
  const tailLower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.58, 8), darkBronzeMat);
  tailLower.position.set(0, 0.64, -1.14);
  tailLower.rotation.x = -0.14;
  eqGroup.add(horseNeck, horseHead, tailUpper, tailLower);

  // 3 Grounded Horse Legs + 1 Raised Front-Right Foreleg (exact pose from drawing)
  [
    { lx: -0.22, lz: -0.64, rx: 0.1 }, // Rear-left
    { lx: 0.22, lz: -0.64, rx: -0.08 }, // Rear-right
    { lx: -0.22, lz: 0.64, rx: -0.05 }, // Front-left grounded
  ].forEach(({ lx: legX, lz: legZ, rx }) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.96, 8), bronzeMat);
    leg.position.set(legX, 0.5, legZ);
    leg.rotation.x = rx;
    leg.castShadow = true;
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.1, 8), darkBronzeMat);
    hoof.position.set(legX, 0.05, legZ + rx * 0.45);
    eqGroup.add(leg, hoof);
  });
  // Raised Front-Right Foreleg (bent gracefully forward & up)
  const raisedUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.48, 8), bronzeMat);
  raisedUpper.position.set(0.22, 0.92, 0.78);
  raisedUpper.rotation.x = -0.95;
  const raisedLower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), bronzeMat);
  raisedLower.position.set(0.22, 0.8, 1.06);
  raisedLower.rotation.x = 0.55;
  eqGroup.add(raisedUpper, raisedLower);

  // Saddle & Mounted Atatürk in Peaked Military Cap & Officer Uniform
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.52), darkBronzeMat);
  saddle.position.set(0, 1.44, 0.05);
  const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.72, 10), bronzeMat);
  riderTorso.position.set(0, 1.84, 0.04);
  riderTorso.castShadow = true;
  const riderShoulders = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.26), bronzeMat);
  riderShoulders.position.set(0, 2.08, 0.04);
  const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), bronzeMat);
  riderHead.position.set(0, 2.34, 0.06);
  riderHead.castShadow = true;
  const officerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 10), darkBronzeMat);
  officerCap.position.set(0, 2.46, 0.06);
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.12), darkBronzeMat);
  capVisor.position.set(0, 2.42, 0.18);
  const sword = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.72, 6), darkBronzeMat);
  sword.position.set(0.28, 1.38, -0.06);
  sword.rotation.x = 0.55;
  eqGroup.add(saddle, riderTorso, riderShoulders, riderHead, officerCap, capVisor, sword);

  // Rider Boots & Arms holding the Reins
  [-0.3, 0.3].forEach((sx) => {
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.58, 8), darkBronzeMat);
    boot.position.set(sx, 1.24, 0.14);
    boot.rotation.z = sx > 0 ? -0.18 : 0.18;
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.52, 8), bronzeMat);
    armR.position.set(sx * 0.85, 1.86, 0.26);
    armR.rotation.x = -0.82;
    eqGroup.add(boot, armR);
  });

  monGroup.add(eqGroup);
  group.add(monGroup);

  // 4. Towering Silver Flagpole & Turkish Flag (near SE pool promenade, matching photo)
  const flagGroup = new THREE.Group();
  flagGroup.position.set(6.8, 0.24, 6.6);
  const flagBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.38, 12), mats.travertine);
  flagBase.position.y = 0.19;
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.72, roughness: 0.28 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 9.2, 10), poleMat);
  mast.position.y = 4.78;
  mast.castShadow = true;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.brass);
  finial.position.y = 9.45;
  const flagMat = new THREE.MeshStandardMaterial({
    map: createTurkishFlagTexture(),
    side: THREE.DoubleSide,
    roughness: 0.65,
  });
  const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.05, 8, 2), flagMat);
  const fPos = flagCloth.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fPos.count; i++) {
    const px = fPos.getX(i);
    const wave = Math.sin((px + 1.55) * 2.1) * 0.16;
    fPos.setZ(i, wave);
  }
  flagCloth.geometry.computeVertexNormals();
  flagCloth.position.set(-1.58, 8.2, 0.12);
  flagCloth.rotation.y = 0.22;
  flagCloth.castShadow = true;
  flagGroup.add(flagBase, mast, finial, flagCloth);
  group.add(flagGroup);

  // 5. Belediye Kafeleri Beside the Pool ("Havuzun Yanında Belediye Kafeleri", local z = -6.5)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d59,
    emissive: new THREE.Color(0xf6cf88),
    emissiveIntensity: 0.42,
    roughness: 0.2,
    metalness: 0.3,
  });
  const umbrellaCreamMat = new THREE.MeshStandardMaterial({ color: 0xf4ebd9, roughness: 0.78 });

  const buildBelediyeCafe = (cx: number, cz: number, signLabel: string) => {
    const cafe = new THREE.Group();
    cafe.position.set(cx, 0.24, cz);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 3.2), mats.darkTimber);
    deck.position.y = 0.08;
    deck.receiveShadow = true;
    cafe.add(deck);

    const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.45, 2.4), mats.creamPlaster);
    body.position.set(0, 1.38, -0.2);
    body.castShadow = true;
    body.receiveShadow = true;
    cafe.add(body);

    const counterGlass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.65, 0.12), glassMat);
    counterGlass.position.set(0, 1.25, 1.02);
    cafe.add(counterGlass);

    // Timber Slatted Canopy + Pergola Overhang facing the pool (+Z)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.22, 3.6), mats.darkTimber);
    canopy.position.set(0, 2.72, 0.3);
    canopy.castShadow = true;
    cafe.add(canopy);

    [-2.5, 2.5].forEach((px) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.55, 0.14), mats.wroughtIron);
      post.position.set(px, 1.35, 1.85);
      post.castShadow = true;
      cafe.add(post);
    });

    // Illuminated Belediye Kafe Signboard
    const signMat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture(signLabel, 'AYDIN BÜYÜKŞEHİR', '#2f5238', '#faf2e2', '#e5b044'),
      roughness: 0.45,
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.62, 0.14), signMat);
    sign.position.set(0, 2.95, 2.08);
    cafe.add(sign);

    // Poolside Outdoor Tables with Cream Umbrellas (matching photo)
    [-1.7, 0, 1.7].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 10), mats.whitePlaster);
      table.position.set(tx, 0.72, 2.1);
      const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.66, 6), mats.wroughtIron);
      tLeg.position.set(tx, 0.38, 2.1);
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.15, 6), mats.wroughtIron);
      uPole.position.set(tx, 1.12, 2.1);
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 8), umbrellaCreamMat);
      umbrella.position.set(tx, 2.22, 2.1);
      umbrella.castShadow = true;
      cafe.add(table, tLeg, uPole, umbrella);
    });

    group.add(cafe);
  };
  buildBelediyeCafe(-6.3, -6.5, 'BELEDİYE KAFE');
  buildBelediyeCafe(0.9, -6.5, 'HALK KAFE');

  // 6. Food Court Pavilions Facing the Large Open Plaza ("Büyük Boş Alan İçerisinde Burger King, Popeyes, Usta Döner")
  const buildBrandPavilion = (
    px: number,
    pz: number,
    brandTitle: string,
    subtitle: string,
    wallHex: number,
    fasciaHex: number,
    signBgHex: string,
    signFgHex: string,
    signAccentHex: string,
    umbrellaHex: number
  ) => {
    const pav = new THREE.Group();
    pav.position.set(px, 0.24, pz);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.2, 4.6), mats.travertine);
    plinth.position.y = 0.1;
    plinth.receiveShadow = true;
    pav.add(plinth);

    const wallMat = new THREE.MeshStandardMaterial({ color: wallHex, roughness: 0.72 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.1, 2.9, 3.8), wallMat);
    body.position.set(0, 1.65, -0.2);
    body.castShadow = true;
    body.receiveShadow = true;
    pav.add(body);

    // Modern Front Glass Counter + Awning
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1.9, 0.14), glassMat);
    frontGlass.position.set(0, 1.25, 1.72);
    pav.add(frontGlass);

    const fasciaMat = new THREE.MeshStandardMaterial({ color: fasciaHex, roughness: 0.48 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.42, 4.6), fasciaMat);
    canopy.position.set(0, 3.25, 0.1);
    canopy.castShadow = true;
    pav.add(canopy);

    const roofTop = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.25, 4.2), mats.slateRoof);
    roofTop.position.set(0, 3.55, 0.05);
    pav.add(roofTop);

    // Crisp Brand Signboard facing the Open Square (+Z)
    const signMat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture(brandTitle, subtitle, signBgHex, signFgHex, signAccentHex),
      roughness: 0.35,
    });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.05, 0.18), signMat);
    signBoard.position.set(0, 3.28, 2.42);
    pav.add(signBoard);

    // Two Outdoor Patio Tables & Brand-Colored Umbrellas on the Open Plaza Apron
    const umbMat = new THREE.MeshStandardMaterial({ color: umbrellaHex, roughness: 0.72 });
    [-1.7, 1.7].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 10), mats.whitePlaster);
      table.position.set(tx, 0.74, 3.0);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.68, 6), mats.wroughtIron);
      leg.position.set(tx, 0.38, 3.0);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), mats.wroughtIron);
      pole.position.set(tx, 1.14, 3.0);
      const umb = new THREE.Mesh(new THREE.ConeGeometry(1.02, 0.45, 8), umbMat);
      umb.position.set(tx, 2.28, 3.0);
      umb.castShadow = true;
      pav.add(table, leg, pole, umb);
    });

    group.add(pav);
  };

  buildBrandPavilion(
    -7.8,
    -23.6,
    'BURGER KING',
    'ALEVI ATEŞİ',
    0x332b26,
    0xd95626,
    '#f5ebdc',
    '#d62300',
    '#f28b1d',
    0xd94826
  );

  buildBrandPavilion(
    0.0,
    -23.6,
    'POPEYES',
    'LOUISIANA KITCHEN',
    0xf5efe6,
    0xf26b1d,
    '#f26b1d',
    '#ffffff',
    '#b52a1c',
    0xf27d29
  );

  buildBrandPavilion(
    7.8,
    -23.6,
    'USTA DÖNER',
    'YAPRAK DÖNER',
    0x402421,
    0xb82424,
    '#b82424',
    '#faf2e2',
    '#e3a84f',
    0xc4342d
  );

  // 7. Foreground Photo Touches: Corner Shade Trees + Yellow Aydın Taxis
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x568843, roughness: 0.85 });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6f5742, roughness: 0.9 });
  [
    [-11.2, 4.4],
    [11.2, -5.8],
  ].forEach(([tx, tz]) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, 0.24, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.0, 8), barkMat);
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), leafMat);
    crown.scale.set(1.1, 0.82, 1.1);
    crown.position.y = 2.65;
    crown.castShadow = true;
    tGroup.add(trunk, crown);
    group.add(tGroup);
  });

  // Two cute parked yellow Aydın Taxis on SW boulevard apron (from photo foreground)
  const taxiYellowMat = new THREE.MeshStandardMaterial({ color: 0xf0be26, roughness: 0.36 });
  const taxiGlassMat = new THREE.MeshStandardMaterial({ color: 0x2c3742, roughness: 0.2 });
  [
    [-10.4, 14.0],
    [-7.5, 14.3],
  ].forEach(([cx, cz]) => {
    const taxi = new THREE.Group();
    taxi.position.set(cx, 0.24, cz);
    taxi.rotation.y = 0.14;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.56, 1.05), taxiYellowMat);
    body.position.y = 0.42;
    body.castShadow = true;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.44, 0.92), taxiYellowMat);
    cab.position.set(-0.08, 0.88, 0);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.96), taxiGlassMat);
    win.position.set(-0.08, 0.88, 0);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), mats.lampBulb);
    sign.position.set(-0.08, 1.16, 0);
    taxi.add(body, cab, win, sign);
    group.add(taxi);
  });

  const ringMesh = makeDiscoveryRing(lx, lz + 15.2);
  const colliders: ColliderBox[] = [];
  // Pool rim collider
  addBoxCollider(colliders, lx + poolCX, lz + poolCZ, poolW + 0.4, poolD + 0.4, 0.55);
  // Monument statue plinth, stepped terrace & low perimeter fence collider
  addBoxCollider(colliders, lx + 8.8, lz + 0.6, 6.7, 6.7, 6.4);
  // Flagpole base collider
  addBoxCollider(colliders, lx + 6.8, lz + 6.6, 1.3, 1.3, 9.6);
  // Municipal Cafés colliders
  addBoxCollider(colliders, lx - 6.3, lz - 6.5, 5.9, 3.4, 3.2);
  addBoxCollider(colliders, lx + 0.9, lz - 6.5, 5.9, 3.4, 3.2);
  // Food Court Pavilions (Burger King, Popeyes, Usta Döner) colliders
  addBoxCollider(colliders, lx - 7.8, lz - 23.6, 6.6, 4.6, 3.8);
  addBoxCollider(colliders, lx, lz - 23.6, 6.6, 4.6, 3.8);
  addBoxCollider(colliders, lx + 7.8, lz - 23.6, 6.6, 4.6, 3.8);

  return { def, group, ringMesh, colliders };
}
