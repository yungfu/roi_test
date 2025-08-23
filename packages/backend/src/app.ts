import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import 'reflect-metadata';
import { roiFilesRouter } from './routes/roiFiles';
import { statisticsRouter } from './routes/statistics';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 增加请求超时设置
app.use('/api/roifiles/import', (req, res, next) => {
  req.setTimeout(600000); // 5分钟超时
  res.setTimeout(600000);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'ROI Analyze API Server' });
});

// ROI Files routes
app.use('/api/roifiles', roiFilesRouter);

// Statistics routes
app.use('/api/statistics', statisticsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
