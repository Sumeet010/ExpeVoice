// ExchangeRate-API Configuration with user key
const EXCHANGE_RATE_API_KEY = '7105b04bdc493ef83312c556';
const EXCHANGE_RATE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest`;

// Base USD / INR Rates Fallback Table
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.9,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 153.5,
  AED: 3.67,
  CAD: 1.38,
  AUD: 1.54,
  SGD: 1.35,
  CHF: 0.88,
  MXN: 19.8,
  CNY: 7.23,
  NZD: 1.68,
  THB: 36.4,
};

interface LiveRatesResponse {
  success: boolean;
  base: string;
  timestamp: number;
  date: string;
  rates: Record<string, number>;
  source: 'live_api' | 'cached_fallback';
}

const cachedRatesMap = new Map<string, { data: LiveRatesResponse; time: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function getLiveCurrencyRates(baseCurrency = 'USD'): Promise<LiveRatesResponse> {
  const base = (baseCurrency || 'USD').toUpperCase();
  const now = Date.now();
  const cached = cachedRatesMap.get(base);

  if (cached && now - cached.time < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const apiUrl = `${EXCHANGE_RATE_API_URL}/${base}`;
    const res = await fetch(apiUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rates = data.conversion_rates || data.rates;
      if (data && rates && (data.result === 'success' || data.result === undefined)) {
        const liveData: LiveRatesResponse = {
          success: true,
          base: data.base_code || base,
          timestamp: data.time_last_update_unix ? data.time_last_update_unix * 1000 : now,
          date: new Date().toISOString(),
          rates: { ...FALLBACK_RATES, ...rates },
          source: 'live_api',
        };
        cachedRatesMap.set(base, { data: liveData, time: now });
        return liveData;
      }
    }
  } catch (err) {
    console.log('Live ExchangeRate API fetch error, using robust fallback rates table:', (err as any)?.message);
  }

  // Return reliable fallback
  const fallbackData: LiveRatesResponse = {
    success: true,
    base: base,
    timestamp: now,
    date: new Date().toISOString(),
    rates: FALLBACK_RATES,
    source: 'cached_fallback',
  };
  cachedRatesMap.set(base, { data: fallbackData, time: now });
  return fallbackData;
}
