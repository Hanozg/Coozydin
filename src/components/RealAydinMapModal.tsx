import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Car,
  Compass,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation,
  Search,
  Star,
  X,
} from 'lucide-react';
import { LANDMARKS } from '../data/efelerData';
import { LandmarkDef } from '../types/game';

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
const EFELER_GENERAL_VIEW = { lat: 37.845, lng: 27.845 };

const PRESET_QUERIES = [
  {
    id: 'historic',
    label: 'Tarihi Yapılar',
    query: 'Aydın Efeler tarihi cami han antik kent tralleis',
  },
  {
    id: 'square',
    label: 'Kent Meydanı & Belediye',
    query: 'Aydın Atatürk Kent Meydanı Efeler Belediyesi',
  },
  {
    id: 'parks',
    label: 'Parklar & Yaşam',
    query: 'Aydın Tekstil Park Forum Aydın',
  },
  {
    id: 'station',
    label: 'Gar & Kültür',
    query: 'Aydın Tren Garı Efeler Kütüphane',
  },
  {
    id: 'campus',
    label: 'Orta Mahalle & ADÜ',
    query: 'Aydın Orta Mahalle Adnan Menderes Üniversitesi',
  },
] as const;

interface PlaceEntry {
  id: string;
  place: google.maps.places.Place;
  displayName: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  rating?: number | null;
  userRatingCount?: number | null;
  googleMapsURI?: string | null;
  weekdayDescriptions?: string[];
  matchedLandmark: LandmarkDef | null;
}

interface RouteSummary {
  distanceText: string;
  durationText: string;
  travelMode: 'WALKING' | 'DRIVING';
  originName: string;
  destinationName: string;
}

interface RealAydinMapModalProps {
  onJumpTo3DLandmark: (landmark: LandmarkDef) => void;
  onClose: () => void;
}

function getGoogleMapsApiKey(): string {
  const fromVite = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof fromVite === 'string' && fromVite.trim().length > 0) {
    return fromVite.trim();
  }
  if (typeof __GOOGLE_MAPS_API_KEY__ === 'string' && __GOOGLE_MAPS_API_KEY__.trim().length > 0) {
    return __GOOGLE_MAPS_API_KEY__.trim();
  }
  return '';
}

function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'object'
        ? JSON.stringify(err)
        : String(err);
  const upper = text.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('QUOTAEXCEEDEDERROR') ||
    upper.includes('OVERQUOTAMAPERROR') ||
    upper.includes('429')
  );
}

function matchGameLandmark(placeName: string): LandmarkDef | null {
  const normalized = placeName.toLocaleLowerCase('tr-TR');
  const rules: { keywords: string[]; landmarkId: string }[] = [
    { keywords: ['tralleis', 'üç gözler', 'uc gozler'], landmarkId: 'tralleis' },
    { keywords: ['ramazan paşa', 'ramazanpasa'], landmarkId: 'ramazanpasa' },
    { keywords: ['bey camii', 'süleyman bey'], landmarkId: 'beycamii' },
    { keywords: ['cihanoğlu', 'cihanoglu'], landmarkId: 'cihanoglu' },
    { keywords: ['nasuh paşa', 'zincirli han'], landmarkId: 'nasuhpasa' },
    { keywords: ['kent meydanı', 'atatürk meydanı'], landmarkId: 'kentmeydani' },
    { keywords: ['belediye', 'efeler belediyesi'], landmarkId: 'saribelediye' },
    { keywords: ['tekstil park', 'sümerbank'], landmarkId: 'tekstilpark' },
    { keywords: ['forum aydın', 'forum aydin'], landmarkId: 'forumaydin' },
    { keywords: ['tren garı', 'garı', 'tcdd aydın'], landmarkId: 'trengari' },
    { keywords: ['orta mahalle', 'ortamahalle'], landmarkId: 'ortamahalle' },
    { keywords: ['adnan menderes', 'adü', 'üniversite', 'kampüs', 'aytepe'], landmarkId: 'universite' },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      return LANDMARKS.find((lm) => lm.id === rule.landmarkId) ?? null;
    }
  }
  return null;
}

function toLatLngLiteral(
  loc: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
): google.maps.LatLngLiteral | null {
  if (!loc) return null;
  if (typeof (loc as google.maps.LatLng).lat === 'function') {
    const ll = loc as google.maps.LatLng;
    return { lat: ll.lat(), lng: ll.lng() };
  }
  const lit = loc as google.maps.LatLngLiteral;
  if (typeof lit.lat === 'number' && typeof lit.lng === 'number') {
    return { lat: lit.lat, lng: lit.lng };
  }
  return null;
}

