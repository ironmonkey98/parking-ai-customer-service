#!/bin/bash

# ========================================
# 云端部署更新脚本
# 服务器: 47.237.118.74
# ========================================

set -e  # 遇到错误立即退出

echo "🚀 开始云端部署更新..."

# 服务器配置
SERVER="root@47.237.118.74"
PROJECT_DIR="~/parking-ai-customer-service/parking-ai-customer-service"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📡 连接到服务器 ${SERVER}...${NC}"

# SSH 执行远程命令
ssh ${SERVER} << 'ENDSSH'
set -e

echo "📂 进入项目目录..."
cd ~/parking-ai-customer-service/parking-ai-customer-service

echo "🔄 拉取最新代码..."
git pull origin main

echo "📦 安装依赖（如有更新）..."
# 用户端依赖
npm install

# 客服端依赖
cd agent-client
npm install
cd ..

# 后端依赖
cd server
npm install
cd ..

echo "🏗️  构建用户端..."
npm run build

echo "🏗️  构建客服端..."
cd agent-client
npm run build
cd ..

echo "🔄 重启 PM2 服务..."
pm2 restart all

echo "✅ 部署完成！"
pm2 status

ENDSSH

echo -e "${GREEN}✅ 云端更新完成！${NC}"
echo ""
echo "📊 查看日志命令:"
echo "   ssh ${SERVER} 'pm2 logs'"
echo ""
echo "🔍 查看服务状态:"
echo "   ssh ${SERVER} 'pm2 status'"
