import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as appModule from './app';

describe('index', () => {
  let createAppSpy: ReturnType<typeof vi.spyOn>;
  let appMock: { listen: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    createAppSpy = vi.spyOn(appModule, 'createApp');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create app and start listening', async () => {
    const listenCallback = vi.fn();
    appMock = { listen: vi.fn((_port: number, callback: () => void) => {
      listenCallback();
      callback();
    }) };
    createAppSpy.mockReturnValue(appMock as any);

    await import('./index');

    expect(createAppSpy).toHaveBeenCalledTimes(1);
    expect(appMock.listen).toHaveBeenCalledTimes(1);
    expect(appMock.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(listenCallback).toHaveBeenCalledTimes(1);
  });
});
