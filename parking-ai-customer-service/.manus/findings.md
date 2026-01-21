# 停车场 AI 智能客服系统 - 研究发现

> **按照 Manus 方法论创建** - planning-with-files skill
>
> **创建时间**: 2026-01-18 22:30

---

## 🔍 架构发现

### 1. 方案 B（独立 RTC 通道）架构优势

**架构对比**:
```
方案 A（已弃用）:
用户 ←→ AI 频道 ←→ AI Agent
             ↓ TakeoverAIAgentCall API (有问题)
         客服加入

方案 B（已实现）:
用户 ←→ AI 频道 ←→ AI Agent
         (断开)
           ↓
用户 ←→ 独立 RTC 频道 ←→ 客服
```

**优势**:
- ✅ 完全自主控制频道
- ✅ Token 自主生成
- ✅ 调试透明
- ✅ 高扩展性

### 2. 关键代码实现发现

**用户端频道切换** (`src/hooks/useAICall.ts`):
```typescript
const switchToHumanChannel = useCallback(async (
  channelId: string,
  rtcToken: string,
  userId: string
) => {
  // 1. 断开 AI 通话引擎
  // 2. 创建新的 RTC 客户端
  // 3. 配置事件监听
  // 4. 加入新频道
  // 5. 发布本地音频流
});
```

**客服端 RTC 加入** (`agent-client/src/hooks/useRTCCall.ts`):
```typescript
const startRtc = useCallback(async (callInfo: TakeoverAcceptResponse) => {
  // 使用 AliRtcAuthInfo 对象加入频道
  await rtcEngine.joinChannel({
    appId: callInfo.rtcAppId,
    channelId: callInfo.channelId,
    userId: callInfo.rtcUserId,
    token: callInfo.rtcToken,
    timestamp: callInfo.rtcTimestamp,
  });
});
```

### 3. Token 签名算法发现

**正确顺序**: `AppID + AppKey + ChannelID + UserID + Nonce + Timestamp`

**验证示例**:
- 输入: AppID="abc", AppKey="abckey", ChannelID="abcChannel", UserID="abcUser", Nonce="", timestamp=1699423634
- 期望哈希: `3c9ee8d9f8734f0b7560ed8022a0590659113955819724fc9345ab8eedf84f31`
- ✅ 验证匹配

---

## 📊 技术栈发现

### 前端技术栈
- **框架**: React 18.2.0
- **构建**: Vite 4.4.5（用户端）/ Vite 7.3.1（客服端）
- **语言**: TypeScript 5.9.3
- **通信**: Socket.io-client 4.8.3
- **RTC SDK**: aliyun-auikit-aicall ^1.1.0

### 后端技术栈
- **运行时**: Node.js 25.2.1
- **框架**: Express 4.18.2
- **WebSocket**: Socket.io
- **阿里云**: @alicloud SDK

### 服务端口分配
| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 | 3000 | Express + Socket.io |
| 用户端 | 5173 | Vite 开发服务器 |
| 客服端 | 5174 | Vite 开发服务器 |

---

## 🧪 测试发现

### 2026-01-18 自动化测试结果

**通过的测试**:
1. ✅ TC-001: 服务可用性检查（所有服务正常运行）
2. ✅ TC-102: 后端 API 测试（阿里云调用成功）
3. ✅ TC-103: WebSocket 连接测试
4. ✅ TC-105: 项目配置检查
5. ✅ TC-106: 方案 B 实施验证
6. ✅ TC-107: 前端服务验证
7. ✅ TC-108: 关键文件完整性

**部分通过**:
1. ⚠️ TC-104: 转人工 API（需要完整会话参数）

**通过率**: 87.5%

### 阿里云 API 验证结果
```json
{
  "API": "GenerateAIAgentCall",
  "状态": "成功",
  "返回数据": {
    "instanceId": "de7831f84a504360a1eeffaf674d3a52",
    "rtcChannelId": "CHANNELc96a5082057a48139eca6c3d9af105ec"
  }
}
```

---

## ⚠️ 待验证功能

根据 log.md 第 587-594 行，以下功能待验证：

### 高优先级 (P1)
1. **关键词触发转人工**
   - 位置: `src/hooks/useAICall.ts:84-90`
   - 关键词: 人工客服、转人工、真人、投诉、人工
   - 状态: 代码已实现，需实际测试

2. **AI 主动建议转人工**
   - 位置: `src/hooks/useAICall.ts:107-120`
   - 状态: 需确认阿里云 AI Agent 支持情况

3. **排队机制**
   - 位置: `server/managers/QueueManager.js`
   - 状态: FIFO 逻辑已实现，需多用户测试

### 中优先级 (P2)
4. **客服拒绝会话** - UI 已有，需测试业务逻辑
5. **异常断线处理** - 需模拟异常场景
6. **长时间通话稳定性** - 需 30 分钟以上测试

---

## 🎓 经验教训

### 成功经验
1. **完善的日志系统**: log.md 记录了 1055+ 行开发历史
2. **方案 B 设计**: 独立 RTC 通道避免了阿里云 API 黑盒问题
3. **详尽的文档**: 40+ 文档文件覆盖全面

### 踩过的坑
1. **RTC Token 签名**: 字段顺序必须严格按照官方文档
2. **SDK 参数格式**: 不同版本的 SDK 参数格式可能不同
3. **端口配置**: 前后端端口必须一致，避免硬编码

---

**更新时间**: 2026-01-18 22:30
