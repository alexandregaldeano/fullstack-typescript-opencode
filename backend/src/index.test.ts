import type { EventEmitter } from 'events';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('index', () => {
  let appMock: { listen: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
  let $disconnectSpy: ReturnType<typeof vi.fn>;
  let exitSpy: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldClearNativeTimers: false });
    vi.clearAllMocks();
    vi.resetModules();
    
    appMock = {
      listen: vi.fn().mockReturnThis(),
      close: vi.fn(),
    };
    $disconnectSpy = vi.fn().mockResolvedValue(undefined);
    
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
    
    exitSpy = vi.fn();
    Object.defineProperty(process, 'exit', {
      value: exitSpy,
      writable: true,
      configurable: true,
    });
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => void 0);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => void 0);
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
    expect(consoleLogSpy).toHaveBeenCalledWith('Server running on http://localhost:3000');
  });

  it('should call gracefulShutdown on SIGTERM', async () => {
    const { gracefulShutdown } = await import('./index');

    appMock.close.mockImplementation((cb: () => void) => {
      cb();
    });

    await gracefulShutdown('SIGTERM');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '\nSIGTERM received. Shutting down gracefully...'
    );
    expect($disconnectSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Server closed. Exiting process.');
  });

  it('should call gracefulShutdown on SIGINT', async () => {
    const { gracefulShutdown } = await import('./index');

    appMock.close.mockImplementation((cb: () => void) => {
      cb();
    });

    await gracefulShutdown('SIGINT');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '\nSIGINT received. Shutting down gracefully...'
    );
  });

  it('should handle uncaughtException', async () => {
    const { registerListeners } = await import('./index');

    registerListeners();

    const testError = new Error('Test uncaught exception');
    process.emit('uncaughtException', testError);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Uncaught Exception:', testError);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle unhandledRejection', async () => {
    const { registerListeners } = await import('./index');

    registerListeners();

    const testReason = 'Test unhandled rejection';
    (process as EventEmitter).emit('unhandledRejection', testReason);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled Rejection:', testReason);
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

    expect(consoleErrorSpy).toHaveBeenCalledWith('Forced shutdown after 10 seconds.');
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
