import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/test-setup.ts', 'src/error-handler.ts', 'src/app.ts'],
      thresholds: {
        lines: 100,
        functions: 80,
        branches: 95,
        statements: 90,
      },
    },
  },
});
