import * as THREE from 'three';
import { sampleNearestRoad, TABAKHANE_BRIDGE_ZS } from '../../data/aydinRoads';
import { DISTRICT_ZONES } from '../../data/efelerData';
import { getTabakhaneCenterX } from '../../game/terrain';
import { ColliderBox } from '../../types/game';

export function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export function resolveLocationLabels(x: number, z: number): { district: string; street: string } {
  let district = 'Efeler Merkez';
  for (const dz of DISTRICT_ZONES) {
    if (x >= dz.minX && x <= dz.maxX && z >= dz.minZ && z <= dz.maxZ) {
      district = dz.name;
      break;
    }
  }

  let bestStreet = 'Efeler Sokakları';
  const roadSample = sampleNearestRoad(x, z, 9.5);
  if (roadSample.road) {
    bestStreet = roadSample.road.name;
  }

  if (Math.hypot(x, z - 10) < 17) {
    bestStreet = 'Atatürk Kent Meydanı (Güzelhisar)';
  } else if (Math.hypot(x + 39.5, z - 11.5) < 16) {
    bestStreet = 'Sevgi Yolu (Güzelhisar)';
  } else if (Math.hypot(x + 76, z + 47) < 15) {
    bestStreet = 'Yağcılar İçi Tarihi Çarşısı';
  } else if (Math.hypot(x + 58, z + 108) < 15) {
    bestStreet = 'Tralleis Antik Kenti · Kalfaköy';
  } else if (Math.hypot(x - 92, z + 104) < 18) {
    bestStreet = 'ADÜ Aytepe Kampüsü';
  } else if (Math.hypot(x + 188, z + 12) < 15) {
    bestStreet = 'Magnesia Artemis Tapınağı';
  } else if (Math.hypot(x + 127, z - 14) < 16) {
    bestStreet = 'Nevzat Biçer Parkı (Cumhuriyet)';
  } else if (Math.hypot(x + 80, z - 52) < 14) {
    bestStreet = 'Aydın Kipa AVM · Kıbrıs / İstasyon';
  } else if (Math.hypot(x - 93, z - 34) < 16) {
    bestStreet = 'Tekstil Park (Sümerbank)';
  } else if (Math.hypot(x - 142, z - 10) < 16) {
    bestStreet = 'Forum Aydın · Doğu Blv.';
  }

  return { district, street: bestStreet };
}

export function resolveCollision(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[]
): [number, number] {
  let nx = THREE.MathUtils.clamp(x, -224, 198);
  let nz = THREE.MathUtils.clamp(z, -142, 114);

  // Keep player on riverbanks / stone bridges instead of stepping into Tabakhane Deresi water
  const onBridge = TABAKHANE_BRIDGE_ZS.some((bz) => Math.abs(nz - bz) < 4.5);
  if (!onBridge) {
    const streamX = getTabakhaneCenterX(nz);
    const bankMinDist = 3.1 + radius;
    const dxStream = nx - streamX;
    if (Math.abs(dxStream) < bankMinDist) {
      nx = streamX + (dxStream >= 0 ? bankMinDist : -bankMinDist);
    }
  }

  for (const b of colliders) {
    const closestX = Math.max(b.minX, Math.min(nx, b.maxX));
    const closestZ = Math.max(b.minZ, Math.min(nz, b.maxZ));
    const dx = nx - closestX;
    const dz = nz - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      if (distSq > 0.0001) {
        nx += (dx / dist) * overlap;
        nz += (dz / dist) * overlap;
      } else {
        nx += overlap;
      }
    }
  }
  return [nx, nz];
}

export interface DustParticleSystem {
  update: (
    dt: number,
    shouldSpawn: boolean,
    spawnX: number,
    spawnY: number,
    spawnZ: number,
    heading: number
  ) => void;
  dispose: () => void;
}

export function createDustParticleSystem(scene: THREE.Scene): DustParticleSystem {
  const particleCount = 24;
  const particleGeo = new THREE.SphereGeometry(0.22, 6, 6);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xe6dac5,
    transparent: true,
    opacity: 0.45,
  });
  const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
  particleMesh.frustumCulled = false;
  scene.add(particleMesh);

  const particles = Array.from({ length: particleCount }, () => ({
    active: false,
    x: 0,
    y: -5,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.55,
  }));
  let nextParticle = 0;
  let particleSpawnAccum = 0;
  const pDummy = new THREE.Object3D();

  return {
    update(dt, shouldSpawn, spawnX, spawnY, spawnZ, heading) {
      if (shouldSpawn) {
        particleSpawnAccum += dt;
        if (particleSpawnAccum > 0.09) {
          particleSpawnAccum = 0;
          const p = particles[nextParticle];
          nextParticle = (nextParticle + 1) % particleCount;
          p.active = true;
          p.life = 0;
          p.x = spawnX + Math.sin(heading) * 1.1 + (Math.random() - 0.5) * 0.5;
          p.y = spawnY + 0.18;
          p.z = spawnZ + Math.cos(heading) * 1.1 + (Math.random() - 0.5) * 0.5;
          p.vx = (Math.random() - 0.5) * 0.6;
          p.vy = 0.65 + Math.random() * 0.4;
          p.vz = (Math.random() - 0.5) * 0.6;
        }
      }

      let anyParticleActive = false;
      for (let i = 0; i < particleCount; i++) {
        if (particles[i].active) {
          anyParticleActive = true;
          break;
        }
      }

      if (!anyParticleActive) {
        if (particleMesh.visible) {
          particleMesh.visible = false;
        }
        return;
      }

      if (!particleMesh.visible) {
        particleMesh.visible = true;
      }
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        if (!p.active) {
          pDummy.position.set(0, -10, 0);
          pDummy.scale.setScalar(0.01);
        } else {
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            pDummy.position.set(0, -10, 0);
            pDummy.scale.setScalar(0.01);
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            const t = p.life / p.maxLife;
            const s = (1 - t) * 0.85;
            pDummy.position.set(p.x, p.y, p.z);
            pDummy.scale.setScalar(Math.max(0.01, s));
          }
        }
        pDummy.updateMatrix();
        particleMesh.setMatrixAt(i, pDummy.matrix);
      }
      particleMesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      particleGeo.dispose();
      particleMat.dispose();
    },
  };
}

