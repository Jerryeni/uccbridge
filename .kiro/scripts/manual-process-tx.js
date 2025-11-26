#!/usr/bin/env node

/**
 * Manual Transaction Processor
 * Use this to manually process a stuck transaction
 */

const { ethers } = require('ethers');
const fs = require('fs');

// Read .env file manually
const envPath = './backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

process.env = { ...process.env, ...envVars };

const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
const UC_RPC = process.env.UC_RPC_URL || 'https://rpc.mainnet.ucchain.org';
const RELAYER_KEY = process.env.RELAYER_PRIVATE_KEY;
const BSC_BRIDGE = process.env.BSC_BRIDGE_ADDRESS;
const UC_BRIDGE = process.env.UC_BRIDGE_ADDRESS;

const BSC_BRIDGE_ABI = [
  "event Deposit(address indexed user, uint256 amount, bytes32 depositId, string destinationChain, string destinationAddress)",
  "function processedDeposits(bytes32) view returns (bool)"
];

const UC_BRIDGE_ABI = [
  "function mint(address user, uint256 amount, bytes32 depositId) external",
  "function processedMints(bytes32) view returns (bool)"
];

async function processTransaction(txHash) {
  console.log('🔍 Manual Transaction Processor');
  console.log('================================\n');
  
  if (!txHash) {
    console.error('❌ Error: Please provide transaction hash');
    console.log('\nUsage: node manual-process-tx.js <BSC_TX_HASH>');
    console.log('Example: node manual-process-tx.js 0x1234...\n');
    process.exit(1);
  }

  try {
    // Setup providers
    console.log('📡 Connecting to networks...');
    const bscProvider = new ethers.JsonRpcProvider(BSC_RPC);
    const ucProvider = new ethers.JsonRpcProvider(UC_RPC);
    
    // Setup wallet
    const ucWallet = new ethers.Wallet(RELAYER_KEY, ucProvider);
    const relayerAddress = await ucWallet.getAddress();
    console.log(`✅ Relayer: ${relayerAddress}\n`);

    // Get transaction receipt
    console.log(`🔎 Fetching BSC transaction: ${txHash}`);
    const receipt = await bscProvider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.error('❌ Transaction not found on BSC');
      process.exit(1);
    }

    console.log(`✅ Transaction found in block ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}\n`);

    if (receipt.status !== 1) {
      console.error('❌ Transaction failed on BSC');
      process.exit(1);
    }

    // Parse logs for Deposit event
    const bscBridge = new ethers.Contract(BSC_BRIDGE, BSC_BRIDGE_ABI, bscProvider);
    const ucBridge = new ethers.Contract(UC_BRIDGE, UC_BRIDGE_ABI, ucWallet);

    console.log('📋 Parsing deposit event...');
    const depositEvents = receipt.logs
      .map(log => {
        try {
          return bscBridge.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(event => event && event.name === 'Deposit');

    if (depositEvents.length === 0) {
      console.error('❌ No Deposit event found in transaction');
      process.exit(1);
    }

    const depositEvent = depositEvents[0];
    const { user, amount, depositId, destinationAddress } = depositEvent.args;

    console.log('✅ Deposit Details:');
    console.log(`   User: ${user}`);
    console.log(`   Amount: ${ethers.formatUnits(amount, 6)} USDT`);
    console.log(`   Deposit ID: ${depositId}`);
    console.log(`   Destination: ${destinationAddress}\n`);

    // Check if already processed
    console.log('🔍 Checking if already processed...');
    const alreadyProcessed = await ucBridge.processedMints(depositId);
    
    if (alreadyProcessed) {
      console.log('✅ Transaction already processed on UC Chain!');
      console.log('   Status should update shortly.\n');
      process.exit(0);
    }

    console.log('⚠️  Not yet processed. Processing now...\n');

    // Process the mint
    console.log('💫 Minting on UC Chain...');
    const tx = await ucBridge.mint(destinationAddress, amount, depositId);
    console.log(`✅ Mint transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...\n');

    const mintReceipt = await tx.wait();
    console.log('🎉 SUCCESS!');
    console.log(`   UC TX Hash: ${mintReceipt.hash}`);
    console.log(`   Block: ${mintReceipt.blockNumber}`);
    console.log(`   Gas Used: ${mintReceipt.gasUsed.toString()}`);
    console.log(`   Status: ${mintReceipt.status === 1 ? 'Confirmed' : 'Failed'}\n`);

    console.log('✅ Your transaction is now complete!');
    console.log('   Refresh the transaction page to see the updated status.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Get transaction hash from command line
const txHash = process.argv[2];
processTransaction(txHash);
