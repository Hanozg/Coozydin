import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { createHipRoofGeometry } from '../roofGeometry';
import { addBoxCollider, BuiltLandmark, makeDiscoveryRing } from './shared';

/**
 * 2. Bey Camii (Süleyman Bey Camii, 1683)
 */
export function buildBeyCamii(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(13.9, 2.4, 14.9), mats.travertine);
  skirt.position.y = -1.18;
  skirt.receiveShadow = true;
  group.add(skirt);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.4, 14.5), mats.travertine);
  plinth.position.y = 0.2;
  plinth.receiveShadow = true;
  group.add(plinth);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 5.4, 8.6), mats.travertine);
  hall.position.set(0, 3.1, -1.2);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  [-4.35, 4.35].forEach((wx) => {
    [-2.4, 0].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.0, 1.1), mats.windowLit);
      win.position.set(wx, 3.0, wz);
      group.add(win);
    });
  });

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.75, 1.5, 8), mats.travertine);
  drum.position.set(0, 6.5, -1.2);
  drum.castShadow = true;
  group.add(drum);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.45, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(0, 7.15, -1.2);
  dome.castShadow = true;
  group.add(dome);

  const alemStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), mats.brass);
  alemStem.position.set(0, 10.9, -1.2);
  group.add(alemStem);

  [-3.4, -1.15, 1.15, 3.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 3.8, 10), mats.creamPlaster);
    col.position.set(cx, 2.3, 4.8);
    col.castShadow = true;
    group.add(col);
  });
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.4, 2.4), mats.travertine);
  porticoRoof.position.set(0, 4.35, 4.1);
  porticoRoof.castShadow = true;
  group.add(porticoRoof);

  [-2.3, 0, 2.3].forEach((dx) => {
    const smDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mats.leadDome
    );
    smDome.position.set(dx, 4.55, 4.1);
    smDome.castShadow = true;
    group.add(smDome);
  });

  const minBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.6, 1.8), mats.travertine);
  minBase.position.set(-4.8, 2.7, 2.6);
  minBase.castShadow = true;
  group.add(minBase);

  const minShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 8.2, 12), mats.travertine);
  minShaft.position.set(-4.8, 8.9, 2.6);
  minShaft.castShadow = true;
  group.add(minShaft);

  const serefe = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.85, 0.48, 12), mats.creamPlaster);
  serefe.position.set(-4.8, 12.2, 2.6);
  group.add(serefe);

  const minUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 2.4, 12), mats.travertine);
  minUpper.position.set(-4.8, 13.6, 2.6);
  group.add(minUpper);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.58, 3.0, 12), mats.leadDome);
  spire.position.set(-4.8, 16.3, 2.6);
  spire.castShadow = true;
  group.add(spire);

  // South travertine threshold linking Bey Camii plinth seamlessly to Sevgi Yolu promenade
  const southThreshold = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.24, 1.9), mats.travertine);
  southThreshold.position.set(0, 0.12, 8.0);
  southThreshold.receiveShadow = true;
  group.add(southThreshold);

  const ringMesh = makeDiscoveryRing(lx, lz + 8.6);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 13.5, 14.5, 9.5);

  return { def, group, ringMesh, colliders };
}

/**
 * 3. Nasuh Paşa Külliyesi & Zincirli Han (1708)
 */
export function buildNasuhPasa(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(17.9, 2.2, 15.9), mats.travertine);
  skirt.position.y = -1.08;
  skirt.receiveShadow = true;
  group.add(skirt);

  const yard = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.25, 15.5), mats.plaza);
  yard.position.y = 0.125;
  yard.receiveShadow = true;
  group.add(yard);

  const addWing = (x: number, z: number, w: number, d: number, h = 5.4) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.almasik);
    wall.position.set(x, h / 2 + 0.2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.55, 0.16, d + 0.55), mats.darkTimber);
    eave.position.set(x, h + 0.25, z);
    group.add(eave);

    const roof = new THREE.Mesh(
      createHipRoofGeometry(w + 0.6, d + 0.6, 1.35),
      mats.terracottaRoof
    );
    roof.position.set(x, h + 0.32, z);
    roof.castShadow = true;
    group.add(roof);
  };

  addWing(0, -6.2, 17.2, 3.0);
  addWing(0, 6.2, 17.2, 3.0);
  addWing(7.1, 0, 3.0, 9.6);
  addWing(-7.1, -3.2, 3.0, 4.0);
  addWing(-7.1, 3.2, 3.0, 4.0);

  const gateTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 2.8), mats.travertine);
  gateTop.position.set(-7.1, 4.6, 0);
  gateTop.castShadow = true;
  group.add(gateTop);

  for (let x = -4.5; x <= 4.5; x += 2.25) {
    [-4.1, 4.1].forEach((z) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.0, 8), mats.creamPlaster);
      col.position.set(x, 1.7, z);
      group.add(col);
    });
  }

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.75, 8), mats.travertine);
  basin.position.set(0, 0.6, 0);
  basin.castShadow = true;
  group.add(basin);

  const poolWater = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.15, 8), mats.water);
  poolWater.position.set(0, 0.96, 0);
  group.add(poolWater);

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.1, 8), mats.creamPlaster);
    col.position.set(Math.cos(a) * 1.65, 2.0, Math.sin(a) * 1.65);
    group.add(col);
  }

  const sadirvanDome = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.4, 8), mats.leadDome);
  sadirvanDome.position.set(0, 3.7, 0);
  sadirvanDome.castShadow = true;
  group.add(sadirvanDome);

  const westStep = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 6.2), mats.travertine);
  westStep.position.set(-9.1, 0.11, 0);
  westStep.receiveShadow = true;
  group.add(westStep);

  const ringMesh = makeDiscoveryRing(lx - 10.2, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 17.5, 15.5, 6.8);

  return { def, group, ringMesh, colliders };
}

