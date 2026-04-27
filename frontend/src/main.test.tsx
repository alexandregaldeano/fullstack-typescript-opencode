import { describe, it, expect, beforeEach } from 'vitest';

describe('main', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('should load without errors', async () => {
    await import('./main');
    expect(true).toBe(true);
  });
});
