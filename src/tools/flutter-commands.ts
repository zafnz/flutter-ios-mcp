import { z } from 'zod';
import { sessionManager } from '../session/manager.js';
import { FlutterProcessManager } from '../flutter/process.js';
import { logger } from '../utils/logger.js';

export const flutterRunSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  target: z.string().optional().describe('Target file (e.g., lib/main.dart)'),
  flavor: z.string().optional().describe('Build flavor'),
  additionalArgs: z.array(z.string()).optional().describe('Additional Flutter arguments'),
});

export const flutterCommandSchema = z.object({
  sessionId: z.string().describe('Session ID'),
});

export const flutterLogsSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  fromIndex: z.number().optional().describe('Start index for log retrieval'),
  limit: z.number().optional().describe('Maximum number of lines to return (default: 100)'),
});

export async function handleFlutterRun(
  args: z.infer<typeof flutterRunSchema>
): Promise<{
  success: boolean;
  pid: number;
  message: string;
}> {
  logger.info('Tool: flutter_run', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  if (session.flutterProcessManager) {
    const status = session.flutterProcessManager.getStatus();
    if (status && (status.status === 'running' || status.status === 'starting')) {
      throw new Error('Flutter process already running for this session');
    }
  }

  const processManager = new FlutterProcessManager();
  session.flutterProcessManager = processManager;

  const flutterProcess = await processManager.start({
    worktreePath: session.worktreePath,
    deviceId: session.simulatorUdid,
    target: args.target,
    flavor: args.flavor,
    additionalArgs: args.additionalArgs,
  });

  return {
    success: true,
    pid: flutterProcess.pid,
    message: `Flutter process started (PID: ${String(flutterProcess.pid)})`,
  };
}

export function handleFlutterStop(
  args: z.infer<typeof flutterCommandSchema>
): {
  success: boolean;
  message: string;
} {
  logger.info('Tool: flutter_stop', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  if (!session.flutterProcessManager) {
    throw new Error('No Flutter process running for this session');
  }

  const stopped = session.flutterProcessManager.stop();

  return {
    success: stopped,
    message: stopped ? 'Flutter process stop signal sent' : 'No Flutter process to stop',
  };
}

export function handleFlutterHotReload(
  args: z.infer<typeof flutterCommandSchema>
): {
  success: boolean;
  message: string;
} {
  logger.info('Tool: flutter_hot_reload', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  if (!session.flutterProcessManager) {
    throw new Error('No Flutter process running for this session');
  }

  const reloaded = session.flutterProcessManager.hotReload();

  return {
    success: reloaded,
    message: reloaded ? 'Hot reload triggered' : 'Failed to trigger hot reload',
  };
}

export function handleFlutterHotRestart(
  args: z.infer<typeof flutterCommandSchema>
): {
  success: boolean;
  message: string;
} {
  logger.info('Tool: flutter_hot_restart', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  if (!session.flutterProcessManager) {
    throw new Error('No Flutter process running for this session');
  }

  const restarted = session.flutterProcessManager.hotRestart();

  return {
    success: restarted,
    message: restarted ? 'Hot restart triggered' : 'Failed to trigger hot restart',
  };
}

export function handleFlutterLogs(
  args: z.infer<typeof flutterLogsSchema>
): {
  logs: Array<{ line: string; timestamp: string; index: number }>;
  nextIndex: number;
  totalLines: number;
} {
  logger.info('Tool: flutter_logs', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  if (!session.flutterProcessManager) {
    return {
      logs: [],
      nextIndex: 0,
      totalLines: 0,
    };
  }

  const result = session.flutterProcessManager.getLogs(args.fromIndex, args.limit);

  return {
    logs: result.logs.map((log) => ({
      line: log.line,
      timestamp: log.timestamp.toISOString(),
      index: log.index,
    })),
    nextIndex: result.nextIndex,
    totalLines: result.totalLines,
  };
}
