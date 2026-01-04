import { z } from 'zod';
import { sessionManager } from '../session/manager.js';
import * as idb from '../simulator/idb.js';
import { logger } from '../utils/logger.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const uiTapSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate'),
  duration: z.number().optional().describe('Duration in seconds for long press'),
});

export const uiTypeSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  text: z.string().describe('Text to type'),
});

export const uiSwipeSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  x_start: z.number().describe('Start X coordinate'),
  y_start: z.number().describe('Start Y coordinate'),
  x_end: z.number().describe('End X coordinate'),
  y_end: z.number().describe('End Y coordinate'),
  duration: z.number().optional().describe('Swipe duration in seconds'),
});

export const uiDescribeAllSchema = z.object({
  sessionId: z.string().describe('Session ID'),
});

export const uiDescribePointSchema = z.object({
  sessionId: z.string().describe('Session ID'),
  x: z.number().describe('X coordinate'),
  y: z.number().describe('Y coordinate'),
});

export const screenshotSchema = z.object({
  sessionId: z.string().describe('Session ID'),
});

// Get screenshots directory and ensure it exists
function getScreenshotsDir(): string {
  const screenshotsDir = join(tmpdir(), 'mcp-screenshots');
  try {
    mkdirSync(screenshotsDir, { recursive: true });
  } catch {
    // Directory might already exist, that's fine
  }
  return screenshotsDir;
}

export async function handleUiTap(
  args: z.infer<typeof uiTapSchema>
): Promise<{ success: boolean; message: string }> {
  logger.info('Tool: ui_tap', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  await idb.tap(session.simulatorUdid, {
    x: args.x,
    y: args.y,
    duration: args.duration,
  });

  return {
    success: true,
    message: `Tapped at (${String(args.x)}, ${String(args.y)})${args.duration ? ` for ${String(args.duration)}s` : ''}`,
  };
}

export async function handleUiType(
  args: z.infer<typeof uiTypeSchema>
): Promise<{ success: boolean; message: string }> {
  logger.info('Tool: ui_type', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  await idb.typeText(session.simulatorUdid, args.text);

  return {
    success: true,
    message: `Typed ${String(args.text.length)} characters`,
  };
}

export async function handleUiSwipe(
  args: z.infer<typeof uiSwipeSchema>
): Promise<{ success: boolean; message: string }> {
  logger.info('Tool: ui_swipe', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  await idb.swipe(session.simulatorUdid, {
    x_start: args.x_start,
    y_start: args.y_start,
    x_end: args.x_end,
    y_end: args.y_end,
    duration: args.duration,
  });

  return {
    success: true,
    message: `Swiped from (${String(args.x_start)}, ${String(args.y_start)}) to (${String(args.x_end)}, ${String(args.y_end)})`,
  };
}

export async function handleUiDescribeAll(
  args: z.infer<typeof uiDescribeAllSchema>
): Promise<{ accessibility_tree: string }> {
  logger.info('Tool: ui_describe_all', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  const tree = await idb.describeAll(session.simulatorUdid);

  return {
    accessibility_tree: tree,
  };
}

export async function handleUiDescribePoint(
  args: z.infer<typeof uiDescribePointSchema>
): Promise<{ accessibility_info: string }> {
  logger.info('Tool: ui_describe_point', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  const info = await idb.describePoint(session.simulatorUdid, args.x, args.y);

  return {
    accessibility_info: info,
  };
}

export async function handleScreenshot(
  args: z.infer<typeof screenshotSchema>
): Promise<{
  success: boolean;
  imageData: string;
  format: string;
  filename: string;
  message: string;
}> {
  logger.info('Tool: screenshot', args);

  const session = sessionManager.getSession(args.sessionId);
  if (!session) {
    throw new Error(`Session not found: ${args.sessionId}`);
  }

  // Update session activity
  sessionManager.updateSessionActivity(args.sessionId);

  const result = await idb.screenshot(session.simulatorUdid);

  // Save screenshot to disk
  const screenshotsDir = getScreenshotsDir();
  const timestamp = Date.now();
  const filename = `${args.sessionId}-${String(timestamp)}.png`;
  const filepath = join(screenshotsDir, filename);

  // Convert base64 to buffer and write to file
  const imageBuffer = Buffer.from(result.imageData, 'base64');
  writeFileSync(filepath, imageBuffer);

  logger.info('Screenshot saved', { filepath, size: imageBuffer.length });

  return {
    success: true,
    imageData: result.imageData,
    format: result.format,
    filename,
    message: `Screenshot captured (${String(result.imageData.length)} bytes base64)`,
  };
}
