#!/bin/bash

echo "🚀 Starting ROI Analyze in production mode..."

# 设置生产环境变量
export NODE_ENV=production

# 检查必要的文件
if [ ! -d "dist" ]; then
    echo "❌ Backend build not found. Please run build first."
    echo "   Run: npm run build"
    exit 1
fi

if [ ! -d "public" ]; then
    echo "⚠️  Static files not found. Frontend may not be accessible."
    echo "   Run: ../client/build-for-production.sh"
fi

# 检查数据库连接环境变量
if [ -z "$DB_HOST" ] || [ -z "$DB_DATABASE" ]; then
    echo "⚠️  Database environment variables not set."
    echo "   Please set: DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD"
fi

echo "📦 Starting server..."
echo "   Environment: production"
echo "   Static files: $([ -d "public" ] && echo "✅ Available" || echo "❌ Missing")"
echo "   Port: ${PORT:-3001}"
echo ""

# 启动服务器
node dist/index.js
