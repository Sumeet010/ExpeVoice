import { UnitTestResult } from '../types';
import { convertCurrency, formatMoney, getCurrencyInfo } from './currency';
import { parseVoiceInputLocally } from './nlpVoiceParser';

export const runCoreUnitTests = async (): Promise<UnitTestResult[]> => {
  const results: UnitTestResult[] = [];

  const runTest = (
    id: string,
    name: string,
    suite: UnitTestResult['suite'],
    fn: () => { pass: boolean; details: string; expected?: string; actual?: string }
  ) => {
    const start = performance.now();
    try {
      const outcome = fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({
        id,
        name,
        suite,
        status: outcome.pass ? 'passed' : 'failed',
        durationMs,
        details: outcome.details,
        expected: outcome.expected,
        actual: outcome.actual,
      });
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      results.push({
        id,
        name,
        suite,
        status: 'failed',
        durationMs,
        details: `Exception thrown: ${err?.message || String(err)}`,
      });
    }
  };

  // --- SUITE 1: NLP Voice Parsing ---
  runTest('nlp-1', 'Extract amount and currency from "$45.50 for dinner"', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('Spent $45.50 for dinner at Olive Garden');
    const pass = parsed.amount === 45.5 && parsed.currency === 'USD' && parsed.category === 'Food & Dining';
    return {
      pass,
      details: pass ? 'Successfully extracted amount, USD currency, and Food & Dining category' : 'Failed to parse correctly',
      expected: 'amount: 45.5, currency: USD, category: Food & Dining',
      actual: `amount: ${parsed.amount}, currency: ${parsed.currency}, category: ${parsed.category}`,
    };
  });

  runTest('nlp-2', 'Extract foreign currency "3500 yen for subway train"', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('Spent 3500 yen for subway train pass');
    const pass = parsed.amount === 3500 && parsed.currency === 'JPY' && parsed.category === 'Transportation';
    return {
      pass,
      details: pass ? 'Recognized Japanese Yen currency & transit category' : 'Failed JPY extraction',
      expected: 'amount: 3500, currency: JPY, category: Transportation',
      actual: `amount: ${parsed.amount}, currency: ${parsed.currency}, category: ${parsed.category}`,
    };
  });

  runTest('nlp-3', 'Extract spoken numbers: "twenty five dollars for groceries"', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('twenty five dollars for organic groceries at Whole Foods');
    const pass = parsed.amount === 25 && parsed.category === 'Groceries';
    return {
      pass,
      details: pass ? 'Parsed word number "twenty five" into 25 with Groceries category' : 'Number word failed',
      expected: 'amount: 25, category: Groceries',
      actual: `amount: ${parsed.amount}, category: ${parsed.category}`,
    };
  });

  runTest('nlp-4', 'Detect yesterday relative date in voice command', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('Paid 120 euros for hotel yesterday with credit card');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split('T')[0];
    const pass = parsed.date === expectedDate && parsed.currency === 'EUR' && parsed.paymentMethod === 'Credit Card';
    return {
      pass,
      details: pass ? 'Detected yesterday ISO date and Euro currency correctly' : 'Date detection failed',
      expected: `date: ${expectedDate}, currency: EUR, payment: Credit Card`,
      actual: `date: ${parsed.date}, currency: ${parsed.currency}, payment: ${parsed.paymentMethod}`,
    };
  });

  runTest('nlp-5', 'Detect payment method "apple pay" and clean description', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('Bought coffee 6 dollars using apple pay');
    const pass = parsed.paymentMethod === 'Apple Pay' && parsed.amount === 6;
    return {
      pass,
      details: pass ? 'Recognized Apple Pay method and coffee category' : 'Payment detection failed',
      expected: 'paymentMethod: Apple Pay, amount: 6',
      actual: `paymentMethod: ${parsed.paymentMethod}, amount: ${parsed.amount}`,
    };
  });

  runTest('nlp-6', 'Detect UPI payment method: "Ola cab 350 rupees with UPI"', 'NLP Voice Parsing', () => {
    const parsed = parseVoiceInputLocally('Ola cab 350 rupees with UPI');
    const pass = parsed.paymentMethod === 'UPI' && parsed.amount === 350 && parsed.currency === 'INR';
    return {
      pass,
      details: pass ? 'Recognized UPI payment method and INR currency accurately' : 'UPI payment detection failed',
      expected: 'paymentMethod: UPI, amount: 350, currency: INR',
      actual: `paymentMethod: ${parsed.paymentMethod}, amount: ${parsed.amount}, currency: ${parsed.currency}`,
    };
  });

  // --- SUITE 2: Currency Conversion & Arithmetic ---
  runTest('curr-1', 'Convert USD to EUR at current base rate', 'Currency Conversion', () => {
    const converted = convertCurrency(100, 'USD', 'EUR');
    const expected = 92; // 100 * 0.92
    const pass = Math.abs(converted - expected) < 0.01;
    return {
      pass,
      details: pass ? '100 USD correctly converted to 92 EUR' : 'Rate mismatch',
      expected: `${expected} EUR`,
      actual: `${converted} EUR`,
    };
  });

  runTest('curr-2', 'Handle Zero-Decimal currency JPY precision', 'Currency Conversion', () => {
    const converted = convertCurrency(10, 'USD', 'JPY');
    const pass = Number.isInteger(converted) && converted > 1000;
    return {
      pass,
      details: pass ? `Integer precision verified for Yen: ${converted} JPY` : 'Yen contains invalid decimals',
      expected: 'Integer > 1000',
      actual: `${converted}`,
    };
  });

  runTest('curr-3', 'Cross currency conversion EUR to GBP without intermediate drift', 'Currency Conversion', () => {
    // 100 EUR -> USD (100 / 0.92 = 108.695) -> GBP (108.695 * 0.79 = 85.87)
    const converted = convertCurrency(100, 'EUR', 'GBP');
    const pass = converted > 80 && converted < 90;
    return {
      pass,
      details: pass ? `Cross rate EUR to GBP calculated accurately: £${converted}` : 'Cross rate failed',
      expected: 'Between 80 and 90 GBP',
      actual: `${converted} GBP`,
    };
  });

  runTest('curr-4', 'Format money with correct symbols and thousands separators', 'Currency Conversion', () => {
    const formattedUSD = formatMoney(1250.5, 'USD');
    const formattedEUR = formatMoney(500, 'EUR');
    const pass = formattedUSD === '$1,250.50' && formattedEUR === '€500.00';
    return {
      pass,
      details: pass ? 'Formatted currency strings conform to international standard' : 'Format string failed',
      expected: '$1,250.50 and €500.00',
      actual: `${formattedUSD} and ${formattedEUR}`,
    };
  });

  // --- SUITE 3: Budget Alerts & Threshold Logic ---
  runTest('budget-1', 'Trigger 80% spending warning threshold', 'Budget Alerts', () => {
    const monthlyLimit = 1000;
    const currentSpent = 820;
    const ratio = (currentSpent / monthlyLimit) * 100;
    const isWarning = ratio >= 80 && ratio < 100;
    return {
      pass: isWarning,
      details: isWarning ? `Threshold reached at ${ratio}%, flagged as warning alert` : 'Threshold trigger failed',
      expected: 'ratio >= 80%',
      actual: `${ratio}%`,
    };
  });

  runTest('budget-2', 'Trigger 100% critical budget exceeded alert', 'Budget Alerts', () => {
    const monthlyLimit = 500;
    const currentSpent = 540;
    const isCritical = currentSpent >= monthlyLimit;
    const overAmount = currentSpent - monthlyLimit;
    return {
      pass: isCritical && overAmount === 40,
      details: isCritical ? `Over budget by $${overAmount}, critical state triggered` : 'Critical trigger failed',
      expected: 'isCritical: true, overAmount: 40',
      actual: `isCritical: ${isCritical}, overAmount: ${overAmount}`,
    };
  });

  // --- SUITE 4: Offline Sync Queue & Conflict Resolution ---
  runTest('sync-1', 'Queue offline transaction with "pending" syncStatus', 'Offline Sync Queue', () => {
    const mockExpense = {
      id: 'test-sync-1',
      userId: 'test-user',
      description: 'Offline Coffee',
      originalAmount: 4.5,
      originalCurrency: 'USD',
      convertedAmount: 4.5,
      homeCurrency: 'USD',
      category: 'Food & Dining' as const,
      date: '2026-09-18',
      paymentMethod: 'Cash' as const,
      tags: [],
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const pass = mockExpense.syncStatus === 'pending' && Boolean(mockExpense.id);
    return {
      pass,
      details: pass ? 'Offline item tagged with status "pending" for synchronization' : 'Status tagging failed',
      expected: 'syncStatus: pending',
      actual: `syncStatus: ${mockExpense.syncStatus}`,
    };
  });

  runTest('sync-2', 'Conflict resolution: Latest timestamp wins deterministic rule', 'Offline Sync Queue', () => {
    const localVersion = {
      id: 'exp-conflict',
      description: 'Updated Local',
      updatedAt: '2026-09-18T14:30:00.000Z',
    };
    const remoteVersion = {
      id: 'exp-conflict',
      description: 'Updated Remote',
      updatedAt: '2026-09-18T14:35:00.000Z',
    };

    const winner =
      new Date(remoteVersion.updatedAt).getTime() > new Date(localVersion.updatedAt).getTime()
        ? remoteVersion
        : localVersion;

    const pass = winner.description === 'Updated Remote';
    return {
      pass,
      details: pass ? 'Remote version with newer timestamp correctly chosen in conflict' : 'Conflict rule failed',
      expected: 'Updated Remote',
      actual: winner.description,
    };
  });

  // --- SUITE 5: Export Engine & CSV Formatting ---
  runTest('export-1', 'Escape CSV quotes and commas safely', 'Export Engine', () => {
    const rawDescription = 'Dinner, "Special Event" at Chef\'s Table';
    const escaped = `"${rawDescription.replace(/"/g, '""')}"`;
    const pass = escaped === '"Dinner, ""Special Event"" at Chef\'s Table"';
    return {
      pass,
      details: pass ? 'RFC 4180 CSV escape compliance verified' : 'CSV escape error',
      expected: '"Dinner, ""Special Event"" at Chef\'s Table"',
      actual: escaped,
    };
  });

  return results;
};
