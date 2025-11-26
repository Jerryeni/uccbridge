# Deployment Checklist - Transaction Hash Fix

## Pre-Deployment Checks

- [x] Backend state manager updated with tx hash storage
- [x] Relayer captures and stores blockchain tx hashes
- [x] API endpoints added for tx hash retrieval
- [x] Frontend service fetches tx hashes from API
- [x] UI displays real blockchain tx hashes
- [x] All files pass syntax/lint checks
- [x] CORS enabled on backend API
- [x] Environment variables configured

## Deployment Steps

### 1. Backend Deployment

```bash
cd backend
git add .
git commit -m "Add blockchain tx hash tracking and API endpoints"
git push railway main
```

**Wait for deployment to complete** (~2-3 minutes)

### 2. Verify Backend API

```bash
# Test health endpoint
curl https://usdt-bridge-relayer-production.up.railway.app/health

# Test tx hash endpoint
curl https://usdt-bridge-relayer-production.up.railway.app/api/tx-hashes
```

### 3. Frontend Deployment

```bash
# From project root
vercel --prod
```

**Wait for deployment to complete** (~1-2 minutes)

### 4. Post-Deployment Testing

#### Test 1: API Endpoints
```bash
./test-tx-hash-api.sh
```
Expected: API responds with 200 OK

#### Test 2: Make a Test Transaction
1. Connect wallet to bridge
2. Make a small deposit (e.g., 1 USDT)
3. Wait for confirmation (~30 seconds)
4. Go to Transaction History

#### Test 3: Verify Transaction Display
- [ ] Transaction appears in history
- [ ] Shows "Deposit TX (BSC)" with real tx hash
- [ ] Shows "Mint TX (UC)" with real tx hash
- [ ] Both explorer links work
- [ ] Clicking BSCScan link shows valid transaction
- [ ] Clicking UCCScan link shows valid transaction

#### Test 4: Old Transactions
- [ ] Old transactions show "Internal Transaction ID"
- [ ] Message: "Blockchain tx hashes not available yet"
- [ ] No broken explorer links

## Rollback Plan

If issues occur:

### Backend Rollback
```bash
cd backend
git revert HEAD
git push railway main
```

### Frontend Rollback
```bash
vercel rollback
```

## Monitoring

### Check Logs
```bash
# Backend logs
railway logs

# Frontend logs (Vercel dashboard)
# Visit: https://vercel.com/dashboard
```

### Watch for Errors
- API 404 errors on `/api/tx-hashes/*`
- CORS errors in browser console
- Transaction display issues
- Explorer link failures

## Success Criteria

- [x] Backend API responds to health checks
- [ ] API returns tx hashes for new transactions
- [ ] Frontend displays real blockchain tx hashes
- [ ] Explorer links open valid transactions
- [ ] No console errors
- [ ] Old transactions display gracefully
- [ ] New transactions show full tx hash info

## Known Limitations

1. **Old Transactions**: Transactions processed before this fix will not have blockchain tx hashes stored. They will show internal IDs only.

2. **Pending Transactions**: Transactions still being processed may not have destination tx hash yet (only source tx hash available).

3. **API Dependency**: Frontend depends on backend API being available. If API is down, falls back to internal ID display.

## Support Information

### If Users Report Issues

1. **"Explorer link doesn't work"**
   - Check if transaction is old (before fix deployment)
   - Verify API is responding: `curl https://usdt-bridge-relayer-production.up.railway.app/health`
   - Check browser console for CORS errors

2. **"Transaction not showing"**
   - Check if transaction is confirmed on blockchain
   - Verify relayer is running: Check Railway logs
   - Wait 1-2 minutes for blockchain confirmation

3. **"Only shows internal ID"**
   - Normal for old transactions (before fix)
   - For new transactions, check API response
   - Verify relayer stored tx hashes in state

## Documentation

- **Detailed Fix**: `BLOCKCHAIN-TX-HASH-FIX.md`
- **Quick Summary**: `TX-HASH-FIX-SUMMARY.md`
- **Flow Diagram**: `TX-HASH-FLOW-DIAGRAM.md`
- **This Checklist**: `DEPLOYMENT-CHECKLIST.md`

## Contact

If deployment issues occur:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Review browser console for client-side errors
4. Test API endpoints manually with curl

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Backend Version**: _____________
**Frontend Version**: _____________
**Status**: [ ] Success [ ] Partial [ ] Failed
**Notes**: _____________________________________________
