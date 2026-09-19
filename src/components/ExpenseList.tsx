import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Mic,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  Download,
  X,
  Receipt,
  Layers,
} from 'lucide-react';
import { CategoryType, DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS, Expense, PaymentMethod, UserProfile } from '../types';
import { convertCurrency, formatMoney, SUPPORTED_CURRENCIES } from '../services/currency';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface ExpenseListProps {
  expenses: Expense[];
  user: UserProfile;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenVoiceModal: () => void;
  onOpenExportModal: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  user,
  onSaveExpense,
  onDeleteExpense,
  onOpenVoiceModal,
  onOpenExportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Manual Add/Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Dynamically resolve all categories present in the system
  const availableCategories = useMemo(() => {
    const customCats = expenses.map((e) => e.category).filter(Boolean);
    const set = new Set([...DEFAULT_CATEGORIES, ...customCats]);
    return Array.from(set);
  }, [expenses]);

  // Filtered & Sorted expenses
  const filteredList = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesSearch =
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.voiceTranscript && e.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
        const matchesCurr = selectedCurrency === 'all' || e.originalCurrency === selectedCurrency;
        const matchesPayment = selectedPayment === 'all' || e.paymentMethod === selectedPayment;

        return matchesSearch && matchesCat && matchesCurr && matchesPayment;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const tA = new Date(a.date).getTime();
          const tB = new Date(b.date).getTime();
          return sortAsc ? tA - tB : tB - tA;
        } else {
          return sortAsc ? a.convertedAmount - b.convertedAmount : b.convertedAmount - a.convertedAmount;
        }
      });
  }, [expenses, searchQuery, selectedCategory, selectedCurrency, selectedPayment, sortField, sortAsc]);

  const handleOpenAdd = () => {
    setEditingExpense({
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      description: '',
      originalAmount: 0,
      originalCurrency: user.homeCurrency,
      convertedAmount: 0,
      homeCurrency: user.homeCurrency,
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      tags: [],
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || editingExpense.originalAmount <= 0) return;

    const converted =
      editingExpense.originalCurrency === user.homeCurrency
        ? editingExpense.originalAmount
        : convertCurrency(editingExpense.originalAmount, editingExpense.originalCurrency, user.homeCurrency);

    const completeExpense: Expense = {
      ...editingExpense,
      convertedAmount: converted,
      homeCurrency: user.homeCurrency,
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(completeExpense);
    setIsEditing(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">
            TRANSACTIONS
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-0.5">
            Expense Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={onOpenVoiceModal}
            variant="white"
            size="default"
            className="gap-2 cursor-pointer shadow-sm"
          >
            <Mic className="h-4 w-4 text-zinc-950" />
            <span>Voice Entry</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            variant="outline"
            size="default"
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-zinc-400" />
            <span>Add Transaction</span>
          </Button>

          <Button
            onClick={onOpenExportModal}
            variant="ghost"
            size="default"
            className="gap-1.5 cursor-pointer text-zinc-300"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, voice transcript, or category..."
              className="w-full pl-10 pr-4 py-2 bg-[#18181d] border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Payments</option>
            {DEFAULT_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Currency Filter */}
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Currencies</option>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>

          {/* Sort Button */}
          <button
            onClick={() => {
              if (sortField === 'date') {
                setSortAsc(!sortAsc);
              } else {
                setSortField('date');
                setSortAsc(false);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#18181d] border border-zinc-800 hover:bg-zinc-800/80 rounded-xl text-xs text-zinc-300 transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
            <span>{sortField === 'date' ? (sortAsc ? 'Oldest First' : 'Newest First') : 'Sort by Date'}</span>
          </button>
        </div>
      </div>

      {/* Transactions List Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">
              All Records ({filteredList.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Total: {formatMoney(filteredList.reduce((acc, curr) => acc + curr.convertedAmount, 0), user.homeCurrency)}
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">No transactions found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search query or filters, or record a new voice expense.
            </p>
            <Button onClick={onOpenVoiceModal} variant="outline" size="sm">
              <Mic className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
              Speak an Expense
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredList.map((expense) => {
              const isForeign = expense.originalCurrency !== user.homeCurrency;

              return (
                <div
                  key={expense.id}
                  className="p-4 hover:bg-[#16161a] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        expense.isVoiceInput
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60'
                      }`}
                    >
                      {expense.isVoiceInput ? <Mic className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {expense.description}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-300 rounded-md border border-zinc-700/60">
                          {expense.category}
                        </span>
                        {expense.isVoiceInput && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">
                            Voice
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          {expense.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-zinc-500" />
                          {expense.paymentMethod}
                        </span>
                        {expense.tags && expense.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-500">#{expense.tags.join(', #')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-base text-white">
                        {formatMoney(expense.convertedAmount, user.homeCurrency)}
                      </div>
                      {isForeign && (
                        <div className="text-[11px] text-blue-400 font-mono">
                          {formatMoney(expense.originalAmount, expense.originalCurrency)}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsEditing(true);
                        }}
                        title="Edit expense"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        title="Delete expense"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Edit / Add Modal */}
      {isEditing && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121215] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSaveModal}>
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">
                  {expenses.some((e) => e.id === editingExpense.id) ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Description / Merchant</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                    placeholder="e.g. Starbucks, Uber, Groceries"
                    className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={editingExpense.originalAmount || ''}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          originalAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Currency</label>
                    <select
                      value={editingExpense.originalCurrency}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, originalCurrency: e.target.value })
                      }
                      className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Category</label>
                    <select
                      value={editingExpense.category}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          category: e.target.value as CategoryType,
                        })
                      }
                      className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Payment Method</label>
                    <select
                      value={editingExpense.paymentMethod}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          paymentMethod: e.target.value as PaymentMethod,
                        })
                      }
                      className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                    >
                      {DEFAULT_PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Date</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="mt-1 w-full bg-[#18181d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-zinc-800 flex justify-end gap-2 bg-[#141418]">
                <Button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="white"
                  size="sm"
                  className="font-bold text-zinc-950"
                >
                  Save Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
