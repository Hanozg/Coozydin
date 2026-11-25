import {
  DEFAULT_TRADE_PROFILE,
  getMerchantTierDef,
  MARKET_EPOCH_DURATION_MS,
  MAX_LISTING_QUANTITY,
  MAX_LISTING_UNIT_PRICE,
  MERCHANT_TIERS,
  STARTER_TRADE_GRANT_COINS,
  TRADE_GOOD_MAP,
  TRADE_GOODS,
  TRADE_HUB_MAP,
  TRADE_HUBS,
} from '../data/tradeCatalog';
import { ExplorationMode, SeasonType, VehicleType } from '../types/game';
import {
  MarketQuote,
  TradeAccountState,
  TradeCommand,
  TradeContractDef,
  TradeExecutionResult,
  TradeGoodId,
  TradeHubId,
  TradeInventorySlot,
  TradeProfileState,
} from '../types/trade';

const MAX_RECENT_COMMAND_IDS = 32;
const MAX_COMPLETED_CONTRACT_KEYS = 40;
const MAX_COINS = 1_000_000;

/**
 * Deterministic 32-bit FNV-1a hash so every online client / future server computes
 * identical base market quotes for the same (epoch, hubId, itemId) tuple.
 */
function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic pseudo-random float in [-1, 1] */
function deterministicWave(seed: string): number {
  const h = hashSeed(seed);
  return (h / 0xffffffff) * 2 - 1;
}

export function getMarketEpoch(nowMs: number = Date.now()): number {
  return Math.max(1, Math.floor(nowMs / MARKET_EPOCH_DURATION_MS));
}

export function getNextEpochCountdownSeconds(nowMs: number = Date.now()): number {
  const elapsed = nowMs % MARKET_EPOCH_DURATION_MS;
  return Math.max(1, Math.ceil((MARKET_EPOCH_DURATION_MS - elapsed) / 1000));
}

export function createCommandId(prefix = 'op'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function sanitizeTradeProfile(raw?: Partial<TradeProfileState> | null): TradeProfileState {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_TRADE_PROFILE,
      inventory: [],
      completedContractKeys: [],
      recentCommandIds: [],
    };
  }

  const clampInt = (val: unknown, min: number, max: number, fallback: number): number => {
    const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : fallback;
    return Math.max(min, Math.min(max, n));
  };

  const mergedInventory = new Map<TradeGoodId, TradeInventorySlot>();
  if (Array.isArray(raw.inventory)) {
    for (const slot of raw.inventory) {
      if (!slot || typeof slot.itemId !== 'string') continue;
      if (!(slot.itemId in TRADE_GOOD_MAP)) continue;
      const itemId = slot.itemId as TradeGoodId;
      const qty = clampInt(slot.quantity, 0, 999, 0);
      if (qty <= 0) continue;
      const fallbackCost = TRADE_GOOD_MAP[itemId].basePrice;
      const avgUnitCost = clampInt(slot.avgUnitCost, 1, MAX_LISTING_UNIT_PRICE, fallbackCost);
      const prev = mergedInventory.get(itemId);
      if (prev) {
        const nextQty = Math.min(999, prev.quantity + qty);
        const weighted = Math.round(
          (prev.quantity * prev.avgUnitCost + qty * avgUnitCost) / Math.max(1, nextQty)
        );
        mergedInventory.set(itemId, { itemId, quantity: nextQty, avgUnitCost: weighted });
      } else {
        mergedInventory.set(itemId, { itemId, quantity: qty, avgUnitCost });
      }
    }
  }

  const sanitizeStrings = (arr: unknown, maxItems: number, maxLen: number): string[] => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of arr) {
      if (typeof item !== 'string') continue;
      const clean = item.trim().slice(0, maxLen);
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      out.push(clean);
      if (out.length >= maxItems) break;
    }
    return out;
  };

  return {
    version: clampInt(raw.version, 1, 10_000_000, 1),
    cargoTier: clampInt(raw.cargoTier, 1, MERCHANT_TIERS.length, 1),
    reputationXp: clampInt(raw.reputationXp, 0, 1_000_000, 0),
    totalTrades: clampInt(raw.totalTrades, 0, 1_000_000, 0),
    totalProfit: clampInt(raw.totalProfit, -1_000_000, 10_000_000, 0),
    starterGrantClaimed: Boolean(raw.starterGrantClaimed),
    inventory: Array.from(mergedInventory.values()).slice(0, 24),
    completedContractKeys: sanitizeStrings(raw.completedContractKeys, MAX_COMPLETED_CONTRACT_KEYS, 48),
    recentCommandIds: sanitizeStrings(raw.recentCommandIds, MAX_RECENT_COMMAND_IDS, 48),
  };
}

