const { ethers } = require('ethers');

async function verifyEverything() {
  console.log('🔍 COMPLETE SYSTEM CHECK\n');
  
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
  const userAddress = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
  const bridgeAddress = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
  const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
  
  console.log('1️⃣ CHECKING YOUR WALLET\n');
  console.log(`   Address: ${userAddress}`);
  
  // Check BNB balance
  const bnbBalance = await bscProvider.getBalance(userAddress);
  console.log(`   BNB Balance: ${ethers.formatEther(bnbBalance)} BNB`);
  
  // Check USDT balance (correct decimals)
  const usdtAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
  const usdt = new ethers.Contract(usdtAddress, usdtAbi, bscProvider);
  const decimals = await usdt.decimals();
  const usdtBalance = await usdt.balanceOf(userAddress);
  console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, decimals)} USDT`);
  console.log(`   USDT Decimals: ${decimals}`);
  
  // Check transaction count
  const txCount = await bscProvider.getTransactionCount(userAddress);
  console.log(`   Total Transactions: ${txCount}\n`);
  
  console.log('2️⃣ CHECKING BRIDGE CONTRACT\n');
  console.log(`   Bridge Address: ${bridgeAddress}`);
  
  // Check if bridge contract exists
  const code = await bscProvider.getCode(bridgeAddress);
  console.log(`   Contract Exists: ${code !== '0x' ? '✅ YES' : '❌ NO'}`);
  
  // Check bridge USDT balance
  const bridgeUsdtBalance = await usdt.balanceOf(bridgeAddress);
  console.log(`   Bridge USDT Balance: ${ethers.formatUnits(bridgeUsdtBalance, decimals)} USDT\n`);
  
  console.log('3️⃣ CHECKING RECENT TRANSACTIONS\n');
  
  // Get last 10 transactions from your wallet
  const currentBlock = await bscProvider.getBlockNumber();
  console.log(`   Current Block: ${currentBlock}`);
  console.log(`   Checking your last transactions...\n`);
  
  // Check last 1000 blocks for ANY transaction from your address
  for (let i = 0; i < 1000; i += 100) {
    const blockNum = currentBlock - i;
    const block = await bscProvider.getBlock(blockNum, true);
    
    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (tx.from && tx.from.toLowerCase() === userAddress.toLowerCase()) {
          console.log(`   ✅ FOUND YOUR TRANSACTION!`);
          console.log(`      Block: ${blockNum}`);
          console.log(`      TX Hash: ${tx.hash}`);
          console.log(`      To: ${tx.to}`);
          console.log(`      Value: ${ethers.formatEther(tx.value)} BNB`);
          console.log(`      BSCScan: https://bscscan.com/tx/${tx.hash}\n`);
          
          const receipt = await bscProvider.getTransactionReceipt(tx.hash);
          console.log(`      Status: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}\n`);
        }
      }
    }
    
    if (i % 500 === 0 && i > 0) {
      console.log(`   Scanned ${i} blocks...`);
    }
  }
  
  console.log('\n4️⃣ DIAGNOSIS\n');
  console.log('   If no transactions found:');
  console.log('   ❌ The deposit did NOT go through on BSC');
  console.log('   ❌ Check MetaMask for failed transactions');
  console.log('   ❌ You may need to try depositing again\n');
  
  console.log('   If transactions found but not to bridge:');
  console.log('   ⚠️  You may have sent to wrong address');
  console.log('   ⚠️  Or transaction is still pending\n');
}

verifyEverything().catch(console.error);
