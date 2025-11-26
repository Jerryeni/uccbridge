# Kiro Development Tools

This folder contains development tools, documentation, and helper scripts that are not part of the main application codebase.

## Structure

```
.kiro/
├── docs/          # Technical documentation and fix reports
├── scripts/       # Helper scripts for debugging and maintenance
└── README.md      # This file
```

## Documentation (`docs/`)

Technical documentation about fixes, optimizations, and system architecture:

- `BLOCKCHAIN-TX-HASH-FIX.md` - Fix for displaying real blockchain transaction hashes
- `TX-HASH-FIX-SUMMARY.md` - Quick summary of the tx hash fix
- `TX-HASH-FLOW-DIAGRAM.md` - Visual flow diagrams
- `DEPLOYMENT-CHECKLIST.md` - Deployment procedures
- `QUICK-REFERENCE.md` - Quick reference guide
- `RELAYER-OPTIMIZED.md` - Relayer optimization notes
- `TRANSACTION-STATUS-FIX.md` - Transaction status fixes
- `TRANSACTION-NOT-FOUND-DIAGNOSIS.md` - Debugging guide
- `FINAL-OPTIMIZATION-SUMMARY.md` - System optimization summary

## Scripts (`scripts/`)

Helper scripts for development, debugging, and maintenance:

### Deployment Scripts
- `deploy-backend.sh` - Deploy backend to Railway
- `deploy-tx-hash-fix.sh` - Deploy transaction hash fix
- `quick-deploy-frontend.sh` - Quick frontend deployment
- `update-backend.sh` - Update backend

### Testing Scripts
- `test-bridge-service.sh` - Test bridge service
- `test-system.sh` - System tests
- `test-tx-hash-api.sh` - Test transaction hash API
- `check-bridge-activity.sh` - Check bridge activity
- `check-relayer-progress.sh` - Monitor relayer progress
- `check-tx-status.sh` - Check transaction status

### Debugging Scripts
- `analyze-transactions.js` - Analyze transaction data
- `check-approval-and-balance.js` - Check token approvals and balances
- `check-correct-wallet.js` - Verify wallet configuration
- `check-deposit-status.js` - Check deposit status
- `check-system-status.js` - System health check
- `check-where-funds-are.js` - Track fund locations
- `find-missing-usdt.js` - Find missing USDT
- `find-user-deposits.js` - Find user deposits
- `verify-everything.js` - Comprehensive verification

### Manual Processing Scripts
- `manual-mint-now.js` - Manually trigger mint
- `manual-process-tx.js` - Manually process transaction
- `manual-scan-deposits.js` - Manual deposit scan
- `mint-with-correct-id.js` - Mint with specific ID
- `process-deposits-now.js` - Process pending deposits
- `process-second-deposit.js` - Process specific deposit
- `process-specific-deposit.js` - Process by deposit ID
- `recover-testnet-funds.js` - Recover testnet funds

### Maintenance Scripts
- `fix-relayer-blocks.sh` - Fix relayer block sync
- `view-logs.sh` - View system logs
- `setup.sh` - Initial setup
- `start-all.sh` - Start all services

## Usage

### Running Scripts

```bash
# From project root
.kiro/scripts/test-bridge-service.sh

# Or make executable and run
chmod +x .kiro/scripts/test-bridge-service.sh
.kiro/scripts/test-bridge-service.sh
```

### Reading Documentation

```bash
# View documentation
cat .kiro/docs/BLOCKCHAIN-TX-HASH-FIX.md
```

## Note

These files are kept separate from the main codebase to maintain a clean project structure. They are version controlled but not part of the production deployment.
