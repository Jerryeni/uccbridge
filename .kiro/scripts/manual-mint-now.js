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

// Your deposit details from the transaction
const YOUR_WALLET = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
const AMOUNT = ethers.parseUnits('10', 18); // 10 USDT
const DEPOSIT_ID = 0; // We'll extract this from the transaction

const UC_BRIDGE_ADDRESS = '0x0eAf708770c97152A2369CC28e356FBaA87e7E42';
const RELAYER_PRIVATE_KEY = envVars.RELAYER_PRIVATE_KEY;

const BRIDGE_ABI = [
  'function mint(address user, uint256 amount, uint256 depositId) external',
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)'
];

async function manualMint() {
  console.log('=== MANUAL MINT TO UC CHAIN ===\n');
  
  // First, get the deposit ID from the BSC transaction
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed3.binance.org');
  const bscBridge = new ethers.Contract('0xE4363F8FbD39FB0930772644Ebd14597e5756986', BRIDGE_ABI, bscProvider);
  
  console.log('🔍 Fetching deposit details from BSC...');
  const receipt = await bscProvider.getTransactionReceipt('0xbbbc0b3ab967ad0533ee7c22975049bb1882fb30f8223b1f8b1dcd3294a51df7');
  
  // Parse all logs to find the Deposit event
  let depositEvent = null;
  for (const log of receipt.logs) {
    try {
      const parsed = bscBridge.interface.parseLog(log);
      if (parsed && parsed.name === 'Deposit') {
        depositEvent = parsed;
        break;
      }
    } catch (e) {
      // Not a Deposit event, continue
    }
  }
  
  if (!depositEvent) {
    console.log('❌ Could not find Deposit event in transaction');
    console.log('   The transaction might use a different event structure');
    console.log('');
    console.log('   Trying with default deposit ID 0...');
    
    // Try with deposit ID 0
    const ucProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.ucchain.org');
    const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
    const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
    
    console.log('');
    console.log('🚀 Minting on UC Chain...');
    console.log('   Recipient:', YOUR_WALLET);
    console.log('   Amount:', ethers.formatUnits(AMOUNT, 18), 'USDT');
    console.log('   Deposit ID: 0');
    console.log('');
    
    try {
      const tx = await ucBridge.mint(YOUR_WALLET, AMOUNT, 0, { gasLimit: 500000 });
      console.log('✅ Transaction sent:', tx.hash);
      console.log('   Waiting for confirmation...');
      
      const ucReceipt = await tx.wait();
      console.log('');
      console.log('🎉 SUCCESS!');
      console.log('   Block:', ucReceipt.blockNumber);
      console.log('   Gas used:', ucReceipt.gasUsed.toString());
      console.log('');
      console.log('✅ You should now have 10 USDT on UC Chain!');
      console.log('   Check your wallet:', YOUR_WALLET);
      
    } catch (error) {
      console.log('❌ Mint failed:', error.message);
      if (error.message.includes('already processed')) {
        console.log('   ℹ️  This deposit was already processed!');
        console.log('   Check your UC Chain wallet - you should already have the USDT');
      }
    }
    
    return;
  }
  
  // If we found the event, use its data
  console.log('✅ Deposit event found!');
  console.log('   User:', depositEvent.args.user);
  console.log('   Amount:', ethers.formatUnits(depositEvent.args.amount, 18), 'USDT');
  console.log('   Deposit ID:', depositEvent.args.depositId.toString());
  console.log('   Destination:', depositEvent.args.destinationAddress);
  console.log('');
  
  // Mint on UC Chain
  const ucProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.ucchain.org');
  const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('🚀 Minting on UC Chain...');
  
  try {
    const tx = await ucBridge.mint(
      depositEvent.args.destinationAddress,
      depositEvent.args.amount,
      depositEvent.args.depositId,
      { gasLimit: 500000 }
    );
    
    console.log('✅ Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');
    
    const ucReceipt = await tx.wait();
    console.log('');
    console.log('🎉 SUCCESS!');
    console.log('   Block:', ucReceipt.blockNumber);
    console.log('   Gas used:', ucReceipt.gasUsed.toString());
    console.log('');
    console.log('✅ You should now have', ethers.formatUnits(depositEvent.args.amount, 18), 'USDT on UC Chain!');
    console.log('   Check your wallet:', depositEvent.args.destinationAddress);
    
  } catch (error) {
    console.log('❌ Mint failed:', error.message);
    if (error.message.includes('already processed')) {
      console.log('   ℹ️  This deposit was already processed!');
      console.log('   Check your UC Chain wallet - you should already have the USDT');
    }
  }
}

manualMint().catch(console.error);
