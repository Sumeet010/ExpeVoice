import { BudgetLimit, Expense, SyncStatus, UserProfile } from '../types';
import { convertCurrency } from './currency';

const STORAGE_KEYS = {
  EXPENSES: 'vocal_ledger_expenses_v1',
  BUDGETS: 'vocal_ledger_budgets_v1',
  USER: 'vocal_ledger_user_v1',
  SYNC_QUEUE: 'vocal_ledger_sync_queue_v1',
  LAST_SYNC: 'vocal_ledger_last_sync_v1',
  SIMULATE_OFFLINE: 'vocal_ledger_simulate_offline_v1',
};

// Seed data with default Indian Rupee (INR) base currency
export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-seed-2',
    userId: 'user-demo-1',
    description: 'Tokyo Metro Pass 72-Hour Unlimited',
    originalAmount: 1500,
    originalCurrency: 'JPY',
    convertedAmount: 820,
    homeCurrency: 'INR',
    category: 'Transportation',
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString().split('T')[0],
    paymentMethod: 'Apple Pay',
    isVoiceInput: true,
    tags: ['transit', 'voice-logged'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'exp-seed-3',
    userId: 'user-demo-1',
    description: 'Organic Groceries & Fresh Fruit Basket',
    originalAmount: 2450,
    originalCurrency: 'INR',
    convertedAmount: 2450,
    homeCurrency: 'INR',
    category: 'Groceries',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    paymentMethod: 'Debit Card',
    isVoiceInput: false,
    tags: ['weekly-prep'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'exp-seed-4',
    userId: 'user-demo-1',
    description: 'TGV High Speed Train Paris to Lyon',
    originalAmount: 68.00,
    originalCurrency: 'EUR',
    convertedAmount: 6201,
    homeCurrency: 'INR',
    category: 'Travel',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    isVoiceInput: true,
    voiceTranscript: 'Booked train to Lyon 68 euros using credit card',
    tags: ['europe', 'travel', 'voice-logged'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'exp-seed-5',
    userId: 'user-demo-1',
    description: 'Coworking Space Day Pass & High-Speed Fiber',
    originalAmount: 1800,
    originalCurrency: 'INR',
    convertedAmount: 1800,
    homeCurrency: 'INR',
    category: 'Utilities',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    isVoiceInput: false,
    tags: ['remote-work'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
  {
    id: 'exp-seed-6',
    userId: 'user-demo-1',
    description: 'Specialty Coffee & Breakfast Croissant',
    originalAmount: 380,
    originalCurrency: 'INR',
    convertedAmount: 380,
    homeCurrency: 'INR',
    category: 'Food & Dining',
    date: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString().split('T')[0],
    paymentMethod: 'Apple Pay',
    isVoiceInput: true,
    voiceTranscript: 'Coffee and breakfast 380 rupees paid with apple pay',
    tags: ['morning', 'voice-logged'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(),
  },
  {
    id: 'exp-seed-7',
    userId: 'user-demo-1',
    description: 'Digital Cinema IMAX Tickets',
    originalAmount: 950,
    originalCurrency: 'INR',
    convertedAmount: 950,
    homeCurrency: 'INR',
    category: 'Entertainment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    isVoiceInput: false,
    tags: ['weekend'],
    syncStatus: 'synced',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
  },
];

export const DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: 'Total', monthlyLimit: 75000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Food & Dining', monthlyLimit: 18000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Transportation', monthlyLimit: 8000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Groceries', monthlyLimit: 15000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Shopping', monthlyLimit: 10000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Travel', monthlyLimit: 20000, thresholds: [50, 80, 100], period: '2026-09' },
  { category: 'Entertainment', monthlyLimit: 4000, thresholds: [50, 80, 100], period: '2026-09' },
];

export const DEFAULT_USER: UserProfile = {
  id: 'user-demo-1',
  email: 'alex.traveler@gmail.com',
  name: 'Alex Rivera',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  homeCurrency: 'INR',
  authProvider: 'google',
  monthlyBudget: 75000,
  travelMode: true,
  targetTravelCurrency: 'USD',
  fontTheme: 'sora',
};

export class OfflineSyncEngine {
  private listeners: Array<(expenses: Expense[], budgets: BudgetLimit[], status: SyncStatus) => void> = [];
  private isSimulatedOffline: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedSim = localStorage.getItem(STORAGE_KEYS.SIMULATE_OFFLINE);
      this.isSimulatedOffline = storedSim === 'true';

      // Seed initial data or migrate to default INR
      const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userRaw) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
      } else {
        try {
          const parsed = JSON.parse(userRaw);
          // If stored user was using USD default, migrate to INR
          if (!parsed.homeCurrency || parsed.homeCurrency === 'USD') {
            parsed.homeCurrency = 'INR';
            if (parsed.monthlyBudget === 2500 || parsed.monthlyBudget === 3500) {
              parsed.monthlyBudget = 75000;
            }
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }

      if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
      } else {
        // Clean out Tsukiji record and migrate any legacy USD-converted amounts to INR
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
          if (raw) {
            const list: Expense[] = JSON.parse(raw);
            const currentUser = this.getUser();
            const filtered = list
              .filter(
                (e) =>
                  e.id !== 'exp-seed-1' &&
                  !e.description?.toLowerCase().includes('tsukiji') &&
                  !e.voiceTranscript?.toLowerCase().includes('tsukiji')
              )
              .map((e) => {
                if (e.homeCurrency === 'USD' && currentUser.homeCurrency === 'INR') {
                  return {
                    ...e,
                    homeCurrency: 'INR',
                    convertedAmount: convertCurrency(e.originalAmount, e.originalCurrency, 'INR'),
                  };
                }
                return e;
              });
            localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
          }
        } catch {
          // ignore
        }
      }

      const budgetsRaw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!budgetsRaw) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
      } else {
        try {
          const bList: BudgetLimit[] = JSON.parse(budgetsRaw);
          const totalB = bList.find((b) => b.category === 'Total');
          if (totalB && (totalB.monthlyLimit === 2500 || totalB.monthlyLimit === 3500)) {
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
          }
        } catch {
          // ignore
        }
      }

      if (!localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)) {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      }
    } catch (e) {
      console.error('Failed to initialize local storage', e);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public subscribe(cb: (expenses: Expense[], budgets: BudgetLimit[], status: SyncStatus) => void) {
    this.listeners.push(cb as any);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== (cb as any));
    };
  }

  private notify() {
    const expenses = this.getExpenses();
    const budgets = this.getBudgets();
    const status: SyncStatus = !this.isOnline()
      ? 'offline'
      : this.getSyncQueueCount() > 0
      ? 'pending'
      : 'synced';

    this.listeners.forEach((cb) => {
      try {
        cb(expenses, budgets, status);
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  }

  public isOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getPendingQueueCount(): number {
    return this.getSyncQueueCount();
  }

  public triggerSync(): Promise<{ success: boolean; syncedCount: number }> {
    return this.syncNow();
  }

  public reconvert(amount: number, from: string, to: string): number {
    return convertCurrency(amount, from, to);
  }

  public saveExpensesFromRemote(expenses: Expense[]) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.notify();
  }

  public saveBudgetsFromRemote(budgets: BudgetLimit[]) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.notify();
  }

  public toggleSimulateOffline(enable?: boolean): boolean {
    this.isSimulatedOffline = enable !== undefined ? enable : !this.isSimulatedOffline;
    localStorage.setItem(STORAGE_KEYS.SIMULATE_OFFLINE, String(this.isSimulatedOffline));
    this.notify();
    if (!this.isSimulatedOffline) {
      this.syncNow();
    }
    return this.isSimulatedOffline;
  }

  public getExpenses(): Expense[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!raw) return [];
      const list: Expense[] = JSON.parse(raw);
      return list.filter(
        (e) =>
          !e.deleted &&
          e.id !== 'exp-seed-1' &&
          !e.description?.toLowerCase().includes('tsukiji') &&
          !e.voiceTranscript?.toLowerCase().includes('tsukiji')
      );
    } catch {
      return [];
    }
  }

  public getBudgets(): BudgetLimit[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return raw ? JSON.parse(raw) : DEFAULT_BUDGETS;
    } catch {
      return DEFAULT_BUDGETS;
    }
  }

  public getUser(): UserProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  }

  public getSyncQueueCount(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  }

  public saveUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this.recalculateConvertedExpenses(user.homeCurrency);
    this.notify();
  }

  public saveBudgets(budgets: BudgetLimit[]) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.notify();
  }

  public recalculateConvertedExpenses(newHomeCurrency: string) {
    try {
      const list = this.getExpenses();
      const updated = list.map((e) => ({
        ...e,
        homeCurrency: newHomeCurrency,
        convertedAmount: convertCurrency(e.originalAmount, e.originalCurrency, newHomeCurrency),
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
      this.notify();
    } catch (e) {
      console.error(e);
    }
  }

  public saveExpense(expense: Expense): Expense {
    const list = this.getExpenses();
    const isOnline = this.isOnline();
    const updatedStatus = isOnline ? 'synced' : 'pending';

    const normalized: Expense = {
      ...expense,
      syncStatus: updatedStatus,
      updatedAt: new Date().toISOString(),
    };

    const idx = list.findIndex((e) => e.id === normalized.id);
    if (idx >= 0) {
      list[idx] = normalized;
    } else {
      list.unshift(normalized);
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(list));

    if (!isOnline) {
      this.enqueueChange(normalized);
    } else {
      this.syncNow();
    }

    this.notify();
    return normalized;
  }

  public deleteExpense(id: string) {
    const list = this.getExpenses();
    const item = list.find((e) => e.id === id);
    if (!item) return;

    const filtered = list.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));

    if (!this.isOnline()) {
      this.enqueueChange({ ...item, deleted: true });
    } else {
      this.syncNow();
    }

    this.notify();
  }

  private enqueueChange(change: Expense) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue: Expense[] = raw ? JSON.parse(raw) : [];
      queue.push(change);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error(e);
    }
  }

  private handleNetworkChange() {
    if (this.isOnline()) {
      this.syncNow();
    }
    this.notify();
  }

  public async syncNow(): Promise<{ success: boolean; syncedCount: number }> {
    if (!this.isOnline()) {
      return { success: false, syncedCount: 0 };
    }

    try {
      const rawQueue = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue: Expense[] = rawQueue ? JSON.parse(rawQueue) : [];
      const user = this.getUser();

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          clientTimestamp: Date.now(),
          changes: queue,
          lastSyncedAt: Number(localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 0),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Clear queue
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(Date.now()));

        // Mark local expenses as synced
        const currentExpenses = this.getExpenses();
        const updated = currentExpenses.map((e) => ({ ...e, syncStatus: 'synced' as const }));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

        // If server provided remote updates
        if (data.serverExpenses && Array.isArray(data.serverExpenses)) {
          const map = new Map<string, Expense>();
          updated.forEach((e) => map.set(e.id, e));
          data.serverExpenses.forEach((re: Expense) => {
            if (!re.deleted) {
              map.set(re.id, { ...re, syncStatus: 'synced' });
            } else {
              map.delete(re.id);
            }
          });
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(Array.from(map.values())));
        }

        this.notify();
        return { success: true, syncedCount: queue.length };
      }
    } catch (err) {
      console.warn('Sync push to server failed, staying in offline buffer:', err);
    }

    return { success: false, syncedCount: 0 };
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
