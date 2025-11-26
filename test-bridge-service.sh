#!/bin/bash

# Test Bridge Backend Service

echo "=== Bridge Backend Service Test ==="
echo ""

# Test public endpoint
echo "1. Testing public endpoint..."
echo "   URL: https://bridge.ucchain.org/health"
echo ""

RESPONSE=$(curl -s https://bridge.ucchain.org/health)
STATUS=$(echo $RESPONSE | jq -r '.status' 2>/dev/null)
UPTIME=$(echo $RESPONSE | jq -r '.uptime' 2>/dev/null)
SERVICE=$(echo $RESPONSE | jq -r '.service' 2>/dev/null)

if [ "$STATUS" = "ok" ]; then
    echo "   ✅ Service Status: $STATUS"
    echo "   📊 Service Name: $SERVICE"
    echo "   ⏱️  Uptime: $(printf "%.2f" $UPTIME) seconds ($(printf "%.2f" $(echo "$UPTIME / 60" | bc -l)) minutes)"
    echo ""
    echo "   Full Response:"
    echo $RESPONSE | jq .
else
    echo "   ❌ Service appears to be down or not responding correctly"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "2. Testing SSL certificate..."
CERT_INFO=$(curl -vI https://bridge.ucchain.org 2>&1 | grep -E "SSL certificate|subject:|issuer:")
if [ ! -z "$CERT_INFO" ]; then
    echo "   ✅ SSL is properly configured"
else
    echo "   ⚠️  Could not verify SSL certificate"
fi

echo ""
echo "3. Testing response time..."
START_TIME=$(date +%s%N)
curl -s https://bridge.ucchain.org/health > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(echo "scale=3; ($END_TIME - $START_TIME) / 1000000" | bc)
echo "   ⚡ Response time: ${RESPONSE_TIME}ms"

echo ""
echo "=== Test Complete ==="
