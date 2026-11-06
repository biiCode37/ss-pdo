import { describe, it, expect, vi } from 'vitest';
import { createGuardedFetch, REQUEST_LIMITS } from './requestCircuitBreaker';

const REST_URL = 'https://x.supabase.co/rest/v1/routes?select=*';
const FN_URL = 'https://x.supabase.co/functions/v1/sheets-proxy';

function setup() {
  let clock = 0;
  const base = vi.fn(async () => new Response('[]', { status: 200 }));
  const onOpen = vi.fn();
  const guarded = createGuardedFetch(base as unknown as typeof fetch, () => clock, onOpen);
  return { base, onOpen, guarded, tick: (ms: number) => { clock += ms; } };
}

describe('createGuardedFetch (BUG-QUOTA-200-01)', () => {
  it('meneruskan request selama di bawah ambang', async () => {
    const { base, onOpen, guarded } = setup();
    for (let i = 0; i < REQUEST_LIMITS.rest; i++) await guarded(REST_URL);
    expect(base).toHaveBeenCalledTimes(REQUEST_LIMITS.rest);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('memutus sirkuit saat loop melampaui ambang dan memblokir sampai reload', async () => {
    const { base, onOpen, guarded, tick } = setup();
    for (let i = 0; i < REQUEST_LIMITS.rest + 50; i++) await guarded(REST_URL);
    expect(base).toHaveBeenCalledTimes(REQUEST_LIMITS.rest);
    expect(onOpen).toHaveBeenCalledTimes(1);

    tick(10 * 60_000);
    const res = await guarded(FN_URL);
    expect(res.status).toBe(429);
    expect(base).toHaveBeenCalledTimes(REQUEST_LIMITS.rest);
  });

  it('tidak terpicu oleh beban sah yang tersebar di jendela berbeda', async () => {
    const { base, onOpen, guarded, tick } = setup();
    for (let m = 0; m < 5; m++) {
      for (let i = 0; i < 100; i++) {
        await guarded(REST_URL);
        tick(500);
      }
      tick(10_000);
    }
    expect(onOpen).not.toHaveBeenCalled();
    expect(base).toHaveBeenCalledTimes(500);
  });

  it('menghitung bucket functions terpisah dari rest', async () => {
    const { onOpen, guarded } = setup();
    for (let i = 0; i < REQUEST_LIMITS.rest; i++) await guarded(REST_URL);
    for (let i = 0; i < REQUEST_LIMITS.functions; i++) await guarded(FN_URL);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('tidak membatasi request di luar REST/functions (mis. realtime/auth)', async () => {
    const { base, onOpen, guarded } = setup();
    for (let i = 0; i < 500; i++) await guarded('https://x.supabase.co/auth/v1/user');
    expect(onOpen).not.toHaveBeenCalled();
    expect(base).toHaveBeenCalledTimes(500);
  });
});
