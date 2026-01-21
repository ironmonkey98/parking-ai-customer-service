#!/bin/bash

# 停车场智能客服系统 - 主菜单
# 功能：集成所有管理脚本的交互式菜单

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# 显示 Logo
show_logo() {
    echo -e "${CYAN}"
    cat << 'LOGO'
    ____             __   _                
   / __ \____ ______/ /__(_)___  ____ _   
  / /_/ / __ `/ ___/ //_/ / __ \/ __ `/   
 / ____/ /_/ / /  / ,< / / / / / /_/ /    
/_/    \__,_/_/  /_/|_/_/_/ /_/\__, /     
                              /____/      
   智能客服系统 - 管理控制台
LOGO
    echo -e "${NC}"
}

# 显示主菜单
show_menu() {
    clear
    show_logo
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  主菜单${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n${GREEN}服务管理：${NC}\n"
    echo -e "  ${CYAN}1${NC} - 启动所有服务"
    echo -e "  ${CYAN}2${NC} - 停止所有服务"
    echo -e "  ${CYAN}3${NC} - 重启所有服务"
    echo -e "  ${CYAN}4${NC} - 仅启动后端服务"
    
    echo -e "\n${GREEN}监控与日志：${NC}\n"
    echo -e "  ${CYAN}5${NC} - 查看系统状态"
    echo -e "  ${CYAN}6${NC} - 查看日志"
    
    echo -e "\n${GREEN}其他操作：${NC}\n"
    echo -e "  ${CYAN}7${NC} - 清理端口占用"
    echo -e "  ${CYAN}8${NC} - 安装/更新依赖"
    echo -e "  ${CYAN}9${NC} - 打开浏览器（访问服务）"
    
    echo -e "\n${GREEN}帮助与退出：${NC}\n"
    echo -e "  ${CYAN}h${NC} - 查看帮助文档"
    echo -e "  ${CYAN}q${NC} - 退出菜单\n"
    echo -e "${BLUE}========================================${NC}"
    echo -n "请选择操作 (1-9/h/q): "
}

# 启动所有服务
start_all() {
    echo -e "\n${YELLOW}启动所有服务...${NC}\n"
    if [ -f "$PROJECT_ROOT/start-all.sh" ]; then
        exec ./start-all.sh
    else
        echo -e "${RED}错误: start-all.sh 未找到${NC}"
        pause
    fi
}

# 停止所有服务
stop_all() {
    echo -e "\n${YELLOW}停止所有服务...${NC}\n"
    if [ -f "$PROJECT_ROOT/stop-all.sh" ]; then
        ./stop-all.sh
    else
        echo -e "${RED}错误: stop-all.sh 未找到${NC}"
    fi
    pause
}

# 重启所有服务
restart_all() {
    echo -e "\n${YELLOW}重启所有服务...${NC}\n"
    if [ -f "$PROJECT_ROOT/restart-all.sh" ]; then
        exec ./restart-all.sh
    else
        echo -e "${RED}错误: restart-all.sh 未找到${NC}"
        pause
    fi
}

# 仅启动后端
start_backend() {
    echo -e "\n${YELLOW}启动后端服务...${NC}\n"
    if [ -f "$PROJECT_ROOT/start-backend.sh" ]; then
        exec ./start-backend.sh
    else
        echo -e "${RED}错误: start-backend.sh 未找到${NC}"
        pause
    fi
}

# 查看状态
check_status() {
    echo -e "\n${YELLOW}检查系统状态...${NC}\n"
    if [ -f "$PROJECT_ROOT/check-status.sh" ]; then
        ./check-status.sh
    else
        echo -e "${RED}错误: check-status.sh 未找到${NC}"
    fi
    pause
}

# 查看日志
view_logs() {
    echo -e "\n${YELLOW}打开日志查看工具...${NC}\n"
    if [ -f "$PROJECT_ROOT/view-logs.sh" ]; then
        ./view-logs.sh
    else
        echo -e "${RED}错误: view-logs.sh 未找到${NC}"
        pause
    fi
}

# 清理端口
cleanup_ports() {
    echo -e "\n${YELLOW}清理端口占用...${NC}\n"
    for port in 3000 5173 5174; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "  ${YELLOW}→ 清理端口 $port...${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            echo -e "  ${GREEN}✓ 端口 $port 已释放${NC}"
        else
            echo -e "  ${GREEN}✓ 端口 $port 空闲${NC}"
        fi
    done
    pause
}

# 安装依赖
install_deps() {
    echo -e "\n${YELLOW}安装/更新依赖...${NC}\n"
    
    echo -e "${CYAN}[1/3] 后端依赖...${NC}"
    cd "$PROJECT_ROOT/server" && npm install
    
    echo -e "\n${CYAN}[2/3] 用户端依赖...${NC}"
    cd "$PROJECT_ROOT" && npm install
    
    echo -e "\n${CYAN}[3/3] 客服端依赖...${NC}"
    cd "$PROJECT_ROOT/agent-client" && npm install
    
    echo -e "\n${GREEN}✓ 所有依赖安装完成${NC}"
    pause
}

# 打开浏览器
open_browser() {
    echo -e "\n${YELLOW}打开浏览器...${NC}\n"
    
    # 检查服务是否运行
    user_running=false
    agent_running=false
    
    lsof -ti:5173 > /dev/null 2>&1 && user_running=true
    lsof -ti:5174 > /dev/null 2>&1 && agent_running=true
    
    if $user_running; then
        echo -e "  ${GREEN}→ 打开用户端: http://localhost:5173${NC}"
        open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null
    else
        echo -e "  ${YELLOW}⚠ 用户端未运行 (端口 5173)${NC}"
    fi
    
    if $agent_running; then
        echo -e "  ${GREEN}→ 打开客服端: http://localhost:5174${NC}"
        open http://localhost:5174 2>/dev/null || xdg-open http://localhost:5174 2>/dev/null
    else
        echo -e "  ${YELLOW}⚠ 客服端未运行 (端口 5174)${NC}"
    fi
    
    if ! $user_running && ! $agent_running; then
        echo -e "\n  ${RED}提示: 请先启动服务${NC}"
    fi
    
    pause
}

# 查看帮助
show_help() {
    clear
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  帮助文档${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n${GREEN}脚本说明：${NC}\n"
    echo -e "  start-all.sh     - 启动所有服务（后台运行）"
    echo -e "  stop-all.sh      - 停止所有服务"
    echo -e "  restart-all.sh   - 重启所有服务"
    echo -e "  start-backend.sh - 仅启动后端"
    echo -e "  check-status.sh  - 检查服务状态"
    echo -e "  view-logs.sh     - 查看日志"
    echo -e "  menu.sh          - 本菜单程序"
    
    echo -e "\n${GREEN}快速命令：${NC}\n"
    echo -e "  ./start-all.sh          # 启动"
    echo -e "  ./stop-all.sh           # 停止"
    echo -e "  ./check-status.sh       # 状态"
    echo -e "  tail -f logs/*.log      # 查看日志"
    
    echo -e "\n${GREEN}访问地址：${NC}\n"
    echo -e "  用户端:  http://localhost:5173"
    echo -e "  客服端:  http://localhost:5174"
    echo -e "  后端API: http://localhost:3000"
    
    echo -e "\n${GREEN}更多文档：${NC}\n"
    echo -e "  SCRIPTS.md          - 详细使用说明"
    echo -e "  SCRIPTS_OVERVIEW.md - 架构总览"
    echo -e "  README.md           - 项目文档"
    
    echo -e "\n${BLUE}========================================${NC}"
    pause
}

# 暂停函数
pause() {
    echo -e "\n${YELLOW}按任意键继续...${NC}"
    read -n 1
}

# 主循环
main() {
    while true; do
        show_menu
        read -n 1 choice
        echo
        
        case $choice in
            1) start_all ;;
            2) stop_all ;;
            3) restart_all ;;
            4) start_backend ;;
            5) check_status ;;
            6) view_logs ;;
            7) cleanup_ports ;;
            8) install_deps ;;
            9) open_browser ;;
            h|H) show_help ;;
            q|Q)
                echo -e "${GREEN}退出管理控制台${NC}"
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
