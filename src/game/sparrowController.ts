import * as THREE from 'three';
import { ColliderBox, RoofColliderMeta } from '../types/game';
import { audioEngine } from './audioEngine';
import { createPerchQueryResult, PerchSegment, PerchSystem } from './perchSystem';
import { SparrowFX } from './sparrowFx';
import { BirdMode, SparrowMesh } from './sparrowMesh';
import {
  getTabakhaneCenterX,
  getTabakhaneWaterY,
  getWalkableSurfaceHeightAt,
} from './terrain';

export interface SparrowInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  flapHeld: boolean;
  flapPressed: boolean;
  diveHeld: boolean;
  chirpPressed: boolean;
  peckPressed: boolean;
}

const STREAM_BRIDGE_ZS = [-96, -58, -22, 12, 48];

const _perchA = new THREE.Vector3();
const _perchB = new THREE.Vector3();
const _perchAB = new THREE.Vector3();
const _perchTan = new THREE.Vector3();
const _perchTarget = new THREE.Vector3();
const _perchQuery = createPerchQueryResult();
const _tipL = new THREE.Vector3();
const _tipR = new THREE.Vector3();
const _headLook = new THREE.Vector2();
const _emitPos = new THREE.Vector3();

/**
 * Efeler-native articulated Sparrow Controller:
 * - Two-footed hopping along sidewalks, cobblestones, bridges, and diorama rooftops
 * - Coyote time + flap input buffer + intermittent flap-bounding & dive swooping
 * - Automatic landing & shuffling along PerchSystem segments (roof ridges, eaves, lamps, pergolas, trees)
 * - Buoyant Tabakhane Deresi water splash bounce
 */
export class SparrowController {
  public readonly position = new THREE.Vector3();
  public readonly velocity = new THREE.Vector3();
  public yaw = 0;
  public mode: BirdMode = 'grounded';
  public flightStamina = 1.0;

  private activePerch: PerchSegment | null = null;
  private perchT = 0.5;
  private lastPerchId = '';
  private perchIgnoreTimer = 0;
  private perchTransActive = false;
  private perchTransElapsed = 0;
  private perchTransDuration = 0.22;
  private readonly perchTransStartOffset = new THREE.Vector3();
  private perchTransStartYaw = 0;
  private perchTransYawDelta = 0;
  private perchTransStartBank = 0;
  private perchTransStartPitch = 0;
  private perchSettleTimer = 0;
  private perchSettleAmp = 0;

  private isHopAirborne = false;
  private hopPhase = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private multiSpaceWindow = 0;
  private flapAnimTimer = 0;
  private flapCooldown = 0;
  private boundCycleTimer = 0;
  private wingTuckAmount = 0;
  private flightWingbeatTimer = 0;
  private bankAngle = 0;
  private pitchAngle = 0;
  private chirpOpen = 0;
  private peckTimer = 0;
  private eatTimer = 0;
  private wingTrailTimer = 0;
  private idleChirpTimer = 7.2;
  private waterBounceCooldown = 0;

  public constructor(
    public readonly sparrowMesh: SparrowMesh,
    private readonly perches: PerchSystem,
    private readonly colliders: ColliderBox[],
    private readonly fx: SparrowFX
  ) {}

  private getStandOffset(): number {
    return 0.36 * Math.max(0.5, this.sparrowMesh.root.scale.y || 1);
  }

  private getPerchOffset(seg?: PerchSegment | null): number {
    const scale = Math.max(0.5, this.sparrowMesh.root.scale.y || 1);
    const radiusLift = seg ? Math.min(0.06, seg.radius * 0.25) : 0;
    return 0.345 * scale + radiusLift;
  }

