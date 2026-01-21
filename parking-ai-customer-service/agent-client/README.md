# 停车场客服端工作台

基于 React + TypeScript + Vite 的客服端应用,用于真人客服接管 AI 会话。

## 功能特性

- ✅ 客服在线状态管理 (online/busy/offline)
- ✅ 实时接收转人工会话通知
- ✅ 查看 AI 对话历史记录
- ✅ RTC 音频通话
- ✅ WebSocket 实时通信
- ✅ 会话接听/拒绝/挂断

## 技术栈

- **React 19** + **TypeScript**
- **Vite** - 构建工具
- **Socket.IO Client** - WebSocket 通信
- **Aliyun RTC SDK** - 阿里云实时音频
- **Axios** - HTTP 请求

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 创建 `.env` 文件:

```bash
cp .env.example .env
```

默认配置:
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 **http://localhost:5174** 启动 (与用户端 5173 端口区分)

## 使用流程

### 客服登录

1. 输入客服ID (如 `agent-001`)
2. 输入客服昵称 (如 `客服小王`)
3. 点击"登录"按钮
4. 连接成功后状态显示为"在线"

### 接听会话

1. 等待会话列表中出现新会话通知
2. 查看会话信息:
   - 会话ID
   - 用户ID
   - 转人工原因
   - 触发关键词 (如果有)
3. 点击"接入"按钮
4. 系统自动:
   - 调用 TakeoverAIAgentCall API
   - 获取 RTC Token
   - 加入 RTC 频道
   - AI 自动退出
   - 展示对话历史记录
5. 开始与用户实时通话

### 挂断会话

1. 通话结束后点击"挂断"按钮
2. 客服状态自动切换为"在线"
3. 可继续接听新会话

## 项目结构

```
agent-client/
├── src/
│   ├── components/          # React 组件
│   │   ├── Dashboard.tsx    # 客服控制台 (登录、状态切换)
│   │   ├── SessionList.tsx  # 等待会话列表
│   │   └── CallPanel.tsx    # 当前通话面板
│   ├── hooks/               # React Hooks
│   │   ├── useWebSocket.ts  # WebSocket 连接管理
│   │   └── useRTCCall.ts    # RTC 通话管理
│   ├── api/                 # API 封装
│   │   └── client.ts        # HTTP 请求封装
│   ├── types.ts             # TypeScript 类型定义
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── .env.example             # 环境变量模板
├── vite.config.ts           # Vite 配置
└── package.json             # 依赖管理
```

## API 接口

### POST /api/agent-accept-call
接听会话,调用 TakeoverAIAgentCall API

**请求体:**
```json
{
  "sessionId": "session-xxx",
  "agentId": "agent-001",
  "region": "cn-hangzhou"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-xxx",
    "channelId": "channel-xxx",
    "rtcToken": "xxx",
    "rtcUserId": "agent-001",
    "conversationHistory": [...]
  }
}
```

### GET /api/session-history/:sessionId
获取会话历史记录

**响应:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-xxx",
    "conversationHistory": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "你好"
      },
      {
        "id": "msg-2",
        "role": "agent",
        "content": "您好,有什么可以帮您?"
      }
    ]
  }
}
```

## WebSocket 事件

### 客服端发送

- `agent-login` - 客服登录
  ```json
  { "agentId": "agent-001", "name": "客服小王" }
  ```

- `agent-status-change` - 状态变更
  ```json
  { "status": "online" | "busy" | "offline" }
  ```

- `agent-accept-session` - 接听会话
  ```json
  { "sessionId": "session-xxx" }
  ```

- `agent-reject-session` - 拒绝会话
  ```json
  { "sessionId": "session-xxx", "reason": "原因" }
  ```

- `agent-hangup` - 挂断
  ```json
  { "sessionId": "session-xxx" }
  ```

### 服务器推送

- `login-success` - 登录成功
- `new-session` - 新会话通知 (包含完整会话信息)
- `pending-sessions` - 当前队列中的会话列表
- `session-ended` - 会话结束
- `session-timeout` - 会话超时
- `agent-disconnected` - 客服断线

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览生产构建
npm run lint     # 代码检查
```

## 常见问题

### 1. WebSocket 无法连接

检查后端服务是否启动:
```bash
cd ../server
npm start
```

### 2. RTC 无法加入频道

- 确认 .env 文件中配置了正确的 API 地址
- 检查阿里云 RTC 应用配置
- 查看浏览器控制台错误信息

### 3. 收不到会话通知

- 确认客服已登录且状态为"在线"
- 检查后端 socket.js 日志
- 尝试重新登录

## 注意事项

1. **浏览器兼容性**: 建议使用 Chrome/Edge 最新版本
2. **麦克风权限**: 首次使用需授予麦克风访问权限
3. **网络要求**: RTC 通话需要良好的网络连接
4. **并发限制**: 单个客服同时只能处理一个会话

## 相关文档

- [项目总览 CLAUDE.md](../CLAUDE.md)
- [后端服务 README](../server/README.md)
- [阿里云 RTC 文档](https://help.aliyun.com/zh/rtc/)
- [Socket.IO 文档](https://socket.io/docs/)
