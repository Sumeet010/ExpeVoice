import { BudgetLimit } from '../types';
import { request } from './apiClient';

export const budgetApi = {
  async getBudgets(userId?: string): Promise<BudgetLimit[]> {
    const url = userId ? `/api/budgets?userId=${encodeURIComponent(userId)}` : '/api/budgets';
    const res = await request<{ budgets: BudgetLimit[] }>(url);
    return res.budgets || [];
  },

  async saveBudgets(budgets: BudgetLimit[], userId?: string): Promise<BudgetLimit[]> {
    const res = await request<{ success: boolean; budgets: BudgetLimit[] }>('/api/budgets', {
      method: 'PUT',
      body: JSON.stringify({ budgets, userId }),
    });
    return res.budgets;
  },
};

