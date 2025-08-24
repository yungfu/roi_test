# ROI Analyze 生产环境部署指南

## 构建生产版本

### 使用自动化脚本（推荐）

```bash
# 在项目根目录执行
cd packages/client
chmod +x build-for-production.sh
./build-for-production.sh
```

这个脚本会：
1. 构建前端静态文件（Next.js）
2. 构建后端应用（TypeScript -> JavaScript）
3. 将前端静态文件复制到后端的 `public` 目录
4. 生成完整的部署包

### 手动构建

```bash
# 1. 构建前端
cd packages/client
npm run build

# 2. 构建后端  
cd ../backend
npm run build

# 3. 复制静态文件
mkdir -p public
cp -r ../client/out/* public/
```

## 部署结构

构建完成后，你将得到以下文件结构：

```
packages/backend/
├── dist/           # 后端编译后的 JavaScript 文件
├── public/         # 前端静态文件
│   ├── index.html  # 前端主页面
│   ├── _next/      # Next.js 构建资源
│   └── static/     # 其他静态资源
├── package.json
└── start-production.sh
```

## 服务器部署

### 1. 上传文件到服务器

将以下文件/目录上传到服务器：
- `packages/backend/dist/`
- `packages/backend/public/`
- `packages/backend/package.json`
- `packages/backend/start-production.sh`

### 2. 安装生产依赖

```bash
npm install --production
```

### 3. 配置环境变量

创建 `.env.production` 文件：

```bash
NODE_ENV=production
PORT=3001

# 数据库配置
DB_HOST=your_db_host
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# CORS配置（可选，生产环境中前后端同域名时）
CORS_ORIGIN=https://yourdomain.com
```

### 4. 启动服务

```bash
# 使用启动脚本（推荐）
chmod +x start-production.sh
./start-production.sh

# 或直接启动
NODE_ENV=production node dist/index.js
```

## 使用进程管理器（推荐）

### PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name "roianalyze" --env production

# 设置开机自启
pm2 startup
pm2 save
```

### systemd 服务

创建 `/etc/systemd/system/roianalyze.service`：

```ini
[Unit]
Description=ROI Analyze Application
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/your/app
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable roianalyze
sudo systemctl start roianalyze
```

## 反向代理配置

### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # API 请求代理到后端
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 600s;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3001;
    }

    # 所有其他请求代理到后端（由后端处理静态文件和SPA路由）
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    # API 请求代理
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/
    
    # 健康检查
    ProxyPass /health http://localhost:3001/health
    ProxyPassReverse /health http://localhost:3001/health
    
    # 所有其他请求
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # WebSocket 支持
    ProxyPreserveHost On
    ProxyRequests Off
</VirtualHost>
```

## 验证部署

### 1. 检查服务状态

```bash
# 检查进程
ps aux | grep node

# 检查端口
netstat -tlnp | grep 3001

# 检查应用健康状态
curl http://localhost:3001/health
```

### 2. 测试前端

```bash
# 测试主页
curl http://localhost:3001/

# 测试API
curl http://localhost:3001/api/
```

### 3. 浏览器测试

打开浏览器访问：
- `http://yourdomain.com` - 前端应用
- `http://yourdomain.com/api/` - API 状态
- `http://yourdomain.com/health` - 健康检查

## 故障排除

### 常见问题

1. **静态文件 404**
   - 检查 `public` 目录是否存在
   - 确认构建脚本正确执行

2. **API 无法访问**
   - 检查端口是否被占用
   - 确认数据库连接配置

3. **CORS 错误**
   - 检查 `CORS_ORIGIN` 环境变量
   - 确认域名配置正确

### 日志查看

```bash
# PM2 日志
pm2 logs roianalyze

# systemd 日志  
journalctl -u roianalyze -f

# 应用日志
tail -f /path/to/app/logs/app.log
```

## 性能优化

1. **启用 Gzip 压缩**（Nginx/Apache）
2. **设置静态文件缓存**
3. **使用 CDN**（可选）
4. **数据库连接池优化**
5. **启用 HTTP/2**

## 安全建议

1. **使用 HTTPS**
2. **定期更新依赖**
3. **设置防火墙规则**
4. **数据库安全配置**
5. **定期备份数据**
