const { ethers } = require('ethers');
const fs = require('fs');

// Load .env manually
const envContent = fs.readFileSync('./backend/.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});
process.env = { ...process.env, ...envVars };

// This script manually processes deposits from BSC to UC Chain
// It scans recent blocks and processes any pending deposits

const BSC_RPC = 'https://bsc-dataseed2.binance.org'; // Use different RPC
const UC_RPC = 'https://rpc.mainnet.ucchain.org';

const BSC_BRIDGE_ADDRESS = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const UC_BRIDGE_ADDRESS = '0x0eAf708770c97152A2369CC28e356FBaA87e7E42';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)',
  'function mint(address user, uint256 amount, uint256 depositId) external'
];

async function processDeposits() {
  console.log('=== MANUAL DEPOSIT PROCESSING ===\n');
  
  // Setup providers
  const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
  const ucProvider = new ethers.JsonRpcProvider(UC_RPC);
  
  // Setup contracts
  const bscBridge = new ethers.Contract(BSC_BRIDGE_ADDRESS, BRIDGE_ABI, bscProvider);
  
  const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('Relayer address:', ucWallet.address);
  console.log('BSC Bridge:', BSC_BRIDGE_ADDRESS);
  console.log('UC Bridge:', UC_BRIDGE_ADDRESS);
  console.log('');
  
  // Check relayer has UC for gas
  const ucBalance = await ucProvider.getBalance(ucWallet.address);
  console.log('Relayer UC balance:', ethers.formatEther(ucBalance), 'UC');
  
  if (parseFloat(ethers.formatEther(ucBalance)) < 0.01) {
    console.log('⚠️  WARNING: Low UC balance! Need UC for gas fees on UC Chain.');
  }
  console.log('');
  
  // Scan last 20 blocks for deposits (smaller range to avoid rate limit)
  console.log('Scanning BSC for deposits...');
  const currentBlock = await bscProvider.getBlockNumber();
  const fromBlock = currentBlock - 20; // Last 20 blocks only
  
  console.log('Current block:', currentBlock);
  console.log('Scanning from block:', fromBlock);
  console.log('');
  
  try {
    const filter = bscBridge.filters.Deposit();
    const events = await bscBridge.queryFilter(filter, fromBlock, currentBlock);
    
    console.log(`Found ${events.length} deposit(s) in last 100 blocks\n`);
    
    if (events.length === 0) {
      console.log('No deposits found. Try scanning more blocks or check specific TX hash.');
      return;
    }
    
    // Process each deposit
    for (const event of events) {
      const { user, amount, depositId, destinationAddress } = event.args;
      const block = await event.getBlock();
      
      console.log('─'.repeat(70));
      console.log('📥 DEPOSIT FOUND');
      console.log('─'.repeat(70));
      console.log('Block:', event.blockNumber);
      console.log('TX Hash:', event.transactionHash);
      console.log('User:', user);
      console.log('Destination:', destinationAddress);
      console.log('Amount:', ethers.formatUnits(amount, 18), 'USDT');
      console.log('Deposit ID:', depositId.toString());
      console.log('Time:', new Date(block.timestamp * 1000).toISOString());
      console.log('Confirmations:', currentBlock - event.blockNumber);
      console.log('');
      
      // Check if already processed
      console.log('🔍 Checking if already processed...');
      try {
        // Try to mint - if it fails with "already processed", that's fine
        const tx = await ucBridge.mint(
          destinationAddress,
          amount,
          depositId,
          { gasLimit: 500000 } // Set gas limit
        );
        
        console.log('✅ Mint transaction sent!');
        console.log('   UC TX Hash:', tx.hash);
        console.log('   Waiting for confirmation...');
        
        const receipt = await tx.wait();
        
        console.log('✅ SUCCESSFULLY PROCESSED!');
        console.log('   Block:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());
        console.log('   Status:', receipt.status === 1 ? 'Success ✅' : 'Failed ❌');
        console.log('');
        console.log('🎉 User should now have USDT on UC Chain!');
        console.log('   Check balance at:', destinationAddress);
        console.log('');
        
      } catch (error) {
        if (error.message.includes('already processed') || 
            error.message.includes('already minted') ||
            error.message.includes('duplicate')) {
          console.log('ℹ️  Already processed (deposit already minted)');
        } else if (error.message.includes('insufficient funds')) {
          console.log('❌ Insufficient UC for gas fees!');
          console.log('   Send UC to relayer:', ucWallet.address);
        } else {
          console.log('❌ Error processing:', error.message);
          console.log('   Full error:', error);
        }
        console.log('');
      }
    }
    
    console.log('=== PROCESSING COMPLETE ===');
    
  } catch (error) {
    if (error.message.includes('rate limit')) {
      console.log('❌ Rate limited by BSC RPC');
      console.log('   Try again in 30 seconds or use a different RPC');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

processDeposits().catch(console.error);
