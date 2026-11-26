import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { createGableRoofGeometry, createHipRoofGeometry } from '../roofGeometry';
import {
  addBoxCollider,
  BuiltLandmark,
  createTurkishFlagTexture,
  makeDiscoveryRing,
} from './shared';

function createBelediyeGlassTexture(variant: 'upper' | 'lower'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = variant === 'upper' ? 256 : 160;
  const ctx = canvas.getContext('2d')!;

  const rows = variant === 'upper' ? 5 : 2;
  const cols = 22;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  const palette =
    variant === 'upper'
      ? ['#c4ab58', '#d7be68', '#989462', '#82875e', '#e3cb73', '#a69854']
      : ['#b57b1b', '#d99924', '#694414', '#ecba48', '#8f5e18', '#523410'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * 7 + c * 3 + (c % 2)) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);

      // Sunset gold diagonal reflection sheen
      const sheen = ctx.createLinearGradient(
        c * cellW,
        r * cellH,
        (c + 1) * cellW,
        (r + 1) * cellH
      );
      const highlight =
        variant === 'lower' && c >= 7 && c <= 14
          ? 'rgba(255, 224, 128, 0.36)'
          : 'rgba(255, 232, 165, 0.16)';
      sheen.addColorStop(0, highlight);
      sheen.addColorStop(0.55, 'rgba(255, 210, 120, 0.02)');
      sheen.addColorStop(1, 'rgba(30, 22, 12, 0.18)');
      ctx.fillStyle = sheen;
      ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

      // Occasional tilted ventilation pane accent (just like the photo)
      if (variant === 'upper' && (r === 2 || r === 3) && (c === 6 || c === 9 || c === 13 || c === 16)) {
        ctx.fillStyle = 'rgba(42, 30, 16, 0.72)';
        ctx.fillRect(c * cellW + 3, r * cellH + 4, cellW - 6, cellH - 8);
      }

      // Crisp curtain-wall mullion frame
      ctx.strokeStyle = variant === 'upper' ? 'rgba(66, 58, 38, 0.78)' : 'rgba(54, 34, 12, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
    }
    // Horizontal aluminum spandrel band between floors
    ctx.fillStyle = variant === 'upper' ? 'rgba(138, 124, 72, 0.75)' : 'rgba(72, 48, 18, 0.82)';
    ctx.fillRect(0, r * cellH, canvas.width, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createCurvedBelediyeSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 128);
  ctx.fillStyle = 'rgba(48, 44, 34, 0.42)';
  ctx.fillRect(0, 26, 1024, 76);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(18, 14, 8, 0.82)';
  ctx.fillText('T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ', 514, 67);
  ctx.fillStyle = '#f8f5ec';
  ctx.fillText('T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ', 512, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 7. Aydın Büyükşehir Belediyesi Binası (Based on Real Golden Glass Curved Building & Atatürk Monument Photo)
 */
export function buildSariBelediye(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // 1. Travertine Municipal Plaza Terrace & Front Steps facing Hükümet Bulvarı (-X)
  const terraceSkirt = new THREE.Mesh(new THREE.BoxGeometry(19.6, 2.0, 17.2), mats.travertine);
  terraceSkirt.position.set(0.4, -0.98, 0);
  terraceSkirt.receiveShadow = true;
  group.add(terraceSkirt);

  const terrace = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.42, 16.8), mats.plaza);
  terrace.position.set(0.4, 0.21, 0);
  terrace.receiveShadow = true;
  group.add(terrace);

  const westStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 9.2), mats.travertine);
  westStep1.position.set(-9.45, 0.11, 0);
  westStep1.receiveShadow = true;
  group.add(westStep1);

  // Perimeter Dark Metal Railings along front terrace flanks (matching photo's left balustrade)
  [-6.4, 6.4].forEach((rz) => {
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.8), mats.wroughtIron);
    railTop.position.set(-9.05, 1.02, rz);
    const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 3.8), mats.wroughtIron);
    railMid.position.set(-9.05, 0.72, rz);
    group.add(railTop, railMid);
    [-1.7, 0, 1.7].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), mats.wroughtIron);
      post.position.set(-9.05, 0.72, rz + pz);
      group.add(post);
    });
  });

  // Building center shifted slightly east (x = +2.2) so front plaza & statue sit proudly on west side
  const bldgX = 2.2;
  const bldgGroup = new THREE.Group();
  bldgGroup.position.set(bldgX, 0.42, 0);

  const champagneGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd9b868,
    roughness: 0.34,
    metalness: 0.56,
  });
  const warmStoneMat = new THREE.MeshStandardMaterial({
    color: 0xddd2bd,
    roughness: 0.76,
  });
  const lowerGlassMat = new THREE.MeshStandardMaterial({
    map: createBelediyeGlassTexture('lower'),
    color: 0xffd578,
    emissive: new THREE.Color(0x523208),
    emissiveIntensity: 0.32,
    roughness: 0.14,
    metalness: 0.72,
  });
  const upperGlassMat = new THREE.MeshStandardMaterial({
    map: createBelediyeGlassTexture('upper'),
    color: 0xf4df92,
    emissive: new THREE.Color(0x3b2f10),
    emissiveIntensity: 0.2,
    roughness: 0.2,
    metalness: 0.64,
  });

  // 2. Wide Curved 2-Story Amber-Bronze Mirror Glass Podium (Zemin & 1. Kat)
  const podiumBase = new THREE.Mesh(
    new THREE.CylinderGeometry(7.32, 7.36, 0.46, 36, 1, false, Math.PI * 0.9, Math.PI * 1.2),
    mats.travertine
  );
  podiumBase.position.y = 0.23;
  bldgGroup.add(podiumBase);

  const podiumGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(7.22, 7.22, 3.1, 36, 1, false, Math.PI * 0.92, Math.PI * 1.16),
    lowerGlassMat
  );
  podiumGlass.position.y = 2.0;
  podiumGlass.castShadow = true;
  podiumGlass.receiveShadow = true;
  bldgGroup.add(podiumGlass);

  // Dark bronze roof coping on top of the wide lower podium
  const podiumRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(7.36, 7.34, 0.26, 36, 1, false, Math.PI * 0.9, Math.PI * 1.2),
    mats.wroughtIron
  );
  podiumRoof.position.y = 3.62;
  podiumRoof.castShadow = true;
  bldgGroup.add(podiumRoof);

  // Front-North Glass Entrance Canopy & Illuminated Vestibule (matches doorPosition [30.6, 23.8])
  const entranceCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 3.2), mats.wroughtIron);
  entranceCanopy.position.set(-5.8, 2.35, -4.1);
  entranceCanopy.rotation.y = -0.58;
  entranceCanopy.castShadow = true;
  const entranceGlow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 2.4), mats.windowLit);
  entranceGlow.position.set(-5.35, 1.25, -4.1);
  entranceGlow.rotation.y = -0.58;
  bldgGroup.add(entranceCanopy, entranceGlow);

  // Rear Service Core & Tall Golden Elevator Wings (left-rear & right-rear towers visible in photo)
  const rearCore = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.65, 13.6), warmStoneMat);
  rearCore.position.set(2.8, 1.825, 0);
  rearCore.castShadow = true;
  rearCore.receiveShadow = true;
  bldgGroup.add(rearCore);

  [-4.4, 4.4].forEach((tz) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 10.1, 2.6), champagneGoldMat);
    tower.position.set(2.5, 5.05, tz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    bldgGroup.add(tower);
  });

  // 3. Tall Cylindrical Golden-Amber Curtain-Wall Upper Tower (3–7. Katlar)
  const upperDrum = new THREE.Mesh(new THREE.CylinderGeometry(4.62, 4.62, 6.2, 36), upperGlassMat);
  upperDrum.position.y = 6.75;
  upperDrum.castShadow = true;
  upperDrum.receiveShadow = true;
  bldgGroup.add(upperDrum);

  // Stepped Staggered Curtain-Wall Relief Tiers on Front Arc (matching photo's layered facade geometry!)
  const upperSteppedTier = new THREE.Mesh(
    new THREE.CylinderGeometry(4.86, 4.86, 2.35, 28, 1, false, Math.PI * 1.06, Math.PI * 0.72),
    upperGlassMat
  );
  upperSteppedTier.position.y = 8.45;
  upperSteppedTier.castShadow = true;
  bldgGroup.add(upperSteppedTier);

  const rightSteppedBay = new THREE.Mesh(
    new THREE.CylinderGeometry(4.84, 4.84, 3.7, 24, 1, false, Math.PI * 1.48, Math.PI * 0.42),
    upperGlassMat
  );
  rightSteppedBay.position.y = 6.95;
  rightSteppedBay.castShadow = true;
  bldgGroup.add(rightSteppedBay);

  // Upper Roof Slab + Open Parapet Frame (matching the rectangular sky-cutout slots along roof edge)
  const topSlab = new THREE.Mesh(new THREE.CylinderGeometry(4.88, 4.88, 0.28, 36), champagneGoldMat);
  topSlab.position.y = 9.85;
  bldgGroup.add(topSlab);

  const crownBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(4.92, 4.92, 0.36, 36, 1, true, Math.PI * 0.95, Math.PI * 1.1),
    champagneGoldMat
  );
  crownBeam.material = champagneGoldMat.clone();
  crownBeam.material.side = THREE.DoubleSide;
  crownBeam.position.y = 10.62;
  bldgGroup.add(crownBeam);

  for (let i = 0; i <= 8; i++) {
    const theta = Math.PI * 0.98 + (i / 8) * Math.PI * 1.04;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.24), champagneGoldMat);
    pillar.position.set(Math.sin(theta) * 4.85, 10.22, Math.cos(theta) * 4.85);
    pillar.rotation.y = theta;
    bldgGroup.add(pillar);
  }

  // Curved "T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ" Illuminated Sign on Top Front Arc
  const signArcMat = new THREE.MeshStandardMaterial({
    map: createCurvedBelediyeSignTexture(),
    transparent: true,
    emissive: new THREE.Color(0xfff4d6),
    emissiveIntensity: 0.45,
    roughness: 0.32,
  });
  const curvedSign = new THREE.Mesh(
    new THREE.CylinderGeometry(5.05, 5.05, 0.64, 28, 1, true, Math.PI * 1.12, Math.PI * 0.76),
    signArcMat
  );
  curvedSign.position.y = 10.34;
  bldgGroup.add(curvedSign);

  group.add(bldgGroup);

  // 4. Stepped Circular Black Granite Pedestal & Bronze Atatürk Statue directly in front (-X)
  const monGroup = new THREE.Group();
  monGroup.position.set(-6.5, 0.42, 0);
  monGroup.rotation.y = -Math.PI / 2; // Facing West toward Hükümet Bulvarı

  const blackGraniteMat = new THREE.MeshStandardMaterial({
    color: 0x16181c,
    roughness: 0.3,
    metalness: 0.3,
    flatShading: false,
  });
  const stepRadii = [2.45, 2.08, 1.72, 1.38];
  stepRadii.forEach((rad, idx) => {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.04, 0.24, 32), blackGraniteMat);
    step.position.y = 0.12 + idx * 0.24;
    step.castShadow = true;
    step.receiveShadow = true;
    monGroup.add(step);
  });

  // Molded LatheGeometry circular granite plinth supporting the bronze statue
  const plinthProfile = [
    new THREE.Vector2(0.76, 0.0),
    new THREE.Vector2(0.74, 0.06),
    new THREE.Vector2(0.64, 0.14),
    new THREE.Vector2(0.66, 0.22),
    new THREE.Vector2(0.0, 0.22),
  ];
  const subPlinthGeo = new THREE.LatheGeometry(plinthProfile, 28);
  subPlinthGeo.computeVertexNormals();
  const subPlinth = new THREE.Mesh(subPlinthGeo, blackGraniteMat);
  subPlinth.position.y = 0.96;
  subPlinth.castShadow = true;
  subPlinth.receiveShadow = true;
  monGroup.add(subPlinth);

  // Two small ground uplights on the black granite tier (matching photo)
  [-1.08, 1.08].forEach((ux) => {
    const uplight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), mats.wroughtIron);
    uplight.position.set(ux, 1.02, 0.78);
    uplight.rotation.x = -0.45;
    monGroup.add(uplight);
  });

  // Standing Bronze Atatürk Statue with Flowing Cape, Overcoat & Held Hat
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x5c4632,
    roughness: 0.55,
    metalness: 0.3,
    flatShading: false,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x453425,
    roughness: 0.58,
    metalness: 0.3,
    flatShading: false,
  });
  const addBronze = (geo: THREE.BufferGeometry, mat = bronzeMat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    monGroup.add(m);
    return m;
  };

  // Sculpted trousers & boots
  const statLegGeo = new THREE.CapsuleGeometry(0.105, 0.78, 10, 20);
  [-0.14, 0.14].forEach((lx, i) => {
    const leg = addBronze(statLegGeo);
    leg.position.set(lx, 1.66, i === 0 ? 0.03 : -0.02);
    const shoe = addBronze(new THREE.CapsuleGeometry(0.085, 0.14, 8, 16), darkBronzeMat);
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(lx, 1.24, 0.08);
  });

  // Flowing LatheGeometry draped greatcoat skirt & torso
  const coatProfile = [
    new THREE.Vector2(0.46, 0.0),
    new THREE.Vector2(0.42, 0.34),
    new THREE.Vector2(0.34, 0.82),
    new THREE.Vector2(0.28, 1.18),
    new THREE.Vector2(0.33, 1.46),
  ];
  const coatGeo = new THREE.LatheGeometry(coatProfile, 28);
  coatGeo.computeVertexNormals();
  const coat = addBronze(coatGeo);
  coat.scale.set(1.06, 1.0, 0.86);
  coat.position.set(0, 1.46, -0.04);

  // Broad softened CapsuleGeometry shoulder yoke + deltoid joints
  const shoulders = addBronze(new THREE.CapsuleGeometry(0.185, 0.42, 10, 22));
  shoulders.rotation.z = Math.PI / 2;
  shoulders.position.set(0, 2.74, -0.02);

  // Sweeping TubeGeometry bronze cape folds draping behind shoulders
  [
    [
      new THREE.Vector3(-0.34, 2.78, -0.14),
      new THREE.Vector3(-0.42, 2.25, -0.26),
      new THREE.Vector3(-0.46, 1.56, -0.24),
    ],
    [
      new THREE.Vector3(0.0, 2.76, -0.18),
      new THREE.Vector3(0.02, 2.18, -0.34),
      new THREE.Vector3(0.05, 1.52, -0.3),
    ],
    [
      new THREE.Vector3(0.32, 2.78, -0.14),
      new THREE.Vector3(0.38, 2.24, -0.26),
      new THREE.Vector3(0.42, 1.56, -0.22),
    ],
  ].forEach((pts) => {
    const foldCurve = new THREE.CatmullRomCurve3(pts);
    addBronze(new THREE.TubeGeometry(foldCurve, 18, 0.095, 14, false), darkBronzeMat);
  });

  // Sculpted tapered neck & high-segment head
  const neckGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.125, 0.0),
      new THREE.Vector2(0.105, 0.08),
      new THREE.Vector2(0.11, 0.16),
    ],
    22
  );
  neckGeo.computeVertexNormals();
  const neck = addBronze(neckGeo);
  neck.position.set(0, 2.86, 0.0);

  const head = addBronze(new THREE.SphereGeometry(0.205, 24, 18));
  head.scale.set(0.94, 1.08, 1.0);
  head.position.set(0, 3.16, 0.02);

  // Left & Right CapsuleGeometry arms with softened shoulder/elbow joints
  const armJointGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const statArmGeo = new THREE.CapsuleGeometry(0.082, 0.52, 8, 18);
  const rightShoulder = addBronze(armJointGeo);
  rightShoulder.position.set(-0.34, 2.72, 0.02);
  const rightArm = addBronze(statArmGeo);
  rightArm.position.set(-0.37, 2.44, 0.16);
  rightArm.rotation.set(-0.55, 0, -0.28);

  const leftShoulder = addBronze(armJointGeo);
  leftShoulder.position.set(0.34, 2.72, 0.0);
  const leftArm = addBronze(statArmGeo);
  leftArm.position.set(0.36, 2.42, 0.06);
  leftArm.rotation.set(-0.18, 0, 0.14);

  // Held Fedora Hat crafted via LatheGeometry
  const hatProfile = [
    new THREE.Vector2(0.22, 0.0),
    new THREE.Vector2(0.145, 0.025),
    new THREE.Vector2(0.135, 0.14),
    new THREE.Vector2(0.1, 0.19),
    new THREE.Vector2(0.0, 0.195),
  ];
  const heldHatGeo = new THREE.LatheGeometry(hatProfile, 24);
  heldHatGeo.computeVertexNormals();
  const heldHat = addBronze(heldHatGeo, darkBronzeMat);
  heldHat.position.set(-0.46, 2.24, 0.34);
  heldHat.rotation.z = 0.65;

  group.add(monGroup);

  // 5. Left Foreground Silver Flagpole with Turkish Flag (left side of photo)
  const flagGroup = new THREE.Group();
  flagGroup.position.set(-7.6, 0.42, 5.8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.72, roughness: 0.28 });
  const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.28, 12), mats.travertine);
  poleBase.position.y = 0.14;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 8.2, 10), poleMat);
  mast.position.y = 4.24;
  mast.castShadow = true;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mats.brass);
  finial.position.y = 8.4;
  const flagMat = new THREE.MeshStandardMaterial({
    map: createTurkishFlagTexture(),
    side: THREE.DoubleSide,
    roughness: 0.65,
  });
  const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.56, 8, 2), flagMat);
  const fPos = flagCloth.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fPos.count; i++) {
    const px = fPos.getX(i);
    fPos.setZ(i, Math.sin((px + 1.18) * 2.2) * 0.13);
  }
  flagCloth.geometry.computeVertexNormals();
  flagCloth.position.set(1.18, 7.25, 0.1);
  flagCloth.rotation.y = 0.18;
  flagCloth.castShadow = true;
  flagGroup.add(poleBase, mast, finial, flagCloth);
  group.add(flagGroup);

  const ringMesh = makeDiscoveryRing(lx - 10.2, lz);
  const colliders: ColliderBox[] = [];
  // Curved glass podium & upper tower collider
  addBoxCollider(colliders, lx + bldgX - 0.5, lz, 13.8, 14.2, 11.0);
  // Front circular Atatürk monument pedestal collider
  addBoxCollider(colliders, lx - 6.5, lz, 4.9, 4.9, 4.0);
  // Left flagpole base collider
  addBoxCollider(colliders, lx - 7.6, lz + 5.8, 0.9, 0.9, 8.6);

  return { def, group, ringMesh, colliders };
}

