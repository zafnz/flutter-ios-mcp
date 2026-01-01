import express from 'express';
import { createMCPServer } from './server.js';
import { setupTransport } from './transport.js';
import { sessionManager } from './session/manager.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main(): Promise<void> {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const mcpServer = createMCPServer();
  const transport = setupTransport(app);

  await mcpServer.connect(transport);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const server = app.listen(PORT, HOST, () => {
    logger.info('Server started', {
      host: HOST,
      port: String(PORT),
      mcpEndpoint: `http://${HOST}:${String(PORT)}/mcp`,
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error', { error: error.message });
      process.exit(1);
    }
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down server');

    await sessionManager.cleanup();
    await transport.close();

    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });
  process.on('SIGINT', () => {
    void shutdown();
  });
}

main().catch((error: unknown) => {
  logger.error('Fatal error', { error: String(error) });
  process.exit(1);
});