export function getVehicleBaseCapacityKg(
  explorationMode: ExplorationMode,
  vehicleType: VehicleType
): number {
  if (explorationMode === 'sparrow') return 8;
  if (explorationMode === 'walk') return 14;
  if (vehicleType === 'bicycle') return 20;
  if (vehicleType === 'motorcycle') return 28;
  return 46; // car
}

export function getCargoCapacityKg(
  explorationMode: ExplorationMode,
  vehicleType: VehicleType,
  cargoTier: number
): number {
  const base = getVehicleBaseCapacityKg(explorationMode, vehicleType);
  const tierDef = getMerchantTierDef(cargoTier);
  return base + tierDef.bonusCapacityKg;
}

export function getCargoUsedKg(inventory: TradeInventorySlot[]): number {
  let total = 0;
  for (const slot of inventory) {
    const good = TRADE_GOOD_MAP[slot.itemId];
    if (good && slot.quantity > 0) {
      total += good.weightKg * slot.quantity;
    }
  }
  return total;
}

function getSeasonalPriceMultiplier(itemId: TradeGoodId, season: SeasonType): number {
  const good = TRADE_GOOD_MAP[itemId];
  if (season === 'summer') {
    if (good.category === 'sahil') return 1.14;
    if (itemId === 'kestane_sekeri') return 0.94;
  } else if (season === 'autumn') {
    if (good.category === 'tarim') return 0.91; // harvest abundance
    if (itemId === 'sultaniye_pekmez') return 1.08;
  } else if (season === 'winter') {
    if (itemId === 'kestane_sekeri' || itemId === 'sultaniye_pekmez') return 1.15;
    if (good.category === 'sahil') return 0.88;
  } else if (season === 'spring') {
    if (itemId === 'ege_lavanta' || itemId === 'yagcilar_baharat') return 1.07;
  }
  return 1.0;
}

/**
 * Computes deterministic ask/bid market quote for a single good at a hub.
 * Optional `supplyPressure` (negative = bought out / scarcer, positive = flooded)
 * lets local or future server-side market pools shift prices dynamically.
 */
export function computeMarketQuote(
  hubId: TradeHubId,
  itemId: TradeGoodId,
  season: SeasonType,
  epoch: number,
  supplyPressure = 0
): MarketQuote {
  const hub = TRADE_HUB_MAP[hubId];
  const good = TRADE_GOOD_MAP[itemId];

  const isSupplySpecialty = hub.supplyGoods.includes(itemId);
  const isDemandSpecialty = hub.demandGoods.includes(itemId);

  const specialtyFactor = isSupplySpecialty ? 0.8 : isDemandSpecialty ? 1.24 : 1.0;
  const seasonFactor = getSeasonalPriceMultiplier(itemId, season);

  const curWave = deterministicWave(`q:${epoch}:${hubId}:${itemId}`);
  const prevWave = deterministicWave(`q:${Math.max(1, epoch - 1)}:${hubId}:${itemId}`);

  const clampedPressure = Math.max(-10, Math.min(10, supplyPressure));
  // Positive supplyPressure means more stock dumped -> lower price; negative means bought -> higher price
  const pressureFactor = 1 - clampedPressure * 0.015;

  const rawMid =
    good.basePrice *
    hub.priceBias *
    specialtyFactor *
    seasonFactor *
    (1 + curWave * good.volatility) *
    pressureFactor;

  const clampedMid = Math.max(good.minPrice, Math.min(good.maxPrice, rawMid));

  // Small 4% bid/ask spread prevents infinite instant buy-sell loop at the same hub
  const buyPrice = Math.max(good.minPrice, Math.round(clampedMid * 1.02));
  const sellPrice = Math.max(
    Math.max(1, Math.round(good.minPrice * 0.85)),
    Math.min(buyPrice - 1, Math.round(clampedMid * 0.96))
  );

  const deltaPercent = Math.round(((clampedMid - good.basePrice) / good.basePrice) * 100);
  const waveDiff = curWave - prevWave;
  const trend: 'up' | 'down' | 'flat' =
    waveDiff > 0.14 ? 'up' : waveDiff < -0.14 ? 'down' : 'flat';

  const maxStock = isSupplySpecialty ? 28 : isDemandSpecialty ? 8 : 16;
  const stockWave = (deterministicWave(`s:${epoch}:${hubId}:${itemId}`) + 1) * 0.5;
  const baseStock = Math.max(2, Math.round(maxStock * (0.45 + stockWave * 0.55)));
  const stock = Math.max(0, Math.min(maxStock + 12, Math.round(baseStock + clampedPressure)));

  return {
    hubId,
    itemId,
    buyPrice,
    sellPrice,
    basePrice: good.basePrice,
    deltaPercent,
    trend,
    stock,
    maxStock,
    isSupplySpecialty,
    isDemandSpecialty,
    epoch,
  };
}

