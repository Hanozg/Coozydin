import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { createGableRoofGeometry, createHipRoofGeometry } from '../roofGeometry';
import { addBoxCollider, BuiltLandmark, makeDiscoveryRing } from './shared';

/**
 * 9. Forum Aydın Yaşam & AVM (Open-Air Lifestyle Mall)
 */
export function buildForumAvm(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Wide Travertine Lifestyle Mall Courtyard
  const deck = new THREE.Mesh(new THREE.BoxGeometry(26, 0.25, 24), mats.plaza);
  deck.position.y = 0.125;
  deck.receiveShadow = true;
  group.add(deck);

  // North & South Two-Story Retail Wings
  [-7.2, 7.2].forEach((wz) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(22, 5.8, 5.6), mats.creamPlaster);
    wing.position.set(0, 3.05, wz);
    wing.castShadow = true;
    wing.receiveShadow = true;
    group.add(wing);

    const trim = new THREE.Mesh(
      createHipRoofGeometry(22.6, 6.2, 1.35),
      mats.terracottaRoof
    );
    trim.position.set(0, 5.95, wz);
    trim.castShadow = true;
    group.add(trim);

    // Shopfront glass bays
    for (let sx = -8; sx <= 8; sx += 4) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.16), mats.windowLit);
      glass.position.set(sx, 1.6, wz > 0 ? wz - 2.82 : wz + 2.82);
      group.add(glass);
    }
  });

  // East Main Anchor Pavilion
  const eastWing = new THREE.Mesh(new THREE.BoxGeometry(5.6, 6.6, 18.0), mats.peachPlaster);
  eastWing.position.set(8.6, 3.45, 0);
  eastWing.castShadow = true;
  group.add(eastWing);

  // Glass Atrium Canopy over Central Promenade
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.22, 8.8), mats.glassAtrium);
  canopy.position.set(-1.0, 5.4, 0);
  group.add(canopy);

  // Central Ornamental Courtyard Fountain
  const fRim = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.4, 16), mats.travertine);
  fRim.position.set(-1.5, 0.35, 0);
  group.add(fRim);

  const fWater = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 16), mats.water);
  fWater.position.set(-1.5, 0.54, 0);
  group.add(fWater);

  // Outdoor Café Umbrellas
  const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xc97b36, roughness: 0.7 });
  [-6.5, -6.5, 2.8, 2.8].forEach((ux, i) => {
    const uz = i % 2 === 0 ? -2.6 : 2.6;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), mats.wroughtIron);
    pole.position.set(ux, 1.3, uz);
    group.add(pole);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.55, 8), umbrellaMat);
    cap.position.set(ux, 2.5, uz);
    cap.castShadow = true;
    group.add(cap);
  });

  const ringMesh = makeDiscoveryRing(lx - 14.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz - 7.2, 22, 5.6, 7.2);
  addBoxCollider(colliders, lx, lz + 7.2, 22, 5.6, 7.2);
  addBoxCollider(colliders, lx + 8.6, lz, 5.6, 18.0, 6.8);

  return { def, group, ringMesh, colliders };
}

function createKipaParkingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#40464E';
  ctx.fillRect(0, 0, 512, 256);

  // Crisp asphalt parking bays
  ctx.strokeStyle = '#ECEFF2';
  ctx.lineWidth = 4;
  for (let x = 28; x <= 484; x += 56) {
    if (x > 210 && x < 295) continue; // central pedestrian crosswalk lane
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(28, 22);
  ctx.lineTo(196, 22);
  ctx.moveTo(316, 22);
  ctx.lineTo(484, 22);
  ctx.stroke();

  // Blue accessible bay & pedestrian zebra crossing
  ctx.fillStyle = '#1D5CA3';
  ctx.fillRect(142, 26, 50, 96);

  ctx.fillStyle = '#F5F7FA';
  for (let y = 30; y <= 220; y += 26) {
    ctx.fillRect(226, y, 60, 14);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createKipaSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#15549A';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#C92A35';
  ctx.fillRect(0, 102, 512, 26);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KİPA AVM', 256, 48);

  ctx.fillStyle = '#FFE8B8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('AYDIN İSTASYON BULVARI · HİPERMARKET', 256, 86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 15. Aydın Kipa AVM (Cumhuriyet Mah. İstasyon Bulvarı)
 */
export function buildKipaAvm(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const colliders: ColliderBox[] = [];

  // 1. Concrete Plaza & Front Open Parking Forecourt facing North (-Z toward İstasyon Caddesi)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(24.2, 0.22, 16.2), mats.plaza);
  plinth.position.y = 0.11;
  plinth.receiveShadow = true;
  group.add(plinth);

  const parkingMat = new THREE.MeshStandardMaterial({
    map: createKipaParkingTexture(),
    roughness: 0.86,
  });
  const parkingLot = new THREE.Mesh(new THREE.PlaneGeometry(22.8, 6.2), parkingMat);
  parkingLot.rotation.x = -Math.PI / 2;
  parkingLot.position.set(0, 0.23, -4.7);
  parkingLot.receiveShadow = true;
  group.add(parkingLot);

  // Parked cars in front bays + shopping cart shelter + EV charging totem
  const parkedCarColors = [0xd9e1e8, 0x3b6e8c, 0xb84038];
  [-7.8, -5.2, 5.8].forEach((cx, i) => {
    const car = new THREE.Group();
    car.position.set(cx, 0.24, -5.6);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.56, 2.8),
      new THREE.MeshStandardMaterial({ color: parkedCarColors[i], roughness: 0.35, metalness: 0.25 })
    );
    body.position.y = 0.38;
    body.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.44, 1.45), mats.glassAtrium);
    cabin.position.set(0, 0.84, 0.1);
    car.add(body, cabin);
    group.add(car);
  });

  // Cart return shelter + EV charger
  const cartShelter = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.35, 2.2), mats.glassAtrium);
  cartShelter.position.set(8.8, 0.9, -4.8);
  const evCharger = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1.65, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.4 })
  );
  evCharger.position.set(-9.8, 1.05, -3.2);
  group.add(cartShelter, evCharger);

  // 2. Main Wide Horizontal Hypermarket & Mall Volume
  const kipaBlueMat = new THREE.MeshStandardMaterial({ color: 0x15549a, roughness: 0.45 });
  const kipaRedMat = new THREE.MeshStandardMaterial({ color: 0xc92a35, roughness: 0.45 });
  const claddingMat = new THREE.MeshStandardMaterial({ color: 0xe6e4de, roughness: 0.68 });

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(22.2, 5.8, 8.6), claddingMat);
  mainHall.position.set(0, 3.12, 2.8);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  group.add(mainHall);

  // Signature Blue & Red Kipa Fascia Bands along Upper Roofline
  const upperBlueBand = new THREE.Mesh(new THREE.BoxGeometry(22.45, 1.15, 8.85), kipaBlueMat);
  upperBlueBand.position.set(0, 5.55, 2.8);
  const lowerRedStripe = new THREE.Mesh(new THREE.BoxGeometry(22.5, 0.28, 8.9), kipaRedMat);
  lowerRedStripe.position.set(0, 4.85, 2.8);
  group.add(upperBlueBand, lowerRedStripe);

  // Shopfront Reflective Curtain Glass Bays along North Facade
  [-7.2, -4.0, 4.0, 7.2].forEach((wx) => {
    const shopWin = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 0.16), mats.windowLit);
    shopWin.position.set(wx, 1.75, -1.52);
    group.add(shopWin);
  });

  // 3. Projecting Glass Entrance Atrium + Cantilevered Canopy + "KİPA AVM" Billboard
  const atriumBox = new THREE.Mesh(new THREE.BoxGeometry(6.6, 4.6, 1.6), mats.glassAtrium);
  atriumBox.position.set(0, 2.52, -1.9);
  atriumBox.castShadow = true;
  const entranceDoor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.2), mats.windowLit);
  entranceDoor.position.set(0, 1.42, -2.72);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.26, 2.6), kipaBlueMat);
  canopy.position.set(0, 3.75, -2.6);
  canopy.castShadow = true;
  group.add(atriumBox, entranceDoor, canopy);

  const kipaSignTex = createKipaSignTexture();
  const kipaSignMat = new THREE.MeshStandardMaterial({ map: kipaSignTex, roughness: 0.36 });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.4, 1.65, 0.28), kipaBlueMat);
  signBoard.position.set(0, 6.2, -1.55);
  signBoard.castShadow = true;
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 1.5), kipaSignMat);
  signFace.rotation.y = Math.PI;
  signFace.position.set(0, 6.2, -1.7);
  const signFaceBack = new THREE.Mesh(new THREE.PlaneGeometry(8.1, 1.5), kipaSignMat);
  signFaceBack.position.set(0, 6.2, -1.4);
  group.add(signBoard, signFace, signFaceBack);

  // Rooftop Glass Skylight Atrium & HVAC Units (realistic aerial silhouette)
  const skylight = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.65, 2.2), mats.glassAtrium);
  skylight.position.set(0, 6.3, 2.8);
  group.add(skylight);
  [-6.8, 6.8].forEach((hx) => {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 1.6), mats.creamPlaster);
    hvac.position.set(hx, 6.45, 4.4);
    group.add(hvac);
  });

  // Outdoor Cafe Tables beside East Entrance Promenade
  const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xc92a35, roughness: 0.7 });
  [9.2, 10.6].forEach((ux, i) => {
    const uz = -0.2 + i * 1.8;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), mats.wroughtIron);
    pole.position.set(ux, 1.2, uz);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.42, 8), umbrellaMat);
    cap.position.set(ux, 2.25, uz);
    cap.castShadow = true;
    group.add(pole, cap);
  });

  const ringMesh = makeDiscoveryRing(lx, lz - 9.8);
  addBoxCollider(colliders, lx, lz + 2.6, 22.4, 9.2, 6.6);
  [-7.8, -5.2, 5.8].forEach((cx) => {
    addBoxCollider(colliders, lx + cx, lz - 5.6, 1.7, 3.0, 1.5);
  });

  return { def, group, ringMesh, colliders };
}

function createBazaarSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = '#FFF8EA';
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 48);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(subtitle, 256, 92);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 16. Sevgi Yolu (Güzelhisar – Hasanefendi Yaya Caddesi & Işık Takları)
 */
export function buildSevgiYolu(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const colliders: ColliderBox[] = [];

  // Flanking Travertine Sidewalk Aprons (keeping center roadway z in [-3.9..+3.9] clear & drivable)
  [-5.15, 5.15].forEach((az) => {
    const apron = new THREE.Mesh(new THREE.BoxGeometry(25.2, 0.22, 2.3), mats.plaza);
    apron.position.set(0, 0.04, az);
    apron.receiveShadow = true;
    group.add(apron);
  });

  const signMat = new THREE.MeshStandardMaterial({
    map: createBazaarSignTexture('SEVGİ YOLU', 'GÜZELHİSAR · AYDIN EFELER', '#7D3524', '#F3C76B'),
    roughness: 0.42,
  });

  // East & West Stone + Wrought-Iron Welcome Portal Arches spanning across Sevgi Yolu
  [-11.5, 11.5].forEach((ax) => {
    [-4.65, 4.65].forEach((az) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.85), mats.travertine);
      base.position.set(ax, 0.24, az);
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.62, 4.3, 0.62), mats.creamPlaster);
      col.position.set(ax, 2.35, az);
      col.castShadow = true;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.26, 0.84), mats.travertine);
      cap.position.set(ax, 4.55, az);
      group.add(base, col, cap);
      addBoxCollider(colliders, lx + ax, lz + az, 0.9, 0.9, 4.7);
    });

    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 10.2), mats.wroughtIron);
    beam.position.set(ax, 4.72, 0);
    beam.castShadow = true;
    group.add(beam);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.96, 4.6), mats.wroughtIron);
    signBoard.position.set(ax, 5.25, 0);
    signBoard.castShadow = true;
    const signE = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.84), signMat);
    signE.rotation.y = Math.PI / 2;
    signE.position.set(ax + 0.13, 5.25, 0);
    const signW = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.84), signMat);
    signW.rotation.y = -Math.PI / 2;
    signW.position.set(ax - 0.13, 5.25, 0);
    group.add(signBoard, signE, signW);
  });

  // Overhead Timber & Iron Pergola Light Arches + Warm String-Light Festoons
  [-7.5, -3.75, 0, 3.75, 7.5].forEach((px) => {
    [-4.65, 4.65].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), mats.wroughtIron);
      post.position.set(px, 2.15, pz);
      post.castShadow = true;
      group.add(post);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 9.6), mats.darkTimber);
    crossBeam.position.set(px, 4.25, 0);
    crossBeam.castShadow = true;
    group.add(crossBeam);

    for (let bz = -3.6; bz <= 3.6; bz += 1.2) {
      const sag = Math.cos((bz / 4.2) * Math.PI * 0.5) * 0.25;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mats.lampBulb);
      bulb.position.set(px, 4.08 - sag, bz);
      group.add(bulb);
    }
  });

  // Sahaf / Kitapçı Kiosk on South Promenade (local x = 0, z = +5.35)
  const kioskBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.45, 1.85), mats.darkTimber);
  kioskBase.position.set(0, 1.32, 5.4);
  kioskBase.castShadow = true;
  const kioskRoof = new THREE.Mesh(createGableRoofGeometry(4.8, 2.25, 0.85), mats.terracottaRoof);
  kioskRoof.position.set(0, 2.55, 5.4);
  kioskRoof.castShadow = true;
  const kioskAwning = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 1.05),
    new THREE.MeshStandardMaterial({ color: 0xb64b36, map: mats.stripedAwningMap, roughness: 0.78 })
  );
  kioskAwning.position.set(0, 2.18, 4.25);
  kioskAwning.rotation.x = -0.25;
  group.add(kioskBase, kioskRoof, kioskAwning);

  // Colorful Book Spines Display Rack in front of Sahaf Kiosk
  const bookColors = [0xc85a32, 0x3b6e8c, 0x5d8a48, 0xe3a84f, 0x7c4558];
  bookColors.forEach((hex, idx) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.34, 0.28),
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7 })
    );
    book.position.set(-1.3 + idx * 0.65, 1.15, 4.35);
    group.add(book);
  });
  addBoxCollider(colliders, lx, lz + 5.4, 4.6, 2.1, 3.5);

  // Flower Stall (Çiçekçi Standı) & Benches on South & North Promenades
  const flowerStand = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.85, 1.25), mats.creamPlaster);
  flowerStand.position.set(-6.4, 0.52, 5.35);
  flowerStand.castShadow = true;
  group.add(flowerStand);
  const bloomPalette = [0xe45a52, 0xf2b938, 0xde6ba0, 0x62a858];
  for (let fi = 0; fi < 4; fi++) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.28, 8), mats.terracottaPlaster);
    pot.position.set(-7.35 + fi * 0.64, 1.08, 5.35);
    const bloom = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.26, 0),
      new THREE.MeshStandardMaterial({ color: bloomPalette[fi], roughness: 0.78 })
    );
    bloom.position.set(-7.35 + fi * 0.64, 1.32, 5.35);
    group.add(pot, bloom);
  }
  addBoxCollider(colliders, lx - 6.4, lz + 5.35, 3.0, 1.4, 1.6);

  // Decorative Street Benches & Planters on North Sidewalk
  [-6.2, 0, 6.2].forEach((bx) => {
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.52), mats.darkTimber);
    benchSeat.position.set(bx, 0.52, -5.2);
    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.42, 0.09), mats.darkTimber);
    benchBack.position.set(bx, 0.78, -5.44);
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.46, 0.72), mats.travertine);
    planter.position.set(bx + 1.9, 0.34, -5.2);
    const bush = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({ color: 0x558444, roughness: 0.85 })
    );
    bush.position.set(bx + 1.9, 0.68, -5.2);
    group.add(benchSeat, benchBack, planter, bush);
  });

  const ringMesh = makeDiscoveryRing(lx, lz);
  return { def, group, ringMesh, colliders };
}

