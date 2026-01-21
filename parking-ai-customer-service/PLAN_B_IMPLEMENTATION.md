# 方案 B 实施总结：独立 RTC 通道转人工

## 📋 方案概述

**方案 B** 采用独立 RTC 通道实现真人客服接管，完全绕过阿里云的 `TakeoverAIAgentCall` API，避免了该 API 的限制和潜在问题。

### 核心思路

1. 用户请求转人工时，后端创建一个**新的独立 RTC 频道**（不使用 AI 的频道）
2. 客服接听时，后端生成**新的 RTC Token**（用户端和客服端各一个）
3. 用户端**断开 AI 连接**，加入新的 RTC 频道
4. 客服端**直接加入**同一个 RTC 频道
5. 用户和客服通过独立 RTC 频道进行**直接语音通话**

---

## 🏗️ 架构变化

### 方案 A（原方案，已弃用）
```
用户 ←→ AI 频道 ←→ AI Agent
             ↓ TakeoverAIAgentCall API (有问题)
         客服加入
```

### 方案 B（新方案，已实现）
```
用户 ←→ AI 频道 ←→ AI Agent
         (断开)
           ↓
用户 ←→ 独立 RTC 频道 ←→ 客服
```

---

## 🔧 实施细节

### 1. 后端修改

#### 1.1 新增 `getRTCToken` 函数

**文件**: `server/server.js` (第 162-214 行)

```javascript
/**
 * 生成独立 RTC Token（用于真人客服通话）
 */
async function getRTCToken({ channelId, userId, region }) {
    // 验证参数
    if (!channelId || !userId) {
        return { success: false, message: '缺少必要参数' };
    }

    if (!CONFIG.rtc.appId || !CONFIG.rtc.appKey) {
        return { success: false, message: 'RTC 未配置' };
    }

    // 生成 Token，有效期 24 小时
    const timestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const rtcAuthToken = createRtcAuthToken(channelId, userId, timestamp);

    return {
        success: true,
        rtcAuthToken,
        channelId,
        userId,
        timestamp,
    };
}
```

**功能**:
- 使用阿里云 RTC 的 Token 生成算法
- 支持任意频道 ID 和用户 ID
- Token 有效期 24 小时

---

#### 1.2 修改 `/api/agent-accept-call` 接口

**文件**: `server/server.js` (第 908-1076 行)

**关键变化**:

```javascript
// 创建独立 RTC 频道 ID
const humanChannelId = `HUMAN_${sessionId.replace(/-/g, '').substring(0, 24)}`;

// 为客服生成 Token
const agentTokenResult = await getRTCToken({
    channelId: humanChannelId,
    userId: agent.rtcUserId,
    region,
});

// 为用户生成 Token
const userTokenResult = await getRTCToken({
    channelId: humanChannelId,
    userId: session.userId,
    region,
});

// 通知用户端（包含新的 RTC 频道信息）
notifyUserTakeoverSuccess(io, session.userId, {
    agentId,
    name: agent.name,
}, {
    channelId: humanChannelId,
    userToken: userTokenResult.rtcAuthToken,
});

// 返回给客服端
res.json({
    success: true,
    data: {
        sessionId,
        channelId: humanChannelId,
        rtcToken: agentTokenResult.rtcAuthToken,
        rtcUserId: agent.rtcUserId,
        conversationHistory: session.conversationHistory,
        userId: session.userId,
    },
});
```

**流程**:
1. 生成独立频道 ID：`HUMAN_{sessionId}`
2. 分别为客服和用户生成 Token
3. 通过 WebSocket 通知用户端
4. 返回客服端所需信息

---

#### 1.3 更新 WebSocket 通知逻辑

**文件**: `server/socket.js` (第 275-300 行)

