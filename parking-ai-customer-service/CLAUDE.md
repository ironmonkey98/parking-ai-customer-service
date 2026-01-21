# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

停车场智能客服系统 - 基于阿里云 IMS (Intelligent Media Services) 的 AI 语音客服应用，现已扩展支持真人客服接管功能。

**核心技术栈**:
- **用户端**: React 18 + TypeScript + Vite + `aliyun-auikit-aicall` SDK
- **客服端**: React 18 + TypeScript + Vite (独立项目在 `agent-client/`)
- **后端**: Node.js + Express + Socket.IO + 阿里云 OpenAPI SDK

## Architecture

### 三层架构

```
┌─────────────────┐
│   用户端 (src/)  │ ← React + ARTC SDK (AI 通话 + 转人工请求)
└────────┬────────┘
         │ HTTP + WebSocket
         ↓
┌────────────────────────────┐
│  后端服务 (server/)         │ ← Express + Socket.IO
│  - 会话管理 (SessionManager)│
│  - 客服状态 (AgentStatusManager)│
│  - 队列管理 (QueueManager) │
│  - WebSocket 实时通信      │
│  - 阿里云 TakeoverAPI 调用 │
└────────┬───────────────────┘
         │ OpenAPI + WebSocket
         ↓
┌────────────────────────────┐
│ 客服端 (agent-client/)     │ ← React + ARTC SDK (接听转人工)
│  - 客服工作台              │
│  - 会话列表                │
│  - RTC 音频通话            │
└────────────────────────────┘
```

### 关键设计模式

1. **会话状态机** (`server/managers/SessionManager.js`):
   ```
   ai_talking → waiting_human → human_talking → ended
   ```

2. **客服状态流转** (`server/managers/AgentStatusManager.js`):
   ```
   online ⟷ busy
   ```

3. **真人接管流程**:
   ```
   用户请求 → 保存会话 → 分配客服/入队 → 客服接听 →
   调用 TakeoverAIAgentCall API (requireToken: true) →
   获取 RTC Token → 客服加入频道 → AI 自动退出
   ```

4. **触发方式** (三种):
   - 用户主动点击"转人工"按钮
   - 关键词检测 (`['人工客服', '转人工', '真人', '投诉', '人工']`)
   - AI 智能判断 (通过 `receivedAgentCustomMessage` 事件)

## Development Commands

### 后端服务
```bash
cd server
npm install              # 安装依赖
npm start                # 启动生产环境
npm run dev              # 开发模式(nodemon自动重启)
```

### 用户端 (主项目)
```bash
npm install              # 安装依赖
npm run dev              # 启动开发服务器 (默认 5173 端口)
npm run build            # 构建生产版本
npm run preview          # 预览生产构建
```

### 客服端 (独立项目)
```bash
cd agent-client
npm install              # 安装依赖
npm run dev              # 启动开发服务器 (默认 5174 端口)
npm run build            # 构建生产版本
```

## Configuration

### 环境变量

