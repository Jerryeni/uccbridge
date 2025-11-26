#!/bin/bash

# Process pending transaction for user

SERVER="root@72.61.226.99"
USER_ADDRESS="0xfFF668776c211D09592F5089A9581E3A5a20A6f8"

echo "=== Processing Your Pending 10 USDT Transaction ==="
echo ""
echo "User Address: $USER_ADDRESS"
echo ""

# SSH into server and run the processing script
ssh $SERVER << 'ENDSSH'

# Navigate to backend directory
cd /var/www/ucc-bridge-backend

# Create a one-time processing script
cat > process-user-tx.js << 'EOF'
const { ethers } = require('ethers');
const fs = require('fs');

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const BSC_BRIDGE_ABI = [
  "event Deposit(address indexed user, uint256 amount, bytes32 depositId, string destinationChain, string destinationAddress)",
  "function processedDeposits(bytes32) view returns (bool)"
];

const UC_BRIDGE_ABI = [
  "function mint(address user, uint256 amount, bytes32 depositId) external",
  "function processedMints(bytes32) view returns (bool)"
];

async function processUserDeposits() {
  console.log('🔍 Searching for your deposits...\n');

  const bscProvider = new ethers.JsonRpcProvider(env.BSC_RPC_URL);
  const ucProvider = new ethers.JsonRpcProvider(env.UC_RPC_URL);
  const ucWallet = new ethers.Wallet(env.RELAYER_PRIVATE_KEY, ucProvider);
  
  const bscBridge = new ethers.Contract(env.BSC_BRIDGE_ADDRESS, BSC_BRIDGE_ABI, bscProvider);
  const ucBridge = new ethers.Contract(env.UC_BRIDGE_ADDRESS, UC_BRIDGE_ABI, ucWallet);

  const userAddress = process.argv[2];
  const currentBlock = await bscProvider.getBlockNumber();
  
  console.log(`📊 Current BSC block: ${currentBlock}`);
  console.log(`🔎 Searching last 5,000 blocks...\n`);

  // Search in chunks to avoid rate limits
  const totalBlocks = 5000;
  const chunkSize = 100;
  let allEvents = [];
  
  for (let i = 0; i < totalBlocks; i += chunkSize) {
    const fromBlock = currentBlock - totalBlocks + i;
    const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
    
    try {
      const filter = bscBridge.filters.Deposit(userAddress);
      const events = await bscBridge.queryFilter(filter, fromBlock, toBlock);
      allEvents.push(...events);
      
      if (events.length > 0) {
        console.log(`   ✅ Found ${events.length} deposit(s) in blocks ${fromBlock}-${toBlock}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.log(`   ⚠️  Error in blocks ${fromBlock}-${toBlock}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n✅ Total deposits found: ${allEvents.length}\n`);

  for (const event of allEvents) {
    const { user, amount, depositId, destinationAddress } = event.args;
    
    console.log('💰 Deposit Details:');
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   TX Hash: ${event.transactionHash}`);
    console.log(`   User: ${user}`);
    console.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDT`);
    console.log(`   Deposit ID: ${depositId}`);
    console.log(`   Destination: ${destinationAddress}`);
    
    // Check if processed on UC
    const processed = await ucBridge.processedMints(depositId);
    console.log(`   Processed on UC: ${processed ? '✅ YES' : '❌ NO'}`);
    
    if (!processed) {
      console.log('\n⚡ Processing now...');
      try {
        const tx = await ucBridge.mint(destinationAddress, amount, depositId);
        console.log(`   📤 Mint TX sent: ${tx.hash}`);
        console.log(`   ⏳ Waiting for confirmation...`);
        
        const receipt = await tx.wait();
        console.log(`   ✅ Completed in block ${receipt.blockNumber}`);
        console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`\n🎉 SUCCESS! Your 10 USDT has been credited on UC Chain!`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.message.includes('already processed')) {
          console.log(`   ℹ️  This deposit was already processed on UC Chain`);
        }
      }
    } else {
      console.log(`   ℹ️  Already processed - your USDT is already on UC Chain`);
    }
    console.log('');
  }
  
  if (allEvents.length === 0) {
    console.log('❌ No deposits found for this address in the last 5,000 blocks');
    console.log('   The transaction might be older or on a different address');
  }
}

processUserDeposits().catch(console.error);
EOF

# Run the script
echo "🚀 Running processing script..."
node process-user-tx.js 0xfFF668776c211D09592F5089A9581E3A5a20A6f8

# Cleanup
rm process-user-tx.js

ENDSSH

echo ""
echo "✅ Processing complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Refresh your transaction page: https://swap.ucchain.org/transactions"
echo "   2. Your transaction should now show as 'Completed'"
echo "   3. Check your UC Chain wallet balance"
