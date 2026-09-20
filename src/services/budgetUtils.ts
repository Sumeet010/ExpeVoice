import { BudgetLimit, Expense, UserProfile } from '../types';

/**
 * Calculate the overall monthly total budget limit.
 * Priority order:
 * 1. An explicit 'Total' budget entry in the budgets list.
 * 2. The user's explicit monthlyBudget setting if > 0.
 * 3. The sum of all individual category budgets.
 * 4. Default fallback of 75000.
 */
export function calculateTotalBudget(budgets: BudgetLimit[] = [], user?: UserProfile): number {
  const totalItem = budgets.find((b) => b.category === 'Total');
  if (totalItem && totalItem.monthlyLimit > 0) {
    return totalItem.monthlyLimit;
  }

  if (user?.monthlyBudget && user.monthlyBudget > 0) {
    return user.monthlyBudget;
  }

  const categorySum = budgets
    .filter((b) => b.category !== 'Total')
    .reduce((acc, b) => acc + (b.monthlyLimit || 0), 0);

  if (categorySum > 0) {
    return categorySum;
  }

  return 75000;
}

/**
 * Calculate total spending for the current calendar month across all expenses.
 * Handles ISO strings and YYYY-MM-DD date strings safely without timezone shifts.
 */
export function calculateCurrentMonthSpent(expenses: Expense[] = []): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return expenses
    .filter((e) => {
      if (!e || !e.date) return false;
      const parts = e.date.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === currentYear && m === currentMonth;
      }
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((acc, curr) => acc + (Number(curr.convertedAmount) || 0), 0);
}

/**
 * Composite budget status for Sidebar and Dashboard widgets.
 */
export function calculateBudgetStatus(
  budgets: BudgetLimit[] = [],
  expenses: Expense[] = [],
  user?: UserProfile
) {
  const totalLimit = calculateTotalBudget(budgets, user);
  const currentMonthSpent = calculateCurrentMonthSpent(expenses);
  const remaining = Math.max(0, totalLimit - currentMonthSpent);
  const spentPercent = totalLimit > 0 ? Math.min(100, Math.round((currentMonthSpent / totalLimit) * 100)) : 0;

  return {
    totalLimit,
    currentMonthSpent,
    remaining,
    spentPercent,
  };
}
