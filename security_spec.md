# Efeler Trading & Online Market — Security Specification (Phase 0)

## 1. Data Invariants

1. **Wallet & Private Profile Isolation (`/users/{userId}`)**:
   - Only the authenticated owner (`request.auth.uid == userId`) can `get`, `create`, `update`, or `delete` their profile.
   - `list` on `/users` is strictly denied (`false`).
   - `tradeProfile` is optional for backward compatibility, strictly validated when present (cargo tier `1..5`, inventory `<= 24` slots, positive quantity `1..999`, bounded command history `<= 32`).
   - No player can write to another player's `/users/{otherUid}` document; P2P trade settlements use the Escrow + Claim Vault pattern on `/marketListings`.

2. **P2P Escrow Market Listings (`/marketListings/{listingId}`)**:
   - Zero PII stored (`sellerUid`, `sellerName`, `sellerEmoji` only; no emails, phones, or addresses).
   - `id == listingId`, `totalPrice == quantity * unitPrice`, `feeCoins >= 0 && feeCoins <= totalPrice`.
   - Creation requires an existing seller profile (`exists(/users/$(uid))`), `status == 'open'`, `buyerUid == null`, `buyerName == null`, `claimedBySeller == false`, and server timestamps (`request.time`).
   - **Self-trade / Wash-trading Prevention**: Buyer filling a listing MUST satisfy `request.auth.uid != existing().sellerUid`.
   - **Terminal State Locking**: Once `status` is `'claimed'` or `'cancelled'`, ALL subsequent updates are unconditionally rejected.
   - **Action-Partitioned Transitions**:
     - `Cancel`: `open -> cancelled` by seller only (`affectedKeys().hasOnly(['status', 'updatedAt'])`).
     - `Fill`: `open -> sold` by non-seller verified user with existing profile (`affectedKeys().hasOnly(['status', 'buyerUid', 'buyerName', 'updatedAt'])`).
     - `Claim`: `sold (claimedBySeller == false) -> claimed (claimedBySeller == true)` by seller only (`affectedKeys().hasOnly(['status', 'claimedBySeller', 'updatedAt'])`).
   - Hard `delete` is forbidden (`allow delete: if false`) to preserve online market auditability.
   - `list` strictly enforces `resource.data.status == 'open' || resource.data.sellerUid == request.auth.uid || resource.data.buyerUid == request.auth.uid`.

3. **Immutable Trade Ledger (`/users/{userId}/tradeLedger/{entryId}`)**:
   - Master Gate: `create` requires `exists(/users/$(userId))`, `isVerified()`, `isOwner(userId)`, `incoming().uid == userId`, `incoming().id == entryId`, and `incoming().createdAt == request.time`.
   - Strictly append-only: `update` and `delete` are unconditionally denied (`false`).
   - `list` strictly enforces `isOwner(userId) && resource.data.uid == request.auth.uid`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return `PERMISSION_DENIED`)

1. **Identity Spoofing on Listing Create**: `bob` creates `/marketListings/l1` with `sellerUid: 'alice'`.
2. **Price Tampering / Math Bypass**: `alice` creates `/marketListings/l2` with `quantity: 5, unitPrice: 100, totalPrice: 10`.
3. **Self-Buy Wash Trading**: `alice` tries to update her own `open` listing to `status: 'sold', buyerUid: 'alice'`.
4. **Shadow Field Injection on Listing Update**: `bob` fills `alice`'s listing while injecting `isVerified: true` or mutating `unitPrice: 1`.
5. **State Shortcutting (Skip `sold` to `claimed`)**: `alice` updates an `open` listing directly to `status: 'claimed', claimedBySeller: true`.
6. **Double-Claim / Terminal State Mutation**: `alice` updates a `claimed` listing back to `status: 'sold', claimedBySeller: false`.
7. **Unauthorized Cancel**: `bob` tries to cancel `alice`'s `open` listing.
8. **Hard Delete Attempt**: `alice` tries to `deleteDoc` her own listing `/marketListings/l1`.
9. **Client Timestamp Spoofing**: `alice` creates a listing with a forged client `Timestamp` instead of `serverTimestamp()`.
10. **Unscoped Listing Scrape / Private Cancelled Read**: `bob` attempts to `get` `alice`'s `cancelled` listing (where `bob` is neither seller nor buyer).
11. **Ledger Tampering (Update/Delete)**: `alice` tries to `updateDoc` or `deleteDoc` an existing `/users/alice/tradeLedger/tx1` audit entry.
12. **Cargo Tier / Inventory Overflow Poisoning**: `alice` updates `/users/alice` with `tradeProfile.cargoTier: 99` or negative `coins: -500`.