/**
 * 8. Tekstil Park (Tarihi Sümerbank Tekstil Fabrikası & Parkı)
 */
export function buildTekstilPark(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Lush Green Park Base, Retaining Skirt & Stone Walkways
  const parkSkirt = new THREE.Mesh(new THREE.BoxGeometry(26.4, 1.6, 24.4), mats.travertine);
  parkSkirt.position.y = -0.78;
  parkSkirt.receiveShadow = true;
  group.add(parkSkirt);

  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x7d9e52,
    map: mats.grassMicroGrain,
    roughness: 0.92,
  });
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(26, 0.18, 24), lawnMat);
  lawn.position.y = 0.09;
  lawn.receiveShadow = true;
  group.add(lawn);

  const path = new THREE.Mesh(new THREE.BoxGeometry(24, 0.22, 3.2), mats.plaza);
  path.position.set(0, 0.12, 4.5);
  path.receiveShadow = true;
  const westEntryWalk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 7.8), mats.plaza);
  westEntryWalk.position.set(-11.4, 0.126, 2.0);
  westEntryWalk.receiveShadow = true;
  group.add(path, westEntryWalk);

  // Iconic Red-Brick Sawtooth Textile Weaving Hall
  const hall = new THREE.Mesh(new THREE.BoxGeometry(15.5, 4.4, 9.2), mats.industrialBrick);
  hall.position.set(-1.5, 2.35, -3.5);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  // 4 Sawtooth Roof Bays
  for (let i = 0; i < 4; i++) {
    const sx = -7.2 + i * 3.8;
    const saw = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.4, 9.4), mats.terracottaRoof);
    saw.position.set(sx, 5.0, -3.5);
    saw.rotation.z = 0.34;
    saw.castShadow = true;
    group.add(saw);
  }

  // Historic Tall Factory Brick Chimney
  const chimneyBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 2.4), mats.industrialBrick);
  chimneyBase.position.set(8.8, 1.7, -5.2);
  chimneyBase.castShadow = true;
  group.add(chimneyBase);

  const chimneyShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 1.05, 12.5, 12),
    mats.industrialBrick
  );
  chimneyShaft.position.set(8.8, 9.2, -5.2);
  chimneyShaft.castShadow = true;
  group.add(chimneyShaft);

  // Tranquil Park Pond & Wooden Deck
  const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.3, 24), mats.travertine);
  pondRim.position.set(4.5, 0.2, 6.2);
  group.add(pondRim);

  const pondWater = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.12, 24), mats.water);
  pondWater.position.set(4.5, 0.34, 6.2);
  group.add(pondWater);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.0), mats.darkTimber);
  deck.position.set(4.5, 0.42, 2.4);
  group.add(deck);

  const ringMesh = makeDiscoveryRing(lx - 14.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx - 1.5, lz - 3.5, 15.5, 9.2, 5.8);
  addBoxCollider(colliders, lx + 8.8, lz - 5.2, 2.4, 2.4, 15.5);
  addBoxCollider(colliders, lx + 4.5, lz + 6.2, 8.2, 8.2, 0.45);

  return { def, group, ringMesh, colliders };
}

