import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Briefcase,
  Check,
  Clock,
  Cloud,
  CloudOff,
  Coins,
  FileText,
  Globe,
  MapPin,
  Minus,
  Navigation,
  Package,
  Plus,
  ScrollText,
  ShieldCheck,
  Store,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { LANDMARKS } from '../data/efelerData';
import {
  getMerchantTierDef,
  MERCHANT_TIERS,
  REMOTE_TRADE_DELIVERY_SURCHARGE,
  STARTER_TRADE_GRANT_COINS,
  TRADE_CATEGORY_LABELS,
  TRADE_GOOD_MAP,
  TRADE_HUB_MAP,
  TRADE_HUBS,
} from '../data/tradeCatalog';
import {
  calculateListingFee,
  findBestSellHubForGood,
} from '../game/tradeEngine';
import { LandmarkDef, SeasonType } from '../types/game';
import {
  MarketListing,
  MarketQuote,
  TradeContractDef,
  TradeGoodCategory,
  TradeGoodId,
  TradeHubId,
  TradeLedgerEntry,
  TradeProfileState,
} from '../types/trade';
import { TradeActionOutcome } from '../hooks/useTradeSystem';

type TradeModalTab = 'market' | 'cargo' | 'p2p' | 'ledger';

export interface TradeMarketModalProps {
  coins: number;
  tradeProfile: TradeProfileState;
  season: SeasonType;
  playerPos: [number, number];
  nearbyHubId: TradeHubId | null;
  initialHubId?: TradeHubId | null;
  isOnlineMode: boolean;
  activeUid: string;
  marketEpoch: number;
  epochCountdownSec: number;
  quotesByHub: Record<TradeHubId, MarketQuote[]>;
  supplyPressureByKey: Record<string, number>;
  activeContracts: TradeContractDef[];
  cargoCapacityKg: number;
  cargoUsedKg: number;
  openMarketListings: MarketListing[];
  myListings: MarketListing[];
  unclaimedProceedsListings: MarketListing[];
  ledgerEntries: TradeLedgerEntry[];
  busyAction: boolean;
  syncError: string | null;
  onClaimStarterGrant: () => Promise<TradeActionOutcome>;
  onBuyFromHub: (
    hubId: TradeHubId,
    itemId: TradeGoodId,
    quantity: number,
    quotedUnitPrice: number
  ) => Promise<TradeActionOutcome>;
  onSellToHub: (
    hubId: TradeHubId,
    itemId: TradeGoodId,
    quantity: number,
    quotedSellPrice: number
  ) => Promise<TradeActionOutcome>;
  onCompleteContract: (contractKey: string) => Promise<TradeActionOutcome>;
  onUpgradeMerchantTier: () => Promise<TradeActionOutcome>;
  onCreateP2PListing: (
    hubId: TradeHubId,
    itemId: TradeGoodId,
    quantity: number,
    unitPrice: number
  ) => Promise<TradeActionOutcome>;
  onCancelP2PListing: (listing: MarketListing) => Promise<TradeActionOutcome>;
  onBuyP2PListing: (listing: MarketListing) => Promise<TradeActionOutcome>;
  onClaimP2PProceeds: (listing: MarketListing) => Promise<TradeActionOutcome>;
  onJumpToLandmark: (landmark: LandmarkDef) => void;
  onOpenProfile: () => void;
  onClose: () => void;
}

