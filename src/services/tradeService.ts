import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { TRADE_GOOD_MAP, TRADE_HUB_MAP } from '../data/tradeCatalog';
import {
  MarketListing,
  MarketListingStatus,
  TradeGoodId,
  TradeHubId,
  TradeLedgerEntry,
  TradeProfileState,
} from '../types/trade';
import { db, handleFirestoreError, OperationType } from './firebase';

const LOCAL_LISTINGS_KEY = 'efeler_trade_listings_v1';
const LOCAL_LEDGER_KEY = 'efeler_trade_ledger_v1';

export interface CreateListingInput {
  listingId: string;
  sellerUid: string;
  sellerName: string;
  sellerEmoji: string;
  hubId: TradeHubId;
  itemId: TradeGoodId;
  quantity: number;
  unitPrice: number;
  feeCoins: number;
  nextCoins: number;
  nextTradeProfile: TradeProfileState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
}

export interface CancelListingInput {
  listingId: string;
  sellerUid: string;
  nextCoins: number;
  nextTradeProfile: TradeProfileState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
}

export interface FillListingInput {
  listingId: string;
  buyerUid: string;
  buyerName: string;
  nextCoins: number;
  nextTradeProfile: TradeProfileState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
}

export interface ClaimProceedsInput {
  listingId: string;
  sellerUid: string;
  nextCoins: number;
  nextTradeProfile: TradeProfileState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
}

export interface CommitProfileAndLedgerInput {
  uid: string;
  nextCoins: number;
  nextTradeProfile: TradeProfileState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
}

function timestampToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val && typeof val === 'object' && 'seconds' in val) {
    const sec = (val as { seconds?: number }).seconds;
    if (typeof sec === 'number') return sec * 1000;
  }
  return Date.now();
}

function sanitizeDisplayStr(val: unknown, fallback: string, maxLen: number): string {
  const raw = typeof val === 'string' ? val.trim() : '';
  return Array.from(raw || fallback)
    .slice(0, maxLen)
    .join('');
}

function parseFirestoreListing(id: string, data: Record<string, unknown>): MarketListing | null {
  const hubId = data.hubId as TradeHubId;
  const itemId = data.itemId as TradeGoodId;
  const status = data.status as MarketListingStatus;
  if (!(hubId in TRADE_HUB_MAP) || !(itemId in TRADE_GOOD_MAP)) return null;
  if (!['open', 'sold', 'claimed', 'cancelled'].includes(status)) return null;

  const quantity = Math.max(1, Math.round(Number(data.quantity) || 1));
  const unitPrice = Math.max(1, Math.round(Number(data.unitPrice) || 1));
  const totalPrice = Math.max(1, Math.round(Number(data.totalPrice) || quantity * unitPrice));
  const feeCoins = Math.max(0, Math.round(Number(data.feeCoins) || 0));

  return {
    id,
    sellerUid: String(data.sellerUid || ''),
    sellerName: sanitizeDisplayStr(data.sellerName, 'Efeler Tüccarı', 40),
    sellerEmoji: sanitizeDisplayStr(data.sellerEmoji, '🏡', 12),
    hubId,
    itemId,
    quantity,
    unitPrice,
    totalPrice,
    feeCoins,
    status,
    buyerUid: typeof data.buyerUid === 'string' ? data.buyerUid : null,
    buyerName: typeof data.buyerName === 'string' ? data.buyerName : null,
    claimedBySeller: Boolean(data.claimedBySeller),
    createdAtMs: timestampToMs(data.createdAt),
    updatedAtMs: timestampToMs(data.updatedAt),
    source: 'firestore',
  };
}

