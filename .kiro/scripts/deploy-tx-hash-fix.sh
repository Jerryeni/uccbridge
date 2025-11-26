#!/bin/bash

echo "🚀 Deploying Blockchain TX Hash Fix..."
echo ""

# Deploy backend
echo "📦 Deploying backend with API endpoint..."
cd backend
git add .
git commit -m "Add API endpoint for blockchain transaction hashes"
git push railway main
cd ..

echo ""
echo "⏳ Waiting 30 seconds for backend to deploy..."
sleep 30

# Deploy frontend
echo "🎨 Deploying frontend with real tx hash display..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "1. Make a new bridge transfer"
echo "2. Check transaction history"
echo "3. Click explorer links - should now work!"
echo ""
echo "📝 Note: Old transactions will show internal IDs until processed again"
