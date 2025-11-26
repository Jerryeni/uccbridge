#!/bin/bash

# USDT Bridge Backend Deployment Script for Hostinger

SERVER="root@72.61.226.99"
DEPLOY_DIR="/var/www/bridge-backend"

echo "=== Backend Deployment to Hostinger ==="
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
cd backend
tar -czf ../backend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs/*.log' \
  .env .env.example package.json package-lock.json \
  src/ start.sh test-connection.js test-contracts.js 2>/dev/null

cd ..

# Upload package
echo "📤 Uploading files to Hostinger..."
scp backend-deploy.tar.gz $SERVER:$DEPLOY_DIR/

# Extract and restart
echo "🚀 Deploying and restarting backend service..."
ssh $SERVER << 'ENDSSH'
set -e
cd /var/www/bridge-backend

echo "📂 Extracting files..."
tar -xzf backend-deploy.tar.gz 2>/dev/null || tar -xzf backend-deploy.tar.gz --warning=no-unknown-keyword
rm backend-deploy.tar.gz

echo "📦 Installing dependencies..."
npm install --production

echo "📁 Creating logs directory..."
mkdir -p logs

echo "🔄 Stopping old relayer services..."
pm2 stop ucc-bridge-relayer 2>/dev/null || true
pm2 delete ucc-bridge-relayer 2>/dev/null || true
pm2 stop bridge-backend 2>/dev/null || true
pm2 delete bridge-backend 2>/dev/null || true

echo "🚀 Starting bridge-backend service..."
pm2 start npm --name "bridge-backend" -- start
pm2 save

echo ""
echo "✅ Backend deployment complete!"
echo ""
pm2 list | grep bridge-backend

ENDSSH

# Cleanup
rm backend-deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
