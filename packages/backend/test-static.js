// 简单测试静态文件服务功能
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

// 模拟生产环境
process.env.NODE_ENV = 'production';

const publicPath = path.join(__dirname, 'public');
console.log(`Serving static files from: ${publicPath}`);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'production-test'
  });
});

// API 示例
app.get('/api', (req, res) => {
  res.json({ message: 'ROI Analyze API Server (Test Mode)' });
});

// 静态文件服务
app.use('/_next', express.static(path.join(publicPath, '_next')));
app.use('/static', express.static(path.join(publicPath, 'static')));
app.use(express.static(publicPath, { index: false }));

// SPA 回退
app.get('*', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Test URLs:');
  console.log(`  - Frontend: http://localhost:${PORT}/`);
  console.log(`  - API: http://localhost:${PORT}/api`);
  console.log(`  - Health: http://localhost:${PORT}/health`);
});
