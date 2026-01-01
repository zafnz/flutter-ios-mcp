import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Session } from '../session/types.js';
import type { SpawnedProcess } from '../utils/exec.js';

const mockGetSession = jest.fn<() => Session | undefined>();
const mockSpawnStreaming = jest.fn<() => SpawnedProcess>();

jest.unstable_mockModule('../session/manager.js', () => ({
  sessionManager: {
    getSession: mockGetSession,
  },
}));

jest.unstable_mockModule('../utils/exec.js', () => ({
  spawnStreaming: mockSpawnStreaming,
}));

const {
  handleFlutterRun,
  handleFlutterStop,
  handleFlutterHotReload,
  handleFlutterHotRestart,
  handleFlutterLogs,
} = await import('./flutter-commands.js');

describe('Flutter Command Tools', () => {
  beforeEach(() => {
    mockGetSession.mockClear();
    mockSpawnStreaming.mockClear();

    mockSpawnStreaming.mockReturnValue({
      pid: 12345,
      stdin: {
        write: jest.fn(),
        end: jest.fn(),
      } as unknown as NodeJS.WritableStream,
      kill: jest.fn(() => true),
      wait: jest.fn(() => Promise.resolve(0)),
    });
  });

  describe('handleFlutterRun', () => {
    it('should start Flutter process', async () => {
      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      mockGetSession.mockReturnValue(session);

      const result = await handleFlutterRun({
        sessionId: 'session-123',
      });

      expect(result.success).toBe(true);
      expect(result.pid).toBeGreaterThan(0);
      expect(result.message).toContain('Flutter process started');
    });

    it('should throw if session not found', async () => {
      mockGetSession.mockReturnValue(undefined);

      await expect(
        handleFlutterRun({ sessionId: 'nonexistent' })
      ).rejects.toThrow('Session not found');
    });

    it('should throw if Flutter already running', async () => {
      const { FlutterProcessManager } = await import('../flutter/process.js');
      const processManager = new FlutterProcessManager();

      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      mockGetSession.mockReturnValue(session);

      await handleFlutterRun({ sessionId: 'session-123' });

      session.flutterProcessManager = session.flutterProcessManager;

      await expect(
        handleFlutterRun({ sessionId: 'session-123' })
      ).rejects.toThrow('Flutter process already running');
    });
  });

  describe('handleFlutterStop', () => {
    it('should stop Flutter process', async () => {
      const { FlutterProcessManager } = await import('../flutter/process.js');
      const processManager = new FlutterProcessManager();

      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
        flutterProcessManager: processManager,
      };

      mockGetSession.mockReturnValue(session);

      await processManager.start({
        worktreePath: session.worktreePath,
        deviceId: session.simulatorUdid,
      });

      const result = handleFlutterStop({ sessionId: 'session-123' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('stop signal sent');
    });

    it('should throw if no Flutter process running', async () => {
      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      mockGetSession.mockReturnValue(session);

      expect(() =>
        handleFlutterStop({ sessionId: 'session-123' })
      ).toThrow('No Flutter process running');
    });
  });

  describe('handleFlutterHotReload', () => {
    it('should trigger hot reload', async () => {
      const { FlutterProcessManager } = await import('../flutter/process.js');
      const processManager = new FlutterProcessManager();

      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
        flutterProcessManager: processManager,
      };

      mockGetSession.mockReturnValue(session);

      await processManager.start({
        worktreePath: session.worktreePath,
        deviceId: session.simulatorUdid,
      });

      const result = handleFlutterHotReload({ sessionId: 'session-123' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hot reload triggered');
    });
  });

  describe('handleFlutterHotRestart', () => {
    it('should trigger hot restart', async () => {
      const { FlutterProcessManager } = await import('../flutter/process.js');
      const processManager = new FlutterProcessManager();

      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
        flutterProcessManager: processManager,
      };

      mockGetSession.mockReturnValue(session);

      await processManager.start({
        worktreePath: session.worktreePath,
        deviceId: session.simulatorUdid,
      });

      const result = handleFlutterHotRestart({ sessionId: 'session-123' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hot restart triggered');
    });
  });

  describe('handleFlutterLogs', () => {
    it('should return logs from Flutter process', async () => {
      const { FlutterProcessManager } = await import('../flutter/process.js');
      const processManager = new FlutterProcessManager();

      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
        flutterProcessManager: processManager,
      };

      mockGetSession.mockReturnValue(session);

      const result = handleFlutterLogs({ sessionId: 'session-123' });

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('nextIndex');
      expect(result).toHaveProperty('totalLines');
      expect(Array.isArray(result.logs)).toBe(true);
    });

    it('should return empty logs if no Flutter process', async () => {
      const session: Session = {
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      mockGetSession.mockReturnValue(session);

      const result = handleFlutterLogs({ sessionId: 'session-123' });

      expect(result.logs).toEqual([]);
      expect(result.nextIndex).toBe(0);
      expect(result.totalLines).toBe(0);
    });
  });
});
