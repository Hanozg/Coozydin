import { memo, useEffect, useState } from 'react';
import {
  getRadioStationForDistrict,
  LANDMARKS,
  RADIO_STATIONS,
} from '../data/efelerData';
import { CameraPreset, VehicleType } from '../types/game';
import { BottomControlDock } from './hud/BottomControlDock';
import { HudDrawers } from './hud/HudDrawers';
import { GameHUDProps, HudDrawerType, MobileDockTab } from './hud/hudTypes';
import { NearbyInteractionBar } from './hud/NearbyInteractionBar';
import { TopTelemetryBar } from './hud/TopTelemetryBar';

export const GameHUD = memo(function GameHUD({
  hud,
  explorationMode,
  vehicleConfig,
  houseExterior,
  profileName,
  profileEmoji,
  isCloudSignedIn,
  timeOfDay,
  season,
  weather,
  autoAtmosphere,
  lofiTrack,
  autoDistrictRadio,
  cameraPreset,
  discoveredIds,
  coins,
  lokmaPower,
  activeErrand,
  errandPickedUp,
  recentlyDiscovered,
  errandToast,
  isMuted,
  musicEnabled,
  voiceGuideLandmark,
  voiceGuideLoading = false,
  onChangeExplorationMode,
  onChangeVehicleConfig,
  onChangeHouseExterior,
  onChangeTimeOfDay,
  onChangeSeason,
  onChangeWeather,
  onToggleAutoAtmosphere,
  onChangeLofiTrack,
  onToggleAutoDistrictRadio,
  onChangeCameraPreset,
  onInteractNpc,
  onToggleMute,
  onToggleMusic,
  onToggleVoiceGuide,
  onStopVoiceGuide,
  onOpenJournal,
  onOpenRealMap,
  onJumpToLandmark,
  onOpenProfile,
  onOpenAbout,
  onEnterHome,
  onPause,
  onDiscoverNearby,
  onHorn,
  onChirp,
  onTouchInput,
  onAdjustZoom,
}: GameHUDProps) {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, height: 800, coarse: false };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      coarse: window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
    };
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        coarse: window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
      });
    };
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const isCompactLandscape = viewport.width > viewport.height && viewport.height <= 540;
  const isCompactViewport = viewport.coarse || isCompactLandscape || viewport.width < 768;

  const [dockCollapsed, setDockCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    return coarse || window.innerHeight <= 540 || window.innerWidth < 768;
  });
  const [activeDrawer, setActiveDrawer] = useState<HudDrawerType>('none');
  const [mobileDockTab, setMobileDockTab] = useState<MobileDockTab>('move');
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });

  useEffect(() => {
    if (isCompactLandscape) {
      setDockCollapsed(true);
    }
  }, [isCompactLandscape]);

  const nearbyIsUndiscovered = Boolean(
    hud.nearbyLandmark && !discoveredIds.includes(hud.nearbyLandmark.id)
  );

  const nearbyIsErrandPoint = Boolean(
    hud.nearbyLandmark &&
      activeErrand &&
      (errandPickedUp
        ? activeErrand.toLandmarkId === hud.nearbyLandmark.id
        : activeErrand.fromLandmarkId === hud.nearbyLandmark.id)
  );

  const setVehicleType = (type: VehicleType) => {
    onChangeVehicleConfig({ ...vehicleConfig, type });
    if (explorationMode !== 'vehicle') {
      onChangeExplorationMode('vehicle');
    }
  };

  const cycleCameraPreset = () => {
    const order: CameraPreset[] = ['isometric', 'perspective', 'first_person'];
    const idx = order.indexOf(cameraPreset);
    onChangeCameraPreset(order[(idx + 1) % order.length]);
  };

  const errandTargetName = activeErrand
    ? LANDMARKS.find(
        (l) =>
          l.id ===
          (errandPickedUp ? activeErrand.toLandmarkId : activeErrand.fromLandmarkId)
      )?.name ?? null
    : null;

  const currentStation =
    RADIO_STATIONS.find((s) => s.id === lofiTrack) ?? RADIO_STATIONS[0];
  const districtStation = getRadioStationForDistrict(hud.currentDistrict);
  const isRadioPlaying =
    musicEnabled && !isMuted && lofiTrack !== 'ambient_only';

  const cycleRadioStation = (dir: -1 | 1) => {
    const idx = RADIO_STATIONS.findIndex((s) => s.id === lofiTrack);
    const currentIdx = idx >= 0 ? idx : 0;
    const nextIdx = (currentIdx + dir + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    onChangeLofiTrack(RADIO_STATIONS[nextIdx].id);
  };

  const toggleDrawer = (drawer: Exclude<HudDrawerType, 'none'>) => {
    setActiveDrawer((d) => (d === drawer ? 'none' : drawer));
  };

  const handleToggleTouchControls = () => {
    setTouchControlsEnabled((prev) => {
      if (prev) {
        onTouchInput({
          forward: false,
          backward: false,
          left: false,
          right: false,
          joyX: 0,
          joyY: 0,
          flap: false,
          dive: false,
        });
      }
      return !prev;
    });
  };

  const rootPaddingClass = isCompactLandscape
    ? 'pl-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.45rem,env(safe-area-inset-bottom))]'
    : 'p-2.5 sm:p-4 md:p-6 pt-[max(0.65rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))] pl-[max(0.65rem,env(safe-area-inset-left))] pr-[max(0.65rem,env(safe-area-inset-right))]';

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between ${rootPaddingClass}`}>
      <TopTelemetryBar
        hud={hud}
        explorationMode={explorationMode}
        profileName={profileName}
        profileEmoji={profileEmoji}
        isCloudSignedIn={isCloudSignedIn}
        cameraPreset={cameraPreset}
        discoveredIds={discoveredIds}
        coins={coins}
        lokmaPower={lokmaPower}
        activeErrand={activeErrand}
        errandPickedUp={errandPickedUp}
        errandTargetName={errandTargetName}
        recentlyDiscovered={recentlyDiscovered}
        errandToast={errandToast}
        voiceGuideLandmark={voiceGuideLandmark}
        voiceGuideLoading={voiceGuideLoading}
        isCompactLandscape={isCompactLandscape}
        isCompactViewport={isCompactViewport}
        touchControlsEnabled={touchControlsEnabled}
        currentStation={currentStation}
        districtStation={districtStation}
        lofiTrack={lofiTrack}
        autoDistrictRadio={autoDistrictRadio}
        isRadioPlaying={isRadioPlaying}
        onToggleRadioDrawer={() => {
          setDockCollapsed(false);
          toggleDrawer('radio');
        }}
        onCycleRadioStation={cycleRadioStation}
        onChangeLofiTrack={onChangeLofiTrack}
        onToggleMusic={onToggleMusic}
        onOpenProfile={onOpenProfile}
        onEnterHome={onEnterHome}
        onOpenRealMap={onOpenRealMap}
        onOpenJournal={onOpenJournal}
        onToggleVoiceGuide={onToggleVoiceGuide}
        onStopVoiceGuide={onStopVoiceGuide}
        onOpenAbout={onOpenAbout}
        onPause={onPause}
        onJumpToLandmark={onJumpToLandmark}
      />

      {/* Bottom Area: Nearby Prompt + Collapsible Bottom Dock */}
      <div className={`flex flex-col items-center ${isCompactLandscape ? 'gap-1.5' : 'gap-2.5'}`}>
        <NearbyInteractionBar
          hud={hud}
          touchControlsEnabled={touchControlsEnabled}
          nearbyIsUndiscovered={nearbyIsUndiscovered}
          nearbyIsErrandPoint={nearbyIsErrandPoint}
          errandPickedUp={errandPickedUp}
          voiceGuideLandmark={voiceGuideLandmark}
          voiceGuideLoading={voiceGuideLoading}
          onDiscoverNearby={onDiscoverNearby}
          onInteractNpc={onInteractNpc}
          onEnterHome={onEnterHome}
          onOpenHouseDrawer={() => {
            setDockCollapsed(false);
            toggleDrawer('house');
          }}
          onToggleVoiceGuide={onToggleVoiceGuide}
        />

        <HudDrawers
          dockCollapsed={dockCollapsed}
          activeDrawer={activeDrawer}
          setActiveDrawer={setActiveDrawer}
          currentStation={currentStation}
          districtStation={districtStation}
          lofiTrack={lofiTrack}
          autoDistrictRadio={autoDistrictRadio}
          isRadioPlaying={isRadioPlaying}
          season={season}
          weather={weather}
          autoAtmosphere={autoAtmosphere}
          vehicleConfig={vehicleConfig}
          houseExterior={houseExterior}
          onChangeLofiTrack={onChangeLofiTrack}
          onToggleAutoDistrictRadio={onToggleAutoDistrictRadio}
          onChangeSeason={onChangeSeason}
          onChangeWeather={onChangeWeather}
          onToggleAutoAtmosphere={onToggleAutoAtmosphere}
          onSetVehicleType={setVehicleType}
          onChangeVehicleConfig={onChangeVehicleConfig}
          onChangeHouseExterior={onChangeHouseExterior}
          onEnterHome={onEnterHome}
        />

        <BottomControlDock
          explorationMode={explorationMode}
          vehicleConfig={vehicleConfig}
          cameraPreset={cameraPreset}
          timeOfDay={timeOfDay}
          season={season}
          weather={weather}
          isMuted={isMuted}
          musicEnabled={musicEnabled}
          isRadioPlaying={isRadioPlaying}
          isCompactLandscape={isCompactLandscape}
          isCompactViewport={isCompactViewport}
          touchControlsEnabled={touchControlsEnabled}
          dockCollapsed={dockCollapsed}
          activeDrawer={activeDrawer}
          mobileDockTab={mobileDockTab}
          onToggleDockCollapsed={() => setDockCollapsed((v) => !v)}
          onToggleDrawer={toggleDrawer}
          onSetMobileDockTab={setMobileDockTab}
          onToggleTouchControls={handleToggleTouchControls}
          onChangeExplorationMode={onChangeExplorationMode}
          onSetVehicleType={setVehicleType}
          onCycleCameraPreset={cycleCameraPreset}
          onChangeCameraPreset={onChangeCameraPreset}
          onChangeTimeOfDay={onChangeTimeOfDay}
          onToggleMusic={onToggleMusic}
          onToggleMute={onToggleMute}
          onHorn={onHorn}
          onChirp={onChirp}
          onTouchInput={onTouchInput}
          onAdjustZoom={onAdjustZoom}
        />
      </div>
    </div>
  );
});
