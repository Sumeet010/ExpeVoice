import { CategoryType, ParsedVoiceResult, PaymentMethod } from '../types';
import { SUPPORTED_CURRENCIES } from './currency';

const CATEGORY_KEYWORDS: Record<CategoryType, string[]> = {
  'Food & Dining': [
    'coffee', 'starbucks', 'cafe', 'dinner', 'lunch', 'breakfast', 'brunch', 'restaurant',
    'pizza', 'burger', 'sushi', 'taco', 'bakery', 'ramen', 'beer', 'wine', 'bar', 'pub',
    'drinks', 'cocktail', 'mcdonalds', 'chipotle', 'food', 'meal', 'snack', 'ice cream'
  ],
  'Groceries': [
    'groceries', 'grocery', 'supermarket', 'trader joe', 'whole foods', 'costco', 'walmart',
    'safeway', 'kroger', 'target grocery', 'vegetables', 'fruit', 'milk', 'bread', 'meat', 'eggs'
  ],
  'Transportation': [
    'uber', 'lyft', 'taxi', 'cab', 'subway', 'metro', 'train', 'bus', 'transit', 'gas',
    'petrol', 'fuel', 'parking', 'toll', 'ev charging', 'scooter', 'bike share', 'rail'
  ],
  'Travel': [
    'flight', 'airline', 'delta', 'united', 'hotel', 'airbnb', 'hostel', 'resort',
    'luggage', 'boarding pass', 'shuttle', 'car rental', 'booking', 'excursion', 'tour', 'travel'
  ],
  'Shopping': [
    'amazon', 'shopping', 'clothes', 'clothing', 'shoes', 'electronics', 'apple store',
    'best buy', 'zara', 'h&m', 'ikea', 'department store', 'gift', 'mall', 'hardware'
  ],
  'Entertainment': [
    'netflix', 'spotify', 'movie', 'cinema', 'theatre', 'theater', 'concert', 'ticket',
    'hulu', 'disney', 'steam', 'playstation', 'xbox', 'game', 'bowling', 'museum'
  ],
  'Health & Wellness': [
    'gym', 'pharmacy', 'cvs', 'walgreens', 'doctor', 'dentist', 'clinic', 'medicine',
    'prescription', 'hospital', 'massage', 'therapy', 'vitamins', 'optometrist'
  ],
  'Utilities': [
    'electric', 'electricity', 'water bill', 'internet', 'wifi', 'broadband', 'phone bill',
    'cellular', 'at&t', 'verizon', 't-mobile', 'utility', 'trash', 'sewer'
  ],
  'Housing': [
    'rent', 'mortgage', 'hoa', 'home insurance', 'plumber', 'electrician', 'appliance',
    'furniture', 'home depot', 'lowes', 'repairs'
  ],
  'Education': [
    'tuition', 'course', 'coursera', 'udemy', 'textbook', 'book', 'class', 'workshop',
    'training', 'school supplies'
  ],
  'Personal Care': [
    'haircut', 'salon', 'barber', 'manicure', 'pedicure', 'skincare', 'cosmetics', 'spa'
  ],
  'Other': []
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
};

const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR',
  'rupee': 'INR',
  'rupees': 'INR',
  'rs': 'INR',
  'rs.': 'INR',
  'inr': 'INR',
  '$': 'USD',
  'dollar': 'USD',
  'dollars': 'USD',
  'buck': 'USD',
  'bucks': 'USD',
  'usd': 'USD',
  '€': 'EUR',
  'euro': 'EUR',
  'euros': 'EUR',
  'eur': 'EUR',
  '£': 'GBP',
  'pound': 'GBP',
  'pounds': 'GBP',
  'gbp': 'GBP',
  '¥': 'JPY',
  'yen': 'JPY',
  'jpy': 'JPY',
  'cad': 'CAD',
  'aud': 'AUD',
  'chf': 'CHF',
  'franc': 'CHF',
  'francs': 'CHF',
  'aed': 'AED',
  'dirham': 'AED',
  'dirhams': 'AED',
  'peso': 'MXN',
  'pesos': 'MXN',
  'mxn': 'MXN',
  'singapore dollar': 'SGD',
  'sgd': 'SGD',
  'yuan': 'CNY',
  'cny': 'CNY',
};

