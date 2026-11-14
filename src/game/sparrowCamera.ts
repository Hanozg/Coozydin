import * as THREE from 'three';
import { ColliderBox } from '../types/game';
import { getWalkableSurfaceHeightAt } from './terrain';

const _anchor = new THREE.Vector3();
const _backDir = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();

export interface ChaseCameraUpdateParams {
  targetPos: THREE.Vector3;
  targetYaw: number;
  targetForwardX: number;
  targetForwardZ: number;
  airspeed: number;
  maxAirspeed: number;
  bankAngle: number;
  verticalVel: number;
  isFlying: boolean;
  isVehicle: boolean;
  zoomFactor: number;
  colliders: ColliderBox[];
  dt: number;
}

/**
 * Over-the-shoulder perspective follow camera ported from Sparrow Sim's BirdCamera:
 * - Dynamic airspeed FOV expansion & shoulder banking offset
 * - Smooth drag-to-orbit yaw & pitch look with auto-align back behind heading during flight/drive
 * - Building & terrain height clearance clamping so view never clips into rooftops or hillsides
 */
export class SparrowChaseCamera {
  public yaw = 0;
  public pitch = 0.28;
  private manualLookTimer = 0;
  private activePointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;

  private readonly currentPos = new THREE.Vector3();
  private readonly currentLookAt = new THREE.Vector3();
  private smoothedDist = 5.6;
  private initialized = false;

  public bindDrag(el: HTMLElement, isEnabled: () => boolean): () => void {
    const onDown = (e: PointerEvent) => {
      if (!isEnabled() || this.activePointerId !== null) return;
      this.activePointerId = e.pointerId;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (this.activePointerId !== e.pointerId || !isEnabled()) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.yaw -= dx * 0.0052;
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.0042, -0.22, 1.05);
      this.manualLookTimer = 1.8;
    };
    const onUp = (e: PointerEvent) => {
      if (this.activePointerId === e.pointerId) {
        this.activePointerId = null;
      }
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }

  public snapTo(pos: THREE.Vector3, yaw: number, isVehicle = false): void {
    this.yaw = yaw;
    this.pitch = isVehicle ? 0.30 : 0.24;
    this.smoothedDist = isVehicle ? 7.0 : 4.8;
    this.currentLookAt.set(pos.x, pos.y + (isVehicle ? 1.2 : 0.9), pos.z);
    this.currentPos.set(
      pos.x - Math.sin(yaw) * this.smoothedDist,
      pos.y + (isVehicle ? 3.2 : 2.1),
      pos.z - Math.cos(yaw) * this.smoothedDist
    );
    this.initialized = true;
  }

  public update(camera: THREE.PerspectiveCamera, params: ChaseCameraUpdateParams): void {
    const dt = Math.min(0.05, params.dt);
    const speedNorm = THREE.MathUtils.clamp(params.airspeed / Math.max(1, params.maxAirspeed), 0, 1);

    if (!this.initialized) {
      this.snapTo(params.targetPos, params.targetYaw, params.isVehicle);
    }

    if (this.manualLookTimer > 0) {
      this.manualLookTimer = Math.max(0, this.manualLookTimer - dt);
    } else if (params.isFlying || params.airspeed > 0.6) {
      let diff = params.targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const alignRate = params.isFlying ? 2.8 : params.isVehicle ? 3.8 : 2.3;
      this.yaw += diff * Math.min(1, dt * alignRate);
      if (params.isFlying) {
        const flightPitch = THREE.MathUtils.clamp(0.22 - params.verticalVel * 0.012, 0.1, 0.44);
        this.pitch += (flightPitch - this.pitch) * Math.min(1, dt * 2.4);
      } else if (params.isVehicle) {
        this.pitch += (0.30 - this.pitch) * Math.min(1, dt * 1.8);
      }
    }

    const zoomScale = THREE.MathUtils.clamp(1 / Math.max(0.6, params.zoomFactor), 0.6, 1.55);
    const baseDist = params.isVehicle
      ? (7.2 + speedNorm * 2.0) * zoomScale
      : params.isFlying
        ? (5.0 + speedNorm * 1.55) * zoomScale
        : 3.9 * zoomScale;

    const shoulderRight = params.isVehicle
      ? 0
      : params.isFlying
        ? 0.24 - params.bankAngle * 0.34
        : 0.28;
    const heightOffset = params.isVehicle ? 2.05 : params.isFlying ? 1.12 : 1.12;

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);

