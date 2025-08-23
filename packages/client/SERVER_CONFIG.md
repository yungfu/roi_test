# 静态文件 + 后端 API 同服务器部署配置

## 部署架构

```
同一服务器 (例如: yourdomain.com:80)
├── /api/*          → 后端 API 服务
├── /static/*       → 前端静态资源 (JS, CSS, 图片等)
├── /_next/*        → Next.js 构建资源
└── /*              → 前端页面路由 (index.html)
```

## Express.js 服务器配置示例

```javascript
const express = require('express');
const path = require('path');
const app = express();

// API 路由 (在静态文件路由之前)
app.use('/api', require('./routes/api'));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'client/out/_next/static')));
app.use('/_next', express.static(path.join(__dirname, 'client/out/_next')));

// 前端路由 (SPA 回退)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/out/index.html'));
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 静态资源目录
    root /var/www/html;
    
    # API 请求转发到后端
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Next.js 静态资源
    location /_next/ {
        alias /var/www/html/out/_next/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 静态资源
    location /static/ {
        alias /var/www/html/out/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Apache 配置示例

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/html/out
    
    # API 代理
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
    
    # 静态资源缓存
    <LocationMatch "/_next/.*\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header append Cache-Control "public, immutable"
    </LocationMatch>
    
    # SPA 回退
    <Directory "/var/www/html/out">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## 构建和部署流程

### 1. 构建前端
```bash
cd packages/client
npm run build
```

### 2. 部署静态文件
```bash
# 将 out 目录内容复制到服务器静态文件目录
cp -r packages/client/out/* /var/www/html/
```

### 3. 启动后端服务
```bash
cd packages/backend
npm start
```

## 目录结构示例

```
/var/www/html/          # 静态文件根目录
├── index.html          # 主页面文件
├── _next/              # Next.js 构建资源
│   ├── static/         # 静态资源 (CSS, JS)
│   └── ...
└── favicon.ico         # 网站图标

/opt/app/backend/       # 后端服务目录
├── dist/               # 编译后的后端代码
└── ...
```

## 环境变量

生产环境不需要设置 `NEXT_PUBLIC_API_URL`，因为：
- 前端运行在浏览器中
- API 请求发送到相对路径 `/api/*`
- 服务器将 `/api/*` 路由到后端服务

## 验证部署

1. 访问主页: `http://yourdomain.com/`
2. 检查 API: `http://yourdomain.com/api/health`
3. 查看网络请求确认路径正确
