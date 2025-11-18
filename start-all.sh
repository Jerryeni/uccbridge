#!/bin/bash

# USDT Bridge - Start All Services

echo "========================================="
echo "  USDT Bridge - Starting All Services"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
echo ""

# Frontend Setup
echo -e "${YELLOW}📦 Setting up Frontend...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed"
fi
echo ""

# Backend Setup
echo -e "${YELLOW}📦 Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Backend .env file not found!${NC}"
    echo "Please copy backend/.env.example to backend/.env and configure it"
    cd ..
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "Backend dependencies already installed"
fi

mkdir -p logs
cd ..
echo ""

# Start services
echo -e "${GREEN}🚀 Starting Services...${NC}"
echo ""

# Start backend in background
echo -e "${YELLOW}Starting Backend Relayer...${NC}"
cd backend
npm start &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait a bit for backend to initialize
sleep 3

# Start frontend
echo -e "${YELLOW}Starting Frontend...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo "========================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend Logs: backend/logs/"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Services stopped'; exit 0" INT

# Keep script running
wait
