# Transaction Hash Flow - Before vs After

## BEFORE (Broken) ❌

```
User deposits on BSC
    ↓
Contract generates internal ID: keccak256(user, amount, timestamp, nonce)
    = 0x7a3f9b2c... (internal ID, NOT a blockchain tx hash)
    ↓
Frontend displays: 0x7a3f9b2c...
    ↓
User clicks "View on BSCScan"
    ↓
BSCScan: "Transaction not found" ❌
    (Because 0x7a3f9b2c... is not a real blockchain tx hash)
```

## AFTER (Fixed) ✅

```
User deposits on BSC
    ↓
Blockchain creates tx: 0xabc123... (REAL BSC tx hash)
    ↓
Contract generates internal ID: 0x7a3f9b2c...
    ↓
Relayer detects deposit:
    - Captures BSC tx hash: 0xabc123...
    - Stores: { internalId: 0x7a3f9b2c..., bscTxHash: 0xabc123... }
    ↓
Relayer mints on UC
    ↓
Blockchain creates tx: 0xdef456... (REAL UC tx hash)
    ↓
Relayer updates storage:
    - { internalId: 0x7a3f9b2c..., bscTxHash: 0xabc123..., ucTxHash: 0xdef456... }
    ↓
Frontend fetches from API:
    GET /api/tx-hashes/0x7a3f9b2c...
    ↓
API returns:
    {
      sourceTxHash: "0xabc123...",
      destTxHash: "0xdef456...",
      sourceChain: "BSC",
      destChain: "UC"
    }
    ↓
Frontend displays:
    - Deposit TX (BSC): 0xabc123... [View on BSCScan]
    - Mint TX (UC): 0xdef456... [View on UCCScan]
    ↓
User clicks "View on BSCScan"
    ↓
BSCScan: Shows real transaction ✅
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **What's displayed** | Internal contract ID | Real blockchain tx hashes |
| **Explorer links** | Broken (404) | Working ✅ |
| **Verifiable** | No | Yes ✅ |
| **User trust** | Low | High ✅ |
| **Support debugging** | Difficult | Easy ✅ |

## Data Storage

### State File Structure
```json
{
  "lastBscBlock": 12345,
  "lastUcBlock": 67890,
  "processedDeposits": ["0x7a3f9b2c..."],
  "processedBurns": ["0x8b4e0d3f..."],
  "transactionHashes": {
    "0x7a3f9b2c...": {
      "type": "deposit",
      "sourceTxHash": "0xabc123...",
      "destTxHash": "0xdef456...",
      "sourceChain": "BSC",
      "destChain": "UC",
      "timestamp": 1234567890
    }
  }
}
```

## API Flow

```
Frontend                    Backend API                 State Manager
   |                            |                             |
   |-- GET /api/tx-hashes/ID -->|                             |
   |                            |-- getTransactionHashes() -->|
   |                            |<-- { sourceTx, destTx } ----|
   |<-- JSON response ----------|                             |
   |                            |                             |
   |-- Display real tx hashes   |                             |
   |-- Show explorer links      |                             |
```

## Transaction Types

### Deposit (BSC → UC)
- **Source TX**: BSC blockchain transaction (user calls deposit())
- **Dest TX**: UC blockchain transaction (relayer calls mint())

### Burn (UC → BSC)
- **Source TX**: UC blockchain transaction (user calls burn())
- **Dest TX**: BSC blockchain transaction (relayer calls unlock())

## Benefits Summary

1. ✅ **Transparency**: Users can verify transactions on block explorers
2. ✅ **Trust**: Real blockchain evidence of transfers
3. ✅ **Debugging**: Support team can trace exact transactions
4. ✅ **Compliance**: Auditable transaction trail
5. ✅ **User Experience**: Working explorer links build confidence
