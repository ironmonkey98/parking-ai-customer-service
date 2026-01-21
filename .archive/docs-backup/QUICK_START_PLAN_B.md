# 快速入门：方案 B 独立 RTC 通道转人工

## 📌 前置条件

### 1. 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 现代浏览器（支持 WebRTC）

### 2. 阿里云配置
- ✅ 阿里云账号
- ✅ IMS 智能体（Agent）已创建
- ✅ RTC 应用已创建
- ✅ AccessKey 和 Secret

---

## 🚀 快速启动（3 步）

### 步骤 1: 配置后端环境变量

```bash
cd parking-ai-customer-service/server
cp .env.example .env
nano .env
```

**必填配置**:
```env
# 阿里云凭证
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_REGION=cn-hangzhou

# AI 智能体 ID
AGENT_ID=your_agent_id

# RTC 应用配置
ALIBABA_CLOUD_RTC_APP_ID=your_rtc_app_id
ALIBABA_CLOUD_RTC_APP_KEY=your_rtc_app_key

# 服务端口
PORT=3000
```

**获取方式**:
- **AccessKey**: [RAM 控制台](https://ram.console.aliyun.com/manage/ak)
- **Agent ID**: [IMS 控制台](https://ims.console.aliyun.com/) → 智能体管理
- **RTC App**: [RTC 控制台](https://rtc.console.aliyun.com/) → 应用管理

---

### 步骤 2: 启动所有服务

**终端 1 - 启动后端**:
```bash
cd parking-ai-customer-service/server
npm install
npm run dev
```

**终端 2 - 启动用户端**:
```bash
cd parking-ai-customer-service
npm install
npm run dev
```

**终端 3 - 启动客服端**:
```bash
cd parking-ai-customer-service/agent-client
npm install
npm run dev
```

**验证服务状态**:
- 后端: http://localhost:3000/api/health ✅
- 用户端: http://localhost:5173 ✅
- 客服端: http://localhost:5174 ✅

---

### 步骤 3: 测试转人工流程

#### 3.1 客服登录

1. 打开 http://localhost:5174
2. 输入客服信息:
   - 客服 ID: `agent-001`
   - 姓名: `测试客服`
3. 点击"登录"
4. 确认状态显示"已连接 - 在线"

#### 3.2 用户发起通话

1. 打开 http://localhost:5173
2. 输入用户 ID: `user-001`
3. 点击"开始通话"
4. 等待连接 AI 智能体
5. 与 AI 对话测试

#### 3.3 转人工测试

**方式 1: 点击按钮** ⭐ 推荐
1. 用户端点击"转人工"按钮
2. 观察状态变化："正在为您转接人工客服..."
3. 客服端收到新会话通知
4. 客服点击"接听"
5. 用户端显示："已为您接通人工客服 测试客服"
6. 双方可以语音通话 ✅

**方式 2: 关键词触发**
1. 用户对 AI 说："转人工" 或 "人工客服"
2. 自动触发转人工流程
3. 后续流程同上

**方式 3: AI 主动建议**
1. 需要在阿里云 IMS 控制台配置 Agent 的自定义消息
2. AI 判断需要转人工时发送自定义消息
3. 用户端弹出确认对话框
4. 用户确认后触发转人工流程

---

## 🔍 调试指南

### 查看后端日志

```bash
# 后端服务日志
tail -f parking-ai-customer-service/server/logs/app.log

# 或直接查看终端输出
```

**关键日志标识**:
- `[HumanTakeover]` - 转人工相关
- `[AgentAccept]` - 客服接听相关
- `[WebSocket]` - WebSocket 事件
- `[RTC]` - RTC 相关（客服端）
- `[SwitchChannel]` - 频道切换（用户端）

### 浏览器控制台

**用户端（F12）**:
```javascript
// 查看 AI 通话状态
window.aiEngine

// 查看独立 RTC 客户端
window.humanRtcClient

// 查看会话信息
console.log(localStorage)
```

**客服端（F12）**:
```javascript
// 查看 RTC 状态
window.rtcEngine

// 查看当前会话
console.log(sessionStorage)
```

---

## 🎯 完整流程验证

### 场景 1: 标准转人工流程

```
✅ 1. 客服端登录
✅ 2. 用户发起 AI 通话
✅ 3. 用户点击"转人工"
✅ 4. 后端创建独立频道
✅ 5. 客服端收到通知
✅ 6. 客服点击"接听"
✅ 7. 用户端断开 AI，加入新频道
✅ 8. 客服端加入新频道
✅ 9. 用户与客服语音通话
✅ 10. 挂断结束
```

### 场景 2: 排队机制验证

```
1. 客服端设置为忙碌/离线
2. 用户请求转人工
3. 观察排队提示
4. 客服恢复在线
5. 自动分配会话
```

### 场景 3: 异常处理

```
1. 客服接听后断线 → 会话重新入队
2. 用户断线 → 会话自动结束
3. RTC 连接失败 → 显示错误提示
```

---

## 📊 关键指标监控

### 后端监控

```bash
# 查看当前会话数
curl http://localhost:3000/api/sessions

# 查看客服状态
curl http://localhost:3000/api/agents

# 查看排队情况
curl http://localhost:3000/api/queue
```

### 性能指标

- **频道创建时间**: < 100ms
- **Token 生成时间**: < 50ms
- **频道切换时间**: < 2s
- **音频延迟**: < 300ms

---

## 🐛 常见问题

### Q1: 用户端无法启动 AI 通话

**检查清单**:
- [ ] 后端服务是否正常运行
- [ ] `.env` 中的 `AGENT_ID` 是否正确
- [ ] 阿里云 Agent 是否在正确的区域
- [ ] 浏览器控制台是否有错误

**解决方案**:
```bash
# 验证后端 API
curl http://localhost:3000/api/health

# 检查 Agent ID
cat server/.env | grep AGENT_ID
```

### Q2: 客服端无法连接 WebSocket

**检查清单**:
- [ ] 后端 WebSocket 端口是否开放
- [ ] 浏览器是否阻止 WebSocket 连接
- [ ] CORS 配置是否正确

**解决方案**:
```javascript
// 浏览器控制台测试
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('Connected!'));
```

### Q3: 转人工后无法听到声音

**检查清单**:
- [ ] 麦克风权限是否开启
- [ ] 音频设备是否正常
- [ ] RTC Token 是否有效
- [ ] 频道 ID 是否匹配

**解决方案**:
```javascript
// 检查 RTC 连接状态
console.log(rtcClient.getConnectionState());

// 检查本地音频流
console.log(rtcClient.getLocalTracks());

// 检查远程音频流
console.log(rtcClient.getRemoteTracks());
```

### Q4: 后端报错 "RTC AppId/AppKey is not configured"

**解决方案**:
```bash
# 检查 RTC 配置
cat server/.env | grep RTC

# 确保配置了以下两项
ALIBABA_CLOUD_RTC_APP_ID=your_app_id
ALIBABA_CLOUD_RTC_APP_KEY=your_app_key
```

---

## 📝 测试检查表

### 基础功能
- [ ] 客服端登录成功
- [ ] 用户端发起 AI 通话
- [ ] 点击按钮转人工
- [ ] 客服接听成功
- [ ] 用户与客服语音通话
- [ ] 正常挂断

### 高级功能
- [ ] 关键词触发转人工
- [ ] AI 主动建议转人工
- [ ] 排队机制正常
- [ ] 客服拒绝会话
- [ ] 会话超时处理
- [ ] 异常断线恢复

### 性能测试
- [ ] 并发 5 个用户通话
- [ ] 通话时长 > 10 分钟
- [ ] 频道切换 < 2 秒
- [ ] 音频延迟 < 300ms

---

## 🎓 进阶配置

### 自定义关键词

编辑 `src/hooks/useAICall.ts` 第 53 行:
```typescript
const TRANSFER_KEYWORDS = [
  '人工客服',
  '转人工',
  '真人',
  '投诉',
  '人工',
  // 添加自定义关键词
  '客服',
  '帮助',
  '咨询'
];
```

### 调整排队超时时间

编辑 `server/socket.js` 第 220 行:
```javascript
// 默认 10 分钟超时
const timedOutSessions = queueManager.cleanupTimedOutSessions(600000);

// 修改为 5 分钟
const timedOutSessions = queueManager.cleanupTimedOutSessions(300000);
```

### 修改客服分配策略

编辑 `server/managers/AgentStatusManager.js`:
```javascript
// 当前：简单轮询
getAvailableAgent() {
  const onlineAgents = this.agents.filter(a => a.status === 'online');
  return onlineAgents[0]; // 返回第一个
}

// 优化：负载均衡（按通话数分配）
getAvailableAgent() {
  const onlineAgents = this.agents.filter(a => a.status === 'online');
  return onlineAgents.sort((a, b) => a.totalCalls - b.totalCalls)[0];
}
```

---

## 📚 相关文档

- [完整实施文档](./PLAN_B_IMPLEMENTATION.md)
- [项目开发日志](../log.md)
- [阿里云 RTC 文档](https://help.aliyun.com/zh/rtc/)
- [Socket.IO 文档](https://socket.io/docs/v4/)

---

## 💡 温馨提示

1. **首次测试建议**:
   - 使用 Chrome 浏览器
   - 确保麦克风权限已开启
   - 建议使用耳机避免回音

2. **生产环境部署**:
   - 配置 HTTPS（RTC 要求）
   - 配置 CORS 白名单
   - 启用日志记录
   - 设置监控告警

3. **性能优化**:
   - 使用 Redis 存储会话（避免内存泄漏）
   - 启用 CDN 加速前端资源
   - 配置 WebSocket 负载均衡

---

**实施日期**: 2026-01-16
**版本**: v1.0
**作者**: Claude Code

✨ 祝您测试顺利！如有问题请查看日志或联系技术支持。
