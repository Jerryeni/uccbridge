const { ethers } = require('ethers');
require('dotenv').config({ path: './backend/.env' });

// This script helps recover USDT from testnet bridge contract
// ONLY works if you're the contract owner

const TESTNET_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const TESTNET_BRIDGE = '0xE4363F8FbD39FB0930772644Ebd14597e5756986'; // Your bridge address
const TESTNET_USDT = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd'; // BSC Testnet USDT

// Owner wallet (use your owner private key, NOT the relayer key)
const OWNER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY; // Replace with actual owner key

const BRIDGE_ABI = [
  'function owner() view returns (address)',
  'function emergencyWithdraw(address token, uint256 amount) external',
  'function pause() external',
  'function unpause() external'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
];

async function recoverFunds() {
  console.log('=== TESTNET FUND RECOVERY ===\n');
  
  const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  
  console.log('Your wallet:', wallet.address);
  console.log('Network: BSC Testnet (Chain 97)\n');
  
  // Check if bridge contract exists on testnet
  const bridgeCode = await provider.getCode(TESTNET_BRIDGE);
  if (bridgeCode === '0x') {
    console.log('❌ Bridge contract NOT deployed on testnet');
    console.log('   This means your funds are on MAINNET, not testnet');
    console.log('   Check BSCScan mainnet: https://bscscan.com/address/' + TESTNET_BRIDGE);
    return;
  }
  
  console.log('✅ Bridge contract found on testnet\n');
  
  const bridge = new ethers.Contract(TESTNET_BRIDGE, BRIDGE_ABI, wallet);
  const usdt = new ethers.Contract(TESTNET_USDT, ERC20_ABI, provider);
  
  // Check contract owner
  try {
    const owner = await bridge.owner();
    console.log('Contract owner:', owner);
    console.log('Your address:', wallet.address);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log('\n❌ You are NOT the contract owner!');
      console.log('   Only the owner can withdraw funds.');
      console.log('   Contact the contract owner to recover funds.');
      return;
    }
    
    console.log('✅ You are the contract owner\n');
  } catch (error) {
    console.log('⚠️  Could not check owner (contract might not have owner function)\n');
  }
  
  // Check USDT balance in contract
  const balance = await usdt.balanceOf(TESTNET_BRIDGE);
  const decimals = await usdt.decimals();
  const balanceFormatted = ethers.formatUnits(balance, decimals);
  
  console.log('USDT in contract:', balanceFormatted, 'USDT');
  
  if (parseFloat(balanceFormatted) === 0) {
    console.log('\n❌ No USDT in the contract to recover');
    return;
  }
  
  console.log('\n📋 Recovery Options:');
  console.log('1. Emergency withdraw (if contract has this function)');
  console.log('2. Contact contract owner to add withdrawal function');
  console.log('3. Deploy new contract with withdrawal function\n');
  
  // Try emergency withdraw
  console.log('Attempting emergency withdraw...');
  try {
    const tx = await bridge.emergencyWithdraw(TESTNET_USDT, balance);
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Funds recovered!');
    console.log('   TX:', receipt.hash);
    console.log('   Block:', receipt.blockNumber);
  } catch (error) {
    console.log('❌ Emergency withdraw failed:', error.message);
    console.log('\nThe contract might not have an emergency withdraw function.');
    console.log('You need to:');
    console.log('1. Add a withdrawal function to the contract');
    console.log('2. Or deploy a new contract with proper admin functions');
  }
}

recoverFunds().catch(console.error);
