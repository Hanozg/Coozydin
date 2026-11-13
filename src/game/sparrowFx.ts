import * as THREE from 'three';
import { buildCloudClusterGeometry, SPARROW_PALETTE } from './sculptor';
import { getWalkableSurfaceHeightAt } from './terrain';

const _zeroMat4 = new THREE.Matrix4().makeScale(0, 0, 0);
const _dummy = new THREE.Object3D();
const _trailUp = new THREE.Vector3(0, 1, 0);
const _trailDir = new THREE.Vector3();
const _trailQuat = new THREE.Quaternion();
const _trailPos = new THREE.Vector3();
const _cloudWarm = new THREE.Color(0xfffaf0);
const _cloudGolden = new THREE.Color(0xffdcb8);
const _cloudNight = new THREE.Color(0x526180);
const _cloudStorm = new THREE.Color(0x6d7787);
const _cloudTarget = new THREE.Color();

interface ParticleSlot {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  vel: THREE.Vector3;
  age: number;
  maxAge: number;
  baseScale: number;
  gravity: number;
  spin: number;
  active: boolean;
}

interface RingSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
  startScale: number;
  endScale: number;
  baseOpacity: number;
  active: boolean;
}

interface WingTrailSlot {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  age: number;
  active: boolean;
}

interface DriftingCloud {
  inst: THREE.InstancedMesh;
  instanceIdx: number;
  orbitRadius: number;
  orbitAngle: number;
  angularSpeed: number;
  baseY: number;
  phase: number;
}

export interface CrumbPickup {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  baseY: number;
  respawnTimer: number;
  collected: boolean;
  phase: number;
}

export class SparrowFX {
  public readonly group = new THREE.Group();

  private readonly dustGeo: THREE.BufferGeometry;
  private readonly dustMat: THREE.MeshBasicMaterial;
  private readonly featherGeo: THREE.BufferGeometry;
  private readonly featherMat: THREE.MeshBasicMaterial;
  private readonly waterDropMat: THREE.MeshBasicMaterial;
  private readonly crumbGeo: THREE.BufferGeometry;
  private readonly crumbMat: THREE.MeshBasicMaterial;
  private readonly wingTrailGeo: THREE.BufferGeometry;
  private readonly wingTrailMat: THREE.MeshBasicMaterial;
  private readonly ringGeo: THREE.BufferGeometry;

  private readonly dustPool: { inst: THREE.InstancedMesh; slots: ParticleSlot[]; cursor: number };
  private readonly featherPool: { inst: THREE.InstancedMesh; slots: ParticleSlot[]; cursor: number };
  private readonly waterDropPool: { inst: THREE.InstancedMesh; slots: ParticleSlot[]; cursor: number };
  private readonly crumbPool: { inst: THREE.InstancedMesh; slots: ParticleSlot[]; cursor: number };

  private readonly rings: RingSlot[] = [];
  private ringCursor = 0;

  private readonly wingTrailInst: THREE.InstancedMesh;
  private readonly wingTrailSlots: WingTrailSlot[] = [];
  private wingTrailCursor = 0;

  private readonly cloudMeshes: THREE.InstancedMesh[] = [];
  private readonly cloudMat: THREE.MeshStandardMaterial;
  private readonly clouds: DriftingCloud[] = [];

  private readonly pickupGeo: THREE.BufferGeometry;
  private readonly pickupMat: THREE.MeshStandardMaterial;
  public readonly pickups: CrumbPickup[] = [];

