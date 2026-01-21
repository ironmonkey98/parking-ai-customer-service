# 🚀 快速参考卡片

## 一键启动命令

```bash
# 最简单（交互式菜单）
./menu.sh

# 最快速（命令行）
./restart-all.sh

# 检查状态
./check-status.sh

# 查看网络
./test-network.sh
```

---

## 访问地址

| 服务 | 本机访问 | 局域网访问 |
|------|---------|-----------|
| 用户端 | http://localhost:5173 | http://你的IP:5173 |
| 客服端 | http://localhost:5174 | http://你的IP:5174 |
| 后端API | http://localhost:3000 | http://你的IP:3000 |

---

## 测试流程（5步）

### 1️⃣ 启动服务
```bash
./restart-all.sh
```

### 2️⃣ 客服登录
- 访问：http://localhost:5174
- 输入客服 ID：`agent-001`
- 点击"连接"

### 3️⃣ 用户通话
- 访问：http://localhost:5173
- 点击"开始通话"
- 说"转人工"

### 4️⃣ 客服接听
- 看到新会话
- 点击"接听"
- 等待 RTC 连接

### 5️⃣ 验证通话
- ✅ 客服说话，用户能听到
- ✅ 用户说话，客服能听到
- ✅ 静音按钮正常工作

---

## 关键修复点

### 客服端 RTC 音频发布
```typescript
// useRTCCall.ts (已修复)
await rtcEngine.joinChannel(token, userId);
await rtcEngine.configLocalAudioPublish(true); // ✅ 新增
await rtcEngine.publish();                      // ✅ 新增
```

### 局域网访问配置
```typescript
// vite.config.ts (已修复)
server: {
  host: '0.0.0.0',  // ✅ 新增
  port: 5173,
}
```

### 麦克风控制界面
```typescript
// CallPanel.tsx (已完善)
<button onClick={onToggleMute}>
  {isMuted ? '🔇 取消静音' : '🎤 静音'}
</button>
```

---

## 常用命令速查

```bash
# 启动
./start-all.sh       # 启动所有服务
./start-backend.sh   # 仅启动后端
./restart-all.sh     # 重启所有服务

# 停止
./stop-all.sh        # 停止所有服务

# 监控
./check-status.sh    # 检查服务状态
./view-logs.sh       # 查看日志
./test-network.sh    # 网络测试

# 工具
./menu.sh            # 交互式菜单
```

---

## 故障排查

### 端口被占用
```bash
lsof -ti:5173,5174,3000 | xargs kill -9
```

### 查看实时日志
```bash
tail -f logs/backend.log
```

### 清理并重启
```bash
./stop-all.sh
./start-all.sh
```

---

## 浏览器控制台关键日志

### 客服端（正常情况）
```
[RTC] Joining independent channel: {...}
[RTC] Publishing microphone audio...
[RTC] Successfully joined channel and published audio
```

### 用户端（正常情况）
```
[AI Call] Connected
[Transfer] Requesting human takeover...
[Transfer] Waiting for agent...
```

---

## 文档索引

| 文档 | 用途 |
|------|------|
| **TEST_CHECKLIST.md** | 详细测试步骤 |
| **FINAL_WORK_SUMMARY.md** | 完整工作总结 |
| **SCRIPTS.md** | 脚本详细说明 |
| **NETWORK_ACCESS.md** | 网络配置指南 |
| **AGENT_RTC_FIX.md** | RTC 修复详解 |

---

## 已完成清单

- ✅ 8 个启动脚本
- ✅ 6 个详细文档
- ✅ 局域网访问配置
- ✅ 客服端 RTC 音频发布
- ✅ 麦克风静音控制
- ✅ 完善的通话界面

---

**现在可以开始测试了！**

推荐：`./menu.sh` （最简单）

祝顺利！🎉
