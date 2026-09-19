import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/dbService';
import { connectToDatabase } from '../config/db';

const router = Router();

// GET /api/database/status - Returns MongoDB connection status and collection statistics
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await DatabaseService.getFullStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to get database status' });
  }
});

// POST /api/database/reconnect - Triggers an immediate reconnection attempt to MongoDB
router.post('/reconnect', async (req: Request, res: Response) => {
  try {
    await connectToDatabase(true);
    const status = await DatabaseService.getFullStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Reconnection failed' });
  }
});

// GET /api/database/info - Detailed database configuration information
router.get('/info', async (req: Request, res: Response) => {
  try {
    const status = await DatabaseService.getFullStatus();
    res.json({
      currentDatabase: {
        type: 'MongoDB Database',
        engine: 'MongoDB',
        connected: status.database.connected,
        description: 'Persistent cloud storage powered by MongoDB for all expenses, budgets, and user accounts. LocalStorage is strictly reserved for Currency Rates API caching.',
        collections: status.database.collections,
        localStorageUsage: 'Currency Rates API Cache Only (Strictly Offline FX Conversion)',
        connectionStringConfigured: status.database.uriConfigured,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to get database info' });
  }
});

export default router;
