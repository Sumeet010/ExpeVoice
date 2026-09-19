export type CategoryType =
  | 'Food & Dining'
  | 'Transportation'
  | 'Groceries'
  | 'Shopping'
  | 'Travel'
  | 'Entertainment'
  | 'Health & Wellness'
  | 'Utilities'
  | 'Housing'
  | 'Education'
  | 'Personal Care'
  | 'Other';

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number; // 1 USD = rateToUSD unit
  flag: string;
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Apple Pay' | 'Bank Transfer';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'offline' | 'conflict';

export interface Expense {
  id: string;
  userId: string;
  description: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number; // in user's home currency
  homeCurrency: string;
  category: CategoryType;
  date: string; // ISO YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  tags: string[];
  isVoiceInput?: boolean;
  voiceTranscript?: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface BudgetLimit {
  category: CategoryType | 'Total';
  monthlyLimit: number;
  thresholds: number[]; // e.g. [50, 80, 100]
  period: string; // YYYY-MM
}

export interface BudgetAlert {
  id: string;
  category: CategoryType | 'Total';
  thresholdPercent: number;
  spentAmount: number;
  budgetLimit: number;
  currency: string;
  triggeredAt: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  homeCurrency: string;
  authProvider: 'google' | 'guest' | 'demo';
  monthlyBudget: number;
  travelMode: boolean;
  targetTravelCurrency?: string;
  fontTheme?: 'sora' | 'outfit' | 'editorial' | 'dm-sans';
}

export interface ParsedVoiceResult {
  rawTranscript: string;
  description: string;
  amount: number;
  currency: string;
  category: CategoryType;
  date: string;
  paymentMethod: PaymentMethod;
  confidence: number;
  tags: string[];
}

export interface SyncPayload {
  userId: string;
  clientTimestamp: number;
  changes: Expense[];
  lastSyncedAt: number;
}

export interface SyncResponse {
  success: boolean;
  serverTimestamp: number;
  serverExpenses: Expense[];
  conflictsResolved: number;
}

export interface UnitTestResult {
  id: string;
  name: string;
  suite: 'NLP Voice Parsing' | 'Currency Conversion' | 'Budget Alerts' | 'Offline Sync Queue' | 'Export Engine';
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  details: string;
  expected?: string;
  actual?: string;
}
