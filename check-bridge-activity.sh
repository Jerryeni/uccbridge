#!/bin/bash

# Check Bridge Activity and Statistics

SERVER="root@72.61.226.99"
LOG_FILE="/var/www/ucc-bridge-backend/logs/transactions.log"

echo "=== Bridge Activity Monitor ==="
echo ""

# Check service status
echo "1. Service Status:"
curl -s https://bridge.ucchain.org/health | jq '.'
echo ""

# Get transaction statistics from server
echo "2. Transaction Statistics:"
echo ""

ssh $SERVER << 'ENDSSH'
cd /var/www/ucc-bridge-backend/logs

if [ -f transactions.log ]; then
    echo "   📊 Log File Size: $(du -h transactions.log | cut -f1)"
    echo "   📝 Total Log Entries: $(wc -l < transactions.log)"
    echo ""
    
    # Count completed transactions
    COMPLETED=$(grep -c '"status":"completed"' transactions.log 2>/dev/null || echo "0")
    echo "   ✅ Completed Transfers: $COMPLETED"
    
    # Count failed transactions
    FAILED=$(grep -c '"status":"failed"' transactions.log 2>/dev/null || echo "0")
    echo "   ❌ Failed Transfers: $FAILED"
    
    # Count pending transactions
    PENDING=$(grep -c '"status":"pending"' transactions.log 2>/dev/null || echo "0")
    echo "   ⏳ Pending Transfers: $PENDING"
    
    echo ""
    echo "   Direction Breakdown:"
    BSC_TO_UC=$(grep -c '"direction":"BSC -> UC"' transactions.log 2>/dev/null || echo "0")
    UC_TO_BSC=$(grep -c '"direction":"UC -> BSC"' transactions.log 2>/dev/null || echo "0")
    echo "   📤 BSC → UC: $BSC_TO_UC transfers"
    echo "   📥 UC → BSC: $UC_TO_BSC transfers"
    
    echo ""
    echo "3. Recent Activity (last 5 transactions):"
    echo ""
    tail -5 transactions.log | jq -r 'select(.type == "transaction") | "   [\(.timestamp)] \(.message) | \(.amount // "N/A") USDT | Status: \(.status // "N/A")"' 2>/dev/null || echo "   No recent transactions"
else
    echo "   ⚠️  Transaction log file not found"
fi

ENDSSH

echo ""
echo "=== Monitor Complete ==="
