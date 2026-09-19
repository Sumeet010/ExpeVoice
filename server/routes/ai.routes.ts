import { Router, Request, Response } from 'express';
import { parseVoiceExpenseWithGemini } from '../services/geminiService';

const router = Router();

// POST /api/ai/parse-expense - AI natural language expense extraction
router.post('/parse-expense', async (req: Request, res: Response) => {
  try {
    const { transcript, defaultCurrency = 'INR' } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Voice transcript string is required' });
    }

    const parsed = await parseVoiceExpenseWithGemini(transcript, defaultCurrency);
    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to parse voice expense' });
  }
});

export default router;
