#!/bin/bash

echo "🚀 Building for Azure deployment..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📁 Project root: $PROJECT_ROOT"

# 设置生产环境
export NODE_ENV=production

# 设置路径变量
CLIENT_DIR="$PROJECT_ROOT/packages/client"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

# 清理之前的构建
echo "�� Cleaning previous builds..."
rm -rf "$CLIENT_DIR/.next" "$CLIENT_DIR/out"
rm -rf "$BACKEND_DIR/dist" "$BACKEND_DIR/public"
rm -rf "$DEPLOY_DIR"

# 构建前端
echo "🏗️ Building Next.js project..."
cd "$CLIENT_DIR"
npm run build

if [ ! -d "$CLIENT_DIR/out" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful!"

# 构建后端
echo "🏗️ Building backend..."
cd "$BACKEND_DIR"
npm run build

if [ ! -d "$BACKEND_DIR/dist" ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

echo "✅ Backend build successful!"

# 创建部署目录
echo "📦 Creating Azure deployment package..."
mkdir -p "$DEPLOY_DIR"

# 复制后端构建文件
cp -r "$BACKEND_DIR/dist" "$DEPLOY_DIR/"

# 创建 public 目录并复制前端静态文件
mkdir -p "$DEPLOY_DIR/public"
cp -r "$CLIENT_DIR/out"/* "$DEPLOY_DIR/public/"

# 验证静态文件复制
if [ ! -f "$DEPLOY_DIR/public/index.html" ]; then
    echo "❌ Failed to copy frontend files!"
    exit 1
fi

echo "✅ Static files copied to deployment package!"

# 复制 Azure 特定的 package.json
cp "$PROJECT_ROOT/azure-package.json" "$DEPLOY_DIR/package.json"

# 复制环境配置示例
cp "$PROJECT_ROOT/packages/backend/.env.production.example" "$DEPLOY_DIR/"

# 创建 Azure 特定的启动脚本
cat > "$DEPLOY_DIR/server.js" << 'SERVEREOF'
// Azure-specific startup script
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// Azure uses PORT environment variable
if (process.env.PORT) {
    process.env.PORT = process.env.PORT;
} else {
    process.env.PORT = 8080;
}

console.log('Azure deployment starting...');
console.log('Current working directory:', process.cwd());
console.log('Server file location:', __dirname);

// List contents for debugging
try {
    const fs = require('fs');
    console.log('Contents of current directory:', fs.readdirSync(process.cwd()));
    if (fs.existsSync('./public')) {
        console.log('Public directory exists');
        console.log('Public directory contents:', fs.readdirSync('./public').slice(0, 10));
    } else {
        console.log('❌ Public directory not found');
    }
    if (fs.existsSync('./dist')) {
        console.log('Dist directory exists');
    } else {
        console.log('❌ Dist directory not found');
    }
} catch (err) {
    console.error('Error listing directories:', err);
}

// Load the main application
require('./dist/index.js');
SERVEREOF

# 创建 web.config for Azure App Service
cat > "$DEPLOY_DIR/web.config" << 'WEBEOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Handle API routes -->
        <rule name="api" stopProcessing="true">
          <match url="^api/.*" />
          <action type="Rewrite" url="server.js"/>
        </rule>
        <!-- Handle health check -->
        <rule name="health" stopProcessing="true">
          <match url="^health$" />
          <action type="Rewrite" url="server.js"/>
        </rule>
        <!-- Handle Next.js static files -->
        <rule name="NextStaticFiles" stopProcessing="true">
          <match url="^_next/.*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <action type="None" />
        </rule>
        <!-- Handle public static files -->
        <rule name="PublicFiles" stopProcessing="true">
          <match url="^public/.*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <action type="None" />
        </rule>
        <!-- SPA fallback for all other routes -->
        <rule name="SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="server.js"/>
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="52428800" />
      </requestFiltering>
    </security>
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff"/>
        <add name="X-Frame-Options" value="DENY"/>
        <add name="X-XSS-Protection" value="1; mode=block"/>
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
WEBEOF

echo "📊 Azure deployment package:"
du -sh "$DEPLOY_DIR"/*

echo "📋 Deployment package structure:"
echo "├── dist/ (backend files)"
echo "├── public/ (frontend files)"
echo "├── server.js (Azure startup script)"
echo "├── web.config (IIS configuration)"
echo "├── package.json (dependencies)"
echo "└── .env.production.example (config template)"

echo ""
echo "🎉 Azure deployment package ready!"
echo "📁 Deployment files: $DEPLOY_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Upload the 'deploy' directory contents to Azure"
echo "   2. Set environment variables in Azure App Service"
echo "   3. Azure will automatically run 'npm install' and start the app"
