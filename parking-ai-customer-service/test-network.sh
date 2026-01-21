#!/bin/bash

# 网络访问测试脚本
# 功能：显示本机 IP 和局域网访问地址

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  网络访问测试${NC}"
echo -e "${BLUE}========================================${NC}"

# 获取本机 IP 地址
echo -e "\n${YELLOW}[1/3] 本机 IP 地址：${NC}\n"

# 尝试多种方式获取 IP
IP=""

# 方法 1: macOS Wi-Fi
IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -n "$IP" ]; then
    echo -e "  ${GREEN}Wi-Fi (en0):${NC} $IP"
fi

# 方法 2: macOS 以太网
IP2=$(ipconfig getifaddr en1 2>/dev/null)
if [ -n "$IP2" ]; then
    echo -e "  ${GREEN}以太网 (en1):${NC} $IP2"
    [ -z "$IP" ] && IP=$IP2
fi

# 方法 3: Linux
if [ -z "$IP" ]; then
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -n "$IP" ]; then
        echo -e "  ${GREEN}IP 地址:${NC} $IP"
    fi
fi

# 如果都获取不到
if [ -z "$IP" ]; then
    echo -e "  ${YELLOW}⚠ 无法自动获取 IP 地址${NC}"
    echo -e "  ${YELLOW}请手动运行: ifconfig | grep 'inet '${NC}"
    IP="<YOUR_IP>"
fi

# 检查端口监听状态
echo -e "\n${YELLOW}[2/3] 端口监听状态：${NC}\n"

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        local bind_addr=$(lsof -i :$port | grep LISTEN | awk '{print $9}' | head -1)
        if [[ $bind_addr == *"*:$port"* ]] || [[ $bind_addr == *"0.0.0.0:$port"* ]]; then
            echo -e "  ${GREEN}✓${NC} $service (端口 $port) - ${GREEN}允许局域网访问${NC} [$bind_addr]"
        elif [[ $bind_addr == *"127.0.0.1:$port"* ]]; then
            echo -e "  ${YELLOW}⚠${NC} $service (端口 $port) - ${YELLOW}仅本地访问${NC} [$bind_addr]"
            echo -e "      ${YELLOW}→ 需要在 vite.config.ts 中添加 host: '0.0.0.0'${NC}"
        else
            echo -e "  ${GREEN}?${NC} $service (端口 $port) - 运行中 [$bind_addr]"
        fi
    else
        echo -e "  ${YELLOW}✗${NC} $service (端口 $port) - ${YELLOW}未运行${NC}"
    fi
}

check_port 3000 "后端服务"
check_port 5173 "用户端  "
check_port 5174 "客服端  "

# 显示访问地址
echo -e "\n${YELLOW}[3/3] 可访问地址：${NC}\n"

echo -e "${CYAN}本机访问：${NC}"
echo -e "  用户端:  ${BLUE}http://localhost:5173${NC}"
echo -e "  客服端:  ${BLUE}http://localhost:5174${NC}"
echo -e "  后端API: ${BLUE}http://localhost:3000${NC}"

if [ "$IP" != "<YOUR_IP>" ]; then
    echo -e "\n${CYAN}局域网访问（其他设备）：${NC}"
    echo -e "  用户端:  ${GREEN}http://$IP:5173${NC}"
    echo -e "  客服端:  ${GREEN}http://$IP:5174${NC}"
    echo -e "  后端API: ${GREEN}http://$IP:3000${NC}"
fi

# 二维码（可选，需要 qrencode）
if command -v qrencode &> /dev/null && [ "$IP" != "<YOUR_IP>" ]; then
    echo -e "\n${YELLOW}扫描二维码访问（手机）：${NC}\n"
    qrencode -t ANSIUTF8 "http://$IP:5173"
fi

# 测试建议
echo -e "\n${BLUE}========================================${NC}"
echo -e "${YELLOW}测试建议：${NC}\n"
echo -e "  1. 确保服务已启动: ${GREEN}./start-all.sh${NC}"
echo -e "  2. 检查防火墙设置（如果无法访问）"
echo -e "  3. 确保两台设备在同一局域网"
echo -e "  4. 重启服务以应用新配置: ${GREEN}./restart-all.sh${NC}"
echo -e "\n${BLUE}========================================${NC}\n"
