import { CurrencyRate } from '../types';

export const SUPPORTED_CURRENCIES: CurrencyRate[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToUSD: 83.9, flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 0.79, flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 153.5, flag: '🇯🇵' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateToUSD: 3.67, flag: '🇦🇪' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateToUSD: 1.38, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 1.54, flag: '🇦🇺' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToUSD: 1.35, flag: '🇸🇬' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rateToUSD: 0.88, flag: '🇨🇭' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', rateToUSD: 19.8, flag: '🇲🇽' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToUSD: 7.23, flag: '🇨🇳' },
];

export const getCurrencyInfo = (code?: string): CurrencyRate => {
  const normalized = (code || 'INR').toUpperCase().trim();
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === normalized);
  return (
    found || {
      code: normalized,
      name: normalized,
      symbol: normalized === 'INR' ? '₹' : normalized,
      rateToUSD: 1.0,
      flag: normalized === 'INR' ? '🇮🇳' : '🌐',
    }
  );
};

export const convertCurrency = (
  amount: number,
  fromCode: string,
  toCode: string
): number => {
  if (!amount || isNaN(amount)) return 0;
  const fromNormalized = (fromCode || 'INR').toUpperCase();
  const toNormalized = (toCode || 'INR').toUpperCase();
  if (fromNormalized === toNormalized) return Math.round(amount * 100) / 100;

  const from = getCurrencyInfo(fromNormalized);
  const to = getCurrencyInfo(toNormalized);

  // amount in USD = amount / from.rateToUSD
  // amount in target = (amount / from.rateToUSD) * to.rateToUSD
  const amountInUSD = amount / from.rateToUSD;
  const converted = amountInUSD * to.rateToUSD;

  // Yen or zero decimal currencies
  if (to.code === 'JPY') {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
};

export const formatMoney = (
  amount: number,
  currencyCode: string = 'INR',
  showSymbol: boolean = true
): string => {
  const info = getCurrencyInfo(currencyCode);
  const isZeroDec = ['JPY', 'KRW'].includes(info.code);
  const locale = info.code === 'INR' ? 'en-IN' : 'en-US';
  const formattedNum = new Intl.NumberFormat(locale, {
    minimumFractionDigits: isZeroDec ? 0 : (info.code === 'INR' && amount % 1 === 0 ? 0 : 2),
    maximumFractionDigits: isZeroDec ? 0 : 2,
  }).format(amount || 0);

  return showSymbol ? `${info.symbol}${info.symbol === 'AED' ? ' ' : ''}${formattedNum}` : formattedNum;
};
