const { ethers } = require('ethers');
require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const path = require('path');

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 timestamp)',
  'function deposits(address) view returns (uint256)',
  'function totalDeposits() view returns (uint256)'
];

async function checkSystem() {
  console.log('=== CHECKING SYSTEM STATUS ===\n');
  
  // 1. Check contract state
  console.log('1. Checking BSC Contract State...');
  const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
  const bridge = new ethers.Contract(process.env.BSC_BRIDGE_ADDRESS, BRIDGE_ABI, provider);
  
  const userAddress = '0x742A2f3e6f2D6DdaAfaD5d9F83146e293E8Fa713';
  
  const userDeposit = await bridge.deposits(userAddress);
  const totalDeposits = await bridge.totalDeposits();
  
  console.log('   User deposit:', ethers.formatEther(userDeposit), 'BNB');
  console.log('   Total deposits:', ethers.formatEther(totalDeposits), 'BNB');
  
  // 2. Check recent deposit events
  console.log('\n2. Checking Recent Deposit Events...');
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 2000;
  
  console.log('   Current block:', currentBlock);
  console.log('   Scanning from block:', fromBlock);
  
  const filter = bridge.filters.Deposit(userAddress);
  const events = await bridge.queryFilter(filter, fromBlock, currentBlock);
  
  console.log('   Found', events.length, 'deposit events for user');
  for (const event of events) {
    const block = await event.getBlock();
    console.log('   - Block:', event.blockNumber);
    console.log('     Amount:', ethers.formatEther(event.args.amount), 'BNB');
    console.log('     Time:', new Date(block.timestamp * 1000).toISOString());
    console.log('     Tx:', event.transactionHash);
  }
  
  // 3. Check backend state
  console.log('\n3. Checking Backend State...');
  const stateFile = path.join(__dirname, 'backend', 'src', 'state.json');
  
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    console.log('   Last processed block:', state.lastProcessedBlock);
    console.log('   Pending transactions:', state.pendingTransactions?.length || 0);
    console.log('   Processed transactions:', state.processedTransactions?.length || 0);
    
    if (state.pendingTransactions?.length > 0) {
      console.log('\n   Pending Transactions:');
      state.pendingTransactions.forEach(tx => {
        console.log('   -', tx.bscTxHash, ':', tx.amount, 'BNB');
      });
    }
    
    if (state.processedTransactions?.length > 0) {
      console.log('\n   Recent Processed Transactions:');
      state.processedTransactions.slice(-5).forEach(tx => {
        console.log('   -', tx.bscTxHash, ':', tx.amount, 'BNB', '-> UCC:', tx.uccTxHash);
      });
    }
  } else {
    console.log('   No state file found');
  }
  
  // 4. Check if backend is running
  console.log('\n4. Checking Backend Service...');
  try {
    const response = await fetch('http://localhost:3002/api/transactions');
    if (response.ok) {
      const data = await response.json();
      console.log('   Backend is running');
      console.log('   API returned', data.length, 'transactions');
    } else {
      console.log('   Backend responded with status:', response.status);
    }
  } catch (error) {
    console.log('   Backend is NOT running:', error.message);
  }
  
  console.log('\n=== STATUS CHECK COMPLETE ===');
}

checkSystem().catch(console.error);
