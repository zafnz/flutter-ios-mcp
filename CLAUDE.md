# CLAUDE.md

Rules and context for Claude when working on this project.

## Project Summary

flutter-ios-mcp is an MCP server providing Flutter iOS development tooling for AI agents. It enables containerized Claude instances to build, run, and interact with Flutter iOS apps on a macOS host via Streamable HTTP transport.

## Tech Stack

- TypeScript, Node.js 18+
- Express for HTTP server
- @modelcontextprotocol/sdk for MCP
- Zod for schema validation
- Jest for testing
- xcrun simctl for iOS Simulator control
- Facebook IDB for UI automation

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Dev mode with watch
npm test             # Run tests
npm run test:watch   # Tests in watch mode
npm run lint         # ESLint
npm run typecheck    # Type check only
npm start            # Start server
```

## Git Workflow

**Before committing:**
1. Run `npm run lint` and fix issues
2. Run `npm run typecheck` and fix errors
3. Run `npm test` and ensure all pass
4. Stage with `git add -p` to review changes

**Commit messages:** Use conventional commits
```
type(scope): description
```
Types: feat, fix, refactor, test, docs, chore

**Do not commit:** node_modules/, build/, dist/, .env files, commented-out code

## Code Style

- Strict TypeScript, no `any`
- Explicit return types on exports
- Interface over type for objects
- Files under 300 lines
- One primary export per file
- Co-locate tests: `foo.ts` → `foo.test.ts`

**Naming:**
- Files: kebab-case.ts
- Classes/Interfaces: PascalCase  
- Functions/variables: camelCase
- Constants: SCREAMING_SNAKE_CASE

## Testing

Write tests for all new functionality. Mock external dependencies (simctl, idb, flutter CLI).

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do expected behavior', () => {
      // ...
    });
  });
});
```

Run specific tests: `npm test -- path/to/file.test.ts`

## Project Structure

```
src/
  index.ts           # Entry point
  server.ts          # MCP server setup
  session/           # Session management
  flutter/           # Flutter process control
  simulator/         # simctl and IDB wrappers
  tools/             # MCP tool definitions
  utils/             # Helpers (exec, logger)
```

## Key Patterns

**Session-based isolation:** Each agent session gets its own simulator UDID and flutter process. Sessions map worktree path → simulator → process.

**Log streaming:** flutter_run returns immediately. Logs are buffered in memory and retrieved via flutter_logs polling with cursor-based pagination (fromIndex). MCP tools cannot stream responses natively.

**Error handling:** Use custom error classes, include context, never swallow errors.

## Implementation Phases

1. Foundation - Express, MCP, session manager, simctl
2. Flutter Process - spawn, logs, hot reload
3. Build & Test - flutter build/test with streaming
4. Simulator UI - IDB wrapper, tap/type/swipe/screenshot
5. Polish - error handling, docs

## When Adding Tools

1. Define schema with Zod in `src/tools/`
2. Implement handler function
3. Register in `src/tools/index.ts`
4. Write tests with mocked dependencies
5. Update tool reference in README
