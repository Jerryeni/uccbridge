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
process.env = { ...process.env, ...envVars };

const BRIDGE_ABI = [
  'event Deposit(address indexed user, uint256 amount, uint256 depositId, address destinationAddress)'
];

async function checkDeposits() {
  console.log('=== CHECKING DEPOSIT STATUS ===\n');
  
  const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
  const bridge = new ethers.Contract(process.env.BSC_BRIDGE_ADDRESS, BRIDGE_ABI, provider);
  
  const userAddress = '0x742a2f3e6f2d6ddaafad5d9f83146e293e8fa713'; // lowercase to avoid checksum issues
  
  console.log('1. Recent Deposit Events (last 5000 blocks):');
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 5000);
  
  console.log('   Current block:', currentBlock);
  console.log('   Scanning from:', fromBlock);
  
  try {
    const filter = bridge.filters.Deposit(userAddress);
    const events = await bridge.queryFilter(filter, fromBlock, currentBlock);
    
    console.log('   Found', events.length, 'deposit event(s)\n');
    
    for (const event of events) {
      const block = await event.getBlock();
      console.log('   Deposit Details:');
      console.log('   - Block:', event.blockNumber);
      console.log('   - Tx Hash:', event.transactionHash);
      console.log('   - User:', event.args.user);
      console.log('   - Destination:', event.args.destinationAddress);
      console.log('   - Amount:', ethers.formatEther(event.args.amount), 'BNB');
      console.log('   - Deposit ID:', event.args.depositId.toString());
      console.log('   - Time:', new Date(block.timestamp * 1000).toISOString());
      console.log('   - Confirmations:', currentBlock - event.blockNumber);
      console.log('');
    }
  } catch (error) {
    console.log('   Error querying events:', error.message);
    console.log('   Trying smaller range...');
    
    // Try last 1000 blocks
    const smallerFrom = Math.max(0, currentBlock - 1000);
    const filter = bridge.filters.Deposit(userAddress);
    const events = await bridge.queryFilter(filter, smallerFrom, currentBlock);
    
    console.log('   Found', events.length, 'deposit event(s) in last 1000 blocks\n');
    
    for (const event of events) {
      const block = await event.getBlock();
      console.log('   Deposit Details:');
      console.log('   - Block:', event.blockNumber);
      console.log('   - Tx Hash:', event.transactionHash);
      console.log('   - Amount:', ethers.formatEther(event.args.amount), 'BNB');
      console.log('   - Deposit ID:', event.args.depositId.toString());
      console.log('   - Time:', new Date(block.timestamp * 1000).toISOString());
      console.log('');
    }
  }
  
  console.log('=== CHECK COMPLETE ===');
}

checkDeposits().catch(console.error);
