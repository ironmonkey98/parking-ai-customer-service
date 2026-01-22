# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

这是一个 monorepo，主要项目在 `parking-ai-customer-service/` 目录下。

```
aihelper/
├── parking-ai-customer-service/   # 主项目（详见子目录 CLAUDE.md）
│   ├── src/                       # 用户端前端 (React + Vite)
│   ├── agent-client/              # 客服端前端 (React + Vite)
│   └── server/                    # 后端服务 (Node.js + Express)
├── external/                      # 外部资源
└── log.md                         # 开发日志（必读！）
```

## Quick Start

```bash
# 启动所有服务（三个终端）
cd parking-ai-customer-service

# 终端1: 后端
cd server && npm run dev           # Port 3000

# 终端2: 用户端
npm run dev                        # Port 5173

# 终端3: 客服端
cd agent-client && npm run dev     # Port 5174
```

## Development Commands

| 项目 | 命令 | 说明 |
|------|------|------|
| 后端 | `cd parking-ai-customer-service/server && npm run dev` | 开发模式 (nodemon) |
| 后端 | `cd parking-ai-customer-service/server && npm start` | 生产模式 |
| 用户端 | `cd parking-ai-customer-service && npm run dev` | Vite 开发服务器 |
| 用户端 | `cd parking-ai-customer-service && npm run build` | 构建生产版本 |
| 客服端 | `cd parking-ai-customer-service/agent-client && npm run dev` | Vite 开发服务器 |
| 客服端 | `cd parking-ai-customer-service/agent-client && npm run lint` | ESLint 检查 |

## Critical Rules

### 修改代码前必读 log.md

```
1. 修改前先查看 log.md
2. 只改 bug 对应部分，禁止大段修改
3. 每次修改必须在 log.md 记录断点
4. 防止功能回滚
```

### 环境配置

后端需要 `parking-ai-customer-service/server/.env`:
```env
ALIBABA_CLOUD_ACCESS_KEY_ID=xxx
ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx
ALIBABA_CLOUD_REGION=cn-shanghai        # 必须与 Agent 区域一致
AGENT_ID=xxx
ALIBABA_CLOUD_RTC_APP_ID=xxx
ALIBABA_CLOUD_RTC_APP_KEY=xxx
```

## Architecture Overview

停车场智能客服系统 - 基于阿里云 IMS 的 AI 语音客服 + 真人客服接管。

```
用户端 (5173) ←→ 后端 (3000) ←→ 客服端 (5174)
     ↓               ↓
 AI 通话引擎    阿里云 IMS API
```

**核心流程**:
1. 用户发起 AI 通话
2. 用户请求转人工（按钮/关键词/AI建议）
3. 后端创建独立 RTC 频道
4. 客服接听，双方通过 RTC 通话

详细架构见 `parking-ai-customer-service/CLAUDE.md`。

## Key Files

| 文件 | 职责 |
|------|------|
| `parking-ai-customer-service/src/hooks/useAICall.ts` | 用户端 AI 通话核心 Hook |
| `parking-ai-customer-service/server/server.js` | 后端 API 服务器 |
| `parking-ai-customer-service/server/socket.js` | WebSocket 通信 |
| `parking-ai-customer-service/agent-client/src/hooks/useWebSocket.ts` | 客服端 WebSocket Hook |
| `log.md` | 开发日志（修改必记录） |

## Deployment

云服务器: `47.237.118.74`

```bash
# SSH 登录
ssh root@47.237.118.74

# 项目目录（注意嵌套）
cd ~/parking-ai-customer-service/parking-ai-customer-service

# 更新代码
git pull
npm run build
pm2 restart all
```
