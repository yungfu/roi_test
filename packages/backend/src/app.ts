import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import 'reflect-metadata';
import { roiFilesRouter } from './routes/roiFiles';
import { statisticsRouter } from './routes/statistics';

const app = express();

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  // In production, we need to adjust CSP for static files
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false
}));

app.use(cors({
  origin: isProduction ? process.env.CORS_ORIGIN : 'http://localhost:3000',
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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes (must be before static files)
app.get('/api', (req, res) => {
  res.json({ message: 'ROI Analyze API Server' });
});

// ROI Files routes
app.use('/api/roifiles', roiFilesRouter);

// Statistics routes  
app.use('/api/statistics', statisticsRouter);

// Production static file serving
if (isProduction) {
  const publicPath = path.join(__dirname, '..', 'public');
  
  console.log(`Serving static files from: ${publicPath}`);
  
  // Serve static assets (JS, CSS, images, etc.)
  app.use('/_next', express.static(path.join(publicPath, '_next')));
  app.use('/static', express.static(path.join(publicPath, 'static')));
  
  // Serve other static files
  app.use(express.static(publicPath, {
    index: false, // Don't serve index.html automatically
    maxAge: '1d'  // Cache static assets for 1 day
  }));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({ error: 'Failed to serve frontend' });
      }
    });
  });
} else {
  // Development mode - 404 handler for non-API routes
  app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.status(404).json({ 
      error: 'Route not found',
      message: 'Frontend is served separately in development mode'
    });
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(isProduction ? {} : { stack: err.stack })
  });
});

export default app;
