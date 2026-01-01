import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { logger } from './logger.js';

describe('Logger', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.setLevel('debug');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      logger.debug('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('DEBUG: test message');
    });

    it('should include context when provided', () => {
      logger.debug('test message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('{"key":"value"}');
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO: test message');
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('test message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN: test message');
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('test message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR: test message');
    });
  });

  describe('setLevel', () => {
    it('should filter messages below the set level', () => {
      logger.setLevel('warn');
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
