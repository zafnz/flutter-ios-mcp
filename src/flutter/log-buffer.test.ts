import { describe, it, expect, beforeEach } from '@jest/globals';
import { LogBuffer } from './log-buffer.js';

describe('LogBuffer', () => {
  let buffer: LogBuffer;

  beforeEach(() => {
    buffer = new LogBuffer(5);
  });

  describe('append', () => {
    it('should append log lines', () => {
      buffer.append('line 1');
      buffer.append('line 2');

      const logs = buffer.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].line).toBe('line 1');
      expect(logs[1].line).toBe('line 2');
    });

    it('should assign sequential indices', () => {
      buffer.append('line 1');
      buffer.append('line 2');
      buffer.append('line 3');

      const logs = buffer.getLogs();
      expect(logs[0].index).toBe(0);
      expect(logs[1].index).toBe(1);
      expect(logs[2].index).toBe(2);
    });

    it('should add timestamps', () => {
      const before = new Date();
      buffer.append('line 1');
      const after = new Date();

      const logs = buffer.getLogs();
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('circular buffer behavior', () => {
    it('should enforce max lines limit', () => {
      for (let i = 0; i < 10; i++) {
        buffer.append(`line ${i}`);
      }

      expect(buffer.getTotalLines()).toBe(5);
    });

    it('should keep most recent lines when full', () => {
      for (let i = 0; i < 10; i++) {
        buffer.append(`line ${i}`);
      }

      const logs = buffer.getLogs();
      expect(logs[0].line).toBe('line 5');
      expect(logs[4].line).toBe('line 9');
    });

    it('should maintain sequential indices after overflow', () => {
      for (let i = 0; i < 10; i++) {
        buffer.append(`line ${i}`);
      }

      const logs = buffer.getLogs();
      expect(logs[0].index).toBe(5);
      expect(logs[4].index).toBe(9);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        buffer.append(`line ${i}`);
      }
    });

    it('should return all logs by default', () => {
      const logs = buffer.getLogs();
      expect(logs).toHaveLength(5);
    });

    it('should filter by fromIndex', () => {
      const logs = buffer.getLogs(2);
      expect(logs).toHaveLength(3);
      expect(logs[0].index).toBe(2);
    });

    it('should respect limit', () => {
      const logs = buffer.getLogs(0, 2);
      expect(logs).toHaveLength(2);
    });

    it('should return empty array if fromIndex beyond current', () => {
      const logs = buffer.getLogs(100);
      expect(logs).toHaveLength(0);
    });
  });

  describe('getNextIndex', () => {
    it('should return next index to be assigned', () => {
      expect(buffer.getNextIndex()).toBe(0);
      buffer.append('line 1');
      expect(buffer.getNextIndex()).toBe(1);
      buffer.append('line 2');
      expect(buffer.getNextIndex()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      buffer.append('line 1');
      buffer.append('line 2');

      buffer.clear();

      expect(buffer.getTotalLines()).toBe(0);
      expect(buffer.getNextIndex()).toBe(0);
    });
  });

  describe('getRecentLines', () => {
    it('should return most recent N lines', () => {
      for (let i = 0; i < 5; i++) {
        buffer.append(`line ${i}`);
      }

      const recent = buffer.getRecentLines(2);
      expect(recent).toEqual(['line 3', 'line 4']);
    });

    it('should return all lines if count exceeds total', () => {
      buffer.append('line 1');
      buffer.append('line 2');

      const recent = buffer.getRecentLines(10);
      expect(recent).toEqual(['line 1', 'line 2']);
    });
  });
});