export const parseVoiceInputLocally = (
  text: string,
  defaultCurrency: string = 'INR'
): ParsedVoiceResult => {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Extract Currency
  let detectedCurrency = defaultCurrency;
  for (const [kw, code] of Object.entries(CURRENCY_MAP)) {
    // Regex boundary check
    const regex = new RegExp(`(^|\\s|\\d)${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|\\.)`, 'i');
    if (regex.test(lower)) {
      detectedCurrency = code;
      break;
    }
  }

  // 2. Extract Amount
  let detectedAmount = 0;
  // Match digits with optional decimals: $45, 45.50, 45 dollars
  const numericMatch = clean.match(/(?:[\$€£¥₹]\s*)?(\d+(?:[.,]\d{1,2})?)/);
  if (numericMatch) {
    const rawVal = numericMatch[1].replace(',', '.');
    detectedAmount = parseFloat(rawVal);
  } else {
    // Try word numbers (e.g. "twenty five dollars")
    const words = lower.split(/\s+/);
    let tempSum = 0;
    let currentVal = 0;
    for (const w of words) {
      if (NUMBER_WORDS[w] !== undefined) {
        const n = NUMBER_WORDS[w];
        if (n === 100) {
          currentVal = (currentVal || 1) * 100;
        } else if (n === 1000) {
          tempSum += (currentVal || 1) * 1000;
          currentVal = 0;
        } else {
          currentVal += n;
        }
      }
    }
    tempSum += currentVal;
    if (tempSum > 0) {
      detectedAmount = tempSum;
    }
  }

  // 3. Extract Category
  let detectedCategory: CategoryType = 'Other';
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CategoryType, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const score = kw.length; // prioritize longer specific matches
        if (score > highestScore) {
          highestScore = score;
          detectedCategory = category;
        }
      }
    }
  }

  // 4. Extract Date
  let detectedDate = new Date().toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    detectedDate = d.toISOString().split('T')[0];
  } else if (lower.includes('two days ago')) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    detectedDate = d.toISOString().split('T')[0];
  }

  // 5. Extract Payment Method
  let detectedPayment: PaymentMethod = 'UPI'; // default or UPI if indicated
  if (
    lower.includes('upi') ||
    lower.includes('gpay') ||
    lower.includes('google pay') ||
    lower.includes('phonepe') ||
    lower.includes('paytm') ||
    lower.includes('bhim') ||
    lower.includes('qr') ||
    lower.includes('scan')
  ) {
    detectedPayment = 'UPI';
  } else if (lower.includes('cash')) {
    detectedPayment = 'Cash';
  } else if (lower.includes('apple pay') || lower.includes('applepay')) {
    detectedPayment = 'Apple Pay';
  } else if (lower.includes('debit')) {
    detectedPayment = 'Debit Card';
  } else if (lower.includes('credit card') || lower.includes('card')) {
    detectedPayment = 'Credit Card';
  } else if (lower.includes('bank transfer') || lower.includes('wire') || lower.includes('ach') || lower.includes('net banking') || lower.includes('neft') || lower.includes('rtgs') || lower.includes('imps')) {
    detectedPayment = 'Bank Transfer';
  } else if (lower.includes('other') || lower.includes('others') || lower.includes('cheque') || lower.includes('crypto')) {
    detectedPayment = 'Others';
  } else {
    detectedPayment = 'UPI';
  }

  // 6. Clean Description
  // Strip common voice command filler words: "spent", "paid", "add expense for", amounts, currencies
  let description = clean
    .replace(/^(i spent|spent|paid|add|bought|charge|recorded|logged|purchase of)\s+/i, '')
    .replace(/(?:for|on|at)\s+/i, '')
    .replace(/(?:with|by|using|via|through)\s+(?:upi|gpay|google pay|phonepe|paytm|bhim|cash|card|credit card|debit card|apple pay|bank transfer|others?)/i, '')
    .trim();

  // If description starts with an amount or currency, clean it up
  description = description
    .replace(/^[\$€£¥₹]?\d+(?:\.\d{1,2})?\s*(?:dollars|bucks|euros|yen|pounds|usd|eur|jpy|gbp)?\s*(?:for|on|at)?\s*/i, '')
    .trim();

  if (!description) {
    description = detectedCategory !== 'Other' ? `${detectedCategory} expense` : 'Voice Expense';
  } else {
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // Extract tags
  const tags: string[] = [];
  if (detectedCategory !== 'Other') tags.push(detectedCategory.toLowerCase().replace(/\s+/g, '-'));
  if (detectedCurrency !== defaultCurrency) tags.push('travel');
  tags.push('voice-logged');

  const confidence = detectedAmount > 0 && detectedCategory !== 'Other' ? 0.95 : 0.78;

  return {
    rawTranscript: text,
    description,
    amount: detectedAmount || 0,
    currency: detectedCurrency,
    category: detectedCategory,
    date: detectedDate,
    paymentMethod: detectedPayment,
    confidence,
    tags,
  };
};

/**
 * Enhanced AI voice parser that attempts server-side Gemini 2.5 Flash parsing,
 * falling back seamlessly to client-side rule-based NLP if server or network is unavailable.
 */
export const parseVoiceWithAI = async (
  transcript: string,
  defaultCurrency: string = 'INR'
): Promise<ParsedVoiceResult> => {
  try {
    const res = await fetch('/api/ai/parse-expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, defaultCurrency }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.amount !== undefined) {
        return {
          rawTranscript: transcript,
          description: data.description || 'Voice Expense',
          amount: Number(data.amount) || 0,
          currency: data.currency || defaultCurrency,
          category: data.category || 'Other',
          date: data.date || new Date().toISOString().split('T')[0],
          paymentMethod: data.paymentMethod || 'Credit Card',
          confidence: data.confidence || 0.98,
          tags: data.tags || ['voice-logged'],
        };
      }
    }
  } catch (err) {
    console.warn('AI endpoint unavailable or offline, using local NLP parser:', err);
  }

  return parseVoiceInputLocally(transcript, defaultCurrency);
};
