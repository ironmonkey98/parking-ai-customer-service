# 停车场智能客服系统

基于阿里云 AI-RTC 技术的停车场智能语音客服H5应用,提供实时语音通话、智能问答、停车费查询、月卡办理等服务。

## 🚀 项目特色

- ✅ **实时语音通话** - 基于阿里云IMS AI实时互动技术,低延迟高质量语音通话
- ✅ **智能语音识别** - 支持零损语音断句,准确率高达95%
- ✅ **实时字幕显示** - 双向实时字幕,对话内容可视化
- ✅ **智能打断** - 用户可随时打断AI回复,实现自然对话
- ✅ **停车场业务** - 停车费查询、月卡办理、车位查询、发票申请等场景
- ✅ **响应式设计** - 完美适配移动端和桌面端
- ✅ **现代化UI** - 简洁美观的停车场主题界面

## 📁 项目结构

```
parking-ai-customer-service/
├── index.html              # 主HTML页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── config.js          # 配置文件
│   ├── api.js             # API接口封装
│   └── app.js             # 主应用逻辑
├── server/                # 后端服务
│   ├── server.js          # Express服务器
│   ├── package.json       # Node.js依赖
│   └── .env.example       # 环境变量示例
└── README.md              # 项目文档
```

## 🔧 技术栈

### 前端
- **HTML5** - 语义化标签
- **CSS3** - 现代化样式,支持动画和响应式
- **原生JavaScript** - 无框架依赖,轻量高效
- **阿里云AI-RTC SDK** - `aliyun-auikit-aicall@2.9.1`

### 后端
- **Node.js** - 服务器运行环境
- **Express** - Web框架
- **阿里云IMS SDK** - `@alicloud/ice20201109`

## 📦 快速开始

### 1. 前置条件

- Node.js 14+
- 阿里云账号
- 已创建AI智能体(在阿里云IMS控制台)

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
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_REGION=cn-shanghai
AGENT_ID=your_agent_id
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

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

### 后端API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/start-call` | POST | 启动AI通话 |
| `/api/stop-call` | POST | 停止AI通话 |
| `/api/get-token` | POST | 获取RTC Token |

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

## 📚 相关文档

- [阿里云IMS官方文档](https://help.aliyun.com/zh/ims/)
- [AI-RTC SDK API文档](https://help.aliyun.com/zh/ims/user-guide/aicallkit-web-sdk-integration)
- [官方示例项目](https://github.com/MediaBox-AUIKits/AUIAICall)

## 📄 License

MIT License

## 🙏 致谢

- 阿里云智能媒体服务(IMS)
- MediaBox-AUIKits开源项目

---

**如有问题,欢迎提Issue或联系技术支持** 🚀