  private getRoofSurfaceY(roof: RoofColliderMeta, x: number, z: number): number | null {
    const dx = x - roof.cx;
    const dz = z - roof.cz;
    const rot = -(roof.rotY ?? 0);
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const lx = dx * cosR - dz * sinR;
    const lz = dx * sinR + dz * cosR;
    if (Math.abs(lx) > roof.halfW + 0.14 || Math.abs(lz) > roof.halfD + 0.14) {
      return null;
    }
    const frac = roof.ridgeAlongZ
      ? Math.min(1, Math.abs(lx) / Math.max(0.1, roof.halfW))
      : Math.min(1, Math.abs(lz) / Math.max(0.1, roof.halfD));
    return roof.wallTopY + roof.peakH * (1 - frac);
  }

  public resetAt(x: number, z: number, yaw = 0): void {
    const floor = this.getStandableFloorY(x, z, getWalkableSurfaceHeightAt(x, z) + 0.5);
    this.position.set(x, floor + this.getStandOffset(), z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.mode = 'grounded';
    this.activePerch = null;
    this.perchTransActive = false;
    this.isHopAirborne = false;
    this.hopPhase = 0;
    this.flightStamina = 1.0;
    this.bankAngle = 0;
    this.pitchAngle = 0;
    this.sparrowMesh.root.position.copy(this.position);
    this.sparrowMesh.root.rotation.y = this.yaw;
  }

  public triggerChirp(): void {
    this.chirpOpen = 1.0;
    audioEngine.playSparrowChirp(Math.random() < 0.45);
    _emitPos.copy(this.position);
    this.fx.spawnChirpRing(_emitPos);
  }

  public triggerPeck(): void {
    if (this.peckTimer > 0.05) return;
    this.peckTimer = 0.24;
    _emitPos.set(
      this.position.x + Math.sin(this.yaw) * 0.35,
      this.position.y - 0.1,
      this.position.z + Math.cos(this.yaw) * 0.35
    );
    this.fx.spawnBurst(_emitPos, 5, 2.2);
    audioEngine.playSparrowHop(this.activePerch?.surface ?? 'stone');
  }

  public triggerEat(): void {
    this.eatTimer = 0.42;
  }

  private getStandableFloorY(x: number, z: number, currentY: number): number {
    let floorY = getWalkableSurfaceHeightAt(x, z);
    const birdFeetY = currentY - this.getStandOffset();
    for (let i = 0; i < this.colliders.length; i++) {
      const b = this.colliders[i];
      if (b.roof) {
        const roofY = this.getRoofSurfaceY(b.roof, x, z);
        if (roofY !== null && birdFeetY >= roofY - 0.55 && roofY > floorY) {
          floorY = roofY;
          continue;
        }
      }
      if (b.maxY === undefined) continue;
      if (x >= b.minX - 0.12 && x <= b.maxX + 0.12 && z >= b.minZ - 0.12 && z <= b.maxZ + 0.12) {
        if (!b.roof && birdFeetY >= b.maxY - 0.45 && b.maxY > floorY) {
          floorY = b.maxY;
        }
      }
    }
    return floorY;
  }

  private resolveHorizontalWalls(x: number, y: number, z: number): [number, number] {
    let nx = THREE.MathUtils.clamp(x, -99, 105);
    let nz = THREE.MathUtils.clamp(z, -108, 74);
    const radius = 0.36;
    const birdFeetY = y - this.getStandOffset() * 0.65;

    for (let i = 0; i < this.colliders.length; i++) {
      const b = this.colliders[i];
      if (b.roof) {
        const localRoofY = this.getRoofSurfaceY(b.roof, nx, nz);
        const topCutoff = localRoofY !== null ? localRoofY : b.roof.wallTopY;
        if (birdFeetY >= topCutoff - 0.14) continue;
      } else if (b.maxY !== undefined && birdFeetY >= b.maxY - 0.18) {
        continue;
      }
      if (b.maxY === undefined && !b.roof) {
        const approxBase = getWalkableSurfaceHeightAt(
          (b.minX + b.maxX) * 0.5,
          (b.minZ + b.maxZ) * 0.5
        );
        if (birdFeetY >= approxBase + 9.2) continue;
      }
      const cx = Math.max(b.minX, Math.min(nx, b.maxX));
      const cz = Math.max(b.minZ, Math.min(nz, b.maxZ));
      const dx = nx - cx;
      const dz = nz - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < radius * radius) {
        const dist = Math.sqrt(dSq) || 0.001;
        const overlap = radius - dist;
        if (dSq > 1e-4) {
          nx += (dx / dist) * overlap;
          nz += (dz / dist) * overlap;
        } else {
          nx += overlap;
        }
      }
    }
    return [nx, nz];
  }

