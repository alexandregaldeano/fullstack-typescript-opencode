import type { EventEmitter } from 'events';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('index', () => {
  let appMock: { listen: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let $disconnectSpy: ReturnType<typeof vi.fn>;
  let exitSpy: ReturnType<typeof vi.fn>;
  let loggerInfoSpy: ReturnType<typeof vi.fn>;
  let loggerErrorSpy: ReturnType<typeof vi.fn>;
  let loggerWarnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldClearNativeTimers: false });
    vi.clearAllMocks();
    vi.resetModules();

    appMock = {
      listen: vi.fn().mockReturnThis(),
      close: vi.fn(),
    };
    $disconnectSpy = vi.fn().mockResolvedValue(undefined);
    loggerInfoSpy = vi.fn();
    loggerErrorSpy = vi.fn();
    loggerWarnSpy = vi.fn();

    vi.doMock('./app', () => ({
      createApp: vi.fn(() => appMock),
    }));

    vi.doMock('./prisma', () => ({
      prisma: {
        $disconnect: $disconnectSpy,
      },
    }));

    vi.doMock('./env', () => ({
      env: { PORT: 3000 },
    }));

    vi.doMock('./logger', () => ({
      logger: {
        info: loggerInfoSpy,
        error: loggerErrorSpy,
        warn: loggerWarnSpy,
      },
      createChildLogger: vi.fn(() => ({
        info: loggerInfoSpy,
        error: loggerErrorSpy,
        warn: loggerWarnSpy,
      })),
    }));

    exitSpy = vi.fn();
    Object.defineProperty(process, 'exit', {
      value: exitSpy,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should export startServer', async () => {
    const { startServer } = await import('./index');
    expect(startServer).toBeDefined();
    expect(typeof startServer).toBe('function');
  });

  it('should export getServer', async () => {
    const { getServer } = await import('./index');
    expect(getServer).toBeDefined();
    expect(typeof getServer).toBe('function');
  });

  it('should export gracefulShutdown', async () => {
    const { gracefulShutdown } = await import('./index');
    expect(gracefulShutdown).toBeDefined();
    expect(typeof gracefulShutdown).toBe('function');
  });

  it('should export registerListeners', async () => {
    const { registerListeners } = await import('./index');
    expect(registerListeners).toBeDefined();
    expect(typeof registerListeners).toBe('function');
  });

  it('should create app, start listening, and call listen callback', async () => {
    const listenCallback = vi.fn();
    appMock.listen.mockImplementation((_port: number, callback: () => void) => {
      listenCallback();
      callback();
      return appMock;
    });

    await import('./index');

    const { createApp } = await import('./app');
    expect(createApp).toHaveBeenCalledTimes(1);
    expect(appMock.listen).toHaveBeenCalledTimes(1);
    expect(appMock.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(listenCallback).toHaveBeenCalledTimes(1);
    expect(loggerInfoSpy).toHaveBeenCalledWith({ port: 3000 }, 'Server running');
  });

  it('should call gracefulShutdown on SIGTERM via registerListeners', async () => {
    const { registerListeners } = await import('./index');

    appMock.close.mockImplementation((cb: () => void) => {
      cb();
    });

    registerListeners();

    (process as EventEmitter).emit('SIGTERM');

    expect(loggerInfoSpy).toHaveBeenCalledWith({ signal: 'SIGTERM' }, 'Shutting down gracefully');
    expect($disconnectSpy).toHaveBeenCalled();
  });

  it('should call gracefulShutdown on SIGINT via registerListeners', async () => {
    const { registerListeners } = await import('./index');

    appMock.close.mockImplementation((cb: () => void) => {
      cb();
    });

    registerListeners();

    (process as EventEmitter).emit('SIGINT');

    expect(loggerInfoSpy).toHaveBeenCalledWith({ signal: 'SIGINT' }, 'Shutting down gracefully');
  });

  it('should handle uncaughtException', async () => {
    const { registerListeners } = await import('./index');

    registerListeners();

    const testError = new Error('Test uncaught exception');
    process.emit('uncaughtException', testError);

    expect(loggerErrorSpy).toHaveBeenCalledWith({ err: testError }, 'Uncaught Exception');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle unhandledRejection', async () => {
    const { registerListeners } = await import('./index');

    registerListeners();

    const testReason = 'Test unhandled rejection';
    (process as EventEmitter).emit('unhandledRejection', testReason);

    expect(loggerErrorSpy).toHaveBeenCalledWith({ reason: testReason }, 'Unhandled Rejection');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should return server from getServer', async () => {
    const listenCallback = vi.fn();
    appMock.listen.mockImplementation((_port: number, callback: () => void) => {
      listenCallback();
      callback();
      return appMock;
    });

    await import('./index');

    const { getServer } = await import('./index');
    const retrievedServer = getServer();
    expect(retrievedServer).toBe(appMock);
  });

  it('should force shutdown after timeout', async () => {
    const { gracefulShutdown } = await import('./index');

    appMock.close.mockImplementation((_cb: () => void) => {
      // Do not call callback to simulate slow close
    });

    void gracefulShutdown('SIGTERM');

    await vi.advanceTimersByTimeAsync(10000);

    expect(loggerWarnSpy).toHaveBeenCalledWith({ timeoutSeconds: 10 }, 'Forced shutdown after 10 seconds');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should gracefully close server', async () => {
    const { gracefulShutdown } = await import('./index');

    appMock.close.mockImplementation((cb: () => void) => {
      cb();
    });

    await gracefulShutdown('SIGTERM');

    expect($disconnectSpy).toHaveBeenCalled();
  });
});
