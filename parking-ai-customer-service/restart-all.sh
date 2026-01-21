#!/bin/bash

# 停车场智能客服系统 - 重启脚本
# 功能：停止所有服务后重新启动

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  停车场智能客服系统 - 重启脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 停止现有服务
echo -e "\n${YELLOW}[1/2] 停止现有服务...${NC}"
if [ -f "$PROJECT_ROOT/stop-all.sh" ]; then
    ./stop-all.sh
else
    echo -e "${YELLOW}  → stop-all.sh 未找到，尝试手动清理端口...${NC}"
    for port in 3000 5173 5174; do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
fi

# 等待进程完全停止
sleep 2

# 启动服务
echo -e "\n${YELLOW}[2/2] 重新启动服务...${NC}"
if [ -f "$PROJECT_ROOT/start-all.sh" ]; then
    ./start-all.sh
else
    echo -e "${RED}  ✗ start-all.sh 未找到${NC}"
    exit 1
fi