  private enterFlight(impulseY: number, forwardBoost: number): void {
    if (this.activePerch) {
      this.lastPerchId = this.activePerch.id;
      this.perchIgnoreTimer = 0.55;
      this.activePerch = null;
    }
    this.perchTransActive = false;
    this.mode = 'flying';
    this.isHopAirborne = false;
    this.hopPhase = 0;
    this.velocity.y = Math.max(this.velocity.y, impulseY);
    this.velocity.x += Math.sin(this.yaw) * forwardBoost;
    this.velocity.z += Math.cos(this.yaw) * forwardBoost;
    this.flapAnimTimer = 0.42;
    this.flightWingbeatTimer = 0.09;
    audioEngine.playWingFlap(1.0);
    audioEngine.playSparrowMicroChirp('takeoff');
    this.fx.spawnFeatherBurst(this.position, 4, 2.2);
  }

  private snapToPerch(seg: PerchSegment, t: number): void {
    this.activePerch = seg;
    this.perchT = t;
    this.mode = 'perched';
    this.isHopAirborne = false;
    this.hopPhase = 0;
    this.perchSettleTimer = 0.22;
    this.perchSettleAmp = 0.045;

    seg.getEndpoints(_perchA, _perchB);
    _perchTarget.copy(_perchA).lerp(_perchB, t);
    _perchTarget.y += this.getPerchOffset(seg);

    this.perchTransActive = true;
    this.perchTransElapsed = 0;
    this.perchTransDuration = 0.2;
    this.perchTransStartOffset.subVectors(this.position, _perchTarget);
    this.perchTransStartYaw = this.yaw;

    _perchAB.subVectors(_perchB, _perchA);
    const tangentYaw = Math.atan2(_perchAB.x, _perchAB.z);
    let d1 = tangentYaw - this.yaw;
    while (d1 > Math.PI) d1 -= Math.PI * 2;
    while (d1 < -Math.PI) d1 += Math.PI * 2;
    const altYaw = tangentYaw + Math.PI;
    let d2 = altYaw - this.yaw;
    while (d2 > Math.PI) d2 -= Math.PI * 2;
    while (d2 < -Math.PI) d2 += Math.PI * 2;
    const chosenDelta = Math.abs(d1) <= Math.abs(d2) ? d1 : d2;
    this.perchTransYawDelta = chosenDelta;
    this.perchTransStartBank = this.bankAngle;
    this.perchTransStartPitch = this.pitchAngle;

    this.velocity.set(0, 0, 0);
    audioEngine.playSparrowHop(seg.surface);
    audioEngine.playSparrowMicroChirp('perch');
  }

  public update(
    dt: number,
    elapsed: number,
    camYaw: number,
    input: SparrowInputState,
    isPlaying: boolean
  ): void {
    const safeDt = Math.min(0.05, dt);

    if (this.perchIgnoreTimer > 0) this.perchIgnoreTimer = Math.max(0, this.perchIgnoreTimer - safeDt);
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - safeDt);
    if (this.coyoteTimer > 0) this.coyoteTimer = Math.max(0, this.coyoteTimer - safeDt);
    if (this.multiSpaceWindow > 0) this.multiSpaceWindow = Math.max(0, this.multiSpaceWindow - safeDt);
    if (this.flapAnimTimer > 0) this.flapAnimTimer = Math.max(0, this.flapAnimTimer - safeDt);
    if (this.flapCooldown > 0) this.flapCooldown = Math.max(0, this.flapCooldown - safeDt);
    if (this.chirpOpen > 0) this.chirpOpen = Math.max(0, this.chirpOpen - safeDt * 4.4);
    if (this.peckTimer > 0) this.peckTimer = Math.max(0, this.peckTimer - safeDt);
    if (this.eatTimer > 0) this.eatTimer = Math.max(0, this.eatTimer - safeDt);
    if (this.perchSettleTimer > 0) this.perchSettleTimer = Math.max(0, this.perchSettleTimer - safeDt);
    if (this.waterBounceCooldown > 0) this.waterBounceCooldown = Math.max(0, this.waterBounceCooldown - safeDt);

