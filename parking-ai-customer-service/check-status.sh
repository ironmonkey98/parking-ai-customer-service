#!/bin/bash

# 停车场智能客服系统 - 状态检查脚本
# 功能：检查所有服务的运行状态

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  系统状态检查${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查端口占用
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        local pid=$(lsof -ti:$port)
        echo -e "  ${GREEN}✓${NC} $service_name (端口 $port) - ${GREEN}运行中${NC} (PID: $pid)"
        return 0
    else
        echo -e "  ${RED}✗${NC} $service_name (端口 $port) - ${RED}未运行${NC}"
        return 1
    fi
}

# 检查 PID 文件
check_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $service_name PID 文件有效 (PID: $pid)"
        else
            echo -e "  ${YELLOW}⚠${NC} $service_name PID 文件存在但进程不存在 (PID: $pid)"
        fi
    else
        echo -e "  ${YELLOW}ℹ${NC} $service_name PID 文件不存在"
    fi
}

# 检查日志文件
check_log_file() {
    local log_file=$1
    local log_name=$2
    
    if [ -f "$log_file" ]; then
        local size=$(du -h "$log_file" | cut -f1)
        local lines=$(wc -l < "$log_file")
        echo -e "  ${GREEN}✓${NC} $log_name: ${size} ($lines 行)"
    else
        echo -e "  ${YELLOW}ℹ${NC} $log_name: 不存在"
    fi
}

# 主检查流程
main() {
    echo -e "\n${YELLOW}[1/4] 检查端口占用...${NC}\n"
    
    backend_running=0
    user_running=0
    agent_running=0
    
    check_port 3000 "后端服务" && backend_running=1
    check_port 5173 "用户端" && user_running=1
    check_port 5174 "客服端" && agent_running=1
    
    echo -e "\n${YELLOW}[2/4] 检查 PID 文件...${NC}\n"
    
    check_pid_file "$PROJECT_ROOT/.backend.pid" "后端服务"
    check_pid_file "$PROJECT_ROOT/.user-client.pid" "用户端"
    check_pid_file "$PROJECT_ROOT/.agent-client.pid" "客服端"
    
    echo -e "\n${YELLOW}[3/4] 检查日志文件...${NC}\n"
    
    if [ -d "$PROJECT_ROOT/logs" ]; then
        check_log_file "$PROJECT_ROOT/logs/backend.log" "后端日志"
        check_log_file "$PROJECT_ROOT/logs/user-client.log" "用户端日志"
        check_log_file "$PROJECT_ROOT/logs/agent-client.log" "客服端日志"
    else
        echo -e "  ${YELLOW}ℹ${NC} logs/ 目录不存在"
    fi
    
    echo -e "\n${YELLOW}[4/4] 检查环境配置...${NC}\n"
    
    if [ -f "$PROJECT_ROOT/server/.env" ]; then
        echo -e "  ${GREEN}✓${NC} 环境配置文件存在 (server/.env)"
    else
        echo -e "  ${RED}✗${NC} 环境配置文件不存在 (server/.env)"
    fi
    
    # 检查依赖
    if [ -d "$PROJECT_ROOT/server/node_modules" ]; then
        echo -e "  ${GREEN}✓${NC} 后端依赖已安装"
    else
        echo -e "  ${RED}✗${NC} 后端依赖未安装"
    fi
    
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        echo -e "  ${GREEN}✓${NC} 用户端依赖已安装"
    else
        echo -e "  ${RED}✗${NC} 用户端依赖未安装"
    fi
    
    if [ -d "$PROJECT_ROOT/agent-client/node_modules" ]; then
        echo -e "  ${GREEN}✓${NC} 客服端依赖已安装"
    else
        echo -e "  ${RED}✗${NC} 客服端依赖未安装"
    fi
    
    # 总结
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  状态总结${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    
    total_running=$((backend_running + user_running + agent_running))
    
    if [ $total_running -eq 3 ]; then
        echo -e "  ${GREEN}✓ 所有服务运行正常 (3/3)${NC}"
        echo -e "\n  访问地址："
        echo -e "    用户端: ${BLUE}http://localhost:5173${NC}"
        echo -e "    客服端: ${BLUE}http://localhost:5174${NC}"
        echo -e "    后端API: ${BLUE}http://localhost:3000${NC}"
    elif [ $total_running -eq 0 ]; then
        echo -e "  ${RED}✗ 所有服务都未运行${NC}"
        echo -e "\n  启动命令: ${GREEN}./start-all.sh${NC}"
    else
        echo -e "  ${YELLOW}⚠ 部分服务运行中 ($total_running/3)${NC}"
        echo -e "\n  建议操作："
        if [ $backend_running -eq 0 ]; then
            echo -e "    ${YELLOW}→ 后端服务未运行${NC}"
        fi
        if [ $user_running -eq 0 ]; then
            echo -e "    ${YELLOW}→ 用户端未运行${NC}"
        fi
        if [ $agent_running -eq 0 ]; then
            echo -e "    ${YELLOW}→ 客服端未运行${NC}"
        fi
        echo -e "\n  重启所有服务: ${GREEN}./restart-all.sh${NC}"
    fi
    
    echo -e "\n${BLUE}========================================${NC}\n"
}

# 执行主函数
main
