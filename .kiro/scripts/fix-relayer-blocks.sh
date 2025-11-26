#!/bin/bash

# Emergency fix for relayer stuck on old blocks

SERVER="root@72.61.226.99"
BACKEND_DIR="/var/www/ucc-bridge-backend"

echo "=== Emergency Relayer Block Fix ==="
echo ""

# Get current block numbers
echo "📊 Getting current block numbers..."
BSC_CURRENT=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://bsc-dataseed.binance.org | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16))")
UC_CURRENT=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://rpc.mainnet.ucchain.org | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16))")

echo "   Current BSC Block: $BSC_CURRENT"
echo "   Current UC Block: $UC_CURRENT"
echo ""

# Calculate starting blocks (go back 100 blocks to catch recent transactions)
START_BSC=$((BSC_CURRENT - 100))
START_UC=$((UC_CURRENT - 100))

echo "📝 Updating .env to start from recent blocks..."
echo "   New START_BLOCK_BSC: $START_BSC"
echo "   New START_BLOCK_UC: $START_UC"
echo ""

ssh $SERVER << ENDSSH
cd $BACKEND_DIR

# Backup current .env
cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)

# Update START_BLOCK values
sed -i "s/^START_BLOCK_BSC=.*/START_BLOCK_BSC=$START_BSC/" .env
sed -i "s/^START_BLOCK_UC=.*/START_BLOCK_UC=$START_UC/" .env

echo "✅ Updated .env file"
cat .env | grep START_BLOCK

echo ""
echo "🔄 Restarting relayer..."
pm2 restart ucc-bridge-relayer
pm2 save

echo ""
echo "⏳ Waiting for relayer to start..."
sleep 5

echo ""
echo "📊 Relayer status:"
pm2 list | grep ucc-bridge-relayer

ENDSSH

echo ""
echo "✅ Fix applied! Relayer will now start from recent blocks."
echo ""
echo "📝 Monitor logs with:"
echo "   ssh $SERVER 'pm2 logs ucc-bridge-relayer'"
echo ""
echo "🔍 Check for your transaction:"
echo "   ssh $SERVER 'tail -f $BACKEND_DIR/logs/transactions.log'"