    if (isPlaying) {
      if (input.chirpPressed) this.triggerChirp();
      if (input.peckPressed) this.triggerPeck();
      if (input.flapPressed) {
        this.jumpBufferTimer = 0.16;
      }
    }

    // Subtle ambient idle chirps
    if (isPlaying && this.mode !== 'flying') {
      this.idleChirpTimer -= safeDt;
      if (this.idleChirpTimer <= 0) {
        this.idleChirpTimer = 9 + Math.random() * 8;
        this.chirpOpen = 0.65;
        audioEngine.playSparrowMicroChirp('idle');
      }
    }

    const fwdX = Math.sin(camYaw);
    const fwdZ = Math.cos(camYaw);
    const rightX = -fwdZ;
    const rightZ = fwdX;

    let moveInX = 0;
    let moveInZ = 0;
    if (isPlaying) {
      if (input.forward) {
        moveInX += fwdX;
        moveInZ += fwdZ;
      }
      if (input.backward) {
        moveInX -= fwdX;
        moveInZ -= fwdZ;
      }
      if (input.right) {
        moveInX += rightX;
        moveInZ += rightZ;
      }
      if (input.left) {
        moveInX -= rightX;
        moveInZ -= rightZ;
      }
    }
    const moveLen = Math.hypot(moveInX, moveInZ);
    const hasMove = moveLen > 0.05;
    if (hasMove) {
      moveInX /= moveLen;
      moveInZ /= moveLen;
    }

    // Check Tabakhane Deresi water contact (buoyant playful splash)
    const onBridge = STREAM_BRIDGE_ZS.some((bz) => Math.abs(this.position.z - bz) < 4.4);
    if (!onBridge) {
      const sx = getTabakhaneCenterX(this.position.z);
      if (Math.abs(this.position.x - sx) < 2.8) {
        const wy = getTabakhaneWaterY(this.position.z);
        if (this.position.y <= wy + this.getStandOffset() * 0.9 && this.waterBounceCooldown <= 0) {
          this.waterBounceCooldown = 0.45;
          _emitPos.set(this.position.x, wy + 0.05, this.position.z);
          this.fx.spawnWaterSplash(_emitPos, 0.85);
          audioEngine.playWaterPlop();
          this.enterFlight(6.4, 2.8);
        }
      }
    }

