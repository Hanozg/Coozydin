import {
  Compass,
  Headphones,
  Home,
  Landmark,
  MessageCircle,
  Paintbrush,
  Sparkles,
  Square,
  Store,
} from 'lucide-react';
import { getAncientCityByLandmarkId } from '../../data/ancientMuseumData';
import { getTradeHubByLandmarkId } from '../../data/tradeCatalog';
import {
  AncientCityId,
  BuildingNpcDef,
  LandmarkDef,
  PlayerHudSnapshot,
} from '../../types/game';
import { TradeHubId } from '../../types/trade';

interface NearbyInteractionBarProps {
  hud: PlayerHudSnapshot;
  touchControlsEnabled: boolean;
  nearbyIsUndiscovered: boolean;
  nearbyIsErrandPoint: boolean;
  errandPickedUp: boolean;
  voiceGuideLandmark: LandmarkDef | null;
  voiceGuideLoading: boolean;
  onDiscoverNearby: () => void;
  onInteractNpc: (npc: BuildingNpcDef) => void;
  onEnterHome: () => void;
  onEnterAncientMuseum: (cityId?: AncientCityId) => void;
  onOpenHouseDrawer: () => void;
  onOpenTradeMarket: (hubId?: TradeHubId) => void;
  onToggleVoiceGuide: () => void;
}

export function NearbyInteractionBar({
  hud,
  touchControlsEnabled,
  nearbyIsUndiscovered,
  nearbyIsErrandPoint,
  errandPickedUp,
  voiceGuideLandmark,
  voiceGuideLoading,
  onDiscoverNearby,
  onInteractNpc,
  onEnterHome,
  onEnterAncientMuseum,
  onOpenHouseDrawer,
  onOpenTradeMarket,
  onToggleVoiceGuide,
}: NearbyInteractionBarProps) {
  const nearbyAncientCity = getAncientCityByLandmarkId(hud.nearbyLandmark?.id);
  const nearbyTradeHub = getTradeHubByLandmarkId(hud.nearbyLandmark?.id);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-[94vw]">
      {hud.nearbyStreetInteraction ? (
        <button
          key="street-interaction"
          type="button"
          onClick={onDiscoverNearby}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[75vw]">
            {touchControlsEnabled ? '' : '[E] '}
            {hud.nearbyStreetInteraction.label.replace(' (Tıkla veya E)', '')}
          </span>
        </button>
      ) : hud.nearbyNpc ? (
        <button
          key="nearby-npc"
          type="button"
          onClick={() => onInteractNpc(hud.nearbyNpc!)}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {touchControlsEnabled ? '' : '[E] '}
            {hud.nearbyNpc.name} ile Sohbet Et ({hud.nearbyNpc.role})
          </span>
        </button>
      ) : hud.nearPlayerHome ? (
        <div key="near-home" className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onEnterHome}
            className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl bg-[#5D8A48] hover:bg-[#4F783C] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>{touchControlsEnabled ? 'Sıcak Yuvam’a Gir' : '[E] Sıcak Yuvam’a Gir (Evim)'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenHouseDrawer}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7EEDC] hover:bg-[#EFE0C3] border-2 border-[#B99464] text-[#3A2618] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Paintbrush className="w-4 h-4 text-[#C85A32]" aria-hidden="true" />
            <span>Dış Cepheyi Tasarla</span>
          </button>
        </div>
      ) : hud.nearbyLandmark && (nearbyIsUndiscovered || nearbyIsErrandPoint) ? (
        <button
          key="nearby-landmark"
          type="button"
          onClick={onDiscoverNearby}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            <span>
              {touchControlsEnabled ? '' : '[E] '}
              {hud.nearbyLandmark.name} —{' '}
            </span>
            <span
              key={
                nearbyIsErrandPoint
                  ? errandPickedUp
                    ? 'deliver'
                    : 'pickup'
                  : 'discover'
              }
            >
              {nearbyIsErrandPoint
                ? errandPickedUp
                  ? 'Görevi Teslim Et'
                  : 'Paketi Teslim Al'
                : 'Yapıyı Keşfet'}
            </span>
          </span>
        </button>
      ) : (
        hud.nearAncientSignpost && (
          <button
            key="ancient-signpost"
            type="button"
            onClick={onDiscoverNearby}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7EEDC] hover:bg-[#EFE0C3] border-2 border-[#B99464] text-[#3A2618] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#B84C27]" aria-hidden="true" />
            <span>
              {touchControlsEnabled ? '' : '[E] '}Aydın Antik Kentleri Levhasını İncele
            </span>
          </button>
        )
      )}

      {nearbyAncientCity && (
        <button
          type="button"
          onClick={() => onEnterAncientMuseum(nearbyAncientCity.id)}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8F5624] hover:bg-[#7A471D] border-2 border-[#F5D79E]/85 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Landmark className="w-4 h-4 text-[#F8DFAA] shrink-0" aria-hidden="true" />
          <span>Antik Kente Gir · {nearbyAncientCity.shortName} Açık Hava Müzesi</span>
        </button>
      )}

      {nearbyTradeHub && (
        <button
          type="button"
          onClick={() => onOpenTradeMarket(nearbyTradeHub.id)}
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5D8A48] hover:bg-[#4E763B] border-2 border-[#FAF2E2]/85 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
        >
          <Store className="w-4 h-4 text-[#FAF2E2] shrink-0" aria-hidden="true" />
          <span>
            {touchControlsEnabled ? '' : '[T] '}
            {nearbyTradeHub.shortName} Pazarı · Yerinde Ticaret
          </span>
        </button>
      )}

      {hud.nearbyLandmark && (
        <button
          type="button"
          onClick={onToggleVoiceGuide}
          aria-pressed={voiceGuideLandmark?.id === hud.nearbyLandmark.id}
          className={`pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer ${
            voiceGuideLandmark?.id === hud.nearbyLandmark.id || voiceGuideLoading
              ? 'bg-[#3A2618] hover:bg-[#2A1B10] border-[#FFD43B]/80 text-[#FAF2E2]'
              : 'bg-[#F7EEDC] hover:bg-[#EFE0C3] border-[#B99464] text-[#3A2618]'
          }`}
        >
          {voiceGuideLandmark?.id === hud.nearbyLandmark.id || voiceGuideLoading ? (
            <Square className="w-3.5 h-3.5 text-[#FFD43B] fill-current shrink-0" aria-hidden="true" />
          ) : (
            <Headphones className="w-4 h-4 text-[#B84C27] shrink-0" aria-hidden="true" />
          )}
          <span className="truncate max-w-[65vw]">
            {voiceGuideLoading
              ? `Hazırlanıyor · ${hud.nearbyLandmark.name}`
              : voiceGuideLandmark?.id === hud.nearbyLandmark.id
                ? `Sesli Rehber’i Durdur · ${hud.nearbyLandmark.name}`
                : `Sesli Rehber · ${hud.nearbyLandmark.name}`}
          </span>
        </button>
      )}
    </div>
  );
}