/**
 * 4. Ramazan Paşa Camii & Tarihi Çarşı (1595)
 */
export function buildRamazanPasa(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(14.4, 2.4, 13.4), mats.travertine);
  skirt.position.y = -1.18;
  skirt.receiveShadow = true;
  group.add(skirt);

  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 13), mats.cobble);
  base.position.y = 0.175;
  base.receiveShadow = true;
  group.add(base);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.6, 7.2), mats.almasik);
  hall.position.set(-1.5, 2.65, -1.2);
  hall.castShadow = true;
  group.add(hall);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.0, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(-1.5, 4.95, -1.2);
  dome.castShadow = true;
  group.add(dome);

  const minShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 10.5, 10), mats.travertine);
  minShaft.position.set(-5.6, 5.5, 1.8);
  minShaft.castShadow = true;
  group.add(minShaft);

  const minSpire = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.3, 10), mats.leadDome);
  minSpire.position.set(-5.6, 11.8, 1.8);
  group.add(minSpire);

  const shop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 6.4), mats.creamPlaster);
  shop.position.set(4.5, 2.4, -0.5);
  shop.castShadow = true;
  group.add(shop);

  const cumba = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.1, 2.8), mats.whitePlaster);
  cumba.position.set(4.5, 3.6, 2.9);
  cumba.castShadow = true;
  group.add(cumba);

  const shopRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), mats.terracottaRoof);
  shopRoof.rotation.y = Math.PI / 4;
  shopRoof.position.set(4.5, 5.4, 0.4);
  shopRoof.castShadow = true;
  group.add(shopRoof);

  const awningMat = new THREE.MeshStandardMaterial({ color: 0xb64b36, roughness: 0.75 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.8), awningMat);
  awning.position.set(4.5, 2.2, 3.4);
  awning.rotation.x = 0.25;
  group.add(awning);

  const ringMesh = makeDiscoveryRing(lx, lz + 9.2);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 14, 13, 6.4);

  return { def, group, ringMesh, colliders };
}

/**
 * 5. Cihanoğlu Külliyesi & Kulesi (1756)
 */
export function buildCihanoglu(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(15.4, 2.2, 15.4), mats.travertine);
  skirt.position.y = -1.08;
  skirt.receiveShadow = true;
  group.add(skirt);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 15), mats.travertine);
  plinth.position.y = 0.2;
  plinth.receiveShadow = true;
  group.add(plinth);

  const mosque = new THREE.Mesh(new THREE.BoxGeometry(7.0, 5.2, 7.0), mats.creamPlaster);
  mosque.position.set(-2.5, 3.0, -2.2);
  mosque.castShadow = true;
  group.add(mosque);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(-2.5, 5.6, -2.2);
  dome.castShadow = true;
  group.add(dome);

  const medrese = new THREE.Mesh(new THREE.BoxGeometry(11.5, 3.6, 3.4), mats.almasik);
  medrese.position.set(0.5, 2.2, 4.6);
  medrese.castShadow = true;
  group.add(medrese);

  const medRoof = new THREE.Mesh(
    createHipRoofGeometry(12.2, 4.1, 1.35),
    mats.terracottaRoof
  );
  medRoof.position.set(0.5, 4.0, 4.6);
  medRoof.castShadow = true;
  group.add(medRoof);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 11.2, 3.4), mats.travertine);
  tower.position.set(4.8, 6.0, -3.5);
  tower.castShadow = true;
  group.add(tower);

  const towerCrown = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.9, 4.0), mats.almasik);
  towerCrown.position.set(4.8, 11.8, -3.5);
  towerCrown.castShadow = true;
  group.add(towerCrown);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.8, 4), mats.terracottaRoof);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(4.8, 13.1, -3.5);
  group.add(towerRoof);

  const eastStep = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 6.4), mats.travertine);
  eastStep.position.set(7.7, 0.12, 0);
  eastStep.receiveShadow = true;
  group.add(eastStep);

  const ringMesh = makeDiscoveryRing(lx + 11.2, lz + 1.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 15, 15, 7.2);

  return { def, group, ringMesh, colliders };
}
