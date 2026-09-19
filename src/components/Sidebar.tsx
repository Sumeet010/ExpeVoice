import React, { useState } from 'react';
import {
  LayoutGrid,
  Receipt,
  Target,
  Globe,
  Mic,
  FileSpreadsheet,
  FileCode2,
  ChevronRight,
  Sparkles,
  Settings2,
  LogOut,
  X,
  Type,
  Coins,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { BudgetLimit, Expense, UserProfile } from '../types';
import { formatMoney, getCurrencyInfo, SUPPORTED_CURRENCIES } from '../services/currency';
import { Button } from './ui/button';

export const FONT_OPTIONS: Array<{
  id: 'sora' | 'outfit' | 'editorial' | 'dm-sans';
  name: string;
  sub: string;
}> = [
  { id: 'sora', name: 'Sora & Manrope', sub: 'Fintech Precision' },
  { id: 'outfit', name: 'Outfit & Jakarta', sub: 'Neo-Grotesque Tech' },
  { id: 'editorial', name: 'Newsreader Serif', sub: 'Executive Editorial' },
  { id: 'dm-sans', name: 'DM Sans', sub: 'Contemporary Clean' },
];

interface SidebarProps {
  currentTab: 'dashboard' | 'expenses' | 'budgets' | 'travel';
  setCurrentTab: (tab: 'dashboard' | 'expenses' | 'budgets' | 'travel') => void;
  user: UserProfile;
  expenses: Expense[];
  budgets: BudgetLimit[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenVoiceModal: () => void;
  onOpenExportModal: () => void;
  onOpenTestModal?: () => void;
  onOpenDocsModal: () => void;
  onOpenAuthModal?: () => void;
  onOpenDbModal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  expenses,
  budgets,
  onUpdateUser,
  onOpenVoiceModal,
  onOpenExportModal,
  onOpenTestModal,
  onOpenDocsModal,
  onOpenAuthModal,
  onOpenDbModal,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const currentFontTheme = user.fontTheme || 'sora';

  // Quick calculations for active sidebar widget
  const totalLimit = budgets.find((b) => b.category === 'Total')?.monthlyLimit || user.monthlyBudget || 3500;
  const currentMonthSpent = expenses
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((acc, curr) => acc + curr.convertedAmount, 0);

  const remaining = Math.max(0, totalLimit - currentMonthSpent);
  const spentPercent = totalLimit > 0 ? Math.min(100, Math.round((currentMonthSpent / totalLimit) * 100)) : 0;

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'expenses' as const,
      label: 'Transactions',
      icon: Receipt,
    },
    {
      id: 'budgets' as const,
      label: 'Budgets & Limits',
      icon: Target,
    },
    {
      id: 'travel' as const,
      label: 'Travel & FX',
      icon: Globe,
    },
  ];

  // User initials
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SG';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0d0d10] border-r border-zinc-800/80 transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              ExpeVoice
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Manage Expenses Easily.
            </p>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#fcf8ec] text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-zinc-950' : 'text-zinc-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Widget (Reference to "ACTIVE MATCHES" in reference image) */}
        <div className="px-3 pt-4">
          <div className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase px-3 pb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Active Budget
          </div>
          <div className="bg-[#141418] border border-zinc-800/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                ACTIVE
              </span>
              <span className="text-zinc-400 font-mono">
                {formatMoney(totalLimit, user.homeCurrency)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-zinc-400">Spent</span>
                <span className="font-bold text-white">
                  {formatMoney(currentMonthSpent, user.homeCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-zinc-400">Remaining</span>
                <span className="font-medium text-emerald-400">
                  {formatMoney(remaining, user.homeCurrency)}
                </span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercent >= 100
                    ? 'bg-rose-500'
                    : spentPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>

            {/* Quick Voice Entry inside card */}
            <button
              id="sidebar-quick-voice-btn"
              onClick={() => {
                onOpenVoiceModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Mic className="h-3.5 w-3.5 text-zinc-900" />
              <span>Voice Entry</span>
            </button>
          </div>
        </div>

        {/* Secondary Shortcuts & Tools */}
        <div className="px-3 pt-5 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase px-3 pb-1">
            Tools & Reports
          </div>

          <button
            onClick={() => {
              onOpenExportModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-400" />
              Export Statements
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          </button>

          <button
            onClick={() => {
              onOpenDocsModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <FileCode2 className="h-3.5 w-3.5 text-zinc-400" />
              Architecture Docs
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          </button>
        </div>

        {/* Font Style Selector Pill */}
        <div className="px-6 pt-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowFontDropdown(!showFontDropdown);
                setShowCurrencyDropdown(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-zinc-400">
                <Type className="h-3.5 w-3.5 text-zinc-400" />
                Font Style
              </span>
              <span className="font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded text-[11px] truncate max-w-[90px]">
                {FONT_OPTIONS.find((f) => f.id === currentFontTheme)?.name.split(' ')[0] || 'Sora'}
              </span>
            </button>

            {showFontDropdown && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 space-y-1 z-30">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Select Typography Pairing
                </div>
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onUpdateUser({ ...user, fontTheme: font.id });
                      document.documentElement.setAttribute('data-font-theme', font.id);
                      localStorage.removeItem('vocal_ledger_font_theme');
                      sessionStorage.setItem('vocal_ledger_font_theme', font.id);
                      setShowFontDropdown(false);
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-lg transition-colors flex items-center justify-between ${
                      currentFontTheme === font.id
                        ? 'bg-white text-zinc-950'
                        : 'text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold leading-tight">{font.name}</div>
                      <div
                        className={`text-[10px] ${
                          currentFontTheme === font.id ? 'text-zinc-600' : 'text-zinc-400'
                        }`}
                      >
                        {font.sub}
                      </div>
                    </div>
                    {currentFontTheme === font.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-950" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Currency Selector Pill */}
        <div className="px-6 pt-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowCurrencyDropdown(!showCurrencyDropdown);
                setShowFontDropdown(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 text-zinc-400">
                <Coins className="h-3.5 w-3.5 text-zinc-400" />
                Base Currency
              </span>
              <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                <span>{getCurrencyInfo(user.homeCurrency).flag}</span>
                <span>{user.homeCurrency}</span>
              </span>
            </button>

            {showCurrencyDropdown && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-30 max-h-64 overflow-y-auto space-y-1">
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Base Currency
                  </span>
                  <span className="text-[10px] text-zinc-400">Default: INR (₹)</span>
                </div>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onUpdateUser({ ...user, homeCurrency: c.code });
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                      user.homeCurrency === c.code
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{c.flag}</span>
                      <span>{c.code}</span>
                      <span className="text-[11px] opacity-70">({c.symbol})</span>
                    </span>
                    {user.homeCurrency === c.code ? (
                      <span className="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 truncate max-w-[70px]">
                        {c.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Profile Bar (Google OAuth Account or Sign In) */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-[#0d0d10]">
          {user.authProvider === 'google' ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center gap-2.5 text-left group min-w-0 flex-1 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-zinc-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#0d0d10] flex items-center justify-center">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate max-w-[105px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate max-w-[105px]">
                    {user.email}
                  </span>
                </div>
              </button>

              <button
                title="Google Account details & security"
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (onOpenAuthModal) onOpenAuthModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
              <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
                <span>Guest Mode</span>
                <span>Local Storage</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
