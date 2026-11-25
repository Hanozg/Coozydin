import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  DEFAULT_HOUSE_EXTERIOR,
  DEFAULT_UNLOCKED_FURNITURE_STYLES,
  DEFAULT_VEHICLE_CONFIG,
} from '../data/efelerData';
import { auth } from '../services/firebase';
import {
  loadCloudProfile,
  loadLocalSavePayload,
  sanitizeUserSavePayload,
  saveCloudProfile,
  saveLocalSavePayload,
} from '../services/profileService';
import {
  AgendaNote,
  CozyRoomState,
  HouseExteriorConfig,
  UserSavePayload,
  VehicleConfig,
} from '../types/game';
import { TradeProfileState } from '../types/trade';
import { DEFAULT_TRADE_PROFILE } from '../data/tradeCatalog';
import { sanitizeTradeProfile } from '../game/tradeEngine';

const LEGACY_ROOM_STORAGE_KEY = 'efeler_cozy_room_v1';
const LEGACY_AGENDA_STORAGE_KEY = 'efeler_agenda_notes_v1';

export function loadInitialPlayerSave(): UserSavePayload {
  const saved = loadLocalSavePayload();
  if (saved) return saved;

  let legacyRoom: Partial<CozyRoomState> | undefined;
  let legacyAgenda: AgendaNote[] = [];
  try {
    const rawRoom = localStorage.getItem(LEGACY_ROOM_STORAGE_KEY);
    if (rawRoom) legacyRoom = JSON.parse(rawRoom) as Partial<CozyRoomState>;
  } catch {
    // Ignore parse errors
  }
  try {
    const rawAgenda = localStorage.getItem(LEGACY_AGENDA_STORAGE_KEY);
    if (rawAgenda) {
      const parsed = JSON.parse(rawAgenda) as AgendaNote[];
      if (Array.isArray(parsed)) legacyAgenda = parsed;
    }
  } catch {
    // Ignore parse errors
  }

  return sanitizeUserSavePayload({
    displayName: 'Efeler Gezgini',
    avatarEmoji: '🏡',
    coins: 0,
    lokmaPower: 2,
    discoveredIds: [],
    discoveredMuseumIds: [],
    completedErrandIds: [],
    chattedNpcIds: [],
    unlockedFurnitureStyles: DEFAULT_UNLOCKED_FURNITURE_STYLES,
    vehicleConfig: DEFAULT_VEHICLE_CONFIG,
    houseExterior: DEFAULT_HOUSE_EXTERIOR,
    cozyRoomState: legacyRoom
      ? {
          ...DEFAULT_COZY_ROOM_STATE,
          ...legacyRoom,
          avatarConfig: {
            ...DEFAULT_AVATAR_CONFIG,
            ...(legacyRoom.avatarConfig || {}),
          },
          furniture:
            Array.isArray(legacyRoom.furniture) && legacyRoom.furniture.length > 0
              ? legacyRoom.furniture
              : DEFAULT_COZY_ROOM_STATE.furniture,
        }
      : DEFAULT_COZY_ROOM_STATE,
    agendaNotes: legacyAgenda,
  });
}

