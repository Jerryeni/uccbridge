const { ethers } = require('ethers');

// Your mint transactions from the screenshot
const MINT_TX_1 = '0xd2426be41a0fd24ee473844611c5b41085a35d0172e1459eeab9c96ce7386ef8';
const MINT_TX_2 = '0x57c8d84211828757df3c91207221919bb91b1d0f4c6d26e3011d059ac0dc7fc8';

// Your deposit transactions
const DEPOSIT_TX_1 = '0x307ce6d998cbc03418808e0c36a18016aab6f0aed902eddfa7b0bd467171112c';
const DEPOSIT_TX_2 = '0xbbbc0b3ab967ad0533ee7c22975049bb1882fb30f8223b1f8b1dcd3294a51df7';

async function verifyTransactions() {
  console.log('=== VERIFYING TRANSACTION STATUS ===\n');
  
  // Check UC Chain mints
  console.log('1️⃣  Checking UC Chain Mint Transactions...\n');
  const ucProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.ucchain.org');
  
  for (const tx of [MINT_TX_1, MINT_TX_2]) {
    const receipt = await ucProvider.getTransactionReceipt(tx);
    if (receipt) {
      console.log('TX:', tx);
      console.log('   Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   Block:', receipt.blockNumber);
      console.log('   Confirmations:', await ucProvider.getBlockNumber() - receipt.blockNumber);
      console.log('');
    } else {
      console.log('TX:', tx);
      console.log('   Status: ⏳ PENDING or NOT FOUND');
      console.log('');
    }
  }
  
  // Check BSC deposits
  console.log('2️⃣  Checking BSC Deposit Transactions...\n');
  const bscProvider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org');
  
  for (const tx of [DEPOSIT_TX_1, DEPOSIT_TX_2]) {
    const receipt = await bscProvider.getTransactionReceipt(tx);
    if (receipt) {
      console.log('TX:', tx);
      console.log('   Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   Block:', receipt.blockNumber);
      console.log('   Confirmations:', await bscProvider.getBlockNumber() - receipt.blockNumber);
      console.log('');
    } else {
      console.log('TX:', tx);
      console.log('   Status: ⏳ PENDING or NOT FOUND');
      console.log('');
    }
  }
  
  // Check your USDT balance on UC Chain
  console.log('3️⃣  Checking Your USDT Balance on UC Chain...\n');
  const USDT_ADDRESS = '0x4ABB3197C29018A05Ab8D6810B126D14A99abde9';
  const YOUR_WALLET = '0xfFF668776c211D09592F5089A9581E3A5a20A6f8';
  
  const usdtAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
  const usdt = new ethers.Contract(USDT_ADDRESS, usdtAbi, ucProvider);
  
  const balance = await usdt.balanceOf(YOUR_WALLET);
  const decimals = await usdt.decimals();
  
  console.log('Your Wallet:', YOUR_WALLET);
  console.log('USDT Balance:', ethers.formatUnits(balance, decimals), 'USDT');
  console.log('');
  
  console.log('=== VERIFICATION COMPLETE ===');
  console.log('');
  console.log('If transactions show SUCCESS but frontend shows PENDING:');
  console.log('→ This is a frontend caching/display issue');
  console.log('→ The transactions are actually complete on blockchain');
  console.log('→ Try refreshing the page or clearing cache');
}

verifyTransactions().catch(console.error);