export function computeHubQuotes(
  hubId: TradeHubId,
  season: SeasonType,
  epoch: number,
  supplyPressureByKey?: Record<string, number>
): MarketQuote[] {
  return TRADE_GOODS.map((g) => {
    const key = `${hubId}:${g.id}`;
    const pressure = supplyPressureByKey?.[key] ?? 0;
    return computeMarketQuote(hubId, g.id, season, epoch, pressure);
  });
}

export function findBestSellHubForGood(
  itemId: TradeGoodId,
  season: SeasonType,
  epoch: number,
  supplyPressureByKey?: Record<string, number>
): MarketQuote {
  let best = computeMarketQuote(
    TRADE_HUBS[0].id,
    itemId,
    season,
    epoch,
    supplyPressureByKey?.[`${TRADE_HUBS[0].id}:${itemId}`] ?? 0
  );
  for (let i = 1; i < TRADE_HUBS.length; i++) {
    const hub = TRADE_HUBS[i];
    const q = computeMarketQuote(
      hub.id,
      itemId,
      season,
      epoch,
      supplyPressureByKey?.[`${hub.id}:${itemId}`] ?? 0
    );
    if (q.sellPrice > best.sellPrice) {
      best = q;
    }
  }
  return best;
}

export function findBestBuyHubForGood(
  itemId: TradeGoodId,
  season: SeasonType,
  epoch: number,
  supplyPressureByKey?: Record<string, number>
): MarketQuote {
  let best = computeMarketQuote(
    TRADE_HUBS[0].id,
    itemId,
    season,
    epoch,
    supplyPressureByKey?.[`${TRADE_HUBS[0].id}:${itemId}`] ?? 0
  );
  for (let i = 1; i < TRADE_HUBS.length; i++) {
    const hub = TRADE_HUBS[i];
    const q = computeMarketQuote(
      hub.id,
      itemId,
      season,
      epoch,
      supplyPressureByKey?.[`${hub.id}:${itemId}`] ?? 0
    );
    if (q.buyPrice < best.buyPrice) {
      best = q;
    }
  }
  return best;
}

/**
 * Generates 3 deterministic regional delivery contracts for the active epoch window.
 * Because contracts depend purely on `epoch`, online players receive synchronized guild boards.
 */
