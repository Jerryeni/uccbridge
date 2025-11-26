const { ethers } = require('ethers');
const fs = require('fs');

// Load .env manually
const envContent = fs.readFileSync('./.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)',
  'function mint(address user, uint256 amount, uint256 depositId) external'
];

async function scanAndProcess() {
  console.log('=== MANUAL DEPOSIT SCAN & PROCESS ===\n');
  
  // Use backup RPC to avoid rate limits
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
  const ucProvider = new ethers.JsonRpcProvider(envVars.UC_RPC_URL);
  
  const bscBridge = new ethers.Contract(envVars.BSC_BRIDGE_ADDRESS, BRIDGE_ABI, bscProvider);
  
  const ucWallet = new ethers.Wallet(envVars.RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(envVars.UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('Scanning for deposits in last 100 blocks...');
  const currentBlock = await bscProvider.getBlockNumber();
  const fromBlock = currentBlock - 100;
  
  console.log('Current block:', currentBlock);
  console.log('Scanning from:', fromBlock);
  console.log('');
  
  try {
    // Get all deposits (not filtered by user)
    const filter = bscBridge.filters.Deposit();
    const events = await bscBridge.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`Found ${events.length} total deposit(s)\n`);
    
    if (events.length === 0) {
      console.log('No deposits found in this range.');
      console.log('Try checking a larger range or specific transaction hash.');
      return;
    }
    
    for (const event of events) {
      const { user, amount, depositId, destinationAddress } = event.args;
      const block = await event.getBlock();
      
      console.log('─'.repeat(60));
      console.log('Deposit Found:');
      console.log('  Block:', event.blockNumber);
      console.log('  Tx Hash:', event.transactionHash);
      console.log('  User:', user);
      console.log('  Destination:', destinationAddress);
      console.log('  Amount:', ethers.formatEther(amount), 'BNB');
      console.log('  Deposit ID:', depositId.toString());
      console.log('  Time:', new Date(block.timestamp * 1000).toISOString());
      console.log('  Confirmations:', currentBlock - event.blockNumber);
      
      // Ask if user wants to process this
      console.log('\n  Processing this deposit to UC Chain...');
      
      try {
        const tx = await ucBridge.mint(
          destinationAddress,
          amount,
          depositId
        );
        
        console.log('  ✅ Mint transaction sent:', tx.hash);
        console.log('  Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('  ✅ Confirmed! Block:', receipt.blockNumber);
        console.log('  Gas used:', receipt.gasUsed.toString());
        
      } catch (error) {
        if (error.message.includes('already processed')) {
          console.log('  ℹ️  Already processed');
        } else {
          console.log('  ❌ Error:', error.message);
        }
      }
      
      console.log('');
    }
    
    console.log('=== SCAN COMPLETE ===');
    
  } catch (error) {
    console.error('Error scanning:', error.message);
  }
}

scanAndProcess().catch(console.error);
