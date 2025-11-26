const { ethers } = require('ethers');

const TX1 = '0xbbbc0b3ab967ad0533ee7c22975049bb1882fb30f8223b1f8b1dcd3294a51df7'; // deposit
const TX2 = '0x276793a04921970278e298abe4ee85debd152fbb88ce55c653bcb1832b531293'; // approve

async function analyzeTx() {
  console.log('=== ANALYZING YOUR TRANSACTIONS ===\n');
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed3.binance.org');
  
  // Check TX1
  console.log('1️⃣  Transaction 1 (Deposit):');
  console.log('   TX:', TX1);
  const receipt1 = await provider.getTransactionReceipt(TX1);
  const tx1 = await provider.getTransaction(TX1);
  
  console.log('   To:', tx1.to);
  console.log('   Value:', ethers.formatEther(tx1.value), 'BNB');
  console.log('   Status:', receipt1.status === 1 ? 'Success' : 'Failed');
  console.log('   Logs:', receipt1.logs.length);
  console.log('   BSCScan: https://bscscan.com/tx/' + TX1);
  console.log('');
  
  // Check TX2
  console.log('2️⃣  Transaction 2 (Approve):');
  console.log('   TX:', TX2);
  const receipt2 = await provider.getTransactionReceipt(TX2);
  const tx2 = await provider.getTransaction(TX2);
  
  console.log('   To:', tx2.to);
  console.log('   Value:', ethers.formatEther(tx2.value), 'BNB');
  console.log('   Status:', receipt2.status === 1 ? 'Success' : 'Failed');
  console.log('   Logs:', receipt2.logs.length);
  console.log('   BSCScan: https://bscscan.com/tx/' + TX2);
  console.log('');
  
  // Analyze logs
  console.log('📋 Analyzing logs...');
  console.log('');
  
  for (const log of receipt1.logs) {
    console.log('Log from TX1:');
    console.log('  Address:', log.address);
    console.log('  Topics:', log.topics.length);
    console.log('  Data:', log.data.substring(0, 66) + '...');
  }
  
  console.log('');
  console.log('=== ANALYSIS COMPLETE ===');
  console.log('');
  console.log('Please check these transactions on BSCScan:');
  console.log('https://bscscan.com/tx/' + TX1);
  console.log('https://bscscan.com/tx/' + TX2);
}

analyzeTx().catch(console.error);