/**
 * 10. Tarihi Aydın Tren Garı (1882)
 */
export function buildTrenGari(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const platformSkirt = new THREE.Mesh(new THREE.BoxGeometry(28.4, 1.4, 14.4), mats.travertine);
  platformSkirt.position.set(0, -0.68, 2.5);
  platformSkirt.receiveShadow = true;
  group.add(platformSkirt);

  const platform = new THREE.Mesh(new THREE.BoxGeometry(28, 0.45, 14), mats.plaza);
  platform.position.set(0, 0.225, 2.5);
  platform.receiveShadow = true;
  group.add(platform);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(20, 5.2, 6.2), mats.creamPlaster);
  mainWing.position.set(0, 3.05, -0.5);
  mainWing.castShadow = true;
  mainWing.receiveShadow = true;
  group.add(mainWing);

  const centerBay = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6.6, 6.8), mats.whitePlaster);
  centerBay.position.set(0, 3.75, -0.5);
  centerBay.castShadow = true;
  group.add(centerBay);

  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.18, 16), mats.brass);
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 5.8, -3.95);
  group.add(clockFace);

  const wingRoof = new THREE.Mesh(
    createGableRoofGeometry(21.0, 7.0, 2.2),
    mats.terracottaRoof
  );
  wingRoof.position.set(0, 5.65, -0.5);
  wingRoof.castShadow = true;
  group.add(wingRoof);

  const centerRoof = new THREE.Mesh(
    createHipRoofGeometry(7.0, 7.6, 2.4),
    mats.terracottaRoof
  );
  centerRoof.position.set(0, 7.05, -0.5);
  centerRoof.castShadow = true;
  group.add(centerRoof);

  [-7.5, -5.0, 5.0, 7.5].forEach((wx) => {
    [-3.62, 2.62].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.3, 0.14), mats.windowLit);
      win.position.set(wx, 2.8, wz);
      group.add(win);
    });
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 4.2), mats.wroughtIron);
  canopy.position.set(0, 3.8, 4.6);
  canopy.castShadow = true;
  group.add(canopy);

  [-9, -4.5, 0, 4.5, 9].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.4, 8), mats.wroughtIron);
    col.position.set(cx, 2.1, 6.2);
    group.add(col);
  });

  const railZ1 = 10.4;
  const railZ2 = 11.8;
  // Gravel Ballast Bed under Railway Tracks (deepened to seal into uneven ground)
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(240, 0.56, 3.6), mats.dirtPath);
  ballast.position.set(0, -0.12, (railZ1 + railZ2) / 2);
  ballast.receiveShadow = true;
  group.add(ballast);

  [railZ1, railZ2].forEach((rz) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(240, 0.16, 0.16), mats.railSteel);
    rail.position.set(0, 0.25, rz);
    group.add(rail);
  });

  for (let tx = -112; tx <= 112; tx += 2.2) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 2.3), mats.darkTimber);
    sleeper.position.set(tx, 0.14, (railZ1 + railZ2) / 2);
    group.add(sleeper);
  }

  const ringMesh = makeDiscoveryRing(lx, lz - 6.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz + 1.5, 22, 13, 8.6);

  return { def, group, ringMesh, colliders };
}