function parseFirestoreLedger(id: string, data: Record<string, unknown>): TradeLedgerEntry {
  return {
    id,
    uid: String(data.uid || ''),
    idempotencyKey: String(data.idempotencyKey || id),
    type: (data.type as TradeLedgerEntry['type']) || 'buy_hub',
    hubId: typeof data.hubId === 'string' ? (data.hubId as TradeHubId) : null,
    itemId: typeof data.itemId === 'string' ? (data.itemId as TradeGoodId) : null,
    quantity: Math.max(0, Math.round(Number(data.quantity) || 0)),
    unitPrice: Math.max(0, Math.round(Number(data.unitPrice) || 0)),
    totalCoins: Math.round(Number(data.totalCoins) || 0),
    feeCoins: Math.max(0, Math.round(Number(data.feeCoins) || 0)),
    profitDelta: Math.round(Number(data.profitDelta) || 0),
    balanceAfter: Math.max(0, Math.round(Number(data.balanceAfter) || 0)),
    counterpartyName: sanitizeDisplayStr(data.counterpartyName, 'Efeler Pazarı', 48),
    note: sanitizeDisplayStr(data.note, 'Ticaret işlemi', 160),
    createdAtMs: timestampToMs(data.createdAt),
  };
}

function buildLedgerFirestoreDoc(uid: string, entry: Omit<TradeLedgerEntry, 'uid'>) {
  return {
    id: entry.id.slice(0, 128),
    uid,
    idempotencyKey: entry.idempotencyKey.slice(0, 64),
    type: entry.type,
    hubId: entry.hubId,
    itemId: entry.itemId,
    quantity: Math.max(0, Math.min(999, Math.round(entry.quantity))),
    unitPrice: Math.max(0, Math.min(100000, Math.round(entry.unitPrice))),
    totalCoins: Math.max(-1000000, Math.min(1000000, Math.round(entry.totalCoins))),
    feeCoins: Math.max(0, Math.min(100000, Math.round(entry.feeCoins))),
    profitDelta: Math.max(-1000000, Math.min(1000000, Math.round(entry.profitDelta))),
    balanceAfter: Math.max(0, Math.min(1000000, Math.round(entry.balanceAfter))),
    counterpartyName: sanitizeDisplayStr(entry.counterpartyName, 'Efeler Pazarı', 48),
    note: sanitizeDisplayStr(entry.note, 'Ticaret işlemi', 160),
    createdAt: serverTimestamp(),
  };
}

// ---------- Local Fallback Storage (Guest / Offline Preview) ----------

