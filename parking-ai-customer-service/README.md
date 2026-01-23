# 停车场智能客服系统

基于阿里云 IMS (Intelligent Media Services) 的 AI 语音客服应用，提供**AI 智能问答**和**真人客服接管**无缝切换能力。

## 🚀 项目特色

### AI 智能客服
- ✅ **实时语音通话** - 基于阿里云 IMS AI 实时互动技术，低延迟高质量语音通话
- ✅ **智能语音识别** - 支持零损语音断句，准确率高达 95%
- ✅ **实时字幕显示** - 双向实时字幕，对话内容可视化
- ✅ **智能打断** - 用户可随时打断 AI 回复，实现自然对话
- ✅ **停车场业务** - 停车费查询、月卡办理、车位查询、发票申请等场景

### 真人客服接管 (NEW! 🎉)
- ✅ **三种触发方式** - 用户主动点击、关键词检测、AI 智能判断
- ✅ **无缝切换** - AI 自动退出，真人客服加入同一 RTC 频道
- ✅ **对话历史传递** - 完整 AI 对话记录实时同步给客服
- ✅ **客服工作台** - 独立客服端应用，支持会话管理和状态控制
- ✅ **队列管理** - 多客服分配、排队机制、超时处理
- ✅ **实时通信** - WebSocket 实时推送会话通知

### 技术亮点
- ✅ **响应式设计** - 完美适配移动端和桌面端
- ✅ **现代化 UI** - React 18 + TypeScript + Vite
- ✅ **微服务架构** - 用户端、客服端、后端服务独立部署

## 📁 项目结构

```
parking-ai-customer-service/
├── src/                    # 用户端 (React + TypeScript)
│   ├── hooks/
│   │   └── useAICall.ts   # AI 通话 + 转人工 Hook
│   ├── App.tsx            # 主应用组件
│   └── ...
├── agent-client/           # 客服端 (独立项目)
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts  # WebSocket 连接
│   │   │   └── useRTCCall.ts    # RTC 通话管理
│   │   ├── components/
│   │   │   ├── Dashboard.tsx    # 客服控制台
│   │   │   ├── SessionList.tsx  # 会话列表
│   │   │   └── CallPanel.tsx    # 通话面板
│   │   └── App.tsx
│   └── package.json
├── server/                 # 后端服务 (Node.js + Express)
│   ├── managers/
│   │   ├── SessionManager.js       # 会话管理
│   │   ├── AgentStatusManager.js   # 客服状态
│   │   └── QueueManager.js         # 队列管理
│   ├── socket.js           # WebSocket 服务
│   ├── server.js           # Express 主服务
│   └── .env.example        # 环境变量示例
├── CLAUDE.md               # 项目总览文档
├── TESTING_GUIDE.md        # 测试指南
├── start-all.sh            # 一键启动脚本
└── stop-all.sh             # 停止服务脚本
```

## 🔧 技术栈

### 前端
- **React 18** + **TypeScript** - 现代化前端框架
- **Vite 4.4** - 快速开发构建工具
- **阿里云 AI-RTC SDK** - `aliyun-auikit-aicall` + `aliyun-rtc-sdk`

### 后端
- **Node.js** + **Express 4.18** - 服务器框架
- **Socket.IO 4.8** - WebSocket 实时通信
- **阿里云 IMS SDK** - `@alicloud/ice20201109`

## 📦 快速开始

### 方式一: 一键启动 (推荐)

```bash
# 1. 配置后端环境变量
cp server/.env.example server/.env
# 编辑 server/.env 填入你的阿里云配置

# 2. 一键启动所有服务
./start-all.sh

# 访问应用
# 用户端: http://localhost:5173
# 客服端: http://localhost:5174
```

### 方式二: 手动启动

```bash
# 启动后端服务
cd server
npm install
npm start

# 启动用户端
npm install
npm run dev

# 启动客服端
cd agent-client
npm install
npm run dev
```

---

## 🔧 详细配置

### 1. 前置条件

- Node.js 16+
- 阿里云账号
- 已创建 AI 智能体(在阿里云 IMS 控制台)

### 2. 配置阿里云

#### 2.1 创建AccessKey

