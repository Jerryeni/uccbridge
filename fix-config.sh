#!/bin/bash

# USDT Bridge - Configuration Fix Script
# This script fixes the configuration issues found in testing

echo "🔧 USDT Bridge - Configuration Fix"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    exit 1
fi

echo "📝 Fixing backend/.env configuration..."
echo ""

# Fix 1: Update BSC USDT address
echo "1️⃣  Updating BSC USDT address..."
if grep -q "BSC_USDT_ADDRESS=0x45643aB553621e611984Ff34633adf8E18dA2d55" backend/.env; then
    sed -i.bak 's/BSC_USDT_ADDRESS=0x45643aB553621e611984Ff34633adf8E18dA2d55/BSC_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955/' backend/.env
    echo -e "${GREEN}   ✅ BSC USDT address updated${NC}"
else
    echo -e "${YELLOW}   ⚠️  BSC USDT address already correct or not found${NC}"
fi

# Fix 2: Update UC Bridge address to match frontend
echo ""
echo "2️⃣  Checking UC Bridge address..."
if grep -q "UC_BRIDGE_ADDRESS=0xfc65F742bF0031a9d6b075806775B8b7FC51d95c" backend/.env; then
    echo -e "${YELLOW}   ⚠️  UC Bridge address differs from frontend${NC}"
    echo "   Frontend: 0x9b7f2CF537F81f2fCfd3252B993b7B12a47648d1"
    echo "   Backend:  0xfc65F742bF0031a9d6b075806775B8b7FC51d95c"
    echo ""
    read -p "   Update backend to match frontend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak 's/UC_BRIDGE_ADDRESS=0xfc65F742bF0031a9d6b075806775B8b7FC51d95c/UC_BRIDGE_ADDRESS=0x9b7f2CF537F81f2fCfd3252B993b7B12a47648d1/' backend/.env
        echo -e "${GREEN}   ✅ UC Bridge address updated${NC}"
    fi
else
    echo -e "${GREEN}   ✅ UC Bridge address looks good${NC}"
fi

# Fix 3: Update UC USDT address to match frontend
echo ""
echo "3️⃣  Checking UC USDT address..."
if grep -q "UC_USDT_ADDRESS=0x45643aB553621e611984Ff34633adf8E18dA2d55" backend/.env; then
    echo -e "${YELLOW}   ⚠️  UC USDT address differs from frontend${NC}"
    echo "   Frontend: 0x5B4bB8DC15B345D67Cc333Bd1266108DfE206c76"
    echo "   Backend:  0x45643aB553621e611984Ff34633adf8E18dA2d55"
    echo ""
    read -p "   Update backend to match frontend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak 's/UC_USDT_ADDRESS=0x45643aB553621e611984Ff34633adf8E18dA2d55/UC_USDT_ADDRESS=0x5B4bB8DC15B345D67Cc333Bd1266108DfE206c76/' backend/.env
        echo -e "${GREEN}   ✅ UC USDT address updated${NC}"
    fi
else
    echo -e "${GREEN}   ✅ UC USDT address looks good${NC}"
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ Configuration fixes applied!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes in backend/.env"
echo "   2. Fund relayer wallet with BNB:"
echo "      Address: 0xa4325aA618eA29728EcA5ca0849cbd1F6a3004DA"
echo "      Amount: 0.1 BNB minimum"
echo "   3. Run tests again: cd backend && node test-connection.js"
echo ""
echo "💾 Backup saved as: backend/.env.bak"
