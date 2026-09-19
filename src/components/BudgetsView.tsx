import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ShieldAlert,
  Save,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import { BudgetAlert, BudgetLimit, CategoryType, Expense, UserProfile } from '../types';
import { formatMoney } from '../services/currency';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface BudgetsViewProps {
  budgets: BudgetLimit[];
  expenses: Expense[];
  user: UserProfile;
  onSaveBudgets: (budgets: BudgetLimit[]) => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  expenses,
  user,
  onSaveBudgets,
  onUpdateUser,
}) => {
  const [editableBudgets, setEditableBudgets] = useState<BudgetLimit[]>(budgets);
  const [isSaved, setIsSaved] = useState(false);

  // Calculate current month's expenses
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [expenses]);

  const totalSpentMonth = useMemo(() => {
    return currentMonthExpenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  }, [currentMonthExpenses]);

  // Overall Total Budget
  const totalBudget = useMemo(() => {
    const totalItem = editableBudgets.find((b) => b.category === 'Total');
    return totalItem ? totalItem.monthlyLimit : user.monthlyBudget || 75000;
  }, [editableBudgets, user.monthlyBudget]);

  // Remaining days in month & Daily Allowance
  const { remainingDays, dailyAllowance } = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const rem = Math.max(daysInMonth - now.getDate() + 1, 1);
    const left = Math.max(totalBudget - totalSpentMonth, 0);
    return {
      remainingDays: rem,
      dailyAllowance: Math.round((left / rem) * 100) / 100,
    };
  }, [totalBudget, totalSpentMonth]);

  // Category spending map
  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.convertedAmount;
    });
    return map;
  }, [currentMonthExpenses]);

  // Generate spending threshold alerts
  const spendingAlerts: BudgetAlert[] = useMemo(() => {
    const alerts: BudgetAlert[] = [];

    // Check overall budget
    const overallPct = totalBudget > 0 ? (totalSpentMonth / totalBudget) * 100 : 0;
    if (overallPct >= 100) {
      alerts.push({
        id: 'alert-total-exceeded',
        category: 'Total',
        thresholdPercent: 100,
        spentAmount: totalSpentMonth,
        budgetLimit: totalBudget,
        currency: user.homeCurrency,
        triggeredAt: new Date().toISOString(),
        read: false,
        severity: 'critical',
      });
    } else if (overallPct >= 80) {
      alerts.push({
        id: 'alert-total-warning',
        category: 'Total',
        thresholdPercent: 80,
        spentAmount: totalSpentMonth,
        budgetLimit: totalBudget,
        currency: user.homeCurrency,
        triggeredAt: new Date().toISOString(),
        read: false,
        severity: 'warning',
      });
    }

    // Check individual categories
    editableBudgets
      .filter((b) => b.category !== 'Total')
      .forEach((b) => {
        const spent = categorySpentMap[b.category] || 0;
        const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
        if (pct >= 100) {
          alerts.push({
            id: `alert-${b.category}-critical`,
            category: b.category,
            thresholdPercent: 100,
            spentAmount: spent,
            budgetLimit: b.monthlyLimit,
            currency: user.homeCurrency,
            triggeredAt: new Date().toISOString(),
            read: false,
            severity: 'critical',
          });
        } else if (pct >= 80) {
          alerts.push({
            id: `alert-${b.category}-warning`,
            category: b.category,
            thresholdPercent: 80,
            spentAmount: spent,
            budgetLimit: b.monthlyLimit,
            currency: user.homeCurrency,
            triggeredAt: new Date().toISOString(),
            read: false,
            severity: 'warning',
          });
        }
      });

    return alerts;
  }, [totalBudget, totalSpentMonth, editableBudgets, categorySpentMap, user.homeCurrency]);

  // Overall Health Score: 0 - 100
  const healthScore = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayRatio = now.getDate() / daysInMonth;
    const spendRatio = totalBudget > 0 ? totalSpentMonth / totalBudget : 1;

    if (spendRatio === 0) return 100;
    const paceRatio = spendRatio / (dayRatio || 0.05);

    if (paceRatio <= 0.8) return 96;
    if (paceRatio <= 1.0) return 85;
    if (paceRatio <= 1.2) return 72;
    if (paceRatio <= 1.4) return 55;
    return 35;
  }, [totalSpentMonth, totalBudget]);

  const handleLimitChange = (category: string, newLimit: number) => {
    setEditableBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, monthlyLimit: Math.max(0, newLimit) } : b))
    );
    setIsSaved(false);
  };

  const handleSave = () => {
    onSaveBudgets(editableBudgets);
    const totalItem = editableBudgets.find((b) => b.category === 'Total');
    if (totalItem) {
      onUpdateUser({ ...user, monthlyBudget: totalItem.monthlyLimit });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">
            OVERVIEW
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-0.5">
            Budgets & Limits
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Settings Saved
            </span>
          )}
          <Button
            onClick={handleSave}
            variant="white"
            size="default"
            className="gap-2 cursor-pointer shadow-sm text-zinc-950 font-bold"
          >
            <Save className="h-4 w-4" />
            <span>Save Limits</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Health Score */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm flex items-center gap-4">
          <div
            className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base border shrink-0 ${
              healthScore >= 80
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : healthScore >= 60
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {healthScore}
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Budget Health
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {healthScore >= 80 ? 'Optimal Burn Rate' : healthScore >= 60 ? 'Moderate Velocity' : 'Critical Pace'}
            </p>
            <p className="text-[11px] text-zinc-500">
              Pacing vs days left in month
            </p>
          </div>
        </div>

        {/* Daily Allowance */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Safe Daily Pace
            </span>
            <p className="text-base font-bold text-white mt-0.5">
              {formatMoney(dailyAllowance, user.homeCurrency)}/day
            </p>
            <p className="text-[11px] text-zinc-500">
              For remaining {remainingDays} days
            </p>
          </div>
        </div>

        {/* Overall Limit Edit */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Total Monthly Target
            </span>
            <Sliders className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono font-bold">{user.homeCurrency}</span>
            <input
              type="number"
              step="50"
              value={totalBudget}
              onChange={(e) => handleLimitChange('Total', parseFloat(e.target.value) || 0)}
              className="w-full bg-[#18181d] border border-zinc-800 px-3 py-1.5 rounded-xl text-white font-bold text-sm focus:ring-1 focus:ring-zinc-400 focus:outline-none"
            />
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">
            Spent: {formatMoney(totalSpentMonth, user.homeCurrency)} ({Math.round((totalSpentMonth / (totalBudget || 1)) * 100)}%)
          </div>
        </div>
      </div>

      {/* Threshold Notifications Feed */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">Active Threshold Alerts & Notifications</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {spendingAlerts.length} Warnings
          </span>
        </div>

        {spendingAlerts.length === 0 ? (
          <div className="p-4 bg-[#16161a] rounded-xl border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              All categories are within healthy limits (below 80% threshold). Pacing is disciplined!
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {spendingAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' ? (
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-white">
                      {alert.category === 'Total' ? 'Overall Monthly Budget' : alert.category}:
                    </span>{' '}
                    <span>
                      {alert.thresholdPercent}% threshold reached. Spent{' '}
                      <strong>{formatMoney(alert.spentAmount, alert.currency)}</strong> of{' '}
                      <strong>{formatMoney(alert.budgetLimit, alert.currency)}</strong>.
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                    alert.severity === 'critical'
                      ? 'bg-rose-900/40 text-rose-300 border-rose-700/60'
                      : 'bg-amber-900/40 text-amber-300 border-amber-700/60'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Budget Limits Table */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">Category Spending Thresholds</h3>
          </div>
          <span className="text-[11px] text-zinc-500">
            Automated alerts at 80% and 100%
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {editableBudgets
            .filter((b) => b.category !== 'Total')
            .map((b) => {
              const spent = categorySpentMap[b.category] || 0;
              const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;

              return (
                <div
                  key={b.category}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{b.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          pct >= 100
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : pct >= 80
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                        }`}
                      >
                        {pct}% spent
                      </span>
                    </div>

                    <div className="mt-2.5 w-full max-w-md bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-xs text-zinc-400 text-right">
                      Spent: <strong className="text-white">{formatMoney(spent, user.homeCurrency)}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-zinc-500 font-mono">{user.homeCurrency}</span>
                      <input
                        type="number"
                        step="25"
                        min="0"
                        value={b.monthlyLimit}
                        onChange={(e) =>
                          handleLimitChange(b.category, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 bg-[#18181d] border border-zinc-800 px-2.5 py-1.5 rounded-xl text-white font-bold text-xs focus:ring-1 focus:ring-zinc-400 focus:outline-none text-right"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
