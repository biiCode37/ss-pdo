import { describe, it, expect } from 'vitest';
import { isStale, liveResult, cacheResult, errorResult } from './resultStatus';

describe('isStale', () => {
  it('returns true for expired data', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isStale(oneHourAgo, 30 * 60 * 1000)).toBe(true); // 30 min max age
  });

  it('returns false for fresh data', () => {
    const justNow = new Date(Date.now() - 1000).toISOString();
    expect(isStale(justNow, 30 * 60 * 1000)).toBe(false);
  });

  it('returns true for invalid date string', () => {
    expect(isStale('not-a-date', 60000)).toBe(true);
  });

  it('returns true for empty string', () => {
    expect(isStale('', 60000)).toBe(true);
  });
});

describe('liveResult', () => {
  it('creates result with live status', () => {
    const result = liveResult({ foo: 'bar' });
    expect(result.status).toBe('live');
    expect(result.data).toEqual({ foo: 'bar' });
    expect(result.cachedAt).toBeUndefined();
    expect(result.message).toBeUndefined();
  });
});

describe('cacheResult', () => {
  it('creates result with cache status and timestamp', () => {
    const ts = '2026-08-07T12:00:00Z';
    const result = cacheResult([1, 2, 3], ts);
    expect(result.status).toBe('cache');
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.cachedAt).toBe(ts);
  });
});

describe('errorResult', () => {
  it('creates result with error status and message', () => {
    const result = errorResult(null, 'Gagal memuat data');
    expect(result.status).toBe('error');
    expect(result.data).toBeNull();
    expect(result.message).toBe('Gagal memuat data');
  });
});
