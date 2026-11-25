import * as THREE from 'three';
import { SparrowChaseCamera } from '../../game/sparrowCamera';
import { SparrowController } from '../../game/sparrowController';
import { SparrowMesh } from '../../game/sparrowMesh';
import { getWalkableSurfaceHeightAt } from '../../game/terrain';
import { CameraPreset, ColliderBox, GamePhase } from '../../types/game';

const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _chaseTarget = new THREE.Vector3();

export interface CameraUpdateParams {
  dt: number;
  elapsed: number;
  phase: GamePhase;
  cameraPreset: CameraPreset;
  isFirstPerson: boolean;
  isSparrow: boolean;
  isWalking: boolean;
  sandboxMode?: boolean;
  sandboxCam?: {
    x: number;
    z: number;
    yaw: number;
    zoom: number;
  };
  sim: {
    x: number;
    y: number;
    z: number;
    heading: number;
    speed: number;
    pitch: number;
    zoomFactor: number;
    isoYawOffset: number;
    fpYaw: number;
    fpPitch: number;
  };
  camera: THREE.OrthographicCamera;
  fpCamera: THREE.PerspectiveCamera;
  chaseCamera: THREE.PerspectiveCamera;
  sparrowChaseCam: SparrowChaseCamera;
  sparrowController: SparrowController;
  sparrowMesh: SparrowMesh;
  colliders: ColliderBox[];
  lookCurrent: THREE.Vector3;
  prevCamZoom: number;
  sunLight: THREE.DirectionalLight;
  shadowTexel: number;
  sunPos: [number, number, number];
}