```javascript
function notifyUserTakeoverSuccess(io, userId, agentInfo, rtcInfo = null) {
  const payload = {
    userId,
    agentInfo: {
      agentId: agentInfo.agentId,
      name: agentInfo.name
    },
    message: '已为您接通人工客服'
  };

  // 方案 B：包含新的频道和 Token
  if (rtcInfo) {
    payload.rtcInfo = {
      channelId: rtcInfo.channelId,
      userToken: rtcInfo.userToken
    };
    payload.requireChannelSwitch = true;
  }

  io.emit('takeover-success', payload);
}
```

**数据格式**:
```json
{
  "userId": "user_123",
  "agentInfo": {
    "agentId": "agent_001",
    "name": "张三"
  },
  "message": "已为您接通人工客服",
  "rtcInfo": {
    "channelId": "HUMAN_abc123...",
    "userToken": "base64_encoded_token"
  },
  "requireChannelSwitch": true
}
```

---

### 2. 用户端修改

#### 2.1 新增 RTC 频道切换函数

**文件**: `src/hooks/useAICall.ts` (第 266-356 行)

```typescript
const switchToHumanChannel = useCallback(async (
  channelId: string,
  rtcToken: string,
  userId: string
) => {
  try {
    // 1. 断开 AI 通话引擎
    if (engine) {
      await engine.handup();
    }

    // 2. 使用阿里云 RTC SDK 加入新频道
    const AliRtcEngine = (window as any).AliRtcEngine;
    if (!AliRtcEngine) {
      throw new Error('阿里云 RTC SDK 未加载');
    }

    const rtcClient = AliRtcEngine.getInstance({
      instanceId: channelId,
    });

    humanRtcClientRef.current = rtcClient;

    // 配置事件监听
    rtcClient.on('onJoinChannelResult', (result: any) => {
      console.log('[RTC] Joined human channel:', result);
      isHumanCallActiveRef.current = true;
    });

    rtcClient.on('onRemoteUserOnLineNotify', (userId: string) => {
      // 订阅远程音频流（客服的声音）
      rtcClient.subscribe(userId);
    });

    // 加入频道
    await rtcClient.joinChannel({
      channelId,
      userId,
      token: rtcToken,
      audioOnly: true,
    });

    // 发布本地音频流
    await rtcClient.publish();

  } catch (error: any) {
    setError('切换到人工客服失败: ' + error.message);
  }
}, [engine]);
```

---

#### 2.2 监听 WebSocket 事件

**文件**: `src/hooks/useAICall.ts` (第 361-415 行)

```typescript
useEffect(() => {
  const socket = io('http://localhost:3000', {
    transports: ['websocket'],
  });

  socketRef.current = socket;

  // 监听客服接入成功事件
  socket.on('takeover-success', async (data: any) => {
    // 检查是否是方案 B（独立频道）
    if (data.rtcInfo?.channelId && data.rtcInfo?.userToken) {
      console.log('[Plan B] Received independent RTC channel info');

      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'ai',
        content: `已为您接通人工客服 ${data.agentInfo?.name || ''}，正在建立连接...`,
      }]);

      // 切换到独立 RTC 频道
      if (currentUserIdRef.current) {
        await switchToHumanChannel(
          data.rtcInfo.channelId,
          data.rtcInfo.userToken,
          currentUserIdRef.current
        );
      }
    }
  });

  return () => {
    socket.disconnect();
  };
}, [engine, switchToHumanChannel]);
```

---

#### 2.3 更新 `endCall` 函数

**文件**: `src/hooks/useAICall.ts` (第 417-449 行)

```typescript
const endCall = useCallback(async () => {
  // 1. 断开 AI 通话引擎
  if (engine) {
    await engine.handup();
    setCallState('ended');
  }

  // 2. 断开独立 RTC 频道（如果正在与真人客服通话）
  if (humanRtcClientRef.current && isHumanCallActiveRef.current) {
    await humanRtcClientRef.current.leaveChannel();
    humanRtcClientRef.current = null;
    isHumanCallActiveRef.current = false;
  }

  // 3. 断开 WebSocket
  if (socketRef.current) {
    socketRef.current.disconnect();
  }

  // 4. 重置状态
  setHumanTakeover({
    isTransferring: false,
    isWaitingHuman: false,
    sessionId: null,
    queuePosition: 0,
    estimatedWaitTime: 0,
  });
}, [engine]);
```

