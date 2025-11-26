const { ethers } = require('ethers');

const YOUR_WALLET = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8'; // CORRECT wallet
const BRIDGE_ADDRESS = '0xE4363F8FbD39FB0930772644Ebd14597e5756986';
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

async function checkCorrectWallet() {
  console.log('=== CHECKING CORRECT WALLET ===\n');
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed3.binance.org');
  const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);
  
  console.log('Your wallet:', YOUR_WALLET);
  console.log('Bridge:', BRIDGE_ADDRESS);
  console.log('');
  
  // Check balance
  const balance = await usdt.balanceOf(YOUR_WALLET);
  const decimals = await usdt.decimals();
  const balanceFormatted = ethers.formatUnits(balance, decimals);
  
  console.log('📊 USDT Balance:', balanceFormatted, 'USDT');
  
  // Check allowance
  const allowance = await usdt.allowance(YOUR_WALLET, BRIDGE_ADDRESS);
  const allowanceFormatted = ethers.formatUnits(allowance, decimals);
  
  console.log('🔓 Approved to Bridge:', allowanceFormatted, 'USDT');
  console.log('');
  
  // Check BSCScan link
  console.log('🔍 Check your transactions:');
  console.log('   https://bscscan.com/address/' + YOUR_WALLET);
  console.log('');
  
  // Try to find recent transfers
  console.log('🔎 Searching for recent USDT transfers...');
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 500); // Last 500 blocks only
    
    console.log('   Scanning blocks', fromBlock, 'to', currentBlock);
    
    // Create filter for transfers FROM this wallet
    const iface = new ethers.Interface(ERC20_ABI);
    const transferTopic = iface.getEvent('Transfer').topicHash;
    const fromTopic = ethers.zeroPadValue(YOUR_WALLET.toLowerCase(), 32);
    
    const logs = await provider.getLogs({
      address: USDT_ADDRESS,
      fromBlock,
      toBlock: currentBlock,
      topics: [transferTopic, fromTopic]
    });
    
    console.log('   Found', logs.length, 'transfer(s) from your wallet\n');
    
    if (logs.length > 0) {
      console.log('   📤 Recent Transfers:');
      for (const log of logs) {
        const parsed = iface.parseLog(log);
        const block = await provider.getBlock(log.blockNumber);
        
        console.log('   ─'.repeat(50));
        console.log('   TX Hash:', log.transactionHash);
        console.log('   Block:', log.blockNumber);
        console.log('   To:', parsed.args.to);
        console.log('   Amount:', ethers.formatUnits(parsed.args.value, decimals), 'USDT');
        console.log('   Time:', new Date(block.timestamp * 1000).toISOString());
        console.log('   BSCScan: https://bscscan.com/tx/' + log.transactionHash);
        
        // Check if it's to the bridge
        if (parsed.args.to.toLowerCase() === BRIDGE_ADDRESS.toLowerCase()) {
          console.log('   🎯 THIS IS A BRIDGE DEPOSIT!');
          console.log('   ');
          console.log('   ✅ FOUND YOUR DEPOSIT!');
          console.log('   Run this to process it:');
          console.log('   node process-specific-deposit.js', log.transactionHash);
        }
      }
    }
    
  } catch (error) {
    console.log('   ❌ Could not scan transactions:', error.message);
  }
  
  console.log('\n=== CHECK COMPLETE ===');
}

checkCorrectWallet().catch(console.error);
