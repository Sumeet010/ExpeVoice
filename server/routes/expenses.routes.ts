import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/dbService';
import { broadcastSyncEvent } from './sync.routes';

const router = Router();

// GET /api/expenses - List all expenses from MongoDB (optionally filtered by user)
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const expenses = await DatabaseService.getAllExpenses(userId);
    res.json({ expenses });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Create or upsert expense into MongoDB
router.post('/', async (req: Request, res: Response) => {
  try {
    const expense = req.body;
    if (!expense || !expense.id) {
      return res.status(400).json({ error: 'Expense object with valid id is required' });
    }

    const saved = await DatabaseService.saveExpense(expense);
    broadcastSyncEvent('expense_saved', saved);
    res.json({ success: true, expense: saved });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to save expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense from MongoDB
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteExpense(id);
    broadcastSyncEvent('expense_deleted', { id });
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to delete expense' });
  }
});

export default router;