1. 登录[阿里云RAM控制台](https://ram.console.aliyun.com/manage/ak)
2. 创建AccessKey,获取`AccessKeyId`和`AccessKeySecret`
3. **重要**: 妥善保管AccessKey,不要提交到代码仓库

#### 2.2 创建AI智能体

1. 登录[阿里云IMS控制台](https://ice.console.aliyun.com/)
2. 进入 **AI实时互动** → **实时工作流**
3. 创建工作流:
   ```
   [开始] → [STT节点] → [LLM节点] → [TTS节点] → [结束]
   ```
4. 配置LLM节点提示词(停车场客服场景):
   ```
   你是一个专业的停车场智能客服助手,名字叫"小停"。

   你的职责包括:
   1. 解答停车费用计算规则
   2. 协助办理停车月卡
   3. 查询停车位实时情况
   4. 处理发票申请
   5. 解决其他停车相关问题

   停车收费标准:
   - 前2小时: 5元/小时
   - 2-4小时: 8元/小时
   - 4小时以上: 10元/小时
   - 24小时封顶: 80元

   月卡价格:
   - 普通月卡: 300元/月
   - VIP月卡: 500元/月(含洗车服务)

   请用友好、专业的语气回答用户问题。
   ```
5. 保存工作流,进入 **AI智能体管理**
6. 创建智能体,关联工作流,获取`AgentId`

### 3. 安装后端依赖

```bash
cd server
npm install
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件,填入你的配置
nano .env
```

`.env`文件内容:
```env
# 阿里云 AccessKey (必须)
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret

# 区域配置 (必须与 Agent 所在区域一致)
ALIBABA_CLOUD_REGION=cn-hangzhou

# AI Agent ID
AGENT_ID=your_agent_id

# RTC 配置 (真人接管必需)
ALIBABA_CLOUD_RTC_APP_ID=your_rtc_app_id
ALIBABA_CLOUD_RTC_APP_KEY=your_rtc_app_key

# 服务端口
PORT=3000

# 环境配置
NODE_ENV=development
LOG_LEVEL=info
```

⚠️ **关键配置注意事项**:
1. **区域一致性**: `ALIBABA_CLOUD_REGION` 必须与阿里云 IMS 控制台中 Agent 所在区域完全一致
2. **RTC 配置**: 必须同时配置 `RTC_APP_ID` 和 `RTC_APP_KEY`，缺失会导致真人接管 API 调用失败
3. **端口匹配**: 前端代码中默认使用 3000 端口连接后端

### 5. 配置前端

编辑 `js/config.js`:

```javascript
const CONFIG = {
    aliyun: {
        region: 'cn-shanghai',
        agentId: 'YOUR_AGENT_ID', // 替换为你的AgentId
    },
    api: {
        baseURL: 'http://localhost:3000/api',
    },
    // ...其他配置
};
```

### 6. 启动服务

#### 启动后端服务器

```bash
cd server
npm start
# 或使用开发模式(自动重启)
npm run dev
```

服务器将在 `http://localhost:3000` 启动

#### 打开前端页面

- **方式1**: 使用本地HTTP服务器(推荐)
  ```bash
  # 在项目根目录
  npx http-server -p 8080
  # 访问 http://localhost:8080
  ```

- **方式2**: 直接打开HTML文件
  ```bash
  open index.html
  # 或在浏览器中打开 index.html
  ```

### 7. 测试通话

1. 点击 **"开始语音通话"** 按钮
2. 允许浏览器使用麦克风权限
3. 等待连接成功,AI助手会播放欢迎语
4. 开始对话测试

#### 测试问题示例:
- "请问停车费怎么算?"
- "我想办理月卡"
- "现在还有空车位吗?"
- "怎么开发票?"

## 🎯 功能说明

### 前端功能

| 功能 | 说明 |
|------|------|
| **语音通话** | 实时语音对话,支持全双工通信 |
| **实时字幕** | 显示用户和AI的实时语音转文字 |
| **通话控制** | 静音、打断、挂断等操作 |
| **AI状态显示** | 倾听中/思考中/回复中状态可视化 |
| **快捷问题** | 一键提问常见问题 |
| **通话时长** | 实时显示通话时长 |

### 后端 API

#### AI 通话相关
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/start-call` | POST | 启动 AI 通话 |
| `/api/stop-call` | POST | 停止 AI 通话 |
| `/api/get-token` | POST | 获取 RTC Token |

#### 真人接管相关
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/request-human-takeover` | POST | 用户请求转人工 |
| `/api/agent-accept-call` | POST | 客服接听会话 |
| `/api/session-history/:sessionId` | GET | 获取会话历史 |

详细 API 文档请参考 [agent-client/README.md](./agent-client/README.md#api-接口)

## 🔐 安全注意事项

1. **永远不要提交`.env`文件到Git仓库**
   ```bash
   # .gitignore
   server/.env
   server/node_modules/
   ```

2. **生产环境使用HTTPS**
   - 配置SSL证书
   - 使用Nginx反向代理

3. **限制API访问**
   - 配置CORS白名单
   - 添加请求频率限制
   - 实现用户认证

4. **AccessKey权限最小化**
   - 仅授予IMS相关权限
   - 定期轮换AccessKey

## 🎨 自定义配置

### 修改AI欢迎语

编辑 `js/config.js`:
```javascript
agent: {
    greeting: '您好,我是智能停车助手...',
}
```

### 修改主题颜色

编辑 `css/style.css`:
```css
:root {
    --primary-color: #1890ff;  /* 主色调 */
    --success-color: #52c41a;  /* 成功色 */
    /* ... */
}
```

### 添加快捷问题

编辑 `js/config.js`:
```javascript
business: {
    faq: [
        {
            id: 5,
            question: '新问题标题',
            query: '新问题完整内容',
        },
    ],
}
```

## 🐛 常见问题

### Q1: SDK加载失败?

**A**: 检查网络连接,确保可以访问阿里云CDN:
```
https://g.alicdn.com/apsara-media-box/imp-web-sdk/2.9.1/aliyun-auikit-aicall.js
```

### Q2: 麦克风权限被拒绝?

**A**:
- 确保使用HTTPS或localhost
- 检查浏览器隐私设置
- 刷新页面重新申请权限

### Q3: 后端API调用失败?

**A**:
1. 检查`.env`配置是否正确
2. 验证AccessKey权限
3. 查看后端日志: `npm run dev`
4. 确认AgentId有效

### Q4: 通话没有声音?

**A**:
- 检查浏览器音量设置
- 确认AI智能体工作流配置正确
- 查看浏览器控制台错误信息

### Q5: Mock模式测试?

**A**: 编辑 `js/config.js`:
```javascript
debug: {
    mockCall: true, // 启用Mock模式
}
```

## 🔄 真人接管功能使用

### 用户端操作

1. **主动转人工**: 点击通话界面的"转人工"按钮
2. **语音触发**: 说出关键词 (人工客服、转人工、真人、投诉、人工)
3. **AI 建议**: AI 判断需要人工处理时会弹出确认对话框

### 客服端操作

1. **登录**: 输入客服 ID 和昵称，点击登录
2. **接听会话**:
   - 等待会话列表中出现新会话通知
   - 查看用户信息和转人工原因
   - 点击"接入"按钮
3. **查看历史**: 接入后可查看完整的 AI 对话历史
4. **结束通话**: 点击"挂断"按钮，状态自动恢复为"在线"

### 触发流程示意

```
┌─────────────┐
│ 用户与AI对话 │
└──────┬──────┘
       │
       ├─→ 用户点击"转人工"按钮
       ├─→ 用户说出关键词 ("转人工", "人工客服", ...)
       └─→ AI 发送自定义消息 (超出能力范围)
       │
       ↓
┌─────────────────┐
│ 后端保存会话信息 │
│ 查找空闲客服     │
└──────┬──────────┘
       │
       ├─→ 有空闲客服: 推送会话通知
       └─→ 无空闲客服: 加入等待队列
       │
       ↓
┌─────────────────┐
│ 客服点击"接入"   │
│ 调用 Takeover API│
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│ AI 自动退出      │
│ 客服加入RTC频道  │
│ 真人对话开始     │
└─────────────────┘
```

## 📚 相关文档

### 项目文档
- [CLAUDE.md](./CLAUDE.md) - 完整项目架构和开发指南
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - 详细测试流程和场景
- [agent-client/README.md](./agent-client/README.md) - 客服端使用说明
- [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) - 配置详解

### 阿里云文档
- [阿里云 IMS 官方文档](https://help.aliyun.com/zh/ims/)
- [AI-RTC SDK API 文档](https://help.aliyun.com/zh/ims/user-guide/aicallkit-web-sdk-integration)
- [真人接管 API 文档](https://help.aliyun.com/zh/ims/user-guide/human-takeover)
- [官方示例项目](https://github.com/MediaBox-AUIKits/AUIAICall)

## 📄 License

MIT License

## 🙏 致谢

- 阿里云智能媒体服务(IMS)
- MediaBox-AUIKits开源项目

---

**如有问题,欢迎提Issue或联系技术支持** 🚀
