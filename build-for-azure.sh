#!/bin/bash

echo "🚀 Building for Azure deployment..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📁 Project root: $PROJECT_ROOT"

# 运行标准生产构建
./build-for-production.sh

if [ $? -ne 0 ]; then
    echo "❌ Production build failed!"
    exit 1
fi

# 创建 Azure 部署包
echo "📦 Creating Azure deployment package..."
DEPLOY_DIR="$PROJECT_ROOT/deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 复制构建文件
echo "📂 Copying build files..."
cp -r "$PROJECT_ROOT/packages/backend/dist" "$DEPLOY_DIR/"
cp -r "$PROJECT_ROOT/packages/backend/public" "$DEPLOY_DIR/"

# 使用优化的 package.json
echo "📄 Using optimized package.json for Azure..."
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

echo "📋 Package structure:"
find "$DEPLOY_DIR" -type f -name "*.js" -o -name "*.html" -o -name "*.json" | head -15

echo ""
echo "🎉 Azure deployment package ready!"
echo "📁 Package location: $DEPLOY_DIR"
echo ""
echo "📝 Next steps:"
echo "   1. The package is ready for GitHub Actions deployment"
echo "   2. Make sure to set your Azure environment variables in GitHub Secrets"
echo "   3. Update the resource group name in the GitHub Action"
