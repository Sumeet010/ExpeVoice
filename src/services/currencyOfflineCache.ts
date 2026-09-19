/**
 * Currency Rates Offline Cache Service
 *
 * SPECIFICATION COMPLIANCE:
 * - LocalStorage is strictly reserved ONLY for caching the Currency Rates API for offline access and sync.
 * - All other items (Expenses, Budgets, Users) are managed exclusively by the MongoDB backend.
 */

const CURRENCY_RATES_STORAGE_KEY = 'vocal_ledger_currency_rates_cache';

// Purge deprecated LocalStorage keys (expenses, budgets, user) to ensure only currency rates are stored
export function purgeNonCurrencyLocalStorage(): void {
  try {
    const keysToRemove = [
      'vocal_ledger_expenses_v1',
      'vocal_ledger_budgets_v1',
      'vocal_ledger_user_v1',
      'vocal_ledger_sync_queue_v1',
      'vocal_ledger_last_sync_v1',
      'vocal_ledger_simulate_offline_v1',
      'vocal_ledger_google_auth_session_v1',
    ];

    keysToRemove.forEach((k) => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
      }
    });
  } catch (err) {
    console.warn('LocalStorage purge note:', err);
  }
}

export interface CachedCurrencyRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: number;
  source: 'api' | 'cached' | 'fallback';
}

const DEFAULT_STATIC_RATES: Record<string, number> = {
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
};

class CurrencyOfflineCacheService {
  private memoryCache: CachedCurrencyRates | null = null;
  private listeners: Array<(rates: CachedCurrencyRates) => void> = [];

  constructor() {
    // Purge other items immediately
    purgeNonCurrencyLocalStorage();
    // Load cached currency rates from LocalStorage
    this.memoryCache = this.loadFromLocalStorage();
    // Fetch fresh rates if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      this.syncRatesFromApi();
    }
  }

  /**
   * Reads ONLY currency rates from LocalStorage
   */
  private loadFromLocalStorage(): CachedCurrencyRates {
    try {
      const raw = localStorage.getItem(CURRENCY_RATES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rates) {
          return {
            base: parsed.base || 'USD',
            rates: parsed.rates,
            lastUpdated: parsed.lastUpdated || Date.now(),
            source: 'cached',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached currency rates from LocalStorage:', e);
    }

    // Default rates saved into LocalStorage
    const initial: CachedCurrencyRates = {
      base: 'USD',
      rates: DEFAULT_STATIC_RATES,
      lastUpdated: Date.now(),
      source: 'fallback',
    };
    this.saveToLocalStorage(initial);
    return initial;
  }

  /**
   * Writes ONLY currency rates to LocalStorage
   */
  private saveToLocalStorage(data: CachedCurrencyRates): void {
    try {
      localStorage.setItem(
        CURRENCY_RATES_STORAGE_KEY,
        JSON.stringify({
          base: data.base,
          rates: data.rates,
          lastUpdated: data.lastUpdated,
          source: data.source,
        })
      );
    } catch (e) {
      console.warn('Failed to save currency rates to LocalStorage:', e);
    }
  }

  /**
   * Call the Currency Rates API and store result in LocalStorage for offline synchronization
   */
  public async syncRatesFromApi(): Promise<CachedCurrencyRates> {
    try {
      const res = await fetch('/api/currency/rates');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          const freshData: CachedCurrencyRates = {
            base: data.base || 'USD',
            rates: data.rates,
            lastUpdated: data.timestamp || Date.now(),
            source: 'api',
          };

          this.memoryCache = freshData;
          this.saveToLocalStorage(freshData);
          this.notifyListeners(freshData);
          return freshData;
        }
      }
    } catch (err) {
      console.log('Offline: using LocalStorage cached currency rates for conversion.');
    }

    return this.getRates();
  }

  /**
   * Get currently active rates (from memory or LocalStorage)
   */
  public getRates(): CachedCurrencyRates {
    if (!this.memoryCache) {
      this.memoryCache = this.loadFromLocalStorage();
    }
    return this.memoryCache;
  }

  /**
   * Convert between any two currencies using the offline-cached rate table
   */
  public convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (!amount || isNaN(amount)) return 0;
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();
    if (from === to) return amount;

    const rates = this.getRates().rates;
    const fromRate = rates[from] || DEFAULT_STATIC_RATES[from] || 1.0;
    const toRate = rates[to] || DEFAULT_STATIC_RATES[to] || 1.0;

    // Convert from source to base USD, then USD to target
    const inUSD = amount / fromRate;
    const converted = inUSD * toRate;

    if (to === 'JPY' || to === 'KRW') {
      return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
  }

  public subscribe(cb: (rates: CachedCurrencyRates) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(data: CachedCurrencyRates) {
    this.listeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(err);
      }
    });
  }
}

export const currencyOfflineCache = new CurrencyOfflineCacheService();