export interface WeatherParticleSystem {
  update: (
    dt: number,
    elapsed: number,
    weights: { rain: number; snow: number; storm: number },
    lookCurrent: THREE.Vector3
  ) => void;
  dispose: () => void;
}

export function createWeatherParticleSystem(
  scene: THREE.Scene,
  isTouchDevice: boolean
): WeatherParticleSystem {
  const weatherCount = isTouchDevice ? 120 : 220;
  const weatherGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
  const weatherMat = new THREE.MeshBasicMaterial({
    color: 0xd6e6f5,
    transparent: true,
    opacity: 0.58,
  });
  const weatherMesh = new THREE.InstancedMesh(weatherGeo, weatherMat, weatherCount);
  weatherMesh.frustumCulled = false;
  scene.add(weatherMesh);

  const weatherDrops = Array.from({ length: weatherCount }, () => ({
    ox: (Math.random() - 0.5) * 68,
    y: Math.random() * 26,
    oz: (Math.random() - 0.5) * 68,
    speed: 0.75 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
  }));
  const wDummy = new THREE.Object3D();

  return {
    update(dt, elapsed, weatherWeights, lookCurrent) {
      const precipStrength = Math.max(
        weatherWeights.rain,
        weatherWeights.snow,
        weatherWeights.storm
      );
      const snowDom = weatherWeights.snow > Math.max(weatherWeights.rain, weatherWeights.storm);
      const stormDom = weatherWeights.storm > Math.max(weatherWeights.rain, weatherWeights.snow);

      if (precipStrength < 0.03) {
        if (weatherMesh.visible) weatherMesh.visible = false;
        return;
      }

      if (!weatherMesh.visible) weatherMesh.visible = true;
      if (snowDom) {
        weatherMat.color.setHex(0xffffff);
        weatherMat.opacity = 0.85 * precipStrength;
      } else if (stormDom) {
        weatherMat.color.setHex(0xb8cde4);
        weatherMat.opacity = 0.68 * precipStrength;
      } else {
        weatherMat.color.setHex(0xd0e2f2);
        weatherMat.opacity = 0.52 * precipStrength;
      }

      const activeDrops = Math.floor(weatherCount * precipStrength);
      for (let i = 0; i < weatherCount; i++) {
        if (i >= activeDrops) {
          wDummy.position.set(0, -30, 0);
          wDummy.scale.setScalar(0.01);
          wDummy.updateMatrix();
          weatherMesh.setMatrixAt(i, wDummy.matrix);
          continue;
        }
        const drop = weatherDrops[i];
        if (snowDom) {
          drop.y -= 3.2 * drop.speed * dt;
          drop.ox += Math.sin(elapsed * 1.4 + drop.phase) * 1.4 * dt;
        } else if (stormDom) {
          drop.y -= 28 * drop.speed * dt;
          drop.ox -= 7.5 * dt;
        } else {
          drop.y -= 20 * drop.speed * dt;
          drop.ox -= 2.0 * dt;
        }

        if (drop.y < 0.1) {
          drop.y = 24 + Math.random() * 4;
          drop.ox = (Math.random() - 0.5) * 68;
          drop.oz = (Math.random() - 0.5) * 68;
        }

        wDummy.position.set(
          lookCurrent.x + drop.ox,
          Math.max(0, lookCurrent.y - 1.0) + drop.y,
          lookCurrent.z + drop.oz
        );
        if (snowDom) {
          wDummy.rotation.set(elapsed + drop.phase, elapsed * 0.6, 0);
          wDummy.scale.set(2.2, 0.22, 2.2);
        } else if (stormDom) {
          wDummy.rotation.set(0, 0, 0.28);
          wDummy.scale.set(1.0, 1.35, 1.0);
        } else {
          wDummy.rotation.set(0, 0, 0.09);
          wDummy.scale.set(0.85, 1.0, 0.85);
        }
        wDummy.updateMatrix();
        weatherMesh.setMatrixAt(i, wDummy.matrix);
      }
      weatherMesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      weatherGeo.dispose();
      weatherMat.dispose();
    },
  };
}
