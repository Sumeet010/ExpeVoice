import { ObjectId } from 'mongodb';

export interface IBudgetDocument {
  _id?: ObjectId;
  id?: string;
  userId?: string;
  category: string;
  monthlyLimit: number;
  currentSpent?: number;
  currency: string;
  alertThreshold: number; // percentage (e.g., 80)
  period: 'monthly' | 'weekly' | 'annual';
  updatedAt: string;
}

export const DEFAULT_BUDGET_TEMPLATES: IBudgetDocument[] = [
  {
    category: 'Food & Dining',
    monthlyLimit: 15000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 80,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
  {
    category: 'Groceries',
    monthlyLimit: 12000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 85,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
  {
    category: 'Transportation',
    monthlyLimit: 8000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 75,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
  {
    category: 'Travel',
    monthlyLimit: 25000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 90,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
  {
    category: 'Utilities',
    monthlyLimit: 6000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 80,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
  {
    category: 'Entertainment',
    monthlyLimit: 7000,
    currentSpent: 0,
    currency: 'INR',
    alertThreshold: 80,
    period: 'monthly',
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_BUDGETS = DEFAULT_BUDGET_TEMPLATES;

