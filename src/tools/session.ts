import { z } from 'zod';
import { sessionManager } from '../session/manager.js';
import { logger } from '../utils/logger.js';

export const sessionStartSchema = z.object({
  worktreePath: z.string().describe('Absolute path to Flutter project directory'),
  deviceType: z
    .string()
    .optional()
    .describe('iOS device type (e.g., "iPhone 16 Pro"). Defaults to "iPhone 16 Pro"'),
});

export const sessionEndSchema = z.object({
  sessionId: z.string().describe('Session ID to end'),
});

export const startSimulatorSchema = z.object({
  sessionId: z.string().describe('Session ID'),
});

export function handleSessionStart(
  args: z.infer<typeof sessionStartSchema>
): {
  sessionId: string;
  deviceType: string;
  worktreePath: string;
} {
  logger.info('Tool: session_start', args);

  const session = sessionManager.createSession({
    worktreePath: args.worktreePath,
    deviceType: args.deviceType,
  });

  return {
    sessionId: session.id,
    deviceType: session.deviceType,
    worktreePath: session.worktreePath,
  };
}

export async function handleSessionEnd(
  args: z.infer<typeof sessionEndSchema>
): Promise<{ success: boolean; message: string }> {
  logger.info('Tool: session_end', args);

  await sessionManager.endSession(args.sessionId);

  return {
    success: true,
    message: `Session ${args.sessionId} ended successfully`,
  };
}

export async function handleStartSimulator(
  args: z.infer<typeof startSimulatorSchema>
): Promise<{ simulatorUdid: string; deviceType: string; message: string }> {
  logger.info('Tool: start_simulator', args);

  const result = await sessionManager.startSimulator(args.sessionId);

  return {
    simulatorUdid: result.simulatorUdid,
    deviceType: result.deviceType,
    message: `Simulator ${result.simulatorUdid} started for ${result.deviceType}`,
  };
}

export function handleSessionList(): {
  sessions: Array<{
    id: string;
    worktreePath: string;
    simulatorUdid?: string;
    deviceType: string;
    createdAt: string;
  }>;
} {
  logger.info('Tool: session_list');

  const sessions = sessionManager.listSessions();

  return { sessions };
}
