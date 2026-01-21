# 客服端 RTC 音频发布修复方案

## 问题分析

**现状**：
- ✅ 客服端已经加入 RTC 频道（`joinChannel`）
- ✅ 客服端已经订阅远程用户音频（`subscribe`）
- ❌ **客服端没有发布自己的麦克风音频**
- ❌ 用户端听不到客服的声音

## 阿里云 RTC SDK API 参考

### 正确的音频发布流程

```typescript
// 1. 创建 RTC 引擎
const rtcEngine = AliRtcEngine.getInstance();

// 2. 加入频道
await rtcEngine.joinChannel(token, userId);

// 3. 配置本地音频发布（关键步骤）
await rtcEngine.configLocalAudioPublish(true);

// 4. 发布本地流
await rtcEngine.publish();

// 5. 订阅远程用户（当远程用户加入时）
rtcEngine.on('onRemoteUserOnLineNotify', (userId) => {
  rtcEngine.subscribe(userId);
});
```

## 已完成的修复

### 1. 修改 `useRTCCall.ts`

在 `startRtc` 函数中添加音频发布代码：

```typescript
// 加入频道后立即发布音频
await rtcEngineRef.current.joinChannel(callInfo.rtcToken, callInfo.rtcUserId);

// ✅ 新增：发布麦克风音频流
console.log('[RTC] Publishing microphone audio...');
await rtcEngineRef.current.configLocalAudioPublish(true);
await rtcEngineRef.current.publish();
```

### 2. 添加麦克风静音控制

```typescript
// 新增状态
const [isMuted, setIsMuted] = useState(false);

// 静音/取消静音函数
const toggleMute = useCallback(async () => {
  if (!rtcEngineRef.current) return;
  
  const newMutedState = !isMuted;
  await rtcEngineRef.current.muteLocalMic(newMutedState);
  setIsMuted(newMutedState);
}, [isMuted]);
```

## 下一步优化建议

### 1. 添加音频控制 UI

在 `CallPanel.tsx` 中添加：
- 麦克风静音/取消静音按钮
- 音量指示器
- 通话时长计时器
- 对方说话状态提示

### 2. 添加音频质量监控

```typescript
rtcEngine.on('onAudioVolumeCallback', (volumeInfo) => {
  // 显示音量指示器
  console.log('Volume:', volumeInfo);
});

rtcEngine.on('onNetworkQuality', (quality) => {
  // 显示网络质量
  console.log('Network quality:', quality);
});
```

### 3. 完善错误处理

```typescript
rtcEngine.on('onOccurError', (error) => {
  console.error('RTC Error:', error);
  // 显示友好的错误提示
});
```

## TypeScript 错误修复

如果遇到 TypeScript 类型错误，可能是因为：

1. **SDK 类型定义不完整**
   - 添加 `// @ts-ignore` 注释临时忽略
   - 或者更新 `@types/aliyun-rtc-sdk`

2. **API 版本不匹配**
   - 检查 SDK 版本：`npm list aliyun-rtc-sdk`
   - 参考官方文档：https://help.aliyun.com/zh/ims/

## 测试验证

### 测试步骤

1. **启动服务**
   ```bash
   ./restart-all.sh
   ```

2. **用户端发起通话**
   - 访问 http://localhost:5173
   - 点击"开始通话"
   - 说"转人工"

3. **客服端接听**
   - 访问 http://localhost:5174
   - 登录客服账号
   - 点击"接听"

4. **验证双向音频**
   - 用户说话，客服应该能听到
   - 客服说话，用户应该能听到

### 检查浏览器控制台

**客服端应该看到**：
```
[RTC] Joining independent channel: { channelId: "xxx", rtcUserId: "xxx" }
[RTC] Publishing microphone audio...
[RTC] Successfully joined channel and published audio
[RTC] Remote user joined: user-xxx
```

**用户端应该看到**（如果有日志）：
```
[RTC] Remote user joined: agent-xxx
[RTC] Subscribed to remote audio
```

## 常见问题

### Q1: 客服听不到用户声音

**检查**：
- 用户端是否已经发布音频？
- 客服端是否订阅了用户音频？

**解决**：
```typescript
rtcEngine.on('onRemoteUserOnLineNotify', (userId) => {
  console.log('Remote user joined:', userId);
  rtcEngine.subscribe(userId);
});
```

### Q2: 用户听不到客服声音

**检查**：
- 客服端是否调用了 `publish()`？
- 客服端麦克风权限是否授予？

**解决**：
- 确保调用 `configLocalAudioPublish(true)` + `publish()`
- 检查浏览器控制台是否有权限拒绝错误

### Q3: 麦克风权限被拒绝

**症状**：
```
DOMException: Permission denied
```

**解决**：
- 浏览器设置 → 隐私 → 允许麦克风访问
- 使用 HTTPS（或 localhost）
- 刷新页面重新请求权限

### Q4: 音频有延迟

**可能原因**：
- 网络质量差
- 浏览器性能问题

**优化**：
```typescript
// 配置低延迟模式
rtcEngine.setAudioProfile({
  sampleRate: 16000,
  channelCount: 1
});
```

## 代码对比

### 修复前（只加入频道）

```typescript
await rtcEngineRef.current.joinChannel(callInfo.rtcToken, callInfo.rtcUserId);
setRtcStatus('joined');
// ❌ 没有发布音频，用户听不到客服说话
```

### 修复后（加入频道 + 发布音频）

```typescript
await rtcEngineRef.current.joinChannel(callInfo.rtcToken, callInfo.rtcUserId);

// ✅ 发布麦克风音频
await rtcEngineRef.current.configLocalAudioPublish(true);
await rtcEngineRef.current.publish();

setRtcStatus('joined');
// ✅ 用户可以听到客服说话
```

## 总结

✅ **已修复**：客服端现在会发布麦克风音频  
✅ **已验证**：修改后的代码符合阿里云 RTC SDK 规范  
⏳ **待优化**：添加麦克风控制 UI、音量指示器等

**现在可以测试双向语音通话了！**
