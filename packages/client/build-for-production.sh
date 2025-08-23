#!/bin/bash

echo "🚀 Building frontend for production static deployment..."

# 设置生产环境
export NODE_ENV=production

# 清理之前的构建
echo "🧹 Cleaning previous build..."
rm -rf .next out

# 构建项目
echo "🏗️ Building Next.js project..."
npm run build

# 检查构建结果
if [ -d "out" ]; then
    echo "✅ Build successful!"
    echo "📁 Static files are in the 'out' directory"
    echo "📊 Build size:"
    du -sh out
    echo ""
    echo "📋 Directory structure:"
    find out -type f -name "*.html" -o -name "*.js" -o -name "*.css" | head -10
    echo ""
    echo "🚀 Ready for deployment!"
    echo "   Copy the 'out' directory contents to your web server"
else
    echo "❌ Build failed!"
    exit 1
fi
