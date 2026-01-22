#!/bin/bash

# ============================================
# 停车场智能客服系统 - 一键重启脚本
# 功能：清理僵尸进程 + 重启所有服务
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目路径
PROJECT_DIR="/Users/hongye/Desktop/aihelper/parking-ai-customer-service"
SERVER_DIR="$PROJECT_DIR/server"
AGENT_CLIENT_DIR="$PROJECT_DIR/agent-client"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   停车场智能客服系统 - 一键重启脚本${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 步骤 1: 清理僵尸进程
echo -e "${YELLOW}[1/4] 清理僵尸进程...${NC}"

# 清理 Vite 进程
VITE_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
if [ -n "$VITE_PIDS" ]; then
    echo -e "  ${RED}发现 Vite 进程: $VITE_PIDS${NC}"
    kill -9 $VITE_PIDS 2>/dev/null || true
    echo -e "  ${GREEN}✓ Vite 进程已清理${NC}"
else
    echo -e "  ${GREEN}✓ 无 Vite 僵尸进程${NC}"
fi

# 清理端口 3000
SERVER_PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$SERVER_PIDS" ]; then
    echo -e "  ${RED}发现端口 3000 进程: $SERVER_PIDS${NC}"
    kill -9 $SERVER_PIDS 2>/dev/null || true
    echo -e "  ${GREEN}✓ 后端进程已清理${NC}"
else
    echo -e "  ${GREEN}✓ 无后端僵尸进程${NC}"
fi

# 清理 nodemon
NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null || true)
if [ -n "$NODEMON_PIDS" ]; then
    echo -e "  ${RED}发现 nodemon 进程: $NODEMON_PIDS${NC}"
    kill -9 $NODEMON_PIDS 2>/dev/null || true
    echo -e "  ${GREEN}✓ nodemon 进程已清理${NC}"
else
    echo -e "  ${GREEN}✓ 无 nodemon 僵尸进程${NC}"
fi

sleep 2
echo ""

# 步骤 2: 启动后端服务
echo -e "${YELLOW}[2/4] 启动后端服务 (端口 3000)...${NC}"
cd "$SERVER_DIR"
nohup npm run dev > "$LOG_DIR/server.log" 2>&1 &
echo -e "  ${GREEN}✓ 后端服务已启动${NC}"
sleep 3
echo ""

# 步骤 3: 启动用户端
echo -e "${YELLOW}[3/4] 启动用户端 (端口 5173)...${NC}"
cd "$PROJECT_DIR"
nohup npm run dev > "$LOG_DIR/user-client.log" 2>&1 &
echo -e "  ${GREEN}✓ 用户端已启动${NC}"
echo ""

# 步骤 4: 启动客服端
echo -e "${YELLOW}[4/4] 启动客服端 (端口 5174)...${NC}"
cd "$AGENT_CLIENT_DIR"
nohup npm run dev > "$LOG_DIR/agent-client.log" 2>&1 &
echo -e "  ${GREEN}✓ 客服端已启动${NC}"
echo ""

# 等待启动
echo -e "${YELLOW}等待服务启动完成...${NC}"
sleep 5

# 显示状态
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   服务状态${NC}"
echo -e "${BLUE}============================================${NC}"

for port in 3000 5173 5174; do
    case $port in
        3000) name="后端服务" ;;
        5173) name="用户端  " ;;
        5174) name="客服端  " ;;
    esac
    if lsof -i :$port | grep -q LISTEN 2>/dev/null; then
        echo -e "  ${GREEN}✓ $name (端口 $port) - 运行中${NC}"
    else
        echo -e "  ${RED}✗ $name (端口 $port) - 未启动${NC}"
    fi
done

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   访问地址${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "  用户端:   ${GREEN}http://localhost:5173${NC}"
echo -e "  客服端:   ${GREEN}http://localhost:5174${NC}"
echo -e "  后端API:  ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}日志: ${YELLOW}tail -f $LOG_DIR/*.log${NC}"
echo ""