**后端** (`server/.env`):
```env
ALIBABA_CLOUD_ACCESS_KEY_ID=your_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_key_secret
ALIBABA_CLOUD_REGION=cn-hangzhou              # ⚠️ 必须与 Agent 所在区域一致
AGENT_ID=your_agent_id
ALIBABA_CLOUD_RTC_APP_ID=your_rtc_app_id      # RTC 应用 ID
ALIBABA_CLOUD_RTC_APP_KEY=your_rtc_app_key    # RTC 应用密钥
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**⚠️ 关键配置注意事项**:
1. **区域一致性**: `ALIBABA_CLOUD_REGION` 必须与阿里云 IMS 控制台中 Agent 所在区域完全一致
2. **RTC 配置**: 必须同时配置 `RTC_APP_ID` 和 `RTC_APP_KEY`，缺失会导致 API 调用失败
3. **端口匹配**: 前端代码中硬编码使用 3000 端口连接后端

## Key Files & Responsibilities

### 后端核心模块

- **`server/server.js`**: Express 主服务器
  - HTTP 服务器 + WebSocket 集成
  - API 路由定义
  - 阿里云 OpenAPI 客户端管理
  - 三个关键 API:
    - `POST /api/request-human-takeover` - 用户请求转人工
    - `POST /api/agent-accept-call` - 客服接听会话
    - `GET /api/session-history/:sessionId` - 获取会话历史

- **`server/socket.js`**: WebSocket 实时通信
  - 客服连接/断开管理
  - 会话推送给客服
  - 状态同步
  - 心跳保活 (ping/pong)
  - 定期清理超时会话 (每 2 分钟)

- **`server/managers/SessionManager.js`**: 会话管理器 (单例)
  - 保存/更新/删除会话
  - 按状态筛选会话
  - 存储 AI 对话历史
  - 定期清理已结束会话

- **`server/managers/AgentStatusManager.js`**: 客服状态管理器 (单例)
  - 跟踪客服在线状态 (online/busy/offline)
  - 分配可用客服 (简单轮询策略)
  - 统计客服通话数据
  - Socket ID 与 Agent ID 映射

- **`server/managers/QueueManager.js`**: 队列管理器 (单例)
  - FIFO 队列实现
  - 等待时间估算
  - 超时会话清理 (默认 10 分钟)
  - 队列统计信息

- **`server/utils/takeover.js`**: TakeoverAIAgentCall API 封装
  - **关键参数**: `RequireToken: true` (必须设置以获取 RTC Token)
  - 参数验证
  - 错误处理
  - 返回: `{ channelId, humanAgentUserId, token, requestId }`

### 用户端核心文件

- **`src/hooks/useAICall.ts`**: 核心 React Hook
  - AI 通话引擎管理 (`aliyun-auikit-aicall`)
  - 转人工请求函数 `requestHumanTakeover(reason, keyword?)`
  - 关键词检测 (在 `userSubtitleNotify` 事件中)
  - AI 自定义消息监听 (`receivedAgentCustomMessage`)
  - 真人接管状态管理 (`HumanTakeoverState`)

- **`src/App.tsx`**: 主界面组件
  - 通话控制 (开始/结束)
  - "转人工"按钮
  - 真人接管状态展示
  - 排队信息显示

### 客服端核心文件 (待实现)

- **`agent-client/src/hooks/useWebSocket.ts`**: WebSocket Hook
  - 连接后端 Socket.IO 服务
  - 接收新会话通知
  - 发送客服状态更新

- **`agent-client/src/hooks/useRTCCall.ts`**: RTC 通话 Hook
  - 加入 RTC 频道
  - 发布/订阅音频流
  - 通话控制

- **`agent-client/src/components/Dashboard.tsx`**: 客服工作台
  - 显示客服状态
  - 待接入会话列表
  - 当前通话面板

## Common Workflows

### 添加新 API 端点

1. 在 `server/server.js` 中定义路由
2. 使用辅助函数:
   - `callIceOpenApi(action, region, query)` - 调用阿里云 API
   - `buildOpenApiError(error, fallbackMessage)` - 构建错误响应
   - `pickDefined(values)` - 过滤未定义值
3. 返回统一格式: `{ success, message, data?, error? }`

### 修改会话流程

1. 更新 `SessionManager` 中的状态定义
2. 修改 `socket.js` 中对应的事件处理
3. 同步更新前端 Hook 中的状态类型

### 扩展关键词触发

编辑 `src/hooks/useAICall.ts` 第 28 行:
```typescript
const TRANSFER_KEYWORDS = ['人工客服', '转人工', '真人', '投诉', '人工', '新关键词'];
```

## Testing Scenarios

测试转人工功能时需要：
1. 启动后端服务 (`cd server && npm run dev`)
2. 启动用户端 (`npm run dev`)
3. 启动客服端 (`cd agent-client && npm run dev`)
4. 客服端先登录 (触发 `agent-login` 事件)
5. 用户端发起 AI 通话
6. 测试三种触发方式:
   - 点击"转人工"按钮
   - 说出关键词 (如"转人工")
   - AI 发送自定义消息 (需配置 Agent)

## Critical Implementation Details

### 阿里云 API 调用规范

- **区域参数**: 所有 API 调用必须指定正确的 `region` 参数
- **错误码处理**: 检查 `response.body.Code` 判断成功/失败
- **Token 有效期**: RTC Token 默认 24 小时有效期
- **重试策略**: 当前未实现，失败直接返回错误

### WebSocket 事件约定

**客服端 → 服务器**:
- `agent-login`: 客服登录 `{ agentId, name }`
- `agent-status-change`: 状态变更 `{ status }`
- `agent-accept-session`: 接听会话 `{ sessionId }`
- `agent-reject-session`: 拒绝会话 `{ sessionId, reason }`
- `agent-hangup`: 挂断 `{ sessionId }`
- `ping`: 心跳

**服务器 → 客服端**:
- `new-session`: 推送新会话 (包含完整会话信息)
- `pending-sessions`: 当前队列中的会话列表
- `login-success`: 登录成功响应
- `takeover-success`: 接管成功通知
- `session-ended`: 会话结束通知
- `session-timeout`: 会话超时通知
- `pong`: 心跳响应

### 单例管理器模式

所有 Manager 类 (`SessionManager`, `AgentStatusManager`, `QueueManager`) 都使用单例模式:
```javascript
class Manager { /* ... */ }
module.exports = new Manager(); // 导出实例而非类
```

直接 require 即可使用，无需实例化。

## Known Issues & Workarounds

1. **RTC Token 必须由 API 返回**: 不要尝试手动生成 Token，必须调用 `TakeoverAIAgentCall` 并设置 `RequireToken: true`

2. **区域配置不匹配**: 如果遇到 `AgentNotFound` 错误，检查 `.env` 中的 `ALIBABA_CLOUD_REGION` 是否与 Agent 实际区域一致

3. **端口硬编码**: 前端多处硬编码 `localhost:3000`，如需修改需同步更新:
   - `src/hooks/useAICall.ts:93`
   - 其他 API 调用位置

4. **队列持久化**: 当前队列仅存在内存中，服务器重启会丢失。生产环境建议使用 Redis

5. **客服端未完成**: `agent-client/` 项目结构已建立但核心功能未实现，参考计划文档继续开发

## Related Documentation

- 阿里云 IMS 文档: https://help.aliyun.com/zh/ims/
- AI-RTC SDK API: https://help.aliyun.com/zh/ims/user-guide/aicallkit-web-sdk-integration
- 真人接管 API: https://help.aliyun.com/zh/ims/user-guide/human-takeover
- 项目实施计划: 参考 `~/.claude/plans/abstract-prancing-flame.md`
