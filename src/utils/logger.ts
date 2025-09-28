/* eslint-disable no-console */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = (level: LogLevel): boolean => {
  if (process.env.NODE_ENV === 'production') {
    return level === 'error' || level === 'warn';
  }

  return true;
};

const formatMessage = (level: LogLevel, messages: unknown[]): unknown[] => {
  const prefix = `[Baan Admin Console] [${level.toUpperCase()}]`;
  return [prefix, ...messages];
};

export const logger = {
  debug: (...messages: unknown[]) => {
    if (shouldLog('debug')) {
      console.debug(...formatMessage('debug', messages));
    }
  },
  info: (...messages: unknown[]) => {
    if (shouldLog('info')) {
      console.info(...formatMessage('info', messages));
    }
  },
  warn: (...messages: unknown[]) => {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', messages));
    }
  },
  error: (...messages: unknown[]) => {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', messages));
    }
  },
};

export type Logger = typeof logger;
