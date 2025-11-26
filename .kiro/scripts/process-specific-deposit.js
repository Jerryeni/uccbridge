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

// Process a specific deposit by transaction hash
// Usage: node process-specific-deposit.js <TX_HASH>

const TX_HASH = process.argv[2];

if (!TX_HASH) {
  console.log('Usage: node process-specific-deposit.js <TX_HASH>');
  console.log('Example: node process-specific-deposit.js 0x123abc...');
  process.exit(1);
}

const BSC_RPC = 'https://bsc-dataseed3.binance.org';
const UC_RPC = 'https://rpc.mainnet.ucchain.org';

const BSC_BRIDGE_ADDRESS = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const UC_BRIDGE_ADDRESS = '0x0eAf708770c97152A2369CC28e356FBaA87e7E42';

const RELAYER_PRIVATE_KEY = envVars.RELAYER_PRIVATE_KEY;

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)',
  'function mint(address user, uint256 amount, uint256 depositId) external'
];

async function processSpecificDeposit() {
  console.log('=== PROCESSING SPECIFIC DEPOSIT ===\n');
  console.log('TX Hash:', TX_HASH);
  console.log('');
  
  const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
  const ucProvider = new ethers.JsonRpcProvider(UC_RPC);
  
  const bscBridge = new ethers.Contract(BSC_BRIDGE_ADDRESS, BRIDGE_ABI, bscProvider);
  const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('Relayer:', ucWallet.address);
  console.log('');
  
  // Get transaction receipt
  console.log('🔍 Fetching transaction...');
  const receipt = await bscProvider.getTransactionReceipt(TX_HASH);
  
  if (!receipt) {
    console.log('❌ Transaction not found!');
    console.log('   Make sure the TX hash is correct and on BSC Mainnet');
    return;
  }
  
  console.log('✅ Transaction found!');
  console.log('   Block:', receipt.blockNumber);
  console.log('   Status:', receipt.status === 1 ? 'Success ✅' : 'Failed ❌');
  console.log('');
  
  if (receipt.status !== 1) {
    console.log('❌ Transaction failed on BSC');
    console.log('   Cannot process failed transaction');
    return;
  }
  
  // Parse logs to find Deposit event
  console.log('🔍 Looking for Deposit event...');
  const depositEvent = receipt.logs
    .map(log => {
      try {
        return bscBridge.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(e => e && e.name === 'Deposit');
  
  if (!depositEvent) {
    console.log('❌ No Deposit event found in this transaction');
    console.log('   This might not be a bridge deposit transaction');
    return;
  }
  
  console.log('✅ Deposit event found!');
  console.log('');
  
  const { user, amount, depositId, destinationAddress } = depositEvent.args;
  
  console.log('📋 DEPOSIT DETAILS:');
  console.log('─'.repeat(70));
  console.log('User:', user);
  console.log('Destination:', destinationAddress);
  console.log('Amount:', ethers.formatUnits(amount, 18), 'USDT');
  console.log('Deposit ID:', depositId.toString());
  console.log('');
  
  // Get current block for confirmations
  const currentBlock = await bscProvider.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber;
  console.log('Confirmations:', confirmations);
  
  if (confirmations < 6) {
    console.log('⚠️  WARNING: Less than 6 confirmations');
    console.log('   Recommended to wait for 6 confirmations before processing');
    console.log('');
  }
  
  // Process on UC Chain
  console.log('🚀 Processing on UC Chain...');
  console.log('');
  
  try {
    const tx = await ucBridge.mint(
      destinationAddress,
      amount,
      depositId,
      { gasLimit: 500000 }
    );
    
    console.log('✅ Mint transaction sent!');
    console.log('   UC TX Hash:', tx.hash);
    console.log('   Waiting for confirmation...');
    console.log('');
    
    const ucReceipt = await tx.wait();
    
    console.log('✅ SUCCESSFULLY PROCESSED!');
    console.log('─'.repeat(70));
    console.log('UC Block:', ucReceipt.blockNumber);
    console.log('Gas used:', ucReceipt.gasUsed.toString());
    console.log('Status:', ucReceipt.status === 1 ? 'Success ✅' : 'Failed ❌');
    console.log('');
    console.log('🎉 User should now have', ethers.formatUnits(amount, 18), 'USDT on UC Chain!');
    console.log('   Recipient:', destinationAddress);
    console.log('');
    
  } catch (error) {
    if (error.message.includes('already processed') || 
        error.message.includes('already minted') ||
        error.message.includes('duplicate')) {
      console.log('ℹ️  Already processed!');
      console.log('   This deposit has already been minted on UC Chain');
      console.log('   User should already have the USDT');
    } else if (error.message.includes('insufficient funds')) {
      console.log('❌ Insufficient UC for gas fees!');
      console.log('   Send UC to relayer:', ucWallet.address);
    } else {
      console.log('❌ Error processing:', error.message);
      if (error.reason) {
        console.log('   Reason:', error.reason);
      }
    }
  }
}

processSpecificDeposit().catch(console.error);
