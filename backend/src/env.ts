import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  PORT: z.coerce.number().int().positive().optional().default(3000),
  CORS_ORIGIN: z.string().optional().default('*'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'silent']).optional().default('info'),
});

export const env = envSchema.parse(process.env);
