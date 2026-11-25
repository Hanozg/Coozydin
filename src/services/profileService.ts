import { signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  DEFAULT_HOUSE_EXTERIOR,
  DEFAULT_UNLOCKED_FURNITURE_STYLES,
  DEFAULT_VEHICLE_CONFIG,
} from '../data/efelerData';
import {
  AgendaNote,
  CozyRoomState,
  FurnitureSlotPlacement,
  HouseExteriorConfig,
  UserSavePayload,
  VehicleConfig,
} from '../types/game';
import { sanitizeTradeProfile } from '../game/tradeEngine';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';

const LOCAL_SAVE_KEY = 'efeler_player_save_v1';

function sanitizeHex(hex: unknown, fallback: string): string {
  if (typeof hex === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(hex.trim())) {
    return hex.trim().slice(0, 16);
  }
  return fallback;
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : fallback;
  return Math.max(min, Math.min(max, n));
}

export function sanitizeUserSavePayload(raw: Partial<UserSavePayload>): UserSavePayload {
  const displayNameRaw = typeof raw.displayName === 'string' ? raw.displayName.trim() : '';
  const displayName = Array.from(displayNameRaw || 'Efeler Gezgini')
    .slice(0, 40)
    .join('');

  const avatarEmojiRaw = typeof raw.avatarEmoji === 'string' ? raw.avatarEmoji.trim() : '';
  const avatarEmoji = Array.from(avatarEmojiRaw || '🏡')
    .slice(0, 6)
    .join('');

  const vcRaw = (raw.vehicleConfig || {}) as Partial<VehicleConfig>;
  const vehicleConfig: VehicleConfig = {
    type:
      vcRaw.type === 'bicycle' || vcRaw.type === 'motorcycle' || vcRaw.type === 'car'
        ? vcRaw.type
        : DEFAULT_VEHICLE_CONFIG.type,
    color: sanitizeHex(vcRaw.color, DEFAULT_VEHICLE_CONFIG.color),
    finish: vcRaw.finish === 'matte' ? 'matte' : 'gloss',
    accentColor: sanitizeHex(vcRaw.accentColor, DEFAULT_VEHICLE_CONFIG.accentColor),
    hasAccessory: typeof vcRaw.hasAccessory === 'boolean' ? vcRaw.hasAccessory : true,
    hasStripe: typeof vcRaw.hasStripe === 'boolean' ? vcRaw.hasStripe : true,
  };

  const heRaw = (raw.houseExterior || {}) as Partial<HouseExteriorConfig>;
  const validStyles = ['cottage_villa', 'modern_gable', 'aegean_veranda', 'twin_cottage'] as const;
  const houseExterior: HouseExteriorConfig = {
    style: validStyles.includes(heRaw.style as (typeof validStyles)[number])
      ? (heRaw.style as HouseExteriorConfig['style'])
      : DEFAULT_HOUSE_EXTERIOR.style,
    wallColor: sanitizeHex(heRaw.wallColor, DEFAULT_HOUSE_EXTERIOR.wallColor),
    roofColor: sanitizeHex(heRaw.roofColor, DEFAULT_HOUSE_EXTERIOR.roofColor),
    trimColor: sanitizeHex(heRaw.trimColor, DEFAULT_HOUSE_EXTERIOR.trimColor),
  };

  const crRaw = (raw.cozyRoomState || {}) as Partial<CozyRoomState>;
  const acRaw = crRaw.avatarConfig || DEFAULT_AVATAR_CONFIG;
  const hairStyles = ['kasket', 'short', 'long', 'bun'] as const;
  const validFurnitureIds = new Set<FurnitureSlotPlacement['id']>([
    'armchair',
    'desk',
    'bookshelf',
    'rug',
    'plant',
    'turntable',
    'teatable',
    'wallart',
  ]);
  const rawFurniture =
    Array.isArray(crRaw.furniture) && crRaw.furniture.length > 0
      ? crRaw.furniture
      : DEFAULT_COZY_ROOM_STATE.furniture;
  const sanitizedFurniture = (rawFurniture as FurnitureSlotPlacement[])
    .filter((f) => f && typeof f.id === 'string' && validFurnitureIds.has(f.id))
    .slice(0, 20)
    .map((f) => {
      const cleanItem: FurnitureSlotPlacement = {
        id: f.id,
        enabled: Boolean(f.enabled),
        slotIndex: clampInt(f.slotIndex, 0, 10, 0),
        styleId:
          typeof f.styleId === 'string' && f.styleId.trim().length > 0
            ? f.styleId.trim().slice(0, 40)
            : 'classic',
      };
      if (typeof f.x === 'number' && Number.isFinite(f.x)) {
        cleanItem.x = Math.round(f.x * 100) / 100;
      }
      if (typeof f.z === 'number' && Number.isFinite(f.z)) {
        cleanItem.z = Math.round(f.z * 100) / 100;
      }
      if (typeof f.rotY === 'number' && Number.isFinite(f.rotY)) {
        cleanItem.rotY = Math.round(f.rotY * 1000) / 1000;
      }
      return cleanItem;
    });

  const cozyRoomState: CozyRoomState = {
    wallColor: sanitizeHex(crRaw.wallColor, DEFAULT_COZY_ROOM_STATE.wallColor),
    floorTone:
      crRaw.floorTone === 'pine' || crRaw.floorTone === 'stone' || crRaw.floorTone === 'oak'
        ? crRaw.floorTone
        : 'oak',
    lampOn: typeof crRaw.lampOn === 'boolean' ? crRaw.lampOn : true,
    petType:
      crRaw.petType === 'cat' || crRaw.petType === 'dog' || crRaw.petType === 'both'
        ? crRaw.petType
        : 'both',
    petAffection: clampInt(crRaw.petAffection, 0, 100000, DEFAULT_COZY_ROOM_STATE.petAffection),
    avatarPlaced: typeof crRaw.avatarPlaced === 'boolean' ? crRaw.avatarPlaced : true,
    avatarConfig: {
      skinColor: sanitizeHex(acRaw.skinColor, DEFAULT_AVATAR_CONFIG.skinColor),
      shirtColor: sanitizeHex(acRaw.shirtColor, DEFAULT_AVATAR_CONFIG.shirtColor),
      pantsColor: sanitizeHex(acRaw.pantsColor, DEFAULT_AVATAR_CONFIG.pantsColor),
      hairStyle: hairStyles.includes(acRaw.hairStyle as (typeof hairStyles)[number])
        ? acRaw.hairStyle
        : DEFAULT_AVATAR_CONFIG.hairStyle,
      hairColor: sanitizeHex(acRaw.hairColor, DEFAULT_AVATAR_CONFIG.hairColor),
    },
    furniture:
      sanitizedFurniture.length > 0 ? sanitizedFurniture : DEFAULT_COZY_ROOM_STATE.furniture,
  };

  const sanitizeStringList = (arr: unknown, maxLen: number, itemMax: number): string[] => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of arr) {
      if (typeof item === 'string') {
        const t = item.trim().slice(0, itemMax);
        if (t.length > 0 && !seen.has(t)) {
          seen.add(t);
          out.push(t);
          if (out.length >= maxLen) break;
        }
      }
    }
    return out;
  };

  const unlockedSet = new Set([
    ...DEFAULT_UNLOCKED_FURNITURE_STYLES,
    ...sanitizeStringList(raw.unlockedFurnitureStyles, 80, 64),
  ]);

  const agendaNotes: AgendaNote[] = Array.isArray(raw.agendaNotes)
    ? raw.agendaNotes
        .filter(
          (n) =>
            n &&
            typeof n.id === 'string' &&
            typeof n.dateKey === 'string' &&
            typeof n.text === 'string'
        )
        .slice(0, 120)
        .map((n, idx) => {
          const cleanDate = n.dateKey.trim().slice(0, 16);
          return {
            id: n.id.trim().slice(0, 48) || `note_${Date.now()}_${idx}`,
            dateKey: cleanDate.length >= 8 ? cleanDate : '2026-01-01',
            text: n.text.trim().slice(0, 240) || 'Not',
            done: Boolean(n.done),
          };
        })
    : [];

  return {
    displayName,
    avatarEmoji,
    coins: clampInt(raw.coins, 0, 1000000, 0),
    lokmaPower: clampInt(raw.lokmaPower, 0, 100000, 2),
    discoveredIds: sanitizeStringList(raw.discoveredIds, 30, 40),
    discoveredMuseumIds: sanitizeStringList(raw.discoveredMuseumIds, 80, 48),
    completedErrandIds: sanitizeStringList(raw.completedErrandIds, 40, 48),
    chattedNpcIds: sanitizeStringList(raw.chattedNpcIds, 40, 40),
    unlockedFurnitureStyles: Array.from(unlockedSet).slice(0, 80),
    vehicleConfig,
    houseExterior,
    cozyRoomState,
    agendaNotes,
    tradeProfile: sanitizeTradeProfile(raw.tradeProfile),
  };
}