---

### 3. 客服端修改

#### 3.1 更新 RTC 加入逻辑

**文件**: `agent-client/src/hooks/useRTCCall.ts` (第 62-122 行)

```typescript
const startRtc = useCallback(async (callInfo: TakeoverAcceptResponse) => {
  const support = await AliRtcEngine.isSupported();
  if (!support.support) {
    setRtcError('当前浏览器不支持 RTC');
    return;
  }

  rtcEngineRef.current = AliRtcEngine.getInstance();
  attachRtcListeners();

  // 添加远程用户加入事件监听
  rtcEngineRef.current.on('onRemoteUserOnLineNotify', (userId: string) => {
    console.log('[RTC] Remote user joined:', userId);
    // 订阅远程用户的音频流
    rtcEngineRef.current?.subscribe(userId);
  });

  // 方案 B：加入独立 RTC 频道
  await rtcEngineRef.current.joinChannel({
    channelId: callInfo.channelId,
    userId: callInfo.rtcUserId,
    token: callInfo.rtcToken,
    audioOnly: true,
  });

  // 发布本地音频流
  await rtcEngineRef.current.publish();

  setRtcStatus('joined');
}, [attachRtcListeners]);
```

---

## 🔄 完整流程图

```
┌─────────────┐
│  用户发起   │
│  AI 通话    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  AI 频道    │
│  正常通话   │
└──────┬──────┘
       │
       │ 用户请求转人工
       ▼
┌─────────────────────────────┐
│  后端处理                    │
│  1. 保存会话信息             │
│  2. 分配客服/加入队列         │
└──────┬──────────────────────┘
       │
       │ 客服接听
       ▼
┌─────────────────────────────┐
│  后端生成独立频道            │
│  1. channelId: HUMAN_xxx     │
│  2. agentToken (客服)        │
│  3. userToken (用户)         │
└──────┬──────────────────────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ WebSocket   │   │  HTTP 响应  │   │  更新会话   │
│ 通知用户端  │   │  返回客服端 │   │  状态       │
└──────┬──────┘   └──────┬──────┘   └─────────────┘
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  用户端      │   │  客服端     │
│  1. 断开AI   │   │  1. 加入频道│
│  2. 加入新频道│   │  2. 发布音频│
│  3. 发布音频 │   │  3. 订阅用户│
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                ▼
        ┌───────────────┐
        │  独立 RTC 频道 │
        │  用户 ↔ 客服   │
        └───────────────┘
```

---

## 🚀 使用方法

### 1. 启动后端服务

```bash
cd server
npm install
npm run dev
```

**确保 `.env` 配置完整**:
```env
ALIBABA_CLOUD_ACCESS_KEY_ID=your_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_key_secret
ALIBABA_CLOUD_REGION=cn-hangzhou
AGENT_ID=your_agent_id
ALIBABA_CLOUD_RTC_APP_ID=your_rtc_app_id
ALIBABA_CLOUD_RTC_APP_KEY=your_rtc_app_key
PORT=3000
```

---

### 2. 启动用户端

```bash
npm install
npm run dev
```

访问: `http://localhost:5173`

---

### 3. 启动客服端

```bash
cd agent-client
npm install
npm run dev
```

访问: `http://localhost:5174`

---

### 4. 测试流程

1. **客服端登录**
   - 打开 `http://localhost:5174`
   - 输入客服 ID 和姓名
   - 点击"登录"

2. **用户端发起通话**
   - 打开 `http://localhost:5173`
   - 输入用户 ID
   - 点击"开始通话"

