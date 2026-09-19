import React, { useState, useMemo } from 'react';
import {
  Globe,
  ArrowRightLeft,
  Compass,
  CreditCard,
  Receipt,
  Plane,
  Coins,
} from 'lucide-react';
import { Expense, UserProfile } from '../types';
import {
  convertCurrency,
  formatMoney,
  getCurrencyInfo,
  SUPPORTED_CURRENCIES,
} from '../services/currency';
import { currencyOfflineCache } from '../services/currencyOfflineCache';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface TravelCurrencyViewProps {
  user: UserProfile;
  expenses: Expense[];
  onUpdateUser: (user: UserProfile) => void;
}

export const TravelCurrencyView: React.FC<TravelCurrencyViewProps> = ({
  user,
  expenses,
  onUpdateUser,
}) => {
  const [targetCurrency, setTargetCurrency] = useState(user.targetTravelCurrency || 'USD');
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcDirection, setCalcDirection] = useState<'targetToHome' | 'homeToTarget'>('targetToHome');
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const cachedRatesData = currencyOfflineCache.getRates();

  const handleRefreshRates = async () => {
    setIsSyncingRates(true);
    try {
      await currencyOfflineCache.syncRatesFromApi();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingRates(false);
    }
  };

  const homeInfo = getCurrencyInfo(user.homeCurrency);
  const targetInfo = getCurrencyInfo(targetCurrency);

  // Conversion result
  const convertedResult = useMemo(() => {
    if (calcDirection === 'targetToHome') {
      return convertCurrency(calcAmount, targetCurrency, user.homeCurrency);
    } else {
      return convertCurrency(calcAmount, user.homeCurrency, targetCurrency);
    }
  }, [calcAmount, targetCurrency, user.homeCurrency, calcDirection]);

  // Rate between the two
  const unitExchangeRate = useMemo(() => {
    return convertCurrency(1, targetCurrency, user.homeCurrency);
  }, [targetCurrency, user.homeCurrency]);

  // Traveler quick cheat sheet values
  const cheatSheetValues = useMemo(() => {
    const isHighUnit = ['JPY', 'KRW', 'INR'].includes(targetCurrency);
    const steps = isHighUnit ? [500, 1000, 2500, 5000, 10000, 20000] : [5, 10, 20, 50, 100, 200];

    return steps.map((val) => ({
      foreign: formatMoney(val, targetCurrency),
      home: formatMoney(convertCurrency(val, targetCurrency, user.homeCurrency), user.homeCurrency),
    }));
  }, [targetCurrency, user.homeCurrency]);

  // Foreign currency transactions
  const foreignExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.originalCurrency.toUpperCase() !== user.homeCurrency.toUpperCase()
    );
  }, [expenses, user.homeCurrency]);

  const foreignTotalHome = useMemo(() => {
    return foreignExpenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  }, [foreignExpenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 tracking-widest uppercase">
            OVERVIEW
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-0.5">
            Travel & FX Engine
          </h1>
        </div>

        {/* Currency Controls: Base Currency & Travel Destination */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Base Currency Option */}
          <div className="flex items-center gap-2 bg-[#121215] border border-zinc-800 p-1.5 rounded-xl">
            <span className="text-xs text-zinc-400 pl-2 font-medium">Base Currency:</span>
            <select
              value={user.homeCurrency}
              onChange={(e) => onUpdateUser({ ...user, homeCurrency: e.target.value })}
              className="bg-[#18181d] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Target Travel Destination Selector */}
          <div className="flex items-center gap-2 bg-[#121215] border border-zinc-800 p-1.5 rounded-xl">
            <span className="text-xs text-zinc-400 pl-2 font-medium">Destination:</span>
            <select
              value={targetCurrency}
              onChange={(e) => {
                setTargetCurrency(e.target.value);
                onUpdateUser({ ...user, targetTravelCurrency: e.target.value });
              }}
              className="bg-[#18181d] border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Rates API to Offline LocalStorage Button */}
          <button
            onClick={handleRefreshRates}
            disabled={isSyncingRates}
            title="Fetch Currency Rates API and store in LocalStorage for offline synchronization"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121215] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSyncingRates ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
            ) : syncSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>{isSyncingRates ? 'Syncing...' : syncSuccess ? 'Rates Cached!' : 'Sync Rates Offline'}</span>
          </button>
        </div>
      </div>

      {/* Top Travel FX Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Spot Rate</span>
            <Compass className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            1 {targetCurrency} = {formatMoney(unitExchangeRate, user.homeCurrency)}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Live fixed offline rate cached for {targetInfo.name}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Foreign Spend</span>
            <Plane className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            {formatMoney(foreignTotalHome, user.homeCurrency)}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Across {foreignExpenses.length} multi-currency transactions
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Travel Base</span>
            <Globe className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white flex items-center gap-2">
            <span>{homeInfo.flag}</span>
            <span>{homeInfo.code}</span>
            <span className="text-xs font-normal text-zinc-400">({homeInfo.name})</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            All expenses convert automatically to {homeInfo.code}
          </p>
        </div>
      </div>

      {/* Interactive FX Converter & Cheat Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Rate Converter */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-white">Instant Offline FX Calculator</h3>
            </div>
            <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700/80 bg-zinc-800/50">
              Zero Latency
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                Amount to convert:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#18181d] border border-zinc-800 rounded-xl px-4 py-2.5 text-base font-bold text-white font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-zinc-400">
                  {calcDirection === 'targetToHome' ? targetCurrency : user.homeCurrency}
                </span>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={() =>
                  setCalcDirection((prev) =>
                    prev === 'targetToHome' ? 'homeToTarget' : 'targetToHome'
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-[#18181d] hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  {calcDirection === 'targetToHome'
                    ? `${targetCurrency} → ${user.homeCurrency}`
                    : `${user.homeCurrency} → ${targetCurrency}`}
                </span>
              </button>
            </div>

            {/* Converted Output Display */}
            <div className="p-4 rounded-xl bg-[#18181d] border border-zinc-800 text-center space-y-1">
              <div className="text-xs text-zinc-400 font-medium">Converted Value</div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {formatMoney(
                  convertedResult,
                  calcDirection === 'targetToHome' ? user.homeCurrency : targetCurrency
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Formula: {calcAmount} ×{' '}
                {calcDirection === 'targetToHome'
                  ? (1 / targetInfo.rateToUSD * homeInfo.rateToUSD).toFixed(4)
                  : (1 / homeInfo.rateToUSD * targetInfo.rateToUSD).toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Travel Pocket Cheat Sheet */}
        <div className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Traveler Pocket FX Matrix</h3>
            <span className="text-[10px] text-zinc-400 font-mono">Quick reference</span>
          </div>
          <p className="text-xs text-zinc-400">
            Common price points in {targetInfo.name} ({targetCurrency}) mapped to your base {user.homeCurrency}:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {cheatSheetValues.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#16161a] border border-zinc-800/70 text-center space-y-1"
              >
                <div className="text-xs font-bold text-zinc-400 font-mono">{item.foreign}</div>
                <div className="text-xs text-zinc-600 font-bold">≈</div>
                <div className="text-sm font-bold text-white font-mono">{item.home}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
