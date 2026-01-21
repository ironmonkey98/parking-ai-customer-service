#!/bin/bash

# 停车场智能客服系统 - 停止脚本
# 功能：停止所有运行中的服务

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  停车场智能客服系统 - 停止脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}  → 正在停止 $service_name (PID: $pid)...${NC}"
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
            rm "$pid_file"
            echo -e "${GREEN}  ✓ $service_name 已停止${NC}"
        else
            echo -e "${YELLOW}  → $service_name 进程不存在，清理 PID 文件${NC}"
            rm "$pid_file"
        fi
    else
        echo -e "${YELLOW}  → 未找到 $service_name 的 PID 文件${NC}"
    fi
}

# 通过端口强制清理
force_cleanup_ports() {
    echo -e "\n${YELLOW}[强制清理] 检查端口占用...${NC}"

    for port in 3000 5173 5174; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${YELLOW}  → 端口 $port 仍被占用，强制清理...${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            echo -e "${GREEN}  ✓ 端口 $port 已释放${NC}"
        else
            echo -e "${GREEN}  ✓ 端口 $port 空闲${NC}"
        fi
    done
}

# 主流程
main() {
    echo -e "\n${YELLOW}[停止] 正在停止所有服务...${NC}\n"

    # 停止三个服务
    stop_service "后端服务" "$PROJECT_ROOT/.backend.pid"
    stop_service "用户端" "$PROJECT_ROOT/.user-client.pid"
    stop_service "客服端" "$PROJECT_ROOT/.agent-client.pid"

    # 强制清理端口（以防 PID 文件不准确）
    force_cleanup_ports

    # 清理日志文件（可选）
    if [ -d "$PROJECT_ROOT/logs" ]; then
        echo -e "\n${YELLOW}[清理] 是否清理日志文件? (y/n)${NC}"
        read -t 5 -n 1 clean_logs
        if [ "$clean_logs" = "y" ]; then
            rm -rf "$PROJECT_ROOT/logs"
            echo -e "${GREEN}  ✓ 日志文件已清理${NC}"
        else
            echo -e "${YELLOW}  → 保留日志文件${NC}"
        fi
    fi

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}  ✓ 所有服务已停止！${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# 执行主流程
main
