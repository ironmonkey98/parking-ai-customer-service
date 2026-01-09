# 项目开发日志

## 2026-01-09 14:00 - 项目修复

### 问题诊断
**发现的问题**:
1. 文件系统读取异常
   - 现象: package.json, tsconfig.json 等文件显示有大小但无法读取
   - 影响: Vite 构建失败，报错 "Unexpected end of file in JSON"
   - 原因: macOS 扩展属性（com.apple.provenance）导致文件访问异常

2. 缺少开发日志
   - 项目没有 log.md 文件
   - 违反编码铁律："修改前先查看 log.md"

3. 缺少版本控制
   - 项目不在 Git 管理下
   - 无版本历史和回滚能力

### 修复措施
- [x] 使用 `xattr -cr .` 移除所有 macOS 扩展属性
- [x] 验证所有配置文件可正常读取
- [x] 创建 log.md（本文件）
- [x] 初始化 Git 仓库（提交ID: 44a6268）
- [x] 验证 Vite 构建成功
- [x] 验证后端服务器可启动

### 修复结果
- ✅ package.json: 844 字符，正常
- ✅ tsconfig.json: 562 字符，正常
- ✅ tsconfig.node.json: 213 字符，正常
- ✅ README.md: 4838 字符，正常
- ✅ 文件系统访问恢复正常
- ✅ Vite 开发服务器: 正常运行在 http://localhost:3000
- ✅ 后端服务器: 可正常启动
- ✅ Git 版本控制: 已建立（39个文件，6638行代码）

### 验证测试
```bash
# 前端测试
curl http://localhost:3000/  # ✅ 返回HTML页面

# Vite进程
ps aux | grep vite  # ✅ PID 17697, 正常运行

# Git状态
git log --oneline  # ✅ 44a6268 Initial commit
```

### 技术细节
- 位置: `/Users/hongye/Desktop/aihelper/parking-ai-customer-service`
- 修复工具: xattr (移除扩展属性)
- 验证方法: Python 底层文件读取

### 风险评估
- ✅ 低风险：仅移除元数据，不影响文件内容
- ✅ 源代码未被修改
- ✅ 依赖包完好无损

---

## 开发规范（重要！）

### 📌 修改代码前必读
1. **必读** 本文件（log.md）
2. 确认要修改的部分和原因
3. 检查是否有历史问题记录

### ✍️ 修改代码后必记
1. 在此文件记录修改断点
2. 说明修改了什么、为什么修改
3. 标注文件位置和可能的风险
4. 防止功能回滚

### 📝 记录格式
```
## YYYY-MM-DD HH:MM - 模块名称
### 修改内容
- 修改: 具体改动描述
- 原因: 为什么需要这个改动
- 位置: 文件路径:行号
- 影响: 可能影响的功能模块
- 风险: 潜在问题和注意事项
```

### ⚠️ 禁止事项
- ❌ 不查看 log.md 就大段修改代码
- ❌ 修改后不记录断点
- ❌ 不说明修改原因
- ❌ 盲目重构导致功能回滚

---

---

## 2026-01-09 14:30 - 修复端口配置和API调用

### 发现的问题
1. 端口不匹配
   - 现象: 前端请求 http://localhost:4000/api/start-call 失败
   - 原因: `src/hooks/useAICall.ts` 硬编码了 4000 端口，但后端运行在 3000

2. AgentNotFound 错误
   - 现象: API 返回 500 错误，提示 Agent ID 不存在
   - 原因: .env 中的 AGENT_ID 是示例值，需要用户配置真实的阿里云 Agent ID

### 修复措施
- [x] 修改 `src/hooks/useAICall.ts:93` 将端口从 4000 改为 3000
- [x] 验证后端 API 可以正常响应
- [x] 识别需要用户配置的环境变量

### 修复内容
- 修改: `src/hooks/useAICall.ts:93`
- 原因: 端口硬编码错误，导致前后端无法通信
- 位置: `src/hooks/useAICall.ts` 第93行
- 影响: 前端所有 API 调用
- 风险: 低，仅修改端口配置

### 用户需要的配置
**重要**: 以下环境变量需要用户自己配置真实值：

```bash
cd server
nano .env

# 必须修改以下值:
ALIBABA_CLOUD_ACCESS_KEY_ID=<你的阿里云AccessKey>
ALIBABA_CLOUD_ACCESS_KEY_SECRET=<你的阿里云Secret>
AGENT_ID=<你的AI智能体ID>
```

获取方式:
1. AccessKey: https://ram.console.aliyun.com/manage/ak
2. Agent ID: 在阿里云 IMS 控制台创建智能体后获取

---

## 下一步计划
- [x] 初始化 Git 仓库，建立版本控制
- [x] 测试前端构建: `npm run dev`
- [x] 测试后端启动: `cd server && npm start`
- [x] 修复端口配置
- [ ] **用户操作**: 配置真实的阿里云凭证（.env）
- [ ] 完整功能验证（需要真实凭证后才能测试）

---

**文档创建**: 2026-01-09
**最后更新**: 2026-01-09
**维护者**: AI 全栈架构师
