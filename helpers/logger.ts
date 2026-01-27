/**
 * Structured Logger
 * Provides consistent JSON logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return entry;
}

export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (message: string, context?: LogContext) => {
    if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, context);
      // eslint-disable-next-line no-console
      console.log(formatEntry(entry));
    }
  },

  /**
   * Info level logging - general information
   */
  info: (message: string, context?: LogContext) => {
    const entry = createLogEntry('info', message, context);
    // eslint-disable-next-line no-console
    console.log(formatEntry(entry));
  },

  /**
   * Warning level logging - potential issues
   */
  warn: (message: string, context?: LogContext) => {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatEntry(entry));
  },

  /**
   * Error level logging - errors and exceptions
   */
  error: (message: string, error?: Error, context?: LogContext) => {
    const entry = createLogEntry('error', message, context, error);
    console.error(formatEntry(entry));
  },

  /**
   * Create a child logger with preset context
   */
  child: (defaultContext: LogContext) => ({
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(message, error, { ...defaultContext, ...context }),
  }),

  /**
   * Log request start
   */
  requestStart: (method: string, path: string, requestId: string) => {
    logger.info(`${method} ${path}`, { requestId, method, endpoint: path });
  },

  /**
   * Log request end
   */
  requestEnd: (
    method: string,
    path: string,
    requestId: string,
    statusCode: number,
    durationMs: number
  ) => {
    const context = {
      requestId,
      method,
      endpoint: path,
      statusCode,
      duration: durationMs,
    };
    const message = `${method} ${path} ${statusCode} ${durationMs}ms`;
    if (statusCode >= 500) {
      logger.error(message, undefined, context);
    } else if (statusCode >= 400) {
      logger.warn(message, context);
    } else {
      logger.info(message, context);
    }
  },

  /**
   * Log database query
   */
  query: (query: string, durationMs: number, context?: LogContext) => {
    logger.debug(`DB Query: ${query.substring(0, 100)}...`, {
      ...context,
      duration: durationMs,
    });
  },

  /**
   * Log authentication event
   */
  auth: (event: 'login' | 'logout' | 'register' | 'session_check', userId?: string, success: boolean = true) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Auth: ${event}`, { userId, event });
  },
};

export default logger;