/**
 * 17. Yağcılar İçi Tarihi Çarşısı (Cuma Mah. – Geleneksel Aydın Arastası)
 */
export function buildYagcilarIci(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const colliders: ColliderBox[] = [];

  // Retaining Skirt & Cobblestone Arasta Courtyard (20m x 18m)
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(20.6, 2.4, 18.6), mats.travertine);
  skirt.position.y = -1.15;
  skirt.receiveShadow = true;
  group.add(skirt);

  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.3, 18.0), mats.cobble);
  courtyard.position.y = 0.15;
  courtyard.receiveShadow = true;
  group.add(courtyard);

  const borderCurb = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.2, 18.4), mats.travertine);
  borderCurb.position.y = 0.1;
  group.add(borderCurb);

  // East Stone Arasta Entrance Gate facing Yağcılar Cd. (+X)
  [-2.8, 2.8].forEach((gz) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.6, 1.2), mats.travertine);
    pier.position.set(9.3, 2.45, gz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    group.add(pier);
    addBoxCollider(colliders, lx + 9.3, lz + gz, 1.35, 1.35, 4.9);
  });
  const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 7.2), mats.travertine);
  gateLintel.position.set(9.3, 5.15, 0);
  gateLintel.castShadow = true;
  const gateRoof = new THREE.Mesh(createGableRoofGeometry(1.8, 7.6, 0.95), mats.terracottaRoof);
  gateRoof.position.set(9.3, 5.72, 0);
  gateRoof.castShadow = true;
  group.add(gateLintel, gateRoof);

  const arastaSignMat = new THREE.MeshStandardMaterial({
    map: createBazaarSignTexture('YAĞCILAR İÇİ', 'TARİHİ AYDIN ÇARŞISI · ARASTA', '#3D4B2F', '#E8BD68'),
    roughness: 0.45,
  });
  const signFaceOut = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.92), arastaSignMat);
  signFaceOut.rotation.y = Math.PI / 2;
  signFaceOut.position.set(10.02, 5.18, 0);
  const signFaceIn = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.92), arastaSignMat);
  signFaceIn.rotation.y = -Math.PI / 2;
  signFaceIn.position.set(8.58, 5.18, 0);
  group.add(signFaceOut, signFaceIn);

  // North & South Traditional Bazaar Arcade Wings flanking Central Arasta Lane
  const wingConfigs = [
    { z: -5.8, awningDir: 1, wallMat: mats.creamPlaster, cumbaMat: mats.ochrePlaster },
    { z: 5.8, awningDir: -1, wallMat: mats.peachPlaster, cumbaMat: mats.whitePlaster },
  ];
  const awningMat1 = new THREE.MeshStandardMaterial({
    color: 0xb64b36,
    map: mats.stripedAwningMap,
    roughness: 0.8,
  });
  const awningMat2 = new THREE.MeshStandardMaterial({
    color: 0x4b6e45,
    map: mats.stripedAwningMap,
    roughness: 0.8,
  });

  wingConfigs.forEach((wc, wi) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(16.2, 4.4, 5.0), wc.wallMat);
    body.position.set(-0.8, 2.45, wc.z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const cumba = new THREE.Mesh(new THREE.BoxGeometry(16.6, 2.1, 5.4), wc.cumbaMat);
    cumba.position.set(-0.8, 3.85, wc.z);
    cumba.castShadow = true;
    group.add(cumba);

    const roof = new THREE.Mesh(createGableRoofGeometry(17.2, 6.0, 1.85), mats.terracottaRoof);
    roof.position.set(-0.8, 4.9, wc.z);
    roof.castShadow = true;
    group.add(roof);

    // Shop doors, lit upper windows & striped awnings facing central arasta alley
    [-6.2, -2.6, 1.0, 4.6].forEach((sx, si) => {
      const faceZ = wc.z + wc.awningDir * 2.52;
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 0.16), mats.darkTimber);
      door.position.set(sx, 1.35, faceZ);
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.05, 0.16), mats.windowLit);
      win.position.set(sx, 3.85, wc.z + wc.awningDir * 2.72);
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.12, 1.45),
        (si + wi) % 2 === 0 ? awningMat1 : awningMat2
      );
      awning.position.set(sx, 2.55, wc.z + wc.awningDir * 3.15);
      awning.rotation.x = wc.awningDir * 0.24;
      awning.castShadow = true;
      group.add(door, win, awning);
    });

    addBoxCollider(colliders, lx - 0.8, lz + wc.z, 16.4, 5.3, 6.8);
  });

  // Olive-Oil Amphoras (Zeytinyağı Küpleri), Spice Sacks & Wicker Fig Baskets along Shop Fronts
  const amphoraMat = new THREE.MeshStandardMaterial({
    color: 0xb85f3c,
    roughness: 0.7,
    metalness: 0.06,
    flatShading: false,
  });
  const sackMat = new THREE.MeshStandardMaterial({
    color: 0xc2a274,
    roughness: 0.78,
    metalness: 0.02,
    flatShading: false,
  });
  const spiceColors = [0xd48e28, 0xb8382c, 0x6c8738];

  const küpProfile = [
    new THREE.Vector2(0.17, 0.0),
    new THREE.Vector2(0.24, 0.12),
    new THREE.Vector2(0.32, 0.36),
    new THREE.Vector2(0.29, 0.56),
    new THREE.Vector2(0.17, 0.72),
    new THREE.Vector2(0.15, 0.8),
    new THREE.Vector2(0.2, 0.85),
    new THREE.Vector2(0.18, 0.88),
    new THREE.Vector2(0.13, 0.82),
  ];
  const küpGeo = new THREE.LatheGeometry(küpProfile, 24);
  küpGeo.computeVertexNormals();
  const küpHandleGeoL = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.26, 0.54, 0),
      new THREE.Vector3(-0.33, 0.68, 0),
      new THREE.Vector3(-0.18, 0.78, 0),
    ]),
    14,
    0.026,
    10,
    false
  );
  const küpHandleGeoR = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.26, 0.54, 0),
      new THREE.Vector3(0.33, 0.68, 0),
      new THREE.Vector3(0.18, 0.78, 0),
    ]),
    14,
    0.026,
    10,
    false
  );

  const sackProfile = [
    new THREE.Vector2(0.26, 0.0),
    new THREE.Vector2(0.32, 0.16),
    new THREE.Vector2(0.3, 0.4),
    new THREE.Vector2(0.24, 0.54),
    new THREE.Vector2(0.28, 0.6),
  ];
  const sackGeo = new THREE.LatheGeometry(sackProfile, 22);
  sackGeo.computeVertexNormals();

  [-5.2, -1.6, 2.4, 5.4].forEach((px, idx) => {
    const küpGroup = new THREE.Group();
    küpGroup.position.set(px, 0.29, -2.75);
    const küp = new THREE.Mesh(küpGeo, amphoraMat);
    küp.castShadow = true;
    küp.receiveShadow = true;
    const hL = new THREE.Mesh(küpHandleGeoL, amphoraMat);
    hL.castShadow = true;
    hL.receiveShadow = true;
    const hR = new THREE.Mesh(küpHandleGeoR, amphoraMat);
    hR.castShadow = true;
    hR.receiveShadow = true;
    küpGroup.add(küp, hL, hR);

    const sack = new THREE.Mesh(sackGeo, sackMat);
    sack.position.set(px + 0.65, 0.3, 2.75);
    sack.castShadow = true;
    sack.receiveShadow = true;
    const spiceTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 12),
      new THREE.MeshStandardMaterial({
        color: spiceColors[idx % spiceColors.length],
        roughness: 0.75,
        flatShading: false,
      })
    );
    spiceTop.scale.set(1, 0.45, 1);
    spiceTop.position.set(px + 0.65, 0.86, 2.75);
    spiceTop.castShadow = true;
    spiceTop.receiveShadow = true;
    group.add(küpGroup, sack, spiceTop);
  });

  // Central West Courtyard Octagonal Stone Bazaar Fountain
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.65, 8), mats.travertine);
  fountainBase.position.set(-5.8, 0.52, 0);
  fountainBase.castShadow = true;
  const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 8), mats.water);
  fountainWater.position.set(-5.8, 0.8, 0);
  const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.35, 8), mats.travertine);
  fountainPillar.position.set(-5.8, 1.45, 0);
  group.add(fountainBase, fountainWater, fountainPillar);
  addBoxCollider(colliders, lx - 5.8, lz, 2.4, 2.4, 2.2);

  // Warm Overhead Market Lanterns across the Bazaar Alley
  [-4.5, -1.0, 2.5, 6.0].forEach((bx) => {
    for (let bz = -2.2; bz <= 2.2; bz += 1.1) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mats.lampBulb);
      bulb.position.set(bx, 3.85 - Math.cos((bz / 2.6) * Math.PI * 0.5) * 0.18, bz);
      group.add(bulb);
    }
  });

  const ringMesh = makeDiscoveryRing(lx + 10.8, lz);
  return { def, group, ringMesh, colliders };
}
