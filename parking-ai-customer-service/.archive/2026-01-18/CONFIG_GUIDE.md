# 🔧 配置指南

## ⚠️ 重要：必需配置

项目已修复并可以运行，但**需要您配置真实的阿里云凭证**才能使用完整功能。

---

## 📋 快速配置（3步）

### 步骤 1: 编辑环境变量

```bash
cd server
nano .env
```

### 步骤 2: 修改以下值

**必须修改的配置**:
```bash
# 1. 阿里云 AccessKey（必需）
ALIBABA_CLOUD_ACCESS_KEY_ID=<替换为你的AccessKey ID>
ALIBABA_CLOUD_ACCESS_KEY_SECRET=<替换为你的AccessKey Secret>

# 2. AI智能体ID（必需）
AGENT_ID=<替换为你的Agent ID>
```

**可选配置**（如果使用 RTC）:
```bash
ALIBABA_CLOUD_RTC_APP_ID=<你的RTC AppId>
ALIBABA_CLOUD_RTC_APP_KEY=<你的RTC AppKey>
```

### 步骤 3: 保存并重启

```bash
# 保存文件后，重启后端
cd /Users/hongye/Desktop/aihelper/parking-ai-customer-service/server
npm start
```

---

## 🔑 如何获取凭证

### 1. 获取 AccessKey

1. 访问: https://ram.console.aliyun.com/manage/ak
2. 登录阿里云账号
3. 点击"创建 AccessKey"
4. **重要**: 保存 AccessKey ID 和 AccessKey Secret（只显示一次）

⚠️ **安全提示**:
- AccessKey 拥有完整账号权限，请妥善保管
- 不要提交到 Git（已在 .gitignore 中排除）
- 建议使用子账号 AccessKey

### 2. 获取 Agent ID

1. 访问阿里云 IMS 控制台
2. 创建 AI 智能体
3. 配置智能体参数:
   - 名称: 停车场客服
   - 类型: 语音对话
   - 场景: 客服咨询
4. 创建成功后，复制 Agent ID

### 3. 获取 RTC 配置（可选）

如果使用实时通信功能:
1. 访问阿里云 RTC 控制台
2. 创建应用
3. 获取 AppId 和 AppKey

---

## ✅ 验证配置

配置完成后，测试 API:

```bash
# 启动后端
cd server
npm start

# 新终端，测试 API
curl -X POST http://localhost:3000/api/start-call \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'
```

**期望结果**:
- ✅ 返回 JSON，包含 `rtcChannelId`, `rtcJoinToken` 等字段
- ❌ 如果返回 `AgentNotFound`，说明 Agent ID 不正确
- ❌ 如果返回 `InvalidAccessKeyId`，说明 AccessKey 不正确

---

## 🚀 完整启动流程

### 1. 启动后端
```bash
cd /Users/hongye/Desktop/aihelper/parking-ai-customer-service/server
npm start
```

期望输出:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║    🚀 停车场AI客服后端服务                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Server is running at http://localhost:3000
```

### 2. 启动前端（新终端）
```bash
cd /Users/hongye/Desktop/aihelper/parking-ai-customer-service
npm run dev
```

期望输出:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

### 3. 访问应用
打开浏览器访问: http://localhost:3000

---

## 🔍 常见问题

### Q1: API 返回 500 错误
**原因**: 环境变量未配置或配置错误

**解决**:
```bash
cd server
cat .env  # 检查配置
```

确保:
- ✅ `AGENT_ID` 不是示例值
- ✅ `ALIBABA_CLOUD_ACCESS_KEY_ID` 已配置
- ✅ `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 已配置

### Q2: AgentNotFound 错误
**原因**: Agent ID 不存在或已删除

**解决**:
1. 登录阿里云 IMS 控制台
2. 检查 Agent ID 是否正确
3. 确认 Agent 状态为"已发布"

### Q3: InvalidAccessKeyId
**原因**: AccessKey 不正确或已禁用

**解决**:
1. 检查 AccessKey 是否复制完整
2. 确认 AccessKey 状态为"启用"
3. 尝试创建新的 AccessKey

### Q4: 端口被占用
**错误**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决**:
```bash
# 查找占用进程
lsof -i :3000

# 杀掉进程（替换 PID）
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm start
```

---

## 📝 配置检查清单

完成配置后，请确认:

**后端配置** (server/.env):
- [ ] ALIBABA_CLOUD_ACCESS_KEY_ID - 已填写真实值
- [ ] ALIBABA_CLOUD_ACCESS_KEY_SECRET - 已填写真实值
- [ ] AGENT_ID - 已填写真实 Agent ID
- [ ] PORT - 端口设置（默认 3000）

**测试验证**:
- [ ] 后端启动无错误
- [ ] API 测试返回正常
- [ ] 前端可以访问
- [ ] 浏览器控制台无 500 错误

---

## 🆘 需要帮助？

**查看文档**:
- `README.md` - 项目介绍
- `QUICK_START.md` - 快速启动
- `log.md` - 开发日志和历史问题

**技术支持**:
- 阿里云文档: https://help.aliyun.com
- IMS 产品文档: 搜索"阿里云智能媒体服务"

---

**配置完成后，您就可以使用完整的 AI 客服功能了！** 🎉
