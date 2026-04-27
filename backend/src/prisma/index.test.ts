import { describe, it, expect } from 'vitest';

import { prisma } from './index';

describe('prisma', () => {
  it('should export a PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(prisma.$connect).toBeDefined();
  });
});
