# Blockchain Transaction Hash Fix

## Problem
The transaction history was displaying contract-generated internal IDs (bytes32 hashes) instead of actual blockchain transaction hashes. When users clicked "View on Explorer", it would fail because BSCScan/UCCScan don't recognize these internal IDs.

## Root Cause
- The smart contract generates internal transaction IDs using `keccak256` hashing
- These IDs are NOT the same as blockchain transaction hashes
- The frontend was trying to use these internal IDs as if they were real tx hashes

## Solution Implemented

### 1. Backend State Management Enhancement
**File: `backend/src/state.js`**
- Added `transactionHashes` object to store mapping of internal IDs to real blockchain tx hashes
- Added methods:
  - `addDepositTxHashes(depositId, bscTxHash, ucTxHash)` - Store deposit transaction hashes
  - `addBurnTxHashes(burnId, ucTxHash, bscTxHash)` - Store burn transaction hashes
  - `getTransactionHashes(id)` - Retrieve tx hashes by internal ID
  - `getAllTransactionHashes()` - Get all stored tx hashes

### 2. Relayer Updates
**File: `backend/src/relayer.js`**
- Modified deposit processing to store both BSC (source) and UC (destination) tx hashes
- Modified burn processing to store both UC (source) and BSC (destination) tx hashes
- Tx hashes are captured when transactions are confirmed and stored in state

### 3. API Endpoint
**File: `backend/src/index.js`**
- Added `/api/tx-hashes/:id` endpoint to retrieve blockchain tx hashes by internal ID
- Added `/api/tx-hashes` endpoint to get all transaction hashes
- Enabled CORS for frontend access

### 4. Frontend Service
**File: `lib/transactionService.js`**
- Added `fetchBlockchainTxHashes(transactionId)` method to query relayer API
- Modified `getUserTransactions()` to fetch and attach real blockchain tx hashes
- Added `blockchainTxHashes` field to transaction objects

### 5. UI Updates
**File: `components/TransactionHistory.js`**
- Updated to display actual blockchain transaction hashes with explorer links
- Shows source chain tx (deposit/burn) with working BSCScan/UCCScan link
- Shows destination chain tx (mint/unlock) with working explorer link
- Falls back to internal ID display if blockchain hashes aren't available yet

## Data Structure

### Stored Transaction Hash Object
```javascript
{
  type: 'deposit' | 'burn',
  sourceTxHash: '0x...', // Blockchain tx hash on source chain
  destTxHash: '0x...',   // Blockchain tx hash on destination chain
  sourceChain: 'BSC' | 'UC',
  destChain: 'UC' | 'BSC',
  timestamp: 1234567890
}
```

## Benefits
1. ✅ Users can now click explorer links and see actual blockchain transactions
2. ✅ Transaction verification is possible through block explorers
3. ✅ Better transparency and trust
4. ✅ Easier debugging and support
5. ✅ Backward compatible - falls back gracefully for old transactions

## Testing
1. Make a new bridge transfer (BSC → UC)
2. Check transaction history - should show real blockchain tx hashes
3. Click explorer links - should open BSCScan/UCCScan with valid transactions
4. Verify both source and destination tx hashes are displayed

## Deployment
1. Deploy backend with updated state management and API
2. Deploy frontend with updated transaction display
3. Existing transactions will show internal IDs until processed again
4. New transactions will immediately show blockchain tx hashes
