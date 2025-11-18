import BridgeRelayer from './relayer.js';
import logger from './logger.js';

async function main() {
  logger.info('=== USDT Bridge Relayer Service ===');
  logger.info('Initializing...');

  const relayer = new BridgeRelayer();

  try {
    await relayer.initialize();
    await relayer.start();

    logger.info('Relayer service is running. Press Ctrl+C to stop.');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal');
      relayer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal');
      relayer.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start relayer', { error: error.message });
    process.exit(1);
  }
}

main();
