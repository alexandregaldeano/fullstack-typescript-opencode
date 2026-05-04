import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as prismaModule from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('createApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an Express app', async () => {
    const { createApp } = await import('./app');
    const app = createApp();
    expect(app).toBeDefined();
  });

  it('should respond with 200 and health status on /health', async () => {
    const { createApp } = await import('./app');
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
    });
  });

  it('should respond with 200 and database connected on /api/health', async () => {
    const { createApp } = await import('./app');
    vi.mocked(prismaModule.prisma.$queryRaw).mockResolvedValueOnce([{ '1': 1 }]);

    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
    });
  });

  it('should respond with 500 and error on /api/health when prisma fails', async () => {
    const { createApp } = await import('./app');
    vi.mocked(prismaModule.prisma.$queryRaw).mockRejectedValueOnce(new Error('DB connection failed'));

    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      database: 'disconnected',
      error: 'Error: DB connection failed',
    });
  });

  
});