  constructor(pickupSpots: Array<[number, number, number]>) {
    this.dustGeo = new THREE.IcosahedronGeometry(0.11, 0);
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xf4ede1, transparent: true, opacity: 0.72 });

    this.featherGeo = new THREE.BoxGeometry(0.08, 0.015, 0.22);
    this.featherMat = new THREE.MeshBasicMaterial({ color: 0xeadfce });

    this.waterDropMat = new THREE.MeshBasicMaterial({ color: SPARROW_PALETTE.waterFoam, transparent: true, opacity: 0.85 });

    this.crumbGeo = new THREE.DodecahedronGeometry(0.055, 0);
    this.crumbMat = new THREE.MeshBasicMaterial({ color: SPARROW_PALETTE.croissantGold });

    this.wingTrailGeo = new THREE.CylinderGeometry(0.024, 0.016, 1.0, 5, 1);
    this.wingTrailMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    this.ringGeo = new THREE.RingGeometry(0.28, 0.36, 28);
    this.ringGeo.rotateX(-Math.PI * 0.5);

    this.dustPool = this.createPool(this.dustGeo, this.dustMat, 48);
    this.featherPool = this.createPool(this.featherGeo, this.featherMat, 28);
    this.waterDropPool = this.createPool(this.dustGeo, this.waterDropMat, 36);
    this.crumbPool = this.createPool(this.crumbGeo, this.crumbMat, 28);

    const trailCap = 44;
    this.wingTrailInst = new THREE.InstancedMesh(this.wingTrailGeo, this.wingTrailMat, trailCap);
    this.wingTrailInst.frustumCulled = false;
    for (let i = 0; i < trailCap; i++) {
      this.wingTrailInst.setMatrixAt(i, _zeroMat4);
      this.wingTrailSlots.push({
        pos: new THREE.Vector3(),
        quat: new THREE.Quaternion(),
        age: 99,
        active: false,
      });
    }
    this.wingTrailInst.instanceMatrix.needsUpdate = true;
    this.group.add(this.wingTrailInst);

    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: SPARROW_PALETTE.goldGlow,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.ringGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.rings.push({
        mesh,
        mat,
        age: 0,
        maxAge: 0.65,
        startScale: 0.35,
        endScale: 3.4,
        baseOpacity: 0.85,
        active: false,
      });
    }

    // Storybook Puffy Cumulus Clouds floating over Efeler valley
    this.cloudMat = new THREE.MeshStandardMaterial({
      color: _cloudWarm,
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.0,
    });
    this.initClouds();

    // Collectible rooftop / park sesame seeds & fig treats
    this.pickupGeo = new THREE.OctahedronGeometry(0.24, 1);
    this.pickupMat = new THREE.MeshStandardMaterial({
      color: 0xf7c95c,
      emissive: 0xd98a2b,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.1,
    });
    pickupSpots.forEach(([x, y, z], idx) => {
      const m = new THREE.Mesh(this.pickupGeo, this.pickupMat);
      const safeY = y > 0 ? y : getWalkableSurfaceHeightAt(x, z) + 0.52;
      m.position.set(x, safeY, z);
      this.group.add(m);
      this.pickups.push({
        mesh: m,
        pos: new THREE.Vector3(x, safeY, z),
        baseY: safeY,
        respawnTimer: 0,
        collected: false,
        phase: idx * 0.75,
      });
    });
  }

  private createPool(geo: THREE.BufferGeometry, mat: THREE.Material, capacity: number) {
    const inst = new THREE.InstancedMesh(geo, mat, capacity);
    inst.frustumCulled = false;
    const slots: ParticleSlot[] = [];
    for (let i = 0; i < capacity; i++) {
      inst.setMatrixAt(i, _zeroMat4);
      slots.push({
        pos: new THREE.Vector3(),
        rot: new THREE.Euler(),
        vel: new THREE.Vector3(),
        age: 0,
        maxAge: 0.5,
        baseScale: 1,
        gravity: 9.5,
        spin: 0,
        active: false,
      });
    }
    inst.instanceMatrix.needsUpdate = true;
    this.group.add(inst);
    return { inst, slots, cursor: 0 };
  }

  private acquireSlot(pool: { slots: ParticleSlot[]; cursor: number }): ParticleSlot {
    const slot = pool.slots[pool.cursor];
    pool.cursor = (pool.cursor + 1) % pool.slots.length;
    slot.active = true;
    return slot;
  }

  private initClouds(): void {
    const geoA = buildCloudClusterGeometry(2.6);
    const geoB = buildCloudClusterGeometry(3.4);
    const specsA: Omit<DriftingCloud, 'inst' | 'instanceIdx'>[] = [];
    const specsB: Omit<DriftingCloud, 'inst' | 'instanceIdx'>[] = [];

    for (let i = 0; i < 16; i++) {
      const target = i % 2 === 0 ? specsA : specsB;
      target.push({
        orbitRadius: 95 + (i % 4) * 32,
        orbitAngle: (i / 16) * Math.PI * 2 + (i % 3) * 0.16,
        angularSpeed: 0.0052 + (i % 3) * 0.0014,
        baseY: 46 + (i % 5) * 6.5,
        phase: i * 0.9,
      });
    }

    const addBucket = (geo: THREE.BufferGeometry, specs: typeof specsA) => {
      const inst = new THREE.InstancedMesh(geo, this.cloudMat, specs.length);
      inst.frustumCulled = false;
      this.group.add(inst);
      this.cloudMeshes.push(inst);
      specs.forEach((sp, idx) => {
        this.clouds.push({ inst, instanceIdx: idx, ...sp });
      });
    };
    addBucket(geoA, specsA);
    addBucket(geoB, specsB);
  }

  public spawnWingTrailSegment(from: THREE.Vector3, to: THREE.Vector3): void {
    _trailDir.subVectors(to, from);
    const len = _trailDir.length();
    if (len < 0.04 || len > 3.2) return;
    _trailDir.divideScalar(len);

    const slot = this.wingTrailSlots[this.wingTrailCursor];
    this.wingTrailCursor = (this.wingTrailCursor + 1) % this.wingTrailSlots.length;
    slot.pos.addVectors(from, to).multiplyScalar(0.5);
    _trailQuat.setFromUnitVectors(_trailUp, _trailDir);
    slot.quat.copy(_trailQuat);
    slot.age = 0;
    slot.active = true;

    _dummy.position.copy(slot.pos);
    _dummy.quaternion.copy(slot.quat);
    _dummy.scale.set(1, len, 1);
    _dummy.updateMatrix();
    this.wingTrailInst.setMatrixAt((this.wingTrailCursor - 1 + this.wingTrailSlots.length) % this.wingTrailSlots.length, _dummy.matrix);
    this.wingTrailInst.instanceMatrix.needsUpdate = true;
  }

  public spawnChirpRing(pos: THREE.Vector3, hex = SPARROW_PALETTE.goldGlow): void {
    const slot = this.rings[this.ringCursor];
    this.ringCursor = (this.ringCursor + 1) % this.rings.length;
    slot.mesh.position.set(pos.x, pos.y + 0.14, pos.z);
    slot.mesh.scale.setScalar(0.32);
    slot.mat.color.setHex(hex);
    slot.mat.opacity = 0.85;
    slot.age = 0;
    slot.maxAge = 0.72;
    slot.startScale = 0.32;
    slot.endScale = 3.8;
    slot.baseOpacity = 0.85;
    slot.active = true;
    slot.mesh.visible = true;
  }

  public spawnWaterSplash(pos: THREE.Vector3, scale = 0.8): void {
    const ring = this.rings[this.ringCursor];
    this.ringCursor = (this.ringCursor + 1) % this.rings.length;
    ring.mesh.position.set(pos.x, pos.y + 0.05, pos.z);
    ring.mesh.scale.setScalar(0.28);
    ring.mat.color.setHex(SPARROW_PALETTE.waterFoam);
    ring.mat.opacity = 0.82;
    ring.age = 0;
    ring.maxAge = 0.65;
    ring.startScale = 0.28;
    ring.endScale = 3.1 * scale;
    ring.baseOpacity = 0.82;
    ring.active = true;
    ring.mesh.visible = true;

    const count = 8;
    for (let i = 0; i < count; i++) {
      const slot = this.acquireSlot(this.waterDropPool);
      const ang = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      slot.pos.set(pos.x + Math.cos(ang) * 0.15, pos.y + 0.08, pos.z + Math.sin(ang) * 0.15);
      slot.rot.set(0, 0, 0);
      slot.vel.set(Math.cos(ang) * (1.4 + Math.random() * 1.4), 3.4 + Math.random() * 2.2, Math.sin(ang) * (1.4 + Math.random() * 1.4));
      slot.baseScale = 0.6 + Math.random() * 0.4;
      slot.age = 0;
      slot.maxAge = 0.48;
      slot.gravity = 18.0;
      slot.spin = 0;
    }
  }

  public spawnBurst(origin: THREE.Vector3, count = 6, speed = 2.8): void {
    for (let i = 0; i < count; i++) {
      const slot = this.acquireSlot(this.dustPool);
      slot.pos.copy(origin);
      slot.rot.set(0, 0, 0);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const horiz = (0.4 + Math.random() * 0.6) * speed;
      slot.vel.set(Math.cos(angle) * horiz, (0.4 + Math.random() * 0.6) * speed, Math.sin(angle) * horiz);
      slot.baseScale = 0.55 + Math.random() * 0.35;
      slot.age = 0;
      slot.maxAge = 0.42;
      slot.gravity = 9.0;
      slot.spin = 0;
    }
  }

  public spawnFeatherBurst(origin: THREE.Vector3, count = 5, speed = 2.6): void {
    for (let i = 0; i < count; i++) {
      const slot = this.acquireSlot(this.featherPool);
      slot.pos.set(origin.x, origin.y + 0.1, origin.z);
      slot.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      slot.vel.set(Math.cos(a) * speed * 0.65, 1.3 + Math.random() * speed * 0.5, Math.sin(a) * speed * 0.65);
      slot.age = 0;
      slot.maxAge = 0.95;
      slot.baseScale = 1.05;
      slot.gravity = 3.2;
      slot.spin = 5.8;
    }
  }

  public spawnCrumbs(origin: THREE.Vector3, count = 8): void {
    for (let i = 0; i < count; i++) {
      const slot = this.acquireSlot(this.crumbPool);
      slot.pos.set(origin.x, origin.y + 0.1, origin.z);
      slot.rot.set(Math.random() * 3, Math.random() * 3, 0);
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.45;
      slot.vel.set(Math.cos(a) * (0.9 + Math.random() * 1.4), 1.6 + Math.random() * 1.8, Math.sin(a) * (0.9 + Math.random() * 1.4));
      slot.age = 0;
      slot.maxAge = 0.5;
      slot.baseScale = 0.6 + Math.random() * 0.35;
      slot.gravity = 13.5;
      slot.spin = 8.0;
    }
  }

  public update(
    dt: number,
    elapsed: number,
    goldenWarmth: number,
    nightMix: number,
    stormMix: number
  ): void {
    const updatePool = (pool: { inst: THREE.InstancedMesh; slots: ParticleSlot[] }) => {
      let dirty = false;
      for (let i = 0; i < pool.slots.length; i++) {
        const s = pool.slots[i];
        if (!s.active) continue;
        dirty = true;
        s.age += dt;
        if (s.age >= s.maxAge) {
          s.active = false;
          pool.inst.setMatrixAt(i, _zeroMat4);
          continue;
        }
        s.vel.y -= s.gravity * dt;
        s.pos.addScaledVector(s.vel, dt);
        if (s.spin > 0) {
          s.rot.x += s.spin * dt;
          s.rot.y += s.spin * 0.7 * dt;
        }
        const u = s.age / s.maxAge;
        const sc = s.baseScale * Math.max(0.01, 1.0 - u * u);
        _dummy.position.copy(s.pos);
        _dummy.rotation.copy(s.rot);
        _dummy.scale.setScalar(sc);
        _dummy.updateMatrix();
        pool.inst.setMatrixAt(i, _dummy.matrix);
      }
      if (dirty) pool.inst.instanceMatrix.needsUpdate = true;
    };

    updatePool(this.dustPool);
    updatePool(this.featherPool);
    updatePool(this.waterDropPool);
    updatePool(this.crumbPool);

    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      if (!r.active) continue;
      r.age += dt;
      if (r.age >= r.maxAge) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }
      const u = r.age / r.maxAge;
      const eased = 1 - Math.pow(1 - u, 2.2);
      const scale = r.startScale + (r.endScale - r.startScale) * eased;
      r.mesh.scale.setScalar(scale);
      r.mat.opacity = r.baseOpacity * (1 - u);
    }

    let trailDirty = false;
    for (let i = 0; i < this.wingTrailSlots.length; i++) {
      const slot = this.wingTrailSlots[i];
      if (!slot.active) continue;
      trailDirty = true;
      slot.age += dt;
      if (slot.age >= 0.34) {
        slot.active = false;
        this.wingTrailInst.setMatrixAt(i, _zeroMat4);
        continue;
      }
      const w = 1 - slot.age / 0.34;
      _dummy.position.copy(slot.pos);
      _dummy.quaternion.copy(slot.quat);
      _dummy.scale.set(w, 0.35, w);
      _dummy.updateMatrix();
      this.wingTrailInst.setMatrixAt(i, _dummy.matrix);
    }
    if (trailDirty) this.wingTrailInst.instanceMatrix.needsUpdate = true;

    // Drifting clouds tinted cleanly by golden hour, night, and storm weather
    _cloudTarget
      .copy(_cloudWarm)
      .lerp(_cloudGolden, goldenWarmth * 0.65)
      .lerp(_cloudNight, nightMix * 0.72)
      .lerp(_cloudStorm, stormMix * 0.68);
    this.cloudMat.color.lerp(_cloudTarget, Math.min(1, dt * 2.0));

    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.orbitAngle += c.angularSpeed * dt;
      const x = Math.cos(c.orbitAngle) * c.orbitRadius;
      const z = Math.sin(c.orbitAngle) * c.orbitRadius - 12;
      const y = c.baseY + Math.sin(elapsed * 0.32 + c.phase) * 1.1;
      _dummy.position.set(x, y, z);
      _dummy.rotation.set(0, -c.orbitAngle + Math.PI * 0.5, 0);
      _dummy.scale.set(1.2, 1.0, 1.2);
      _dummy.updateMatrix();
      c.inst.setMatrixAt(c.instanceIdx, _dummy.matrix);
    }
    this.cloudMeshes.forEach((cm) => {
      cm.instanceMatrix.needsUpdate = true;
    });

    // Floating sesame & fig crumb pickups
    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i];
      if (pk.collected) {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) {
          pk.collected = false;
          pk.mesh.visible = true;
        }
        continue;
      }
      pk.mesh.rotation.y = elapsed * 2.1 + pk.phase;
      pk.mesh.position.y = pk.baseY + Math.sin(elapsed * 3.0 + pk.phase) * 0.11;
    }
  }

  public dispose(): void {
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.featherGeo.dispose();
    this.featherMat.dispose();
    this.waterDropMat.dispose();
    this.crumbGeo.dispose();
    this.crumbMat.dispose();
    this.wingTrailGeo.dispose();
    this.wingTrailMat.dispose();
    this.ringGeo.dispose();
    this.rings.forEach((r) => r.mat.dispose());
    this.cloudMeshes.forEach((m) => m.geometry.dispose());
    this.cloudMat.dispose();
    this.pickupGeo.dispose();
    this.pickupMat.dispose();
  }
}
