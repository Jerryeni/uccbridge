const { ethers } = require('ethers');

// This script checks where your funds actually are
// Run this first to confirm if funds are on testnet or mainnet

const BRIDGE_ADDRESS = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const YOUR_WALLET = '0x742a2f3e6f2d6ddaafad5d9f83146e293e8fa713'; // Replace with your wallet

const MAINNET_RPC = 'https://bsc-dataseed1.binance.org';
const TESTNET_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';

const MAINNET_USDT = '0x55d398326f99059fF775485246999027B3197955';
const TESTNET_USDT = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)'
];

async function checkFunds() {
  console.log('=== CHECKING WHERE YOUR FUNDS ARE ===\n');
  console.log('Your wallet:', YOUR_WALLET);
  console.log('Bridge address:', BRIDGE_ADDRESS);
  console.log('');
  
  // Check MAINNET
  console.log('📍 Checking BSC MAINNET (Chain 56)...');
  const mainProvider = new ethers.JsonRpcProvider(MAINNET_RPC);
  
  const mainBridgeCode = await mainProvider.getCode(BRIDGE_ADDRESS);
  console.log('   Bridge deployed:', mainBridgeCode !== '0x' ? '✅ YES' : '❌ NO');
  
  if (mainBridgeCode !== '0x') {
    const mainUsdt = new ethers.Contract(MAINNET_USDT, ERC20_ABI, mainProvider);
    const mainBridgeBalance = await mainUsdt.balanceOf(BRIDGE_ADDRESS);
    const mainDecimals = await mainUsdt.decimals();
    console.log('   USDT in bridge:', ethers.formatUnits(mainBridgeBalance, mainDecimals), 'USDT');
    
    const mainWalletBalance = await mainUsdt.balanceOf(YOUR_WALLET);
    console.log('   Your USDT balance:', ethers.formatUnits(mainWalletBalance, mainDecimals), 'USDT');
    
    // Check for recent deposits
    const mainBridge = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, mainProvider);
    const currentBlock = await mainProvider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    try {
      const filter = mainBridge.filters.Deposit(YOUR_WALLET);
      const events = await mainBridge.queryFilter(filter, fromBlock, currentBlock);
      console.log('   Recent deposits:', events.length);
      
      if (events.length > 0) {
        console.log('\n   📋 Your Deposits on MAINNET:');
        for (const event of events) {
          console.log('   - Block:', event.blockNumber);
          console.log('     Amount:', ethers.formatUnits(event.args.amount, mainDecimals), 'USDT');
          console.log('     TX:', event.transactionHash);
        }
      }
    } catch (error) {
      console.log('   Could not check deposits (rate limited)');
    }
  }
  
  console.log('');
  
  // Check TESTNET
  console.log('📍 Checking BSC TESTNET (Chain 97)...');
  const testProvider = new ethers.JsonRpcProvider(TESTNET_RPC);
  
  const testBridgeCode = await testProvider.getCode(BRIDGE_ADDRESS);
  console.log('   Bridge deployed:', testBridgeCode !== '0x' ? '✅ YES' : '❌ NO');
  
  if (testBridgeCode !== '0x') {
    const testUsdt = new ethers.Contract(TESTNET_USDT, ERC20_ABI, testProvider);
    const testBridgeBalance = await testUsdt.balanceOf(BRIDGE_ADDRESS);
    const testDecimals = await testUsdt.decimals();
    console.log('   USDT in bridge:', ethers.formatUnits(testBridgeBalance, testDecimals), 'USDT');
    
    const testWalletBalance = await testUsdt.balanceOf(YOUR_WALLET);
    console.log('   Your USDT balance:', ethers.formatUnits(testWalletBalance, testDecimals), 'USDT');
    
    // Check for recent deposits
    const testBridge = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, testProvider);
    const currentBlock = await testProvider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    try {
      const filter = testBridge.filters.Deposit(YOUR_WALLET);
      const events = await testBridge.queryFilter(filter, fromBlock, currentBlock);
      console.log('   Recent deposits:', events.length);
      
      if (events.length > 0) {
        console.log('\n   📋 Your Deposits on TESTNET:');
        for (const event of events) {
          console.log('   - Block:', event.blockNumber);
          console.log('     Amount:', ethers.formatUnits(event.args.amount, testDecimals), 'USDT');
          console.log('     TX:', event.transactionHash);
        }
      }
    } catch (error) {
      console.log('   Could not check deposits (rate limited)');
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('If you see deposits on TESTNET:');
  console.log('  → Your funds are on testnet');
  console.log('  → You need to recover them (see recovery options below)');
  console.log('');
  console.log('If you see deposits on MAINNET:');
  console.log('  → Your funds are on mainnet (correct!)');
  console.log('  → The relayer should process them automatically');
  console.log('');
  console.log('If you see NO deposits anywhere:');
  console.log('  → Check your MetaMask transaction history');
  console.log('  → Get the TX hash and search on BSCScan');
}

checkFunds().catch(console.error);
