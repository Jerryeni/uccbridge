#!/bin/bash
set -e

SERVER="root@72.61.226.99"
DEPLOY_DIR="/var/www/swap-frontend"

echo "=== Quick Frontend Deployment ==="
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next/cache' \
  --exclude='backend' \
  .next package.json package-lock.json next.config.js \
  components pages lib styles contexts .env 2>/dev/null || \
tar -czf frontend-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next/cache' \
  --exclude='backend' \
  .next package.json package-lock.json next.config.js \
  components pages lib styles contexts .env --warning=no-file-changed

echo "✅ Package created"
echo ""

# Upload package
echo "📤 Uploading files..."
scp frontend-deploy.tar.gz $SERVER:$DEPLOY_DIR/

# Extract and restart
echo "🚀 Deploying and restarting..."
ssh $SERVER << ENDSSH
set -e
cd $DEPLOY_DIR

echo "📂 Extracting files..."
tar -xzf frontend-deploy.tar.gz 2>/dev/null || tar -xzf frontend-deploy.tar.gz --warning=no-unknown-keyword
rm frontend-deploy.tar.gz

echo "🔄 Restarting application..."
pm2 restart swap-frontend

echo ""
echo "⏳ Waiting for service to start..."
sleep 3

echo ""
echo "✅ Testing service..."
curl -I http://localhost:3003 | head -5

echo ""
echo "📊 PM2 Status:"
pm2 list | grep swap-frontend

ENDSSH

# Cleanup
rm frontend-deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
echo "🌐 Visit: https://swap.ucchain.org"
echo ""
echo "📝 To check logs: ssh $SERVER 'pm2 logs swap-frontend'"
