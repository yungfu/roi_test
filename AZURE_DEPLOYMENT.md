# Azure 部署指南

## 概述

这个项目现在支持通过 GitHub Actions 自动部署到 Azure App Service。部署过程会：

1. 构建前端（Next.js 静态文件）
2. 构建后端（TypeScript → JavaScript）
3. 创建优化的 Azure 部署包
4. 自动部署到 Azure App Service

## 部署文件说明

### 关键文件

- `.github/workflows/azure-deploy.yml` - GitHub Actions 工作流
- `build-for-azure.sh` - Azure 特定构建脚本
- `azure-package.json` - 简化的生产依赖配置
- `web.config` - Azure App Service 路由配置

### 部署包结构

```
deploy/
├── dist/           # 后端编译文件
├── public/         # 前端静态文件
├── package.json    # 生产依赖
├── server.js       # Azure 启动脚本
├── web.config      # IIS/Azure 路由配置
└── .env.production.example
```

## 配置步骤

### 1. Azure 环境变量

在 Azure App Service 中设置以下环境变量：

```bash
NODE_ENV=production
PORT=8080  # Azure 自动设置，通常不需要手动配置

# 数据库配置
DB_HOST=your-azure-postgres-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name

# 可选：CORS 配置
CORS_ORIGIN=https://your-app-name.azurewebsites.net
```

### 2. GitHub Secrets

确保以下 Secrets 已在 GitHub 仓库中配置：

- `AZUREAPPSERVICE_CLIENTID_xxx`
- `AZUREAPPSERVICE_TENANTID_xxx`
- `AZUREAPPSERVICE_SUBSCRIPTIONID_xxx`

### 3. 更新 GitHub Action

编辑 `.github/workflows/azure-deploy.yml`：

1. **替换应用名称**：
   ```yaml
   app-name: 'your-actual-app-name'  # 替换 'cyfnodetest'
   ```

2. **配置资源组**（可选）：
   取消注释并更新资源组配置：
   ```yaml
   - name: Configure Azure Web App settings
     run: |
       az webapp config appsettings set \
         --resource-group YOUR_ACTUAL_RESOURCE_GROUP \
         --name your-actual-app-name \
         --settings \
           NODE_ENV=production \
           PORT=8080 \
           WEBSITE_NODE_DEFAULT_VERSION=18-lts
   ```

## 部署流程

### 自动部署

推送到 `main` 分支时自动触发：

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

### 手动部署

在 GitHub 仓库的 Actions 页面点击 "Run workflow"。

### 本地测试 Azure 构建

```bash
# 测试 Azure 构建过程
./build-for-azure.sh

# 检查部署包
ls -la deploy/
```

## 路由配置

### API 路由
- `/api/*` → 后端服务
- `/health` → 健康检查

### 静态文件
- `/_next/*` → Next.js 构建资源
- `/public/*` → 静态资源

### SPA 路由
- 所有其他路由 → 前端 SPA（index.html）

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 Azure 服务计划是否支持 Node.js 18
   - 确认所有 GitHub Secrets 正确配置

2. **静态文件无法访问**
   - 确认 `web.config` 正确部署
   - 检查 Azure 日志中的路由错误

3. **数据库连接失败**
   - 在 Azure App Service 中配置数据库环境变量
   - 确认 Azure PostgreSQL 防火墙规则

4. **健康检查失败**
   - 首次部署可能需要几分钟启动
   - 检查 Azure 应用日志：`https://your-app.scm.azurewebsites.net/api/logs/docker`

### 调试命令

```bash
# 查看 Azure 应用日志
az webapp log tail --name cyfnodetest --resource-group YOUR_RESOURCE_GROUP

# 检查应用设置
az webapp config appsettings list --name cyfnodetest --resource-group YOUR_RESOURCE_GROUP

# 重启应用
az webapp restart --name cyfnodetest --resource-group YOUR_RESOURCE_GROUP
```

## 监控和维护

### 应用 URLs

- **主应用**：`https://your-app-name.azurewebsites.net/`
- **健康检查**：`https://your-app-name.azurewebsites.net/health`
- **API 状态**：`https://your-app-name.azurewebsites.net/api/`

### 性能优化

1. **启用应用缓存**
2. **配置 CDN**（可选）
3. **监控应用性能**
4. **设置自动缩放**

### 安全配置

- HTTPS 默认启用
- 安全头已在 `web.config` 中配置
- 考虑启用 Azure Application Gateway（如需要）

## 成本优化

1. **使用适当的定价层**
2. **启用自动缩放**
3. **监控资源使用情况**
4. **考虑使用 Azure 免费层**（适用于开发/测试）