    if (this.mode === 'perched' && this.activePerch) {
      this.flightStamina = Math.min(1.0, this.flightStamina + safeDt * 0.55);
      this.activePerch.getEndpoints(_perchA, _perchB);
      _perchAB.subVectors(_perchB, _perchA);
      const segLen = Math.max(0.2, _perchAB.length());
      _perchTan.copy(_perchAB).divideScalar(segLen);

      const perchOffset = this.getPerchOffset(this.activePerch);
      if (this.perchTransActive) {
        this.perchTransElapsed += safeDt;
        const u = Math.min(1, this.perchTransElapsed / this.perchTransDuration);
        const s = u * u * (3 - 2 * u);
        _perchTarget.copy(_perchA).lerp(_perchB, this.perchT);
        _perchTarget.y += perchOffset;
        this.position.copy(_perchTarget).addScaledVector(this.perchTransStartOffset, 1 - s);
        this.yaw = this.perchTransStartYaw + this.perchTransYawDelta * s;
        this.bankAngle = this.perchTransStartBank * (1 - s);
        this.pitchAngle = this.perchTransStartPitch * (1 - s);
        if (u >= 1) this.perchTransActive = false;
      } else {
        // Shuffle along perch if pressing directional keys
        if (hasMove) {
          const proj = moveInX * _perchTan.x + moveInZ * _perchTan.z;
          this.perchT = THREE.MathUtils.clamp(this.perchT + (proj * 2.1 * safeDt) / segLen, 0.08, 0.92);
          const targetYaw = Math.atan2(moveInX, moveInZ);
          let dy = targetYaw - this.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          this.yaw += dy * Math.min(1, safeDt * 12);
        }
        _perchTarget.copy(_perchA).lerp(_perchB, this.perchT);
        this.position.set(_perchTarget.x, _perchTarget.y + perchOffset, _perchTarget.z);
      }

      if (isPlaying && this.jumpBufferTimer > 0) {
        this.jumpBufferTimer = 0;
        this.enterFlight(6.2, hasMove ? 4.2 : 2.6);
      } else if (isPlaying && input.backward && !input.forward && this.perchIgnoreTimer <= 0) {
        this.lastPerchId = this.activePerch.id;
        this.perchIgnoreTimer = 0.55;
        this.activePerch = null;
        this.mode = 'grounded';
        this.isHopAirborne = true;
        this.velocity.set(Math.sin(this.yaw) * 2.0, 1.8, Math.cos(this.yaw) * 2.0);
      }
    } else if (this.mode === 'grounded') {
      this.flightStamina = Math.min(1.0, this.flightStamina + safeDt * 0.48);

      const floorY = this.getStandableFloorY(this.position.x, this.position.z, this.position.y);
      const standY = floorY + this.getStandOffset();
      const onFloor = this.position.y <= standY + 0.08 && this.velocity.y <= 0.35;

      if (onFloor) {
        this.coyoteTimer = 0.14;
        this.isHopAirborne = false;
        if (hasMove) {
          const targetYaw = Math.atan2(moveInX, moveInZ);
          let dy = targetYaw - this.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          this.yaw += dy * Math.min(1, safeDt * 14);

          if (this.hopPhase <= 0.01) {
            this.hopPhase = 0.02;
            const hopBoost = input.diveHeld ? 7.2 : 5.2;
            this.velocity.x = Math.sin(this.yaw) * hopBoost;
            this.velocity.z = Math.cos(this.yaw) * hopBoost;
            this.velocity.y = 1.9;
            audioEngine.playSparrowHop('stone');
          }
        } else {
          this.velocity.x *= Math.exp(-12 * safeDt);
          this.velocity.z *= Math.exp(-12 * safeDt);
        }
      } else {
        this.isHopAirborne = true;
        this.velocity.y -= 18.0 * safeDt;
      }

      if (this.hopPhase > 0.01) {
        this.hopPhase += safeDt * 3.4;
        if (this.hopPhase >= 1.0) this.hopPhase = 0;
      }

      if (isPlaying && this.jumpBufferTimer > 0) {
        this.jumpBufferTimer = 0;
        if (this.multiSpaceWindow > 0 || !onFloor) {
          this.multiSpaceWindow = 0;
          this.enterFlight(6.6, 4.6);
        } else {
          this.multiSpaceWindow = 0.42;
          this.velocity.y = 5.4;
          this.velocity.x += Math.sin(this.yaw) * 2.4;
          this.velocity.z += Math.cos(this.yaw) * 2.4;
          this.isHopAirborne = true;
          this.hopPhase = 0.35;
          audioEngine.playWingFlap(0.55);
        }
      }

      const [rx, rz] = this.resolveHorizontalWalls(
        this.position.x + this.velocity.x * safeDt,
        this.position.y,
        this.position.z + this.velocity.z * safeDt
      );
      this.position.x = rx;
      this.position.z = rz;
      this.position.y += this.velocity.y * safeDt;

      const nextStandY =
        this.getStandableFloorY(this.position.x, this.position.z, this.position.y) +
        this.getStandOffset();
      if (this.position.y <= nextStandY) {
        this.position.y = nextStandY;
        this.velocity.y = 0;
        this.isHopAirborne = false;
      }

      if (this.isHopAirborne && this.perchIgnoreTimer <= 0) {
        const hit = this.perches.findNearestPerch(
          this.position,
          0.95,
          this.lastPerchId,
          this.perchIgnoreTimer > 0,
          _perchQuery
        );
        if (hit) {
          this.snapToPerch(hit.segment, hit.t);
        }
      }
    } else {
      // Flying mode (intermittent flap-bounding + dive swoop + airbrake)
      const isDiving = isPlaying && input.diveHeld;
      const isBraking = isPlaying && input.backward && !input.forward;

      if (isPlaying) {
        const turnInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
        const turnSpeed = isBraking ? 2.8 : 2.3;
        this.yaw += turnInput * turnSpeed * safeDt;
        const targetBank = -turnInput * (isDiving ? 0.82 : 0.64);
        this.bankAngle = THREE.MathUtils.damp(this.bankAngle, targetBank, 9, safeDt);
      } else {
        this.bankAngle = THREE.MathUtils.damp(this.bankAngle, 0, 6, safeDt);
      }

      const dirX = Math.sin(this.yaw);
      const dirZ = Math.cos(this.yaw);
      const cruiseTarget = isDiving
        ? 22.0
        : isBraking
          ? 3.8
          : isPlaying && input.forward
            ? 14.8
            : 10.6;

      const curHoriz = Math.hypot(this.velocity.x, this.velocity.z);
      const nextHoriz = THREE.MathUtils.damp(curHoriz, cruiseTarget, isBraking ? 6.5 : 3.2, safeDt);
      this.velocity.x = dirX * nextHoriz;
      this.velocity.z = dirZ * nextHoriz;

      const wantClimb = isPlaying && (input.flapHeld || this.jumpBufferTimer > 0);
      if (wantClimb && this.flightStamina > 0.04) {
        this.jumpBufferTimer = 0;
        this.flightStamina = Math.max(0, this.flightStamina - safeDt * 0.22);
        this.velocity.y = THREE.MathUtils.damp(this.velocity.y, 7.2, 7.5, safeDt);
        this.flapAnimTimer = 0.28;
        this.wingTuckAmount = THREE.MathUtils.damp(this.wingTuckAmount, 0, 14, safeDt);
        this.flightWingbeatTimer -= safeDt;
        if (this.flightWingbeatTimer <= 0) {
          this.flightWingbeatTimer = 0.14;
          audioEngine.playFlightWingbeat(0.72);
        }
      } else if (isDiving) {
        this.velocity.y = THREE.MathUtils.damp(this.velocity.y, -11.5, 4.5, safeDt);
        this.wingTuckAmount = THREE.MathUtils.damp(this.wingTuckAmount, 0, 10, safeDt);
      } else {
        // Passerine flap-bounding cadence (short bursts of wingbeats interspersed with tucked glide)
        this.flightStamina = Math.min(1.0, this.flightStamina + safeDt * 0.08);
        this.boundCycleTimer = (this.boundCycleTimer + safeDt) % 0.92;
        const inFlapBurst = this.boundCycleTimer < 0.34;
        if (inFlapBurst && input.forward) {
          this.flapAnimTimer = Math.max(this.flapAnimTimer, 0.12);
          this.wingTuckAmount = THREE.MathUtils.damp(this.wingTuckAmount, 0, 14, safeDt);
          this.flightWingbeatTimer -= safeDt;
          if (this.flightWingbeatTimer <= 0) {
            this.flightWingbeatTimer = 0.17;
            audioEngine.playFlightWingbeat(0.42);
          }
          this.velocity.y = THREE.MathUtils.damp(this.velocity.y, 0.45, 4.2, safeDt);
        } else {
          this.wingTuckAmount = THREE.MathUtils.damp(this.wingTuckAmount, isBraking ? 0 : 0.85, 9, safeDt);
          const glideSink = isBraking ? -2.8 : -1.55;
          this.velocity.y = THREE.MathUtils.damp(this.velocity.y, glideSink, 3.2, safeDt);
        }
      }

      // Soft flight ceiling over Efeler sky
      if (this.position.y > 46 && this.velocity.y > 0) {
        this.velocity.y *= Math.exp(-4 * safeDt);
      }

      this.pitchAngle = THREE.MathUtils.damp(
        this.pitchAngle,
        THREE.MathUtils.clamp(-this.velocity.y / Math.max(5, nextHoriz), -0.65, 0.72),
        10,
        safeDt
      );

      const [rx, rz] = this.resolveHorizontalWalls(
        this.position.x + this.velocity.x * safeDt,
        this.position.y,
        this.position.z + this.velocity.z * safeDt
      );
      this.position.x = rx;
      this.position.z = rz;
      this.position.y += this.velocity.y * safeDt;

      // Auto-perch when flying near a perch segment unless actively surging upward
      if (this.perchIgnoreTimer <= 0 && this.velocity.y < 3.6) {
        const hit = this.perches.findNearestPerch(
          this.position,
          isBraking ? 1.55 : 1.15,
          this.lastPerchId,
          this.perchIgnoreTimer > 0,
          _perchQuery
        );
        if (hit) {
          this.snapToPerch(hit.segment, hit.t);
        }
      }

      // Touchdown onto terrain or standable rooftops
      if (this.mode === 'flying') {
        const floorY = this.getStandableFloorY(this.position.x, this.position.z, this.position.y);
        const standY = floorY + this.getStandOffset();
        if (this.position.y <= standY && this.velocity.y <= 0.2) {
          this.position.y = standY;
          this.velocity.y = 0;
          this.mode = 'grounded';
          this.hopPhase = 0.72;
          this.bankAngle = 0;
          this.pitchAngle = 0;
          this.fx.spawnBurst(this.position, 6, 2.4);
          audioEngine.playSparrowHop('stone');
        }
      }

      // Wingtip trails when swooping fast
      const airspeed = this.velocity.length();
      if (this.mode === 'flying' && airspeed > 13.0) {
        this.wingTrailTimer += safeDt;
        if (this.wingTrailTimer >= 0.032) {
          this.wingTrailTimer = 0;
          this.sparrowMesh.wingTipLeft.getWorldPosition(_tipL);
          this.sparrowMesh.wingTipRight.getWorldPosition(_tipR);
          this.fx.spawnWingTrailSegment(_tipL, _tipR);
        }
      }
    }

