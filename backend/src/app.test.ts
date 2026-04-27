import request from 'supertest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createApp } from './app';
import * as prismaModule from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    $connect: vi.fn(),
  },
}));

describe('createApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an Express app', () => {
    const app = createApp();
    expect(app).toBeDefined();
  });

  it('should respond with 200 and health status when prisma connects', async () => {
    vi.mocked(prismaModule.prisma.$connect).mockResolvedValueOnce(undefined);

    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
    });
  });

  it('should respond with 500 and error status when prisma fails', async () => {
    vi.mocked(prismaModule.prisma.$connect).mockRejectedValueOnce(new Error('DB connection failed'));

    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      status: 'error',
      database: 'disconnected',
      error: 'Error: DB connection failed',
    });
  });
});
