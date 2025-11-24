import { ethers } from 'ethers';
import { config } from './config.js';
import { BSC_BRIDGE_ABI, UC_BRIDGE_ABI } from './abis.js';
import logger from './logger.js';

class BridgeRelayer {
  constructor() {
    this.processedDeposits = new Set();
    this.processedBurns = new Set();
    this.isRunning = false;
  }

  async initialize() {
    try {
      // Setup BSC provider and contracts
      this.bscProvider = new ethers.JsonRpcProvider(config.bscRpcUrl);
      this.bscWallet = new ethers.Wallet(config.relayerPrivateKey, this.bscProvider);
      this.bscBridge = new ethers.Contract(config.bscBridgeAddress, BSC_BRIDGE_ABI, this.bscWallet);

      // Setup UC provider and contracts
      this.ucProvider = new ethers.JsonRpcProvider(config.ucRpcUrl);
      this.ucWallet = new ethers.Wallet(config.relayerPrivateKey, this.ucProvider);
      this.ucBridge = new ethers.Contract(config.ucBridgeAddress, UC_BRIDGE_ABI, this.ucWallet);

      // Get relayer address
      this.relayerAddress = await this.bscWallet.getAddress();

      logger.info('Relayer initialized', {
        relayerAddress: this.relayerAddress,
        bscBridge: config.bscBridgeAddress,
        ucBridge: config.ucBridgeAddress
      });

      // Get starting blocks
      this.bscLastBlock = config.startBlockBsc === 'latest' 
        ? await this.bscProvider.getBlockNumber() 
        : parseInt(config.startBlockBsc);
      
      this.ucLastBlock = config.startBlockUc === 'latest'
        ? await this.ucProvider.getBlockNumber()
        : parseInt(config.startBlockUc);

      logger.info('Starting from blocks', {
        bsc: this.bscLastBlock,
        uc: this.ucLastBlock
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize relayer', { error: error.message });
      throw error;
    }
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Relayer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting relayer service...');

    // Start monitoring both chains
    this.monitorBscDeposits();
    this.monitorUcBurns();
  }

  async monitorBscDeposits() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.bscProvider.getBlockNumber();
        
        if (currentBlock > this.bscLastBlock) {
          // Limit block range to avoid rate limiting (max 50 blocks at a time)
          const toBlock = Math.min(currentBlock, this.bscLastBlock + 50);
          
          logger.info(`Checking BSC blocks ${this.bscLastBlock + 1} to ${toBlock}`);

          // Query Deposit events
          const filter = this.bscBridge.filters.Deposit();
          const events = await this.bscBridge.queryFilter(
            filter,
            this.bscLastBlock + 1,
            toBlock
          );

          for (const event of events) {
            await this.handleBscDeposit(event);
          }

          this.bscLastBlock = toBlock;
        }
      } catch (error) {
        if (error.message.includes('rate limit')) {
          logger.warn('BSC RPC rate limit hit, waiting 5 seconds...');
          await this.sleep(5000);
        } else {
          logger.error('Error monitoring BSC deposits', { error: error.message });
        }
      }

      await this.sleep(config.pollInterval);
    }
  }

  async monitorUcBurns() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.ucProvider.getBlockNumber();
        
        if (currentBlock > this.ucLastBlock) {
          // Limit block range to avoid rate limiting (max 50 blocks at a time)
          const toBlock = Math.min(currentBlock, this.ucLastBlock + 50);
          
          logger.info(`Checking UC blocks ${this.ucLastBlock + 1} to ${toBlock}`);

          // Query Burn events
          const filter = this.ucBridge.filters.Burn();
          const events = await this.ucBridge.queryFilter(
            filter,
            this.ucLastBlock + 1,
            toBlock
          );

          for (const event of events) {
            await this.handleUcBurn(event);
          }

          this.ucLastBlock = toBlock;
        }
      } catch (error) {
        if (error.message.includes('rate limit')) {
          logger.warn('UC RPC rate limit hit, waiting 5 seconds...');
          await this.sleep(5000);
        } else {
          logger.error('Error monitoring UC burns', { error: error.message });
        }
      }

      await this.sleep(config.pollInterval);
    }
  }

  async handleBscDeposit(event) {
    try {
      const { user, amount, depositId, destinationAddress } = event.args;
      const depositIdStr = depositId.toString();

      // Check if already processed
      if (this.processedDeposits.has(depositIdStr)) {
        logger.debug('Deposit already processed', { depositId: depositIdStr });
        return;
      }

      logger.info('Processing BSC deposit', {
        bscUser: user,
        amount: ethers.formatUnits(amount, 6),
        depositId: depositIdStr,
        destinationAddress,
        bscTxHash: event.transactionHash
      });

      // Call mint on UC Bridge with destinationAddress (not user)
      // The UC Bridge contract expects: mint(address user, uint256 amount, bytes32 depositId)
      // We need to pass the destinationAddress as the user parameter
      const tx = await this.ucBridge.mint(destinationAddress, amount, depositId);
      logger.info('Mint transaction sent to UC Chain', { 
        ucTxHash: tx.hash,
        recipient: destinationAddress,
        amount: ethers.formatUnits(amount, 6),
        depositId: depositIdStr
      });

      const receipt = await tx.wait();
      logger.info('Mint transaction confirmed on UC Chain', {
        ucTxHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'Success' : 'Failed'
      });

      // Mark as processed
      this.processedDeposits.add(depositIdStr);

      logger.info('Bridge transfer completed', {
        from: 'BSC',
        to: 'UC Chain',
        bscTxHash: event.transactionHash,
        ucTxHash: receipt.hash,
        amount: ethers.formatUnits(amount, 6),
        recipient: destinationAddress
      });

    } catch (error) {
      logger.error('Error handling BSC deposit', {
        error: error.message,
        stack: error.stack,
        depositId: event.args.depositId.toString(),
        bscTxHash: event.transactionHash
      });
    }
  }

  async handleUcBurn(event) {
    try {
      const { user, amount, burnId, destinationAddress } = event.args;
      const burnIdStr = burnId.toString();

      // Check if already processed
      if (this.processedBurns.has(burnIdStr)) {
        logger.debug('Burn already processed', { burnId: burnIdStr });
        return;
      }

      logger.info('Processing UC burn', {
        ucUser: user,
        amount: ethers.formatUnits(amount, 6),
        burnId: burnIdStr,
        destinationAddress,
        ucTxHash: event.transactionHash
      });

      // Call unlock on BSC Bridge with destinationAddress (not user)
      // The BSC Bridge contract expects: unlock(address user, uint256 amount, bytes32 burnId)
      // We need to pass the destinationAddress as the user parameter
      const tx = await this.bscBridge.unlock(destinationAddress, amount, burnId);
      logger.info('Unlock transaction sent to BSC', { 
        bscTxHash: tx.hash,
        recipient: destinationAddress,
        amount: ethers.formatUnits(amount, 6),
        burnId: burnIdStr
      });

      const receipt = await tx.wait();
      logger.info('Unlock transaction confirmed on BSC', {
        bscTxHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'Success' : 'Failed'
      });

      // Mark as processed
      this.processedBurns.add(burnIdStr);

      logger.info('Bridge transfer completed', {
        from: 'UC Chain',
        to: 'BSC',
        ucTxHash: event.transactionHash,
        bscTxHash: receipt.hash,
        amount: ethers.formatUnits(amount, 6),
        recipient: destinationAddress
      });

    } catch (error) {
      logger.error('Error handling UC burn', {
        error: error.message,
        stack: error.stack,
        burnId: event.args.burnId.toString(),
        ucTxHash: event.transactionHash
      });
    }
  }

  stop() {
    logger.info('Stopping relayer service...');
    this.isRunning = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BridgeRelayer;
