import type { Server } from 'http';

import { createApp } from './app';
import { env } from './env';
import { logger } from './logger';
import { prisma } from './prisma';

const app = createApp();

let server: Server;

export function startServer(): Server {
  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server running');
  });
  return server;
}

export function getServer(): Server | undefined {
  return server;
}

export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Shutting down gracefully');

  const timer = setTimeout(() => {
    logger.warn({ timeoutSeconds: 10 }, 'Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);

  await new Promise<void>((resolve) => {
    server?.close(async () => {
      clearTimeout(timer);
      await prisma.$disconnect();
      logger.info('Server closed');
      resolve();
    });
  });
};

export function registerListeners(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught Exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection');
    process.exit(1);
  });
}

startServer();
registerListeners();
