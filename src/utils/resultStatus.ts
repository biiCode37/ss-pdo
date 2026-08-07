/** Status sumber data yang menentukan bagaimana UI menampilkan info */
export type DataSourceStatus = 'live' | 'cache' | 'partial' | 'error' | 'conflict' | 'pending' | 'failed';

/** Wrapper result generik dengan metadata status */
export interface DataResult<T> {
  data: T;
  status: DataSourceStatus;
  message?: string;
  cachedAt?: string; // ISO timestamp kapan data di-cache
}

/** Cek apakah data cache sudah expired berdasarkan maxAgeMs */
export function isStale(cachedAt: string, maxAgeMs: number): boolean {
  const cachedTime = new Date(cachedAt).getTime();
  if (isNaN(cachedTime)) return true; // Invalid date = stale
  return Date.now() - cachedTime > maxAgeMs;
}

/** Buat DataResult dengan status 'live' */
export function liveResult<T>(data: T): DataResult<T> {
  return { data, status: 'live' };
}

/** Buat DataResult dengan status 'cache' */
export function cacheResult<T>(data: T, cachedAt: string): DataResult<T> {
  return { data, status: 'cache', cachedAt };
}

/** Buat DataResult dengan status 'error' */
export function errorResult<T>(data: T, message: string): DataResult<T> {
  return { data, status: 'error', message };
}
