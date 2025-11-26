const { ethers } = require('ethers');
const fs = require('fs');

// Load .env
const envContent = fs.readFileSync('./backend/.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

// Second deposit details
const YOUR_WALLET = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
const DEPOSIT_TX = '0x307ce6d998cbc03418808e0c36a18016aab6f0aed902eddfa7b0bd467171112c';
const DEPOSIT_ID = '0xC78F561AE2B77B506D21BFE02ED08B3A271053A0EF86DCFA35CB18CF783FF61A';

const UC_BRIDGE_ADDRESS = '0x0eAf708770c97152A2369CC28e356FBaA87e7E42';
const RELAYER_PRIVATE_KEY = envVars.RELAYER_PRIVATE_KEY;

const BRIDGE_ABI = [
  'function mint(address user, uint256 amount, bytes32 depositId) external'
];

async function processSecondDeposit() {
  console.log('=== PROCESSING SECOND DEPOSIT ===\n');
  
  // First, get the amount from the BSC transaction
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed3.binance.org');
  
  console.log('🔍 Fetching deposit details from BSC...');
  console.log('   TX:', DEPOSIT_TX);
  console.log('');
  
  const receipt = await bscProvider.getTransactionReceipt(DEPOSIT_TX);
  
  if (!receipt) {
    console.log('❌ Transaction not found');
    return;
  }
  
  console.log('✅ Transaction found!');
  console.log('   Block:', receipt.blockNumber);
  console.log('   Status:', receipt.status === 1 ? 'Success ✅' : 'Failed ❌');
  console.log('');
  
  // Parse logs to find the amount
  // The Transfer event should show the amount
  const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const transferLog = receipt.logs.find(log => log.topics[0] === transferTopic);
  
  let amount;
  if (transferLog) {
    amount = ethers.toBigInt(transferLog.data);
    console.log('📊 Amount:', ethers.formatUnits(amount, 18), 'USDT');
  } else {
    // Default to 10 USDT if we can't find it
    amount = ethers.parseUnits('10', 18);
    console.log('⚠️  Could not detect amount, using default: 10 USDT');
  }
  console.log('');
  
  // Mint on UC Chain
  const ucProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.ucchain.org');
  const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('🚀 Minting on UC Chain...');
  console.log('   Recipient:', YOUR_WALLET);
  console.log('   Amount:', ethers.formatUnits(amount, 18), 'USDT');
  console.log('   Deposit ID:', DEPOSIT_ID);
  console.log('');
  
  try {
    const tx = await ucBridge.mint(
      YOUR_WALLET,
      amount,
      DEPOSIT_ID,
      { gasLimit: 500000 }
    );
    
    console.log('✅ Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');
    console.log('');
    
    const ucReceipt = await tx.wait();
    
    console.log('🎉 SUCCESS!');
    console.log('─'.repeat(70));
    console.log('✅ Your', ethers.formatUnits(amount, 18), 'USDT has been minted on UC Chain!');
    console.log('');
    console.log('Transaction Details:');
    console.log('  UC TX Hash:', ucReceipt.hash);
    console.log('  Block:', ucReceipt.blockNumber);
    console.log('  Gas Used:', ucReceipt.gasUsed.toString());
    console.log('  Status:', ucReceipt.status === 1 ? 'Success ✅' : 'Failed ❌');
    console.log('');
    console.log('Your Wallet:', YOUR_WALLET);
    console.log('Total Received:', ethers.formatUnits(amount, 18), 'USDT');
    console.log('');
    console.log('✅ Check your UC Chain wallet!');
    console.log('─'.repeat(70));
    
  } catch (error) {
    console.log('❌ Mint failed:', error.message);
    console.log('');
    
    if (error.message.includes('already processed') || error.message.includes('already minted')) {
      console.log('ℹ️  This deposit was already processed!');
      console.log('   Check your UC Chain wallet - you should already have the USDT');
    } else if (error.message.includes('reverted')) {
      console.log('⚠️  Transaction reverted. Possible reasons:');
      console.log('   1. Deposit already processed');
      console.log('   2. Invalid deposit ID');
      console.log('   3. Contract issue');
      console.log('');
      console.log('   Check your UC Chain wallet to see if you already have the USDT');
    }
  }
}

processSecondDeposit().catch(console.error);
