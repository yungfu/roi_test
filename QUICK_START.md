# ROI Analyze - 快速开始指南

## 开发环境

### 启动开发服务器

```bash
# 从项目根目录
npm run dev
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

## 生产环境构建与部署

### 1. 构建生产版本

**从项目根目录运行：**

```bash
# 推荐：使用 npm 脚本
npm run build:production

# 或者：直接运行脚本
./build-for-production.sh
```

### 2. 构建结果

所有部署文件会生成在 `packages/backend/` 目录：

```
packages/backend/
├── dist/                    # 后端编译文件
├── public/                  # 前端静态文件
├── package.json            # 依赖配置
├── start-production.sh     # 启动脚本
└── .env.production.example # 环境配置示例
```

### 3. 服务器部署

**方式一：完整部署包**
```bash
# 将整个 packages/backend/ 目录上传到服务器
scp -r packages/backend/ user@server:/path/to/app/
```

**方式二：最小部署**
```bash
# 只上传必要文件
scp -r packages/backend/dist/ user@server:/path/to/app/
scp -r packages/backend/public/ user@server:/path/to/app/
scp packages/backend/package.json user@server:/path/to/app/
scp packages/backend/start-production.sh user@server:/path/to/app/
```

### 4. 服务器配置

```bash
# 在服务器上
cd /path/to/app

# 安装依赖
npm install --production

# 配置环境变量
cp .env.production.example .env.production
vi .env.production  # 编辑配置

# 启动服务
chmod +x start-production.sh
./start-production.sh
```

### 5. 访问应用

- **完整应用**: `http://your-server:3001/`
- **API接口**: `http://your-server:3001/api/`
- **健康检查**: `http://your-server:3001/health`

## 重要说明

✅ **单端口服务**: 前端和后端通过同一端口 (3001) 提供服务
✅ **自动路由**: API 路由和静态文件自动正确映射
✅ **SPA支持**: 支持前端路由的单页应用
✅ **生产优化**: 包含静态文件缓存、安全配置等

## 故障排除

**构建失败？**
- 确保在项目根目录运行
- 检查 Node.js 版本 (需要 18.0.0+)
- 确保 `packages/client` 和 `packages/backend` 目录存在

**服务启动失败？**
- 检查数据库连接配置
- 确认端口 3001 未被占用
- 查看错误日志

**前端无法访问？**
- 确认 `public/` 目录存在且包含文件
- 检查 `NODE_ENV=production` 环境变量

## 更多信息

- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- 📋 [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) - 功能实现总结
- 🔧 [README.md](./README.md) - 完整项目文档