/**
 * 11. Orta Mahalle Tarihi Dokusu, Mahalle Çeşmesi & Taş Kahvehane
 */
export function buildOrtaMahalle(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Cobblestone Hillside Terrace Courtyard + Retaining Stone Skirt
  const terraceSkirt = new THREE.Mesh(new THREE.BoxGeometry(21.6, 2.8, 19.6), mats.travertine);
  terraceSkirt.position.y = -1.35;
  terraceSkirt.receiveShadow = true;
  group.add(terraceSkirt);

  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(21, 0.34, 19), mats.cobble);
  courtyard.position.y = 0.17;
  courtyard.receiveShadow = true;
  group.add(courtyard);

  const curb = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.24, 19.6), mats.travertine);
  curb.position.y = 0.12;
  group.add(curb);

  // Historic Stone Bakery & Neighborhood Kahvehane (West-North Side)
  const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.8, 6.4), mats.ochrePlaster);
  cafeBody.position.set(-4.6, 2.7, -3.8);
  cafeBody.castShadow = true;
  cafeBody.receiveShadow = true;
  group.add(cafeBody);

  const cafeCumba = new THREE.Mesh(new THREE.BoxGeometry(8.1, 2.2, 6.9), mats.whitePlaster);
  cafeCumba.position.set(-4.6, 4.1, -3.8);
  cafeCumba.castShadow = true;
  group.add(cafeCumba);

  const cafeRoof = new THREE.Mesh(
    createGableRoofGeometry(8.6, 7.4, 2.1),
    mats.terracottaRoof
  );
  cafeRoof.position.set(-4.6, 5.2, -3.8);
  cafeRoof.castShadow = true;
  group.add(cafeRoof);

  const ovenChimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.2, 0.95),
    mats.industrialBrick
  );
  ovenChimney.position.set(-7.2, 6.2, -5.2);
  ovenChimney.castShadow = true;
  group.add(ovenChimney);

  const awningMat = new THREE.MeshStandardMaterial({
    color: 0xb64b36,
    map: mats.stripedAwningMap,
    roughness: 0.78,
  });
  const cafeAwning = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 1.8), awningMat);
  cafeAwning.position.set(-4.6, 2.55, 0.25);
  cafeAwning.rotation.x = 0.24;
  cafeAwning.castShadow = true;
  group.add(cafeAwning);

  [-6.8, -4.6, -2.4].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.05, 0.14), mats.windowLit);
    win.position.set(wx, 4.1, -0.32);
    group.add(win);
  });

  // Outdoor Wooden Kahvehane Tables & Low Tabure Stools
  [-6.2, -3.0].forEach((tx) => {
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), mats.darkTimber);
    tableTop.position.set(tx, 0.75, 2.4);
    tableTop.castShadow = true;
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 8), mats.darkTimber);
    tableLeg.position.set(tx, 0.45, 2.4);
    group.add(tableTop, tableLeg);

    [-0.75, 0.75].forEach((sx) => {
      const stool = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.34), mats.creamPlaster);
      stool.position.set(tx + sx, 0.42, 2.4);
      group.add(stool);
    });
  });

  // Traditional Carved Marble Mahalle Çeşmesi (East Pavilion)
  const cesmeWall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 1.2), mats.travertine);
  cesmeWall.position.set(4.5, 2.0, -2.2);
  cesmeWall.castShadow = true;
  group.add(cesmeWall);

  const cesmeArch = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 1.32), mats.creamPlaster);
  cesmeArch.position.set(4.5, 1.45, -2.2);
  group.add(cesmeArch);

  const cesmeCap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.9, 4), mats.terracottaRoof);
  cesmeCap.rotation.y = Math.PI / 4;
  cesmeCap.position.set(4.5, 4.25, -2.2);
  cesmeCap.castShadow = true;
  group.add(cesmeCap);

  const trough = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.15), mats.travertine);
  trough.position.set(4.5, 0.55, -1.1);
  const troughWater = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.8), mats.water);
  troughWater.position.set(4.5, 0.78, -1.1);
  group.add(trough, troughWater);

  // Grapevine Wooden Pergola Arbor (South-East Terrace)
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x5d8a48, roughness: 0.84 });
  const pergola = new THREE.Group();
  pergola.position.set(4.2, 0.28, 4.8);
  [-2.6, 2.6].forEach((px) => {
    [-1.4, 1.4].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.6, 8), mats.darkTimber);
      post.position.set(px, 1.3, pz);
      post.castShadow = true;
      pergola.add(post);
    });
  });
  for (let bx = -2.6; bx <= 2.6; bx += 1.3) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 3.4), mats.darkTimber);
    beam.position.set(bx, 2.65, 0);
    pergola.add(beam);
  }
  const vineCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 3.2), vineMat);
  vineCanopy.position.set(0, 2.82, 0);
  vineCanopy.castShadow = true;
  pergola.add(vineCanopy);
  group.add(pergola);

  const westStep = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 7.0), mats.travertine);
  westStep.position.set(-10.9, 0.12, 0);
  westStep.receiveShadow = true;
  group.add(westStep);

  const ringMesh = makeDiscoveryRing(lx - 12.2, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx - 4.6, lz - 3.8, 7.6, 6.4, 7.2);
  addBoxCollider(colliders, lx + 4.5, lz - 1.8, 2.8, 2.4, 4.4);

  return { def, group, ringMesh, colliders };
}