export function getActiveContractsForEpoch(epoch: number): TradeContractDef[] {
  // Rotate contracts every 3 epochs (~15 minutes) so players have ample time to deliver
  const contractCycle = Math.max(1, Math.floor(epoch / 3));
  const contracts: TradeContractDef[] = [];
  const usedHubs = new Set<TradeHubId>();

  for (let idx = 0; idx < 3; idx++) {
    const hubSeed = hashSeed(`contract_hub:${contractCycle}:${idx}`);
    let hub = TRADE_HUBS[hubSeed % TRADE_HUBS.length];
    for (let shift = 0; shift < TRADE_HUBS.length && usedHubs.has(hub.id); shift++) {
      hub = TRADE_HUBS[(hubSeed + shift) % TRADE_HUBS.length];
    }
    usedHubs.add(hub.id);

    const demandPool = hub.demandGoods.length > 0 ? hub.demandGoods : TRADE_GOODS.map((g) => g.id);
    const goodSeed = hashSeed(`contract_good:${contractCycle}:${idx}`);
    const itemId = demandPool[goodSeed % demandPool.length];
    const good = TRADE_GOOD_MAP[itemId];

    const qtySeed = hashSeed(`contract_qty:${contractCycle}:${idx}`);
    const requiredQty = good.weightKg >= 3 ? 2 + (qtySeed % 2) : 3 + (qtySeed % 3);
    const rewardCoins = Math.round(good.basePrice * requiredQty * 1.42 + 35);
    const rewardReputationXp = 22 + requiredQty * 6;

    contracts.push({
      contractKey: `c_${contractCycle}_${idx}_${hub.id}_${itemId}`,
      epoch: contractCycle,
      title: `${hub.shortName} · ${good.shortName} Siparişi`,
      destinationHubId: hub.id,
      itemId,
      requiredQty,
      rewardCoins,
      rewardReputationXp,
      description: `${hub.name} esnafı acil ${requiredQty} ${good.unitLabel.toLowerCase()} ${good.name} bekliyor.`,
    });
  }

  return contracts;
}

export function calculateListingFee(totalPrice: number, cargoTier: number): number {
  const tierDef = getMerchantTierDef(cargoTier);
  return Math.max(1, Math.round(totalPrice * tierDef.listingFeeRate));
}

function appendCommandId(list: string[], idempotencyKey: string): string[] {
  const next = [idempotencyKey, ...list.filter((k) => k !== idempotencyKey)];
  return next.slice(0, MAX_RECENT_COMMAND_IDS);
}

function addInventory(
  inventory: TradeInventorySlot[],
  itemId: TradeGoodId,
  quantity: number,
  unitCost: number
): TradeInventorySlot[] {
  const idx = inventory.findIndex((s) => s.itemId === itemId);
  if (idx < 0) {
    return [...inventory, { itemId, quantity, avgUnitCost: Math.max(1, Math.round(unitCost)) }];
  }
  const existing = inventory[idx];
  const nextQty = existing.quantity + quantity;
  const weightedCost = Math.max(
    1,
    Math.round((existing.quantity * existing.avgUnitCost + quantity * unitCost) / nextQty)
  );
  return inventory.map((s, i) =>
    i === idx ? { itemId, quantity: nextQty, avgUnitCost: weightedCost } : s
  );
}

function removeInventory(
  inventory: TradeInventorySlot[],
  itemId: TradeGoodId,
  quantity: number
): { nextInventory: TradeInventorySlot[]; removedAvgCost: number } | null {
  const existing = inventory.find((s) => s.itemId === itemId);
  if (!existing || existing.quantity < quantity) return null;
  const remaining = existing.quantity - quantity;
  const nextInventory =
    remaining > 0
      ? inventory.map((s) => (s.itemId === itemId ? { ...s, quantity: remaining } : s))
      : inventory.filter((s) => s.itemId !== itemId);
  return { nextInventory, removedAvgCost: existing.avgUnitCost };
}

export interface TradeExecutionContext {
  nowMs?: number;
  supplyPressureByKey?: Record<string, number>;
}

/**
 * Pure, authoritative trade state transition function.
 * Enforces idempotency, optimistic concurrency, slippage bounds, cargo weight limits,
 * escrow integrity, and immutable ledger generation.
 */
