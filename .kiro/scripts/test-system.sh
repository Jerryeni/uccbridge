#!/bin/bash

# USDT Bridge - Complete System Test

echo "╔════════════════════════════════════════╗"
echo "║   USDT Bridge - System Test           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_step() {
    local name="$1"
    local command="$2"
    
    echo -e "${BLUE}Testing:${NC} $name"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check Node.js
echo -e "\n${YELLOW}━━━ Environment Check ━━━${NC}"
test_step "Node.js installed" "command -v node"
test_step "npm installed" "command -v npm"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${BLUE}ℹ${NC} Node version: $NODE_VERSION"
fi

# Check project structure
echo -e "\n${YELLOW}━━━ Project Structure ━━━${NC}"
test_step "Frontend package.json exists" "test -f package.json"
test_step "Backend directory exists" "test -d backend"
test_step "Backend package.json exists" "test -f backend/package.json"
test_step "Components directory exists" "test -d components"
test_step "Pages directory exists" "test -d pages"
test_step "Lib directory exists" "test -d lib"

# Check configuration files
echo -e "\n${YELLOW}━━━ Configuration Files ━━━${NC}"
test_step "lib/contracts.js exists" "test -f lib/contracts.js"
test_step "backend/src/config.js exists" "test -f backend/src/config.js"
test_step "backend/src/abis.js exists" "test -f backend/src/abis.js"
test_step "backend/src/relayer.js exists" "test -f backend/src/relayer.js"
test_step "backend/.env.example exists" "test -f backend/.env.example"

# Check if backend .env is configured
echo -e "\n${YELLOW}━━━ Backend Configuration ━━━${NC}"
if [ -f backend/.env ]; then
    echo -e "${GREEN}✓${NC} backend/.env exists"
    ((TESTS_PASSED++))
    
    if grep -q "RELAYER_PRIVATE_KEY=" backend/.env; then
        if grep -q "RELAYER_PRIVATE_KEY=your_private_key" backend/.env; then
            echo -e "${YELLOW}⚠${NC} RELAYER_PRIVATE_KEY not configured (using placeholder)"
        else
            echo -e "${GREEN}✓${NC} RELAYER_PRIVATE_KEY configured"
            ((TESTS_PASSED++))
        fi
    else
        echo -e "${RED}✗${NC} RELAYER_PRIVATE_KEY not found in .env"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} backend/.env not found"
    echo -e "  ${BLUE}ℹ${NC} Run: cp backend/.env.example backend/.env"
    ((TESTS_FAILED++))
fi

# Check dependencies
echo -e "\n${YELLOW}━━━ Dependencies ━━━${NC}"
if [ -d node_modules ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Frontend dependencies not installed"
    echo -e "  ${BLUE}ℹ${NC} Run: npm install"
    ((TESTS_FAILED++))
fi

if [ -d backend/node_modules ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Backend dependencies not installed"
    echo -e "  ${BLUE}ℹ${NC} Run: cd backend && npm install"
    ((TESTS_FAILED++))
fi

# Check contract addresses in lib/contracts.js
echo -e "\n${YELLOW}━━━ Contract Configuration ━━━${NC}"
if grep -q "0xE4363F8FbD39FB0930772644Ebd14597e5756986" lib/contracts.js; then
    echo -e "${GREEN}✓${NC} BSC Bridge address configured"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} BSC Bridge address not found"
    ((TESTS_FAILED++))
fi

if grep -q "0x9b7f2CF537F81f2fCfd3252B993b7B12a47648d1" lib/contracts.js; then
    echo -e "${GREEN}✓${NC} UC Bridge address configured"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} UC Bridge address not found"
    ((TESTS_FAILED++))
fi

# Run backend connection test if configured
echo -e "\n${YELLOW}━━━ Backend Connection Test ━━━${NC}"
if [ -f backend/.env ] && ! grep -q "RELAYER_PRIVATE_KEY=your_private_key" backend/.env 2>/dev/null; then
    echo -e "${BLUE}ℹ${NC} Running connection test..."
    if cd backend && node test-connection.js; then
        echo -e "${GREEN}✓${NC} Backend connection test passed"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Backend connection test failed"
        ((TESTS_FAILED++))
    fi
    cd ..
else
    echo -e "${YELLOW}⚠${NC} Skipping connection test (RELAYER_PRIVATE_KEY not configured)"
    echo -e "  ${BLUE}ℹ${NC} Configure backend/.env to run connection tests"
fi

# Run contract test if configured
echo -e "\n${YELLOW}━━━ Contract Test ━━━${NC}"
if [ -f backend/.env ] && ! grep -q "RELAYER_PRIVATE_KEY=your_private_key" backend/.env 2>/dev/null; then
    echo -e "${BLUE}ℹ${NC} Running contract test..."
    if cd backend && node test-contracts.js; then
        echo -e "${GREEN}✓${NC} Contract test passed"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Contract test failed"
        ((TESTS_FAILED++))
    fi
    cd ..
else
    echo -e "${YELLOW}⚠${NC} Skipping contract test (RELAYER_PRIVATE_KEY not configured)"
fi

# Summary
echo -e "\n${YELLOW}━━━ Test Summary ━━━${NC}"
echo ""
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  ${BLUE}Total:  $((TESTS_PASSED + TESTS_FAILED))${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! System is ready.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Configure backend/.env with RELAYER_PRIVATE_KEY"
    echo "  2. Run: ./start-all.sh"
    echo "  3. Open: http://localhost:3000"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $TESTS_FAILED test(s) failed. Please fix the issues.${NC}"
    echo ""
    echo -e "${BLUE}Common fixes:${NC}"
    echo "  - Run: npm install"
    echo "  - Run: cd backend && npm install"
    echo "  - Configure: backend/.env"
    echo ""
    exit 1
fi
