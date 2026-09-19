import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/dbService';
import { broadcastSyncEvent } from './sync.routes';

const router = Router();

// GET /api/budgets - Get budgets from MongoDB (optionally filtered by user)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const budgets = await DatabaseService.getAllBudgets(userId);
    res.json({ budgets });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch budgets' });
  }
});

// PUT /api/budgets - Update budgets in MongoDB
router.put('/', async (req: Request, res: Response) => {
  try {
    const { budgets, userId: bodyUserId } = req.body;
    const userId = bodyUserId || (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!Array.isArray(budgets)) {
      return res.status(400).json({ error: 'Array of budgets is required' });
    }

    const saved = await DatabaseService.saveBudgets(budgets, userId);
    broadcastSyncEvent('budgets_updated', saved);
    res.json({ success: true, budgets: saved });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update budgets' });
  }
});

export default router;