    // Apply transform & skeletal animation to SparrowMesh
    this.sparrowMesh.root.position.copy(this.position);
    this.sparrowMesh.root.rotation.order = 'YXZ';
    this.sparrowMesh.root.rotation.y = this.yaw;

    _headLook.set(Math.sin(elapsed * 0.9) * 0.12, Math.sin(elapsed * 1.3) * 0.05);
    const settleOffset =
      this.perchSettleTimer > 0
        ? -Math.sin((this.perchSettleTimer / 0.22) * Math.PI) * this.perchSettleAmp
        : 0;

    this.sparrowMesh.updatePose({
      mode: this.mode,
      dt: safeDt,
      elapsed,
      wingTuck: this.wingTuckAmount,
      peckPhase: this.peckTimer / 0.24,
      eatPhase: this.eatTimer / 0.42,
      verticalVel: this.velocity.y,
      perchArrival: this.perchTransActive ? 1 - this.perchTransElapsed / this.perchTransDuration : 0,
      perchSettleOffset: settleOffset,
      hopPhase: this.hopPhase,
      flapTimer: this.flapAnimTimer,
      bankAngle: this.bankAngle,
      pitchAngle: this.pitchAngle,
      chirpOpen: this.chirpOpen,
      isBraking: this.mode === 'flying' && isPlaying && input.backward && !input.forward,
      headLookLocal: _headLook,
    });
  }
}
