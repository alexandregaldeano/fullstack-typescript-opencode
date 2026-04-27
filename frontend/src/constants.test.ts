import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './constants';

describe('constants', () => {
  it('should export API_BASE_URL', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('should default to /api when VITE_API_URL is not set', () => {
    expect(API_BASE_URL).toBe('/api');
  });
});
