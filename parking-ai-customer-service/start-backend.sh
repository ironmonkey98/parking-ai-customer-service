#!/bin/bash

# 快速启动脚本 - 仅启动后端服务
# 适用于只需要测试后端 API 的场景

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  启动后端服务${NC}"
echo -e "${BLUE}========================================${NC}"

# 清理 3000 端口
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}清理端口 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 启动后端
echo -e "\n${YELLOW}启动后端服务...${NC}"
cd "$PROJECT_ROOT/server"
npm run dev &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend.pid"

echo -e "\n${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}✓ API 地址: http://localhost:3000${NC}"
echo -e "\n${YELLOW}按 Ctrl+C 停止服务${NC}\n"

# 捕获 Ctrl+C
trap "kill $BACKEND_PID 2>/dev/null; rm $PROJECT_ROOT/.backend.pid 2>/dev/null; echo -e '\n${GREEN}后端服务已停止${NC}'; exit 0" INT TERM

# 等待
wait $BACKEND_PID
