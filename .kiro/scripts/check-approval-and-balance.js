const { ethers } = require('ethers');

const YOUR_WALLET = '0x742a2f3e6f2d6ddaafad5d9f83146e293e8fa713';
const BRIDGE_ADDRESS = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function checkApprovalAndBalance() {
  console.log('=== CHECKING YOUR USDT STATUS ===\n');
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
  const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
  
  console.log('Your wallet:', YOUR_WALLET);
  console.log('Bridge address:', BRIDGE_ADDRESS);
  console.log('');
  
  // Check balance
  const balance = await usdt.balanceOf(YOUR_WALLET);
  const decimals = await usdt.decimals();
  const balanceFormatted = ethers.formatUnits(balance, decimals);
  
  console.log('📊 Your USDT Balance:', balanceFormatted, 'USDT');
  
  // Check allowance
  const allowance = await usdt.allowance(YOUR_WALLET, BRIDGE_ADDRESS);
  const allowanceFormatted = ethers.formatUnits(allowance, decimals);
  
  console.log('🔓 Approved to Bridge:', allowanceFormatted, 'USDT');
  console.log('');
  
  // Analysis
  if (parseFloat(balanceFormatted) > 0) {
    console.log('✅ GOOD NEWS: Your USDT is still in your wallet!');
    console.log('');
    console.log('What happened:');
    console.log('- You approved USDT spending');
    console.log('- But the deposit transaction never executed');
    console.log('- Your USDT is safe in your wallet');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh the bridge page');
    console.log('2. Try depositing again');
    console.log('3. Make sure to confirm BOTH transactions in MetaMask:');
    console.log('   a) Approve (if needed)');
    console.log('   b) Deposit (the actual transfer)');
  } else if (parseFloat(allowanceFormatted) > 0) {
    console.log('⚠️  STRANGE: You have approval but no balance');
    console.log('');
    console.log('This means:');
    console.log('- You approved the bridge to spend USDT');
    console.log('- But you have 0 USDT in your wallet');
    console.log('');
    console.log('Possible explanations:');
    console.log('1. You already spent/transferred the USDT elsewhere');
    console.log('2. You\'re checking the wrong wallet address');
    console.log('3. The USDT is on a different network');
  } else {
    console.log('❌ No USDT and no approval');
    console.log('');
    console.log('This means:');
    console.log('- You have 0 USDT in this wallet');
    console.log('- No approval given to the bridge');
    console.log('');
    console.log('Please verify:');
    console.log('1. Is this the correct wallet address?');
    console.log('2. Did you use a different wallet?');
    console.log('3. Are you on BSC Mainnet (not testnet)?');
  }
  
  console.log('');
  console.log('=== CHECK COMPLETE ===');
}

checkApprovalAndBalance().catch(console.error);
