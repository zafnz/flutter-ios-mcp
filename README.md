# flutter-ios-mcp

A Model Context Protocol (MCP) server that provides Flutter iOS development tooling for AI agents. Enables containerized Claude instances to build, run, and interact with Flutter iOS applications on a macOS host via Streamable HTTP transport.

## Features

- **Session-based isolation**: Each agent gets its own simulator and flutter process
- **Git worktree support**: Concurrent agents work on separate worktrees of the same repo
- **Log streaming**: Real-time flutter output via Streamable HTTP SSE responses
- **Hot reload/restart**: Interactive development workflow support
- **Simulator UI control**: Tap, swipe, type, screenshot via Facebook IDB
- **Remote access**: Streamable HTTP transport (no mcp-proxy needed)

## Prerequisites (macOS Host)

- Node.js 18+
- Xcode with iOS Simulators installed
- Flutter SDK in PATH
- Facebook IDB installed (`brew install idb-companion`)
- Git (for worktree support)

## Installation

```bash
npm install
npm run build
```

## Usage

### Starting the Server

```bash
npm start
# Server running at http://localhost:3000/mcp
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `HOST` | HTTP server bind address | `0.0.0.0` |
| `FLUTTER_PATH` | Path to flutter binary | `flutter` (from PATH) |
| `IDB_PATH` | Path to idb binary | `idb` (from PATH) |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Connecting from Docker

Configure MCP client to connect to `http://host.docker.internal:3000/mcp`

## Development

```bash
npm run dev          # Dev mode with watch
npm test             # Run tests
npm run test:watch   # Tests in watch mode
npm run lint         # ESLint
npm run typecheck    # Type check only
```

## License

MIT
