import { z } from 'zod';
import { sessionManager } from '../session/manager.js';
import { FlutterProcessManager } from '../flutter/process.js';
import { logger } from '../utils/logger.js';
import { exec, execFile } from '../utils/exec.js';

/**
 * Execute a build script (pre or post) in the project directory.
 * Scripts are executed using exec to allow shell features like pipes, &&, etc.
 *
 * @param script - Shell command to execute
 * @param cwd - Working directory for the script
 * @param scriptType - Type of script for logging (pre-build or post-build)
 */
async function executeScript(
  script: string,
  cwd: string,
  scriptType: 'pre-build' | 'post-build'
): Promise<void> {
  logger.info(`Executing ${scriptType} script`, { script, cwd });

  try {
    const result = await exec(script, { cwd, timeout: 120000 }); // 2 minute timeout

    if (result.exitCode !== 0) {
      logger.warn(`${scriptType} script exited with non-zero code`, {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      });
      // Don't throw - allow build to continue even if script fails
    } else {
      logger.info(`${scriptType} script completed successfully`, {
        stdout: result.stdout,
      });
    }
  } catch (error) {
    logger.error(`${scriptType} script failed`, { error: String(error) });
    // Don't throw - allow build to continue even if script fails
  }
}

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

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  if (session.flutterProcessManager) {
    const status = session.flutterProcessManager.getStatus();
    if (status && (status.status === 'running' || status.status === 'starting')) {
      throw new Error('Flutter process already running for this session');
    }
  }

  // Execute pre-build script if configured
  const preBuildScript = sessionManager.getPreBuildScript();
  if (preBuildScript) {
    await executeScript(preBuildScript, session.worktreePath, 'pre-build');
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

  // Execute post-build script if configured (don't await - run in background)
  const postBuildScript = sessionManager.getPostBuildScript();
  if (postBuildScript) {
    executeScript(postBuildScript, session.worktreePath, 'post-build').catch((error: unknown) => {
      logger.error('Post-build script error (non-blocking)', { error: String(error) });
    });
  }

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

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

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

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

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

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

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

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

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

export const flutterBuildSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  flavor: z.string().optional().describe('Build flavor'),
  additionalArgs: z.array(z.string()).optional().describe('Additional Flutter build arguments'),
});

export const flutterTestSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  path: z.string().optional().describe('Test file or directory path (e.g., test/widget_test.dart)'),
  additionalArgs: z.array(z.string()).optional().describe('Additional Flutter test arguments'),
});

export const flutterCleanSchema = z.object({
  sessionId: z.string().describe('Session ID'),
});

/**
 * Build the Flutter app for iOS without running it.
 * This is a one-shot command that runs to completion.
 */
export async function handleFlutterBuild(
  args: z.infer<typeof flutterBuildSchema>
): Promise<{
  success: boolean;
  output: string;
  exitCode: number;
  message: string;
}> {
  logger.info('Tool: flutter_build', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  // Execute pre-build script if configured
  const preBuildScript = sessionManager.getPreBuildScript();
  if (preBuildScript) {
    await executeScript(preBuildScript, session.worktreePath, 'pre-build');
  }

  const buildArgs = ['build', 'ios'];

  if (args.flavor) {
    buildArgs.push('--flavor', args.flavor);
  }

  if (args.additionalArgs) {
    buildArgs.push(...args.additionalArgs);
  }

  logger.info('Running flutter build', { args: buildArgs, cwd: session.worktreePath });

  const result = await execFile('flutter', buildArgs, {
    cwd: session.worktreePath,
    timeout: 600000, // 10 minutes for builds
  });

  const success = result.exitCode === 0;
  const output = result.stdout + (result.stderr ? `\n\nErrors:\n${result.stderr}` : '');

  // Execute post-build script if configured
  const postBuildScript = sessionManager.getPostBuildScript();
  if (postBuildScript) {
    await executeScript(postBuildScript, session.worktreePath, 'post-build');
  }

  return {
    success,
    output,
    exitCode: result.exitCode,
    message: success
      ? 'Build completed successfully'
      : `Build failed with exit code ${String(result.exitCode)}`,
  };
}

/**
 * Run Flutter tests.
 * This is a one-shot command that runs to completion.
 */
export async function handleFlutterTest(
  args: z.infer<typeof flutterTestSchema>
): Promise<{
  success: boolean;
  output: string;
  exitCode: number;
  message: string;
}> {
  logger.info('Tool: flutter_test', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  const testArgs = ['test'];

  if (args.path) {
    testArgs.push(args.path);
  }

  if (args.additionalArgs) {
    testArgs.push(...args.additionalArgs);
  }

  logger.info('Running flutter test', { args: testArgs, cwd: session.worktreePath });

  const result = await execFile('flutter', testArgs, {
    cwd: session.worktreePath,
    timeout: 600000, // 10 minutes for tests
  });

  const success = result.exitCode === 0;
  const output = result.stdout + (result.stderr ? `\n\nErrors:\n${result.stderr}` : '');

  return {
    success,
    output,
    exitCode: result.exitCode,
    message: success
      ? 'Tests completed successfully'
      : `Tests failed with exit code ${String(result.exitCode)}`,
  };
}

/**
 * Clean the Flutter project build cache.
 * This is a one-shot command that runs to completion.
 * Removes build artifacts and cached files.
 */
export async function handleFlutterClean(
  args: z.infer<typeof flutterCleanSchema>
): Promise<{
  success: boolean;
  output: string;
  exitCode: number;
  message: string;
}> {
  logger.info('Tool: flutter_clean', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  logger.info('Running flutter clean', { cwd: session.worktreePath });

  const result = await execFile('flutter', ['clean'], {
    cwd: session.worktreePath,
    timeout: 120000, // 2 minutes for clean
  });

  const success = result.exitCode === 0;
  const output = result.stdout + (result.stderr ? `\n\nErrors:\n${result.stderr}` : '');

  return {
    success,
    output,
    exitCode: result.exitCode,
    message: success
      ? 'Clean completed successfully'
      : `Clean failed with exit code ${String(result.exitCode)}`,
  };
}
