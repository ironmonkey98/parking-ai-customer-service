# 测试前环境检查清单

**生成时间**: 2026-01-13
**状态**: 执行中

---

## ⚠️ 发现的配置问题

### 🔴 严重问题 - 必须修复

**1. RTC APP KEY 缺失**
- **位置**: `server/.env` 第 23 行
- **问题**: `ALIBABA_CLOUD_RTC_APP_KEY` 被注释且未配置
- **影响**:
  - TakeoverAIAgentCall API 调用会失败
  - 客服无法获取 RTC Token
  - 真人接管功能完全无法使用
- **解决方案**:
  ```bash
  # 在 server/.env 中添加:
  ALIBABA_CLOUD_RTC_APP_KEY=your_actual_rtc_app_key
  ```
- **获取方式**:
  1. 登录阿里云 RTC 控制台: https://rtc.console.aliyun.com/
  2. 找到应用 ID `d4dabb6e-a1f9-488a-adaa-3c5c3240e83e` 对应的应用
  3. 查看应用密钥 (App Key)
  4. 复制完整密钥并粘贴到 `.env` 文件

---

## ✅ 已通过的配置检查

### 阿里云访问密钥
- ✅ `ALIBABA_CLOUD_ACCESS_KEY_ID`: 已配置
- ✅ `ALIBABA_CLOUD_ACCESS_KEY_SECRET`: 已配置

### 区域和 Agent 配置
- ✅ `ALIBABA_CLOUD_REGION`: cn-hangzhou
- ✅ `AGENT_ID`: 已配置

### 服务器配置
- ✅ `PORT`: 3000
- ✅ `NODE_ENV`: development
- ✅ `LOG_LEVEL`: debug

### RTC 配置
- ✅ `ALIBABA_CLOUD_RTC_APP_ID`: 已配置

---

## 📋 完整测试前检查清单

### 环境配置

- [x] 后端环境变量文件存在 (`server/.env`)
- [x] 阿里云访问密钥已配置
- [x] 阿里云区域已配置
- [x] Agent ID 已配置
- [x] RTC App ID 已配置
- [ ] **RTC App Key 已配置** ← 🔴 需要修复

### 依赖安装

- [ ] 后端依赖已安装 (`server/node_modules` 存在)
- [ ] 用户端依赖已安装 (`node_modules` 存在)
- [ ] 客服端依赖已安装 (`agent-client/node_modules` 存在)

### 服务状态

- [ ] 后端服务可以启动
- [ ] 用户端可以启动
- [ ] 客服端可以启动

---

## 🚀 下一步操作

### 立即执行

1. **配置 RTC App Key**:
   ```bash
   # 编辑 server/.env 文件
   nano server/.env

   # 或使用 vim
   vim server/.env

   # 取消注释第 23 行并填入正确的密钥
   ALIBABA_CLOUD_RTC_APP_KEY=your_actual_key_here
   ```

2. **保存文件后验证**:
   ```bash
   # 检查配置
   cat server/.env | grep RTC

   # 应该看到两行完整配置:
   # ALIBABA_CLOUD_RTC_APP_ID=d4dabb6e-a1f9-488a-adaa-3c5c3240e83e
   # ALIBABA_CLOUD_RTC_APP_KEY=your_actual_key_here
   ```

### 配置完成后

3. **检查依赖安装**:
   ```bash
   # 检查各项目的 node_modules 是否存在
   ls -la server/node_modules
   ls -la node_modules
   ls -la agent-client/node_modules
   ```

4. **启动所有服务**:
   ```bash
   ./start-all.sh
   ```

5. **开始测试场景一**:
   - 参考 `TESTING_GUIDE.md` 中的"场景一: 用户主动转人工流程"

---

## 📞 获取帮助

如果遇到问题:
1. 查看 `TESTING_GUIDE.md` 的"常见问题排查"章节
2. 检查后端日志: `tail -f server.log`
3. 检查用户端日志: `tail -f user-client.log`
4. 检查客服端日志: `tail -f agent-client.log`

---

## ⚙️ 配置文件引用

- **后端配置**: `server/.env`
- **客服端配置**: `agent-client/.env` (可选)
- **配置模板**:
  - `server/.env.example`
  - `agent-client/.env.example`

---

**重要提示**: 在 RTC App Key 配置完成之前，**不要启动服务进行测试**，否则会遇到 API 调用失败错误。
