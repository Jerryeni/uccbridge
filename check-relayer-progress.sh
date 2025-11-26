#!/bin/bash

echo "=== Checking Relayer Progress ==="
echo ""

# Get current BSC block
CURRENT_BLOCK=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://bsc-dataseed.binance.org | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16))")

echo "📊 Current BSC Block: $CURRENT_BLOCK"
echo ""

# Check relayer logs for current scanning position
echo "🔍 Checking relayer's current position..."
ssh root@72.61.226.99 "pm2 logs ucc-bridge-relayer --nostream --lines 20 2>&1 | grep -E 'Checking BSC blocks|Found.*deposit|Processing BSC deposit|Transfer Completed' | tail -10"

echo ""
echo "💡 Analysis:"
echo "   - Relayer scans 500 blocks per query"
echo "   - Takes ~2-5 seconds per query"
echo "   - Your transaction is somewhere in the last 10,000 blocks"
echo ""
echo "⏱️  Estimated time to reach your transaction:"
echo "   If 5,000 blocks behind: ~1-2 minutes"
echo "   If 10,000 blocks behind: ~2-4 minutes"
