import { ObjectId } from 'mongodb';

export interface IExpenseDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  description: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  homeCurrency: string;
  category: string;
  date: string;
  paymentMethod: string;
  isVoiceInput: boolean;
  voiceTranscript?: string;
  tags?: string[];
  syncStatus?: 'synced' | 'pending' | 'conflict';
  createdAt: string;
  updatedAt: string;
}

export const SUPPORTED_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Groceries',
  'Shopping',
  'Travel',
  'Entertainment',
  'Health & Wellness',
  'Utilities',
  'Housing',
  'Education',
  'Personal Care',
  'Other',
] as const;

export type ExpenseCategory = typeof SUPPORTED_EXPENSE_CATEGORIES[number];