export function applyTradeCommand(
  rawState: TradeAccountState,
  command: TradeCommand,
  ctx: TradeExecutionContext = {}
): TradeExecutionResult {
  const nowMs = ctx.nowMs ?? Date.now();
  const profile = sanitizeTradeProfile(rawState.tradeProfile);
  const coins = Math.max(0, Math.min(MAX_COINS, Math.round(rawState.coins)));

  // 1. Idempotency Guard
  if (!command.idempotencyKey || command.idempotencyKey.length > 48) {
    return { ok: false, code: 'DUPLICATE_COMMAND', message: 'Geçersiz işlem kimliği.' };
  }
  if (profile.recentCommandIds.includes(command.idempotencyKey)) {
    return {
      ok: false,
      code: 'DUPLICATE_COMMAND',
      message: 'Bu ticaret komutu zaten işlendi (tekrar koruması).',
    };
  }

  // 2. Optimistic Concurrency Guard
  if (command.expectedVersion !== profile.version) {
    return {
      ok: false,
      code: 'VERSION_CONFLICT',
      message: 'Hesap durumu başka bir işlemle güncellendi, lütfen tekrar deneyin.',
    };
  }

  const nextVersion = profile.version + 1;
  const nextRecentIds = appendCommandId(profile.recentCommandIds, command.idempotencyKey);

  switch (command.type) {
    case 'CLAIM_STARTER_GRANT': {
      if (profile.starterGrantClaimed) {
        return {
          ok: false,
          code: 'ALREADY_CLAIMED',
          message: 'Efeler Tüccar başlangıç sermayesi daha önce alındı.',
        };
      }
      const nextCoins = Math.min(MAX_COINS, coins + STARTER_TRADE_GRANT_COINS);
      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            starterGrantClaimed: true,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'starter_grant',
          hubId: 'yagcilarici',
          itemId: null,
          quantity: 1,
          unitPrice: STARTER_TRADE_GRANT_COINS,
          totalCoins: STARTER_TRADE_GRANT_COINS,
          feeCoins: 0,
          profitDelta: STARTER_TRADE_GRANT_COINS,
          balanceAfter: nextCoins,
          counterpartyName: 'Efeler Esnaf Loncası',
          note: 'Tüccar başlangıç sermayesi tahsil edildi.',
          createdAtMs: nowMs,
        },
        message: `+${STARTER_TRADE_GRANT_COINS} İncir tüccar başlangıç sermayesi hesabına eklendi!`,
      };
    }

    case 'BUY_FROM_HUB': {
      const qty = Math.round(command.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LISTING_QUANTITY) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Geçersiz alış miktarı.' };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      const hub = TRADE_HUB_MAP[command.hubId];
      if (!good || !hub) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Ürün veya pazar bulunamadı.' };
      }

      const pressure = ctx.supplyPressureByKey?.[`${command.hubId}:${command.itemId}`] ?? 0;
      const quote = computeMarketQuote(
        command.hubId,
        command.itemId,
        command.season,
        command.epoch,
        pressure
      );

      if (qty > quote.stock) {
        return {
          ok: false,
          code: 'OUT_OF_STOCK',
          message: `${hub.shortName} tezgahında yalnızca ${quote.stock} ${good.unitLabel.toLowerCase()} stok kaldı.`,
        };
      }

      const feeRate = Math.max(0, Math.min(0.25, command.remoteDeliveryFeeRate ?? 0));
      const effectiveUnitPrice = Math.round(quote.buyPrice * (1 + feeRate));

      if (effectiveUnitPrice > command.maxUnitPrice) {
        return {
          ok: false,
          code: 'SLIPPAGE_EXCEEDED',
          message: `Fiyat güncellendi (${effectiveUnitPrice} İncir). Slipaj koruması işlemi iptal etti.`,
        };
      }

      const totalCost = effectiveUnitPrice * qty;
      const feeCoins = Math.max(0, totalCost - quote.buyPrice * qty);
      if (coins < totalCost) {
        return {
          ok: false,
          code: 'INSUFFICIENT_COINS',
          message: `Yetersiz İncir Puanı (${totalCost} İncir gerekiyor).`,
        };
      }

      const capacityKg = getCargoCapacityKg(
        command.explorationMode,
        command.vehicleType,
        profile.cargoTier
      );
      const usedKg = getCargoUsedKg(profile.inventory);
      const neededKg = good.weightKg * qty;
      if (usedKg + neededKg > capacityKg) {
        return {
          ok: false,
          code: 'CARGO_FULL',
          message: `Kargo kapasitesi yetersiz (${usedKg + neededKg}/${capacityKg} kg).`,
        };
      }

      const nextCoins = coins - totalCost;
      const nextInventory = addInventory(profile.inventory, command.itemId, qty, effectiveUnitPrice);

      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            reputationXp: profile.reputationXp + Math.max(2, qty * 2),
            totalTrades: profile.totalTrades + 1,
            inventory: nextInventory,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'buy_hub',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: qty,
          unitPrice: effectiveUnitPrice,
          totalCoins: -totalCost,
          feeCoins,
          profitDelta: 0,
          balanceAfter: nextCoins,
          counterpartyName: hub.shortName,
          note:
            feeCoins > 0
              ? `${qty} ${good.unitLabel} ${good.shortName} (uzaktan kurye dahil)`
              : `${qty} ${good.unitLabel} ${good.shortName} satın alındı`,
          createdAtMs: nowMs,
        },
        message: `${qty} ${good.unitLabel.toLowerCase()} ${good.shortName} alındı (-${totalCost} İncir).`,
      };
    }

    case 'SELL_TO_HUB': {
      const qty = Math.round(command.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LISTING_QUANTITY) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Geçersiz satış miktarı.' };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      const hub = TRADE_HUB_MAP[command.hubId];
      if (!good || !hub) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Ürün veya pazar bulunamadı.' };
      }

      const pressure = ctx.supplyPressureByKey?.[`${command.hubId}:${command.itemId}`] ?? 0;
      const quote = computeMarketQuote(
        command.hubId,
        command.itemId,
        command.season,
        command.epoch,
        pressure
      );

      if (quote.sellPrice < command.minUnitPrice) {
        return {
          ok: false,
          code: 'SLIPPAGE_EXCEEDED',
          message: `Alım teklifi düştü (${quote.sellPrice} İncir). Slipaj koruması işlemi iptal etti.`,
        };
      }

      const removed = removeInventory(profile.inventory, command.itemId, qty);
      if (!removed) {
        return {
          ok: false,
          code: 'INSUFFICIENT_INVENTORY',
          message: `Kargonda yeterli ${good.shortName} bulunmuyor.`,
        };
      }

      const totalRevenue = quote.sellPrice * qty;
      const costBasis = removed.removedAvgCost * qty;
      const profitDelta = totalRevenue - costBasis;
      const nextCoins = Math.min(MAX_COINS, coins + totalRevenue);
      const repBonus = profitDelta > 0 ? Math.max(4, qty * 3 + Math.floor(profitDelta / 18)) : 2;

      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            reputationXp: profile.reputationXp + repBonus,
            totalTrades: profile.totalTrades + 1,
            totalProfit: profile.totalProfit + profitDelta,
            inventory: removed.nextInventory,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'sell_hub',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: qty,
          unitPrice: quote.sellPrice,
          totalCoins: totalRevenue,
          feeCoins: 0,
          profitDelta,
          balanceAfter: nextCoins,
          counterpartyName: hub.shortName,
          note: `${qty} ${good.unitLabel} ${good.shortName} satıldı (${profitDelta >= 0 ? '+' : ''}${profitDelta} kâr)`,
          createdAtMs: nowMs,
        },
        message: `${qty} ${good.unitLabel.toLowerCase()} ${good.shortName} satıldı (+${totalRevenue} İncir · ${profitDelta >= 0 ? `+${profitDelta}` : profitDelta} kâr).`,
      };
    }

    case 'COMPLETE_CONTRACT': {
      if (profile.completedContractKeys.includes(command.contractKey)) {
        return {
          ok: false,
          code: 'ALREADY_COMPLETED',
          message: 'Bu ticaret kontratı zaten teslim edildi.',
        };
      }
      const contracts = getActiveContractsForEpoch(command.epoch);
      const contract = contracts.find((c) => c.contractKey === command.contractKey);
      if (!contract) {
        return {
          ok: false,
          code: 'CONTRACT_UNAVAILABLE',
          message: 'Kontrat süresi dolmuş veya geçersiz.',
        };
      }
      const removed = removeInventory(profile.inventory, contract.itemId, contract.requiredQty);
      if (!removed) {
        const good = TRADE_GOOD_MAP[contract.itemId];
        return {
          ok: false,
          code: 'INSUFFICIENT_INVENTORY',
          message: `Teslimat için ${contract.requiredQty} ${good.unitLabel.toLowerCase()} ${good.shortName} gerekiyor.`,
        };
      }

      const costBasis = removed.removedAvgCost * contract.requiredQty;
      const profitDelta = contract.rewardCoins - costBasis;
      const nextCoins = Math.min(MAX_COINS, coins + contract.rewardCoins);
      const hub = TRADE_HUB_MAP[contract.destinationHubId];

      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            reputationXp: profile.reputationXp + contract.rewardReputationXp,
            totalTrades: profile.totalTrades + 1,
            totalProfit: profile.totalProfit + profitDelta,
            inventory: removed.nextInventory,
            completedContractKeys: [
              contract.contractKey,
              ...profile.completedContractKeys,
            ].slice(0, MAX_COMPLETED_CONTRACT_KEYS),
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'contract_complete',
          hubId: contract.destinationHubId,
          itemId: contract.itemId,
          quantity: contract.requiredQty,
          unitPrice: Math.round(contract.rewardCoins / contract.requiredQty),
          totalCoins: contract.rewardCoins,
          feeCoins: 0,
          profitDelta,
          balanceAfter: nextCoins,
          counterpartyName: hub.shortName,
          note: `Kontrat teslim edildi: ${contract.title}`,
          createdAtMs: nowMs,
        },
        message: `Kontrat tamamlandı! +${contract.rewardCoins} İncir · +${contract.rewardReputationXp} İtibar.`,
      };
    }

    case 'UPGRADE_MERCHANT_TIER': {
      if (profile.cargoTier >= MERCHANT_TIERS.length) {
        return {
          ok: false,
          code: 'MAX_TIER_REACHED',
          message: 'En yüksek tüccar rütbesine ulaştın!',
        };
      }
      const nextTierDef = MERCHANT_TIERS[profile.cargoTier]; // 0-indexed next tier
      if (profile.reputationXp < nextTierDef.requiredReputationXp) {
        return {
          ok: false,
          code: 'INSUFFICIENT_REPUTATION',
          message: `${nextTierDef.title} için ${nextTierDef.requiredReputationXp} Tüccar İtibarı gerekiyor.`,
        };
      }
      if (coins < nextTierDef.upgradeCostCoins) {
        return {
          ok: false,
          code: 'INSUFFICIENT_COINS',
          message: `Rütbe yükseltme bedeli ${nextTierDef.upgradeCostCoins} İncir.`,
        };
      }

      const nextCoins = coins - nextTierDef.upgradeCostCoins;
      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            cargoTier: nextTierDef.tier,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'tier_upgrade',
          hubId: 'nasuhpasa',
          itemId: null,
          quantity: 1,
          unitPrice: nextTierDef.upgradeCostCoins,
          totalCoins: -nextTierDef.upgradeCostCoins,
          feeCoins: 0,
          profitDelta: 0,
          balanceAfter: nextCoins,
          counterpartyName: 'Zincirli Han Loncası',
          note: `Yeni rütbe: ${nextTierDef.title} (+${nextTierDef.bonusCapacityKg} kg)`,
          createdAtMs: nowMs,
        },
        message: `Tebrikler! Yeni tüccar rütben: ${nextTierDef.title}.`,
      };
    }

    case 'ESCROW_LOCK_FOR_LISTING': {
      const qty = Math.round(command.quantity);
      const unitPrice = Math.round(command.unitPrice);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LISTING_QUANTITY) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'İlan miktarı 1–50 arasında olmalıdır.' };
      }
      if (!Number.isInteger(unitPrice) || unitPrice < 1 || unitPrice > MAX_LISTING_UNIT_PRICE) {
        return { ok: false, code: 'INVALID_PRICE', message: 'Geçersiz birim fiyat.' };
      }
      const removed = removeInventory(profile.inventory, command.itemId, qty);
      if (!removed) {
        return {
          ok: false,
          code: 'INSUFFICIENT_INVENTORY',
          message: 'İlan oluşturmak için kargonda yeterli ürün yok.',
        };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      return {
        ok: true,
        nextState: {
          coins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            inventory: removed.nextInventory,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'listing_create',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: qty,
          unitPrice,
          totalCoins: 0,
          feeCoins: calculateListingFee(qty * unitPrice, profile.cargoTier),
          profitDelta: 0,
          balanceAfter: coins,
          counterpartyName: 'Online Escrow İlan',
          note: `${qty} ${good.unitLabel} ${good.shortName} emanete alındı (${unitPrice} İncir/birim)`,
          createdAtMs: nowMs,
        },
        message: `İlan yayınlandı! ${qty} ${good.unitLabel.toLowerCase()} ${good.shortName} güvenli emanete (escrow) kilitlendi.`,
      };
    }

    case 'ESCROW_REFUND_FROM_CANCEL': {
      const qty = Math.round(command.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LISTING_QUANTITY) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Geçersiz iade miktarı.' };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      const nextInventory = addInventory(
        profile.inventory,
        command.itemId,
        qty,
        Math.min(command.unitPrice, good.basePrice)
      );
      return {
        ok: true,
        nextState: {
          coins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            inventory: nextInventory,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'listing_cancel',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: qty,
          unitPrice: command.unitPrice,
          totalCoins: 0,
          feeCoins: 0,
          profitDelta: 0,
          balanceAfter: coins,
          counterpartyName: 'Online Escrow İade',
          note: `İlan iptal edildi; ${qty} ${good.unitLabel} ${good.shortName} kargona iade edildi.`,
          createdAtMs: nowMs,
        },
        message: `İlan iptal edildi ve ${qty} ${good.unitLabel.toLowerCase()} ${good.shortName} kargona döndü.`,
      };
    }

    case 'SETTLE_P2P_PURCHASE': {
      const qty = Math.round(command.quantity);
      const totalPrice = Math.round(command.totalPrice);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LISTING_QUANTITY || totalPrice < 1) {
        return { ok: false, code: 'INVALID_QUANTITY', message: 'Geçersiz P2P alım bilgisi.' };
      }
      if (coins < totalPrice) {
        return {
          ok: false,
          code: 'INSUFFICIENT_COINS',
          message: `Bu ilanı almak için ${totalPrice} İncir gerekiyor.`,
        };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      const capacityKg = getCargoCapacityKg(
        command.explorationMode,
        command.vehicleType,
        profile.cargoTier
      );
      const usedKg = getCargoUsedKg(profile.inventory);
      if (usedKg + good.weightKg * qty > capacityKg) {
        return {
          ok: false,
          code: 'CARGO_FULL',
          message: `Kargo kapasitesi yetersiz (${usedKg + good.weightKg * qty}/${capacityKg} kg).`,
        };
      }

      const nextCoins = coins - totalPrice;
      const nextInventory = addInventory(profile.inventory, command.itemId, qty, command.unitPrice);
      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            reputationXp: profile.reputationXp + 8,
            totalTrades: profile.totalTrades + 1,
            inventory: nextInventory,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'listing_buy',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: qty,
          unitPrice: command.unitPrice,
          totalCoins: -totalPrice,
          feeCoins: 0,
          profitDelta: 0,
          balanceAfter: nextCoins,
          counterpartyName: command.sellerName,
          note: `${command.sellerName} ilanından ${qty} ${good.unitLabel} ${good.shortName} alındı`,
          createdAtMs: nowMs,
        },
        message: `${command.sellerName} ilanından ${qty} ${good.unitLabel.toLowerCase()} ${good.shortName} satın alındı!`,
      };
    }

    case 'CLAIM_P2P_PROCEEDS': {
      const netProceeds = Math.round(command.netProceeds);
      if (!Number.isInteger(netProceeds) || netProceeds < 0) {
        return { ok: false, code: 'INVALID_PRICE', message: 'Geçersiz tahsilat tutarı.' };
      }
      const good = TRADE_GOOD_MAP[command.itemId];
      const nextCoins = Math.min(MAX_COINS, coins + netProceeds);
      return {
        ok: true,
        nextState: {
          coins: nextCoins,
          tradeProfile: {
            ...profile,
            version: nextVersion,
            reputationXp: profile.reputationXp + 10,
            totalTrades: profile.totalTrades + 1,
            totalProfit: profile.totalProfit + netProceeds,
            recentCommandIds: nextRecentIds,
          },
        },
        ledgerEntry: {
          id: command.idempotencyKey,
          idempotencyKey: command.idempotencyKey,
          type: 'listing_claim',
          hubId: command.hubId,
          itemId: command.itemId,
          quantity: command.quantity,
          unitPrice: Math.max(1, Math.round(netProceeds / Math.max(1, command.quantity))),
          totalCoins: netProceeds,
          feeCoins: command.feeCoins,
          profitDelta: netProceeds,
          balanceAfter: nextCoins,
          counterpartyName: command.buyerName,
          note: `${command.buyerName} satışı tahsil edildi (${good.shortName}, komisyon -${command.feeCoins})`,
          createdAtMs: nowMs,
        },
        message: `Tahsilat Kasasından +${netProceeds} İncir hesabına aktarıldı!`,
      };
    }
  }
}
