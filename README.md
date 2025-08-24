# ROI Analyze

一个基于npm workspace的monorepo项目，用于ROI（投资回报率）分析。

## 项目结构

```
roianalyze/
├── packages/
│   ├── backend/          # Express.js后端API
│   └── client/           # Next.js前端应用
├── package.json          # 根package.json (workspace配置)
└── README.md
```

## 技术栈

### Backend
- **框架**: Express.js
- **数据库**: PostgreSQL
- **ORM**: TypeORM (Code First)
- **依赖注入**: tsyringe
- **语言**: TypeScript

### Frontend  
- **框架**: Next.js 14 (App Router)
- **UI库**: shadcn/ui
- **样式**: Tailwind CSS
- **图表**: Recharts
- **模式**: CSR (Client-Side Rendering)
- **语言**: TypeScript

## 开发环境配置

### 先决条件
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL

### 安装依赖

```bash
# 安装所有workspace的依赖
npm install

# 或分别安装
npm install -w packages/backend
npm install -w packages/client
```

### 环境配置

1. 复制backend环境配置文件：
```bash
cp packages/backend/.env.example packages/backend/.env
```

2. 修改数据库连接信息：
```bash
# packages/backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=roianalyze
DB_CONNECTION_POOL_SIZE=10
```

### 运行项目

```bash
# 同时启动backend和client
npm run dev

# 或分别启动
npm run backend:dev  # 启动后端 (http://localhost:3001)
npm run client:dev   # 启动前端 (http://localhost:3000)
```

### 构建项目

```bash
# 构建所有包
npm run build

# 或分别构建
npm run backend:build
npm run client:build
```

## API端点

- **健康检查**: `GET /health`
- **API根路径**: `GET /api`

## 数据库

- 使用TypeORM进行数据库操作
- 支持Code First模式
- 默认连接池大小：10个连接
- 开发环境下自动同步数据库结构

## 开发特性

- 📦 **Monorepo**: 使用npm workspace管理多包
- 🔄 **热重载**: 前后端都支持热重载
- 🎨 **现代UI**: 基于shadcn/ui和Tailwind CSS
- 📊 **图表可视化**: 集成Recharts库
- 🏗️ **架构清晰**: 分层架构，依赖注入
- 🔒 **类型安全**: 全面使用TypeScript

## 许可证

Private

## 生产环境构建和部署

### 快速构建

从项目根目录运行以下任一命令：

```bash
# 使用 npm 脚本（推荐）
npm run build:production

# 或直接运行脚本
./build-for-production.sh
```

### 构建结果

构建完成后，所有部署文件都在 `packages/backend/` 目录中：

```
packages/backend/
├── dist/           # 后端编译后的 JavaScript 文件
├── public/         # 前端静态文件（从 client/out 复制而来）
├── package.json    # 后端依赖配置
└── start-production.sh  # 生产环境启动脚本
```

### 快速部署

1. **准备服务器环境**
   ```bash
   # 安装 Node.js (18.0.0+) 和 npm
   ```

2. **上传构建文件**
   ```bash
   # 将以下文件/目录上传到服务器
   packages/backend/dist/
   packages/backend/public/
   packages/backend/package.json
   packages/backend/start-production.sh
   packages/backend/.env.production.example  # 重命名为 .env.production 并配置
   ```

3. **安装依赖并启动**
   ```bash
   # 在服务器上
   npm install --production
   
   # 配置环境变量
   cp .env.production.example .env.production
   # 编辑 .env.production 文件，设置数据库连接等
   
   # 启动服务
   chmod +x start-production.sh
   ./start-production.sh
   ```

### 访问应用

启动后，通过服务器的端口（默认 3001）即可访问完整应用：

- 前端页面：`http://your-server:3001/`
- API 接口：`http://your-server:3001/api/`
- 健康检查：`http://your-server:3001/health`

### 详细说明

更多部署选项和配置说明，请参考：
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) - 构建功能总结
