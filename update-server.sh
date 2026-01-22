#!/bin/bash

# ========================================
# 云端服务器更新脚本
# 在服务器上运行此脚本来更新项目
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  停车场 AI 客服系统 - 云端更新${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 项目目录
PROJECT_DIR="~/parking-ai-customer-service/parking-ai-customer-service"

echo -e "${YELLOW}📂 进入项目目录...${NC}"
cd ~/parking-ai-customer-service/parking-ai-customer-service

echo -e "${YELLOW}🔍 当前分支信息:${NC}"
git branch
echo ""

echo -e "${YELLOW}🔄 拉取最新代码...${NC}"
git pull origin main
echo ""

echo -e "${YELLOW}📦 安装/更新依赖...${NC}"

# 1. 用户端依赖
echo -e "${BLUE}  [1/3] 用户端依赖...${NC}"
npm install --production=false

# 2. 客服端依赖
echo -e "${BLUE}  [2/3] 客服端依赖...${NC}"
cd agent-client
npm install --production=false
cd ..

# 3. 后端依赖
echo -e "${BLUE}  [3/3] 后端依赖...${NC}"
cd server
npm install --production=false
cd ..

echo ""
echo -e "${YELLOW}🏗️  构建前端项目...${NC}"

# 构建用户端
echo -e "${BLUE}  [1/2] 构建用户端...${NC}"
npm run build

# 构建客服端
echo -e "${BLUE}  [2/2] 构建客服端...${NC}"
cd agent-client
npm run build
cd ..

echo ""
echo -e "${YELLOW}🔄 重启 PM2 服务...${NC}"
pm2 restart all

echo ""
echo -e "${GREEN}✅ 更新完成！${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  服务状态${NC}"
echo -e "${BLUE}========================================${NC}"
pm2 status

echo ""
echo -e "${YELLOW}💡 常用命令:${NC}"
echo -e "  查看日志: ${GREEN}pm2 logs${NC}"
echo -e "  查看状态: ${GREEN}pm2 status${NC}"
echo -e "  重启服务: ${GREEN}pm2 restart all${NC}"
echo -e "  停止服务: ${GREEN}pm2 stop all${NC}"
echo ""
