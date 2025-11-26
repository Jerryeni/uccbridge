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

// This script checks ALL possible locations for your USDT

const YOUR_WALLET = '0x742a2f3e6f2d6ddaafad5d9f83146e293e8fa713'; // Replace with your actual wallet

const MAINNET_RPC = 'https://bsc-dataseed1.binance.org';
const TESTNET_RPC = 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';

const MAINNET_USDT = '0x55d398326f99059fF775485246999027B3197955';
const TESTNET_USDT = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

const MAINNET_BRIDGE = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const TESTNET_BRIDGE = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) view returns (bool)'
];

async function findUSDT() {
  console.log('=== SEARCHING FOR YOUR USDT ===\n');
  console.log('Your wallet:', YOUR_WALLET);
  console.log('');
  
  // Check BSC MAINNET
  console.log('1️⃣  Checking BSC MAINNET...');
  const mainProvider = new ethers.JsonRpcProvider(MAINNET_RPC);
  const mainUsdt = new ethers.Contract(MAINNET_USDT, ERC20_ABI, mainProvider);
  
  const mainBalance = await mainUsdt.balanceOf(YOUR_WALLET);
  const mainDecimals = await mainUsdt.decimals();
  console.log('   Your USDT balance:', ethers.formatUnits(mainBalance, mainDecimals), 'USDT');
  
  // Check if USDT is in the bridge
  const mainBridgeBalance = await mainUsdt.balanceOf(MAINNET_BRIDGE);
  console.log('   Bridge USDT balance:', ethers.formatUnits(mainBridgeBalance, mainDecimals), 'USDT');
  console.log('');
  
  // Check BSC TESTNET
  console.log('2️⃣  Checking BSC TESTNET...');
  const testProvider = new ethers.JsonRpcProvider(TESTNET_RPC);
  const testUsdt = new ethers.Contract(TESTNET_USDT, ERC20_ABI, testProvider);
  
  try {
    const testBalance = await testUsdt.balanceOf(YOUR_WALLET);
    const testDecimals = await testUsdt.decimals();
    console.log('   Your USDT balance:', ethers.formatUnits(testBalance, testDecimals), 'USDT');
    
    const testBridgeBalance = await testUsdt.balanceOf(TESTNET_BRIDGE);
    console.log('   Bridge USDT balance:', ethers.formatUnits(testBridgeBalance, testDecimals), 'USDT');
  } catch (error) {
    console.log('   Could not check testnet:', error.message);
  }
  console.log('');
  
  // Check recent transactions on MAINNET
  console.log('3️⃣  Checking Recent Transactions on BSC MAINNET...');
  try {
    const currentBlock = await mainProvider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    console.log('   Scanning blocks', fromBlock, 'to', currentBlock);
    
    // Check for Transfer events FROM your wallet
    const transferFilter = mainUsdt.filters.Transfer(YOUR_WALLET, null);
    const transferEvents = await mainUsdt.queryFilter(transferFilter, fromBlock, currentBlock);
    
    console.log('   Found', transferEvents.length, 'outgoing transfer(s)');
    
    if (transferEvents.length > 0) {
      console.log('\n   📤 Your Recent USDT Transfers:');
      for (const event of transferEvents) {
        const block = await event.getBlock();
        console.log('   ─'.repeat(50));
        console.log('   Block:', event.blockNumber);
        console.log('   TX Hash:', event.transactionHash);
        console.log('   From:', event.args.from);
        console.log('   To:', event.args.to);
        console.log('   Amount:', ethers.formatUnits(event.args.value, mainDecimals), 'USDT');
        console.log('   Time:', new Date(block.timestamp * 1000).toISOString());
        console.log('   BSCScan:', `https://bscscan.com/tx/${event.transactionHash}`);
      }
    }
    
    // Check for Transfer events TO your wallet
    const receiveFilter = mainUsdt.filters.Transfer(null, YOUR_WALLET);
    const receiveEvents = await mainUsdt.queryFilter(receiveFilter, fromBlock, currentBlock);
    
    console.log('\n   Found', receiveEvents.length, 'incoming transfer(s)');
    
    if (receiveEvents.length > 0) {
      console.log('\n   📥 Recent USDT Received:');
      for (const event of receiveEvents) {
        const block = await event.getBlock();
        console.log('   ─'.repeat(50));
        console.log('   Block:', event.blockNumber);
        console.log('   TX Hash:', event.transactionHash);
        console.log('   From:', event.args.from);
        console.log('   Amount:', ethers.formatUnits(event.args.value, mainDecimals), 'USDT');
        console.log('   Time:', new Date(block.timestamp * 1000).toISOString());
      }
    }
    
  } catch (error) {
    console.log('   ❌ Could not check transactions:', error.message);
    console.log('   (Likely rate limited - try again in 30 seconds)');
  }
  
  console.log('\n=== SEARCH COMPLETE ===');
  console.log('\nNext Steps:');
  console.log('1. If you see a transfer TO the bridge, copy the TX hash');
  console.log('2. Run: node process-specific-deposit.js <TX_HASH>');
  console.log('3. If no transfers found, check MetaMask on ALL networks');
  console.log('4. Check if you might have used a different wallet address');
}

findUSDT().catch(console.error);