export function useGamePersistence() {
  const initialSave = useMemo(() => loadInitialPlayerSave(), []);

  const [displayName, setDisplayName] = useState<string>(initialSave.displayName);
  const [avatarEmoji, setAvatarEmoji] = useState<string>(initialSave.avatarEmoji);
  const [chattedNpcIds, setChattedNpcIds] = useState<string[]>(initialSave.chattedNpcIds);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>(initialSave.discoveredIds);
  const [discoveredMuseumIds, setDiscoveredMuseumIds] = useState<string[]>(
    initialSave.discoveredMuseumIds
  );
  const [completedErrandIds, setCompletedErrandIds] = useState<string[]>(
    initialSave.completedErrandIds
  );
  const [coins, setCoins] = useState<number>(initialSave.coins);
  const [lokmaPower, setLokmaPower] = useState<number>(initialSave.lokmaPower);
  const [unlockedFurnitureStyles, setUnlockedFurnitureStyles] = useState<string[]>(
    initialSave.unlockedFurnitureStyles
  );
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(initialSave.vehicleConfig);
  const [houseExterior, setHouseExterior] = useState<HouseExteriorConfig>(
    initialSave.houseExterior
  );
  const [cozyRoomState, setCozyRoomState] = useState<CozyRoomState>(initialSave.cozyRoomState);
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>(initialSave.agendaNotes);
  const [tradeProfile, setTradeProfile] = useState<TradeProfileState>(
    () => sanitizeTradeProfile(initialSave.tradeProfile ?? DEFAULT_TRADE_PROFILE)
  );

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [cloudErrorMessage, setCloudErrorMessage] = useState<string | null>(null);

  const cloudHydratedRef = useRef(false);

  const currentPayload = useMemo<UserSavePayload>(
    () =>
      sanitizeUserSavePayload({
        displayName,
        avatarEmoji,
        coins,
        lokmaPower,
        discoveredIds,
        discoveredMuseumIds,
        completedErrandIds,
        chattedNpcIds,
        unlockedFurnitureStyles,
        vehicleConfig,
        houseExterior,
        cozyRoomState,
        agendaNotes,
        tradeProfile,
      }),
    [
      agendaNotes,
      avatarEmoji,
      chattedNpcIds,
      coins,
      completedErrandIds,
      cozyRoomState,
      discoveredIds,
      discoveredMuseumIds,
      displayName,
      houseExterior,
      lokmaPower,
      tradeProfile,
      unlockedFurnitureStyles,
      vehicleConfig,
    ]
  );

  const latestPayloadRef = useRef<UserSavePayload>(currentPayload);
  latestPayloadRef.current = currentPayload;

  const applySavePayload = useCallback((data: UserSavePayload) => {
    setDisplayName(data.displayName);
    setAvatarEmoji(data.avatarEmoji);
    setCoins(data.coins);
    setLokmaPower(data.lokmaPower);
    setDiscoveredIds(data.discoveredIds);
    setDiscoveredMuseumIds(data.discoveredMuseumIds);
    setCompletedErrandIds(data.completedErrandIds);
    setChattedNpcIds(data.chattedNpcIds);
    setUnlockedFurnitureStyles(data.unlockedFurnitureStyles);
    setVehicleConfig(data.vehicleConfig);
    setHouseExterior(data.houseExterior);
    setCozyRoomState(data.cozyRoomState);
    setAgendaNotes(data.agendaNotes);
    setTradeProfile(sanitizeTradeProfile(data.tradeProfile ?? DEFAULT_TRADE_PROFILE));
  }, []);

  // Local auto-save (immediate debounce)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveLocalSavePayload(currentPayload);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [currentPayload]);

  // Firebase Auth listener & initial cloud hydration
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      setCloudErrorMessage(null);

      if (!user) {
        cloudHydratedRef.current = false;
        setCloudStatusMessage(null);
        return;
      }

      setCloudSyncing(true);
      try {
        const cloudData = await loadCloudProfile(user.uid);
        if (!active) return;
        const local = latestPayloadRef.current;

        if (!cloudData) {
          const initialName =
            local.displayName === 'Efeler Gezgini' && user.displayName
              ? user.displayName.slice(0, 40)
              : local.displayName;
          const seeded = sanitizeUserSavePayload({
            ...local,
            displayName: initialName,
          });
          applySavePayload(seeded);
          await saveCloudProfile(user.uid, seeded);
          if (!active) return;
          setCloudStatusMessage('Yeni bulut profili oluşturuldu ve puanların kaydedildi.');
        } else {
          const merged = sanitizeUserSavePayload({
            ...cloudData,
            displayName:
              cloudData.displayName === 'Efeler Gezgini' &&
              local.displayName !== 'Efeler Gezgini'
                ? local.displayName
                : cloudData.displayName,
            coins: Math.max(cloudData.coins, local.coins),
            lokmaPower: Math.max(cloudData.lokmaPower, local.lokmaPower),
            discoveredIds: Array.from(
              new Set([...cloudData.discoveredIds, ...local.discoveredIds])
            ),
            discoveredMuseumIds: Array.from(
              new Set([...(cloudData.discoveredMuseumIds || []), ...local.discoveredMuseumIds])
            ),
            completedErrandIds: Array.from(
              new Set([...(cloudData.completedErrandIds || []), ...local.completedErrandIds])
            ),
            chattedNpcIds: Array.from(
              new Set([...cloudData.chattedNpcIds, ...local.chattedNpcIds])
            ),
            unlockedFurnitureStyles: Array.from(
              new Set([...cloudData.unlockedFurnitureStyles, ...local.unlockedFurnitureStyles])
            ),
            tradeProfile:
              (cloudData.tradeProfile?.version ?? 1) >= (local.tradeProfile?.version ?? 1)
                ? sanitizeTradeProfile(cloudData.tradeProfile)
                : sanitizeTradeProfile(local.tradeProfile),
          });
          applySavePayload(merged);
          setCloudStatusMessage('Bulut profilin yüklendi.');
        }
        cloudHydratedRef.current = true;
      } catch {
        if (!active) return;
        cloudHydratedRef.current = true;
        setCloudErrorMessage('Bulut profiline erişilemedi. Yerel kaydınız aktif.');
      } finally {
        if (active) setCloudSyncing(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applySavePayload]);

  // Debounced cloud auto-save when signed in
  useEffect(() => {
    if (!firebaseUser || !cloudHydratedRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        await saveCloudProfile(firebaseUser.uid, currentPayload);
        if (!cancelled) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          setCloudStatusMessage(`Buluta otomatik kaydedildi (${hh}:${mm}).`);
          setCloudErrorMessage(null);
        }
      } catch {
        if (!cancelled) {
          setCloudErrorMessage('Bulut kaydı güncellenemedi; yerel kaydınız güvende.');
        }
      }
    }, 2200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentPayload, firebaseUser]);

  const handleManualCloudSave = useCallback(async () => {
    if (!firebaseUser) return;
    setCloudSyncing(true);
    setCloudErrorMessage(null);
    try {
      await saveCloudProfile(firebaseUser.uid, latestPayloadRef.current);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCloudStatusMessage(`Buluta başarıyla kaydedildi (${hh}:${mm}).`);
    } catch {
      setCloudErrorMessage('Buluta kaydedilirken bir hata oluştu.');
    } finally {
      setCloudSyncing(false);
    }
  }, [firebaseUser]);

  const handleManualCloudLoad = useCallback(async () => {
    if (!firebaseUser) return;
    setCloudSyncing(true);
    setCloudErrorMessage(null);
    try {
      const cloudData = await loadCloudProfile(firebaseUser.uid);
      if (cloudData) {
        applySavePayload(cloudData);
        setCloudStatusMessage('Buluttaki son kayıtlı profil yüklendi.');
      } else {
        setCloudStatusMessage('Bulutta henüz kayıt bulunamadı.');
      }
    } catch {
      setCloudErrorMessage('Buluttan yükleme başarısız oldu.');
    } finally {
      setCloudSyncing(false);
    }
  }, [applySavePayload, firebaseUser]);

  return {
    displayName,
    setDisplayName,
    avatarEmoji,
    setAvatarEmoji,
    chattedNpcIds,
    setChattedNpcIds,
    discoveredIds,
    setDiscoveredIds,
    discoveredMuseumIds,
    setDiscoveredMuseumIds,
    completedErrandIds,
    setCompletedErrandIds,
    coins,
    setCoins,
    lokmaPower,
    setLokmaPower,
    unlockedFurnitureStyles,
    setUnlockedFurnitureStyles,
    vehicleConfig,
    setVehicleConfig,
    houseExterior,
    setHouseExterior,
    cozyRoomState,
    setCozyRoomState,
    agendaNotes,
    setAgendaNotes,
    tradeProfile,
    setTradeProfile,
    firebaseUser,
    cloudSyncing,
    cloudStatusMessage,
    cloudErrorMessage,
    handleManualCloudSave,
    handleManualCloudLoad,
  };
}
