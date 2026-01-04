import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Express } from 'express';
import { logger } from './utils/logger.js';
import { updateHostHeader } from './config.js';

export function setupTransport(app: Express): StreamableHTTPServerTransport {
  logger.debug('Setting up Streamable HTTP transport');

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  app.post('/mcp', (req, res) => {
    // Capture the Host header to construct correct URLs for screenshots
    const hostHeader = req.get('host');
    if (hostHeader) {
      updateHostHeader(hostHeader);
    }
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
