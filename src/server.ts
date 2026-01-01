import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';
import { logger } from './utils/logger.js';

export function createMCPServer(): McpServer {
  logger.info('Creating MCP server');

  const server = new McpServer(
    {
      name: 'flutter-ios-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerTools(server);

  logger.info('MCP server created');
  return server;
}
