import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Calendar,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { BudgetLimit, Expense, UserProfile } from '../types';
import { exportExpensesToCSV, exportExpensesToPDF } from '../services/exportReports';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  user: UserProfile;
  budgets: BudgetLimit[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  user,
  budgets,
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
  const [range, setRange] = useState<'all' | 'month' | '30days'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      let matchDate = true;
      if (range === 'month') {
        matchDate =
          expDate.getFullYear() === now.getFullYear() &&
          expDate.getMonth() === now.getMonth();
      } else if (range === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        matchDate = expDate >= d;
      }
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchDate && matchCat;
    });
  };

  const handleExport = () => {
    setIsExporting(true);
    const dataToExport = getFilteredExpenses();

    setTimeout(() => {
      if (format === 'csv') {
        exportExpensesToCSV(dataToExport, user.homeCurrency);
      } else {
        const title =
          range === 'month'
            ? 'Monthly Expense Statement'
            : range === '30days'
            ? '30-Day Financial Report'
            : 'Comprehensive Financial Report';
        exportExpensesToPDF(dataToExport, user, budgets, title);
      }
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    }, 400);
  };

  const exportCount = getFilteredExpenses().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0e0e12]/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">Export Financial Reports</h3>
              <p className="text-xs text-zinc-400">Generate structured CSV or branded PDF reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Format selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  format === 'pdf'
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700'
                }`}
              >
                <FileText className="h-5 w-5 text-zinc-200" />
                <div className="text-left">
                  <div>PDF Statement</div>
                  <div className="text-[10px] font-normal text-zinc-400">Branded ledger</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 text-zinc-200" />
                <div className="text-left">
                  <div>CSV Spreadsheet</div>
                  <div className="text-[10px] font-normal text-zinc-400">Excel, Sheets, etc.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Time Range
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRange('month')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  range === 'month'
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-white'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setRange('30days')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  range === '30days'
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-white'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('all')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  range === 'all'
                    ? 'bg-zinc-800 text-white border-zinc-600'
                    : 'bg-[#16161a] text-zinc-400 border-zinc-800/80 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="all">All Categories</option>
              {[
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
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Export Details Summary */}
          <div className="p-3 bg-[#16161a] rounded-xl border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <span>Transactions Included:</span>
            <strong className="text-white font-bold">{exportCount} records</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-[#0e0e12]/60 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportCount === 0}
            className="px-5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {isExporting ? 'Generating...' : `Export ${format.toUpperCase()}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
