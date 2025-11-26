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

// Your deposit details from BSCScan
const YOUR_WALLET = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
const AMOUNT = ethers.parseUnits('10', 18); // 10 USDT
const DEPOSIT_ID = '0x2420AD75D3DB503C55EE826DB5D9720707E33B7E2D9D40BD6ADD2B12C6995B8A';

const UC_BRIDGE_ADDRESS = '0x0eAf708770c97152A2369CC28e356FBaA87e7E42';
const RELAYER_PRIVATE_KEY = envVars.RELAYER_PRIVATE_KEY;

const BRIDGE_ABI = [
  'function mint(address user, uint256 amount, bytes32 depositId) external'
];

async function mintWithCorrectId() {
  console.log('=== MINTING YOUR USDT ON UC CHAIN ===\n');
  
  const ucProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.ucchain.org');
  const ucWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ucProvider);
  const ucBridge = new ethers.Contract(UC_BRIDGE_ADDRESS, BRIDGE_ABI, ucWallet);
  
  console.log('Relayer:', ucWallet.address);
  console.log('Recipient:', YOUR_WALLET);
  console.log('Amount:', ethers.formatUnits(AMOUNT, 18), 'USDT');
  console.log('Deposit ID:', DEPOSIT_ID);
  console.log('');
  
  console.log('🚀 Sending mint transaction...');
  
  try {
    const tx = await ucBridge.mint(
      YOUR_WALLET,
      AMOUNT,
      DEPOSIT_ID,
      { gasLimit: 500000 }
    );
    
    console.log('✅ Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');
    console.log('');
    
    const receipt = await tx.wait();
    
    console.log('🎉 SUCCESS!');
    console.log('─'.repeat(70));
    console.log('✅ Your 10 USDT has been minted on UC Chain!');
    console.log('');
    console.log('Transaction Details:');
    console.log('  UC TX Hash:', receipt.hash);
    console.log('  Block:', receipt.blockNumber);
    console.log('  Gas Used:', receipt.gasUsed.toString());
    console.log('  Status:', receipt.status === 1 ? 'Success ✅' : 'Failed ❌');
    console.log('');
    console.log('Your Wallet:', YOUR_WALLET);
    console.log('Amount Received: 10 USDT');
    console.log('');
    console.log('✅ Check your UC Chain wallet - you should now have 10 USDT!');
    console.log('─'.repeat(70));
    
  } catch (error) {
    console.log('❌ Mint failed:', error.message);
    console.log('');
    
    if (error.message.includes('already processed') || error.message.includes('already minted')) {
      console.log('ℹ️  This deposit was already processed!');
      console.log('   Check your UC Chain wallet - you should already have the 10 USDT');
    } else if (error.message.includes('reverted')) {
      console.log('⚠️  Transaction reverted. Possible reasons:');
      console.log('   1. Deposit already processed');
      console.log('   2. Invalid deposit ID');
      console.log('   3. Contract issue');
      console.log('');
      console.log('   Please check your UC Chain wallet to see if you already have the USDT');
    } else {
      console.log('Error details:', error);
    }
  }
}

mintWithCorrectId().catch(console.error);