export function updateCanvasCamera(params: CameraUpdateParams): {
  activeCam: THREE.Camera;
  prevCamZoom: number;
} {
  const {
    dt,
    elapsed,
    phase,
    cameraPreset,
    isFirstPerson,
    isSparrow,
    isWalking,
    sandboxMode = false,
    sandboxCam,
    sim,
    camera,
    fpCamera,
    chaseCamera,
    sparrowChaseCam,
    sparrowController,
    sparrowMesh,
    colliders,
    lookCurrent,
    sunLight,
    shadowTexel,
    sunPos,
  } = params;
  let { prevCamZoom } = params;

  const presetZoom =
    cameraPreset === 'close' ? 1.48 : cameraPreset === 'overview' ? 0.65 : 1.0;

  const useChaseCam =
    !sandboxMode &&
    phase !== 'title' &&
    !isFirstPerson &&
    (isSparrow || cameraPreset === 'perspective');
  const activeCam: THREE.Camera = sandboxMode
    ? camera
    : isFirstPerson
      ? fpCamera
      : useChaseCam
        ? chaseCamera
        : camera;

  if (phase === 'title') {
    const orbitAngle = elapsed * 0.11;
    const focusX = Math.sin(orbitAngle) * 20;
    const focusZ = 2 + Math.cos(orbitAngle) * 22;
    const focusY = getWalkableSurfaceHeightAt(focusX, focusZ);
    _lookGoal.set(focusX, focusY + 2, focusZ);
    _camGoal.set(focusX + 42, focusY + 36, focusZ + 42);
    camera.zoom = THREE.MathUtils.damp(camera.zoom, 0.9, 2.5, dt);
    lookCurrent.lerp(_lookGoal, 1 - Math.exp(-5.5 * dt));
    camera.position.lerp(_camGoal, 1 - Math.exp(-5.5 * dt));
    camera.lookAt(lookCurrent);
    if (Math.abs(camera.zoom - prevCamZoom) > 1e-4) {
      prevCamZoom = camera.zoom;
      camera.updateProjectionMatrix();
    }
  } else if (sandboxMode && sandboxCam) {
    const isoAzimuth = Math.PI / 4 + sandboxCam.yaw;
    const isoDist = 56.0;
    const focusY = getWalkableSurfaceHeightAt(sandboxCam.x, sandboxCam.z);
    _lookGoal.set(sandboxCam.x, focusY + 1.0, sandboxCam.z);
    _camGoal.set(
      _lookGoal.x + Math.sin(isoAzimuth) * isoDist,
      focusY + 42,
      _lookGoal.z + Math.cos(isoAzimuth) * isoDist
    );
    camera.zoom = THREE.MathUtils.damp(camera.zoom, sandboxCam.zoom, 8, dt);
    lookCurrent.lerp(_lookGoal, 1 - Math.exp(-10 * dt));
    camera.position.lerp(_camGoal, 1 - Math.exp(-10 * dt));
    camera.lookAt(lookCurrent);
    if (Math.abs(camera.zoom - prevCamZoom) > 1e-4) {
      prevCamZoom = camera.zoom;
      camera.updateProjectionMatrix();
    }
  } else if (isFirstPerson) {
    const eyeH = isSparrow ? 0.34 : isWalking ? 1.46 : 1.32;
    const fwdOff = isSparrow ? 0.24 : isWalking ? 0.14 : 0.38;
    const camX = sim.x - Math.sin(sim.heading) * fwdOff;
    const camZ = sim.z - Math.cos(sim.heading) * fwdOff;
    const camY = sim.y + eyeH;
    const lookAngle = sim.heading + sim.fpYaw;
    const totalPitch = THREE.MathUtils.clamp(sim.pitch * 0.6 + sim.fpPitch, -0.65, 0.52);

    fpCamera.position.set(camX, camY, camZ);
    _lookGoal.set(
      camX - Math.sin(lookAngle) * Math.cos(totalPitch) * 16,
      camY + Math.sin(totalPitch) * 16,
      camZ - Math.cos(lookAngle) * Math.cos(totalPitch) * 16
    );
    fpCamera.lookAt(_lookGoal);
    lookCurrent.set(sim.x, sim.y + (isSparrow ? 0.4 : 1.0), sim.z);
  } else if (useChaseCam) {
    if (isSparrow) {
      _chaseTarget.copy(sparrowController.position);
      sparrowChaseCam.update(chaseCamera, {
        targetPos: _chaseTarget,
        targetYaw: sparrowController.yaw,
        targetForwardX: Math.sin(sparrowController.yaw),
        targetForwardZ: Math.cos(sparrowController.yaw),
        airspeed: sim.speed,
        maxAirspeed: 22,
        bankAngle: sparrowMesh.bodyPivot.rotation.z,
        verticalVel: sparrowController.velocity.y,
        isFlying: sparrowController.mode === 'flying',
        isVehicle: false,
        zoomFactor: sim.zoomFactor,
        colliders,
        dt,
      });
      lookCurrent.set(sim.x, sim.y + 0.4, sim.z);
    } else {
      _chaseTarget.set(sim.x, sim.y, sim.z);
      sparrowChaseCam.update(chaseCamera, {
        targetPos: _chaseTarget,
        targetYaw: sim.heading + Math.PI,
        targetForwardX: -Math.sin(sim.heading),
        targetForwardZ: -Math.cos(sim.heading),
        airspeed: Math.abs(sim.speed),
        maxAirspeed: 20,
        bankAngle: 0,
        verticalVel: 0,
        isFlying: false,
        isVehicle: !isWalking,
        zoomFactor: sim.zoomFactor,
        colliders,
        dt,
      });
      lookCurrent.set(sim.x, sim.y + 1.0, sim.z);
    }
  } else {
    const isoAzimuth = Math.PI / 4 + sim.isoYawOffset;
    const isoDist = 53.74;
    const speedLead = THREE.MathUtils.clamp(Math.abs(sim.speed) * 0.14, 0, 2.2);
    const fwdSign = sim.speed >= -0.2 ? 1 : -1;
    const leadX = -Math.sin(sim.heading) * speedLead * fwdSign;
    const leadZ = -Math.cos(sim.heading) * speedLead * fwdSign;

    _lookGoal.set(sim.x + leadX, sim.y + 1.0, sim.z + leadZ);
    _camGoal.set(
      _lookGoal.x + Math.sin(isoAzimuth) * isoDist,
      sim.y + 34,
      _lookGoal.z + Math.cos(isoAzimuth) * isoDist
    );
    camera.zoom = THREE.MathUtils.damp(
      camera.zoom,
      sim.zoomFactor * presetZoom,
      5,
      dt
    );
    lookCurrent.lerp(_lookGoal, 1 - Math.exp(-6.5 * dt));
    camera.position.lerp(_camGoal, 1 - Math.exp(-6.5 * dt));
    camera.lookAt(lookCurrent);
    if (Math.abs(camera.zoom - prevCamZoom) > 1e-4) {
      prevCamZoom = camera.zoom;
      camera.updateProjectionMatrix();
    }
  }

  const snapSunX = Math.round(lookCurrent.x / shadowTexel) * shadowTexel;
  const snapSunZ = Math.round(lookCurrent.z / shadowTexel) * shadowTexel;
  sunLight.target.position.set(snapSunX, lookCurrent.y, snapSunZ);
  sunLight.position.set(
    snapSunX + sunPos[0],
    lookCurrent.y + sunPos[1],
    snapSunZ + sunPos[2]
  );

  return { activeCam, prevCamZoom };
}
