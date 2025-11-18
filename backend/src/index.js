import http from 'http';
import BridgeRelayer from './relayer.js';
import logger from './logger.js';

async function main() {
  logger.info('=== USDT Bridge Relayer Service ===');
  logger.info('Initializing...');

  const relayer = new BridgeRelayer();

  try {
    await relayer.initialize();
    await relayer.start();

    // Create HTTP server for Railway health checks
    const PORT = process.env.PORT || 3001;
    const server = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: 'USDT Bridge Relayer',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(PORT, () => {
      logger.info(`Health check server listening on port ${PORT}`);
      logger.info('Relayer service is running. Press Ctrl+C to stop.');
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close();
      relayer.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Failed to start relayer', { error: error.message });
    process.exit(1);
  }
}

main();
