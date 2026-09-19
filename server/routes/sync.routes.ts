import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/dbService';

const router = Router();

type SSEClient = { id: string; res: Response };
const sseClients: SSEClient[] = [];

export const broadcastSyncEvent = (event: string, payload: any) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
};

// GET /api/sync/events - Real-time SSE channel
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const clientObj: SSEClient = { id: clientId, res };
  sseClients.push(clientObj);

  res.write(
    `event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now(), database: 'MongoDB' })}\n\n`
  );

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
});

// POST /api/sync/push - Push batch of expenses to MongoDB
router.post('/push', async (req: Request, res: Response) => {
  try {
    const { changes = [] } = req.body;
    for (const change of changes) {
      await DatabaseService.saveExpense(change);
    }
    const allExpenses = await DatabaseService.getAllExpenses();
    broadcastSyncEvent('sync_updated', { count: allExpenses.length });
    res.json({ success: true, serverExpenses: allExpenses });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Sync push failed' });
  }
});

// GET /api/sync/pull - Pull latest state from MongoDB
router.get('/pull', async (req: Request, res: Response) => {
  try {
    const expenses = await DatabaseService.getAllExpenses();
    res.json({ serverTimestamp: Date.now(), expenses });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Sync pull failed' });
  }
});

export default router;
