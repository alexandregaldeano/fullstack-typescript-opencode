import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import type { Application } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import type { HealthErrorResponse, HealthResponse, SimpleHealthResponse } from '@shared/interfaces';

import { env } from './env';
import { errorHandler } from './error-handler';
import { createChildLogger } from './logger';
import { prisma } from './prisma';

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerDefinition = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Fullstack TypeScript API',
      version: '1.0.0',
      description: 'API documentation for the Fullstack TypeScript Opencode backend.',
    },
    servers: [
      { url: '/', description: 'Local development server' },
    ],
  },
  apis: [join(__dirname, '**/*.ts')],
};

const swaggerDocument = swaggerJsDoc({ ...swaggerDefinition });

const httpLogger = createChildLogger('http');

export function createApp(): Application {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  app.use(pinoHttp({ logger: httpLogger }));

  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
  }));

  /**
   * @swagger
   * tags:
   *   name: Health
   *   description: Health check endpoints
   */

  /**
   * @swagger
   * /health:
   *   get:
   *     tags: [Health]
   *     summary: Basic health check
   *     description: Returns a simple OK status to verify the server is running.
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [ok]
   *             example:
   *               status: ok
   */
  app.get<unknown, SimpleHealthResponse>('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  /**
   * @swagger
   * /api/health:
   *   get:
   *     tags: [Health]
   *     summary: Database health check
   *     description: Checks server and database connectivity.
   *     responses:
   *       200:
   *         description: Server and database are healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [ok]
   *                 database:
   *                   type: string
   *             example:
   *               status: ok
   *               database: connected
   *       500:
   *         description: Database connection failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [error]
   *                 database:
   *                   type: string
   *                 error:
   *                   type: string
   *             example:
   *               status: error
   *               database: disconnected
   *               error: Connection timeout
   */
  app.get<unknown, HealthResponse | HealthErrorResponse>('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(500).json({ status: 'error', database: 'disconnected', error: String(error) });
    }
  });

  app.use(errorHandler);

  return app;
}
