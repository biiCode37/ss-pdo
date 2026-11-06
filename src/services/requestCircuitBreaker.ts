/**
 * Circuit breaker jumlah request Supabase per tab (BUG-QUOTA-200-01).
 *
 * Jaring pengaman runtime terhadap infinite loop: jika satu tab mengirim request
 * melebihi ambang dalam jendela 60 detik, seluruh request berikutnya diblokir
 * sampai halaman dimuat ulang. Kerusakan maksimum per tab menjadi terbatas
 * sehingga satu bug tidak lagi dapat menghabiskan kuota egress satu organisasi.
 */

export const CIRCUIT_OPEN_EVENT = 'supabase-circuit-open';

const WINDOW_MS = 60_000;

// ponytail: ambang diturunkan dari pola beban sah tertinggi (ingestion regional ±40 upsert REST & ±80 panggilan sheets-proxy per menit, muat Monitoring 5 request); naikkan bila ada fitur bulk baru yang sah melampauinya
export const REQUEST_LIMITS = {
  rest: 150,
  functions: 200,
} as const;

type Bucket = keyof typeof REQUEST_LIMITS;

function bucketOf(url: string): Bucket | null {
  if (url.includes('/rest/v1/')) return 'rest';
  if (url.includes('/functions/v1/')) return 'functions';
  return null;
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function createGuardedFetch(
  baseFetch: typeof fetch,
  now: () => number = Date.now,
  onOpen: () => void = () => window.dispatchEvent(new CustomEvent(CIRCUIT_OPEN_EVENT)),
): typeof fetch {
  const timestamps: Record<Bucket, number[]> = { rest: [], functions: [] };
  let open = false;

  return (input, init) => {
    const bucket = bucketOf(urlOf(input));
    if (!bucket) return baseFetch(input, init);

    if (!open) {
      const t = now();
      const list = timestamps[bucket];
      list.push(t);
      while (list.length > 0 && t - list[0] > WINDOW_MS) list.shift();

      if (list.length > REQUEST_LIMITS[bucket]) {
        open = true;
        console.error(
          `[CircuitBreaker] ${list.length} request ${bucket} dalam 60 detik melebihi batas ${REQUEST_LIMITS[bucket]}. Request diblokir sampai halaman dimuat ulang.`,
        );
        onOpen();
      }
    }

    if (open) {
      return Promise.resolve(
        new Response(JSON.stringify({ message: 'Client request limit exceeded', code: 'CLIENT_CIRCUIT_OPEN' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    return baseFetch(input, init);
  };
}
