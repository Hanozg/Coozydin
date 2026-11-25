import { ExplorationMode, SeasonType, VehicleType } from './game';

export type TradeGoodCategory = 'tarim' | 'zanaat' | 'sahil' | 'nadir';

export type TradeHubId =
  | 'yagcilarici'
  | 'nasuhpasa'
  | 'trengari'
  | 'forumaydin'
  | 'ramazanpasa'
  | 'tralleis';

export type TradeGoodId =
  | 'aydin_inciri'
  | 'zeytinyagi'
  | 'kestane_sekeri'
  | 'pamuk_balyasi'
  | 'karacasu_seramik'
  | 'yagcilar_baharat'
  | 'ege_lavanta'
  | 'plaj_hasir'
  | 'deniz_tuzu'
  | 'mermer_replik'
  | 'antik_sikke_katalog'
  | 'sultaniye_pekmez';

export interface TradeGoodDef {
  id: TradeGoodId;
  name: string;
  shortName: string;
  category: TradeGoodCategory;
  emoji: string;
  unitLabel: string;
  weightKg: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number; // 0.08 - 0.28
  description: string;
  originNote: string;
}

export interface TradeHubDef {
  id: TradeHubId;
  landmarkId: string;
  name: string;
  shortName: string;
  district: string;
  tagline: string;
  position: [number, number];
  /** Goods produced here in abundance (lower buy price, higher stock) */
  supplyGoods: TradeGoodId[];
  /** Goods strongly demanded here (higher sell price, arbitrage target) */
  demandGoods: TradeGoodId[];
  /** Regional price bias multiplier */
  priceBias: number;
}

export interface MarketQuote {
  hubId: TradeHubId;
  itemId: TradeGoodId;
  buyPrice: number;
  sellPrice: number;
  basePrice: number;
  deltaPercent: number; // relative to basePrice
  trend: 'up' | 'down' | 'flat';
  stock: number;
  maxStock: number;
  isSupplySpecialty: boolean;
  isDemandSpecialty: boolean;
  epoch: number;
}

export interface TradeInventorySlot {
  itemId: TradeGoodId;
  quantity: number;
  /** Weighted average unit acquisition cost in İncir Puanı */
  avgUnitCost: number;
}

export interface MerchantTierDef {
  tier: number;
  title: string;
  bonusCapacityKg: number;
  listingFeeRate: number; // e.g. 0.05 -> 0.02
  upgradeCostCoins: number;
  requiredReputationXp: number;
  perkSummary: string;
}

export interface TradeProfileState {
  /** Optimistic concurrency version incremented on every committed mutation */
  version: number;
  cargoTier: number; // 1..5
  reputationXp: number;
  totalTrades: number;
  totalProfit: number;
  starterGrantClaimed: boolean;
  inventory: TradeInventorySlot[];
  completedContractKeys: string[];
  /** Ring buffer of recently processed idempotency keys to block duplicate replays */
  recentCommandIds: string[];
}

export interface TradeContractDef {
  /** Unique key per epoch window so contracts rotate deterministically */
  contractKey: string;
  epoch: number;
  title: string;
  destinationHubId: TradeHubId;
  itemId: TradeGoodId;
  requiredQty: number;
  rewardCoins: number;
  rewardReputationXp: number;
  description: string;
}

export type MarketListingStatus = 'open' | 'sold' | 'claimed' | 'cancelled';

export interface MarketListing {
  id: string;
  sellerUid: string;
  sellerName: string;
  sellerEmoji: string;
  hubId: TradeHubId;
  itemId: TradeGoodId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  feeCoins: number;
  status: MarketListingStatus;
  buyerUid: string | null;
  buyerName: string | null;
  claimedBySeller: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  /** Identifies whether this listing is backed by live Firestore or local preview */
  source: 'firestore' | 'local';
}

export type TradeLedgerType =
  | 'buy_hub'
  | 'sell_hub'
  | 'contract_complete'
  | 'listing_create'
  | 'listing_cancel'
  | 'listing_buy'
  | 'listing_claim'
  | 'tier_upgrade'
  | 'starter_grant';

export interface TradeLedgerEntry {
  id: string;
  uid: string;
  idempotencyKey: string;
  type: TradeLedgerType;
  hubId: TradeHubId | null;
  itemId: TradeGoodId | null;
  quantity: number;
  unitPrice: number;
  totalCoins: number;
  feeCoins: number;
  profitDelta: number;
  balanceAfter: number;
  counterpartyName: string;
  note: string;
  createdAtMs: number;
}

export type TradeCommand =
  | {
      type: 'BUY_FROM_HUB';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      maxUnitPrice: number;
      epoch: number;
      season: SeasonType;
      explorationMode: ExplorationMode;
      vehicleType: VehicleType;
      remoteDeliveryFeeRate?: number;
    }
  | {
      type: 'SELL_TO_HUB';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      minUnitPrice: number;
      epoch: number;
      season: SeasonType;
    }
  | {
      type: 'COMPLETE_CONTRACT';
      idempotencyKey: string;
      expectedVersion: number;
      contractKey: string;
      epoch: number;
    }
  | {
      type: 'UPGRADE_MERCHANT_TIER';
      idempotencyKey: string;
      expectedVersion: number;
    }
  | {
      type: 'CLAIM_STARTER_GRANT';
      idempotencyKey: string;
      expectedVersion: number;
    }
  | {
      type: 'ESCROW_LOCK_FOR_LISTING';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      unitPrice: number;
      listingId: string;
    }
  | {
      type: 'ESCROW_REFUND_FROM_CANCEL';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      unitPrice: number;
      listingId: string;
    }
  | {
      type: 'SETTLE_P2P_PURCHASE';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      sellerName: string;
      listingId: string;
      explorationMode: ExplorationMode;
      vehicleType: VehicleType;
    }
  | {
      type: 'CLAIM_P2P_PROCEEDS';
      idempotencyKey: string;
      expectedVersion: number;
      hubId: TradeHubId;
      itemId: TradeGoodId;
      quantity: number;
      netProceeds: number;
      feeCoins: number;
      buyerName: string;
      listingId: string;
    };

export type TradeErrorCode =
  | 'DUPLICATE_COMMAND'
  | 'VERSION_CONFLICT'
  | 'INSUFFICIENT_COINS'
  | 'INSUFFICIENT_INVENTORY'
  | 'CARGO_FULL'
  | 'SLIPPAGE_EXCEEDED'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'OUT_OF_STOCK'
  | 'CONTRACT_UNAVAILABLE'
  | 'ALREADY_COMPLETED'
  | 'MAX_TIER_REACHED'
  | 'INSUFFICIENT_REPUTATION'
  | 'ALREADY_CLAIMED'
  | 'SELF_TRADE_FORBIDDEN'
  | 'LISTING_NOT_OPEN'
  | 'TRANSPORT_ERROR';

export interface TradeAccountState {
  coins: number;
  tradeProfile: TradeProfileState;
}

export interface TradeExecutionSuccess {
  ok: true;
  nextState: TradeAccountState;
  ledgerEntry: Omit<TradeLedgerEntry, 'uid'>;
  message: string;
}

export interface TradeExecutionFailure {
  ok: false;
  code: TradeErrorCode;
  message: string;
}

export type TradeExecutionResult = TradeExecutionSuccess | TradeExecutionFailure;
