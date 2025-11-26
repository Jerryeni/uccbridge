#!/bin/bash

echo "🧪 Testing Transaction Hash API..."
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s https://usdt-bridge-relayer-production.up.railway.app/health | jq .
echo ""

# Test get all tx hashes
echo "2️⃣ Testing get all transaction hashes..."
curl -s https://usdt-bridge-relayer-production.up.railway.app/api/tx-hashes | jq . | head -20
echo ""

# Test get specific tx hash (if you have a transaction ID)
if [ ! -z "$1" ]; then
  echo "3️⃣ Testing get specific transaction hash for ID: $1"
  curl -s "https://usdt-bridge-relayer-production.up.railway.app/api/tx-hashes/$1" | jq .
  echo ""
else
  echo "💡 Tip: Run with a transaction ID to test specific lookup:"
  echo "   ./test-tx-hash-api.sh 0x1234..."
fi

echo ""
echo "✅ API test complete!"
