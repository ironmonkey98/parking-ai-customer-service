# 🚀 快速启动指南

## 一分钟启动

### 1. 配置环境变量

```bash
cd server
cp .env.example .env
nano .env  # 编辑并填入你的配置
```

必填项:
- `ALIBABA_CLOUD_ACCESS_KEY_ID` - 阿里云AccessKey ID
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET` - 阿里云AccessKey Secret
- `AGENT_ID` - AI智能体ID

### 2. 启动后端

```bash
# 自动安装依赖并启动
./start.sh

# 或手动启动
cd server
npm install
npm start
```

### 3. 打开前端

```bash
# 方式1: 使用HTTP服务器(推荐)
npx http-server -p 8080

# 方式2: 直接打开
open index.html
```

### 4. 开始测试

1. 浏览器访问 `http://localhost:8080`
2. 点击"开始语音通话"
3. 允许麦克风权限
4. 开始对话!

## 配置检查清单

### 前端配置 (js/config.js)

- [ ] `agentId` - 已填入你的智能体ID
- [ ] `api.baseURL` - 后端地址正确(默认: http://localhost:3000/api)

### 后端配置 (server/.env)

- [ ] `ALIBABA_CLOUD_ACCESS_KEY_ID` - 已配置
- [ ] `ALIBABA_CLOUD_ACCESS_KEY_SECRET` - 已配置
- [ ] `AGENT_ID` - 已配置
- [ ] `PORT` - 端口号(默认: 3000)

## 常用命令

```bash
# 启动后端(开发模式,自动重启)
cd server && npm run dev

# 启动前端(HTTP服务器)
npx http-server -p 8080

# 查看后端日志
cd server && npm start

# 安装后端依赖
cd server && npm install
```

## 测试问题示例

- "请问停车费怎么算?"
- "我想办理月卡"
- "现在还有空车位吗?"
- "怎么开发票?"

## 故障排查

### 后端无法启动?

1. 检查`.env`文件是否存在
2. 验证AccessKey是否正确
3. 查看控制台错误信息

### 前端连接失败?

1. 确认后端已启动(`http://localhost:3000/api/health`)
2. 检查`js/config.js`中的`api.baseURL`配置
3. 查看浏览器控制台错误

### 没有声音?

1. 检查浏览器麦克风权限
2. 确认AI智能体配置正确
3. 查看后端日志确认通话已建立

## 下一步

✅ 完成基础配置和测试后,查看 [README.md](README.md) 了解更多高级功能