export function loadLocalListings(): MarketListing[] {
  try {
    const raw = localStorage.getItem(LOCAL_LISTINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalListings(listings: MarketListing[]): void {
  try {
    localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(listings.slice(0, 80)));
  } catch {
    // Ignore quota errors
  }
}

export function loadLocalLedger(): TradeLedgerEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TradeLedgerEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalLedger(entries: TradeLedgerEntry[]): void {
  try {
    localStorage.setItem(LOCAL_LEDGER_KEY, JSON.stringify(entries.slice(0, 60)));
  } catch {
    // Ignore quota errors
  }
}

// ---------- Live Firestore Online Subscriptions ----------

export function subscribeOnlineMarketListings(
  uid: string,
  onChange: (listings: MarketListing[]) => void,
  onError?: (message: string) => void
): () => void {
  const openMap = new Map<string, MarketListing>();
  const mineMap = new Map<string, MarketListing>();
  const boughtMap = new Map<string, MarketListing>();

  const emitMerged = () => {
    const merged = new Map<string, MarketListing>();
    for (const [k, v] of openMap) merged.set(k, v);
    for (const [k, v] of mineMap) merged.set(k, v);
    for (const [k, v] of boughtMap) merged.set(k, v);
    const list = Array.from(merged.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
    onChange(list);
  };

  const listingsCol = collection(db, 'marketListings');

  const unsubOpen = onSnapshot(
    query(listingsCol, where('status', '==', 'open'), limit(50)),
    (snap) => {
      openMap.clear();
      snap.forEach((d) => {
        const parsed = parseFirestoreListing(d.id, d.data() as Record<string, unknown>);
        if (parsed) openMap.set(d.id, parsed);
      });
      emitMerged();
    },
    (err) => {
      onError?.('Açık ilanlar yüklenirken bağlantı hatası oluştu.');
      try {
        handleFirestoreError(err, OperationType.LIST, 'marketListings');
      } catch {
        // Logged via handleFirestoreError; surfaced through onError callback
      }
    }
  );

  const unsubMine = onSnapshot(
    query(listingsCol, where('sellerUid', '==', uid), limit(30)),
    (snap) => {
      mineMap.clear();
      snap.forEach((d) => {
        const parsed = parseFirestoreListing(d.id, d.data() as Record<string, unknown>);
        if (parsed) mineMap.set(d.id, parsed);
      });
      emitMerged();
    },
    (err) => {
      onError?.('Kendi ilanlarınız dinlenirken hata oluştu.');
      try {
        handleFirestoreError(err, OperationType.LIST, 'marketListings');
      } catch {
        // Logged
      }
    }
  );

  const unsubBought = onSnapshot(
    query(listingsCol, where('buyerUid', '==', uid), limit(30)),
    (snap) => {
      boughtMap.clear();
      snap.forEach((d) => {
        const parsed = parseFirestoreListing(d.id, d.data() as Record<string, unknown>);
        if (parsed) boughtMap.set(d.id, parsed);
      });
      emitMerged();
    },
    (err) => {
      onError?.('Satın aldığınız ilanlar dinlenirken hata oluştu.');
      try {
        handleFirestoreError(err, OperationType.LIST, 'marketListings');
      } catch {
        // Logged
      }
    }
  );

  return () => {
    unsubOpen();
    unsubMine();
    unsubBought();
  };
}

export function subscribeOnlineTradeLedger(
  uid: string,
  onChange: (entries: TradeLedgerEntry[]) => void,
  onError?: (message: string) => void
): () => void {
  const path = `users/${uid}/tradeLedger`;
  const ledgerQuery = query(collection(db, 'users', uid, 'tradeLedger'), where('uid', '==', uid), limit(50));

  return onSnapshot(
    ledgerQuery,
    (snap) => {
      const items: TradeLedgerEntry[] = [];
      snap.forEach((d) => {
        items.push(parseFirestoreLedger(d.id, d.data() as Record<string, unknown>));
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onChange(items);
    },
    (err) => {
      onError?.('İşlem defteri senkronize edilemedi.');
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch {
        // Logged
      }
    }
  );
}

// ---------- Atomic Firestore Online Mutations ----------

export async function commitOnlineHubTrade(input: CommitProfileAndLedgerInput): Promise<void> {
  const userRef = doc(db, 'users', input.uid);
  const ledgerRef = doc(db, 'users', input.uid, 'tradeLedger', input.ledgerEntry.id);
  const path = `users/${input.uid}/tradeLedger/${input.ledgerEntry.id}`;

  try {
    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('Bulut profiliniz henüz hazır değil; lütfen birkaç saniye sonra tekrar deneyin.');
      }
      tx.update(userRef, {
        coins: input.nextCoins,
        tradeProfile: input.nextTradeProfile,
        updatedAt: serverTimestamp(),
      });
      tx.set(ledgerRef, buildLedgerFirestoreDoc(input.uid, input.ledgerEntry));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOnlineEscrowListing(input: CreateListingInput): Promise<void> {
  const userRef = doc(db, 'users', input.sellerUid);
  const listingRef = doc(db, 'marketListings', input.listingId);
  const ledgerRef = doc(db, 'users', input.sellerUid, 'tradeLedger', input.ledgerEntry.id);
  const path = `marketListings/${input.listingId}`;

  const totalPrice = input.quantity * input.unitPrice;
  const cleanName = sanitizeDisplayStr(input.sellerName, 'Efeler Tüccarı', 40);
  const cleanEmoji = sanitizeDisplayStr(input.sellerEmoji, '🏡', 12);

  try {
    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('İlan açmak için bulut profiliniz aktif olmalıdır.');
      }
      tx.update(userRef, {
        coins: input.nextCoins,
        tradeProfile: input.nextTradeProfile,
        updatedAt: serverTimestamp(),
      });
      tx.set(listingRef, {
        id: input.listingId,
        sellerUid: input.sellerUid,
        sellerName: cleanName,
        sellerEmoji: cleanEmoji,
        hubId: input.hubId,
        itemId: input.itemId,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalPrice,
        feeCoins: input.feeCoins,
        status: 'open',
        buyerUid: null,
        buyerName: null,
        claimedBySeller: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.set(ledgerRef, buildLedgerFirestoreDoc(input.sellerUid, input.ledgerEntry));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelOnlineEscrowListing(input: CancelListingInput): Promise<void> {
  const userRef = doc(db, 'users', input.sellerUid);
  const listingRef = doc(db, 'marketListings', input.listingId);
  const ledgerRef = doc(db, 'users', input.sellerUid, 'tradeLedger', input.ledgerEntry.id);
  const path = `marketListings/${input.listingId}`;

  try {
    await runTransaction(db, async (tx) => {
      const listingSnap = await tx.get(listingRef);
      if (!listingSnap.exists()) {
        throw new Error('İlan bulunamadı.');
      }
      const data = listingSnap.data() as Record<string, unknown>;
      if (data.status !== 'open' || data.sellerUid !== input.sellerUid) {
        throw new Error('Bu ilan zaten satıldı veya iptal edildi.');
      }
      tx.update(listingRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      tx.update(userRef, {
        coins: input.nextCoins,
        tradeProfile: input.nextTradeProfile,
        updatedAt: serverTimestamp(),
      });
      tx.set(ledgerRef, buildLedgerFirestoreDoc(input.sellerUid, input.ledgerEntry));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fillOnlineEscrowListing(input: FillListingInput): Promise<void> {
  const userRef = doc(db, 'users', input.buyerUid);
  const listingRef = doc(db, 'marketListings', input.listingId);
  const ledgerRef = doc(db, 'users', input.buyerUid, 'tradeLedger', input.ledgerEntry.id);
  const path = `marketListings/${input.listingId}`;

  const cleanBuyerName = sanitizeDisplayStr(input.buyerName, 'Efeler Alıcısı', 40);

  try {
    await runTransaction(db, async (tx) => {
      const [listingSnap, userSnap] = await Promise.all([tx.get(listingRef), tx.get(userRef)]);
      if (!listingSnap.exists()) {
        throw new Error('İlan bulunamadı.');
      }
      if (!userSnap.exists()) {
        throw new Error('Satın alım için bulut profiliniz hazır olmalıdır.');
      }
      const data = listingSnap.data() as Record<string, unknown>;
      if (data.status !== 'open') {
        throw new Error('Bu ilan az önce başka bir oyuncu tarafından satın alındı.');
      }
      if (data.sellerUid === input.buyerUid) {
        throw new Error('Kendi ilanınızı satın alamazsınız.');
      }
      tx.update(listingRef, {
        status: 'sold',
        buyerUid: input.buyerUid,
        buyerName: cleanBuyerName,
        updatedAt: serverTimestamp(),
      });
      tx.update(userRef, {
        coins: input.nextCoins,
        tradeProfile: input.nextTradeProfile,
        updatedAt: serverTimestamp(),
      });
      tx.set(ledgerRef, buildLedgerFirestoreDoc(input.buyerUid, input.ledgerEntry));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function claimOnlineEscrowProceeds(input: ClaimProceedsInput): Promise<void> {
  const userRef = doc(db, 'users', input.sellerUid);
  const listingRef = doc(db, 'marketListings', input.listingId);
  const ledgerRef = doc(db, 'users', input.sellerUid, 'tradeLedger', input.ledgerEntry.id);
  const path = `marketListings/${input.listingId}`;

  try {
    await runTransaction(db, async (tx) => {
      const listingSnap = await tx.get(listingRef);
      if (!listingSnap.exists()) {
        throw new Error('İlan kaydı bulunamadı.');
      }
      const data = listingSnap.data() as Record<string, unknown>;
      if (
        data.status !== 'sold' ||
        data.sellerUid !== input.sellerUid ||
        data.claimedBySeller === true
      ) {
        throw new Error('Bu satışın geliri zaten tahsil edildi.');
      }
      tx.update(listingRef, {
        status: 'claimed',
        claimedBySeller: true,
        updatedAt: serverTimestamp(),
      });
      tx.update(userRef, {
        coins: input.nextCoins,
        tradeProfile: input.nextTradeProfile,
        updatedAt: serverTimestamp(),
      });
      tx.set(ledgerRef, buildLedgerFirestoreDoc(input.sellerUid, input.ledgerEntry));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function appendStandaloneLedgerEntry(
  uid: string,
  entry: Omit<TradeLedgerEntry, 'uid'>
): Promise<void> {
  const path = `users/${uid}/tradeLedger/${entry.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'tradeLedger', entry.id), buildLedgerFirestoreDoc(uid, entry));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
