#!/bin/bash

# 停车场智能客服系统 - 一键启动脚本
# 功能：自动启动后端服务、用户端、客服端

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  停车场智能客服系统 - 启动脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 清理端口函数
cleanup_ports() {
    echo -e "\n${YELLOW}[清理] 检查并清理占用的端口...${NC}"

    # 杀掉占用 3000, 5173, 5174 端口的进程
    for port in 3000 5173 5174; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${YELLOW}  → 发现端口 $port 被占用，正在清理...${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            echo -e "${GREEN}  ✓ 端口 $port 已释放${NC}"
        else
            echo -e "${GREEN}  ✓ 端口 $port 空闲${NC}"
        fi
    done

    # 等待端口完全释放
    sleep 1
}

# 检查依赖是否安装
check_dependencies() {
    echo -e "\n${YELLOW}[检查] 验证项目依赖...${NC}"

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}  ✗ 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Node.js 版本: $(node -v)${NC}"

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}  ✗ 未找到 npm${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ npm 版本: $(npm -v)${NC}"

    # 检查后端依赖
    if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
        echo -e "${YELLOW}  → 后端依赖未安装，正在安装...${NC}"
        cd "$PROJECT_ROOT/server" && npm install
    fi

    # 检查用户端依赖
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo -e "${YELLOW}  → 用户端依赖未安装，正在安装...${NC}"
        cd "$PROJECT_ROOT" && npm install
    fi

    # 检查客服端依赖
    if [ ! -d "$PROJECT_ROOT/agent-client/node_modules" ]; then
        echo -e "${YELLOW}  → 客服端依赖未安装，正在安装...${NC}"
        cd "$PROJECT_ROOT/agent-client" && npm install
    fi

    echo -e "${GREEN}  ✓ 所有依赖已就绪${NC}"
}

# 检查环境变量
check_env() {
    echo -e "\n${YELLOW}[检查] 验证环境配置...${NC}"

    if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
        echo -e "${RED}  ✗ 未找到 server/.env 文件${NC}"
        echo -e "${YELLOW}  → 请复制 server/.env.example 并配置阿里云密钥${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ 环境配置文件存在${NC}"
}

# 启动服务函数
start_services() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  开始启动服务...${NC}"
    echo -e "${BLUE}========================================${NC}"

    # 创建日志目录
    mkdir -p "$PROJECT_ROOT/logs"

    # 1. 启动后端服务
    echo -e "\n${YELLOW}[1/3] 启动后端服务 (端口 3000)...${NC}"
    cd "$PROJECT_ROOT/server"
    npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}  ✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
    echo -e "      日志: logs/backend.log"

    # 等待后端启动
    sleep 3

    # 2. 启动用户端
    echo -e "\n${YELLOW}[2/3] 启动用户端 (端口 5173)...${NC}"
    cd "$PROJECT_ROOT"
    npm run dev > "$PROJECT_ROOT/logs/user-client.log" 2>&1 &
    USER_CLIENT_PID=$!
    echo -e "${GREEN}  ✓ 用户端已启动 (PID: $USER_CLIENT_PID)${NC}"
    echo -e "      日志: logs/user-client.log"

    # 等待用户端启动
    sleep 3

    # 3. 启动客服端
    echo -e "\n${YELLOW}[3/3] 启动客服端 (端口 5174)...${NC}"
    cd "$PROJECT_ROOT/agent-client"
    npm run dev > "$PROJECT_ROOT/logs/agent-client.log" 2>&1 &
    AGENT_CLIENT_PID=$!
    echo -e "${GREEN}  ✓ 客服端已启动 (PID: $AGENT_CLIENT_PID)${NC}"
    echo -e "      日志: logs/agent-client.log"

    # 保存 PID 到文件，方便后续停止
    echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend.pid"
    echo "$USER_CLIENT_PID" > "$PROJECT_ROOT/.user-client.pid"
    echo "$AGENT_CLIENT_PID" > "$PROJECT_ROOT/.agent-client.pid"
}

# 显示访问信息
show_info() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}  ✓ 所有服务启动成功！${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n${YELLOW}访问地址：${NC}"
    echo -e "  ${GREEN}用户端：${NC} http://localhost:5173"
    echo -e "  ${GREEN}客服端：${NC} http://localhost:5174"
    echo -e "  ${GREEN}后端API：${NC} http://localhost:3000"

    echo -e "\n${YELLOW}进程信息：${NC}"
    echo -e "  ${GREEN}后端PID：${NC} $BACKEND_PID"
    echo -e "  ${GREEN}用户端PID：${NC} $USER_CLIENT_PID"
    echo -e "  ${GREEN}客服端PID：${NC} $AGENT_CLIENT_PID"

    echo -e "\n${YELLOW}日志文件：${NC}"
    echo -e "  ${GREEN}后端：${NC} logs/backend.log"
    echo -e "  ${GREEN}用户端：${NC} logs/user-client.log"
    echo -e "  ${GREEN}客服端：${NC} logs/agent-client.log"

    echo -e "\n${YELLOW}停止服务：${NC}"
    echo -e "  运行: ${GREEN}./stop-all.sh${NC}"
    echo -e "  或者: ${GREEN}Ctrl+C${NC} (如果在前台运行)"

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}按 Ctrl+C 停止所有服务${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# 清理函数（用于 Ctrl+C 时清理进程）
cleanup() {
    echo -e "\n\n${YELLOW}[清理] 正在停止所有服务...${NC}"

    if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.backend.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.backend.pid"
    fi

    if [ -f "$PROJECT_ROOT/.user-client.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.user-client.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.user-client.pid"
    fi

    if [ -f "$PROJECT_ROOT/.agent-client.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.agent-client.pid") 2>/dev/null || true
        rm "$PROJECT_ROOT/.agent-client.pid"
    fi

    echo -e "${GREEN}✓ 所有服务已停止${NC}\n"
    exit 0
}

# 捕获 Ctrl+C 信号
trap cleanup INT TERM

# 主流程
main() {
    cleanup_ports
    check_dependencies
    check_env
    start_services
    show_info

    # 保持脚本运行，等待用户按 Ctrl+C
    while true; do
        sleep 1
    done
}

# 执行主流程
main
