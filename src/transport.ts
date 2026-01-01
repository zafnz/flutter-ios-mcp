import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Express } from 'express';
import { logger } from './utils/logger.js';

export function setupTransport(app: Express): StreamableHTTPServerTransport {
  logger.debug('Setting up Streamable HTTP transport');

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  app.post('/mcp', (req, res) => {
    void transport.handleRequest(req, res, req.body);
  });

  app.get('/mcp', (req, res) => {
    void transport.handleRequest(req, res);
  });

  app.delete('/mcp', (req, res) => {
    void transport.handleRequest(req, res);
  });

  logger.debug('Streamable HTTP transport routes registered');

  return transport;
}
