import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { SessionInfo } from '../session/types.js';

const mockCreateSession = jest.fn<() => SessionInfo>();
const mockEndSession = jest.fn<() => Promise<void>>();
const mockListSessions = jest.fn<() => SessionInfo[]>();

jest.unstable_mockModule('../session/manager.js', () => ({
  sessionManager: {
    createSession: mockCreateSession,
    endSession: mockEndSession,
    listSessions: mockListSessions,
  },
}));

const { handleSessionStart, handleSessionEnd, handleSessionList } = await import('./session.js');

describe('Session Tools', () => {
  beforeEach(() => {
    mockCreateSession.mockClear();
    mockEndSession.mockClear();
    mockListSessions.mockClear();
  });

  describe('handleSessionStart', () => {
    it('should create session with default device type', () => {
      mockCreateSession.mockReturnValue({
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        // No simulatorUdid - lazy initialization
        deviceType: 'iPhone 16 Pro',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      const result = handleSessionStart({
        worktreePath: '/path/to/worktree',
      });

      expect(mockCreateSession).toHaveBeenCalledWith({
        worktreePath: '/path/to/worktree',
        deviceType: undefined,
      });

      expect(result).toEqual({
        sessionId: 'session-123',
        worktreePath: '/path/to/worktree',
        deviceType: 'iPhone 16 Pro',
      });
    });

    it('should create session with custom device type', () => {
      mockCreateSession.mockReturnValue({
        id: 'session-123',
        worktreePath: '/path/to/worktree',
        // No simulatorUdid - lazy initialization
        deviceType: 'iPhone 15',
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      const result = handleSessionStart({
        worktreePath: '/path/to/worktree',
        deviceType: 'iPhone 15',
      });

      expect(mockCreateSession).toHaveBeenCalledWith({
        worktreePath: '/path/to/worktree',
        deviceType: 'iPhone 15',
      });

      expect(result.deviceType).toBe('iPhone 15');
    });
  });

  describe('handleSessionEnd', () => {
    it('should end session', async () => {
      mockEndSession.mockResolvedValue(undefined);

      const result = await handleSessionEnd({ sessionId: 'session-123' });

      expect(mockEndSession).toHaveBeenCalledWith('session-123');
      expect(result).toEqual({
        success: true,
        message: 'Session session-123 ended successfully',
      });
    });
  });

  describe('handleSessionList', () => {
    it('should list all sessions', async () => {
      mockListSessions.mockReturnValue([
        {
          id: 'session-1',
          worktreePath: '/path/1',
          simulatorUdid: 'UDID-1',
          deviceType: 'iPhone 16 Pro',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'session-2',
          worktreePath: '/path/2',
          simulatorUdid: 'UDID-2',
          deviceType: 'iPhone 15',
          createdAt: '2025-01-02T00:00:00.000Z',
        },
      ]);

      const result = await handleSessionList();

      expect(mockListSessions).toHaveBeenCalled();
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].id).toBe('session-1');
      expect(result.sessions[1].id).toBe('session-2');
    });

    it('should return empty array when no sessions', async () => {
      mockListSessions.mockReturnValue([]);

      const result = await handleSessionList();

      expect(result.sessions).toEqual([]);
    });
  });
});
