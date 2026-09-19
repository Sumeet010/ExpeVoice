import express from 'express';
import expensesRouter from './routes/expenses.routes';
import budgetsRouter from './routes/budgets.routes';
import authRouter from './routes/auth.routes';
import currencyRouter from './routes/currency.routes';
import databaseRouter from './routes/database.routes';
import aiRouter from './routes/ai.routes';
import syncRouter from './routes/sync.routes';

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: 'MongoDB',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Mount API modular routes
  app.use('/api/expenses', expensesRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/currency', currencyRouter);
  app.use('/api/database', databaseRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/sync', syncRouter);

  return app;
}
