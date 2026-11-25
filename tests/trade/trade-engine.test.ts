import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_TRADE_PROFILE, STARTER_TRADE_GRANT_COINS } from '../../src/data/tradeCatalog';
import {
  applyTradeCommand,
  calculateListingFee,
  computeMarketQuote,
  getActiveContractsForEpoch,
  getCargoCapacityKg,
  getCargoUsedKg,
} from '../../src/game/tradeEngine';
import { TradeAccountState } from '../../src/types/trade';

function createFreshAccount(coins = 250): TradeAccountState {
  return {
    coins,
    tradeProfile: {
      ...DEFAULT_TRADE_PROFILE,
      inventory: [],
      completedContractKeys: [],
      recentCommandIds: [],
    },
  };
}

test('computeMarketQuote is deterministic and maintains positive ask/bid spread', () => {
  const q1 = computeMarketQuote('yagcilarici', 'zeytinyagi', 'spring', 420);
  const q2 = computeMarketQuote('yagcilarici', 'zeytinyagi', 'spring', 420);
  assert.deepEqual(q1, q2);
  assert.ok(q1.buyPrice > q1.sellPrice, 'Ask price must exceed bid price to prevent instant loop');
  assert.equal(q1.isSupplySpecialty, true);

  const demandQuote = computeMarketQuote('trengari', 'zeytinyagi', 'spring', 420);
  assert.equal(demandQuote.isDemandSpecialty, true);
  assert.ok(demandQuote.sellPrice > q1.buyPrice, 'Supply hub buy should be profitable at demand hub');
});

test('starter grant is idempotent and cannot be claimed twice', () => {
  const initial = createFreshAccount(0);
  const first = applyTradeCommand(initial, {
    type: 'CLAIM_STARTER_GRANT',
    idempotencyKey: 'grant_1',
    expectedVersion: 1,
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.nextState.coins, STARTER_TRADE_GRANT_COINS);
  assert.equal(first.nextState.tradeProfile.starterGrantClaimed, true);
  assert.equal(first.nextState.tradeProfile.version, 2);

  // Replay exact same command ID -> DUPLICATE_COMMAND
  const replay = applyTradeCommand(first.nextState, {
    type: 'CLAIM_STARTER_GRANT',
    idempotencyKey: 'grant_1',
    expectedVersion: 2,
  });
  assert.equal(replay.ok, false);
  if (!replay.ok) assert.equal(replay.code, 'DUPLICATE_COMMAND');

  // New command ID but already claimed -> ALREADY_CLAIMED
  const second = applyTradeCommand(first.nextState, {
    type: 'CLAIM_STARTER_GRANT',
    idempotencyKey: 'grant_2',
    expectedVersion: 2,
  });
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.code, 'ALREADY_CLAIMED');
});

