import { describe, it, expect, beforeEach } from '@jest/globals';
import { sessionState } from './state.js';
import { Session } from './types.js';

describe('SessionState', () => {
  beforeEach(() => {
    sessionState.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve session', () => {
      const session: Session = {
        id: 'test-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      sessionState.set('test-123', session);
      const retrieved = sessionState.get('test-123');

      expect(retrieved).toEqual(session);
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = sessionState.get('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing session', () => {
      const session: Session = {
        id: 'test-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      sessionState.set('test-123', session);
      expect(sessionState.has('test-123')).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(sessionState.has('non-existent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove session', () => {
      const session: Session = {
        id: 'test-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      sessionState.set('test-123', session);
      expect(sessionState.has('test-123')).toBe(true);

      sessionState.delete('test-123');
      expect(sessionState.has('test-123')).toBe(false);
    });
  });

  describe('list', () => {
    it('should return all sessions', () => {
      const session1: Session = {
        id: 'test-1',
        worktreePath: '/path/1',
        simulatorUdid: 'UDID-1',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date('2025-01-01'),
      };

      const session2: Session = {
        id: 'test-2',
        worktreePath: '/path/2',
        simulatorUdid: 'UDID-2',
        deviceType: 'iPhone 15',
        createdAt: new Date('2025-01-02'),
      };

      sessionState.set('test-1', session1);
      sessionState.set('test-2', session2);

      const list = sessionState.list();
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('test-1');
      expect(list[1].id).toBe('test-2');
    });

    it('should return empty array when no sessions', () => {
      const list = sessionState.list();
      expect(list).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of sessions', () => {
      expect(sessionState.size()).toBe(0);

      const session: Session = {
        id: 'test-123',
        worktreePath: '/path/to/worktree',
        simulatorUdid: 'UDID-123',
        deviceType: 'iPhone 16 Pro',
        createdAt: new Date(),
      };

      sessionState.set('test-123', session);
      expect(sessionState.size()).toBe(1);
    });
  });
});
