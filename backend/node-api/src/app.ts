import express from 'express';
import authRoutes from './routes/authRoutes.js';
import datasetRoutes from './routes/datasetRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import powerBiRoutes from './routes/powerBiRoutes.js';

export const createApp = () => {
  const app = express();

  // Built-in CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-id, x-user-email');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'Healthy',
      service: 'SalesInsight.NodeGatewayApi',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/datasets', datasetRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/exports', exportRoutes);
  app.use('/api/v1/exports', exportRoutes);
  app.use('/api/powerbi', powerBiRoutes);
  app.use('/api/v1/powerbi', powerBiRoutes);


  // Fallback 404
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Requested API endpoint does not exist.' },
    });
  });

  return app;
};
