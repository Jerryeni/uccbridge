#!/bin/bash

# USDT Bridge - Initial Setup Script

echo "========================================="
echo "  USDT Bridge - Initial Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
echo ""

# Frontend Setup
echo -e "${YELLOW}📦 Installing Frontend Dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo ""

# Backend Setup
echo -e "${YELLOW}📦 Installing Backend Dependencies...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Setup .env if not exists
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${YELLOW}⚙️  Setting up backend configuration...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created backend/.env from template${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: Edit backend/.env and add your RELAYER_PRIVATE_KEY${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

cd ..

# Create frontend .env if not exists
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local from template${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Configure backend/.env with your relayer private key:"
echo "   ${BLUE}nano backend/.env${NC}"
echo ""
echo "2. Start the services:"
echo "   ${BLUE}./start-all.sh${NC}"
echo ""
echo "   Or start individually:"
echo "   ${BLUE}npm run dev${NC}              # Frontend"
echo "   ${BLUE}cd backend && npm start${NC}  # Backend"
echo ""
echo "3. Open browser:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   - README.md - Overview"
echo "   - DEPLOYMENT.md - Deployment guide"
echo "   - TESTING.md - Testing guide"
echo "   - backend/README.md - Backend docs"
echo ""
echo -e "${GREEN}Happy bridging! 🌉${NC}"
echo ""
