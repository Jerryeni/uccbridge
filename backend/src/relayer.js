import { ethers } from 'ethers';
import { config } from './config.js';
import { BSC_BRIDGE_ABI, UC_BRIDGE_ABI } from './abis.js';
import logger, { transactionLogger } from './logger.js';

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

      // Log current block numbers for comparison
      const currentBscBlock = await this.bscProvider.getBlockNumber();
      const currentUcBlock = await this.ucProvider.getBlockNumber();
      
      const bscBehind = currentBscBlock - this.bscLastBlock;
      const ucBehind = currentUcBlock - this.ucLastBlock;
      
      if (bscBehind > 0 || ucBehind > 0) {
        logger.info('Blocks behind current', {
          bsc: `${bscBehind} blocks (current: ${currentBscBlock})`,
          uc: `${ucBehind} blocks (current: ${currentUcBlock})`
        });
        
        if (bscBehind > 100 || ucBehind > 100) {
          logger.warn('Relayer is significantly behind, will catch up quickly');
        }
      }

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

    // Use optimized polling only (WebSocket filters expire on public RPCs)
    // Polling is now fast enough: 5 seconds interval, 500 blocks per query
    logger.info('Using optimized polling mode (5s interval, 500 blocks/query)');
    
    this.monitorBscDeposits();
    this.monitorUcBurns();
  }

  // WebSocket listeners disabled - public RPCs have filter expiration issues
  // Using optimized polling instead: 5s interval with 500 blocks per query
  // This provides near real-time detection without WebSocket reliability issues

  async monitorBscDeposits() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.bscProvider.getBlockNumber();
        
        if (currentBlock > this.bscLastBlock) {
          // Calculate blocks behind
          const blocksBehind = currentBlock - this.bscLastBlock;
          
          // FIXED: Use smaller block ranges to avoid rate limiting
          // Only scan 1-10 blocks at a time
          let blockRange;
          if (blocksBehind > 100) {
            blockRange = 10; // Scan 10 blocks when catching up
          } else if (blocksBehind > 10) {
            blockRange = 5; // Scan 5 blocks when moderately behind
          } else {
            blockRange = Math.min(blocksBehind, 3); // Scan 1-3 blocks when near current
          }
          
          const toBlock = Math.min(currentBlock, this.bscLastBlock + blockRange);
          
          logger.info(`Checking BSC blocks ${this.bscLastBlock + 1} to ${toBlock} (${blocksBehind} blocks behind)`);

          // Query Deposit events
          const filter = this.bscBridge.filters.Deposit();
          const events = await this.bscBridge.queryFilter(
            filter,
            this.bscLastBlock + 1,
            toBlock
          );

          if (events.length > 0) {
            logger.info(`Found ${events.length} deposit(s) on BSC`);
          }

          for (const event of events) {
            await this.handleBscDeposit(event);
          }

          this.bscLastBlock = toBlock;
          
          // FIXED: Always wait 2 seconds between scans to avoid rate limiting
          await this.sleep(2000);
        } else {
          // We're caught up, use normal polling interval
          await this.sleep(config.pollInterval);
        }
      } catch (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          logger.warn('BSC RPC rate limit hit, waiting 15 seconds...');
          await this.sleep(15000); // Wait 15 seconds on rate limit
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          logger.warn('BSC network timeout, retrying...', { error: error.message });
          await this.sleep(5000);
        } else {
          logger.error('Error monitoring BSC deposits', { error: error.message, stack: error.stack });
          await this.sleep(config.pollInterval);
        }
      }
    }
  }

  async monitorUcBurns() {
    while (this.isRunning) {
      try {
        const currentBlock = await this.ucProvider.getBlockNumber();
        
        if (currentBlock > this.ucLastBlock) {
          // Calculate blocks behind
          const blocksBehind = currentBlock - this.ucLastBlock;
          
          // FIXED: Use smaller block ranges
          let blockRange;
          if (blocksBehind > 100) {
            blockRange = 20; // Scan 20 blocks when catching up
          } else if (blocksBehind > 10) {
            blockRange = 10; // Scan 10 blocks when moderately behind
          } else {
            blockRange = Math.min(blocksBehind, 5); // Scan 1-5 blocks when near current
          }
          
          const toBlock = Math.min(currentBlock, this.ucLastBlock + blockRange);
          
          logger.info(`Checking UC blocks ${this.ucLastBlock + 1} to ${toBlock} (${blocksBehind} blocks behind)`);

          // Query Burn events
          const filter = this.ucBridge.filters.Burn();
          const events = await this.ucBridge.queryFilter(
            filter,
            this.ucLastBlock + 1,
            toBlock
          );

          if (events.length > 0) {
            logger.info(`Found ${events.length} burn(s) on UC`);
          }

          for (const event of events) {
            await this.handleUcBurn(event);
          }

          this.ucLastBlock = toBlock;
          
          // FIXED: Always wait 2 seconds between scans
          await this.sleep(2000);
        } else {
          // We're caught up, use normal polling interval
          await this.sleep(config.pollInterval);
        }
      } catch (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          logger.warn('UC RPC rate limit hit, waiting 15 seconds...');
          await this.sleep(15000);
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          logger.warn('UC network timeout, retrying...', { error: error.message });
          await this.sleep(5000);
        } else {
          logger.error('Error monitoring UC burns', { error: error.message, stack: error.stack });
          await this.sleep(config.pollInterval);
        }
      }
    }
  }

  async handleBscDeposit(event) {
    const startTime = Date.now();
    try {
      const { user, amount, depositId, destinationAddress } = event.args;
      const depositIdStr = depositId.toString();
      const txHash = event.transactionHash;

      // Check if already processed
      if (this.processedDeposits.has(depositIdStr)) {
        logger.debug('Deposit already processed', { depositId: depositIdStr });
        return;
      }

      logger.info('🔔 BSC Deposit detected, waiting for confirmations...', {
        txHash,
        depositId: depositIdStr,
        amount: ethers.formatUnits(amount, 6),
        user,
        destinationAddress
      });

      // STEP 1: Wait for BSC confirmations (~20 seconds for 6 confirmations)
      const requiredConfirmations = 6;
      let currentBlock = await this.bscProvider.getBlockNumber();
      let confirmations = currentBlock - event.blockNumber;

      if (confirmations < requiredConfirmations) {
        const blocksToWait = requiredConfirmations - confirmations;
        const waitTime = blocksToWait * 3000; // 3 seconds per BSC block
        
        logger.info(`⏳ Waiting for ${blocksToWait} more confirmations (~${waitTime/1000}s)`, {
          depositId: depositIdStr,
          currentConfirmations: confirmations,
          requiredConfirmations
        });
        
        await this.sleep(waitTime);
        currentBlock = await this.bscProvider.getBlockNumber();
        confirmations = currentBlock - event.blockNumber;
      }

      // STEP 2: Verify transaction using TX ID
      logger.info('🔍 Verifying transaction on BSC using TX ID...', { txHash });
      const receipt = await this.bscProvider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        logger.error('❌ Transaction receipt not found', { txHash });
        return;
      }

      if (receipt.status !== 1) {
        logger.error('❌ Transaction failed on BSC', { txHash, status: receipt.status });
        return;
      }

      // STEP 3: Re-extract and validate data from verified transaction
      const verifiedEvent = receipt.logs
        .map(log => {
          try {
            return this.bscBridge.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === 'Deposit');

      if (!verifiedEvent) {
        logger.error('❌ Deposit event not found in verified transaction', { txHash });
        return;
      }

      // Validate data matches
      const verifiedData = verifiedEvent.args;
      if (verifiedData.depositId.toString() !== depositIdStr) {
        logger.error('❌ DepositId mismatch in verification', {
          expected: depositIdStr,
          got: verifiedData.depositId.toString()
        });
        return;
      }

      logger.info('✅ Transaction verified on BSC', {
        txHash,
        confirmations,
        depositId: depositIdStr,
        verificationTime: `${Date.now() - startTime}ms`
      });

      // Log verified transaction
      transactionLogger.info('BSC Deposit Verified', {
        direction: 'BSC -> UC',
        sourceChain: 'BSC',
        destinationChain: 'UC',
        user: verifiedData.user,
        destinationAddress: verifiedData.destinationAddress,
        amount: ethers.formatUnits(verifiedData.amount, 6),
        amountRaw: verifiedData.amount.toString(),
        depositId: depositIdStr,
        bscTxHash: txHash,
        blockNumber: receipt.blockNumber,
        confirmations,
        status: 'verified'
      });

      // STEP 4: Sign and submit to UCC with owner wallet (relayer key)
      logger.info('🔐 Signing transaction with owner wallet for UCC...', {
        depositId: depositIdStr,
        recipient: verifiedData.destinationAddress,
        amount: ethers.formatUnits(verifiedData.amount, 6)
      });

      const tx = await this.ucBridge.mint(
        verifiedData.destinationAddress,  // user address
        verifiedData.amount,               // exact amount
        verifiedData.depositId             // depositId
      );

      logger.info('✅ Transaction signed and submitted to UCC', { 
        ucTxHash: tx.hash,
        depositId: depositIdStr
      });

      // STEP 5: Wait for UCC confirmation
      const ucReceipt = await tx.wait();
      
      logger.info('✅ UCC transaction confirmed', {
        ucTxHash: ucReceipt.hash,
        blockNumber: ucReceipt.blockNumber,
        gasUsed: ucReceipt.gasUsed.toString(),
        status: ucReceipt.status === 1 ? 'Success' : 'Failed'
      });

      // Mark as processed
      this.processedDeposits.add(depositIdStr);

      const totalTime = Date.now() - startTime;

      // Log completion
      transactionLogger.info('BSC -> UC Transfer Completed', {
        direction: 'BSC -> UC',
        sourceChain: 'BSC',
        destinationChain: 'UC',
        user: verifiedData.user,
        destinationAddress: verifiedData.destinationAddress,
        amount: ethers.formatUnits(verifiedData.amount, 6),
        amountRaw: verifiedData.amount.toString(),
        depositId: depositIdStr,
        bscTxHash: txHash,
        ucTxHash: ucReceipt.hash,
        ucBlockNumber: ucReceipt.blockNumber,
        gasUsed: ucReceipt.gasUsed.toString(),
        confirmations,
        status: 'completed',
        completedAt: new Date().toISOString(),
        totalTimeMs: totalTime,
        totalTimeSec: `${(totalTime/1000).toFixed(1)}s`
      });

      logger.info(`🎉 Bridge transfer completed in ${(totalTime/1000).toFixed(1)}s`, {
        depositId: depositIdStr,
        bscTx: txHash,
        ucTx: ucReceipt.hash,
        amount: ethers.formatUnits(verifiedData.amount, 6)
      });

    } catch (error) {
      logger.error('❌ Error handling BSC deposit', {
        error: error.message,
        stack: error.stack,
        depositId: event.args.depositId.toString(),
        bscTxHash: event.transactionHash,
        timeElapsed: `${(Date.now() - startTime)/1000}s`
      });

      transactionLogger.error('BSC -> UC Transfer Failed', {
        direction: 'BSC -> UC',
        sourceChain: 'BSC',
        destinationChain: 'UC',
        user: event.args.user,
        destinationAddress: event.args.destinationAddress,
        amount: ethers.formatUnits(event.args.amount, 6),
        depositId: event.args.depositId.toString(),
        bscTxHash: event.transactionHash,
        error: error.message,
        status: 'failed',
        failedAt: new Date().toISOString()
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

      // Log transaction details
      transactionLogger.info('UC Burn Detected', {
        direction: 'UC -> BSC',
        sourceChain: 'UC',
        destinationChain: 'BSC',
        user,
        destinationAddress,
        amount: ethers.formatUnits(amount, 6),
        amountRaw: amount.toString(),
        burnId: burnIdStr,
        ucTxHash: event.transactionHash,
        blockNumber: event.blockNumber,
        status: 'pending'
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

      // Log successful transaction
      transactionLogger.info('UC -> BSC Transfer Completed', {
        direction: 'UC -> BSC',
        sourceChain: 'UC',
        destinationChain: 'BSC',
        user: event.args.user,
        destinationAddress,
        amount: ethers.formatUnits(amount, 6),
        amountRaw: amount.toString(),
        burnId: burnIdStr,
        ucTxHash: event.transactionHash,
        bscTxHash: receipt.hash,
        bscBlockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'completed',
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error handling UC burn', {
        error: error.message,
        stack: error.stack,
        burnId: event.args.burnId.toString(),
        ucTxHash: event.transactionHash
      });

      // Log failed transaction
      transactionLogger.error('UC -> BSC Transfer Failed', {
        direction: 'UC -> BSC',
        sourceChain: 'UC',
        destinationChain: 'BSC',
        user: event.args.user,
        destinationAddress: event.args.destinationAddress,
        amount: ethers.formatUnits(event.args.amount, 6),
        burnId: event.args.burnId.toString(),
        ucTxHash: event.transactionHash,
        error: error.message,
        status: 'failed',
        failedAt: new Date().toISOString()
      });
    }
  }

  stop() {
    logger.info('Stopping relayer service...');
    this.isRunning = false;
    
    // Remove WebSocket listeners
    if (this.bscBridge) {
      this.bscBridge.removeAllListeners();
    }
    if (this.ucBridge) {
      this.ucBridge.removeAllListeners();
    }
  }

  // WebSocket reconnection disabled - using polling only for reliability

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BridgeRelayer;