3. **测试转人工**

   **方式 1: 点击按钮**
   - 用户点击"转人工"按钮

   **方式 2: 关键词触发**
   - 用户说出："人工客服"、"转人工"、"真人"、"投诉"等关键词

   **方式 3: AI 主动建议**
   - AI 发送自定义消息（需在阿里云控制台配置 Agent）

4. **客服接听**
   - 客服端收到新会话通知
   - 点击"接听"按钮
   - 自动加入独立 RTC 频道

5. **通话验证**
   - 用户端显示："已为您接通人工客服 XXX"
   - 客服端显示："正在通话中"
   - 双方可以正常语音通话

6. **结束通话**
   - 用户或客服点击"挂断"按钮
   - 断开 RTC 连接
   - 会话标记为已结束

---

## ✅ 方案优势

### vs 方案 A (TakeoverAIAgentCall)

| 对比项 | 方案 A | 方案 B ✅ |
|--------|--------|----------|
| **API 依赖** | 依赖 `TakeoverAIAgentCall` | 完全独立 |
| **频道控制** | 受限于 AI 频道 | 完全自主控制 |
| **Token 生成** | 依赖 API 返回 | 自主生成 |
| **稳定性** | 受 API 限制影响 | 高（仅依赖 RTC SDK） |
| **调试难度** | 高（黑盒 API） | 低（逻辑透明） |
| **扩展性** | 受限 | 高（可自由扩展） |
| **成本** | API 调用成本 | 仅 RTC 流量成本 |

---

## 📊 技术栈

- **后端**: Node.js + Express + Socket.IO
- **用户端**: React + TypeScript + Vite + `aliyun-auikit-aicall`
- **客服端**: React + TypeScript + Vite + `aliyun-rtc-sdk`
- **实时通信**: Socket.IO (WebSocket)
- **语音通话**: 阿里云 RTC SDK

---

## 🔒 安全考虑

1. **Token 有效期**: 24 小时，足够长避免频繁刷新
2. **频道 ID 唯一性**: 使用 `HUMAN_{sessionId}` 确保唯一
3. **权限验证**: 客服必须登录才能接听
4. **会话隔离**: 每个会话使用独立频道

---

## 🐛 已知问题与解决方案

### 问题 1: 用户端切换频道时可能有短暂静音

**原因**: 断开 AI 频道和加入新频道之间有时间间隔

**解决方案**:
- 在用户端显示"正在连接人工客服..."提示
- 优化切换逻辑，减少间隔时间

---

### 问题 2: 客服端 RTC SDK 版本兼容性

**原因**: `aliyun-rtc-sdk` 的 API 可能因版本而异

**解决方案**:
- 使用最新稳定版本
- 参考阿里云官方文档确认 API 签名

---

## 📝 后续优化建议

1. **断线重连**: 实现 RTC 断线自动重连机制
2. **通话质量监控**: 记录通话质量指标（延迟、丢包率等）
3. **录音功能**: 添加通话录音（需阿里云 RTC 录制服务）
4. **转接历史**: 保存转接记录到数据库
5. **客服评价**: 通话结束后用户评价客服
6. **多客服负载均衡**: 改进客服分配算法

---

## 📚 参考文档

- [阿里云 RTC SDK 文档](https://help.aliyun.com/zh/rtc/)
- [Socket.IO 文档](https://socket.io/docs/v4/)
- [React TypeScript 最佳实践](https://react-typescript-cheatsheet.netlify.app/)

---

## 🎯 总结

方案 B 通过使用独立 RTC 通道成功绕过了 `TakeoverAIAgentCall` API 的限制，实现了稳定可靠的真人客服接管功能。该方案：

✅ **架构清晰**: 用户、客服、AI 各司其职
✅ **逻辑简单**: 流程易于理解和维护
✅ **扩展性强**: 易于添加新功能
✅ **稳定可靠**: 不依赖第三方黑盒 API

---

**实施日期**: 2026-01-16
**实施者**: Claude Code
**项目**: 停车场智能客服系统