    const rightX = -cosY;
    const rightZ = sinY;
    const leadMult = params.isVehicle ? 0.72 : params.isFlying ? 0.45 : 0.22;

    _anchor.set(
      params.targetPos.x + rightX * shoulderRight + params.targetForwardX * leadMult,
      params.targetPos.y + heightOffset,
      params.targetPos.z + rightZ * shoulderRight + params.targetForwardZ * leadMult
    );

    _backDir.set(-sinY * cosP, sinP, -cosY * cosP).normalize();

    let allowedDist = baseDist;
    // Sample along camera ray against terrain height & colliders to avoid underground / wall clipping
    for (let step = 1; step <= 6; step++) {
      const dist = (baseDist * step) / 6;
      const px = _anchor.x + _backDir.x * dist;
      const py = _anchor.y + _backDir.y * dist;
      const pz = _anchor.z + _backDir.z * dist;
      const groundH = getWalkableSurfaceHeightAt(px, pz) + 0.6;
      if (py < groundH) {
        allowedDist = Math.min(allowedDist, Math.max(2.1, dist - 0.35));
        break;
      }
      let blocked = false;
      for (let bIdx = 0; bIdx < params.colliders.length; bIdx++) {
        const b = params.colliders[bIdx];
        const topY =
          b.maxY ??
          getWalkableSurfaceHeightAt((b.minX + b.maxX) * 0.5, (b.minZ + b.maxZ) * 0.5) + 5.0;
        if (px > b.minX - 0.25 && px < b.maxX + 0.25 && pz > b.minZ - 0.25 && pz < b.maxZ + 0.25 && py < topY) {
          allowedDist = Math.min(allowedDist, Math.max(2.1, dist - 0.45));
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }

    const dampDistRate = allowedDist < this.smoothedDist ? 14.0 : 5.5;
    this.smoothedDist += (allowedDist - this.smoothedDist) * (1 - Math.exp(-dt * dampDistRate));
    _desiredPos.copy(_anchor).addScaledVector(_backDir, this.smoothedDist);

    const minGroundY = getWalkableSurfaceHeightAt(_desiredPos.x, _desiredPos.z) + 0.72;
    if (_desiredPos.y < minGroundY) {
      _desiredPos.y = minGroundY;
    }

    const posFollowXZ = 1 - Math.exp(-dt * (params.isFlying ? 11.5 : 13.0));
    const posFollowY = 1 - Math.exp(-dt * (params.isFlying ? 11.0 : 11.5));
    const lookFollow = 1 - Math.exp(-dt * 16.0);

    this.currentPos.x += (_desiredPos.x - this.currentPos.x) * posFollowXZ;
    this.currentPos.y += (_desiredPos.y - this.currentPos.y) * posFollowY;
    this.currentPos.z += (_desiredPos.z - this.currentPos.z) * posFollowXZ;

    this.currentLookAt.lerp(_anchor, lookFollow);

    const baseFov = camera.aspect < 1.0 ? 68 : 60;
    const targetFov = baseFov + (params.isFlying || params.isVehicle ? speedNorm * 9 : 0);
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4.5);
      camera.updateProjectionMatrix();
    }

    camera.position.copy(this.currentPos);
    camera.lookAt(this.currentLookAt);
  }

  public getCameraPos(): THREE.Vector3 {
    return this.currentPos;
  }
}
