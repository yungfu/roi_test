#!/bin/bash

echo "🚀 Building production deployment package..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📁 Project root: $PROJECT_ROOT"

# 检查是否在正确的项目根目录
if [ ! -f "$PROJECT_ROOT/package.json" ] || [ ! -d "$PROJECT_ROOT/packages/client" ] || [ ! -d "$PROJECT_ROOT/packages/backend" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected structure: packages/client/ and packages/backend/"
    exit 1
fi

# 设置生产环境
export NODE_ENV=production

# 设置路径变量
CLIENT_DIR="$PROJECT_ROOT/packages/client"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"

echo "📂 Client directory: $CLIENT_DIR"
echo "📂 Backend directory: $BACKEND_DIR"

# 清理之前的构建
echo "🧹 Cleaning previous builds..."
echo "🗑️  Cleaning client build files..."
cd "$CLIENT_DIR"
rm -rf .next out

echo "🗑️  Cleaning backend build files..."
cd "$BACKEND_DIR"
rm -rf dist public

# 构建前端
echo "🏗️ Building Next.js project..."
cd "$CLIENT_DIR"
echo "📂 Current directory: $(pwd)"
npm run build

# 检查前端构建结果
if [ ! -d "$CLIENT_DIR/out" ]; then
    echo "❌ Frontend build failed!"
    echo "🔍 Frontend directory contents:"
    ls -la "$CLIENT_DIR"
    exit 1
fi

echo "✅ Frontend build successful!"
echo "📊 Frontend build size:"
du -sh "$CLIENT_DIR/out"

# 构建后端
echo "🏗️ Building backend..."
cd "$BACKEND_DIR"
echo "📂 Current directory: $(pwd)"
echo "📋 Running: npm run build"

# 运行构建并捕获输出
if ! npm run build 2>&1; then
    echo "❌ Backend npm build failed!"
    echo "🔍 Trying TypeScript compiler directly..."
    if ! npx tsc; then
        echo "❌ TypeScript compilation failed!"
        echo "📂 Backend directory contents:"
        ls -la "$BACKEND_DIR"
        exit 1
    fi
fi

# 检查后端构建结果
if [ ! -d "$BACKEND_DIR/dist" ]; then
    echo "❌ Backend build failed - dist directory not created!"
    echo "🔍 Backend directory contents after build:"
    ls -la "$BACKEND_DIR"
    echo "🔧 Checking TypeScript configuration..."
    cat "$BACKEND_DIR/tsconfig.json"
    exit 1
fi

echo "✅ Backend build successful!"
echo "📂 Backend dist directory contents:"
ls -la "$BACKEND_DIR/dist"

# 创建后端的 public 目录并复制前端静态文件
echo "📂 Copying frontend static files to backend..."
cd "$BACKEND_DIR"
mkdir -p public
cp -r "$CLIENT_DIR/out"/* public/

# 验证复制结果
if [ ! -f "$BACKEND_DIR/public/index.html" ]; then
    echo "❌ Failed to copy frontend files!"
    echo "🔍 Client out directory:"
    ls -la "$CLIENT_DIR/out"
    echo "🔍 Backend public directory:"
    ls -la "$BACKEND_DIR/public"
    exit 1
fi

echo "✅ Static files copied successfully!"

echo "📊 Total deployment package size:"
du -sh "$BACKEND_DIR/dist" "$BACKEND_DIR/public"

echo "📋 Public directory structure:"
find "$BACKEND_DIR/public" -type f -name "*.html" -o -name "*.js" -o -name "*.css" | head -10

echo ""
echo "🎉 Production build complete!"
echo "📁 Deployment files:"
echo "   - Backend: $BACKEND_DIR/dist/"
echo "   - Static files: $BACKEND_DIR/public/"
echo ""
echo "🚀 To deploy:"
echo "   1. Copy 'packages/backend/dist' and 'packages/backend/public' to server"
echo "   2. Copy 'packages/backend/package.json' to server"
echo "   3. Run 'npm install --production' in server directory"
echo "   4. Set environment variables (.env.production)"
echo "   5. Start with 'node dist/index.js' or use './start-production.sh'"
echo ""
echo "📖 For detailed deployment instructions, see DEPLOYMENT.md"
