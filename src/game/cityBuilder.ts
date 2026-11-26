import * as THREE from 'three';
import { DEFAULT_HOUSE_EXTERIOR, LANDMARKS } from '../data/efelerData';
import { ColliderBox, HouseExteriorConfig } from '../types/game';
import { BuildingNpcSystem, createBuildingNpcSystem } from './cityNpcs';
import {
  createBeyCamiiLokmaStand,
  createLibraryAndVendor,
  createParkGuitarYouthGroup,
  createStreetMusiciansZeybek,
  LibraryVendorRig,
  LokmaStandRig,
  ParkGuitarYouthRig,
  StreetMusiciansRig,
} from './interactions3d';
import { buildAllLandmarks, BuiltLandmark } from './landmarks';
import {
  AmbientTrafficSystem,
  buildAncientCitiesSignposts,
  createAmbientTrafficSystem,
  createLivingFigTree,
  createPedestrianSystem,
  createSteamTrainSystem,
  createTrafficLightSystem,
  LivingFigTree,
  PedestrianSystem,
  SteamTrainSystem,
  TrafficLightSystem,
} from './livingWorld';
import { CityMaterialLibrary } from './materials';
import { mergeStaticGroupMeshes } from './meshMerge';
import { PerchSystem } from './perchSystem';
import { buildMainRoadSignposts } from './roadSignposts';
import { createSandboxManager, SandboxManager } from './sandboxManager';
import { SeasonalAtmosphereState, SeasonalFoliageSystem } from './seasonalFoliage';
import { buildNeighborhoodsAndProps } from './world/neighborhoodsAndProps';
import { buildRoadNetwork } from './world/roadNetwork';
import { buildTerrainAndStream } from './world/terrainAndStream';

export interface BuiltCity {
  group: THREE.Group;
  landmarks: BuiltLandmark[];
  colliders: ColliderBox[];
  sandbox: SandboxManager;
  figTree: LivingFigTree;
  pedestrians: PedestrianSystem;
  trafficLights: TrafficLightSystem;
  steamTrain: SteamTrainSystem;
  ambientTraffic: AmbientTrafficSystem;
  musicians: StreetMusiciansRig;
  libraryVendor: LibraryVendorRig;
  lokmaStand: LokmaStandRig;
  parkGuitarBand: ParkGuitarYouthRig;
  buildingNpcs: BuildingNpcSystem;
  foliage: SeasonalFoliageSystem;
  homeRingMesh: THREE.Mesh;
  interactiveClickables: THREE.Object3D[];
  perches: PerchSystem;
  crumbSpots: Array<[number, number, number]>;
  updatePlayerHomeExterior: (config: HouseExteriorConfig) => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
  updateAtmosphere: (dt: number, elapsed: number, state: SeasonalAtmosphereState) => void;
  dispose: () => void;
}

