import { Router, Request, Response } from 'express';
import { getLiveCurrencyRates } from '../services/currencyService';

const router = Router();

// GET /api/currency/rates - Fetches live/cached exchange rates
router.get('/rates', async (req: Request, res: Response) => {
  try {
    const base = (req.query.base as string) || 'USD';
    const ratesData = await getLiveCurrencyRates(base);
    res.json(ratesData);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch currency rates' });
  }
});

export default router;
