#!/bin/bash

# Check transaction status and relayer progress

SERVER="root@72.61.226.99"

echo "=== Transaction Status Checker ==="
echo ""

# Get current block numbers
echo "📊 Current Block Numbers:"
BSC_CURRENT=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://bsc-dataseed.binance.org | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16))" 2>/dev/null)
UC_CURRENT=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://rpc.mainnet.ucchain.org | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16))" 2>/dev/null)

echo "   BSC: $BSC_CURRENT"
echo "   UC:  $UC_CURRENT"
echo ""

# Check relayer status
echo "📡 Relayer Status:"
curl -s https://bridge.ucchain.org/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"   Status: {data['status']}\")
    print(f\"   Uptime: {data['uptime']:.0f} seconds ({data['uptime']/60:.1f} minutes)\")
except:
    print('   ❌ Could not connect to relayer')
" 2>/dev/null
echo ""

# Check relayer logs for progress
echo "🔍 Relayer Progress (last 10 lines):"
ssh $SERVER "pm2 logs ucc-bridge-relayer --nostream --lines 10 2>/dev/null | grep -E 'Checking|Found|blocks behind|Processing' | tail -10" 2>/dev/null || echo "   Could not fetch logs"
echo ""

# Check for recent deposits
echo "💰 Recent Deposits (last 5):"
ssh $SERVER "grep -i 'deposit detected\|transfer completed' /var/www/ucc-bridge-backend/logs/transactions.log 2>/dev/null | tail -5 | python3 -c \"
import sys, json
for line in sys.stdin:
    try:
        data = json.loads(line.strip())
        msg = data.get('message', '')
        amt = data.get('amount', 'N/A')
        status = data.get('status', 'N/A')
        print(f'   {msg}: {amt} USDT - {status}')
    except:
        pass
\"" 2>/dev/null || echo "   No recent deposits found"
echo ""

echo "📝 To manually process a transaction:"
echo "   node manual-process-tx.js <BSC_TX_HASH>"
echo ""
echo "📝 To view live logs:"
echo "   ssh $SERVER 'pm2 logs ucc-bridge-relayer'"
