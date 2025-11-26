import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const STATE_FILE = path.join(process.cwd(), 'relayer-state.json');

export class StateManager {
  constructor() {
    this.state = this.loadState();
    logger.info('State manager initialized', {
      lastBscBlock: this.state.lastBscBlock,
      lastUcBlock: this.state.lastUcBlock,
      processedDeposits: this.state.processedDeposits.length,
      processedBurns: this.state.processedBurns.length
    });
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const data = fs.readFileSync(STATE_FILE, 'utf8');
        const state = JSON.parse(data);
        logger.info('Loaded state from file', {
          lastSaved: state.lastSaved,
          deposits: state.processedDeposits.length,
          burns: state.processedBurns.length
        });
        return state;
      }
    } catch (error) {
      logger.error('Error loading state file', { error: error.message });
    }
    
    logger.info('Creating new state file');
    return {
      lastBscBlock: null,
      lastUcBlock: null,
      processedDeposits: [],
      processedBurns: [],
      lastSaved: null,
      startedAt: new Date().toISOString()
    };
  }

  saveState() {
    try {
      this.state.lastSaved = new Date().toISOString();
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error('Error saving state file', { error: error.message });
    }
  }

  setLastBscBlock(block) {
    this.state.lastBscBlock = block;
    this.saveState();
  }

  setLastUcBlock(block) {
    this.state.lastUcBlock = block;
    this.saveState();
  }

  addProcessedDeposit(depositId) {
    const depositIdStr = depositId.toString();
    if (!this.state.processedDeposits.includes(depositIdStr)) {
      this.state.processedDeposits.push(depositIdStr);
      // Keep only last 10000 to prevent file from growing too large
      if (this.state.processedDeposits.length > 10000) {
        this.state.processedDeposits = this.state.processedDeposits.slice(-10000);
      }
      this.saveState();
      logger.debug('Added processed deposit to state', { depositId: depositIdStr });
    }
  }

  addProcessedBurn(burnId) {
    const burnIdStr = burnId.toString();
    if (!this.state.processedBurns.includes(burnIdStr)) {
      this.state.processedBurns.push(burnIdStr);
      if (this.state.processedBurns.length > 10000) {
        this.state.processedBurns = this.state.processedBurns.slice(-10000);
      }
      this.saveState();
      logger.debug('Added processed burn to state', { burnId: burnIdStr });
    }
  }

  isDepositProcessed(depositId) {
    return this.state.processedDeposits.includes(depositId.toString());
  }

  isBurnProcessed(burnId) {
    return this.state.processedBurns.includes(burnId.toString());
  }

  getLastBscBlock() {
    return this.state.lastBscBlock;
  }

  getLastUcBlock() {
    return this.state.lastUcBlock;
  }

  getStats() {
    return {
      lastBscBlock: this.state.lastBscBlock,
      lastUcBlock: this.state.lastUcBlock,
      totalDepositsProcessed: this.state.processedDeposits.length,
      totalBurnsProcessed: this.state.processedBurns.length,
      lastSaved: this.state.lastSaved,
      startedAt: this.state.startedAt
    };
  }
}