export function buildEfelerCity(
  mats: CityMaterialLibrary,
  initialHouseExterior: HouseExteriorConfig = DEFAULT_HOUSE_EXTERIOR
): BuiltCity {
  const group = new THREE.Group();
  const staticWorldGroup = new THREE.Group();
  group.add(staticWorldGroup);
  const colliders: ColliderBox[] = [];
  const perches = new PerchSystem();
  const crumbSpots: Array<[number, number, number]> = [];
  const localDisposables: { dispose: () => void }[] = [];

  // 1–4. Sculpted Horizon Terrain, Mountains, Countryside Fields, Urban Turf & Tabakhane Deresi
  const { terrainMat, blockTurfMat, hillMat, updateStreamProps } = buildTerrainAndStream({
    group,
    staticWorldGroup,
    mats,
    colliders,
    perches,
    localDisposables,
  });

  // 5. Seam-Clipped Polyline Road Network, Curbs, Sidewalks & Crosswalks (dynamic for Sandbox editing)
  const roadNetwork = buildRoadNetwork({
    group,
    mats,
    localDisposables,
  });

  const sandbox = createSandboxManager(group, colliders);
  sandbox.bindRoadNetwork(roadNetwork);

  // 6. Authentic Historical & Modern Efeler Landmarks
  const landmarks = buildAllLandmarks(LANDMARKS, mats);
  landmarks.forEach((lm) => {
    group.add(lm.group);
    group.add(lm.ringMesh);
    colliders.push(...lm.colliders);
    sandbox.registerBuilding({
      id: `landmark:${lm.def.id}`,
      label: lm.def.name,
      category: 'landmark',
      group: lm.group,
      x: lm.def.position[0],
      z: lm.def.position[2],
      rotY: lm.group.rotation.y,
      colliders: lm.colliders,
      ringMesh: lm.ringMesh,
    });
  });

  // 7. Living World Additions: Fig Tree, Pedestrians, Traffic Lights, Steam Train, Ambient Traffic & Signposts
  const figTree = createLivingFigTree(mats);
  group.add(figTree.group);
  const figTreeCollider: ColliderBox = { minX: -2.7, maxX: 2.7, minZ: 17.1, maxZ: 22.5 };
  colliders.push(figTreeCollider);
  sandbox.registerBuilding({
    id: 'landmark:fig_tree',
    label: 'Atatürk Meydanı İncir Ağacı',
    category: 'landmark',
    group: figTree.group,
    x: 0,
    z: 19.8,
    rotY: 0,
    colliders: [figTreeCollider],
    footprintW: 5.8,
    footprintD: 5.8,
  });

  const pedestrians = createPedestrianSystem();
  group.add(pedestrians.group);

  const trafficLights = createTrafficLightSystem(mats);
  group.add(trafficLights.group);

  const steamTrain = createSteamTrainSystem(mats);
  group.add(steamTrain.group);

  const ambientTraffic = createAmbientTrafficSystem(mats);
  group.add(ambientTraffic.group);

  const signposts = buildAncientCitiesSignposts(mats, colliders);
  group.add(signposts);

  const mainRoadSignposts = buildMainRoadSignposts(mats, colliders, perches);
  group.add(mainRoadSignposts.group);
  localDisposables.push(mainRoadSignposts);

  const musicians = createStreetMusiciansZeybek(mats);
  group.add(musicians.group);

  const libraryVendor = createLibraryAndVendor(mats, colliders);
  group.add(libraryVendor.group);

  const lokmaStand = createBeyCamiiLokmaStand(mats, colliders);
  group.add(lokmaStand.group);

  const parkGuitarBand = createParkGuitarYouthGroup(mats, colliders);
  group.add(parkGuitarBand.group);

  const buildingNpcs = createBuildingNpcSystem(mats, colliders);
  group.add(buildingNpcs.group);

  // 8–10. Neighborhood Houses, Player Villa, Seasonal Foliage, Lamps & Dynamic Sky Props
  const neighborhoods = buildNeighborhoodsAndProps({
    group,
    staticWorldGroup,
    mats,
    colliders,
    perches,
    crumbSpots,
    initialHouseExterior,
    localDisposables,
    sandbox,
  });

  // Bind editable foliage & restore any user-arranged sandbox buildings, trees, and roads
  sandbox.bindFoliage(neighborhoods.foliage);
  sandbox.hydrateFromStorage();

  mergeStaticGroupMeshes(staticWorldGroup);

  const interactiveClickables: THREE.Object3D[] = [
    musicians.clickTarget,
    libraryVendor.clickTarget,
    lokmaStand.clickTarget,
    parkGuitarBand.clickTarget,
    ...buildingNpcs.clickTargets,
  ];

  const _snowSurfaceTint = new THREE.Color(0xeef5fc);
  const _whiteTint = new THREE.Color(0xffffff);
  const _autumnGrassTint = new THREE.Color(0xd2b574);
  const _springGrassTint = new THREE.Color(0xf0fae4);
  const _terracottaSnowTint = new THREE.Color(0xeae6e1);
  const _slateSnowTint = new THREE.Color(0xcbd9e6);
  const _blueSnowTint = new THREE.Color(0xc2d8e8);
  const _turfSummer = new THREE.Color(0x91a85c);
  const _turfAutumn = new THREE.Color(0xb69c58);
  const _turfSpring = new THREE.Color(0x93b662);
  const _turfWinter = new THREE.Color(0xdfe8ef);
  const _yardSummer = new THREE.Color(0x88a454);
  const _yardAutumn = new THREE.Color(0xb09450);
  const _yardSpring = new THREE.Color(0x8cb45c);
  const _mountainBaseTint = new THREE.Color(0xffffff);
  const _mountainAutumnTint = new THREE.Color(0xdec08a);
  const _mountainWinterTint = new THREE.Color(0xeef5fc);
  const _blossomSpring = new THREE.Color(0xf49ebb);
  const _blossomSummer = new THREE.Color(0xd9614a);
  const _blossomAutumn = new THREE.Color(0xe59732);
  const _blossomWinter = new THREE.Color(0xeef4f8);
  const _targetColor = new THREE.Color();

  return {
    group,
    landmarks,
    colliders,
    sandbox,
    figTree,
    pedestrians,
    trafficLights,
    steamTrain,
    ambientTraffic,
    musicians,
    libraryVendor,
    lokmaStand,
    parkGuitarBand,
    buildingNpcs,
    foliage: neighborhoods.foliage,
    homeRingMesh: neighborhoods.homeRingMesh,
    interactiveClickables,
    perches,
    crumbSpots,
    updatePlayerHomeExterior: neighborhoods.updatePlayerHomeExterior,
    update: (dt: number, elapsed: number, focusX = 0, focusZ = 0) => {
      steamTrain.update(dt, elapsed);
      ambientTraffic.update(dt, elapsed, focusX, focusZ);
      updateStreamProps(dt, elapsed, focusX, focusZ);
      neighborhoods.updateDynamicProps(dt, elapsed);
    },
    updateAtmosphere: (() => {
      let lastAtmosKey = '';
      let atmosSettleTimer = 4.0;
      return (dt: number, elapsed: number, state: SeasonalAtmosphereState) => {
        neighborhoods.foliage.update(dt, elapsed, state);

        const atmosKey = `${state.season}|${Math.round(state.frostFactor * 40)}|${Math.round(state.wetFactor * 40)}`;
        if (atmosKey !== lastAtmosKey) {
          lastAtmosKey = atmosKey;
          atmosSettleTimer = 3.5;
        } else {
          atmosSettleTimer = Math.max(0, atmosSettleTimer - dt);
        }

        if (atmosSettleTimer <= 0) return;

        const lerpRate = Math.min(1, dt * 1.4);
        const snowTintT = THREE.MathUtils.clamp(
          Math.max(state.season === 'winter' ? 0.65 : 0, state.frostFactor),
          0,
          1
        );

        _targetColor
          .copy(state.season === 'spring' ? _springGrassTint : state.season === 'autumn' ? _autumnGrassTint : _whiteTint)
          .lerp(_snowSurfaceTint, snowTintT * 0.85);
        terrainMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'spring' ? _turfSpring : state.season === 'autumn' ? _turfAutumn : _turfSummer)
          .lerp(_turfWinter, snowTintT * 0.86);
        blockTurfMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'spring' ? _yardSpring : state.season === 'autumn' ? _yardAutumn : _yardSummer)
          .lerp(_turfWinter, snowTintT * 0.88);
        neighborhoods.yardLawnMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'autumn' ? _mountainAutumnTint : _mountainBaseTint)
          .lerp(_mountainWinterTint, snowTintT * 0.88);
        hillMat.color.lerp(_targetColor, lerpRate);

        _targetColor.copy(
          state.season === 'spring'
            ? _blossomSpring
            : state.season === 'autumn'
              ? _blossomAutumn
              : state.season === 'winter'
                ? _blossomWinter
                : _blossomSummer
        );
        if (state.frostFactor > 0.1) _targetColor.lerp(_blossomWinter, state.frostFactor * 0.7);
        neighborhoods.blossomMat.color.lerp(_targetColor, lerpRate);

        _targetColor.copy(_whiteTint).lerp(_terracottaSnowTint, snowTintT * 0.68);
        mats.terracottaRoof.color.lerp(_targetColor, lerpRate);
        _targetColor.copy(_whiteTint).lerp(_slateSnowTint, snowTintT * 0.65);
        mats.slateRoof.color.lerp(_targetColor, lerpRate);
        _targetColor.copy(_whiteTint).lerp(_blueSnowTint, snowTintT * 0.65);
        mats.aegeanBlueRoof.color.lerp(_targetColor, lerpRate);

        const wetGlossDrop = state.wetFactor * 0.34;
        mats.terracottaRoof.roughness = THREE.MathUtils.damp(
          mats.terracottaRoof.roughness,
          0.74 - wetGlossDrop,
          2.5,
          dt
        );
        mats.slateRoof.roughness = THREE.MathUtils.damp(
          mats.slateRoof.roughness,
          0.66 - wetGlossDrop,
          2.5,
          dt
        );
        mats.aegeanBlueRoof.roughness = THREE.MathUtils.damp(
          mats.aegeanBlueRoof.roughness,
          0.62 - wetGlossDrop,
          2.5,
          dt
        );
        mats.asphalt.roughness = THREE.MathUtils.damp(
          mats.asphalt.roughness,
          0.88 - state.wetFactor * 0.42,
          2.5,
          dt
        );
        mats.cobble.roughness = THREE.MathUtils.damp(
          mats.cobble.roughness,
          0.84 - state.wetFactor * 0.36,
          2.5,
          dt
        );
        mats.dirtRoad.roughness = THREE.MathUtils.damp(
          mats.dirtRoad.roughness,
          0.94 - state.wetFactor * 0.24,
          2.5,
          dt
        );
        mats.gravelRoad.roughness = THREE.MathUtils.damp(
          mats.gravelRoad.roughness,
          0.9 - state.wetFactor * 0.28,
          2.5,
          dt
        );
        mats.brickRoad.roughness = THREE.MathUtils.damp(
          mats.brickRoad.roughness,
          0.82 - state.wetFactor * 0.35,
          2.5,
          dt
        );
        mats.sidewalk.roughness = THREE.MathUtils.damp(
          mats.sidewalk.roughness,
          0.84 - state.wetFactor * 0.32,
          2.5,
          dt
        );
      };
    })(),
    dispose: () => {
      sandbox.dispose();
      roadNetwork.dispose();
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const geo = (obj as THREE.Mesh).geometry;
          if (!geo.userData?.isSharedHumanGeo) {
            geo.dispose();
          }
        }
      });
      neighborhoods.dispose();
      localDisposables.forEach((d) => d.dispose());
    },
  };
}
