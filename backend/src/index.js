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

    // Create HTTP server for Railway health checks and API
    const PORT = process.env.PORT || 3001;
    const server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          service: 'USDT Bridge Relayer',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }));
      } else if (req.url.startsWith('/api/tx-hashes/')) {
        // Extract transaction ID from URL
        const txId = req.url.split('/api/tx-hashes/')[1];
        
        if (!txId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Transaction ID required' }));
          return;
        }

        const txHashes = relayer.stateManager.getTransactionHashes(txId);
        
        if (txHashes) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(txHashes));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Transaction not found' }));
        }
      } else if (req.url === '/api/tx-hashes') {
        // Get all transaction hashes
        const allHashes = relayer.stateManager.getAllTransactionHashes();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(allHashes));
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
