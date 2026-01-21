#!/bin/bash

# 停车场智能客服系统 - 日志查看脚本
# 功能：实时查看服务日志

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$PROJECT_ROOT/logs"

# 检查日志目录是否存在
if [ ! -d "$LOGS_DIR" ]; then
    echo -e "${RED}错误: logs/ 目录不存在${NC}"
    echo -e "${YELLOW}提示: 请先启动服务 (./start-all.sh)${NC}"
    exit 1
fi

# 显示菜单
show_menu() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  日志查看工具${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n请选择要查看的日志：\n"
    echo -e "  ${GREEN}1${NC} - 后端服务日志 (backend.log)"
    echo -e "  ${GREEN}2${NC} - 用户端日志 (user-client.log)"
    echo -e "  ${GREEN}3${NC} - 客服端日志 (agent-client.log)"
    echo -e "  ${GREEN}4${NC} - 查看所有日志（多窗口）"
    echo -e "  ${GREEN}5${NC} - 清空所有日志"
    echo -e "  ${GREEN}q${NC} - 退出\n"
    echo -e "${BLUE}========================================${NC}"
    echo -n "请输入选项 (1-5/q): "
}

# 查看日志函数
view_log() {
    local log_file=$1
    local log_name=$2
    
    if [ ! -f "$log_file" ]; then
        echo -e "${RED}错误: $log_name 不存在${NC}"
        echo -e "${YELLOW}提示: 该服务可能未启动${NC}"
        return
    fi
    
    echo -e "\n${GREEN}正在查看 $log_name...${NC}"
    echo -e "${YELLOW}按 Ctrl+C 返回菜单${NC}\n"
    sleep 1
    tail -f "$log_file"
}

# 清空日志函数
clear_logs() {
    echo -e "\n${YELLOW}确定要清空所有日志吗? (y/n)${NC}"
    read -n 1 confirm
    echo
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        rm -f "$LOGS_DIR"/*.log
        echo -e "${GREEN}✓ 所有日志已清空${NC}"
    else
        echo -e "${YELLOW}已取消${NC}"
    fi
}

# 主循环
main() {
    while true; do
        clear
        show_menu
        read -n 1 choice
        echo
        
        case $choice in
            1)
                view_log "$LOGS_DIR/backend.log" "后端服务日志"
                ;;
            2)
                view_log "$LOGS_DIR/user-client.log" "用户端日志"
                ;;
            3)
                view_log "$LOGS_DIR/agent-client.log" "客服端日志"
                ;;
            4)
                echo -e "\n${GREEN}打开所有日志（请确保已安装 tmux）${NC}"
                if command -v tmux &> /dev/null; then
                    tmux new-session -d -s logs 'tail -f logs/backend.log' \; \
                        split-window -h 'tail -f logs/user-client.log' \; \
                        split-window -v 'tail -f logs/agent-client.log' \; \
                        attach
                else
                    echo -e "${YELLOW}未安装 tmux，使用 tail 查看所有日志${NC}"
                    tail -f "$LOGS_DIR"/*.log
                fi
                ;;
            5)
                clear_logs
                sleep 2
                ;;
            q|Q)
                echo -e "${GREEN}退出日志查看工具${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项，请重新选择${NC}"
                sleep 1
                ;;
        esac
    done
}

# 执行主函数
main
