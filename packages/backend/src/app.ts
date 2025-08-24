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
  // Try multiple possible public directory locations
  const possiblePublicPaths = [
    path.join(__dirname, '..', 'public'),  // Standard build
    path.join(__dirname, 'public'),        // Azure deployment
    path.join(process.cwd(), 'public'),    // Current working directory
  ];
  
  let publicPath = null;
  let indexPath = null;
  
  // Find the correct public path
  for (const testPath of possiblePublicPaths) {
    const testIndexPath = path.join(testPath, 'index.html');
    try {
      if (require('fs').existsSync(testIndexPath)) {
        publicPath = testPath;
        indexPath = testIndexPath;
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }
  
  if (!publicPath || !indexPath) {
    console.error('❌ Could not find public directory or index.html');
    console.error('Searched paths:', possiblePublicPaths);
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);
    
    // List current directory contents for debugging
    try {
      const fs = require('fs');
      console.error('Contents of current directory:', fs.readdirSync(process.cwd()));
      console.error('Contents of __dirname:', fs.readdirSync(__dirname));
      if (fs.existsSync(path.join(__dirname, '..'))) {
        console.error('Contents of parent directory:', fs.readdirSync(path.join(__dirname, '..')));
      }
    } catch (err) {
      console.error('Error listing directories:', err);
    }
  } else {
    console.log(`✅ Serving static files from: ${publicPath}`);
    console.log(`✅ Index.html found at: ${indexPath}`);
    
    // Serve static assets (JS, CSS, images, etc.)
    app.use('/_next', express.static(path.join(publicPath, '_next')));
    app.use('/static', express.static(path.join(publicPath, 'static')));
    
    // Serve other static files
    app.use(express.static(publicPath, {
      index: false, // Don't serve index.html automatically
      maxAge: '1d'  // Cache static assets for 1 day
    }));
  }
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    if (!indexPath) {
      console.error('❌ index.html not found, serving error response');
      return res.status(500).json({ 
        error: 'Frontend not available',
        message: 'Static files not found on server'
      });
    }
    
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('❌ Error serving index.html:', err);
        console.error('Attempted path:', indexPath);
        res.status(500).json({ 
          error: 'Failed to serve frontend',
          details: err.message,
          path: indexPath
        });
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
