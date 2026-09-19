import { Expense } from '../types';
import { request } from './apiClient';

export const expenseApi = {
  async getExpenses(userId?: string): Promise<Expense[]> {
    const url = userId ? `/api/expenses?userId=${encodeURIComponent(userId)}` : '/api/expenses';
    const res = await request<{ expenses: Expense[] }>(url);
    return res.expenses || [];
  },

  async saveExpense(expense: Expense): Promise<Expense> {
    const res = await request<{ success: boolean; expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    return res.expense;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const res = await request<{ success: boolean; id: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },
};

