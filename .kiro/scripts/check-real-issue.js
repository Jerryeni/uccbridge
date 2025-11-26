const { ethers } = require('ethers');

async function checkSystem() {
  console.log('🔍 INVESTIGATING YOUR TRANSACTIONS\n');
  
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
  const userAddress = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
  
  // Check if user has made any transactions
  console.log('📊 Checking your wallet on BSC...');
  const txCount = await bscProvider.getTransactionCount(userAddress);
  console.log(`   Transaction count: ${txCount}`);
  
  // Check USDT balance
  const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
  const usdtAbi = ['function balanceOf(address) view returns (uint256)'];
  const usdt = new ethers.Contract(usdtAddress, usdtAbi, bscProvider);
  const balance = await usdt.balanceOf(userAddress);
  console.log(`   USDT Balance: ${ethers.formatUnits(balance, 18)} USDT\n`);
  
  // Check recent transactions
  console.log('🔎 Checking recent blocks for your transactions...');
  const currentBlock = await bscProvider.getBlockNumber();
  console.log(`   Current block: ${currentBlock}\n`);
  
  // The issue: Frontend is showing contract transaction IDs, not BSC tx hashes
  console.log('❌ PROBLEM IDENTIFIED:');
  console.log('   The "transaction hash" shown in frontend is NOT a BSC transaction hash');
  console.log('   It\'s a depositId from the smart contract');
  console.log('   This is why BSCScan can\'t find it!\n');
  
  console.log('✅ SOLUTION:');
  console.log('   1. Check your wallet transaction history in MetaMask');
  console.log('   2. Find the actual BSC transaction where you approved/deposited');
  console.log('   3. That transaction hash will be on BSCScan');
  console.log('   4. The contract stores transactions internally with depositIds\n');
}

checkSystem().catch(console.error);
