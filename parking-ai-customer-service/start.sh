#!/bin/bash

echo "======================================"
echo "  停车场智能客服系统 - 启动脚本"
echo "======================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装Node.js,请先安装Node.js 14+"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"
echo ""

# 进入服务器目录
cd server || exit 1

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行,正在安装依赖..."
    npm install
    echo ""
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件"
    echo "正在从.env.example创建.env..."
    cp .env.example .env
    echo ""
    echo "⚠️  请编辑 server/.env 文件,填入你的阿里云配置:"
    echo "   - ALIBABA_CLOUD_ACCESS_KEY_ID"
    echo "   - ALIBABA_CLOUD_ACCESS_KEY_SECRET"
    echo "   - AGENT_ID"
    echo ""
    read -p "按回车键继续..."
fi

# 启动服务器
echo "🚀 启动后端服务器..."
echo ""
npm start
