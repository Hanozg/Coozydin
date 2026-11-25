import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  calculateListingFee,
  applyTradeCommand,
  computeHubQuotes,
  createCommandId,
  getActiveContractsForEpoch,
  getCargoCapacityKg,
  getCargoUsedKg,
  getMarketEpoch,
  getNextEpochCountdownSeconds,
} from '../game/tradeEngine';
import {
  REMOTE_TRADE_DELIVERY_SURCHARGE,
  TRADE_HUB_MAP,
  TRADE_HUBS,
} from '../data/tradeCatalog';
import {
  cancelOnlineEscrowListing,
  claimOnlineEscrowProceeds,
  commitOnlineHubTrade,
  createOnlineEscrowListing,
  fillOnlineEscrowListing,
  loadLocalLedger,
  loadLocalListings,
  saveLocalLedger,
  saveLocalListings,
  subscribeOnlineMarketListings,
  subscribeOnlineTradeLedger,
} from '../services/tradeService';
import { ExplorationMode, SeasonType, VehicleType } from '../types/game';
import {
  MarketListing,
  MarketQuote,
  TradeCommand,
  TradeContractDef,
  TradeGoodId,
  TradeHubId,
  TradeLedgerEntry,
  TradeProfileState,
} from '../types/trade';

export interface UseTradeSystemOptions {
  firebaseUser: User | null;
  displayName: string;
  avatarEmoji: string;
  coins: number;
  setCoins: (next: number) => void;
  tradeProfile: TradeProfileState;
  setTradeProfile: (next: TradeProfileState) => void;
  season: SeasonType;
  explorationMode: ExplorationMode;
  vehicleType: VehicleType;
  nearbyHubId: TradeHubId | null;
  onNotify?: (message: string) => void;
}

export interface TradeActionOutcome {
  ok: boolean;
  message: string;
}

