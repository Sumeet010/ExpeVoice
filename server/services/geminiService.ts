import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Gemini AI client:', e);
    }
  }
  return aiClient;
}

export async function parseVoiceExpenseWithGemini(
  transcript: string,
  defaultCurrency = 'INR'
) {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a financial NLP entity extractor for an expense tracking app.
Extract the expense details from the following user spoken text into strict JSON format.

User Transcript: "${transcript}"
Default Currency: "${defaultCurrency}"
Today's Date: "${new Date().toISOString().split('T')[0]}"

Supported Categories:
- Food & Dining
- Transportation
- Groceries
- Shopping
- Travel
- Entertainment
- Health & Wellness
- Utilities
- Housing
- Education
- Personal Care
- Other

Output schema rules:
- description: concise clean title (e.g., "Starbucks Coffee", "Uber Ride", "Groceries at Trader Joe's").
- amount: positive numeric value (e.g., 45.5).
- currency: standard 3-letter currency code (e.g., "USD", "EUR", "GBP", "JPY", "CAD", "INR", "AUD").
- category: strictly one of the supported categories above.
- date: ISO date string YYYY-MM-DD (resolve relative dates like "yesterday", "today").
- paymentMethod: strictly one of ["Cash", "Credit Card", "Debit Card", "Apple Pay", "Bank Transfer"].
- tags: array of 1-3 short strings.
- confidence: number between 0.8 and 1.0.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
              paymentMethod: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              confidence: { type: Type.NUMBER },
            },
            required: [
              'description',
              'amount',
              'currency',
              'category',
              'date',
              'paymentMethod',
            ],
          },
        },
      });

      const parsedJson = JSON.parse(response.text?.trim() || '{}');
      return parsedJson;
    } catch (err) {
      console.warn('Gemini NLP parsing failed, falling back to heuristic:', err);
    }
  }

  // Fallback heuristic parsing
  const lower = transcript.toLowerCase();
  let amount = 0;
  const numMatch = transcript.match(/(?:[\$€£¥₹]\s*)?(\d+(?:[.,]\d{1,2})?)/);
  if (numMatch) {
    amount = parseFloat(numMatch[1].replace(',', '.'));
  }

  let currency = defaultCurrency;
  if (lower.includes('yen') || lower.includes('¥') || lower.includes('jpy')) currency = 'JPY';
  else if (lower.includes('euro') || lower.includes('€') || lower.includes('eur')) currency = 'EUR';
  else if (lower.includes('pound') || lower.includes('£') || lower.includes('gbp')) currency = 'GBP';
  else if (lower.includes('rupee') || lower.includes('₹') || lower.includes('inr')) currency = 'INR';
  else if (lower.includes('dollar') || lower.includes('$') || lower.includes('usd')) currency = 'USD';

  let category = 'Other';
  if (lower.includes('coffee') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('restaurant')) category = 'Food & Dining';
  else if (lower.includes('subway') || lower.includes('uber') || lower.includes('taxi') || lower.includes('train') || lower.includes('flight')) category = 'Travel';
  else if (lower.includes('metro') || lower.includes('bus') || lower.includes('cab') || lower.includes('gas') || lower.includes('fuel')) category = 'Transportation';
  else if (lower.includes('grocery') || lower.includes('supermarket') || lower.includes('fruit') || lower.includes('vegetables')) category = 'Groceries';

  return {
    description: transcript.slice(0, 35).trim(),
    amount: amount || 0,
    currency,
    category,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: lower.includes('cash') ? 'Cash' : 'Credit Card',
    tags: ['voice-logged'],
    confidence: 0.85,
  };
}
