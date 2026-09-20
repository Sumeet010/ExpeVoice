import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './app';
import { connectToDatabase } from './config/db';
import { DatabaseService } from './services/dbService';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export async function startServer() {
  // Connect to MongoDB
  try {
    await connectToDatabase();
    // Purge legacy seed data
    await DatabaseService.purgeLegacySeedData();
  } catch (err) {
    console.warn('MongoDB connection attempt finished:', err);
  }

  const app = createExpressApp();

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/data/*', '**/server/**', '**/.git/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ExpeVoice Server running at http://0.0.0.0:${PORT}`);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