export function useTradeSystem({
  firebaseUser,
  displayName,
  avatarEmoji,
  coins,
  setCoins,
  tradeProfile,
  setTradeProfile,
  season,
  explorationMode,
  vehicleType,
  nearbyHubId,
  onNotify,
}: UseTradeSystemOptions) {
  const isOnlineMode = Boolean(firebaseUser && firebaseUser.emailVerified);
  const activeUid = firebaseUser?.uid ?? 'local_player';

  const [marketEpoch, setMarketEpoch] = useState<number>(() => getMarketEpoch());
  const [epochCountdownSec, setEpochCountdownSec] = useState<number>(() =>
    getNextEpochCountdownSeconds()
  );
  const [supplyPressureByKey, setSupplyPressureByKey] = useState<Record<string, number>>({});
  const [listings, setListings] = useState<MarketListing[]>(() => loadLocalListings());
  const [ledgerEntries, setLedgerEntries] = useState<TradeLedgerEntry[]>(() => loadLocalLedger());
  const [busyAction, setBusyAction] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const stateRef = useRef({ coins, tradeProfile });
  stateRef.current = { coins, tradeProfile };

  // Deterministic 5-minute market epoch ticker (synchronized globally by UTC epoch)
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const nextEpoch = getMarketEpoch(now);
      setEpochCountdownSec(getNextEpochCountdownSeconds(now));
      setMarketEpoch((prev) => {
        if (prev !== nextEpoch) {
          // Reset local supply pressure when a new market epoch begins
          setSupplyPressureByKey({});
          return nextEpoch;
        }
        return prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Subscribe to live Firestore marketListings & tradeLedger when authenticated
  useEffect(() => {
    if (!firebaseUser) {
      setListings(loadLocalListings());
      setLedgerEntries(loadLocalLedger());
      setSyncError(null);
      return;
    }

    setSyncError(null);
    const unsubListings = subscribeOnlineMarketListings(
      firebaseUser.uid,
      (nextListings) => {
        setListings(nextListings);
      },
      (msg) => setSyncError(msg)
    );
    const unsubLedger = subscribeOnlineTradeLedger(
      firebaseUser.uid,
      (nextLedger) => {
        setLedgerEntries(nextLedger);
      },
      (msg) => setSyncError(msg)
    );

    return () => {
      unsubListings();
      unsubLedger();
    };
  }, [firebaseUser]);

  const quotesByHub = useMemo<Record<TradeHubId, MarketQuote[]>>(() => {
    const map = {} as Record<TradeHubId, MarketQuote[]>;
    for (const hub of TRADE_HUBS) {
      map[hub.id] = computeHubQuotes(hub.id, season, marketEpoch, supplyPressureByKey);
    }
    return map;
  }, [marketEpoch, season, supplyPressureByKey]);

  const activeContracts = useMemo<TradeContractDef[]>(
    () => getActiveContractsForEpoch(marketEpoch),
    [marketEpoch]
  );

  const cargoCapacityKg = useMemo(
    () => getCargoCapacityKg(explorationMode, vehicleType, tradeProfile.cargoTier),
    [explorationMode, tradeProfile.cargoTier, vehicleType]
  );

  const cargoUsedKg = useMemo(
    () => getCargoUsedKg(tradeProfile.inventory),
    [tradeProfile.inventory]
  );

  const openMarketListings = useMemo(
    () => listings.filter((l) => l.status === 'open'),
    [listings]
  );

  const myListings = useMemo(
    () => listings.filter((l) => l.sellerUid === activeUid),
    [activeUid, listings]
  );

  const unclaimedProceedsListings = useMemo(
    () =>
      listings.filter(
        (l) => l.sellerUid === activeUid && l.status === 'sold' && !l.claimedBySeller
      ),
    [activeUid, listings]
  );

  const recordLocalLedger = useCallback(
    (entry: Omit<TradeLedgerEntry, 'uid'>) => {
      const full: TradeLedgerEntry = { ...entry, uid: activeUid };
      setLedgerEntries((prev) => {
        const next = [full, ...prev.filter((e) => e.id !== full.id)].slice(0, 60);
        saveLocalLedger(next);
        return next;
      });
    },
    [activeUid]
  );

  const executeStandardCommand = useCallback(
    async (
      command: TradeCommand,
      pressureUpdate?: { key: string; delta: number }
    ): Promise<TradeActionOutcome> => {
      const result = applyTradeCommand(stateRef.current, command, {
        supplyPressureByKey,
      });
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const prevCoins = stateRef.current.coins;
      const prevProfile = stateRef.current.tradeProfile;

      // Optimistic local state update
      setCoins(result.nextState.coins);
      setTradeProfile(result.nextState.tradeProfile);
      if (pressureUpdate) {
        setSupplyPressureByKey((prev) => ({
          ...prev,
          [pressureUpdate.key]: Math.max(
            -10,
            Math.min(10, (prev[pressureUpdate.key] ?? 0) + pressureUpdate.delta)
          ),
        }));
      }

      if (isOnlineMode && firebaseUser) {
        setBusyAction(true);
        try {
          await commitOnlineHubTrade({
            uid: firebaseUser.uid,
            nextCoins: result.nextState.coins,
            nextTradeProfile: result.nextState.tradeProfile,
            ledgerEntry: result.ledgerEntry,
          });
          setSyncError(null);
        } catch {
          // Rollback optimistic mutation if atomic Firestore transaction fails
          setCoins(prevCoins);
          setTradeProfile(prevProfile);
          setBusyAction(false);
          const msg = 'Bulut ticaret işlemi doğrulanamadı; bakiye güvenli şekilde geri alındı.';
          setSyncError(msg);
          return { ok: false, message: msg };
        } finally {
          setBusyAction(false);
        }
      } else {
        recordLocalLedger(result.ledgerEntry);
      }

      onNotify?.(result.message);
      return { ok: true, message: result.message };
    },
    [
      firebaseUser,
      isOnlineMode,
      onNotify,
      recordLocalLedger,
      setCoins,
      setTradeProfile,
      supplyPressureByKey,
    ]
  );

  const claimStarterGrant = useCallback(async (): Promise<TradeActionOutcome> => {
    return executeStandardCommand({
      type: 'CLAIM_STARTER_GRANT',
      idempotencyKey: createCommandId('grant'),
      expectedVersion: stateRef.current.tradeProfile.version,
    });
  }, [executeStandardCommand]);

  const buyFromHub = useCallback(
    async (
      hubId: TradeHubId,
      itemId: TradeGoodId,
      quantity: number,
      quotedUnitPrice: number
    ): Promise<TradeActionOutcome> => {
      const isInPerson = nearbyHubId === hubId;
      const remoteFeeRate = isInPerson ? 0 : REMOTE_TRADE_DELIVERY_SURCHARGE;
      const expectedMaxPrice = Math.round(quotedUnitPrice * (1 + remoteFeeRate));
      return executeStandardCommand(
        {
          type: 'BUY_FROM_HUB',
          idempotencyKey: createCommandId('buy'),
          expectedVersion: stateRef.current.tradeProfile.version,
          hubId,
          itemId,
          quantity,
          maxUnitPrice: expectedMaxPrice,
          epoch: marketEpoch,
          season,
          explorationMode,
          vehicleType,
          remoteDeliveryFeeRate: remoteFeeRate,
        },
        { key: `${hubId}:${itemId}`, delta: -quantity }
      );
    },
    [executeStandardCommand, explorationMode, marketEpoch, nearbyHubId, season, vehicleType]
  );

  const sellToHub = useCallback(
    async (
      hubId: TradeHubId,
      itemId: TradeGoodId,
      quantity: number,
      quotedSellPrice: number
    ): Promise<TradeActionOutcome> => {
      return executeStandardCommand(
        {
          type: 'SELL_TO_HUB',
          idempotencyKey: createCommandId('sell'),
          expectedVersion: stateRef.current.tradeProfile.version,
          hubId,
          itemId,
          quantity,
          minUnitPrice: quotedSellPrice,
          epoch: marketEpoch,
          season,
        },
        { key: `${hubId}:${itemId}`, delta: quantity }
      );
    },
    [executeStandardCommand, marketEpoch, season]
  );

  const completeContract = useCallback(
    async (contractKey: string): Promise<TradeActionOutcome> => {
      return executeStandardCommand({
        type: 'COMPLETE_CONTRACT',
        idempotencyKey: createCommandId('ctr'),
        expectedVersion: stateRef.current.tradeProfile.version,
        contractKey,
        epoch: marketEpoch,
      });
    },
    [executeStandardCommand, marketEpoch]
  );

  const upgradeMerchantTier = useCallback(async (): Promise<TradeActionOutcome> => {
    return executeStandardCommand({
      type: 'UPGRADE_MERCHANT_TIER',
      idempotencyKey: createCommandId('tier'),
      expectedVersion: stateRef.current.tradeProfile.version,
    });
  }, [executeStandardCommand]);

  const createP2PListing = useCallback(
    async (
      hubId: TradeHubId,
      itemId: TradeGoodId,
      quantity: number,
      unitPrice: number
    ): Promise<TradeActionOutcome> => {
      const listingId = createCommandId('lst');
      const idempotencyKey = createCommandId('elock');
      const result = applyTradeCommand(stateRef.current, {
        type: 'ESCROW_LOCK_FOR_LISTING',
        idempotencyKey,
        expectedVersion: stateRef.current.tradeProfile.version,
        hubId,
        itemId,
        quantity,
        unitPrice,
        listingId,
      });
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const prevCoins = stateRef.current.coins;
      const prevProfile = stateRef.current.tradeProfile;
      const feeCoins = calculateListingFee(quantity * unitPrice, prevProfile.cargoTier);

      setCoins(result.nextState.coins);
      setTradeProfile(result.nextState.tradeProfile);

      if (isOnlineMode && firebaseUser) {
        setBusyAction(true);
        try {
          await createOnlineEscrowListing({
            listingId,
            sellerUid: firebaseUser.uid,
            sellerName: displayName,
            sellerEmoji: avatarEmoji,
            hubId,
            itemId,
            quantity,
            unitPrice,
            feeCoins,
            nextCoins: result.nextState.coins,
            nextTradeProfile: result.nextState.tradeProfile,
            ledgerEntry: result.ledgerEntry,
          });
          setSyncError(null);
        } catch {
          setCoins(prevCoins);
          setTradeProfile(prevProfile);
          const msg = 'Online ilan oluşturulamadı; ürün kargona iade edildi.';
          setSyncError(msg);
          return { ok: false, message: msg };
        } finally {
          setBusyAction(false);
        }
      } else {
        const now = Date.now();
        const localListing: MarketListing = {
          id: listingId,
          sellerUid: activeUid,
          sellerName: displayName,
          sellerEmoji: avatarEmoji,
          hubId,
          itemId,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          feeCoins,
          status: 'open',
          buyerUid: null,
          buyerName: null,
          claimedBySeller: false,
          createdAtMs: now,
          updatedAtMs: now,
          source: 'local',
        };
        setListings((prev) => {
          const next = [localListing, ...prev];
          saveLocalListings(next);
          return next;
        });
        recordLocalLedger(result.ledgerEntry);
      }

      onNotify?.(result.message);
      return { ok: true, message: result.message };
    },
    [
      activeUid,
      avatarEmoji,
      displayName,
      firebaseUser,
      isOnlineMode,
      onNotify,
      recordLocalLedger,
      setCoins,
      setTradeProfile,
    ]
  );

  const cancelP2PListing = useCallback(
    async (listing: MarketListing): Promise<TradeActionOutcome> => {
      if (listing.status !== 'open' || listing.sellerUid !== activeUid) {
        return { ok: false, message: 'Bu ilan iptal edilemez.' };
      }

      const result = applyTradeCommand(stateRef.current, {
        type: 'ESCROW_REFUND_FROM_CANCEL',
        idempotencyKey: createCommandId('ecancel'),
        expectedVersion: stateRef.current.tradeProfile.version,
        hubId: listing.hubId,
        itemId: listing.itemId,
        quantity: listing.quantity,
        unitPrice: listing.unitPrice,
        listingId: listing.id,
      });
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const prevCoins = stateRef.current.coins;
      const prevProfile = stateRef.current.tradeProfile;
      setCoins(result.nextState.coins);
      setTradeProfile(result.nextState.tradeProfile);

      if (isOnlineMode && firebaseUser && listing.source === 'firestore') {
        setBusyAction(true);
        try {
          await cancelOnlineEscrowListing({
            listingId: listing.id,
            sellerUid: firebaseUser.uid,
            nextCoins: result.nextState.coins,
            nextTradeProfile: result.nextState.tradeProfile,
            ledgerEntry: result.ledgerEntry,
          });
          setSyncError(null);
        } catch {
          setCoins(prevCoins);
          setTradeProfile(prevProfile);
          const msg = 'İlan iptal edilemedi (az önce satılmış olabilir).';
          setSyncError(msg);
          return { ok: false, message: msg };
        } finally {
          setBusyAction(false);
        }
      } else {
        setListings((prev) => {
          const next = prev.map((l) =>
            l.id === listing.id ? { ...l, status: 'cancelled' as const, updatedAtMs: Date.now() } : l
          );
          saveLocalListings(next);
          return next;
        });
        recordLocalLedger(result.ledgerEntry);
      }

      onNotify?.(result.message);
      return { ok: true, message: result.message };
    },
    [
      activeUid,
      firebaseUser,
      isOnlineMode,
      onNotify,
      recordLocalLedger,
      setCoins,
      setTradeProfile,
    ]
  );

  const buyP2PListing = useCallback(
    async (listing: MarketListing): Promise<TradeActionOutcome> => {
      if (listing.status !== 'open') {
        return { ok: false, message: 'Bu ilan artık açık değil.' };
      }
      if (listing.sellerUid === activeUid) {
        return { ok: false, message: 'Kendi ilanını satın alamazsın.' };
      }

      const result = applyTradeCommand(stateRef.current, {
        type: 'SETTLE_P2P_PURCHASE',
        idempotencyKey: createCommandId('ebuy'),
        expectedVersion: stateRef.current.tradeProfile.version,
        hubId: listing.hubId,
        itemId: listing.itemId,
        quantity: listing.quantity,
        unitPrice: listing.unitPrice,
        totalPrice: listing.totalPrice,
        sellerName: listing.sellerName,
        listingId: listing.id,
        explorationMode,
        vehicleType,
      });
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const prevCoins = stateRef.current.coins;
      const prevProfile = stateRef.current.tradeProfile;
      setCoins(result.nextState.coins);
      setTradeProfile(result.nextState.tradeProfile);

      if (isOnlineMode && firebaseUser && listing.source === 'firestore') {
        setBusyAction(true);
        try {
          await fillOnlineEscrowListing({
            listingId: listing.id,
            buyerUid: firebaseUser.uid,
            buyerName: displayName,
            nextCoins: result.nextState.coins,
            nextTradeProfile: result.nextState.tradeProfile,
            ledgerEntry: result.ledgerEntry,
          });
          setSyncError(null);
        } catch {
          setCoins(prevCoins);
          setTradeProfile(prevProfile);
          const msg = 'İlan satın alınamadı (başka bir oyuncu az önce almış olabilir).';
          setSyncError(msg);
          return { ok: false, message: msg };
        } finally {
          setBusyAction(false);
        }
      } else {
        setListings((prev) => {
          const next = prev.map((l) =>
            l.id === listing.id
              ? {
                  ...l,
                  status: 'sold' as const,
                  buyerUid: activeUid,
                  buyerName: displayName,
                  updatedAtMs: Date.now(),
                }
              : l
          );
          saveLocalListings(next);
          return next;
        });
        recordLocalLedger(result.ledgerEntry);
      }

      onNotify?.(result.message);
      return { ok: true, message: result.message };
    },
    [
      activeUid,
      displayName,
      explorationMode,
      firebaseUser,
      isOnlineMode,
      onNotify,
      recordLocalLedger,
      setCoins,
      setTradeProfile,
      vehicleType,
    ]
  );

  const claimP2PProceeds = useCallback(
    async (listing: MarketListing): Promise<TradeActionOutcome> => {
      if (listing.status !== 'sold' || listing.sellerUid !== activeUid || listing.claimedBySeller) {
        return { ok: false, message: 'Bu satışın tahsilatı zaten yapıldı.' };
      }
      const netProceeds = Math.max(0, listing.totalPrice - listing.feeCoins);
      const result = applyTradeCommand(stateRef.current, {
        type: 'CLAIM_P2P_PROCEEDS',
        idempotencyKey: createCommandId('eclaim'),
        expectedVersion: stateRef.current.tradeProfile.version,
        hubId: listing.hubId,
        itemId: listing.itemId,
        quantity: listing.quantity,
        netProceeds,
        feeCoins: listing.feeCoins,
        buyerName: listing.buyerName || 'Online Tüccar',
        listingId: listing.id,
      });
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const prevCoins = stateRef.current.coins;
      const prevProfile = stateRef.current.tradeProfile;
      setCoins(result.nextState.coins);
      setTradeProfile(result.nextState.tradeProfile);

      if (isOnlineMode && firebaseUser && listing.source === 'firestore') {
        setBusyAction(true);
        try {
          await claimOnlineEscrowProceeds({
            listingId: listing.id,
            sellerUid: firebaseUser.uid,
            nextCoins: result.nextState.coins,
            nextTradeProfile: result.nextState.tradeProfile,
            ledgerEntry: result.ledgerEntry,
          });
          setSyncError(null);
        } catch {
          setCoins(prevCoins);
          setTradeProfile(prevProfile);
          const msg = 'Tahsilat kasasından aktarım başarısız oldu.';
          setSyncError(msg);
          return { ok: false, message: msg };
        } finally {
          setBusyAction(false);
        }
      } else {
        setListings((prev) => {
          const next = prev.map((l) =>
            l.id === listing.id
              ? { ...l, status: 'claimed' as const, claimedBySeller: true, updatedAtMs: Date.now() }
              : l
          );
          saveLocalListings(next);
          return next;
        });
        recordLocalLedger(result.ledgerEntry);
      }

      onNotify?.(result.message);
      return { ok: true, message: result.message };
    },
    [
      activeUid,
      firebaseUser,
      isOnlineMode,
      onNotify,
      recordLocalLedger,
      setCoins,
      setTradeProfile,
    ]
  );

  const nearbyHub = nearbyHubId ? TRADE_HUB_MAP[nearbyHubId] : null;

  return {
    isOnlineMode,
    activeUid,
    marketEpoch,
    epochCountdownSec,
    quotesByHub,
    supplyPressureByKey,
    activeContracts,
    cargoCapacityKg,
    cargoUsedKg,
    nearbyHub,
    openMarketListings,
    myListings,
    unclaimedProceedsListings,
    ledgerEntries,
    busyAction,
    syncError,
    claimStarterGrant,
    buyFromHub,
    sellToHub,
    completeContract,
    upgradeMerchantTier,
    createP2PListing,
    cancelP2PListing,
    buyP2PListing,
    claimP2PProceeds,
  };
}
