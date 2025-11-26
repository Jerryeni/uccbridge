const { ethers } = require('ethers');
const fs = require('fs');

// Read .env
const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const BSC_BRIDGE_ABI = [
  "event Deposit(address indexed user, uint256 amount, bytes32 depositId, string destinationChain, string destinationAddress)",
  "function processedDeposits(bytes32) view returns (bool)"
];

const UC_BRIDGE_ABI = [
  "function mint(address user, uint256 amount, bytes32 depositId) external",
  "function processedMints(bytes32) view returns (bool)"
];

async function findAndProcessDeposits(userAddress) {
  console.log('🔍 Finding deposits for:', userAddress);
  console.log('================================\n');

  const bscProvider = new ethers.JsonRpcProvider(envVars.BSC_RPC_URL);
  const ucProvider = new ethers.JsonRpcProvider(envVars.UC_RPC_URL);
  const ucWallet = new ethers.Wallet(envVars.RELAYER_PRIVATE_KEY, ucProvider);
  
  const bscBridge = new ethers.Contract(envVars.BSC_BRIDGE_ADDRESS, BSC_BRIDGE_ABI, bscProvider);
  const ucBridge = new ethers.Contract(envVars.UC_BRIDGE_ADDRESS, UC_BRIDGE_ABI, ucWallet);

  // Get current block
  const currentBlock = await bscProvider.getBlockNumber();
  console.log(`📊 Current BSC block: ${currentBlock}`);
  console.log(`🔎 Searching last 2,000 blocks in chunks...\n`);

  // Search last 2000 blocks in chunks of 500
  const totalBlocks = 2000;
  const chunkSize = 500;
  const events = [];
  
  for (let i = 0; i < totalBlocks; i += chunkSize) {
    const fromBlock = currentBlock - totalBlocks + i;
    const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
    
    console.log(`   Checking blocks ${fromBlock} to ${toBlock}...`);
    const filter = bscBridge.filters.Deposit(userAddress);
    const chunkEvents = await bscBridge.queryFilter(filter, fromBlock, toBlock);
    events.push(...chunkEvents);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`✅ Found ${events.length} deposit(s)\n`);

  for (const event of events) {
    const { user, amount, depositId, destinationAddress } = event.args;
    
    console.log('💰 Deposit Details:');
    console.log(`   Block: ${event.blockNumber}`);
    console.log(`   TX Hash: ${event.transactionHash}`);
    console.log(`   User: ${user}`);
    console.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDT`);
    console.log(`   Deposit ID: ${depositId}`);
    console.log(`   Destination: ${destinationAddress}`);
    
    // Check if processed
    const processed = await ucBridge.processedMints(depositId);
    console.log(`   Processed: ${processed ? '✅ YES' : '❌ NO'}`);
    
    if (!processed) {
      console.log('\n⚡ Processing now...');
      try {
        const tx = await ucBridge.mint(destinationAddress, amount, depositId);
        console.log(`   Mint TX: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`   ✅ Completed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

const userAddress = process.argv[2];
if (!userAddress) {
  console.log('Usage: node find-user-deposits.js <USER_ADDRESS>');
  process.exit(1);
}

findAndProcessDeposits(userAddress);