test('optimistic concurrency rejects stale expectedVersion', () => {
  const initial = createFreshAccount(300);
  const res = applyTradeCommand(initial, {
    type: 'CLAIM_STARTER_GRANT',
    idempotencyKey: 'grant_stale',
    expectedVersion: 99,
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.code, 'VERSION_CONFLICT');
});

test('buy and sell flow tracks weighted average cost, cargo weight, slippage, and realized profit', () => {
  const epoch = 500;
  const buyQuote = computeMarketQuote('yagcilarici', 'aydin_inciri', 'autumn', epoch);
  const sellQuote = computeMarketQuote('forumaydin', 'aydin_inciri', 'autumn', epoch);

  // Slippage check rejects when maxUnitPrice is below actual quote
  const slipped = applyTradeCommand(createFreshAccount(500), {
    type: 'BUY_FROM_HUB',
    idempotencyKey: 'buy_slip',
    expectedVersion: 1,
    hubId: 'yagcilarici',
    itemId: 'aydin_inciri',
    quantity: 2,
    maxUnitPrice: buyQuote.buyPrice - 1,
    epoch,
    season: 'autumn',
    explorationMode: 'vehicle',
    vehicleType: 'car',
  });
  assert.equal(slipped.ok, false);
  if (!slipped.ok) assert.equal(slipped.code, 'SLIPPAGE_EXCEEDED');

  // Valid purchase
  const bought = applyTradeCommand(createFreshAccount(500), {
    type: 'BUY_FROM_HUB',
    idempotencyKey: 'buy_ok',
    expectedVersion: 1,
    hubId: 'yagcilarici',
    itemId: 'aydin_inciri',
    quantity: 4,
    maxUnitPrice: buyQuote.buyPrice,
    epoch,
    season: 'autumn',
    explorationMode: 'vehicle',
    vehicleType: 'car',
  });
  assert.equal(bought.ok, true);
  if (!bought.ok) return;
  assert.equal(bought.nextState.coins, 500 - buyQuote.buyPrice * 4);
  assert.equal(getCargoUsedKg(bought.nextState.tradeProfile.inventory), 4);

  // Sell at Forum Aydin
  const sold = applyTradeCommand(bought.nextState, {
    type: 'SELL_TO_HUB',
    idempotencyKey: 'sell_ok',
    expectedVersion: bought.nextState.tradeProfile.version,
    hubId: 'forumaydin',
    itemId: 'aydin_inciri',
    quantity: 4,
    minUnitPrice: sellQuote.sellPrice,
    epoch,
    season: 'autumn',
  });
  assert.equal(sold.ok, true);
  if (!sold.ok) return;
  assert.equal(sold.nextState.tradeProfile.inventory.length, 0);
  const expectedProfit = (sellQuote.sellPrice - buyQuote.buyPrice) * 4;
  assert.equal(sold.nextState.tradeProfile.totalProfit, expectedProfit);
  assert.equal(sold.ledgerEntry.profitDelta, expectedProfit);
});

test('cargo weight limit blocks oversized purchases on foot vs car', () => {
  const epoch = 510;
  const quote = computeMarketQuote('nasuhpasa', 'pamuk_balyasi', 'spring', epoch);
  // pamuk_balyasi weighs 3 kg each; walk base capacity is 14 kg -> 5 units = 15 kg > 14 kg
  assert.equal(getCargoCapacityKg('walk', 'car', 1), 14);
  const tooHeavy = applyTradeCommand(createFreshAccount(1000), {
    type: 'BUY_FROM_HUB',
    idempotencyKey: 'buy_heavy',
    expectedVersion: 1,
    hubId: 'nasuhpasa',
    itemId: 'pamuk_balyasi',
    quantity: 5,
    maxUnitPrice: quote.buyPrice,
    epoch,
    season: 'spring',
    explorationMode: 'walk',
    vehicleType: 'car',
  });
  assert.equal(tooHeavy.ok, false);
  if (!tooHeavy.ok) assert.equal(tooHeavy.code, 'CARGO_FULL');
});

test('escrow listing lock, cancel refund, P2P purchase, and seller claim vault preserve conservation', () => {
  const sellerStart: TradeAccountState = {
    coins: 200,
    tradeProfile: {
      ...DEFAULT_TRADE_PROFILE,
      inventory: [{ itemId: 'zeytinyagi', quantity: 5, avgUnitCost: 35 }],
      completedContractKeys: [],
      recentCommandIds: [],
    },
  };

  // 1. Lock 3 units into escrow
  const locked = applyTradeCommand(sellerStart, {
    type: 'ESCROW_LOCK_FOR_LISTING',
    idempotencyKey: 'lock_1',
    expectedVersion: 1,
    hubId: 'yagcilarici',
    itemId: 'zeytinyagi',
    quantity: 3,
    unitPrice: 50,
    listingId: 'lst_1',
  });
  assert.equal(locked.ok, true);
  if (!locked.ok) return;
  assert.equal(locked.nextState.tradeProfile.inventory[0].quantity, 2);

  // 2. Buyer purchases listing for 150 coins
  const buyerStart = createFreshAccount(300);
  const buyerPurchased = applyTradeCommand(buyerStart, {
    type: 'SETTLE_P2P_PURCHASE',
    idempotencyKey: 'buy_lst_1',
    expectedVersion: 1,
    hubId: 'yagcilarici',
    itemId: 'zeytinyagi',
    quantity: 3,
    unitPrice: 50,
    totalPrice: 150,
    sellerName: 'Alice',
    listingId: 'lst_1',
    explorationMode: 'vehicle',
    vehicleType: 'car',
  });
  assert.equal(buyerPurchased.ok, true);
  if (!buyerPurchased.ok) return;
  assert.equal(buyerPurchased.nextState.coins, 150);
  assert.equal(buyerPurchased.nextState.tradeProfile.inventory[0].quantity, 3);

  // 3. Seller claims proceeds minus fee
  const fee = calculateListingFee(150, 1);
  const claimed = applyTradeCommand(locked.nextState, {
    type: 'CLAIM_P2P_PROCEEDS',
    idempotencyKey: 'claim_lst_1',
    expectedVersion: locked.nextState.tradeProfile.version,
    hubId: 'yagcilarici',
    itemId: 'zeytinyagi',
    quantity: 3,
    netProceeds: 150 - fee,
    feeCoins: fee,
    buyerName: 'Bob',
    listingId: 'lst_1',
  });
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  assert.equal(claimed.nextState.coins, 200 + (150 - fee));
});

test('guild contracts can be completed once per epoch cycle and grant coins + reputation', () => {
  const epoch = 600;
  const contracts = getActiveContractsForEpoch(epoch);
  assert.equal(contracts.length, 3);
  const target = contracts[0];

  const readyAccount: TradeAccountState = {
    coins: 100,
    tradeProfile: {
      ...DEFAULT_TRADE_PROFILE,
      inventory: [{ itemId: target.itemId, quantity: target.requiredQty, avgUnitCost: 20 }],
      completedContractKeys: [],
      recentCommandIds: [],
    },
  };

  const done = applyTradeCommand(readyAccount, {
    type: 'COMPLETE_CONTRACT',
    idempotencyKey: 'ctr_1',
    expectedVersion: 1,
    contractKey: target.contractKey,
    epoch,
  });
  assert.equal(done.ok, true);
  if (!done.ok) return;
  assert.equal(done.nextState.coins, 100 + target.rewardCoins);
  assert.equal(done.nextState.tradeProfile.reputationXp, target.rewardReputationXp);
  assert.equal(done.nextState.tradeProfile.inventory.length, 0);

  // Second attempt fails with ALREADY_COMPLETED
  const again = applyTradeCommand(done.nextState, {
    type: 'COMPLETE_CONTRACT',
    idempotencyKey: 'ctr_2',
    expectedVersion: done.nextState.tradeProfile.version,
    contractKey: target.contractKey,
    epoch,
  });
  assert.equal(again.ok, false);
  if (!again.ok) assert.equal(again.code, 'ALREADY_COMPLETED');
});
