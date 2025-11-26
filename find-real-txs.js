const { ethers } = require('ethers');

async function findRealTransactions() {
  console.log('🔍 FINDING YOUR REAL BSC TRANSACTIONS\n');
  
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
  const bridgeAddress = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
  const userAddress = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
  
  console.log('📊 Your Wallet:', userAddress);
  console.log('📊 Bridge Contract:', bridgeAddress);
  console.log('');
  
  // Get recent blocks
  const currentBlock = await bscProvider.getBlockNumber();
  const fromBlock = currentBlock - 5000; // Last ~4 hours
  
  console.log(`🔎 Scanning blocks ${fromBlock} to ${currentBlock}...\n`);
  
  // Check for transactions TO the bridge contract
  console.log('Looking for your deposits to the bridge...\n');
  
  for (let i = 0; i < 5000; i += 100) {
    const start = fromBlock + i;
    const end = Math.min(start + 99, currentBlock);
    
    try {
      const logs = await bscProvider.getLogs({
        fromBlock: start,
        toBlock: end,
        address: bridgeAddress,
        topics: [
          ethers.id('Deposit(address,uint256,bytes32,string,string)'),
          ethers.zeroPadValue(userAddress, 32)
        ]
      });
      
      if (logs.length > 0) {
        console.log(`✅ FOUND ${logs.length} DEPOSIT(S)!\n`);
        
        for (const log of logs) {
          console.log('💰 Deposit Found:');
          console.log(`   Block: ${log.blockNumber}`);
          console.log(`   REAL BSC TX Hash: ${log.transactionHash}`);
          console.log(`   Check on BSCScan: https://bscscan.com/tx/${log.transactionHash}`);
          console.log('');
          
          // Get transaction details
          const tx = await bscProvider.getTransaction(log.transactionHash);
          const receipt = await bscProvider.getTransactionReceipt(log.transactionHash);
          
          console.log(`   Status: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
          console.log(`   From: ${tx.from}`);
          console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
          console.log('');
        }
      }
      
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      if (i % 1000 === 0) console.log(`   Scanned up to block ${end}...`);
    }
  }
  
  console.log('\n✅ Scan complete!');
}

findRealTransactions().catch(console.error);
