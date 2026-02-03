/**
 * Tests for logger helper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('logs message with timestamp', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedJson = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
      
      expect(loggedJson.level).toBe('info');
      expect(loggedJson.message).toBe('Test message');
      expect(loggedJson.timestamp).toBeDefined();
    });

    it('includes context when provided', () => {
      logger.info('Test message', { userId: 'user-123', requestId: 'req-456' });

      const loggedJson = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
      
      expect(loggedJson.context.userId).toBe('user-123');
      expect(loggedJson.context.requestId).toBe('req-456');
    });
  });

  describe('warn', () => {
    it('logs to console.warn', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const loggedJson = JSON.parse(String(consoleWarnSpy.mock.calls[0][0]));
      
      expect(loggedJson.level).toBe('warn');
      expect(loggedJson.message).toBe('Warning message');
    });
  });

  describe('error', () => {
    it('logs error with stack trace', () => {
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const loggedJson = JSON.parse(String(consoleErrorSpy.mock.calls[0][0]));
      
      expect(loggedJson.level).toBe('error');
      expect(loggedJson.message).toBe('Error occurred');
      expect(loggedJson.error.message).toBe('Test error');
      expect(loggedJson.error.stack).toBeDefined();
    });

    it('handles missing error object', () => {
      logger.error('Error occurred');

      const loggedJson = JSON.parse(String(consoleErrorSpy.mock.calls[0][0]));
      
      expect(loggedJson.level).toBe('error');
      expect(loggedJson.error).toBeUndefined();
    });
  });

  describe('child', () => {
    it('creates logger with preset context', () => {
      const childLogger = logger.child({ workspaceId: 'ws-123' });
      childLogger.info('Child message');

      const loggedJson = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
      
      expect(loggedJson.context.workspaceId).toBe('ws-123');
    });

    it('merges contexts', () => {
      const childLogger = logger.child({ workspaceId: 'ws-123' });
      childLogger.info('Child message', { userId: 'user-456' });

      const loggedJson = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
      
      expect(loggedJson.context.workspaceId).toBe('ws-123');
      expect(loggedJson.context.userId).toBe('user-456');
    });
  });

  describe('requestStart/requestEnd', () => {
    it('logs request lifecycle', () => {
      logger.requestStart('GET', '/api/users', 'req-123');
      logger.requestEnd('GET', '/api/users', 'req-123', 200, 45);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      
      const startLog = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));
      expect(startLog.context.requestId).toBe('req-123');
      expect(startLog.context.method).toBe('GET');
      
      const endLog = JSON.parse(String(consoleLogSpy.mock.calls[1][0]));
      expect(endLog.context.statusCode).toBe(200);
      expect(endLog.context.duration).toBe(45);
    });
  });
});
