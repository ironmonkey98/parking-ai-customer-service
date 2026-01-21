#!/bin/bash

# 验证脚本 - 检查所有配置和文件是否正确

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  配置验证脚本${NC}"
echo -e "${BLUE}========================================${NC}"

ERRORS=0
WARNINGS=0

# 检查函数
check_pass() {
    echo -e "${GREEN}  ✓${NC} $1"
}

check_fail() {
    echo -e "${RED}  ✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}  ⚠${NC} $1"
    ((WARNINGS++))
}

# 1. 检查脚本文件
echo -e "\n${YELLOW}[1/6] 检查启动脚本...${NC}\n"

for script in menu.sh start-all.sh stop-all.sh restart-all.sh check-status.sh view-logs.sh test-network.sh start-backend.sh; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "$script 存在且可执行"
        else
            check_fail "$script 存在但不可执行"
        fi
    else
        check_fail "$script 不存在"
    fi
done

# 2. 检查用户端配置
echo -e "\n${YELLOW}[2/6] 检查用户端配置...${NC}\n"

if grep -q "host: '0.0.0.0'" vite.config.ts; then
    check_pass "用户端 vite.config.ts 已配置局域网访问"
else
    check_fail "用户端 vite.config.ts 未配置 host: '0.0.0.0'"
fi

# 3. 检查客服端配置
echo -e "\n${YELLOW}[3/6] 检查客服端配置...${NC}\n"

if grep -q "host: '0.0.0.0'" agent-client/vite.config.ts; then
    check_pass "客服端 vite.config.ts 已配置局域网访问"
else
    check_fail "客服端 vite.config.ts 未配置 host: '0.0.0.0'"
fi

# 4. 检查客服端 RTC 修复
echo -e "\n${YELLOW}[4/6] 检查客服端 RTC 代码...${NC}\n"

if grep -q "configLocalAudioPublish" agent-client/src/hooks/useRTCCall.ts; then
    check_pass "useRTCCall.ts 已添加音频发布代码"
else
    check_fail "useRTCCall.ts 未添加 configLocalAudioPublish"
fi

if grep -q "toggleMute" agent-client/src/hooks/useRTCCall.ts; then
    check_pass "useRTCCall.ts 已添加静音控制"
else
    check_fail "useRTCCall.ts 未添加 toggleMute"
fi

if grep -q "isMuted" agent-client/src/components/CallPanel.tsx; then
    check_pass "CallPanel.tsx 已添加静音按钮"
else
    check_fail "CallPanel.tsx 未添加 isMuted 参数"
fi

# 5. 检查文档
echo -e "\n${YELLOW}[5/6] 检查文档文件...${NC}\n"

for doc in SCRIPTS.md SCRIPTS_OVERVIEW.md NETWORK_ACCESS.md AGENT_RTC_FIX.md FINAL_WORK_SUMMARY.md TEST_CHECKLIST.md QUICK_REFERENCE.md; do
    if [ -f "$doc" ]; then
        check_pass "$doc 已创建"
    else
        check_warn "$doc 不存在（可选文档）"
    fi
done

# 6. 检查环境配置
echo -e "\n${YELLOW}[6/6] 检查环境配置...${NC}\n"

if [ -f "server/.env" ]; then
    check_pass "server/.env 配置文件存在"
else
    check_warn "server/.env 配置文件不存在（需要手动创建）"
fi

if [ -d "server/node_modules" ]; then
    check_pass "后端依赖已安装"
else
    check_warn "后端依赖未安装（首次运行时会自动安装）"
fi

if [ -d "node_modules" ]; then
    check_pass "用户端依赖已安装"
else
    check_warn "用户端依赖未安装（首次运行时会自动安装）"
fi

if [ -d "agent-client/node_modules" ]; then
    check_pass "客服端依赖已安装"
else
    check_warn "客服端依赖未安装（首次运行时会自动安装）"
fi

# 总结
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  验证结果${NC}"
echo -e "${BLUE}========================================${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！配置完美！${NC}"
    echo -e "\n${GREEN}现在可以启动服务了：${NC}"
    echo -e "  ${BLUE}./menu.sh${NC}        # 交互式菜单"
    echo -e "  ${BLUE}./start-all.sh${NC}   # 命令行启动"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ 验证通过，有 $WARNINGS 个警告${NC}"
    echo -e "\n警告项目是可选的，不影响核心功能"
    echo -e "\n${GREEN}可以启动服务：${NC}"
    echo -e "  ${BLUE}./menu.sh${NC}"
else
    echo -e "${RED}✗ 发现 $ERRORS 个错误，$WARNINGS 个警告${NC}"
    echo -e "\n请检查上述错误并修复后再启动服务"
fi

echo -e "\n${BLUE}========================================${NC}\n"

exit $ERRORS
