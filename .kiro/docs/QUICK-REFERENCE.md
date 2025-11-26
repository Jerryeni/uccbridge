# Quick Reference - Transaction Hash Fix

## What Changed?

**Before**: Transaction history showed contract-generated IDs (not real blockchain tx hashes)
**After**: Transaction history shows actual blockchain transaction hashes with working explorer links

## Files Changed

| File | What Changed |
|------|--------------|
| `backend/src/state.js` | Added tx hash storage methods |
| `backend/src/relayer.js` | Captures blockchain tx hashes |
| `backend/src/index.js` | Added API endpoints |
| `lib/transactionService.js` | Fetches tx hashes from API |
| `components/TransactionHistory.js` | Displays real tx hashes |
| `.env` | Added relayer URL |

## API Endpoints

### Get Transaction Hashes
```bash
GET /api/tx-hashes/:transactionId
```

### Get All Hashes
```bash
GET /api/tx-hashes
```

## Quick Deploy

```bash
./deploy-tx-hash-fix.sh
```

## Quick Test

```bash
./test-tx-hash-api.sh
```

## Environment Variables

### Frontend (.env)
```bash
NEXT_PUBLIC_RELAYER_URL=https://usdt-bridge-relayer-production.up.railway.app
```

### Backend (backend/.env)
```bash
PORT=3002
```

## Testing Checklist

- [ ] API health check works
- [ ] Make test deposit
- [ ] Check transaction history
- [ ] Click BSCScan link (should work)
- [ ] Click UCCScan link (should work)

## Common Issues

### Issue: Explorer link doesn't work
**Solution**: Check if transaction is old (before fix). Old transactions won't have blockchain tx hashes.

### Issue: API returns 404
**Solution**: Verify backend is deployed and running on Railway.

### Issue: CORS error
**Solution**: Backend should have CORS headers enabled. Check `backend/src/index.js`.

## Support Commands

```bash
# Check backend health
curl https://usdt-bridge-relayer-production.up.railway.app/health

# Check API
curl https://usdt-bridge-relayer-production.up.railway.app/api/tx-hashes

# View backend logs
railway logs

# View state file (on server)
cat relayer-state.json | jq .transactionHashes
```

## Key Benefits

1. ✅ Working explorer links
2. ✅ Verifiable transactions
3. ✅ Better user trust
4. ✅ Easier debugging
5. ✅ Audit trail

## Documentation

- 📘 Full details: `BLOCKCHAIN-TX-HASH-FIX.md`
- 📝 Summary: `TX-HASH-FIX-SUMMARY.md`
- 📊 Flow diagram: `TX-HASH-FLOW-DIAGRAM.md`
- ✅ Deployment: `DEPLOYMENT-CHECKLIST.md`