/**
 * 12. ADÜ — Aydın Adnan Menderes Üniversitesi Aytepe Kampüsü
 */
export function buildUniversite(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Wide Campus Green Lawn, Retaining Hill Skirt & Travertine Quad Paths
  const campusSkirt = new THREE.Mesh(new THREE.BoxGeometry(28.4, 3.6, 24.4), mats.travertine);
  campusSkirt.position.y = -1.75;
  campusSkirt.receiveShadow = true;
  group.add(campusSkirt);

  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x7f9f52,
    map: mats.grassMicroGrain,
    roughness: 0.9,
  });
  const campusBase = new THREE.Mesh(new THREE.BoxGeometry(28, 0.22, 24), lawnMat);
  campusBase.position.y = 0.11;
  campusBase.receiveShadow = true;
  group.add(campusBase);

  const quadWalkEW = new THREE.Mesh(new THREE.BoxGeometry(26, 0.26, 3.6), mats.plaza);
  quadWalkEW.position.set(-1.0, 0.14, 0);
  quadWalkEW.receiveShadow = true;
  const quadWalkNS = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.26, 21), mats.plaza);
  quadWalkNS.position.set(-1.5, 0.146, 0);
  quadWalkNS.receiveShadow = true;
  group.add(quadWalkEW, quadWalkNS);

  // Monumental ADÜ Campus Stone Entrance Archway (West Side facing Doğu Bulvarı)
  [-3.2, 3.2].forEach((az) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.2, 1.5), mats.travertine);
    pillar.position.set(-12.5, 2.7, az);
    pillar.castShadow = true;
    group.add(pillar);
  });
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 8.6), mats.creamPlaster);
  archLintel.position.set(-12.5, 5.6, 0);
  archLintel.castShadow = true;
  const crestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 3.6), mats.brass);
  crestPlate.position.set(-12.5, 5.65, 0);
  group.add(archLintel, crestPlate);

  // Classical Campus Rectorate & Faculty Building (North-East)
  const rectorate = new THREE.Mesh(new THREE.BoxGeometry(14.5, 6.2, 7.6), mats.creamPlaster);
  rectorate.position.set(3.2, 3.3, -6.4);
  rectorate.castShadow = true;
  rectorate.receiveShadow = true;
  group.add(rectorate);

  const rectorateRoof = new THREE.Mesh(
    createHipRoofGeometry(15.2, 8.3, 2.2),
    mats.terracottaRoof
  );
  rectorateRoof.position.set(3.2, 6.4, -6.4);
  rectorateRoof.castShadow = true;
  group.add(rectorateRoof);

  // Portico Columns & Flag Pole
  [-3.4, -1.1, 1.1, 3.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.2, 10), mats.whitePlaster);
    col.position.set(3.2 + cx, 2.3, -2.1);
    col.castShadow = true;
    group.add(col);
  });
  const porticoCap = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.45, 1.8), mats.travertine);
  porticoCap.position.set(3.2, 4.55, -2.1);
  group.add(porticoCap);

  [-2.5, 0, 2.5, 5.0, 7.5].forEach((wx) => {
    [2.1, 4.8].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.14), mats.windowLit);
      win.position.set(wx, wy, -2.56);
      group.add(win);
    });
  });

  // Domed Central Campus Library (South-East)
  const libBase = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 4.6, 8), mats.peachPlaster);
  libBase.position.set(5.6, 2.5, 5.8);
  libBase.castShadow = true;
  libBase.receiveShadow = true;
  group.add(libBase);

  const libGlassDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.6, 1.4, 16),
    mats.glassAtrium
  );
  libGlassDrum.position.set(5.6, 5.4, 5.8);
  group.add(libGlassDrum);

  const libDome = new THREE.Mesh(
    new THREE.SphereGeometry(3.55, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  libDome.position.set(5.6, 6.0, 5.8);
  libDome.castShadow = true;
  group.add(libDome);

  // Outdoor Stepped Student Amphitheater (South-West Lawn)
  for (let tier = 0; tier < 3; tier++) {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8 - tier * 0.9, 4.0 - tier * 0.9, 0.35, 12, 1, false, 0, Math.PI),
      mats.travertine
    );
    step.position.set(-5.2, 0.35 + tier * 0.32, 6.8);
    step.rotation.y = Math.PI * 0.25;
    step.receiveShadow = true;
    group.add(step);
  }

  // Campus Bicycle Parking Rack
  for (let b = 0; b < 3; b++) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 12, Math.PI), mats.wroughtIron);
    hoop.position.set(-8.0 + b * 1.1, 0.24, -4.6);
    group.add(hoop);
  }

  const ringMesh = makeDiscoveryRing(lx - 15.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx + 3.2, lz - 6.4, 14.5, 7.6, 8.4);
  addBoxCollider(colliders, lx + 5.6, lz + 5.8, 8.8, 8.8, 9.4);
  addBoxCollider(colliders, lx - 12.5, lz - 3.2, 1.7, 1.7, 5.6);
  addBoxCollider(colliders, lx - 12.5, lz + 3.2, 1.7, 1.7, 5.6);

  return { def, group, ringMesh, colliders };
}

function createParkSignTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#274E35');
  grad.addColorStop(1, '#1A3825');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#E5B95C';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.fillStyle = '#FFF9EC';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 50, 470);

  ctx.fillStyle = '#E5C67A';
  ctx.font = '600 20px sans-serif';
  ctx.fillText(subtitle, 256, 92, 460);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createParkLawnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7C9C52';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle realistic manicured mowing stripes harmonized with meadow turf
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(154, 186, 98, 0.22)' : 'rgba(94, 126, 62, 0.16)';
    ctx.fillRect(i * 32, 0, 32, 512);
  }
  // Organic clover & sunlit grass speckles
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % 512;
    const y = (i * 139) % 512;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(176, 206, 114, 0.2)' : 'rgba(84, 116, 54, 0.18)';
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function createMiniCourtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3E6B5C';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#F5EFE2';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 228, 228);

  // Paint key & 3-point arc
  ctx.fillStyle = '#B8543B';
  ctx.fillRect(92, 14, 72, 74);
  ctx.strokeRect(92, 14, 72, 74);
  ctx.beginPath();
  ctx.arc(128, 88, 36, 0, Math.PI, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(128, 34, 86, 0.15, Math.PI - 0.15, false);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 14. Nevzat Biçer Parkı (Cumhuriyet Mahallesi — Amfi Tiyatro, Süs Havuzu, Park Kafe & Çim Alanlar)
 */
export function buildNevzatBicerPark(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const colliders: ColliderBox[] = [];

  // Retaining travertine skirt + manicured park lawn pad (28m x 24m)
  const parkSkirt = new THREE.Mesh(new THREE.BoxGeometry(28.0, 1.5, 24.0), mats.travertine);
  parkSkirt.position.y = -0.74;
  parkSkirt.receiveShadow = true;
  group.add(parkSkirt);

  const lawnMat = new THREE.MeshStandardMaterial({
    map: createParkLawnTexture(),
    roughness: 0.9,
  });
  const parkLawn = new THREE.Mesh(new THREE.BoxGeometry(27.6, 0.16, 23.6), lawnMat);
  parkLawn.position.y = 0.08;
  parkLawn.receiveShadow = true;
  group.add(parkLawn);

  // Low travertine perimeter border curbs with wide open pedestrian entrances (E, N, S)
  const borderWallSegs: [number, number, number, number][] = [
    [-13.8, -6.2, 0.45, 11.2],
    [-13.8, 6.2, 0.45, 11.2],
    [13.8, -7.2, 0.45, 9.2],
    [13.8, 7.2, 0.45, 9.2],
    [-7.6, -11.8, 12.0, 0.45],
    [7.6, -11.8, 12.0, 0.45],
    [-7.6, 11.8, 12.0, 0.45],
    [7.6, 11.8, 12.0, 0.45],
  ];
  borderWallSegs.forEach(([bx, bz, bw, bd]) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.34, bd), mats.travertine);
    curb.position.set(bx, 0.17, bz);
    curb.receiveShadow = true;
    group.add(curb);
  });

  // Stone-paved main promenade paths (staggered Y heights to prevent crossing Z-fighting)
  const pathEW = new THREE.Mesh(new THREE.BoxGeometry(27.4, 0.19, 2.8), mats.plaza);
  pathEW.position.set(0, 0.105, 0.4);
  pathEW.receiveShadow = true;
  const pathNS = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.19, 23.4), mats.plaza);
  pathNS.position.set(0.6, 0.113, 0);
  pathNS.receiveShadow = true;
  const centerPlaza = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.2, 0.2, 28), mats.plaza);
  centerPlaza.position.set(0.6, 0.122, -2.6);
  centerPlaza.receiveShadow = true;
  group.add(pathEW, pathNS, centerPlaza);

  // Monumental East Entrance Archway ("NEVZAT BİÇER PARKI")
  [-2.1, 2.1].forEach((pz) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.6, 0.65), mats.travertine);
    col.position.set(13.6, 1.8, 0.4 + pz);
    col.castShadow = true;
    group.add(col);
  });
  const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 5.2), mats.darkTimber);
  gateBeam.position.set(13.6, 3.9, 0.4);
  gateBeam.castShadow = true;
  group.add(gateBeam);

  const signTex = createParkSignTexture('NEVZAT BİÇER PARKI', 'EFELER · CUMHURİYET MAHALLESİ');
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.42 });
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9), signMat);
  signFront.rotation.y = Math.PI / 2;
  signFront.position.set(13.99, 3.9, 0.4);
  const signBack = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9), signMat);
  signBack.rotation.y = -Math.PI / 2;
  signBack.position.set(13.21, 3.9, 0.4);
  group.add(signFront, signBack);

  // 1. Central Ornamental Cascading Reflection Pool ("Süs Havuzu")
  const poolX = 0.6;
  const poolZ = -3.4;
  const poolOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.42, 16), mats.travertine);
  poolOuter.position.set(poolX, 0.25, poolZ);
  poolOuter.castShadow = true;
  poolOuter.receiveShadow = true;
  const poolWater = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.14, 16), mats.water);
  poolWater.position.set(poolX, 0.42, poolZ);
  const fountainPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.15, 12), mats.travertine);
  fountainPedestal.position.set(poolX, 0.82, poolZ);
  fountainPedestal.castShadow = true;
  const fountainBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.45, 0.28, 14), mats.creamPlaster);
  fountainBowl.position.set(poolX, 1.38, poolZ);
  fountainBowl.castShadow = true;
  const jetSprayMat = new THREE.MeshStandardMaterial({
    color: 0xdff6ff,
    emissive: 0x7acde6,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.85,
  });
  const jetSpray = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 10), jetSprayMat);
  jetSpray.position.set(poolX, 1.9, poolZ);
  group.add(poolOuter, poolWater, fountainPedestal, fountainBowl, jetSpray);
  addBoxCollider(colliders, lx + poolX, lz + poolZ, 6.8, 6.8, 1.6);

  // 2. Semi-Circular Stone Amphitheater ("Amfi Tiyatro") — North-West Quadrant
  const amfiX = -7.8;
  const amfiZ = -5.6;
  const stageDeck = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.32, 18), mats.darkTimber);
  stageDeck.position.set(amfiX + 1.2, 0.22, amfiZ + 1.2);
  stageDeck.receiveShadow = true;
  group.add(stageDeck);

  for (let tier = 0; tier < 3; tier++) {
    const rOut = 5.4 - tier * 1.05;
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(rOut, rOut + 0.15, 0.36 + tier * 0.26, 16, 1, false, Math.PI * 0.72, Math.PI * 1.06),
      tier % 2 === 0 ? mats.travertine : mats.creamPlaster
    );
    step.position.set(amfiX + 1.2, 0.24 + tier * 0.16, amfiZ + 1.2);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
  }
  addBoxCollider(colliders, lx + amfiX - 1.2, lz + amfiZ - 1.2, 5.2, 5.2, 1.4);

  // 3. Nevzat Biçer Park Kafe & Sosyal Tesis ("Park Kafe") — South-West Quadrant
  const cafeX = -7.6;
  const cafeZ = 6.2;
  const cafeDeck = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.28, 7.6), mats.plaza);
  cafeDeck.position.set(cafeX, 0.16, cafeZ);
  cafeDeck.receiveShadow = true;
  group.add(cafeDeck);

  const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.6, 4.8), mats.creamPlaster);
  cafeBody.position.set(cafeX - 0.8, 2.08, cafeZ + 0.6);
  cafeBody.castShadow = true;
  cafeBody.receiveShadow = true;
  group.add(cafeBody);

  const cafeRoof = new THREE.Mesh(
    createHipRoofGeometry(7.5, 5.5, 1.45),
    mats.terracottaRoof
  );
  cafeRoof.position.set(cafeX - 0.8, 3.88, cafeZ + 0.6);
  cafeRoof.castShadow = true;
  group.add(cafeRoof);

  // Wide glass cafe windows + entrance door facing east path
  const cafeWinF = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.85, 0.14), mats.windowLit);
  cafeWinF.position.set(cafeX - 0.8, 1.8, cafeZ - 1.82);
  const cafeWinE = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 2.6), mats.windowLit);
  cafeWinE.position.set(cafeX + 2.62, 1.8, cafeZ + 0.6);
  group.add(cafeWinF, cafeWinE);

  // Timber Pergola Porch & Outdoor Cafe Umbrellas
  [-2.2, 2.2].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.6, 8), mats.darkTimber);
    post.position.set(cafeX + px, 1.5, cafeZ - 2.6);
    post.castShadow = true;
    group.add(post);
  });
  const pergolaTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 2.2), mats.darkTimber);
  pergolaTop.position.set(cafeX, 2.82, cafeZ - 2.0);
  pergolaTop.castShadow = true;
  group.add(pergolaTop);

  const cafeUmbrellaMat = new THREE.MeshStandardMaterial({ color: 0xc8643c, roughness: 0.72 });
  [cafeX + 3.4, cafeX + 3.4].forEach((ux, i) => {
    const uz = cafeZ - 1.4 + i * 3.0;
    const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 10), mats.creamPlaster);
    tbl.position.set(ux, 0.88, uz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.62, 8), mats.wroughtIron);
    leg.position.set(ux, 0.56, uz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), mats.wroughtIron);
    pole.position.set(ux, 1.35, uz);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.45, 8), cafeUmbrellaMat);
    cap.position.set(ux, 2.42, uz);
    cap.castShadow = true;
    group.add(tbl, leg, pole, cap);
  });
  addBoxCollider(colliders, lx + cafeX - 0.8, lz + cafeZ + 0.6, 7.0, 5.0, 5.5);

  // 4. Mini Basketball & Outdoor Fitness Court — North-East Quadrant
  const courtX = 7.6;
  const courtZ = -5.8;
  const courtMat = new THREE.MeshStandardMaterial({
    map: createMiniCourtTexture(),
    roughness: 0.84,
  });
  const courtPad = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 6.8), courtMat);
  courtPad.position.set(courtX, 0.12, courtZ);
  courtPad.receiveShadow = true;
  group.add(courtPad);

  // Basketball Hoop Post & Backboard
  const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.1, 8), mats.wroughtIron);
  hoopPole.position.set(courtX, 1.65, courtZ - 3.1);
  hoopPole.castShadow = true;
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.9, 0.08), mats.whitePlaster);
  board.position.set(courtX, 2.95, courtZ - 2.8);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.035, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xd95f32, roughness: 0.4 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(courtX, 2.75, courtZ - 2.48);
  group.add(hoopPole, board, rim);

  // Two bright yellow/green park fitness machines
  const fitYellow = new THREE.MeshStandardMaterial({ color: 0xe6af3c, roughness: 0.45 });
  const fitGreen = new THREE.MeshStandardMaterial({ color: 0x3b7a57, roughness: 0.5 });
  [courtX - 2.4, courtX + 2.4].forEach((fx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.45, 8), fitGreen);
    post.position.set(fx, 0.85, courtZ + 2.4);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.12), fitYellow);
    bar.position.set(fx, 1.45, courtZ + 2.4);
    group.add(post, bar);
  });
  addBoxCollider(colliders, lx + courtX, lz + courtZ - 3.1, 0.6, 0.6, 3.4);

  // 5. Children's Playground — South-East Quadrant
  const playX = 8.2;
  const playZ = 6.4;
  const playPadMat = new THREE.MeshStandardMaterial({ color: 0xb97c52, roughness: 0.92 });
  const playPad = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.2, 6.2), playPadMat);
  playPad.position.set(playX, 0.12, playZ);
  playPad.receiveShadow = true;
  group.add(playPad);

  // Slide tower & colorful slide chute
  const slideMat = new THREE.MeshStandardMaterial({ color: 0xd94f44, roughness: 0.45 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 1.1), fitYellow);
  tower.position.set(playX - 1.4, 1.05, playZ - 1.0);
  tower.castShadow = true;
  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 2.1), slideMat);
  chute.position.set(playX - 1.4, 0.95, playZ + 0.35);
  chute.rotation.x = 0.58;
  chute.castShadow = true;
  // Swing frame
  [-0.95, 0.95].forEach((sx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6), fitGreen);
    leg.position.set(playX + 1.4 + sx, 1.15, playZ + 0.6);
    group.add(leg);
  });
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), fitYellow);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(playX + 1.4, 2.22, playZ + 0.6);
  group.add(tower, chute, topBar);
  addBoxCollider(colliders, lx + playX - 1.4, lz + playZ - 0.6, 1.5, 2.4, 2.2);

  // 6. Wooden Slatted Park Benches, Flowerbeds, Lamps & Curated Park Trees
  const benchCoords: [number, number, number][] = [
    [-2.8, -0.9, 0],
    [3.6, -0.9, 0],
    [4.4, -3.4, -Math.PI / 2],
    [-3.2, 4.2, Math.PI / 2],
    [5.0, 2.2, Math.PI],
  ];
  benchCoords.forEach(([bx, bz, rotY]) => {
    const b = new THREE.Group();
    b.position.set(bx, 0.18, bz);
    b.rotation.y = rotY;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.09, 0.48), mats.darkTimber);
    seat.position.y = 0.42;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.42, 0.08), mats.darkTimber);
    back.position.set(0, 0.68, -0.2);
    back.rotation.x = -0.15;
    [-0.58, 0.58].forEach((lxOff) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.42), mats.wroughtIron);
      leg.position.set(lxOff, 0.21, 0);
      b.add(leg);
    });
    b.add(seat, back);
    group.add(b);
  });

  // Stone Flowerbeds flanking East Entrance & Pool
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe05d4d, roughness: 0.8 });
  const leafBushMat = new THREE.MeshStandardMaterial({ color: 0x4e7c3e, roughness: 0.85 });
  [
    [11.4, -2.2],
    [11.4, 3.0],
    [-2.4, -7.8],
    [3.4, -7.8],
  ].forEach(([fx, fz]) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 1.15), mats.travertine);
    planter.position.set(fx, 0.25, fz);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 0.9), leafBushMat);
    soil.position.set(fx, 0.4, fz);
    for (let bi = -1; bi <= 1; bi++) {
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), flowerMat);
      bloom.position.set(fx + bi * 0.52, 0.58, fz);
      group.add(bloom);
    }
    group.add(planter, soil);
  });

  // Classic Warm Park Lanterns
  [
    [11.6, -1.3],
    [11.6, 2.1],
    [3.8, -0.6],
    [-3.2, -0.6],
    [2.6, 5.2],
    [-2.6, 5.2],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.07, 2.95, 10), mats.wroughtIron);
    post.position.set(px, 1.56, pz);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mats.lampBulb);
    globe.position.set(px, 3.12, pz);
    group.add(post, globe);
  });

  // Realistic Sculpted Mediterranean Plane, Olive & Pine Trees around Park Perimeter
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x694f3a, roughness: 0.92 });
  const planeLeafMat = new THREE.MeshStandardMaterial({ color: 0x568245, roughness: 0.86 });
  const oliveLeafMat = new THREE.MeshStandardMaterial({ color: 0x6f8d58, roughness: 0.88 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x3b6941, roughness: 0.86 });

  const treeSpecs: { x: number; z: number; kind: 'plane' | 'olive' | 'pine'; s: number }[] = [
    { x: -12.0, z: -10.0, kind: 'pine', s: 1.1 },
    { x: -12.0, z: 0.4, kind: 'plane', s: 1.05 },
    { x: -12.0, z: 10.0, kind: 'pine', s: 1.0 },
    { x: -3.2, z: -10.0, kind: 'olive', s: 0.95 },
    { x: 3.6, z: -10.0, kind: 'plane', s: 1.05 },
    { x: 11.8, z: -10.0, kind: 'pine', s: 1.1 },
    { x: 12.0, z: 9.8, kind: 'plane', s: 1.0 },
    { x: 3.8, z: 9.8, kind: 'olive', s: 0.92 },
    { x: -3.4, z: 9.8, kind: 'olive', s: 0.9 },
  ];

  treeSpecs.forEach(({ x, z, kind, s }) => {
    const t = new THREE.Group();
    t.position.set(x, 0.16, z);
    t.scale.setScalar(s);

    if (kind === 'pine') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.2, 8), trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      t.add(trunk);
      [0, 1, 2].forEach((tier) => {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.25 - tier * 0.28, 1.55 - tier * 0.2, 7),
          pineLeafMat
        );
        cone.position.y = 2.1 + tier * 0.92;
        cone.castShadow = true;
        t.add(cone);
      });
    } else {
      const leafMat = kind === 'olive' ? oliveLeafMat : planeLeafMat;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 2.1, 8), trunkMat);
      trunk.position.y = 1.05;
      trunk.castShadow = true;
      t.add(trunk);
      [
        [0, 2.75, 0, 1.25],
        [-0.65, 2.35, 0.42, 0.85],
        [0.62, 2.45, -0.35, 0.88],
      ].forEach(([cx, cy, cz, r]) => {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMat);
        puff.scale.set(1.12, 0.84, 1.08);
        puff.position.set(cx, cy, cz);
        puff.castShadow = true;
        t.add(puff);
      });
    }
    group.add(t);
  });

  const ringMesh = makeDiscoveryRing(lx + 15.2, lz);
  return { def, group, ringMesh, colliders };
}
