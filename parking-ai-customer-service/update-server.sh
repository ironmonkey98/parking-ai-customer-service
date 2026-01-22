#!/bin/bash
# ============================================
# 云端服务器一键更新脚本
# 项目: 停车场AI客服系统
# 服务器: 47.237.118.74
# ============================================

set -e  # 遇到错误立即退出

echo "========================================"
echo "🚀 开始更新停车场AI客服系统..."
echo "========================================"

# 项目目录（根据实际情况修改）
PROJECT_DIR="/root/parking-ai-customer-service"
# 或者
# PROJECT_DIR="/home/ubuntu/parking-ai-customer-service"

cd "$PROJECT_DIR" || { echo "❌ 项目目录不存在: $PROJECT_DIR"; exit 1; }

echo ""
echo "📥 1. 拉取最新代码..."
git fetch origin
git pull origin main

echo ""
echo "📦 2. 安装后端依赖..."
cd server
npm install --production

echo ""
echo "🔄 3. 重启后端服务..."
# 使用 PM2 管理进程（推荐）
if command -v pm2 &> /dev/null; then
    pm2 restart parking-ai-server || pm2 start server.js --name parking-ai-server
    echo "✅ PM2 重启完成"
else
    # 如果没有 PM2，尝试使用 systemctl
    if systemctl is-active --quiet parking-ai; then
        sudo systemctl restart parking-ai
        echo "✅ systemctl 重启完成"
    else
        echo "⚠️ 请手动重启服务: npm run dev 或 node server.js"
    fi
fi

echo ""
echo "========================================"
echo "✅ 更新完成!"
echo "========================================"
echo ""
echo "📋 服务状态:"
if command -v pm2 &> /dev/null; then
    pm2 status
fi

echo ""
echo "🔗 访问地址:"
echo "   用户端: https://47.237.118.74:5173"
echo "   客服端: https://47.237.118.74:5174"
echo "   后端API: https://47.237.118.74:3000"
echo ""
