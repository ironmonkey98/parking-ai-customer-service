# 🚀 停车场智能客服系统 - 工程化移交文档

**文档版本**: v1.0
**创建时间**: 2026-01-23
**适用对象**: 后续开发者、运维人员、技术负责人

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [快速上手](#3-快速上手)
4. [核心模块详解](#4-核心模块详解)
5. [开发规范](#5-开发规范)
6. [关键设计决策](#6-关键设计决策)
7. [踩坑指南](#7-踩坑指南)
8. [测试与调试](#8-测试与调试)
9. [部署指南](#9-部署指南)
10. [后续开发建议](#10-后续开发建议)
11. [附录：文件清单](#11-附录文件清单)

---

## 1. 项目概述

### 1.1 业务背景

这是一个**停车场智能客服系统**，基于阿里云 IMS（Intelligent Media Services）构建，实现：

1. **AI 语音客服** - 用户通过语音与 AI 智能体实时对话
2. **真人客服接管** - 当 AI 无法解答时，无缝切换到真人客服

### 1.2 项目状态

| 功能模块 | 完成度 | 状态 |
|---------|--------|------|
| AI 通话引擎 | 100% | ✅ 生产就绪 |
| 真人接管（方案 B） | 100% | ✅ 已验证 |
| 客服工作台 | 100% | ✅ 基础功能完成 |
| 队列管理 | 100% | ⚠️ 待压测 |
| 监控告警 | 0% | ❌ 未实现 |

### 1.3 核心技术栈

```
前端: React 18 + TypeScript + Vite 4.4
后端: Node.js + Express 4.18 + Socket.IO 4.8
SDK:  阿里云 aliyun-auikit-aicall + aliyun-rtc-sdk
```

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                              │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │ 用户端 (5173)     │              │ 客服端 (5174)     │        │
│  │ React + ARTC SDK │              │ React + RTC SDK  │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
└───────────┼─────────────────────────────────┼──────────────────┘
            │ HTTP + WebSocket                │ HTTP + WebSocket
            ↓                                 ↓
┌───────────────────────────────────────────────────────────────┐
│                    后端服务 (3000)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │SessionManager│ │AgentStatus  │ │QueueManager │              │
│  │ (会话管理)   │ │Manager      │ │ (队列管理)  │              │
│  └─────────────┘ │ (客服状态)  │ └─────────────┘              │
│                  └─────────────┘                              │
│  ┌─────────────────────────────────────────────────┐          │
│  │              WebSocket (Socket.IO)               │          │
│  └─────────────────────────────────────────────────┘          │
└───────────────────────────┬───────────────────────────────────┘
                            │ OpenAPI
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                    阿里云 IMS 服务                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ AI 智能体   │ │ RTC 服务    │ │ STT/TTS     │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 核心流程：AI 通话

```
用户点击"开始通话"
       ↓
前端调用 /api/start-call
       ↓
后端调用 GenerateAIAgentCall API
       ↓
返回 instanceId + channelId + rtcToken
       ↓
前端 SDK 加入 RTC 频道
       ↓
AI 播放欢迎语，对话开始
```

### 2.3 核心流程：真人接管（方案 B）

> ⚠️ **重要**：我们采用了"独立 RTC 通道"方案，而非阿里云原生的 TakeoverAIAgentCall API。

```
用户请求转人工（点击按钮/说关键词/AI建议）
       ↓
后端创建会话，保存对话历史
       ↓
分配空闲客服 或 加入队列
       ↓
客服点击"接入"
       ↓
后端创建【独立 RTC 频道】(HUMAN_xxx)
       ↓
为用户和客服分别生成 RTC Token
       ↓
用户端：断开 AI 连接 → 加入新频道
客服端：加入新频道
       ↓
双方通过独立频道直接通话
```

**为什么不用 TakeoverAIAgentCall API？**
- 文档不完整，参数定义模糊
- Token 生成机制不透明
- 调试困难（黑盒 API）

详见 `PLAN_B_IMPLEMENTATION.md`

---

## 3. 快速上手

### 3.1 环境要求

- Node.js 16+
- npm 或 yarn
- 阿里云账号（已配置 IMS 服务）

### 3.2 配置环境变量

```bash
cd server
cp .env.example .env
```

编辑 `server/.env`：

```env
# 阿里云凭证
ALIBABA_CLOUD_ACCESS_KEY_ID=你的AK
ALIBABA_CLOUD_ACCESS_KEY_SECRET=你的SK

# ⚠️ 区域必须与 Agent 所在区域一致！
ALIBABA_CLOUD_REGION=cn-shanghai

# AI 智能体 ID（在 IMS 控制台获取）
AGENT_ID=你的AgentId

# RTC 应用配置（真人接管必需）
ALIBABA_CLOUD_RTC_APP_ID=你的RTC应用ID
ALIBABA_CLOUD_RTC_APP_KEY=你的RTC应用Key
```

### 3.3 启动服务

```bash
# 方式一：一键启动（推荐）
./start-all.sh

# 方式二：分别启动
# 终端1 - 后端
cd server && npm install && npm run dev

# 终端2 - 用户端
npm install && npm run dev

# 终端3 - 客服端
cd agent-client && npm install && npm run dev
```

### 3.4 访问地址

| 服务 | 地址 | 用途 |
|------|------|------|
| 后端 API | http://localhost:3000 | REST API + WebSocket |
| 用户端 | http://localhost:5173 | 用户发起 AI/人工通话 |
| 客服端 | http://localhost:5174 | 客服接听、管理会话 |

---

## 4. 核心模块详解

### 4.1 用户端核心 Hook

**文件**: `src/hooks/useAICall.ts`

```typescript
// 核心导出
const {
  isCallActive,      // 通话是否激活
  callState,         // 'idle' | 'connecting' | 'connected' | 'disconnected'
  subtitle,          // 当前字幕（实时更新）
  messages,          // 对话历史数组
  startCall,         // 发起 AI 通话
  endCall,           // 结束通话
  requestHumanTakeover,  // 请求转人工
  humanTakeoverState,    // 转人工状态
} = useAICall();
```

**关键词触发逻辑**（第 28 行）：
```typescript
const TRANSFER_KEYWORDS = ['人工客服', '转人工', '真人', '投诉', '人工'];
```

### 4.2 后端会话管理

**文件**: `server/managers/SessionManager.js`

```javascript
// 单例模式，直接 require 使用
const sessionManager = require('./managers/SessionManager');

// 核心方法
sessionManager.createSession(sessionId, data);  // 创建会话
sessionManager.getSession(sessionId);           // 获取会话
sessionManager.updateSessionStatus(sessionId, 'human_talking');  // 更新状态
sessionManager.addMessageToSession(sessionId, message);  // 添加消息
```

**会话状态机**：
```
ai_talking → waiting_human → human_talking → ended
                                    ↓
                               rejected (客服拒绝)
```

### 4.3 WebSocket 事件

**文件**: `server/socket.js`

| 事件（客服端 → 服务器） | 说明 |
|------------------------|------|
| `agent-login` | 客服登录 `{ agentId, name }` |
| `agent-status-change` | 状态变更 `{ status: 'online'|'busy' }` |
| `agent-accept-session` | 接听会话 `{ sessionId }` |
| `agent-reject-session` | 拒绝会话 `{ sessionId, reason }` |
| `agent-hangup` | 挂断通话 `{ sessionId }` |

| 事件（服务器 → 客服端） | 说明 |
|------------------------|------|
| `new-session` | 推送新会话（包含完整信息） |
| `pending-sessions` | 当前队列中的会话列表 |
| `takeover-success` | 接管成功（包含 RTC Token） |
| `session-rejected` | 会话被拒绝通知 |
| `session-ended` | 会话结束通知 |

### 4.4 RTC Token 生成

**文件**: `server/server.js` 第 162-214 行

```javascript
// Token 签名算法（阿里云官方规范）
const raw = `${AppID}${AppKey}${ChannelID}${UserID}${Nonce}${Timestamp}`;
const token = crypto.createHash('sha256').update(raw).digest('hex');
```

⚠️ **踩坑警告**：签名顺序必须是 `AppID + AppKey + ChannelID + UserID + Nonce + Timestamp`，少了 `Nonce` 或顺序错误都会导致 403 错误。

---

## 5. 开发规范

### 5.1 代码修改铁律

```
⚠️ 每次修改代码前必须：
1. 先查看 log.md（开发日志）
2. 只改 bug 对应部分，禁止大段重构
3. 每次修改必须在 log.md 记录
4. 防止功能回滚
```

### 5.2 log.md 记录格式

```markdown
## YYYY-MM-DD HH:MM - 模块名称

### 修改内容
- 修改: 具体改动描述
- 原因: 为什么需要这个改动
- 位置: 文件路径:行号
- 影响: 可能影响的功能模块
- 风险: 潜在问题和注意事项
```

### 5.3 端口约定

| 服务 | 端口 | 备注 |
|------|------|------|
| 后端 | 3000 | 固定，前端代码硬编码 |
| 用户端 | 5173 | Vite 默认 |
| 客服端 | 5174 | 与用户端区分 |

### 5.4 环境变量规范

- 敏感信息只放 `.env`，不提交到 Git
- `.env.example` 作为模板，包含所有必需变量
- 区域配置 `ALIBABA_CLOUD_REGION` 必须与 Agent 一致

---

## 6. 关键设计决策

### 6.1 方案 B：独立 RTC 通道

**决策时间**: 2026-01-16

**背景**：
- 方案 A 依赖阿里云 `TakeoverAIAgentCall` API
- 该 API 文档不完整，调试困难

**决策**：
- 用户请求转人工时，后端创建**全新的独立 RTC 频道**
- 用户端断开 AI 连接，加入新频道
- 客服端直接加入新频道
- 完全自主控制，不依赖黑盒 API

**影响**：
- 用户端切换时有短暂静音（约 1-2 秒）
- 代码复杂度略增，但可控性大增

### 6.2 单例管理器模式

**决策内容**：所有 Manager 类导出实例而非类

```javascript
// 正确 ✅
class SessionManager { /* ... */ }
module.exports = new SessionManager();

// 使用
const sessionManager = require('./managers/SessionManager');
sessionManager.getSession(id);
```

**原因**：
- 避免多实例导致状态不一致
- 简化调用方式
- 适合内存中状态管理场景

### 6.3 WebSocket 心跳机制

```javascript
// 客服端每 30 秒发送 ping
socket.emit('ping');

// 服务端回复 pong
socket.on('ping', () => socket.emit('pong'));

// 超时判定：60 秒无心跳视为断开
```

---

## 7. 踩坑指南

### 7.1 区域配置不匹配

**现象**: API 返回 `AgentNotFound` 错误

**原因**: `.env` 中的 `ALIBABA_CLOUD_REGION` 与 Agent 实际区域不一致

**解决**: 登录阿里云 IMS 控制台，确认 Agent 所在区域（如 `cn-shanghai`）

### 7.2 RTC Token 签名错误

**现象**: WebSocket 连接失败，403 Forbidden，`token may be invalid`

**原因**: Token 签名字段顺序错误，或缺少 `Nonce`

**解决**: 确保签名顺序为 `AppID + AppKey + ChannelID + UserID + Nonce + Timestamp`

### 7.3 SDK 参数格式错误

**现象**: `InvalidParames, agentType is undefined`

**原因**: `engine.call()` 缺少 `agentType` 参数

**解决**:
```typescript
engine.call({
  agentType: AICallAgentType.VoiceAgent,  // 必须指定
  // ...其他参数
});
```

### 7.4 局域网麦克风权限

**现象**: 手机或其他电脑通过 IP 访问时无法使用麦克风

**原因**: 浏览器安全策略限制 `getUserMedia()` 只能在安全上下文（HTTPS 或 localhost）使用

**解决**:
1. 运行 `./generate-certs.sh` 生成自签名证书
2. 使用 HTTPS 访问（`https://192.168.x.x:5173`）
3. 浏览器提示证书不受信任时，点击"继续前往"

### 7.5 前端端口硬编码

**问题位置**:
- `src/hooks/useAICall.ts:144, 208`
- `agent-client/src/api/client.ts:4`
- `agent-client/src/hooks/useWebSocket.ts:5`

**影响**: 修改后端端口需同步修改这些文件

**建议**: 使用环境变量替代硬编码（已在 TODO 列表）

---

## 8. 测试与调试

### 8.1 测试场景清单

| 场景 | 状态 | 测试步骤 |
|------|------|----------|
| 用户主动转人工 | ✅ 已验证 | 点击"转人工"按钮 → 客服接入 → 通话 |
| 关键词触发 | ⚠️ 待测试 | 说"转人工" → 系统识别 → 自动发起 |
| AI 建议转人工 | ⚠️ 待测试 | 需配置 Agent 发送自定义消息 |
| 排队机制 | ⚠️ 待测试 | 多用户同时请求 → 客服逐个接入 |
| 客服拒绝 | ⚠️ 待测试 | 客服点击拒绝 → 用户收到通知 |
| 异常断线 | ⚠️ 待测试 | 刷新页面 → 会话自动清理 |

### 8.2 调试技巧

**后端日志**：
```bash
cd server && npm run dev
# 查看 console 输出，关注 [Session], [Agent], [RTC] 前缀
```

**前端日志**：
```javascript
// 打开浏览器控制台，关注以下日志
// [UserSubtitle] - 用户语音识别结果
// [AgentSubtitle] - AI 回复
// [HumanTakeover] - 转人工状态
```

**WebSocket 调试**：
```javascript
// 在浏览器控制台
socket.onAny((event, ...args) => console.log(event, args));
```

### 8.3 Playwright 自动化测试

项目已配置 Playwright MCP，可用于端到端测试：

```javascript
// 参考 PLAYWRIGHT_TEST_CASES.md
// 测试用例包括：登录、发起通话、转人工、客服接入等
```

---

## 9. 部署指南

### 9.1 云服务器信息

- **IP**: 47.237.118.74
- **项目路径**: `~/parking-ai-customer-service/parking-ai-customer-service`

### 9.2 部署步骤

```bash
# 1. SSH 登录
ssh root@47.237.118.74

# 2. 进入项目目录
cd ~/parking-ai-customer-service/parking-ai-customer-service

# 3. 拉取最新代码
git pull

# 4. 安装依赖（如有更新）
npm install
cd server && npm install
cd ../agent-client && npm install

# 5. 构建前端
cd .. && npm run build
cd agent-client && npm run build

# 6. 重启服务
pm2 restart all

# 7. 检查状态
pm2 status
```

### 9.3 生产环境配置

- **HTTPS**: 使用 Nginx 反向代理 + Let's Encrypt 证书
- **CORS**: 配置白名单，限制允许的域名
- **日志**: 使用 pm2 日志管理
- **监控**: 建议接入阿里云 ARMS 或 Prometheus

### 9.4 阿里云回调配置

登录阿里云 IMS 控制台，配置以下回调地址：

```
https://47.237.118.74:3000/api/agent-callback
```

可选：在 `.env` 配置 Token 验证
```env
AGENT_CALLBACK_TOKEN=your_secret_token
```

---

## 10. 后续开发建议

### 10.1 高优先级（P0）

| 任务 | 说明 | 预估工时 |
|------|------|----------|
| 端口配置环境变量化 | 消除硬编码，提高可配置性 | 2h |
| 完善错误提示 | 用户/客服端错误信息国际化 | 4h |
| 队列持久化 | 使用 Redis 替代内存存储 | 8h |

### 10.2 中优先级（P1）

| 任务 | 说明 | 预估工时 |
|------|------|----------|
| 客服评价系统 | 通话结束后用户评分 | 16h |
| 通话录音 | RTC 音频录制存储到 OSS | 24h |
| 监控告警 | 队列长度、响应时间监控 | 16h |

### 10.3 低优先级（P2）

| 任务 | 说明 | 预估工时 |
|------|------|----------|
| 客服转接 | 客服之间转接会话 | 16h |
| 离线留言 | 无客服在线时留言功能 | 8h |
| 数据看板 | 通话统计、客服绩效 | 24h |

### 10.4 架构优化建议

1. **微服务拆分**：如果并发量大，可将 SessionManager、QueueManager 拆分为独立服务
2. **数据库引入**：当前会话数据在内存中，生产环境建议使用 MySQL + Redis
3. **消息队列**：高并发场景可引入 RocketMQ/Kafka 削峰
4. **CDN 加速**：前端静态资源可上传到 OSS + CDN

---

## 11. 附录：文件清单

### 11.1 核心代码文件

```
parking-ai-customer-service/
├── src/
│   ├── hooks/
│   │   └── useAICall.ts          # ⭐ AI 通话 + 转人工核心 Hook
│   ├── App.tsx                    # 用户端主界面
│   └── App.css                    # 样式
├── agent-client/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts   # ⭐ WebSocket 连接管理
│   │   │   └── useRTCCall.ts     # ⭐ RTC 通话管理
│   │   ├── components/
│   │   │   ├── Dashboard.tsx     # 客服控制台
│   │   │   ├── SessionList.tsx   # 会话列表
│   │   │   └── CallPanel.tsx     # 通话面板
│   │   └── App.tsx               # 客服端主界面
│   └── package.json
├── server/
│   ├── managers/
│   │   ├── SessionManager.js     # ⭐ 会话管理（单例）
│   │   ├── AgentStatusManager.js # ⭐ 客服状态（单例）
│   │   └── QueueManager.js       # ⭐ 队列管理（单例）
│   ├── server.js                 # ⭐ Express 主服务 + API
│   ├── socket.js                 # ⭐ WebSocket 事件处理
│   └── .env.example              # 环境变量模板
```

### 11.2 文档文件

```
parking-ai-customer-service/
├── CLAUDE.md                     # ⭐ 项目架构总览（AI 助手必读）
├── README.md                     # 项目介绍
├── HANDOVER.md                   # ⭐ 本文档（移交指南）
├── PLAN_B_IMPLEMENTATION.md      # ⭐ 方案 B 技术文档
├── TESTING_GUIDE.md              # 测试指南
├── ALIYUN_SETUP_GUIDE.md         # 阿里云配置指南
├── PROJECT_STATUS.md             # 项目状态报告
└── log.md (根目录)               # ⭐ 开发日志（修改必读）
```

### 11.3 工具脚本

```
parking-ai-customer-service/
├── start-all.sh                  # 一键启动所有服务
├── stop-all.sh                   # 停止所有服务
├── restart-all.sh                # 重启所有服务
├── check-status.sh               # 检查服务状态
└── generate-certs.sh             # 生成 HTTPS 证书
```

---

## 📞 技术支持

遇到问题时的排查顺序：

1. **查看 log.md** - 是否有历史类似问题的解决方案
2. **查看 CLAUDE.md** - 架构和关键实现细节
3. **查看 TESTING_GUIDE.md** - 测试方法和常见问题
4. **查看阿里云文档** - API 详细说明

---

**祝开发顺利！** 🚀

---

*文档维护者: AI 全栈架构师*
*最后更新: 2026-01-23*
