import pino from 'pino';

const logLevel = process.env.LOG_LEVEL ?? 'info';

const baseLogger = pino({
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

export const logger = baseLogger.child({ module: 'app' });

export function createChildLogger(module: string): pino.Logger {
  return baseLogger.child({ module });
}