function PlaceMarker({
  entry,
  isSelected,
  onSelect,
}: {
  entry: PlaceEntry;
  isSelected: boolean;
  onSelect: (entry: PlaceEntry, marker: google.maps.marker.AdvancedMarkerElement | null) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={entry.location}
      title={entry.displayName}
      zIndex={isSelected ? 1000 : 10}
      onClick={() => onSelect(entry, marker)}
    >
      <Pin
        background={isSelected ? '#D99B43' : entry.matchedLandmark ? '#61B88A' : '#3B6E8C'}
        borderColor={isSelected ? '#FFF4DF' : '#181612'}
        glyphColor={isSelected ? '#181612' : '#F5EFE6'}
      />
    </AdvancedMarker>
  );
}

function EfelerRealMapContent({
  onJumpTo3DLandmark,
}: {
  onJumpTo3DLandmark: (landmark: LandmarkDef) => void;
}) {
  const map = useMap();
  const loadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');

  const [queryInput, setQueryInput] = useState<string>(PRESET_QUERIES[0].query);
  const [activePresetId, setActivePresetId] = useState<string>(PRESET_QUERIES[0].id);
  const [placesList, setPlacesList] = useState<PlaceEntry[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceEntry | null>(null);
  const [selectedMarker, setSelectedMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const [travelMode, setTravelMode] = useState<'WALKING' | 'DRIVING'>('WALKING');
  const [routingBusy, setRoutingBusy] = useState(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const activePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const initialSearchRanRef = useRef(false);

  const clearPolylines = useCallback(() => {
    activePolylinesRef.current.forEach((line) => line.setMap(null));
    activePolylinesRef.current = [];
    setRouteSummary(null);
    setRouteError(null);
  }, []);

  useEffect(() => {
    return () => {
      activePolylinesRef.current.forEach((line) => line.setMap(null));
      activePolylinesRef.current = [];
    };
  }, []);

  const runTextSearch = useCallback(
    async (textQuery: string) => {
      if (!placesLib || !textQuery.trim()) return;
      setSearching(true);
      setSearchMessage(null);
      setSelectedPlace(null);
      setSelectedMarker(null);
      clearPolylines();

      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: textQuery.trim(),
          fields: [
            'displayName',
            'location',
            'formattedAddress',
            'rating',
            'userRatingCount',
            'googleMapsURI',
          ],
          locationBias: EFELER_GENERAL_VIEW,
          language: 'tr',
          region: 'TR',
          maxResultCount: 10,
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        });

        const nextEntries: PlaceEntry[] = [];
        for (const place of places ?? []) {
          const coords = toLatLngLiteral(place.location);
          if (!coords) continue;
          const name = place.displayName ?? 'Aydın Efeler Noktası';
          nextEntries.push({
            id: place.id,
            place,
            displayName: name,
            formattedAddress: place.formattedAddress ?? 'Efeler, Aydın',
            location: coords,
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            googleMapsURI: place.googleMapsURI,
            matchedLandmark: matchGameLandmark(name),
          });
        }

        setPlacesList(nextEntries);
        if (nextEntries.length === 0) {
          setSearchMessage('Bu arama için Efeler çevresinde sonuç bulunamadı.');
        } else if (map && coreLib) {
          const bounds = new coreLib.LatLngBounds();
          nextEntries.forEach((entry) => bounds.extend(entry.location));
          map.fitBounds(bounds, 56);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setSearchMessage('Yer bilgileri şu anda yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setSearching(false);
      }
    },
    [clearPolylines, coreLib, map, placesLib]
  );

  useEffect(() => {
    if (placesLib && !initialSearchRanRef.current) {
      initialSearchRanRef.current = true;
      void runTextSearch(PRESET_QUERIES[0].query);
    }
  }, [placesLib, runTextSearch]);

  const handleSelectPlace = useCallback(
    async (entry: PlaceEntry, marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setSelectedPlace(entry);
      setSelectedMarker(marker);
      setRouteError(null);
      if (map) {
        map.panTo(entry.location);
      }

      try {
        await entry.place.fetchFields({
          fields: [
            'formattedAddress',
            'rating',
            'userRatingCount',
            'regularOpeningHours',
            'googleMapsURI',
          ],
        });
        const refreshed: PlaceEntry = {
          ...entry,
          formattedAddress: entry.place.formattedAddress ?? entry.formattedAddress,
          rating: entry.place.rating ?? entry.rating,
          userRatingCount: entry.place.userRatingCount ?? entry.userRatingCount,
          googleMapsURI: entry.place.googleMapsURI ?? entry.googleMapsURI,
          weekdayDescriptions: entry.place.regularOpeningHours?.weekdayDescriptions,
        };
        setSelectedPlace(refreshed);
        setPlacesList((prev) => prev.map((item) => (item.id === refreshed.id ? refreshed : item)));
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    },
    [map]
  );

  const handleComputeRouteFromSquare = useCallback(
    async (target: PlaceEntry, mode: 'WALKING' | 'DRIVING') => {
      if (!placesLib || !routesLib || !map) return;
      setRoutingBusy(true);
      setRouteError(null);

      try {
        const originSearch = await placesLib.Place.searchByText({
          textQuery: 'Atatürk Kent Meydanı Efeler Aydın',
          fields: ['displayName', 'location'],
          locationBias: EFELER_GENERAL_VIEW,
          language: 'tr',
          region: 'TR',
          maxResultCount: 1,
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        });

        const originPlace = originSearch.places?.[0];
        const originLoc = toLatLngLiteral(originPlace?.location);
        if (!originLoc) {
          setRouteError('Başlangıç noktası (Kent Meydanı) bulunamadı.');
          return;
        }

        const sdkMode =
          mode === 'WALKING' ? routesLib.TravelMode.WALKING : routesLib.TravelMode.DRIVING;

        const { routes } = await routesLib.Route.computeRoutes({
          origin: originLoc,
          destination: target.location,
          travelMode: sdkMode,
          fields: ['durationMillis', 'distanceMeters', 'localizedValues', 'path', 'viewport'],
          language: 'tr',
          region: 'TR',
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        });

        const route = routes?.[0];
        if (!route) {
          setRouteError('Seçilen nokta için rota oluşturulamadı.');
          return;
        }

        activePolylinesRef.current.forEach((line) => line.setMap(null));
        const polylines = route.createPolylines({
          polylineOptions: {
            strokeColor: '#D99B43',
            strokeOpacity: 0.95,
            strokeWeight: 5,
          },
        });
        polylines.forEach((line) => line.setMap(map));
        activePolylinesRef.current = polylines;

        if (route.viewport) {
          map.fitBounds(route.viewport, 60);
        }

        const fallbackKm =
          typeof route.distanceMeters === 'number'
            ? route.distanceMeters >= 1000
              ? `${(route.distanceMeters / 1000).toFixed(1)} km`
              : `${route.distanceMeters} m`
            : '—';
        const fallbackMin =
          typeof route.durationMillis === 'number'
            ? `${Math.max(1, Math.round(route.durationMillis / 60000))} dk`
            : '—';

        setRouteSummary({
          distanceText: route.localizedValues?.distance ?? fallbackKm,
          durationText: route.localizedValues?.duration ?? fallbackMin,
          travelMode: mode,
          originName: originPlace?.displayName ?? 'Atatürk Kent Meydanı',
          destinationName: target.displayName,
        });
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setRouteError('Rota hesaplanırken bir sorun oluştu.');
      } finally {
        setRoutingBusy(false);
      }
    },
    [map, placesLib, routesLib]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActivePresetId('');
    void runTextSearch(queryInput);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[360px_1fr]">
      {/* Left Sidebar: Search, Presets & Real Places */}
      <aside className="flex flex-col min-h-0 max-h-[45dvh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-[#F5EFE6]/10 bg-[#1B1814] shrink-0">
        <div className="p-3 sm:p-4 border-b border-[#F5EFE6]/10 space-y-2.5 sm:space-y-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search
                className="w-4 h-4 text-[#9E9484] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Efeler’de yer ara (ör. Bey Camii)..."
                className="w-full rounded-xl bg-[#12100D] border border-[#F5EFE6]/12 pl-9 pr-3 py-2 text-base sm:text-xs text-[#F5EFE6] placeholder:text-[#8E8475] focus:outline-none focus:border-[#D99B43]"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !placesLib}
              className="px-3.5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] disabled:opacity-50 text-[#181612] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {searching ? 'Aranıyor...' : 'Ara'}
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto lg:flex-wrap efeler-scroll pb-0.5 lg:pb-0">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setActivePresetId(preset.id);
                  setQueryInput(preset.query);
                  void runTextSearch(preset.query);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activePresetId === preset.id
                    ? 'bg-[#D99B43] text-[#181612]'
                    : 'bg-[#26221C] text-[#CFC6B8] hover:text-[#F5EFE6]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route Summary Box */}
        {selectedPlace && (
          <div className="px-4 py-3 border-b border-[#F5EFE6]/10 bg-[#221E18] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] text-[#D99B43] font-medium truncate">
                Seçili Nokta: {selectedPlace.displayName}
              </div>
              {selectedPlace.matchedLandmark && (
                <button
                  type="button"
                  onClick={() => onJumpTo3DLandmark(selectedPlace.matchedLandmark!)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#61B88A] hover:bg-[#72C89B] text-[#181612] text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Compass className="w-3 h-3" aria-hidden="true" />
                  <span>3D’ye Işınlan</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTravelMode('WALKING');
                  void handleComputeRouteFromSquare(selectedPlace, 'WALKING');
                }}
                disabled={routingBusy || !routesLib}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  travelMode === 'WALKING' && routeSummary
                    ? 'bg-[#D99B43] text-[#181612]'
                    : 'bg-[#2B261F] hover:bg-[#352F26] text-[#F5EFE6]'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kent Meydanı’ndan Yürü</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTravelMode('DRIVING');
                  void handleComputeRouteFromSquare(selectedPlace, 'DRIVING');
                }}
                disabled={routingBusy || !routesLib}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  travelMode === 'DRIVING' && routeSummary
                    ? 'bg-[#D99B43] text-[#181612]'
                    : 'bg-[#2B261F] hover:bg-[#352F26] text-[#F5EFE6]'
                }`}
              >
                <Car className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Araç Rotası</span>
              </button>

              {routeSummary && (
                <button
                  type="button"
                  onClick={clearPolylines}
                  className="px-2 py-1.5 rounded-lg bg-[#2B261F] hover:bg-[#352F26] text-[#CFC6B8] text-[11px] cursor-pointer"
                >
                  Temizle
                </button>
              )}
            </div>

            {routingBusy && (
              <div className="text-[11px] text-[#BEB5A6]">Rota hesaplanıyor...</div>
            )}
            {routeError && <div className="text-[11px] text-[#E5988B]">{routeError}</div>}
            {routeSummary && (
              <div className="rounded-lg bg-[#171410] border border-[#D99B43]/30 px-3 py-2 text-xs text-[#F5EFE6]">
                <div className="flex items-center gap-1.5 text-[#D99B43] font-medium">
                  <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {routeSummary.originName} → {routeSummary.destinationName}
                  </span>
                </div>
                <div className="text-[11px] text-[#CFC6B8] mt-1 font-mono-num">
                  {routeSummary.distanceText} · {routeSummary.durationText} (
                  {routeSummary.travelMode === 'WALKING' ? 'Yürüyüş' : 'Araç'})
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto efeler-scroll p-3 space-y-2 min-h-0">
          {loadingStatus === APILoadingStatus.FAILED ||
          loadingStatus === APILoadingStatus.AUTH_FAILURE ? (
            <div className="rounded-xl bg-[#27201B] border border-[#D99B43]/30 p-3 text-xs text-[#E8C79B]">
              Google Haritalar yüklenirken bir sorun oluştu. API anahtarı veya kota ayarlarını
              kontrol edin.
            </div>
          ) : searchMessage ? (
            <div className="rounded-xl bg-[#24201A] border border-[#F5EFE6]/8 p-3 text-xs text-[#BEB5A6]">
              {searchMessage}
            </div>
          ) : placesList.length === 0 ? (
            <div className="rounded-xl bg-[#24201A] border border-[#F5EFE6]/8 p-3 text-xs text-[#BEB5A6]">
              {searching
                ? 'Efeler’deki noktalar Google Haritalar’dan getiriliyor...'
                : 'Bir kategori seçin veya Efeler’de bir yer arayın.'}
            </div>
          ) : (
            placesList.map((entry) => {
              const isSelected = selectedPlace?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => void handleSelectPlace(entry, null)}
                  className={`w-full text-left rounded-xl p-3 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2C261D] border-[#D99B43]/60'
                      : 'bg-[#231F19] border-[#F5EFE6]/8 hover:bg-[#2A251E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-display text-sm font-semibold text-[#F5EFE6] leading-snug">
                      {entry.displayName}
                    </div>
                    {typeof entry.rating === 'number' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-[#E8B86D] shrink-0">
                        <Star className="w-3 h-3 fill-[#E8B86D]" aria-hidden="true" />
                        <span>{entry.rating.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#B8AEA0] mt-1 line-clamp-2">
                    {entry.formattedAddress}
                  </div>
                  {entry.matchedLandmark && (
                    <div className="text-[11px] text-[#89C490] font-medium mt-1.5">
                      Oyundaki 3D karşılığı: {entry.matchedLandmark.name}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Interactive Google Map (Explicit CSS Height — CF2) */}
      <div className="relative flex-1 w-full min-h-[260px] lg:h-full bg-[#14120F]">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={EFELER_GENERAL_VIEW}
          defaultZoom={13}
          gestureHandling="greedy"
          mapTypeControl={true}
          streetViewControl={true}
          fullscreenControl={false}
          internalUsageAttributionIds={[ATTRIBUTION_ID]}
          className="w-full h-full"
        >
          {placesList.map((entry) => (
            <PlaceMarker
              key={entry.id}
              entry={entry}
              isSelected={selectedPlace?.id === entry.id}
              onSelect={(item, marker) => void handleSelectPlace(item, marker)}
            />
          ))}

          {selectedPlace && (
            <InfoWindow
              anchor={selectedMarker}
              position={selectedMarker ? undefined : selectedPlace.location}
              pixelOffset={[0, -8]}
              onCloseClick={() => {
                setSelectedPlace(null);
                setSelectedMarker(null);
              }}
            >
              <div className="text-[#181612] max-w-[240px] space-y-1.5 p-0.5">
                <div className="font-semibold text-sm leading-snug">
                  {selectedPlace.displayName}
                </div>
                <div className="text-xs text-[#4A4338] leading-snug">
                  {selectedPlace.formattedAddress}
                </div>
                {typeof selectedPlace.rating === 'number' && (
                  <div className="text-xs font-medium text-[#8C5B14]">
                    ★ {selectedPlace.rating.toFixed(1)}
                    {typeof selectedPlace.userRatingCount === 'number'
                      ? ` (${selectedPlace.userRatingCount} değerlendirme)`
                      : ''}
                  </div>
                )}
                {selectedPlace.weekdayDescriptions &&
                  selectedPlace.weekdayDescriptions.length > 0 && (
                    <div className="text-[11px] text-[#5C5447] pt-0.5">
                      {selectedPlace.weekdayDescriptions[0]}
                    </div>
                  )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedPlace.googleMapsURI && (
                    <a
                      href={selectedPlace.googleMapsURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D5B8C] hover:underline"
                    >
                      <span>Google Haritalar’da Aç</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </div>
  );
}

export function RealAydinMapModal({
  onJumpTo3DLandmark,
  onClose,
}: RealAydinMapModalProps) {
  const apiKey = getGoogleMapsApiKey();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#14120F]/82 p-2.5 sm:p-3 md:p-6">
      <div className="w-full max-w-6xl h-[92dvh] sm:h-[88dvh] flex flex-col rounded-2xl bg-[#1E1B16] border border-[#F5EFE6]/14 text-[#F5EFE6] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5EFE6]/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D99B43]/15 border border-[#D99B43]/35 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#D99B43]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg md:text-xl font-semibold tracking-tight truncate">
                Gerçek Aydın — Efeler Haritası
              </h2>
              <p className="text-xs text-[#BEB5A6] truncate">
                Efeler’in gerçek sokaklarını, tarihi yapılarını ve yürüyüş rotalarını Google
                Haritalar üzerinde keşfedin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Gerçek Haritayı Kapat"
            className="p-2 rounded-lg text-[#CFC6B8] hover:text-[#F5EFE6] hover:bg-[#2A2620] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {apiKey ? (
          <APIProvider
            apiKey={apiKey}
            language="tr"
            region="TR"
            libraries={['places', 'marker', 'routes']}
          >
            <EfelerRealMapContent onJumpTo3DLandmark={onJumpTo3DLandmark} />
          </APIProvider>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <MapPin className="w-10 h-10 text-[#D99B43]" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold text-[#F5EFE6]">
              Google Maps API Anahtarı Bulunamadı
            </h3>
            <p className="text-xs md:text-sm text-[#BEB5A6] max-w-md leading-relaxed">
              Gerçek haritayı görüntülemek için{' '}
              <code className="font-mono-num text-[#E6DCCB]">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
              ortam değişkeninin tanımlı olduğundan emin olun ve uygulamayı yeniden başlatın.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
