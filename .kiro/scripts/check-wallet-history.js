const { ethers } = require('ethers');

async function checkWalletHistory() {
  console.log('🔍 CHECKING YOUR WALLET HISTORY\n');
  
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
  const userAddress = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
  
  const currentBlock = await bscProvider.getBlockNumber();
  
  console.log('📊 Wallet:', userAddress);
  console.log(`📊 Current Block: ${currentBlock}\n`);
  
  // Check last 20 blocks for ANY transactions from this address
  console.log('🔎 Checking recent blocks for ANY activity from your wallet...\n');
  
  for (let i = 0; i < 1000; i++) {
    const block = await bscProvider.getBlock(currentBlock - i, true);
    
    if (block && block.transactions) {
      for (const tx of block.transactions) {
        if (tx.from && tx.from.toLowerCase() === userAddress.toLowerCase()) {
          console.log(`✅ FOUND TRANSACTION!`);
          console.log(`   Block: ${block.number}`);
          console.log(`   TX Hash: ${tx.hash}`);
          console.log(`   To: ${tx.to}`);
          console.log(`   Value: ${ethers.formatEther(tx.value)} BNB`);
          console.log(`   BSCScan: https://bscscan.com/tx/${tx.hash}`);
          console.log('');
        }
      }
    }
    
    if (i % 100 === 0 && i > 0) {
      console.log(`   Scanned ${i} blocks...`);
    }
  }
  
  console.log('\n✅ Scan complete!');
  console.log('\n💡 If no transactions found:');
  console.log('   - Your deposits might be older');
  console.log('   - OR transactions are still pending in MetaMask');
  console.log('   - OR you\'re on the wrong network');
}

checkWalletHistory().catch(console.error);