const SEASON_TRADE_HINT: Record<SeasonType, string> = {
  spring: 'İlkbahar: Lavanta & Baharat talebi yüksek',
  summer: 'Yaz: Tatil & Plaj ürünleri +%14 primli',
  autumn: 'Sonbahar: İncir & Zeytin hasat bolluğu (ucuz alış)',
  winter: 'Kış: Dağ Kestanesi & Pekmez +%15 primli',
};

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatClockTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function TradeMarketModal({
  coins,
  tradeProfile,
  season,
  playerPos,
  nearbyHubId,
  initialHubId,
  isOnlineMode,
  activeUid,
  marketEpoch,
  epochCountdownSec,
  quotesByHub,
  supplyPressureByKey,
  activeContracts,
  cargoCapacityKg,
  cargoUsedKg,
  openMarketListings,
  myListings,
  unclaimedProceedsListings,
  ledgerEntries,
  busyAction,
  syncError,
  onClaimStarterGrant,
  onBuyFromHub,
  onSellToHub,
  onCompleteContract,
  onUpgradeMerchantTier,
  onCreateP2PListing,
  onCancelP2PListing,
  onBuyP2PListing,
  onClaimP2PProceeds,
  onJumpToLandmark,
  onOpenProfile,
  onClose,
}: TradeMarketModalProps) {
  const [tab, setTab] = useState<TradeModalTab>('market');
  const [selectedHubId, setSelectedHubId] = useState<TradeHubId>(
    initialHubId ?? nearbyHubId ?? 'yagcilarici'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | TradeGoodCategory>('all');
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // P2P Create Listing form state
  const [listingItemId, setListingItemId] = useState<TradeGoodId | ''>('');
  const [listingQty, setListingQty] = useState<number>(1);
  const [listingUnitPrice, setListingUnitPrice] = useState<number>(30);

  const selectedHub = TRADE_HUB_MAP[selectedHubId];
  const isAtSelectedHub = nearbyHubId === selectedHubId;
  const currentTierDef = getMerchantTierDef(tradeProfile.cargoTier);
  const nextTierDef =
    tradeProfile.cargoTier < MERCHANT_TIERS.length
      ? MERCHANT_TIERS[tradeProfile.cargoTier]
      : null;

  const inventoryMap = useMemo(() => {
    const map = new Map<TradeGoodId, { quantity: number; avgUnitCost: number }>();
    for (const slot of tradeProfile.inventory) {
      map.set(slot.itemId, { quantity: slot.quantity, avgUnitCost: slot.avgUnitCost });
    }
    return map;
  }, [tradeProfile.inventory]);

  const hubDistances = useMemo(() => {
    const out = {} as Record<TradeHubId, number>;
    for (const hub of TRADE_HUBS) {
      const dx = hub.position[0] - playerPos[0];
      const dz = hub.position[1] - playerPos[1];
      out[hub.id] = Math.round(Math.hypot(dx, dz));
    }
    return out;
  }, [playerPos]);

  const activeQuotes = useMemo(() => {
    const all = quotesByHub[selectedHubId] ?? [];
    if (categoryFilter === 'all') return all;
    return all.filter((q) => TRADE_GOOD_MAP[q.itemId].category === categoryFilter);
  }, [categoryFilter, quotesByHub, selectedHubId]);

  const selectedListingSlot = useMemo(() => {
    if (listingItemId) {
      return tradeProfile.inventory.find((s) => s.itemId === listingItemId) ?? null;
    }
    return tradeProfile.inventory[0] ?? null;
  }, [listingItemId, tradeProfile.inventory]);

  const effectiveListingItemId: TradeGoodId | null = selectedListingSlot?.itemId ?? null;
  const effectiveListingQty = selectedListingSlot
    ? Math.max(1, Math.min(selectedListingSlot.quantity, listingQty))
    : 1;
  const effectiveListingTotal = effectiveListingQty * Math.max(1, Math.round(listingUnitPrice));
  const effectiveListingFee = calculateListingFee(effectiveListingTotal, tradeProfile.cargoTier);

  const runOutcome = async (promise: Promise<TradeActionOutcome>) => {
    const res = await promise;
    setFeedback({ ok: res.ok, text: res.message });
  };

  const handleJumpToHub = (hubId: TradeHubId) => {
    const hub = TRADE_HUB_MAP[hubId];
    const lm = LANDMARKS.find((l) => l.id === hub.landmarkId);
    if (lm) {
      onJumpToLandmark(lm);
      onClose();
    }
  };

  const getItemQty = (itemId: TradeGoodId) => qtyByItem[itemId] ?? 1;
  const setItemQty = (itemId: TradeGoodId, next: number) => {
    setQtyByItem((prev) => ({ ...prev, [itemId]: Math.max(1, Math.min(50, next)) }));
  };

  const cargoRatio = Math.min(100, Math.round((cargoUsedKg / Math.max(1, cargoCapacityKg)) * 100));

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2E1E12]/68 p-2.5 sm:p-4 md:p-6">
      <div className="w-full max-w-4xl max-h-[92dvh] flex flex-col rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#B99464]/45 bg-[#EFE0C3]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Store className="w-5 h-5 text-[#B84C27] shrink-0" aria-hidden="true" />
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#3A2618]">
                Efeler Ticaret &amp; Pazar Borsası
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                  isOnlineMode
                    ? 'bg-[#E5F0DC] text-[#3D662E] border-[#5D8A48]/50'
                    : 'bg-[#F5E4C3] text-[#8F5624] border-[#B99464]/70'
                }`}
              >
                {isOnlineMode ? (
                  <>
                    <Cloud className="w-3 h-3" aria-hidden="true" />
                    <span>Online Senkron · v{tradeProfile.version}</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3" aria-hidden="true" />
                    <span>Yerel Mod · v{tradeProfile.version}</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs text-[#6B5038] mt-1 font-medium">
              <span className="font-mono-num font-bold text-[#B84C27] inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" aria-hidden="true" />
                {coins} İncir
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                Kargo: <strong className="text-[#3A2618]">{cargoUsedKg}/{cargoCapacityKg} kg</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentTierDef.title}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-num text-[#4B743B]">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Yeni kur: {formatCountdown(epochCountdownSec)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#E2D0AF]">
              <button
                type="button"
                onClick={() => setTab('market')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'market'
                    ? 'bg-[#C85A32] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bölge Borsası</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('cargo')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'cargo'
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kargo &amp; Kontrat</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('p2p')}
                className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'p2p'
                    ? 'bg-[#8F5624] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Online Pazar</span>
                {unclaimedProceedsListings.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#FFD43B] text-[#3A2618] text-[10px] font-bold">
                    {unclaimedProceedsListings.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab('ledger')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'ledger'
                    ? 'bg-[#3A2618] text-[#FAF2E2]'
                    : 'text-[#5B432F] hover:text-[#3A2618]'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Defter</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Ticaret Pazarını Kapat"
              className="p-2 rounded-xl bg-[#E2D0AF] hover:bg-[#D4BE96] text-[#3A2618] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Feedback / Sync Banner */}
        {(feedback || syncError) && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 border-b ${
              syncError
                ? 'bg-[#FBE6DF] text-[#9E351A] border-[#C85A32]/40'
                : feedback?.ok
                  ? 'bg-[#E6F1DD] text-[#3B622C] border-[#5D8A48]/40'
                  : 'bg-[#FBE6DF] text-[#9E351A] border-[#C85A32]/40'
            }`}
          >
            <span>{syncError || feedback?.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Gizle
            </button>
          </div>
        )}

        {/* Starter Trade Grant Banner (Idempotent one-time grant) */}
        {!tradeProfile.starterGrantClaimed && (
          <div className="px-4 sm:px-6 py-2.5 bg-[#E6F1DD] border-b border-[#5D8A48]/40 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-[#2F4F22] font-medium">
              <strong className="font-bold">Efeler Esnaf Loncası Hoş Geldin Desteği:</strong> İlk ticaret rotanı kurman için tek seferlik{' '}
              <span className="font-mono-num font-bold">+{STARTER_TRADE_GRANT_COINS} İncir</span> başlangıç sermayeni hemen alabilirsin.
            </div>
            <button
              type="button"
              disabled={busyAction}
              onClick={() => void runOutcome(onClaimStarterGrant())}
              className="px-3.5 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4E763B] disabled:opacity-50 text-[#FAF2E2] text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              +{STARTER_TRADE_GRANT_COINS} İncir Sermaye Al
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: REGIONAL MARKET */}
          {tab === 'market' && (
            <>
              {/* Hub Strip */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                    Efeler Ticaret Merkezleri (6 Bölge)
                  </span>
                  <span className="text-[11px] font-semibold text-[#5B432F] bg-[#EFE0C3] px-2.5 py-1 rounded-lg border border-[#B99464]/50">
                    {SEASON_TRADE_HINT[season]}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {TRADE_HUBS.map((hub) => {
                    const selected = hub.id === selectedHubId;
                    const here = nearbyHubId === hub.id;
                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setSelectedHubId(hub.id)}
                        className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#3A2618] text-[#FAF2E2] border-[#C85A32] shadow-md'
                            : 'bg-[#FAF2E2] hover:bg-[#EFE0C3] text-[#3A2618] border-[#B99464]/55'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{hub.shortName}</span>
                          {here && (
                            <span className="w-2 h-2 rounded-full bg-[#5D8A48] shrink-0" title="Buradasın" />
                          )}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 font-mono-num ${
                            selected ? 'text-[#EED8B5]' : 'text-[#6B5038]'
                          }`}
                        >
                          {here ? 'Yerinde · %0 kurye' : `${hubDistances[hub.id]} m`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Hub Summary Card */}
              <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base font-bold text-[#3A2618]">
                      {selectedHub.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isAtSelectedHub
                          ? 'bg-[#E6F1DD] text-[#3D662E]'
                          : 'bg-[#F5E4C3] text-[#8F5624]'
                      }`}
                    >
                      {isAtSelectedHub
                        ? 'Yerinde Ticaret · %0 Ek Ücret'
                        : `Uzaktan Kurye (+%${Math.round(REMOTE_TRADE_DELIVERY_SURCHARGE * 100)} alış farkı)`}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5038] mt-0.5">{selectedHub.tagline}</p>
                </div>

                {!isAtSelectedHub && (
                  <button
                    type="button"
                    onClick={() => handleJumpToHub(selectedHubId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C85A32] hover:bg-[#B24D29] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Bu Pazara Git</span>
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'tarim', 'zanaat', 'sahil', 'nadir'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      categoryFilter === cat
                        ? 'bg-[#C85A32] text-[#FAF2E2] border-[#A94724]'
                        : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618] border-[#B99464]/50'
                    }`}
                  >
                    {cat === 'all' ? 'Tüm Ürünler' : TRADE_CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Goods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeQuotes.map((quote) => {
                  const good = TRADE_GOOD_MAP[quote.itemId];
                  const owned = inventoryMap.get(quote.itemId);
                  const qty = getItemQty(quote.itemId);
                  const remoteFactor = isAtSelectedHub ? 1 : 1 + REMOTE_TRADE_DELIVERY_SURCHARGE;
                  const effectiveBuyUnit = Math.round(quote.buyPrice * remoteFactor);
                  const totalBuyCost = effectiveBuyUnit * qty;
                  const bestSell = findBestSellHubForGood(
                    quote.itemId,
                    season,
                    marketEpoch,
                    supplyPressureByKey
                  );
                  const potentialSpread = bestSell.sellPrice - effectiveBuyUnit;
                  const canAfford = coins >= totalBuyCost;
                  const fitsCargo = cargoUsedKg + good.weightKg * qty <= cargoCapacityKg;
                  const hasStock = quote.stock >= qty;

                  return (
                    <div
                      key={quote.itemId}
                      className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-3.5 flex flex-col justify-between gap-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-2xl leading-none mt-0.5" aria-hidden="true">
                            {good.emoji}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-sm text-[#3A2618] truncate">
                                {good.shortName}
                              </h4>
                              {quote.isSupplySpecialty && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6F1DD] text-[#3D662E]">
                                  Ucuz Arz
                                </span>
                              )}
                              {quote.isDemandSpecialty && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FBE6DF] text-[#B84C27]">
                                  Yüksek Talep
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B5038] flex items-center gap-2 mt-0.5">
                              <span>{good.weightKg} kg/{good.unitLabel.toLowerCase()}</span>
                              <span>·</span>
                              <span className="font-mono-num">Stok: {quote.stock}</span>
                              {owned && (
                                <>
                                  <span>·</span>
                                  <span className="font-semibold text-[#3D662E]">
                                    Sende: {owned.quantity} (ort. {owned.avgUnitCost})
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-0.5 text-xs font-mono-num font-bold">
                            {quote.deltaPercent > 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                            ) : quote.deltaPercent < 0 ? (
                              <ArrowDownRight className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
                            ) : null}
                            <span
                              className={
                                quote.deltaPercent > 0
                                  ? 'text-[#B84C27]'
                                  : quote.deltaPercent < 0
                                    ? 'text-[#4B743B]'
                                    : 'text-[#6B5038]'
                              }
                            >
                              {quote.deltaPercent > 0 ? `+${quote.deltaPercent}%` : `${quote.deltaPercent}%`}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B5038]">Baz: {good.basePrice}</div>
                        </div>
                      </div>

                      {/* Arbitrage Hint */}
                      <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#EFE0C3]/75 text-[#5B432F] flex items-center justify-between gap-2">
                        <span className="truncate">
                          En iyi satış:{' '}
                          <strong className="text-[#3A2618]">
                            {TRADE_HUB_MAP[bestSell.hubId].shortName}
                          </strong>{' '}
                          ({bestSell.sellPrice} İncir)
                        </span>
                        {potentialSpread > 0 && (
                          <span className="font-mono-num font-bold text-[#3D662E] shrink-0">
                            +{potentialSpread}/br kâr
                          </span>
                        )}
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#B99464]/30">
                        <div className="inline-flex items-center gap-1 bg-[#EFE0C3] rounded-lg p-0.5 border border-[#B99464]/50">
                          <button
                            type="button"
                            onClick={() => setItemQty(quote.itemId, qty - 1)}
                            aria-label="Miktarı azalt"
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#E2D0AF] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span className="w-7 text-center text-xs font-mono-num font-bold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setItemQty(quote.itemId, qty + 1)}
                            aria-label="Miktarı artır"
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#E2D0AF] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemQty(quote.itemId, 5)}
                            className="px-1.5 h-6 rounded text-[10px] font-bold hover:bg-[#E2D0AF] cursor-pointer"
                          >
                            x5
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busyAction || !canAfford || !fitsCargo || !hasStock}
                            onClick={() =>
                              void runOutcome(
                                onBuyFromHub(selectedHubId, quote.itemId, qty, quote.buyPrice)
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4E763B] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold transition-colors cursor-pointer font-mono-num"
                          >
                            Al · {totalBuyCost}
                          </button>

                          <button
                            type="button"
                            disabled={busyAction || !owned || owned.quantity < qty}
                            onClick={() =>
                              void runOutcome(
                                onSellToHub(selectedHubId, quote.itemId, qty, quote.sellPrice)
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#C85A32] hover:bg-[#B24D29] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold transition-colors cursor-pointer font-mono-num"
                          >
                            Sat · +{quote.sellPrice * qty}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: CARGO & CONTRACTS */}
          {tab === 'cargo' && (
            <div className="space-y-4">
              {/* Merchant Tier & Cargo Meter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                      Araç &amp; Tüccar Kargo Hacmi
                    </span>
                    <span className="font-mono-num text-sm font-bold text-[#3A2618]">
                      {cargoUsedKg} / {cargoCapacityKg} kg
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E5D3B3] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cargoRatio > 85 ? 'bg-[#C85A32]' : 'bg-[#5D8A48]'
                      }`}
                      style={{ width: `${cargoRatio}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B5038]">
                    Otomobil sürerken en yüksek temel kargo kapasitesini (46 kg) alırsın; tüccar rütbeni yükselterek ekstra depo kazanabilirsin.
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-4 flex flex-col justify-between gap-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3A2618]">
                        <Award className="w-4 h-4 text-[#C85A32]" aria-hidden="true" />
                        Seviye {currentTierDef.tier}: {currentTierDef.title}
                      </span>
                      <span className="text-xs font-mono-num font-bold text-[#4B743B]">
                        {tradeProfile.reputationXp} İtibar XP
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B5038] mt-1">{currentTierDef.perkSummary}</p>
                  </div>

                  {nextTierDef ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#B99464]/35">
                      <div className="text-[11px] text-[#5B432F]">
                        Sonraki: <strong>{nextTierDef.title}</strong> ({nextTierDef.requiredReputationXp} XP · {nextTierDef.upgradeCostCoins} İncir)
                      </div>
                      <button
                        type="button"
                        disabled={
                          busyAction ||
                          tradeProfile.reputationXp < nextTierDef.requiredReputationXp ||
                          coins < nextTierDef.upgradeCostCoins
                        }
                        onClick={() => void runOutcome(onUpgradeMerchantTier())}
                        className="px-3 py-1.5 rounded-lg bg-[#8F5624] hover:bg-[#7A471D] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Rütbe Yükselt
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-[#4B743B]">
                      Maksimum Ege Kervanbaşı rütbesine ulaştın!
                    </div>
                  )}
                </div>
              </div>

              {/* Owned Inventory */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                  Kargo Envanterin ({tradeProfile.inventory.length} çeşit)
                </h3>
                {tradeProfile.inventory.length === 0 ? (
                  <div className="rounded-xl bg-[#FAF2E2]/80 border border-dashed border-[#B99464] p-5 text-center text-xs text-[#6B5038]">
                    Kargon şu an boş. <strong>Bölge Borsası</strong> sekmesinden düşük fiyatlı Aydın ürünleri satın alıp talep gören başka bir pazarda kârla satabilirsin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tradeProfile.inventory.map((slot) => {
                      const good = TRADE_GOOD_MAP[slot.itemId];
                      const bestSell = findBestSellHubForGood(
                        slot.itemId,
                        season,
                        marketEpoch,
                        supplyPressureByKey
                      );
                      const estProfit = (bestSell.sellPrice - slot.avgUnitCost) * slot.quantity;
                      return (
                        <div
                          key={slot.itemId}
                          className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-3 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl" aria-hidden="true">
                              {good.emoji}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#3A2618] truncate">
                                {good.shortName} · <span className="font-mono-num">{slot.quantity}x</span>
                              </div>
                              <div className="text-[11px] text-[#6B5038]">
                                Ort. Maliyet: <strong className="font-mono-num">{slot.avgUnitCost}</strong> ·{' '}
                                {slot.quantity * good.weightKg} kg
                              </div>
                              <div className="text-[11px] text-[#4B743B] font-semibold">
                                En iyi pazar: {TRADE_HUB_MAP[bestSell.hubId].shortName} (
                                {estProfit >= 0 ? `+${estProfit}` : estProfit} İncir)
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHubId(bestSell.hubId);
                              setTab('market');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464]/60 text-[11px] font-bold text-[#3A2618] shrink-0 cursor-pointer"
                          >
                            Pazara Bak
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Guild Contracts */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                  Dönemsel Esnaf Loncası Kontratları (Yüksek Kâr &amp; İtibar)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {activeContracts.map((contract) => {
                    const good = TRADE_GOOD_MAP[contract.itemId];
                    const hub = TRADE_HUB_MAP[contract.destinationHubId];
                    const ownedQty = inventoryMap.get(contract.itemId)?.quantity ?? 0;
                    const completed = tradeProfile.completedContractKeys.includes(
                      contract.contractKey
                    );
                    const ready = !completed && ownedQty >= contract.requiredQty;

                    return (
                      <div
                        key={contract.contractKey}
                        className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${
                          completed
                            ? 'bg-[#E6F1DD]/70 border-[#5D8A48]/50'
                            : 'bg-[#FAF2E2] border-[#B99464]/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-lg" aria-hidden="true">
                              {good.emoji}
                            </span>
                            <span className="text-[10px] font-mono-num font-bold px-2 py-0.5 rounded bg-[#EFE0C3] text-[#8F5624]">
                              +{contract.rewardCoins} İncir · +{contract.rewardReputationXp} XP
                            </span>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#3A2618] mt-1">
                            {contract.title}
                          </h4>
                          <p className="text-[11px] text-[#6B5038] mt-0.5 leading-snug">
                            {contract.description}
                          </p>
                          <div className="text-[11px] font-mono-num mt-1.5 text-[#5B432F]">
                            Kargoda:{' '}
                            <strong className={ready ? 'text-[#3D662E]' : 'text-[#B84C27]'}>
                              {ownedQty} / {contract.requiredQty}
                            </strong>{' '}
                            {good.unitLabel.toLowerCase()}
                          </div>
                        </div>

                        {completed ? (
                          <div className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#5D8A48]/20 text-[#3D662E] text-xs font-bold">
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Teslim Edildi</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={busyAction || !ready}
                              onClick={() => void runOutcome(onCompleteContract(contract.contractKey))}
                              className="flex-1 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4E763B] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold transition-colors cursor-pointer"
                            >
                              Kontratı Teslim Et
                            </button>
                            <button
                              type="button"
                              onClick={() => handleJumpToHub(hub.id)}
                              title={`${hub.shortName} noktasına git`}
                              className="p-1.5 rounded-lg bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618] cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ONLINE P2P ESCROW MARKET */}
          {tab === 'p2p' && (
            <div className="space-y-4">
              {/* Online Connection Architecture Notice */}
              <div
                className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-2.5 ${
                  isOnlineMode
                    ? 'bg-[#E6F1DD] border-[#5D8A48]/55 text-[#2E4F22]'
                    : 'bg-[#F5E7CC] border-[#B99464] text-[#5B432F]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#4B743B]" aria-hidden="true" />
                  <div className="text-xs leading-relaxed">
                    {isOnlineMode ? (
                      <>
                        <strong className="font-bold">Canlı Online Escrow Pazarı Aktif:</strong> Tüm ilanlar Firestore atomik işlemleriyle kilitlenir; başka bir oyuncu ilanını aldığında tutar güvenli <strong>Tahsilat Kasası</strong>na düşer.
                      </>
                    ) : (
                      <>
                        <strong className="font-bold">Online Hazır Emanet (Escrow) Altyapısı:</strong> Şu an yerel önizleme modundasın. Google ile giriş yaptığında aynı arayüz otomatik olarak gerçek zamanlı çok oyunculu Firestore pazarına bağlanır.
                      </>
                    )}
                  </div>
                </div>
                {!isOnlineMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#C85A32] hover:bg-[#B24D29] text-[#FAF2E2] text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Giriş Yap &amp; Online Bağlan
                  </button>
                )}
              </div>

              {/* Claim Vault Banner */}
              {unclaimedProceedsListings.length > 0 && (
                <div className="rounded-xl bg-[#FFF6D6] border-2 border-[#D49B2A] p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#7A4D09]">
                    <Coins className="w-4 h-4" aria-hidden="true" />
                    <span>Tahsilat Kasası ({unclaimedProceedsListings.length} Satış Bekliyor)</span>
                  </div>
                  <div className="space-y-1.5">
                    {unclaimedProceedsListings.map((listing) => {
                      const good = TRADE_GOOD_MAP[listing.itemId];
                      const net = Math.max(0, listing.totalPrice - listing.feeCoins);
                      return (
                        <div
                          key={listing.id}
                          className="flex flex-wrap items-center justify-between gap-2 bg-[#FAF2E2] rounded-lg px-3 py-2 border border-[#D49B2A]/45"
                        >
                          <div className="text-xs text-[#3A2618]">
                            <strong>{listing.buyerName || 'Online Tüccar'}</strong> senin{' '}
                            <strong>
                              {listing.quantity} {good.shortName}
                            </strong>{' '}
                            ilanını aldı! (Brüt {listing.totalPrice} - Komisyon {listing.feeCoins})
                          </div>
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() => void runOutcome(onClaimP2PProceeds(listing))}
                            className="px-3 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4E763B] disabled:opacity-50 text-[#FAF2E2] text-xs font-bold cursor-pointer font-mono-num"
                          >
                            +{net} İncir Tahsil Et
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Create Listing Form */}
              <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#3A2618] inline-flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#B84C27]" aria-hidden="true" />
                    Yeni Oyuncu İlanı Aç (Escrow Korumalı)
                  </h3>
                  <span className="text-[11px] text-[#6B5038]">
                    Lonca Komisyonu: %{Math.round(currentTierDef.listingFeeRate * 100)}
                  </span>
                </div>

                {tradeProfile.inventory.length === 0 ? (
                  <p className="text-xs text-[#6B5038]">
                    İlan açabilmek için önce <strong>Bölge Borsası</strong>ndan kargona ürün satın almalısın.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                    <label className="text-xs font-semibold text-[#5B432F] space-y-1">
                      <span>Ürün (Kargodan)</span>
                      <select
                        value={effectiveListingItemId ?? ''}
                        onChange={(e) => {
                          const nextId = e.target.value as TradeGoodId;
                          setListingItemId(nextId);
                          const g = TRADE_GOOD_MAP[nextId];
                          if (g) setListingUnitPrice(Math.round(g.basePrice * 1.1));
                          setListingQty(1);
                        }}
                        className="w-full rounded-lg bg-[#EFE0C3] border border-[#B99464] px-2.5 py-2 text-xs text-[#3A2618] font-semibold"
                      >
                        {tradeProfile.inventory.map((slot) => {
                          const g = TRADE_GOOD_MAP[slot.itemId];
                          return (
                            <option key={slot.itemId} value={slot.itemId}>
                              {g.emoji} {g.shortName} ({slot.quantity} adet)
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-[#5B432F] space-y-1">
                      <span>Adet (Maks {selectedListingSlot?.quantity ?? 1})</span>
                      <input
                        type="number"
                        min={1}
                        max={selectedListingSlot?.quantity ?? 1}
                        value={effectiveListingQty}
                        onChange={(e) => setListingQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full rounded-lg bg-[#EFE0C3] border border-[#B99464] px-2.5 py-2 text-xs font-mono-num text-[#3A2618] font-bold"
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5B432F] space-y-1">
                      <span>Birim Fiyat (İncir)</span>
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={listingUnitPrice}
                        onChange={(e) =>
                          setListingUnitPrice(Math.max(1, Math.min(5000, Number(e.target.value) || 1)))
                        }
                        className="w-full rounded-lg bg-[#EFE0C3] border border-[#B99464] px-2.5 py-2 text-xs font-mono-num text-[#3A2618] font-bold"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={busyAction || !effectiveListingItemId}
                      onClick={() => {
                        if (!effectiveListingItemId) return;
                        void runOutcome(
                          onCreateP2PListing(
                            selectedHubId,
                            effectiveListingItemId,
                            effectiveListingQty,
                            Math.max(1, Math.round(listingUnitPrice))
                          )
                        );
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#C85A32] hover:bg-[#B24D29] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold transition-colors cursor-pointer"
                    >
                      İlanı Yayınla (Net +{Math.max(0, effectiveListingTotal - effectiveListingFee)})
                    </button>
                  </div>
                )}
              </div>

              {/* Open Orderbook */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                  Açık Online İlanlar ({openMarketListings.length})
                </h3>
                {openMarketListings.length === 0 ? (
                  <div className="rounded-xl bg-[#FAF2E2]/80 border border-dashed border-[#B99464] p-5 text-center text-xs text-[#6B5038]">
                    Henüz açık oyuncu ilanı yok. Yukarıdan ilk ilanını yayınlayabilirsin!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {openMarketListings.map((listing) => {
                      const good = TRADE_GOOD_MAP[listing.itemId];
                      const hub = TRADE_HUB_MAP[listing.hubId];
                      const isMine = listing.sellerUid === activeUid;
                      const fitsCargo = cargoUsedKg + good.weightKg * listing.quantity <= cargoCapacityKg;

                      return (
                        <div
                          key={listing.id}
                          className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/70 p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl" aria-hidden="true">
                              {good.emoji}
                            </span>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#3A2618] truncate">
                                {good.shortName} · <span className="font-mono-num">{listing.quantity}x</span>
                              </div>
                              <div className="text-[11px] text-[#6B5038] truncate">
                                {listing.sellerEmoji} {listing.sellerName} · {hub.shortName}
                              </div>
                              <div className="text-[11px] font-mono-num font-bold text-[#B84C27]">
                                {listing.unitPrice} İncir/br · Toplam {listing.totalPrice} İncir
                              </div>
                            </div>
                          </div>

                          {isMine ? (
                            <button
                              type="button"
                              disabled={busyAction}
                              onClick={() => void runOutcome(onCancelP2PListing(listing))}
                              className="px-3 py-1.5 rounded-lg bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464] text-xs font-bold text-[#3A2618] shrink-0 cursor-pointer"
                            >
                              İptal Et
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyAction || coins < listing.totalPrice || !fitsCargo}
                              onClick={() => void runOutcome(onBuyP2PListing(listing))}
                              className="px-3 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4E763B] disabled:opacity-45 text-[#FAF2E2] text-xs font-bold shrink-0 cursor-pointer font-mono-num"
                            >
                              Satın Al
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Listings History */}
              {myListings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5038]">
                    Benim İlanlarım ({myListings.length})
                  </h3>
                  <div className="space-y-1.5">
                    {myListings.slice(0, 10).map((listing) => {
                      const good = TRADE_GOOD_MAP[listing.itemId];
                      const statusLabel =
                        listing.status === 'open'
                          ? 'Açık (Emanette)'
                          : listing.status === 'sold'
                            ? 'Satıldı · Tahsilat Bekliyor'
                            : listing.status === 'claimed'
                              ? 'Tamamlandı'
                              : 'İptal Edildi';
                      return (
                        <div
                          key={listing.id}
                          className="rounded-lg bg-[#FAF2E2]/90 border border-[#B99464]/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span>{good.emoji}</span>
                            <span className="font-bold text-[#3A2618]">
                              {listing.quantity}x {good.shortName}
                            </span>
                            <span className="font-mono-num text-[#6B5038]">
                              ({listing.totalPrice} İncir)
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              listing.status === 'open'
                                ? 'bg-[#F5E4C3] text-[#8F5624]'
                                : listing.status === 'sold'
                                  ? 'bg-[#FFF6D6] text-[#8F5624]'
                                  : listing.status === 'claimed'
                                    ? 'bg-[#E6F1DD] text-[#3D662E]'
                                    : 'bg-[#EDE0C6] text-[#6B5038]'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: IMMUTABLE LEDGER */}
          {tab === 'ledger' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/65 p-3">
                  <div className="text-[11px] text-[#6B5038]">Toplam İşlem</div>
                  <div className="font-mono-num text-lg font-bold text-[#3A2618]">
                    {tradeProfile.totalTrades}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/65 p-3">
                  <div className="text-[11px] text-[#6B5038]">Gerçekleşen Kâr</div>
                  <div
                    className={`font-mono-num text-lg font-bold ${
                      tradeProfile.totalProfit >= 0 ? 'text-[#4B743B]' : 'text-[#B84C27]'
                    }`}
                  >
                    {tradeProfile.totalProfit >= 0 ? '+' : ''}
                    {tradeProfile.totalProfit} İncir
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/65 p-3">
                  <div className="text-[11px] text-[#6B5038]">Tüccar İtibarı</div>
                  <div className="font-mono-num text-lg font-bold text-[#8F5624]">
                    {tradeProfile.reputationXp} XP
                  </div>
                </div>
                <div className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/65 p-3">
                  <div className="text-[11px] text-[#6B5038]">Hesap Sürümü</div>
                  <div className="font-mono-num text-lg font-bold text-[#3A2618]">
                    v{tradeProfile.version}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5038] inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    Değiştirilemez İşlem Defteri (Append-Only Audit Log)
                  </h3>
                  <span className="text-[11px] text-[#6B5038] font-mono-num">
                    Son {ledgerEntries.length} kayıt
                  </span>
                </div>

                {ledgerEntries.length === 0 ? (
                  <div className="rounded-xl bg-[#FAF2E2]/80 border border-dashed border-[#B99464] p-6 text-center text-xs text-[#6B5038]">
                    Henüz kayıtlı ticaret işlemi yok. Yaptığın her alış, satış, kontrat ve P2P ilanı kimlik doğrulamalı olarak buraya işlenir.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {ledgerEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl bg-[#FAF2E2] border border-[#B99464]/60 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#3A2618] flex items-center gap-1.5 flex-wrap">
                            <span>{entry.note}</span>
                            <span className="text-[10px] font-mono-num font-normal text-[#6B5038]">
                              #{entry.idempotencyKey.slice(-6)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6B5038] mt-0.5">
                            {entry.counterpartyName} · {formatClockTime(entry.createdAtMs)} · Bakiye:{' '}
                            <strong className="font-mono-num">{entry.balanceAfter} İncir</strong>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs font-mono-num font-bold ${
                              entry.totalCoins > 0
                                ? 'text-[#4B743B]'
                                : entry.totalCoins < 0
                                  ? 'text-[#B84C27]'
                                  : 'text-[#6B5038]'
                            }`}
                          >
                            {entry.totalCoins > 0 ? `+${entry.totalCoins}` : entry.totalCoins} İncir
                          </div>
                          {entry.feeCoins > 0 && (
                            <div className="text-[10px] text-[#6B5038] font-mono-num">
                              Komisyon: {entry.feeCoins}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-[#B99464]/45 bg-[#EFE0C3] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B5038]">
          <span className="inline-flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
            <span>
              Kısayol: <strong className="text-[#3A2618]">[T]</strong> Ticaret Pazarı · Fiyatlar tüm oyuncular için 5 dakikada bir senkron yenilenir
            </span>
          </span>
          <span className="font-mono-num">Dönem #{marketEpoch}</span>
        </div>
      </div>
    </div>
  );
}
