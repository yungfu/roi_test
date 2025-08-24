#!/bin/bash

echo "🚀 Building simplified Azure deployment package..."

# 设置路径变量
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$PROJECT_ROOT/packages/client"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"
DEPLOY_DIR="$PROJECT_ROOT/azure-deploy"

# 清理并创建部署目录
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 确保构建是最新的
echo "🏗️ Building projects..."
cd "$CLIENT_DIR" && npm run build
cd "$BACKEND_DIR" && npm run build

# 复制后端文件（保持原始结构）
echo "📂 Copying backend files..."
cp -r "$BACKEND_DIR/dist" "$DEPLOY_DIR/"
cp "$BACKEND_DIR/package.json" "$DEPLOY_DIR/"

# 复制前端文件
echo "📂 Copying frontend files..."
cp -r "$CLIENT_DIR/out" "$DEPLOY_DIR/public"

# 创建简单的启动脚本作为主入口
echo "📄 Creating main entry point..."
cat > "$DEPLOY_DIR/index.js" << 'MAINEOF'
// Main entry point for Azure deployment
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

// Set Azure port
if (process.env.PORT) {
    process.env.PORT = process.env.PORT;
} else {
    process.env.PORT = 8080;
}

console.log('🚀 Starting Azure deployment...');
console.log('Working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Load the main application from dist
require('./dist/index.js');
MAINEOF

# 创建适合 Azure 的 package.json
echo "📄 Creating Azure package.json..."
cat > "$DEPLOY_DIR/package.json" << 'PKGEOF'
{
  "name": "roianalyze-azure",
  "version": "1.0.0",
  "description": "ROI Analyze - Azure Deployment",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "cors": "^2.8.5",
    "csv-parser": "^3.2.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "multer": "^2.0.2",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.1.13",
    "tsyringe": "^4.8.0",
    "typeorm": "^0.3.17"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
PKGEOF

echo "📊 Azure deployment package ready!"
echo "📁 Package location: $DEPLOY_DIR"
echo ""
echo "📂 Package contents:"
ls -la "$DEPLOY_DIR"

echo ""
echo "🚀 To deploy: upload contents of '$DEPLOY_DIR' to Azure"

# 创建 web.config for Azure App Service with CSP headers
echo "📄 Creating web.config for Azure..."
cat > "$DEPLOY_DIR/web.config" << 'XMLEOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="index.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <!-- Handle API routes -->
        <rule name="api" stopProcessing="true">
          <match url="^api/.*" />
          <action type="Rewrite" url="index.js"/>
        </rule>
        <!-- Handle health check -->
        <rule name="health" stopProcessing="true">
          <match url="^health$" />
          <action type="Rewrite" url="index.js"/>
        </rule>
        <!-- Handle static files -->
        <rule name="StaticFiles" stopProcessing="true">
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
          <action type="Rewrite" url="index.js"/>
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
        <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=' 'sha256-xwTjRc/mcyFmqWtqsl4H7T629PPFCCBC9yl5TUpsLD0=' 'sha256-vX3zeUmHUcdfGGqKeQdjX55z/emOluB6k3MnZMNvS0E=' 'sha256-VdLgck/DCsPse/MKQfNKguIwjo2BnjPxeyFaAMWDTEc=' 'sha256-8Mi7HhUouXJZpimpNxLbAnci+L7YNgV+qtmMduxfWRQ=' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'"/>
      </customHeaders>
    </httpProtocol>
    <iisnode node_env="production" />
  </system.webServer>
</configuration>
XMLEOF

echo "✅ web.config created with CSP headers"
