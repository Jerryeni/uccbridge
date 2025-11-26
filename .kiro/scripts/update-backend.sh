#!/bin/bash

# Update existing bridge backend deployment

SERVER="root@72.61.226.99"
DEPLOY_DIR="/var/www/ucc-bridge-backend"

echo "=== Updating Bridge Backend on Hostinger ==="
echo ""

# Create update package with only necessary files
echo "📦 Creating update package..."
cd backend
tar -czf ../backend-update.tar.gz \
  .env \
  src/logger.js \
  src/relayer.js

cd ..

# Upload package
echo "📤 Uploading files to Hostinger..."
scp backend-update.tar.gz $SERVER:$DEPLOY_DIR/

# Extract and restart
echo "🚀 Updating and restarting service..."
ssh $SERVER << 'ENDSSH'
set -e
cd /var/www/ucc-bridge-backend

echo "📂 Backing up current files..."
cp .env .env.backup
cp src/logger.js src/logger.js.backup
cp src/relayer.js src/relayer.js.backup

echo "📂 Extracting updated files..."
tar -xzf backend-update.tar.gz
rm backend-update.tar.gz

echo "🔄 Restarting ucc-bridge-relayer service..."
pm2 restart ucc-bridge-relayer
pm2 save

echo ""
echo "✅ Update complete!"
echo ""
pm2 list | grep ucc-bridge-relayer

ENDSSH

# Cleanup
rm backend-update.tar.gz

echo ""
echo "✅ Backend updated successfully!"
echo "📝 To check logs: ssh $SERVER 'pm2 logs ucc-bridge-relayer'"
echo "📝 Transaction logs: ssh $SERVER 'tail -f /var/www/ucc-bridge-backend/logs/transactions.log'"
