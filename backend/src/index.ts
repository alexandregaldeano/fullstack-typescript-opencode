import type { Server } from 'http';

import { createApp } from './app';
import { env } from './env';
import { prisma } from './prisma';

const app = createApp();

let server: Server;

export function startServer(): Server {
  server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
  return server;
}

export function getServer(): Server | undefined {
  return server;
}

export const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  await new Promise<void>((resolve) => {
    server?.close(async () => {
      await prisma.$disconnect();
      console.log('Server closed. Exiting process.');
      process.exit(0);
      resolve();
    });
  });

  setTimeout(() => {
    console.error('Forced shutdown after 10 seconds.');
    process.exit(1);
  }, 10000);
};

export function registerListeners(): void {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
}

startServer();
registerListeners();
