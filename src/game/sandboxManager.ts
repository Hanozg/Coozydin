import * as THREE from 'three';
import {
  getDefaultRoadDef,
  getDefaultRoadDefs,
  RoadSegmentDef,
  roundPolylineCorners,
  sampleNearestRoad,
  setLiveRoadSegments,
} from '../data/aydinRoads';
import {
  ColliderBox,
  SandboxBuildingCategory,
  SandboxBuildingSummary,
  SandboxCustomHouseSpec,
  SandboxHudState,
  SandboxNewRoadSpec,
  SandboxPlacementEntry,
  SandboxRoadOverrideEntry,
  SandboxRoadSummary,
  SandboxRoadSurface,
  SandboxToolMode,
  SandboxTreeKind,
  SandboxTreeOverrideEntry,
  SandboxTreeSummary,
} from '../types/game';
import { EditableTreeSlot, SeasonalFoliageSystem } from './seasonalFoliage';
import { getSurfaceHeightAt, getTerrainHeightAt, getWalkableSurfaceHeightAt } from './terrain';
import { RoadNetworkHandle } from './world/roadNetwork';

const SANDBOX_STORAGE_KEY_V1 = 'efeler_sandbox_layout_v1';
const SANDBOX_STORAGE_KEY_V2 = 'efeler_sandbox_layout_v2';

interface SandboxLayoutStorageV2 {
  version: 2;
  buildings: SandboxPlacementEntry[];
  trees: SandboxTreeOverrideEntry[];
  roads: SandboxRoadOverrideEntry[];
}

interface LocalColliderMeta {
  collider: ColliderBox;
  localCx: number;
  localCz: number;
  halfW: number;
  halfD: number;
  topOffsetY?: number;
  roofLocal?: {
    halfW: number;
    halfD: number;
    wallOffsetY: number;
    peakH: number;
    ridgeAlongZ: boolean;
    localRotY: number;
  };
}

interface SandboxBuildingRecord {
  id: string;
  label: string;
  category: SandboxBuildingCategory;
  group: THREE.Group;
  hitProxy: THREE.Mesh;
  defaultX: number;
  defaultZ: number;
  defaultRotY: number;
  x: number;
  z: number;
  rotY: number;
  footprintW: number;
  footprintD: number;
  colliderMetas: LocalColliderMeta[];
  ringMesh?: THREE.Mesh;
  ringLocalOffset?: [number, number];
  customSpec?: SandboxCustomHouseSpec;
}

interface RoadStateSnapshot {
  roadDefs: RoadSegmentDef[];
  deletedDefaultRoadIds: string[];
  customRoadIds: string[];
  selectedRoadId: string | null;
  selectedRoadNodeIndex: number | null;
}

type UndoAction =
  | { type: 'transform'; id: string; prevX: number; prevZ: number; prevRotY: number }
  | { type: 'spawn'; id: string }
  | {
      type: 'delete';
      id: string;
      x: number;
      z: number;
      rotY: number;
      spec: SandboxCustomHouseSpec;
    }
  | {
      type: 'tree_transform';
      id: string;
      prevX: number;
      prevZ: number;
      prevRotY: number;
      prevScale: number;
    }
  | { type: 'tree_spawn'; id: string }
  | { type: 'tree_delete'; id: string }
  | { type: 'road_snapshot'; prev: RoadStateSnapshot }
  | {
      type: 'reset_all';
      prevBuildings: SandboxPlacementEntry[];
      prevTrees: SandboxTreeOverrideEntry[];
      prevRoads: RoadStateSnapshot;
    };

export interface CustomHouseSpawnResult {
  group: THREE.Group;
  colliders: ColliderBox[];
  footprintW: number;
  footprintD: number;
  hitProxyHeight?: number;
}

export interface RegisterMovableBuildingInput {
  id: string;
  label: string;
  category: SandboxBuildingCategory;
  group: THREE.Group;
  x: number;
  z: number;
  rotY?: number;
  colliders: ColliderBox[];
  ringMesh?: THREE.Mesh;
  footprintW?: number;
  footprintD?: number;
  hitProxyHeight?: number;
  customSpec?: SandboxCustomHouseSpec;
}

export interface SandboxManager {
  hitProxies: THREE.Mesh[];
  registerBuilding: (input: RegisterMovableBuildingInput) => void;
  setCustomHouseFactory: (
    factory: (
      spec: SandboxCustomHouseSpec,
      x: number,
      z: number,
      rotY: number
    ) => CustomHouseSpawnResult
  ) => void;
  bindFoliage: (foliage: SeasonalFoliageSystem) => void;
  bindRoadNetwork: (roadNet: RoadNetworkHandle) => void;
  rebindBuildingGroup: (id: string, nextGroup: THREE.Group) => void;
  getBuildingTransform: (id: string) => { x: number; z: number; rotY: number } | null;
  getLandmarkPosition: (landmarkId: string) => [number, number] | null;
  hydrateFromStorage: () => void;
  saveToStorage: () => void;
  setSandboxActive: (active: boolean) => void;
  setToolMode: (mode: SandboxToolMode) => void;
  getToolMode: () => SandboxToolMode;

  // Buildings
  selectBuilding: (id: string | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  beginDrag: (id: string) => void;
  moveBuildingLive: (id: string, x: number, z: number, rotY: number, liftY?: number) => boolean;
  endDrag: (id: string) => void;
  rotateSelected: (deltaRad: number) => void;
  nudgeSelected: (dx: number, dz: number) => void;
  spawnCustomHouse: (spec: SandboxCustomHouseSpec, x: number, z: number, rotY?: number) => string | null;
  deleteCustomHouse: (id: string) => boolean;
  resetBuilding: (id: string) => void;
  getSelectedId: () => string | null;

  // Trees
  getTreeRaycastTargets: () => THREE.InstancedMesh[];
  getTreeByInstance: (kind: SandboxTreeKind, instanceId: number) => EditableTreeSlot | null;
  getTreeTransform: (id: string) => { x: number; z: number; rotY: number; scale: number } | null;
  selectTree: (id: string | null) => void;
  setHoveredTree: (id: string | null) => void;
  beginTreeDrag: (id: string) => void;
  moveTreeLive: (id: string, x: number, z: number, liftY?: number) => boolean;
  endTreeDrag: (id: string) => void;
  rotateSelectedTree: (deltaRad: number) => void;
  scaleSelectedTree: (deltaScale: number) => void;
  nudgeSelectedTree: (dx: number, dz: number) => void;
  spawnCustomTree: (kind: SandboxTreeKind, x: number, z: number) => string | null;
  deleteSelectedTree: () => boolean;
  resetSelectedTree: () => void;
  getSelectedTreeId: () => string | null;

  // Roads
  getRoadHandleTargets: () => THREE.Mesh[];
  pickRoadAt: (x: number, z: number) => string | null;
  selectRoad: (id: string | null, nodeIndex?: number | null) => void;
  getRoadCenter: (id: string) => [number, number] | null;
  getRoadNodePosition: (roadId: string, nodeIndex: number) => [number, number] | null;
  beginRoadNodeDrag: (roadId: string, nodeIndex: number) => boolean;
  insertRoadNodeAndBeginDrag: (roadId: string, afterIndex: number) => number | null;
  moveRoadNodeLive: (roadId: string, nodeIndex: number, x: number, z: number) => void;
  endRoadNodeDrag: () => void;
  appendRoadNode: () => boolean;
  deleteSelectedRoadNode: () => boolean;
  adjustSelectedRoadWidth: (delta: number) => void;
  setSelectedRoadSurface: (surface: SandboxRoadSurface) => void;
  toggleSelectedRoadSurface: () => void;
  toggleSelectedRoadCenterLine: () => void;
  toggleSelectedRoadSidewalk: () => void;
  setSelectedRoadCornerRadius: (radius: number) => void;
  setAutoRoundCorners: (enabled: boolean) => void;
  isAutoRoundCorners: () => boolean;
  spawnCustomRoad: (spec: SandboxNewRoadSpec, x: number, z: number) => string | null;
  deleteSelectedRoad: () => boolean;
  resetSelectedRoad: () => void;
  getSelectedRoadId: () => string | null;

  // Global
  resetAll: () => void;
  undo: () => boolean;
  setGridSnap: (enabled: boolean) => void;
  isGridSnap: () => boolean;
  getSnapshot: () => SandboxHudState;
  updateVisuals: (elapsed: number) => void;
  dispose: () => void;
}

const _tmpBox3 = new THREE.Box3();
const _tmpSize = new THREE.Vector3();
const _tmpCenter = new THREE.Vector3();

function rotateLocalXZ(lx: number, lz: number, rotY: number): [number, number] {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  return [lx * c + lz * s, -lx * s + lz * c];
}

function unrotateWorldOffset(dx: number, dz: number, rotY: number): [number, number] {
  return rotateLocalXZ(dx, dz, -rotY);
}

function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function isRoadOverlap(x: number, z: number, halfW: number, halfD: number): boolean {
  const pad = Math.min(4.2, Math.max(halfW, halfD) * 0.45);
  const sample = sampleNearestRoad(x, z, 12);
  if (!sample.road) return false;
  return sample.dist < sample.road.width * 0.5 + pad * 0.65;
}

const ROAD_SURFACE_ORDER: SandboxRoadSurface[] = [
  'asphalt',
  'cobble',
  'dirt',
  'gravel',
  'brick',
];

function normalizeRoadSurface(value: unknown): SandboxRoadSurface {
  if (
    value === 'asphalt' ||
    value === 'cobble' ||
    value === 'dirt' ||
    value === 'gravel' ||
    value === 'brick'
  ) {
    return value;
  }
  return 'asphalt';
}

function cloneRoadDef(r: RoadSegmentDef): RoadSegmentDef {
  return {
    id: r.id,
    name: r.name,
    surface: r.surface,
    width: r.width,
    hasCenterLine: r.hasCenterLine,
    hasSidewalk: r.hasSidewalk !== false,
    cornerRadius: r.cornerRadius ?? 0,
    points: r.points.map(([px, pz]) => [px, pz] as [number, number]),
  };
}

function isRoadDefDifferent(a: RoadSegmentDef, b: RoadSegmentDef): boolean {
  if (
    a.surface !== b.surface ||
    Math.abs(a.width - b.width) > 0.05 ||
    a.hasCenterLine !== b.hasCenterLine ||
    (a.hasSidewalk !== false) !== (b.hasSidewalk !== false) ||
    Math.abs((a.cornerRadius ?? 0) - (b.cornerRadius ?? 0)) > 0.05 ||
    a.points.length !== b.points.length
  ) {
    return true;
  }
  for (let i = 0; i < a.points.length; i++) {
    if (
      Math.abs(a.points[i][0] - b.points[i][0]) > 0.08 ||
      Math.abs(a.points[i][1] - b.points[i][1]) > 0.08
    ) {
      return true;
    }
  }
  return false;
}

function createSelectionGizmo(colorHex: number, isHover: boolean): {
  root: THREE.Group;
  fillMesh: THREE.Mesh;
  outlineLine: THREE.LineSegments;
  arrowMesh: THREE.Mesh;
  setSize: (w: number, d: number) => void;
  setColor: (hex: number) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  root.visible = false;

  const fillGeo = new THREE.PlaneGeometry(1, 1);
  fillGeo.rotateX(-Math.PI / 2);
  const fillMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: isHover ? 0.14 : 0.24,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  const fillMesh = new THREE.Mesh(fillGeo, fillMat);
  fillMesh.position.y = 0.14;
  root.add(fillMesh);

  const edgeBox = new THREE.BoxGeometry(1, 0.08, 1);
  const edgesGeo = new THREE.EdgesGeometry(edgeBox);
  edgeBox.dispose();
  const edgeMat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: isHover ? 0.72 : 0.98,
  });
  const outlineLine = new THREE.LineSegments(edgesGeo, edgeMat);
  outlineLine.position.y = 0.22;
  root.add(outlineLine);

  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.95);
  arrowShape.lineTo(0.62, 0.0);
  arrowShape.lineTo(0.24, 0.0);
  arrowShape.lineTo(0.24, -0.45);
  arrowShape.lineTo(-0.24, -0.45);
  arrowShape.lineTo(-0.24, 0.0);
  arrowShape.lineTo(-0.62, 0.0);
  arrowShape.closePath();
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(Math.PI / 2);
  const arrowMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isHover ? 0.0 : 0.92,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
  });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.position.set(0, 0.24, 0.85);
  arrowMesh.visible = !isHover;
  root.add(arrowMesh);

  return {
    root,
    fillMesh,
    outlineLine,
    arrowMesh,
    setSize(w: number, d: number) {
      const padW = Math.max(3.6, w + 1.4);
      const padD = Math.max(3.6, d + 1.4);
      fillMesh.scale.set(padW, 1, padD);
      outlineLine.scale.set(padW, 1, padD);
      arrowMesh.position.set(0, 0.24, padD * 0.5 + 1.05);
    },
    setColor(hex: number) {
      fillMat.color.setHex(hex);
      edgeMat.color.setHex(hex);
      arrowMat.color.setHex(hex);
    },
    dispose() {
      fillGeo.dispose();
      fillMat.dispose();
      edgesGeo.dispose();
      edgeMat.dispose();
      arrowGeo.dispose();
      arrowMat.dispose();
    },
  };
}