export function loadLocalSavePayload(): UserSavePayload | null {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return null;
    return sanitizeUserSavePayload(JSON.parse(raw) as Partial<UserSavePayload>);
  } catch {
    return null;
  }
}

export function saveLocalSavePayload(payload: UserSavePayload): void {
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export async function signInWithGooglePopup(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function loadCloudProfile(uid: string): Promise<UserSavePayload | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return sanitizeUserSavePayload(snap.data() as Partial<UserSavePayload>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudProfile(uid: string, payload: UserSavePayload): Promise<void> {
  const clean = sanitizeUserSavePayload(payload);
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  let exists = false;
  try {
    const snap = await getDoc(docRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(docRef, {
        uid,
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(docRef, {
        displayName: clean.displayName,
        avatarEmoji: clean.avatarEmoji,
        coins: clean.coins,
        lokmaPower: clean.lokmaPower,
        discoveredIds: clean.discoveredIds,
        discoveredMuseumIds: clean.discoveredMuseumIds,
        completedErrandIds: clean.completedErrandIds,
        chattedNpcIds: clean.chattedNpcIds,
        unlockedFurnitureStyles: clean.unlockedFurnitureStyles,
        vehicleConfig: clean.vehicleConfig,
        houseExterior: clean.houseExterior,
        cozyRoomState: clean.cozyRoomState,
        agendaNotes: clean.agendaNotes,
        tradeProfile: clean.tradeProfile,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
