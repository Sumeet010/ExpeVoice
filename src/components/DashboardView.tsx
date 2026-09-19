import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
  Calendar,
  Globe,
  Mic,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Info,
  Plus,
  ArrowRight,
  Receipt,
  Layers,
  ChevronRight,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { BudgetLimit, CategoryType, Expense, UserProfile } from '../types';
import { formatMoney } from '../services/currency';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DashboardViewProps {
  expenses: Expense[];
  budgets: BudgetLimit[];
  user: UserProfile;
  onOpenVoiceModal: () => void;
  onNavigateToBudgets: () => void;
  onNavigateToExpenses: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Travel & Transport': '#3b82f6',
  Shopping: '#ec4899',
  'Bills & Utilities': '#10b981',
  Entertainment: '#8b5cf6',
  Health: '#14b8a6',
  Other: '#64748b',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  budgets,
  user,
  onOpenVoiceModal,
  onNavigateToBudgets,
  onNavigateToExpenses,
}) => {
  const [timeRange, setTimeRange] = useState<'month' | '30days' | 'year' | 'all'>('month');
  const [activityFilter, setActivityFilter] = useState<'all' | 'voice' | 'manual'>('all');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter expenses by selected time range
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      if (timeRange === 'month') {
        return (
          expDate.getFullYear() === now.getFullYear() &&
          expDate.getMonth() === now.getMonth()
        );
      }
      if (timeRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return expDate >= thirtyDaysAgo;
      }
      if (timeRange === 'year') {
        return expDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, timeRange]);

  // Activity filter
  const displayedRecentExpenses = useMemo(() => {
    let list = [...filteredExpenses];
    if (activityFilter === 'voice') {
      list = list.filter((e) => e.isVoiceInput);
    } else if (activityFilter === 'manual') {
      list = list.filter((e) => !e.isVoiceInput);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [filteredExpenses, activityFilter]);

  // Aggregate Metrics
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  }, [filteredExpenses]);

  const voiceCount = useMemo(() => {
    return filteredExpenses.filter((e) => e.isVoiceInput).length;
  }, [filteredExpenses]);

  const totalBudget = useMemo(() => {
    const totalItem = budgets.find((b) => b.category === 'Total');
    return totalItem ? totalItem.monthlyLimit : user.monthlyBudget || 75000;
  }, [budgets, user.monthlyBudget]);

  const budgetUsagePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Distinct currencies used
  const currenciesCount = useMemo(() => {
    const set = new Set(filteredExpenses.map((e) => e.originalCurrency.toUpperCase()));
    set.add(user.homeCurrency.toUpperCase());
    return set.size;
  }, [filteredExpenses, user.homeCurrency]);

  const currenciesList = useMemo(() => {
    const set = new Set(filteredExpenses.map((e) => e.originalCurrency.toUpperCase()));
    set.add(user.homeCurrency.toUpperCase());
    return Array.from(set).slice(0, 4).join(' · ');
  }, [filteredExpenses, user.homeCurrency]);

  // Foreign currency spend
  const foreignCurrencySpend = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.originalCurrency.toUpperCase() !== user.homeCurrency.toUpperCase())
      .reduce((acc, curr) => acc + curr.convertedAmount, 0);
  }, [filteredExpenses, user.homeCurrency]);

  // Category aggregations
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.convertedAmount;
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({
        category: cat as CategoryType,
        amount: Math.round(amt * 100) / 100,
        percent: totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalSpent]);

  // Daily time series for bar chart (last 14 days)
  const dailyTimeSeries = useMemo(() => {
    const days: { date: string; label: string; amount: number; count: number }[] = [];
    const now = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const dayExpenses = expenses.filter((e) => e.date.startsWith(dateKey));
      const dayTotal = dayExpenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);

      days.push({
        date: dateKey,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount: Math.round(dayTotal * 100) / 100,
        count: dayExpenses.length,
      });
    }

    return days;
  }, [expenses]);

  const maxDailyAmount = useMemo(() => {
    const max = Math.max(...dailyTimeSeries.map((d) => d.amount), 50);
    return max * 1.15;
  }, [dailyTimeSeries]);

  // Active budget alerts
  const activeAlerts = useMemo(() => {
    return budgets
      .filter((b) => b.category !== 'Total')
      .map((b) => {
        const spent = categoryData.find((c) => c.category === b.category)?.amount || 0;
        const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
        return { category: b.category, spent, limit: b.monthlyLimit, pct };
      })
      .filter((b) => b.pct >= 80);
  }, [budgets, categoryData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section (Matches reference image OVERVIEW + Dashboard heading) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">
            OVERVIEW
          </span>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            {user.authProvider === 'google' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Google: {user.email}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                <span>Database: Local JSON & Offline Storage</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons & Time Range Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-[#141418] border border-zinc-800/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'month'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === '30days'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'year'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Year
            </button>
          </div>

          <Button
            id="btn-dashboard-record-voice"
            onClick={onOpenVoiceModal}
            variant="white"
            size="default"
            className="gap-2 shadow-sm cursor-pointer"
          >
            <Mic className="h-4 w-4 text-zinc-950" />
            <span>Voice Entry</span>
          </Button>

          <Button
            onClick={onNavigateToExpenses}
            variant="outline"
            size="default"
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-zinc-400" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Budget Threshold Notification (if warning/critical) */}
      {activeAlerts.length > 0 && (
        <div className="bg-[#181212] border border-amber-500/30 rounded-2xl p-4 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  Budget Warning Threshold
                  <Badge variant="warning" className="text-[10px]">
                    {activeAlerts.length} Action Needed
                  </Badge>
                </h4>
                <div className="mt-1 space-y-0.5">
                  {activeAlerts.map((alert, idx) => (
                    <p key={idx} className="text-xs text-zinc-300">
                      • <span className="font-semibold text-white">{alert.category}</span> is at{' '}
                      <span className="font-bold text-amber-400">{alert.pct}%</span> of limit (
                      {formatMoney(alert.spent, user.homeCurrency)} of{' '}
                      {formatMoney(alert.limit, user.homeCurrency)})
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={onNavigateToBudgets}
              variant="outline"
              size="sm"
              className="gap-1 text-xs shrink-0"
            >
              Adjust Limits
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* 4 Key Stat Cards (Matches reference image 4 top cards layout & styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Spend (reference: Total Tournaments) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Total Spend</span>
            <Wallet className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white">
            {formatMoney(totalSpent, user.homeCurrency)}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-blue-400 font-medium">
              {timeRange === 'month' ? 'Current Month' : 'Selected Period'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-medium">
              {budgetUsagePercent < 80 ? 'On Track' : `${budgetUsagePercent}% Used`}
            </span>
          </div>
        </div>

        {/* Card 2: Transactions (reference: Matches Played) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Transactions</span>
            <Receipt className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white">
            {filteredExpenses.length}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
              {voiceCount} Voice
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">
              {filteredExpenses.length - voiceCount} Manual
            </span>
          </div>
        </div>

        {/* Card 3: Monthly Budget (reference: Total Teams) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Monthly Budget</span>
            <Layers className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white">
            {formatMoney(totalBudget, user.homeCurrency)}
          </div>
          <div className="mt-3 text-xs text-zinc-400">
            Across {budgets.filter((b) => b.category !== 'Total').length} categories
          </div>
        </div>

        {/* Card 4: Currencies Used (reference: Players Registered) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-sm font-medium">Currencies Used</span>
            <Globe className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white">
            {currenciesCount}
          </div>
          <div className="mt-3 text-xs text-zinc-400 font-mono truncate">
            {currenciesList}
          </div>
        </div>
      </div>

      {/* Middle Section: Matches Center & Tournaments Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Expenses Center (reference: Matches Center) */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Expenses Center</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Track real-time expenses and setup new entries
              </p>
            </div>

            {/* Segmented Filter Pills (Matches reference image LIVE 1 | SCHEDULED | COMPLETED) */}
            <div className="bg-[#18181d] border border-zinc-800/80 p-1 rounded-xl flex items-center gap-1 self-start">
              <button
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'all'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL {filteredExpenses.length}
              </button>
              <button
                onClick={() => setActivityFilter('voice')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'voice'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                VOICE {voiceCount}
              </button>
              <button
                onClick={() => setActivityFilter('manual')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activityFilter === 'manual'
                    ? 'bg-white text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                MANUAL {filteredExpenses.length - voiceCount}
              </button>
            </div>
          </div>

          {/* Transaction Items styled as match cards from reference */}
          <div className="space-y-3">
            {displayedRecentExpenses.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-400">No expenses recorded in this view.</p>
                <Button
                  onClick={onOpenVoiceModal}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Record Your First Expense
                </Button>
              </div>
            ) : (
              displayedRecentExpenses.map((exp) => {
                const isForeign =
                  exp.originalCurrency.toUpperCase() !== user.homeCurrency.toUpperCase();
                const formattedDate = new Date(exp.date).toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                });

                return (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-[#16161a] border border-zinc-800/70 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Date Badge */}
                      <div className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-bold text-zinc-300 text-center shrink-0">
                        {formattedDate}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {exp.description}
                          </span>
                          {exp.isVoiceInput && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                              <Mic className="h-3 w-3" /> Voice
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>{exp.category}</span>
                          <span>•</span>
                          <span>{exp.paymentMethod}</span>
                          {isForeign && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400 font-mono">
                                {exp.originalCurrency} {exp.originalAmount}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-bold text-white">
                          {formatMoney(exp.convertedAmount, user.homeCurrency)}
                        </div>
                        {isForeign && (
                          <div className="text-[10px] text-zinc-500">
                            Converted to {user.homeCurrency}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={onNavigateToExpenses}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onNavigateToExpenses}
              className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              View Full Transaction Ledger
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Budgets Dashboard (reference: Tournaments Dashboard) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Budgets Dashboard</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Quick shortcuts to ongoing limits
                </p>
              </div>
              <button
                onClick={onNavigateToBudgets}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {/* Category Budgets list styled like TPL 2026 ongoing card */}
            <div className="mt-5 space-y-2.5">
              {budgets
                .filter((b) => b.category !== 'Total')
                .slice(0, 4)
                .map((b, idx) => {
                  const spent = categoryData.find((c) => c.category === b.category)?.amount || 0;
                  const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
                  const isOver = pct >= 100;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#16161a] border border-zinc-800/70 hover:border-zinc-700 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-white">{b.category}</h5>
                          <p className="text-[11px] text-zinc-400">
                            Limit: {formatMoney(b.monthlyLimit, user.homeCurrency)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isOver
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                              : pct >= 80
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                          }`}
                        >
                          {isOver ? 'EXCEEDED' : 'ONGOING'}
                        </span>
                      </div>

                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-zinc-400">
                        <span>Spent: {formatMoney(spent, user.homeCurrency)}</span>
                        <span className="font-bold text-zinc-200">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <button
            onClick={onNavigateToBudgets}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors text-center"
          >
            Manage All Category Budgets
          </button>
        </div>
      </div>

      {/* Bottom Section: 2 Wide Cards (reference: Top Run Scorers & Top Wicket Takers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Bottom: Spending Velocity (reference: Top Run Scorers) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Daily Spending Velocity</h4>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                  14-Day Timeline
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Avg: {formatMoney(totalSpent / 14, user.homeCurrency)}/day
            </span>
          </div>

          {/* Bar Chart */}
          <div className="pt-4 h-48 w-full flex items-end justify-between gap-1.5 px-2 border-b border-zinc-800/80 pb-2 relative">
            {dailyTimeSeries.map((day, idx) => {
              const heightPercent = maxDailyAmount > 0 ? (day.amount / maxDailyAmount) * 100 : 0;
              const isHovered = hoveredDate === day.date;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  onMouseEnter={() => setHoveredDate(day.date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-zinc-950 border border-zinc-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-xl whitespace-nowrap pointer-events-none">
                      <p>{day.label}</p>
                      <p className="text-emerald-400 font-bold">
                        {formatMoney(day.amount, user.homeCurrency)} ({day.count} txns)
                      </p>
                    </div>
                  )}

                  <div
                    className={`w-full max-w-[24px] rounded-t-md transition-all duration-200 ${
                      day.amount > 0
                        ? isHovered
                          ? 'bg-white scale-y-105'
                          : 'bg-zinc-200 hover:bg-white'
                        : 'bg-zinc-800/40'
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, 4)}%`,
                    }}
                  />

                  <span className="text-[9px] text-zinc-500 mt-2 truncate w-full text-center">
                    {day.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-white inline-block" />
              Converted Daily Spend
            </span>
            <span>Based on local transaction timeline</span>
          </div>
        </div>

        {/* Right Bottom: Category Share (reference: Top Wicket Takers) */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-zinc-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Top Spending Categories</h4>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Breakdown by Share
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-400">{categoryData.length} Categories</span>
          </div>

          {/* Category Rows */}
          <div className="space-y-3 pt-1">
            {categoryData.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No categories recorded yet.</p>
            ) : (
              categoryData.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#fff' }}
                      />
                      <span className="font-semibold text-white">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{cat.percent}%</span>
                      <span className="font-bold text-white">
                        {formatMoney(cat.amount, user.homeCurrency)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: CATEGORY_COLORS[cat.category] || '#fff',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