function createTreeRingGizmo(colorHex: number, isHover: boolean): {
  root: THREE.Group;
  ringMesh: THREE.Mesh;
  discMesh: THREE.Mesh;
  setRadius: (r: number) => void;
  setColor: (hex: number) => void;
  dispose: () => void;
} {
  const root = new THREE.Group();
  root.visible = false;

  const discGeo = new THREE.CircleGeometry(1, 24);
  discGeo.rotateX(-Math.PI / 2);
  const discMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: isHover ? 0.14 : 0.24,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
  const discMesh = new THREE.Mesh(discGeo, discMat);
  discMesh.position.y = 0.16;
  root.add(discMesh);

  const ringGeo = new THREE.RingGeometry(0.84, 1.04, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isHover ? 0.72 : 0.96,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.21;
  root.add(ringMesh);

  return {
    root,
    ringMesh,
    discMesh,
    setRadius(r: number) {
      const clamped = Math.max(1.6, Math.min(6.0, r));
      discMesh.scale.set(clamped, 1, clamped);
      ringMesh.scale.set(clamped, 1, clamped);
    },
    setColor(hex: number) {
      discMat.color.setHex(hex);
      ringMat.color.setHex(hex);
    },
    dispose() {
      discGeo.dispose();
      discMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    },
  };
}

export function createSandboxManager(
  cityGroup: THREE.Group,
  cityColliders: ColliderBox[]
): SandboxManager {
  const records = new Map<string, SandboxBuildingRecord>();
  const hitProxies: THREE.Mesh[] = [];
  const undoStack: UndoAction[] = [];

  const proxyMaterial = new THREE.MeshBasicMaterial({
    visible: false,
  });

  // Building Gizmos
  const selectionGizmo = createSelectionGizmo(0xe6a83a, false);
  const hoverGizmo = createSelectionGizmo(0xf3d493, true);
  cityGroup.add(selectionGizmo.root);
  cityGroup.add(hoverGizmo.root);

  // Tree Gizmos
  const treeSelectionGizmo = createTreeRingGizmo(0x4eb872, false);
  const treeHoverGizmo = createTreeRingGizmo(0xb5e6b0, true);
  cityGroup.add(treeSelectionGizmo.root);
  cityGroup.add(treeHoverGizmo.root);

  // Road Editing Visuals Group
  const roadEditGroup = new THREE.Group();
  roadEditGroup.visible = false;
  cityGroup.add(roadEditGroup);

  const roadGuideMat = new THREE.LineBasicMaterial({
    color: 0xf4dca4,
    transparent: true,
    opacity: 0.62,
  });
  const roadSelectedLineMat = new THREE.LineBasicMaterial({
    color: 0xffc64b,
    transparent: true,
    opacity: 0.98,
  });
  const roadControlCageMat = new THREE.LineBasicMaterial({
    color: 0xf4dca4,
    transparent: true,
    opacity: 0.36,
  });
  const vertexHandleGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.95, 16);
  const midpointHandleGeo = new THREE.CylinderGeometry(0.62, 0.68, 0.62, 12);
  const vertexNormalMat = new THREE.MeshBasicMaterial({ color: 0xe69828 });
  const vertexActiveMat = new THREE.MeshBasicMaterial({ color: 0xfff0b8 });
  const midpointMat = new THREE.MeshBasicMaterial({ color: 0x4eb872 });

  let allRoadsGuideLine: THREE.LineSegments | null = null;
  let selectedRoadRibbon: THREE.Line | null = null;
  let selectedControlCage: THREE.Line | null = null;
  const roadHandleMeshes: THREE.Mesh[] = [];

  // Runtime Refs
  let foliageRef: SeasonalFoliageSystem | null = null;
  let roadNetworkRef: RoadNetworkHandle | null = null;

  // Road State
  let roadDefs: RoadSegmentDef[] = getDefaultRoadDefs();
  const deletedDefaultRoadIds = new Set<string>();
  const customRoadIds = new Set<string>();
  let customRoadSeq = 1;
  let lastRoadRebuildMs = 0;
  let lastCornerUndoMs = 0;
  let lastCornerUndoRoadId: string | null = null;
  let roadDragPreSnapshot: RoadStateSnapshot | null = null;
  let roadDragMoved = false;
  let autoRoundCorners = true;

  // Global Sandbox State
  let sandboxActive = false;
  let toolMode: SandboxToolMode = 'buildings';
  let selectedId: string | null = null;
  let hoveredId: string | null = null;
  let selectedTreeId: string | null = null;
  let hoveredTreeId: string | null = null;
  let selectedRoadId: string | null = null;
  let selectedRoadNodeIndex: number | null = null;

  let isDragging = false;
  let onRoadWarning = false;
  let gridSnap = false;
  let dragStartTransform: { id: string; x: number; z: number; rotY: number } | null = null;
  let treeDragStart: { id: string; x: number; z: number; rotY: number; scale: number } | null =
    null;
  let customHouseSeq = 1;
  let customHouseFactory:
    | ((
        spec: SandboxCustomHouseSpec,
        x: number,
        z: number,
        rotY: number
      ) => CustomHouseSpawnResult)
    | null = null;

  const pushUndo = (action: UndoAction) => {
    undoStack.push(action);
    if (undoStack.length > 50) undoStack.shift();
  };

  const captureRoadSnapshot = (): RoadStateSnapshot => ({
    roadDefs: roadDefs.map(cloneRoadDef),
    deletedDefaultRoadIds: Array.from(deletedDefaultRoadIds),
    customRoadIds: Array.from(customRoadIds),
    selectedRoadId,
    selectedRoadNodeIndex,
  });

  const restoreRoadSnapshot = (snap: RoadStateSnapshot) => {
    roadDefs = snap.roadDefs.map(cloneRoadDef);
    deletedDefaultRoadIds.clear();
    snap.deletedDefaultRoadIds.forEach((id) => deletedDefaultRoadIds.add(id));
    customRoadIds.clear();
    snap.customRoadIds.forEach((id) => customRoadIds.add(id));
    selectedRoadId = snap.selectedRoadId && roadDefs.some((r) => r.id === snap.selectedRoadId)
      ? snap.selectedRoadId
      : null;
    selectedRoadNodeIndex = snap.selectedRoadNodeIndex;
    setLiveRoadSegments(roadDefs);
    roadNetworkRef?.rebuild();
    syncRoadVisuals();
  };

  const clearRoadVisuals = () => {
    if (allRoadsGuideLine) {
      roadEditGroup.remove(allRoadsGuideLine);
      allRoadsGuideLine.geometry.dispose();
      allRoadsGuideLine = null;
    }
    if (selectedRoadRibbon) {
      roadEditGroup.remove(selectedRoadRibbon);
      selectedRoadRibbon.geometry.dispose();
      selectedRoadRibbon = null;
    }
    if (selectedControlCage) {
      roadEditGroup.remove(selectedControlCage);
      selectedControlCage.geometry.dispose();
      selectedControlCage = null;
    }
    for (let i = 0; i < roadHandleMeshes.length; i++) {
      roadEditGroup.remove(roadHandleMeshes[i]);
    }
    roadHandleMeshes.length = 0;
  };

  const syncRoadVisuals = () => {
    clearRoadVisuals();
    const showRoads = sandboxActive && toolMode === 'roads';
    roadEditGroup.visible = showRoads;
    if (!showRoads) return;

    // 1. Subtle guide lines over every active road (following rounded curves)
    const guideVerts: number[] = [];
    for (let r = 0; r < roadDefs.length; r++) {
      const road = roadDefs[r];
      const pts = roundPolylineCorners(road.points, road.cornerRadius ?? 0);
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const segLen = Math.hypot(bx - ax, bz - az);
        const steps = Math.max(1, Math.min(8, Math.ceil(segLen / 12)));
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          const x0 = ax + (bx - ax) * t0;
          const z0 = az + (bz - az) * t0;
          const x1 = ax + (bx - ax) * t1;
          const z1 = az + (bz - az) * t1;
          guideVerts.push(
            x0,
            getSurfaceHeightAt(x0, z0) + 0.36,
            z0,
            x1,
            getSurfaceHeightAt(x1, z1) + 0.36,
            z1
          );
        }
      }
    }
    if (guideVerts.length > 0) {
      const gGeo = new THREE.BufferGeometry();
      gGeo.setAttribute('position', new THREE.Float32BufferAttribute(guideVerts, 3));
      allRoadsGuideLine = new THREE.LineSegments(gGeo, roadGuideMat);
      allRoadsGuideLine.renderOrder = 4;
      roadEditGroup.add(allRoadsGuideLine);
    }

    // 2. Selected road bright ribbon + optional control cage + vertex & midpoint handles
    const selRoad = selectedRoadId ? roadDefs.find((r) => r.id === selectedRoadId) : undefined;
    if (!selRoad) return;

    const selRadius = selRoad.cornerRadius ?? 0;
    const selRenderPts = roundPolylineCorners(selRoad.points, selRadius);
    const selVerts: number[] = [];
    for (let i = 0; i < selRenderPts.length - 1; i++) {
      const [ax, az] = selRenderPts[i];
      const [bx, bz] = selRenderPts[i + 1];
      const segLen = Math.hypot(bx - ax, bz - az);
      const steps = Math.max(1, Math.min(10, Math.ceil(segLen / 8)));
      for (let s = 0; s <= steps; s++) {
        if (i > 0 && s === 0) continue;
        const t = s / steps;
        const px = ax + (bx - ax) * t;
        const pz = az + (bz - az) * t;
        selVerts.push(px, getSurfaceHeightAt(px, pz) + 0.52, pz);
      }
    }
    if (selVerts.length >= 6) {
      const sGeo = new THREE.BufferGeometry();
      sGeo.setAttribute('position', new THREE.Float32BufferAttribute(selVerts, 3));
      selectedRoadRibbon = new THREE.Line(sGeo, roadSelectedLineMat);
      selectedRoadRibbon.renderOrder = 5;
      roadEditGroup.add(selectedRoadRibbon);
    }

    // Faint control-polygon guide connecting draggable vertices when corner rounding is active
    if (selRadius > 0.1 && selRoad.points.length >= 3) {
      const cageVerts: number[] = [];
      for (let i = 0; i < selRoad.points.length; i++) {
        const [vx, vz] = selRoad.points[i];
        cageVerts.push(vx, getSurfaceHeightAt(vx, vz) + 0.44, vz);
      }
      const cGeo = new THREE.BufferGeometry();
      cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cageVerts, 3));
      selectedControlCage = new THREE.Line(cGeo, roadControlCageMat);
      selectedControlCage.renderOrder = 4;
      roadEditGroup.add(selectedControlCage);
    }

    // Vertex handles
    for (let i = 0; i < selRoad.points.length; i++) {
      const [vx, vz] = selRoad.points[i];
      const isNodeSelected = selectedRoadNodeIndex === i;
      const mesh = new THREE.Mesh(
        vertexHandleGeo,
        isNodeSelected ? vertexActiveMat : vertexNormalMat
      );
      const sy = getSurfaceHeightAt(vx, vz);
      mesh.position.set(vx, sy + 0.62, vz);
      if (isNodeSelected) {
        mesh.scale.set(1.24, 1.28, 1.24);
      }
      mesh.userData = {
        sandboxRoadHandleType: 'vertex',
        roadId: selRoad.id,
        nodeIndex: i,
      };
      mesh.renderOrder = 6;
      roadEditGroup.add(mesh);
      roadHandleMeshes.push(mesh);
    }

    // Midpoint '+' handles between consecutive vertices
    for (let i = 0; i < selRoad.points.length - 1; i++) {
      const [ax, az] = selRoad.points[i];
      const [bx, bz] = selRoad.points[i + 1];
      if (Math.hypot(bx - ax, bz - az) < 4.5) continue;
      const mx = (ax + bx) * 0.5;
      const mz = (az + bz) * 0.5;
      const sy = getSurfaceHeightAt(mx, mz);
      const midMesh = new THREE.Mesh(midpointHandleGeo, midpointMat);
      midMesh.position.set(mx, sy + 0.48, mz);
      midMesh.userData = {
        sandboxRoadHandleType: 'midpoint',
        roadId: selRoad.id,
        nodeIndex: i,
      };
      midMesh.renderOrder = 6;
      roadEditGroup.add(midMesh);
      roadHandleMeshes.push(midMesh);
    }
  };

  const buildHitProxy = (
    id: string,
    group: THREE.Group,
    fallbackW: number,
    fallbackD: number,
    overrideH?: number
  ): THREE.Mesh => {
    group.updateWorldMatrix(true, true);
    _tmpBox3.setFromObject(group);

    let w = fallbackW;
    let h = overrideH ?? 6.5;
    let d = fallbackD;
    let localCenterY = overrideH !== undefined ? overrideH * 0.5 : 3.2;

    if (!_tmpBox3.isEmpty()) {
      _tmpBox3.getSize(_tmpSize);
      _tmpBox3.getCenter(_tmpCenter);
      w = Math.max(fallbackW, Math.min(46, _tmpSize.x));
      d = Math.max(fallbackD, Math.min(46, _tmpSize.z));
      if (overrideH !== undefined) {
        h = overrideH;
        localCenterY = Math.max(0.22, overrideH * 0.5);
      } else {
        h = Math.max(3.6, Math.min(28, _tmpSize.y));
        localCenterY = Math.max(1.8, _tmpCenter.y - group.position.y);
      }
    }

    const proxyGeo = new THREE.BoxGeometry(w, h, d);
    const proxyMesh = new THREE.Mesh(proxyGeo, proxyMaterial);
    proxyMesh.position.set(0, localCenterY, 0);
    proxyMesh.userData.sandboxBuildingId = id;
    proxyMesh.userData.isSandboxHitProxy = true;
    group.add(proxyMesh);
    return proxyMesh;
  };

  const applyTransform = (
    rec: SandboxBuildingRecord,
    nx: number,
    nz: number,
    nRotY: number,
    liftY = 0
  ) => {
    const clampedX = THREE.MathUtils.clamp(nx, -216, 190);
    const clampedZ = THREE.MathUtils.clamp(nz, -134, 106);
    const normRot = normalizeAngle(nRotY);
    const groundY = getTerrainHeightAt(clampedX, clampedZ);

    rec.x = clampedX;
    rec.z = clampedZ;
    rec.rotY = normRot;

    rec.group.position.set(clampedX, groundY + liftY, clampedZ);
    rec.group.rotation.y = normRot;

    const cosR = Math.cos(normRot);
    const sinR = Math.sin(normRot);
    for (let i = 0; i < rec.colliderMetas.length; i++) {
      const m = rec.colliderMetas[i];
      const [wxOff, wzOff] = rotateLocalXZ(m.localCx, m.localCz, normRot);
      const cx = clampedX + wxOff;
      const cz = clampedZ + wzOff;
      const effHalfW = Math.abs(m.halfW * cosR) + Math.abs(m.halfD * sinR);
      const effHalfD = Math.abs(m.halfW * sinR) + Math.abs(m.halfD * cosR);

      m.collider.minX = cx - effHalfW;
      m.collider.maxX = cx + effHalfW;
      m.collider.minZ = cz - effHalfD;
      m.collider.maxZ = cz + effHalfD;
      if (m.topOffsetY !== undefined) {
        m.collider.maxY = groundY + m.topOffsetY;
      }
      if (m.collider.roof && m.roofLocal) {
        m.collider.roof.cx = cx;
        m.collider.roof.cz = cz;
        m.collider.roof.wallTopY = groundY + m.roofLocal.wallOffsetY;
        m.collider.roof.rotY = normalizeAngle(normRot + m.roofLocal.localRotY);
      }
    }

    if (rec.ringMesh && rec.ringLocalOffset) {
      const [rxOff, rzOff] = rotateLocalXZ(rec.ringLocalOffset[0], rec.ringLocalOffset[1], normRot);
      const rx = clampedX + rxOff;
      const rz = clampedZ + rzOff;
      rec.ringMesh.position.set(rx, getWalkableSurfaceHeightAt(rx, rz) + 0.08, rz);
    }
  };

  const syncAllGizmos = () => {
    if (!sandboxActive) {
      selectionGizmo.root.visible = false;
      hoverGizmo.root.visible = false;
      treeSelectionGizmo.root.visible = false;
      treeHoverGizmo.root.visible = false;
      roadEditGroup.visible = false;
      return;
    }

    // Building gizmos
    if (toolMode === 'buildings') {
      const sel = selectedId ? records.get(selectedId) : undefined;
      if (sel) {
        const gy = getTerrainHeightAt(sel.x, sel.z);
        selectionGizmo.root.visible = true;
        selectionGizmo.root.position.set(sel.x, gy + 0.04, sel.z);
        selectionGizmo.root.rotation.y = sel.rotY;
        selectionGizmo.setSize(sel.footprintW, sel.footprintD);
        if (isDragging) {
          selectionGizmo.setColor(onRoadWarning ? 0xd95a38 : 0x52a866);
        } else {
          selectionGizmo.setColor(0xe6a83a);
        }
      } else {
        selectionGizmo.root.visible = false;
      }

      const hov = hoveredId && hoveredId !== selectedId ? records.get(hoveredId) : undefined;
      if (hov && !isDragging) {
        const gy = getTerrainHeightAt(hov.x, hov.z);
        hoverGizmo.root.visible = true;
        hoverGizmo.root.position.set(hov.x, gy + 0.03, hov.z);
        hoverGizmo.root.rotation.y = hov.rotY;
        hoverGizmo.setSize(hov.footprintW, hov.footprintD);
      } else {
        hoverGizmo.root.visible = false;
      }
    } else {
      selectionGizmo.root.visible = false;
      hoverGizmo.root.visible = false;
    }

    // Tree gizmos
    if (toolMode === 'trees' && foliageRef) {
      const selTree = selectedTreeId ? foliageRef.getTree(selectedTreeId) : null;
      if (selTree && !selTree.deleted) {
        const gy = getTerrainHeightAt(selTree.x, selTree.z);
        treeSelectionGizmo.root.visible = true;
        treeSelectionGizmo.root.position.set(selTree.x, gy + 0.06, selTree.z);
        treeSelectionGizmo.setRadius(selTree.scale * 2.25);
        if (isDragging) {
          treeSelectionGizmo.setColor(onRoadWarning ? 0xd95a38 : 0x4eb872);
        } else {
          treeSelectionGizmo.setColor(0xe6a83a);
        }
      } else {
        treeSelectionGizmo.root.visible = false;
      }

      const hovTree =
        hoveredTreeId && hoveredTreeId !== selectedTreeId
          ? foliageRef.getTree(hoveredTreeId)
          : null;
      if (hovTree && !hovTree.deleted && !isDragging) {
        const gy = getTerrainHeightAt(hovTree.x, hovTree.z);
        treeHoverGizmo.root.visible = true;
        treeHoverGizmo.root.position.set(hovTree.x, gy + 0.05, hovTree.z);
        treeHoverGizmo.setRadius(hovTree.scale * 2.15);
      } else {
        treeHoverGizmo.root.visible = false;
      }
    } else {
      treeSelectionGizmo.root.visible = false;
      treeHoverGizmo.root.visible = false;
    }

    // Road visuals
    if (toolMode === 'roads') {
      syncRoadVisuals();
    } else {
      roadEditGroup.visible = false;
    }
  };

  const registerBuilding = (input: RegisterMovableBuildingInput) => {
    const rotY = input.rotY ?? 0;
    const baseGroundY = getTerrainHeightAt(input.x, input.z);

    let maxSpanX = input.footprintW ?? 6.2;
    let maxSpanZ = input.footprintD ?? 5.4;

    const colliderMetas: LocalColliderMeta[] = input.colliders.map((c) => {
      const cx = (c.minX + c.maxX) * 0.5;
      const cz = (c.minZ + c.maxZ) * 0.5;
      const halfW = (c.maxX - c.minX) * 0.5;
      const halfD = (c.maxZ - c.minZ) * 0.5;
      const [localCx, localCz] = unrotateWorldOffset(cx - input.x, cz - input.z, rotY);

      maxSpanX = Math.max(maxSpanX, (Math.abs(localCx) + halfW) * 2);
      maxSpanZ = Math.max(maxSpanZ, (Math.abs(localCz) + halfD) * 2);

      const isRightAngle = Math.abs(Math.sin(rotY)) > 0.7;
      const localHalfW = isRightAngle ? halfD : halfW;
      const localHalfD = isRightAngle ? halfW : halfD;

      const roofLocal = c.roof
        ? {
            halfW: c.roof.halfW,
            halfD: c.roof.halfD,
            wallOffsetY: c.roof.wallTopY - baseGroundY,
            peakH: c.roof.peakH,
            ridgeAlongZ: c.roof.ridgeAlongZ,
            localRotY: normalizeAngle((c.roof.rotY ?? 0) - rotY),
          }
        : undefined;

      return {
        collider: c,
        localCx,
        localCz,
        halfW: localHalfW,
        halfD: localHalfD,
        topOffsetY: c.maxY !== undefined ? c.maxY - baseGroundY : undefined,
        roofLocal,
      };
    });

    let ringLocalOffset: [number, number] | undefined;
    if (input.ringMesh) {
      ringLocalOffset = unrotateWorldOffset(
        input.ringMesh.position.x - input.x,
        input.ringMesh.position.z - input.z,
        rotY
      );
    }

    const hitProxy = buildHitProxy(
      input.id,
      input.group,
      maxSpanX,
      maxSpanZ,
      input.hitProxyHeight
    );
    hitProxies.push(hitProxy);

    const record: SandboxBuildingRecord = {
      id: input.id,
      label: input.label,
      category: input.category,
      group: input.group,
      hitProxy,
      defaultX: input.x,
      defaultZ: input.z,
      defaultRotY: normalizeAngle(rotY),
      x: input.x,
      z: input.z,
      rotY: normalizeAngle(rotY),
      footprintW: Math.min(36, maxSpanX),
      footprintD: Math.min(36, maxSpanZ),
      colliderMetas,
      ringMesh: input.ringMesh,
      ringLocalOffset,
      customSpec: input.customSpec,
    };

    records.set(input.id, record);
  };

  const isRecordMoved = (rec: SandboxBuildingRecord): boolean => {
    if (rec.category === 'custom_house') return true;
    return (
      Math.hypot(rec.x - rec.defaultX, rec.z - rec.defaultZ) > 0.15 ||
      Math.abs(normalizeAngle(rec.rotY - rec.defaultRotY)) > 0.04
    );
  };

  const exportBuildingEntries = (): SandboxPlacementEntry[] => {
    const entries: SandboxPlacementEntry[] = [];
    records.forEach((rec) => {
      if (rec.category === 'custom_house' && rec.customSpec) {
        entries.push({
          id: rec.id,
          x: Math.round(rec.x * 100) / 100,
          z: Math.round(rec.z * 100) / 100,
          rotY: Math.round(rec.rotY * 1000) / 1000,
          customSpec: rec.customSpec,
        });
      } else if (isRecordMoved(rec)) {
        entries.push({
          id: rec.id,
          x: Math.round(rec.x * 100) / 100,
          z: Math.round(rec.z * 100) / 100,
          rotY: Math.round(rec.rotY * 1000) / 1000,
        });
      }
    });
    return entries;
  };

  const exportRoadOverrides = (): SandboxRoadOverrideEntry[] => {
    const out: SandboxRoadOverrideEntry[] = [];
    for (let i = 0; i < roadDefs.length; i++) {
      const r = roadDefs[i];
      const isCustom = customRoadIds.has(r.id);
      const def = isCustom ? null : getDefaultRoadDef(r.id);
      if (isCustom || !def || isRoadDefDifferent(r, def)) {
        out.push({
          id: r.id,
          name: r.name,
          surface: r.surface,
          width: Math.round(r.width * 10) / 10,
          hasCenterLine: r.hasCenterLine,
          hasSidewalk: r.hasSidewalk !== false,
          cornerRadius: Math.round((r.cornerRadius ?? 0) * 10) / 10,
          points: r.points.map(([px, pz]) => [
            Math.round(px * 100) / 100,
            Math.round(pz * 100) / 100,
          ]),
          isCustom: isCustom || undefined,
        });
      }
    }
    deletedDefaultRoadIds.forEach((id) => {
      const def = getDefaultRoadDef(id);
      if (def) {
        out.push({
          id: def.id,
          name: def.name,
          surface: def.surface,
          width: def.width,
          hasCenterLine: def.hasCenterLine,
          hasSidewalk: def.hasSidewalk !== false,
          cornerRadius: def.cornerRadius ?? 0,
          points: def.points,
          deleted: true,
        });
      }
    });
    return out;
  };

  const saveToStorage = () => {
    try {
      const buildings = exportBuildingEntries();
      const trees = foliageRef ? foliageRef.exportTreeOverrides() : [];
      const roads = exportRoadOverrides();

      if (buildings.length === 0 && trees.length === 0 && roads.length === 0) {
        localStorage.removeItem(SANDBOX_STORAGE_KEY_V2);
        localStorage.removeItem(SANDBOX_STORAGE_KEY_V1);
      } else {
        const payload: SandboxLayoutStorageV2 = {
          version: 2,
          buildings,
          trees,
          roads,
        };
        localStorage.setItem(SANDBOX_STORAGE_KEY_V2, JSON.stringify(payload));
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const spawnCustomHouseInternal = (
    spec: SandboxCustomHouseSpec,
    x: number,
    z: number,
    rotY = 0,
    forcedId?: string
  ): string | null => {
    if (!customHouseFactory) return null;
    const clampedX = THREE.MathUtils.clamp(x, -212, 186);
    const clampedZ = THREE.MathUtils.clamp(z, -130, 102);
    const id = forcedId ?? `custom_house_${Date.now().toString(36)}_${customHouseSeq++}`;

    const built = customHouseFactory(spec, clampedX, clampedZ, rotY);
    cityGroup.add(built.group);
    cityColliders.push(...built.colliders);

    registerBuilding({
      id,
      label: spec.label,
      category: 'custom_house',
      group: built.group,
      x: clampedX,
      z: clampedZ,
      rotY,
      colliders: built.colliders,
      footprintW: built.footprintW,
      footprintD: built.footprintD,
      hitProxyHeight: built.hitProxyHeight,
      customSpec: spec,
    });
    return id;
  };

  const removeCustomHouseInternal = (id: string): SandboxBuildingRecord | null => {
    const rec = records.get(id);
    if (!rec || rec.category !== 'custom_house') return null;

    cityGroup.remove(rec.group);
    const proxyIdx = hitProxies.indexOf(rec.hitProxy);
    if (proxyIdx >= 0) hitProxies.splice(proxyIdx, 1);

    for (const meta of rec.colliderMetas) {
      const cIdx = cityColliders.indexOf(meta.collider);
      if (cIdx >= 0) cityColliders.splice(cIdx, 1);
    }

    rec.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const geo = (obj as THREE.Mesh).geometry;
        if (geo && !geo.userData?.isSharedHumanGeo) {
          geo.dispose();
        }
      }
    });

    records.delete(id);
    if (selectedId === id) selectedId = null;
    if (hoveredId === id) hoveredId = null;
    return rec;
  };

  const applyBuildingEntries = (entries: unknown[]) => {
    for (const item of entries) {
      if (!item || typeof item !== 'object') continue;
      const entry = item as Partial<SandboxPlacementEntry>;
      if (
        typeof entry.id !== 'string' ||
        typeof entry.x !== 'number' ||
        typeof entry.z !== 'number' ||
        typeof entry.rotY !== 'number' ||
        !Number.isFinite(entry.x) ||
        !Number.isFinite(entry.z) ||
        !Number.isFinite(entry.rotY)
      ) {
        continue;
      }
      const existing = records.get(entry.id);
      if (existing) {
        applyTransform(existing, entry.x, entry.z, entry.rotY, 0);
      } else if (entry.customSpec && customHouseFactory) {
        spawnCustomHouseInternal(entry.customSpec, entry.x, entry.z, entry.rotY, entry.id);
      }
    }
  };

  const hydrateRoadOverrides = (entries: SandboxRoadOverrideEntry[]) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    roadDefs = getDefaultRoadDefs();
    deletedDefaultRoadIds.clear();
    customRoadIds.clear();

    let changed = false;
    for (const entry of entries) {
      if (!entry || typeof entry.id !== 'string') continue;
      if (entry.deleted) {
        const idx = roadDefs.findIndex((r) => r.id === entry.id);
        if (idx >= 0) {
          roadDefs.splice(idx, 1);
          deletedDefaultRoadIds.add(entry.id);
          changed = true;
        }
        continue;
      }

      if (!Array.isArray(entry.points) || entry.points.length < 2) continue;
      const cleanPts: [number, number][] = [];
      for (const p of entry.points) {
        if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
          cleanPts.push([
            THREE.MathUtils.clamp(p[0], -224, 198),
            THREE.MathUtils.clamp(p[1], -140, 112),
          ]);
        }
      }
      if (cleanPts.length < 2) continue;

      const surface = normalizeRoadSurface(entry.surface);
      const width = THREE.MathUtils.clamp(typeof entry.width === 'number' ? entry.width : 8.0, 4.0, 14.0);
      const hasCenterLine = Boolean(entry.hasCenterLine);
      const hasSidewalk =
        entry.hasSidewalk !== undefined
          ? Boolean(entry.hasSidewalk)
          : surface !== 'dirt' && surface !== 'gravel';
      const cornerRadius =
        typeof entry.cornerRadius === 'number' && Number.isFinite(entry.cornerRadius)
          ? Math.round(THREE.MathUtils.clamp(entry.cornerRadius, 0, 16) * 2) / 2
          : 0;
      const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : 'Yeni Yol';

      const existingIdx = roadDefs.findIndex((r) => r.id === entry.id);
      if (existingIdx >= 0) {
        roadDefs[existingIdx] = {
          id: entry.id,
          name,
          surface,
          width,
          hasCenterLine,
          hasSidewalk,
          cornerRadius,
          points: cleanPts,
        };
        changed = true;
      } else if (entry.isCustom) {
        roadDefs.push({
          id: entry.id,
          name,
          surface,
          width,
          hasCenterLine,
          hasSidewalk,
          cornerRadius,
          points: cleanPts,
        });
        customRoadIds.add(entry.id);
        changed = true;
      }
    }

    if (changed) {
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
    }
  };

  const hydrateFromStorage = () => {
    try {
      const rawV2 = localStorage.getItem(SANDBOX_STORAGE_KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2) as Partial<SandboxLayoutStorageV2>;
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.roads) && parsed.roads.length > 0) {
            hydrateRoadOverrides(parsed.roads);
          }
          if (Array.isArray(parsed.buildings)) {
            applyBuildingEntries(parsed.buildings);
          }
          if (Array.isArray(parsed.trees) && foliageRef) {
            foliageRef.hydrateTreeOverrides(parsed.trees);
          }
          return;
        }
      }

      // Legacy v1 fallback (buildings array only)
      const rawV1 = localStorage.getItem(SANDBOX_STORAGE_KEY_V1);
      if (!rawV1) return;
      const parsedV1 = JSON.parse(rawV1) as unknown;
      if (Array.isArray(parsedV1)) {
        applyBuildingEntries(parsedV1);
      }
    } catch {
      // Ignore malformed layout
    }
  };

  const toBuildingSummary = (rec: SandboxBuildingRecord): SandboxBuildingSummary => ({
    id: rec.id,
    label: rec.label,
    category: rec.category,
    x: Math.round(rec.x * 10) / 10,
    z: Math.round(rec.z * 10) / 10,
    rotY: rec.rotY,
    defaultX: rec.defaultX,
    defaultZ: rec.defaultZ,
    defaultRotY: rec.defaultRotY,
    isMoved: isRecordMoved(rec),
    isCustom: rec.category === 'custom_house',
  });

  const toTreeSummary = (slot: EditableTreeSlot): SandboxTreeSummary => {
    const moved =
      slot.isCustom ||
      Math.hypot(slot.x - slot.defaultX, slot.z - slot.defaultZ) > 0.12 ||
      Math.abs(normalizeAngle(slot.rotY - slot.defaultRotY)) > 0.04 ||
      Math.abs(slot.scale - slot.defaultScale) > 0.04;
    return {
      id: slot.id,
      kind: slot.kind,
      label: slot.label,
      x: Math.round(slot.x * 10) / 10,
      z: Math.round(slot.z * 10) / 10,
      rotY: slot.rotY,
      scale: Math.round(slot.scale * 100) / 100,
      isMoved: moved,
      isCustom: slot.isCustom,
    };
  };

  const toRoadSummary = (road: RoadSegmentDef): SandboxRoadSummary => {
    let sx = 0;
    let sz = 0;
    for (let i = 0; i < road.points.length; i++) {
      sx += road.points[i][0];
      sz += road.points[i][1];
    }
    const cx = sx / Math.max(1, road.points.length);
    const cz = sz / Math.max(1, road.points.length);
    const isCustom = customRoadIds.has(road.id);
    const def = isCustom ? null : getDefaultRoadDef(road.id);
    const isEdited = isCustom || (def ? isRoadDefDifferent(road, def) : true);
    return {
      id: road.id,
      name: road.name,
      surface: road.surface,
      width: Math.round(road.width * 10) / 10,
      hasCenterLine: road.hasCenterLine,
      hasSidewalk: road.hasSidewalk !== false,
      cornerRadius: Math.round((road.cornerRadius ?? 0) * 10) / 10,
      pointCount: road.points.length,
      centerX: Math.round(cx * 10) / 10,
      centerZ: Math.round(cz * 10) / 10,
      isEdited,
      isCustom,
    };
  };

  const getSnapshot = (): SandboxHudState => {
    const buildings: SandboxBuildingSummary[] = [];
    let movedCount = 0;
    let customCount = 0;

    records.forEach((rec) => {
      const summary = toBuildingSummary(rec);
      buildings.push(summary);
      if (summary.isCustom) customCount += 1;
      else if (summary.isMoved) movedCount += 1;
    });

    const catRank: Record<SandboxBuildingCategory, number> = {
      player_home: 0,
      landmark: 1,
      custom_house: 2,
      house: 3,
    };
    buildings.sort((a, b) => {
      if (catRank[a.category] !== catRank[b.category]) {
        return catRank[a.category] - catRank[b.category];
      }
      return a.label.localeCompare(b.label, 'tr');
    });

    // Tree stats
    let editedTreeCount = 0;
    let customTreeCount = 0;
    let deletedTreeCount = 0;
    if (foliageRef) {
      const overrides = foliageRef.exportTreeOverrides();
      for (let i = 0; i < overrides.length; i++) {
        const o = overrides[i];
        if (o.deleted) deletedTreeCount += 1;
        else if (o.isCustom) customTreeCount += 1;
        else editedTreeCount += 1;
      }
    }

    const selTreeSlot =
      selectedTreeId && foliageRef ? foliageRef.getTree(selectedTreeId) : null;
    const selectedTree =
      selTreeSlot && !selTreeSlot.deleted ? toTreeSummary(selTreeSlot) : null;

    // Road summaries & stats
    let editedRoadCount = deletedDefaultRoadIds.size;
    let customRoadCount = 0;
    const roads: SandboxRoadSummary[] = roadDefs.map((r) => {
      const sum = toRoadSummary(r);
      if (sum.isCustom) customRoadCount += 1;
      else if (sum.isEdited) editedRoadCount += 1;
      return sum;
    });
    roads.sort((a, b) => {
      if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1;
      return a.name.localeCompare(b.name, 'tr');
    });

    const selRoadDef = selectedRoadId
      ? roadDefs.find((r) => r.id === selectedRoadId)
      : undefined;

    const selBuildingRec = selectedId ? records.get(selectedId) : undefined;

    return {
      toolMode,
      selectedId,
      selectedBuilding: selBuildingRec ? toBuildingSummary(selBuildingRec) : null,
      selectedTreeId: selectedTree ? selectedTree.id : null,
      selectedTree,
      selectedRoadId: selRoadDef ? selRoadDef.id : null,
      selectedRoadNodeIndex: selRoadDef ? selectedRoadNodeIndex : null,
      selectedRoad: selRoadDef ? toRoadSummary(selRoadDef) : null,
      isDragging,
      onRoadWarning,
      gridSnap,
      autoRoundCorners,
      movedCount,
      customCount,
      editedTreeCount,
      customTreeCount,
      deletedTreeCount,
      editedRoadCount,
      customRoadCount,
      canUndo: undoStack.length > 0,
      buildings,
      roads,
    };
  };

  const cancelActiveDrag = () => {
    if (!isDragging) return;
    if (toolMode === 'buildings' && selectedId) {
      const rec = records.get(selectedId);
      if (rec) applyTransform(rec, rec.x, rec.z, rec.rotY, 0);
    } else if (toolMode === 'trees' && selectedTreeId && foliageRef) {
      const t = foliageRef.getTree(selectedTreeId);
      if (t) foliageRef.setTreeTransform(t.id, t.x, t.z, t.rotY, t.scale, 0);
    } else if (toolMode === 'roads' && roadDragPreSnapshot) {
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
    }
    isDragging = false;
    dragStartTransform = null;
    treeDragStart = null;
    roadDragPreSnapshot = null;
    roadDragMoved = false;
    onRoadWarning = false;
  };

  return {
    hitProxies,
    registerBuilding,
    setCustomHouseFactory(factory) {
      customHouseFactory = factory;
    },
    bindFoliage(foliage) {
      foliageRef = foliage;
    },
    bindRoadNetwork(roadNet) {
      roadNetworkRef = roadNet;
    },
    rebindBuildingGroup(id, nextGroup) {
      const rec = records.get(id);
      if (!rec) return;
      const oldProxyIdx = hitProxies.indexOf(rec.hitProxy);
      if (oldProxyIdx >= 0) hitProxies.splice(oldProxyIdx, 1);
      rec.hitProxy.geometry.dispose();

      rec.group = nextGroup;
      const gy = getTerrainHeightAt(rec.x, rec.z);
      nextGroup.position.set(rec.x, gy, rec.z);
      nextGroup.rotation.y = rec.rotY;

      rec.hitProxy = buildHitProxy(id, nextGroup, rec.footprintW, rec.footprintD);
      hitProxies.push(rec.hitProxy);
      syncAllGizmos();
    },
    getBuildingTransform(id) {
      const rec = records.get(id);
      if (!rec) return null;
      return { x: rec.x, z: rec.z, rotY: rec.rotY };
    },
    getLandmarkPosition(landmarkId) {
      const rec = records.get(`landmark:${landmarkId}`);
      if (!rec) return null;
      return [rec.x, rec.z];
    },
    hydrateFromStorage,
    saveToStorage,
    setSandboxActive(active) {
      sandboxActive = active;
      if (!active) {
        cancelActiveDrag();
        hoveredId = null;
        hoveredTreeId = null;
      }
      syncAllGizmos();
    },
    setToolMode(mode) {
      if (mode === toolMode) return;
      cancelActiveDrag();
      toolMode = mode;
      hoveredId = null;
      hoveredTreeId = null;
      syncAllGizmos();
    },
    getToolMode() {
      return toolMode;
    },

    // ==================== BUILDINGS ====================
    selectBuilding(id) {
      selectedId = id && records.has(id) ? id : null;
      onRoadWarning = false;
      syncAllGizmos();
    },
    setHoveredBuilding(id) {
      const next = id && records.has(id) ? id : null;
      if (next === hoveredId) return;
      hoveredId = next;
      syncAllGizmos();
    },
    beginDrag(id) {
      const rec = records.get(id);
      if (!rec) return;
      selectedId = id;
      isDragging = true;
      dragStartTransform = { id, x: rec.x, z: rec.z, rotY: rec.rotY };
      onRoadWarning = isRoadOverlap(rec.x, rec.z, rec.footprintW * 0.5, rec.footprintD * 0.5);
      applyTransform(rec, rec.x, rec.z, rec.rotY, 0.48);
      syncAllGizmos();
    },
    moveBuildingLive(id, x, z, rotY, liftY = 0.48) {
      const rec = records.get(id);
      if (!rec) return false;
      const targetX = gridSnap ? Math.round(x / 2) * 2 : x;
      const targetZ = gridSnap ? Math.round(z / 2) * 2 : z;
      applyTransform(rec, targetX, targetZ, rotY, liftY);
      onRoadWarning = isRoadOverlap(rec.x, rec.z, rec.footprintW * 0.5, rec.footprintD * 0.5);
      syncAllGizmos();
      return onRoadWarning;
    },
    endDrag(id) {
      const rec = records.get(id);
      isDragging = false;
      if (rec) {
        applyTransform(rec, rec.x, rec.z, rec.rotY, 0);
        if (
          dragStartTransform &&
          dragStartTransform.id === id &&
          (Math.hypot(rec.x - dragStartTransform.x, rec.z - dragStartTransform.z) > 0.05 ||
            Math.abs(normalizeAngle(rec.rotY - dragStartTransform.rotY)) > 0.01)
        ) {
          pushUndo({
            type: 'transform',
            id,
            prevX: dragStartTransform.x,
            prevZ: dragStartTransform.z,
            prevRotY: dragStartTransform.rotY,
          });
          saveToStorage();
        }
      }
      dragStartTransform = null;
      onRoadWarning = false;
      syncAllGizmos();
    },
    rotateSelected(deltaRad) {
      if (!selectedId) return;
      const rec = records.get(selectedId);
      if (!rec) return;
      pushUndo({
        type: 'transform',
        id: rec.id,
        prevX: rec.x,
        prevZ: rec.z,
        prevRotY: rec.rotY,
      });
      applyTransform(rec, rec.x, rec.z, rec.rotY + deltaRad, isDragging ? 0.48 : 0);
      saveToStorage();
      syncAllGizmos();
    },
    nudgeSelected(dx, dz) {
      if (!selectedId) return;
      const rec = records.get(selectedId);
      if (!rec) return;
      pushUndo({
        type: 'transform',
        id: rec.id,
        prevX: rec.x,
        prevZ: rec.z,
        prevRotY: rec.rotY,
      });
      applyTransform(rec, rec.x + dx, rec.z + dz, rec.rotY, 0);
      saveToStorage();
      syncAllGizmos();
    },
    spawnCustomHouse(spec, x, z, rotY = 0) {
      const tx = gridSnap ? Math.round(x / 2) * 2 : x;
      const tz = gridSnap ? Math.round(z / 2) * 2 : z;
      const id = spawnCustomHouseInternal(spec, tx, tz, rotY);
      if (!id) return null;
      pushUndo({ type: 'spawn', id });
      selectedId = id;
      saveToStorage();
      syncAllGizmos();
      return id;
    },
    deleteCustomHouse(id) {
      const rec = records.get(id);
      if (!rec || rec.category !== 'custom_house' || !rec.customSpec) return false;
      const snapshot = {
        id: rec.id,
        x: rec.x,
        z: rec.z,
        rotY: rec.rotY,
        spec: rec.customSpec,
      };
      const removed = removeCustomHouseInternal(id);
      if (!removed) return false;
      pushUndo({ type: 'delete', ...snapshot });
      saveToStorage();
      syncAllGizmos();
      return true;
    },
    resetBuilding(id) {
      const rec = records.get(id);
      if (!rec) return;
      if (rec.category === 'custom_house') {
        this.deleteCustomHouse(id);
        return;
      }
      if (!isRecordMoved(rec)) return;
      pushUndo({
        type: 'transform',
        id: rec.id,
        prevX: rec.x,
        prevZ: rec.z,
        prevRotY: rec.rotY,
      });
      applyTransform(rec, rec.defaultX, rec.defaultZ, rec.defaultRotY, 0);
      saveToStorage();
      syncAllGizmos();
    },
    getSelectedId() {
      return selectedId;
    },

    // ==================== TREES ====================
    getTreeRaycastTargets() {
      return foliageRef ? foliageRef.getTreeRaycastTargets() : [];
    },
    getTreeByInstance(kind, instanceId) {
      return foliageRef ? foliageRef.getTreeByInstance(kind, instanceId) : null;
    },
    getTreeTransform(id) {
      const t = foliageRef ? foliageRef.getTree(id) : null;
      if (!t || t.deleted) return null;
      return { x: t.x, z: t.z, rotY: t.rotY, scale: t.scale };
    },
    selectTree(id) {
      const slot = id && foliageRef ? foliageRef.getTree(id) : null;
      selectedTreeId = slot && !slot.deleted ? slot.id : null;
      onRoadWarning = false;
      syncAllGizmos();
    },
    setHoveredTree(id) {
      const slot = id && foliageRef ? foliageRef.getTree(id) : null;
      const next = slot && !slot.deleted ? slot.id : null;
      if (next === hoveredTreeId) return;
      hoveredTreeId = next;
      syncAllGizmos();
    },
    beginTreeDrag(id) {
      if (!foliageRef) return;
      const t = foliageRef.getTree(id);
      if (!t || t.deleted) return;
      selectedTreeId = id;
      isDragging = true;
      treeDragStart = { id, x: t.x, z: t.z, rotY: t.rotY, scale: t.scale };
      onRoadWarning = isRoadOverlap(t.x, t.z, 1.8, 1.8);
      foliageRef.setTreeTransform(id, t.x, t.z, t.rotY, t.scale, 0.42);
      syncAllGizmos();
    },
    moveTreeLive(id, x, z, liftY = 0.42) {
      if (!foliageRef) return false;
      const t = foliageRef.getTree(id);
      if (!t || t.deleted) return false;
      const tx = gridSnap ? Math.round(x / 2) * 2 : x;
      const tz = gridSnap ? Math.round(z / 2) * 2 : z;
      const updated = foliageRef.setTreeTransform(id, tx, tz, t.rotY, t.scale, liftY);
      if (!updated) return false;
      onRoadWarning = isRoadOverlap(updated.x, updated.z, 1.8, 1.8);
      syncAllGizmos();
      return onRoadWarning;
    },
    endTreeDrag(id) {
      isDragging = false;
      if (foliageRef) {
        const t = foliageRef.getTree(id);
        if (t && !t.deleted) {
          foliageRef.setTreeTransform(id, t.x, t.z, t.rotY, t.scale, 0);
          if (
            treeDragStart &&
            treeDragStart.id === id &&
            (Math.hypot(t.x - treeDragStart.x, t.z - treeDragStart.z) > 0.05 ||
              Math.abs(normalizeAngle(t.rotY - treeDragStart.rotY)) > 0.01 ||
              Math.abs(t.scale - treeDragStart.scale) > 0.01)
          ) {
            pushUndo({
              type: 'tree_transform',
              id,
              prevX: treeDragStart.x,
              prevZ: treeDragStart.z,
              prevRotY: treeDragStart.rotY,
              prevScale: treeDragStart.scale,
            });
            saveToStorage();
          }
        }
      }
      treeDragStart = null;
      onRoadWarning = false;
      syncAllGizmos();
    },
    rotateSelectedTree(deltaRad) {
      if (!foliageRef || !selectedTreeId) return;
      const t = foliageRef.getTree(selectedTreeId);
      if (!t || t.deleted) return;
      pushUndo({
        type: 'tree_transform',
        id: t.id,
        prevX: t.x,
        prevZ: t.z,
        prevRotY: t.rotY,
        prevScale: t.scale,
      });
      foliageRef.setTreeTransform(
        t.id,
        t.x,
        t.z,
        normalizeAngle(t.rotY + deltaRad),
        t.scale,
        isDragging ? 0.42 : 0
      );
      saveToStorage();
      syncAllGizmos();
    },
    scaleSelectedTree(deltaScale) {
      if (!foliageRef || !selectedTreeId) return;
      const t = foliageRef.getTree(selectedTreeId);
      if (!t || t.deleted) return;
      const nextScale = THREE.MathUtils.clamp(t.scale + deltaScale, 0.55, 2.2);
      if (Math.abs(nextScale - t.scale) < 0.005) return;
      pushUndo({
        type: 'tree_transform',
        id: t.id,
        prevX: t.x,
        prevZ: t.z,
        prevRotY: t.rotY,
        prevScale: t.scale,
      });
      foliageRef.setTreeTransform(t.id, t.x, t.z, t.rotY, nextScale, 0);
      saveToStorage();
      syncAllGizmos();
    },
    nudgeSelectedTree(dx, dz) {
      if (!foliageRef || !selectedTreeId) return;
      const t = foliageRef.getTree(selectedTreeId);
      if (!t || t.deleted) return;
      pushUndo({
        type: 'tree_transform',
        id: t.id,
        prevX: t.x,
        prevZ: t.z,
        prevRotY: t.rotY,
        prevScale: t.scale,
      });
      foliageRef.setTreeTransform(t.id, t.x + dx, t.z + dz, t.rotY, t.scale, 0);
      saveToStorage();
      syncAllGizmos();
    },
    spawnCustomTree(kind, x, z) {
      if (!foliageRef) return null;
      const tx = gridSnap ? Math.round(x / 2) * 2 : x;
      const tz = gridSnap ? Math.round(z / 2) * 2 : z;
      const created = foliageRef.spawnCustomTree(kind, tx, tz, 1.05, Math.random() * Math.PI * 2);
      if (!created) return null;
      selectedTreeId = created.id;
      pushUndo({ type: 'tree_spawn', id: created.id });
      saveToStorage();
      syncAllGizmos();
      return created.id;
    },
    deleteSelectedTree() {
      if (!foliageRef || !selectedTreeId) return false;
      const t = foliageRef.getTree(selectedTreeId);
      if (!t || t.deleted) return false;
      const ok = foliageRef.setTreeDeleted(t.id, true);
      if (!ok) return false;
      pushUndo({ type: 'tree_delete', id: t.id });
      selectedTreeId = null;
      hoveredTreeId = null;
      saveToStorage();
      syncAllGizmos();
      return true;
    },
    resetSelectedTree() {
      if (!foliageRef || !selectedTreeId) return;
      const t = foliageRef.getTree(selectedTreeId);
      if (!t || t.deleted) return;
      if (t.isCustom) {
        this.deleteSelectedTree();
        return;
      }
      pushUndo({
        type: 'tree_transform',
        id: t.id,
        prevX: t.x,
        prevZ: t.z,
        prevRotY: t.rotY,
        prevScale: t.scale,
      });
      foliageRef.resetTree(t.id);
      saveToStorage();
      syncAllGizmos();
    },
    getSelectedTreeId() {
      return selectedTreeId;
    },

    // ==================== ROADS ====================
    getRoadHandleTargets() {
      return roadHandleMeshes;
    },
    pickRoadAt(x, z) {
      const sample = sampleNearestRoad(x, z, 8.0);
      if (!sample.road) {
        selectedRoadId = null;
        selectedRoadNodeIndex = null;
        syncRoadVisuals();
        return null;
      }
      const road = roadDefs.find((r) => r.id === sample.road!.id);
      if (!road) return null;
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < road.points.length; i++) {
        const d = Math.hypot(x - road.points[i][0], z - road.points[i][1]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      selectedRoadId = road.id;
      selectedRoadNodeIndex = nearestIdx;
      syncRoadVisuals();
      return road.id;
    },
    selectRoad(id, nodeIndex = null) {
      if (!id) {
        selectedRoadId = null;
        selectedRoadNodeIndex = null;
        syncRoadVisuals();
        return;
      }
      const road = roadDefs.find((r) => r.id === id);
      if (!road) {
        selectedRoadId = null;
        selectedRoadNodeIndex = null;
        syncRoadVisuals();
        return;
      }
      selectedRoadId = road.id;
      selectedRoadNodeIndex =
        nodeIndex !== null && nodeIndex >= 0 && nodeIndex < road.points.length
          ? nodeIndex
          : 0;
      syncRoadVisuals();
    },
    getRoadCenter(id) {
      const road = roadDefs.find((r) => r.id === id);
      if (!road || road.points.length === 0) return null;
      let sx = 0;
      let sz = 0;
      for (let i = 0; i < road.points.length; i++) {
        sx += road.points[i][0];
        sz += road.points[i][1];
      }
      return [sx / road.points.length, sz / road.points.length];
    },
    getRoadNodePosition(roadId, nodeIndex) {
      const road = roadDefs.find((r) => r.id === roadId);
      if (!road || nodeIndex < 0 || nodeIndex >= road.points.length) return null;
      return [road.points[nodeIndex][0], road.points[nodeIndex][1]];
    },
    beginRoadNodeDrag(roadId, nodeIndex) {
      const road = roadDefs.find((r) => r.id === roadId);
      if (!road || nodeIndex < 0 || nodeIndex >= road.points.length) return false;
      roadDragPreSnapshot = captureRoadSnapshot();
      roadDragMoved = false;
      selectedRoadId = roadId;
      selectedRoadNodeIndex = nodeIndex;
      isDragging = true;
      lastRoadRebuildMs = performance.now();
      syncRoadVisuals();
      return true;
    },
    insertRoadNodeAndBeginDrag(roadId, afterIndex) {
      const road = roadDefs.find((r) => r.id === roadId);
      if (!road || afterIndex < 0 || afterIndex >= road.points.length - 1) return null;
      roadDragPreSnapshot = captureRoadSnapshot();
      roadDragMoved = true;

      const [ax, az] = road.points[afterIndex];
      const [bx, bz] = road.points[afterIndex + 1];
      const newPt: [number, number] = [(ax + bx) * 0.5, (az + bz) * 0.5];
      const insertedIdx = afterIndex + 1;
      road.points.splice(insertedIdx, 0, newPt);
      if (autoRoundCorners && (road.cornerRadius ?? 0) < 0.5) {
        road.cornerRadius = 6;
      }

      selectedRoadId = roadId;
      selectedRoadNodeIndex = insertedIdx;
      isDragging = true;
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      lastRoadRebuildMs = performance.now();
      syncRoadVisuals();
      return insertedIdx;
    },
    moveRoadNodeLive(roadId, nodeIndex, x, z) {
      const road = roadDefs.find((r) => r.id === roadId);
      if (!road || nodeIndex < 0 || nodeIndex >= road.points.length) return;
      const cx = THREE.MathUtils.clamp(gridSnap ? Math.round(x / 2) * 2 : x, -220, 194);
      const cz = THREE.MathUtils.clamp(gridSnap ? Math.round(z / 2) * 2 : z, -138, 110);
      if (
        Math.abs(cx - road.points[nodeIndex][0]) < 0.02 &&
        Math.abs(cz - road.points[nodeIndex][1]) < 0.02
      ) {
        return;
      }
      road.points[nodeIndex][0] = cx;
      road.points[nodeIndex][1] = cz;
      if (
        autoRoundCorners &&
        road.points.length >= 3 &&
        nodeIndex > 0 &&
        nodeIndex < road.points.length - 1 &&
        (road.cornerRadius ?? 0) < 0.5
      ) {
        road.cornerRadius = 6;
      }
      roadDragMoved = true;
      setLiveRoadSegments(roadDefs);
      syncRoadVisuals();

      const now = performance.now();
      if (now - lastRoadRebuildMs >= 95) {
        lastRoadRebuildMs = now;
        roadNetworkRef?.rebuild();
      }
    },
    endRoadNodeDrag() {
      isDragging = false;
      if (roadDragMoved && roadDragPreSnapshot) {
        setLiveRoadSegments(roadDefs);
        roadNetworkRef?.rebuild();
        pushUndo({ type: 'road_snapshot', prev: roadDragPreSnapshot });
        saveToStorage();
      }
      roadDragPreSnapshot = null;
      roadDragMoved = false;
      syncRoadVisuals();
    },
    appendRoadNode() {
      if (!selectedRoadId) return false;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road || road.points.length < 2) return false;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });

      const n = road.points.length;
      const [px, pz] = road.points[n - 2];
      const [lx, lz] = road.points[n - 1];
      const dx = lx - px;
      const dz = lz - pz;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      const nx = THREE.MathUtils.clamp(lx + (dx / len) * 16, -218, 192);
      const nz = THREE.MathUtils.clamp(lz + (dz / len) * 16, -136, 108);
      road.points.push([Math.round(nx * 10) / 10, Math.round(nz * 10) / 10]);
      if (autoRoundCorners && road.points.length >= 3 && (road.cornerRadius ?? 0) < 0.5) {
        road.cornerRadius = 6;
      }
      selectedRoadNodeIndex = road.points.length - 1;

      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
      return true;
    },
    deleteSelectedRoadNode() {
      if (!selectedRoadId) return false;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road || road.points.length <= 2) return false;
      const idx =
        selectedRoadNodeIndex !== null &&
        selectedRoadNodeIndex >= 0 &&
        selectedRoadNodeIndex < road.points.length
          ? selectedRoadNodeIndex
          : road.points.length - 1;

      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      road.points.splice(idx, 1);
      selectedRoadNodeIndex = Math.min(idx, road.points.length - 1);

      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
      return true;
    },
    adjustSelectedRoadWidth(delta) {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road) return;
      const nextW = Math.round(THREE.MathUtils.clamp(road.width + delta, 4.0, 14.0) * 10) / 10;
      if (Math.abs(nextW - road.width) < 0.05) return;

      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      road.width = nextW;
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    setSelectedRoadSurface(surface) {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road || road.surface === surface) return;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      road.surface = surface;
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    toggleSelectedRoadSurface() {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road) return;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      const idx = ROAD_SURFACE_ORDER.indexOf(road.surface);
      road.surface = ROAD_SURFACE_ORDER[(idx + 1) % ROAD_SURFACE_ORDER.length];
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    toggleSelectedRoadCenterLine() {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road) return;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      road.hasCenterLine = !road.hasCenterLine;
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    toggleSelectedRoadSidewalk() {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road) return;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      road.hasSidewalk = !(road.hasSidewalk !== false);
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    setSelectedRoadCornerRadius(radius) {
      if (!selectedRoadId) return;
      const road = roadDefs.find((r) => r.id === selectedRoadId);
      if (!road) return;
      const nextR = Math.round(THREE.MathUtils.clamp(radius, 0, 16) * 2) / 2;
      if (Math.abs(nextR - (road.cornerRadius ?? 0)) < 0.05) return;

      const now = performance.now();
      if (now - lastCornerUndoMs > 700 || lastCornerUndoRoadId !== road.id) {
        pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
        lastCornerUndoRoadId = road.id;
      }
      lastCornerUndoMs = now;

      road.cornerRadius = nextR;
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    setAutoRoundCorners(enabled) {
      autoRoundCorners = enabled;
    },
    isAutoRoundCorners() {
      return autoRoundCorners;
    },
    spawnCustomRoad(spec, x, z) {
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      const cx = THREE.MathUtils.clamp(gridSnap ? Math.round(x / 2) * 2 : x, -200, 175);
      const cz = THREE.MathUtils.clamp(gridSnap ? Math.round(z / 2) * 2 : z, -124, 96);
      const halfL = Math.max(10, spec.length * 0.5);
      const id = `custom_road_${Date.now().toString(36)}_${customRoadSeq++}`;
      const newRoad: RoadSegmentDef = {
        id,
        name: `${spec.name} #${customRoadSeq - 1}`,
        surface: spec.surface,
        width: spec.width,
        hasCenterLine: spec.hasCenterLine,
        hasSidewalk:
          spec.hasSidewalk ?? (spec.surface !== 'dirt' && spec.surface !== 'gravel'),
        cornerRadius: spec.cornerRadius ?? (autoRoundCorners ? 6 : 0),
        points: [
          [THREE.MathUtils.clamp(cx - halfL, -218, 192), cz],
          [cx, cz],
          [THREE.MathUtils.clamp(cx + halfL, -218, 192), cz],
        ],
      };
      roadDefs.push(newRoad);
      customRoadIds.add(id);
      selectedRoadId = id;
      selectedRoadNodeIndex = 1;

      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
      return id;
    },
    deleteSelectedRoad() {
      if (!selectedRoadId) return false;
      const idx = roadDefs.findIndex((r) => r.id === selectedRoadId);
      if (idx < 0) return false;
      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      const removed = roadDefs[idx];
      roadDefs.splice(idx, 1);
      if (customRoadIds.has(removed.id)) {
        customRoadIds.delete(removed.id);
      } else {
        deletedDefaultRoadIds.add(removed.id);
      }
      selectedRoadId = null;
      selectedRoadNodeIndex = null;

      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
      return true;
    },
    resetSelectedRoad() {
      if (!selectedRoadId) return;
      if (customRoadIds.has(selectedRoadId)) {
        this.deleteSelectedRoad();
        return;
      }
      const def = getDefaultRoadDef(selectedRoadId);
      const idx = roadDefs.findIndex((r) => r.id === selectedRoadId);
      if (!def || idx < 0) return;
      if (!isRoadDefDifferent(roadDefs[idx], def)) return;

      pushUndo({ type: 'road_snapshot', prev: captureRoadSnapshot() });
      roadDefs[idx] = def;
      selectedRoadNodeIndex = 0;

      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();
      saveToStorage();
      syncRoadVisuals();
    },
    getSelectedRoadId() {
      return selectedRoadId;
    },

    // ==================== GLOBAL ====================
    resetAll() {
      const prevBuildings = exportBuildingEntries();
      const prevTrees = foliageRef ? foliageRef.exportTreeOverrides() : [];
      const prevRoads = captureRoadSnapshot();
      const roadOverrides = exportRoadOverrides();

      if (prevBuildings.length === 0 && prevTrees.length === 0 && roadOverrides.length === 0) {
        return;
      }

      pushUndo({
        type: 'reset_all',
        prevBuildings,
        prevTrees,
        prevRoads,
      });

      // Reset Buildings
      const customIds: string[] = [];
      records.forEach((rec) => {
        if (rec.category === 'custom_house') {
          customIds.push(rec.id);
        } else if (isRecordMoved(rec)) {
          applyTransform(rec, rec.defaultX, rec.defaultZ, rec.defaultRotY, 0);
        }
      });
      for (const cid of customIds) {
        removeCustomHouseInternal(cid);
      }

      // Reset Trees
      foliageRef?.resetAllTrees();

      // Reset Roads
      roadDefs = getDefaultRoadDefs();
      deletedDefaultRoadIds.clear();
      customRoadIds.clear();
      setLiveRoadSegments(roadDefs);
      roadNetworkRef?.rebuild();

      selectedId = null;
      selectedTreeId = null;
      selectedRoadId = null;
      selectedRoadNodeIndex = null;
      isDragging = false;
      onRoadWarning = false;
      saveToStorage();
      syncAllGizmos();
    },
    undo() {
      const action = undoStack.pop();
      if (!action) return false;

      if (action.type === 'transform') {
        const rec = records.get(action.id);
        if (rec) {
          applyTransform(rec, action.prevX, action.prevZ, action.prevRotY, 0);
          selectedId = rec.id;
        }
      } else if (action.type === 'spawn') {
        removeCustomHouseInternal(action.id);
      } else if (action.type === 'delete') {
        const restoredId = spawnCustomHouseInternal(
          action.spec,
          action.x,
          action.z,
          action.rotY,
          action.id
        );
        if (restoredId) selectedId = restoredId;
      } else if (action.type === 'tree_transform') {
        if (foliageRef) {
          foliageRef.setTreeTransform(
            action.id,
            action.prevX,
            action.prevZ,
            action.prevRotY,
            action.prevScale,
            0
          );
          selectedTreeId = action.id;
        }
      } else if (action.type === 'tree_spawn') {
        if (foliageRef) {
          foliageRef.setTreeDeleted(action.id, true);
          if (selectedTreeId === action.id) selectedTreeId = null;
        }
      } else if (action.type === 'tree_delete') {
        if (foliageRef) {
          foliageRef.setTreeDeleted(action.id, false);
          selectedTreeId = action.id;
        }
      } else if (action.type === 'road_snapshot') {
        restoreRoadSnapshot(action.prev);
      } else if (action.type === 'reset_all') {
        for (const entry of action.prevBuildings) {
          const existing = records.get(entry.id);
          if (existing) {
            applyTransform(existing, entry.x, entry.z, entry.rotY, 0);
          } else if (entry.customSpec) {
            spawnCustomHouseInternal(entry.customSpec, entry.x, entry.z, entry.rotY, entry.id);
          }
        }
        if (foliageRef && action.prevTrees.length > 0) {
          foliageRef.hydrateTreeOverrides(action.prevTrees);
        }
        restoreRoadSnapshot(action.prevRoads);
      }

      saveToStorage();
      syncAllGizmos();
      return true;
    },
    setGridSnap(enabled) {
      gridSnap = enabled;
    },
    isGridSnap() {
      return gridSnap;
    },
    getSnapshot,
    updateVisuals(elapsed) {
      if (!sandboxActive) return;
      if (selectionGizmo.root.visible) {
        const pulse = 1 + Math.sin(elapsed * 4.2) * 0.012;
        selectionGizmo.outlineLine.scale.y = 1;
        selectionGizmo.arrowMesh.scale.setScalar(pulse);
      }
      if (treeSelectionGizmo.root.visible) {
        const pulse = 1 + Math.sin(elapsed * 4.0) * 0.035;
        treeSelectionGizmo.ringMesh.scale.y = 1;
        treeSelectionGizmo.root.scale.set(pulse, 1, pulse);
      }
    },
    dispose() {
      selectionGizmo.dispose();
      hoverGizmo.dispose();
      treeSelectionGizmo.dispose();
      treeHoverGizmo.dispose();
      clearRoadVisuals();
      roadGuideMat.dispose();
      roadSelectedLineMat.dispose();
      roadControlCageMat.dispose();
      vertexHandleGeo.dispose();
      midpointHandleGeo.dispose();
      vertexNormalMat.dispose();
      vertexActiveMat.dispose();
      midpointMat.dispose();
      proxyMaterial.dispose();
      hitProxies.forEach((p) => p.geometry.dispose());
      hitProxies.length = 0;
      records.clear();
    },
  };
}
