# 阿里云配置完整指南

> 停车场 AI 客服项目 - 从零开始配置阿里云服务

## 目录

- [概述](#概述)
- [资料清单](#资料清单)
- [详细配置步骤](#详细配置步骤)
- [环境变量配置](#环境变量配置)
- [验证与测试](#验证与测试)
- [常见问题排查](#常见问题排查)
- [官方文档参考](#官方文档参考)

---

## 概述

### 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户端 (Web Browser)                    │
│                   React + AICallKit SDK                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ WebRTC 音频流
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    阿里云 IMS 服务                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │   ASR   │ → │   LLM   │ → │   TTS   │                   │
│  │ 语音识别 │    │ 大模型  │    │ 语音合成 │                   │
│  └─────────┘    └─────────┘    └─────────┘                  │
│                    AI 智能体                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ API 调用
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端服务 (Node.js)                        │
│              Express + 阿里云 OpenAPI SDK                    │
└─────────────────────────────────────────────────────────────┘
```

### 核心服务说明

| 服务 | 用途 | 必需性 |
|------|------|--------|
| IMS 智能媒体服务 | AI 实时互动、智能体管理 | ✅ 必需 |
| ARTC 实时音视频 | 音视频通话传输 | ✅ 必需 |
| 百炼/DashScope | 大模型 API | ✅ 必需 |
| CosyVoice | 语音合成 | ✅ 必需 |
| RTC 应用 | 真人接管场景 | ⚪ 可选 |

---

## 资料清单

### 必需凭证

| 序号 | 配置项 | 环境变量名 | 获取来源 |
|------|--------|-----------|----------|
| 1 | AccessKey ID | `ALIBABA_CLOUD_ACCESS_KEY_ID` | RAM 控制台 |
| 2 | AccessKey Secret | `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | RAM 控制台 |
| 3 | Agent ID | `AGENT_ID` | IMS 控制台 |
| 4 | Region | `ALIBABA_CLOUD_REGION` | 智能体所在区域 |

### 可选凭证（真人接管功能）

| 序号 | 配置项 | 环境变量名 | 获取来源 |
|------|--------|-----------|----------|
| 5 | RTC AppId | `ALIBABA_CLOUD_RTC_APP_ID` | RTC 控制台 |
| 6 | RTC AppKey | `ALIBABA_CLOUD_RTC_APP_KEY` | RTC 控制台 |

---

## 详细配置步骤

### 步骤一：创建 RAM 子用户并获取 AccessKey

> ⚠️ **安全提示**：强烈建议创建 RAM 子用户，不要使用主账号的 AccessKey

#### 1.1 登录 RAM 控制台

访问：https://ram.console.aliyun.com/

#### 1.2 创建 RAM 用户

1. 左侧导航 → **身份管理** → **用户**
2. 点击 **创建用户**
3. 填写信息：
   - 登录名称：`parking-ai-service`
   - 显示名称：`停车场AI客服服务账号`
   - 访问方式：勾选 **OpenAPI 调用访问**
4. 点击 **确定**

#### 1.3 创建 AccessKey

1. 在用户列表中，点击刚创建的用户
2. 切换到 **认证管理** 标签
3. 在 **AccessKey** 区域，点击 **创建 AccessKey**
4. **立即保存** AccessKey ID 和 AccessKey Secret

```
⚠️ AccessKey Secret 只显示一次，务必妥善保存！
```

#### 1.4 授权策略

1. 回到用户列表，点击用户进入详情
2. 切换到 **权限管理** 标签
3. 点击 **添加权限**
4. 添加以下权限策略：

| 权限策略 | 说明 |
|----------|------|
| `AliyunICEFullAccess` | IMS 智能媒体服务完全访问 |
| `AliyunRTCFullAccess` | 实时音视频完全访问 |
| `AliyunNLSFullAccess` | 智能语音服务访问 |

---

### 步骤二：开通 AI 实时互动服务

#### 2.1 登录 RTC 控制台

访问：https://rtc.console.aliyun.com/

#### 2.2 开通服务

1. 左侧导航 → **AI实时对话智能体**
2. 如果是首次访问，会提示开通服务
3. 点击 **立即开通**，按提示完成开通

#### 2.3 确认服务状态

开通成功后，可以看到 **智能体管理** 菜单

---

### 步骤三：开通百炼/DashScope 服务

> 百炼提供大模型 API，智能体的 LLM 模块需要用到

#### 3.1 登录百炼控制台

访问：https://bailian.console.aliyun.com/

#### 3.2 开通 DashScope

1. 首次访问会提示开通服务
2. 点击 **开通服务**
3. 同意服务协议

#### 3.3 获取 API Key

1. 进入控制台后，点击右上角 **API Key 管理**
2. 点击 **创建 API Key**
3. 保存 API Key（稍后在创建智能体时使用）

---

### 步骤四：创建 AI 智能体

#### 4.1 进入智能体管理

1. 返回 [RTC 控制台](https://rtc.console.aliyun.com/)
2. 左侧导航 → **AI实时对话智能体** → **智能体管理**
3. 点击 **创建智能体**

#### 4.2 选择 ARTC 应用

- 选择一个已有的 3.0 版本 AppId
- 或者让系统 **自动创建新应用**

#### 4.3 配置基础信息

```yaml
智能体名称: 停车场智能客服
智能体类型: 语音通话
通话模式: 自然对话
智能打断: 开启

Prompt: |
  你是一个专业的停车场智能客服助手。你的职责包括：
  1. 解答停车费用查询
  2. 处理车位预约
  3. 解决停车场相关问题
  4. 收集用户反馈

  请用简洁、友好的语气回答用户问题。如果遇到无法处理的问题，
  建议用户说"转人工"以获得人工客服帮助。

欢迎语: 您好，这里是停车场客服中心，请问有什么可以帮您？
```

#### 4.4 配置 ASR（语音识别）

```yaml
语音断句阈值: 500ms (默认)
人声持续阈值: 默认
自定义热词: 停车费, 月卡, 临时卡, 车位, 预约
```

#### 4.5 配置 LLM（大模型）

```yaml
模型提供商: 阿里云
模型: Qwen-Plus (推荐) 或 Qwen-Turbo
API Key: [填入步骤三获取的 DashScope API Key]

参数配置:
  Temperature: 0.7
  TopP: 0.9
  MaxToken: 2048
  HistoryDepth: 10
```

#### 4.6 配置 TTS（语音合成）

```yaml
模型: CosyVoice-V2
API Key: [与 LLM 使用相同的 API Key]
音色: 选择合适的声音（如 xiaoyun）
音量: 50
语速: 1.0
音调: 1.0
```

#### 4.7 创建并获取 Agent ID

1. 点击 **创建智能体**
2. 创建成功后，在智能体列表中可以看到新创建的智能体
3. 复制 **智能体 ID**（这就是 `AGENT_ID`）

#### 4.8 确认区域

注意创建智能体时所在的区域，常见选项：
- `cn-shanghai` - 上海
- `cn-hangzhou` - 杭州

**这个区域必须与代码中的 `ALIBABA_CLOUD_REGION` 配置一致！**

---

### 步骤五：创建 RTC 应用（可选，真人接管需要）

> 如果只需要 AI 通话功能，可以跳过此步骤

#### 5.1 登录视频直播控制台

访问：https://live.console.aliyun.com/

#### 5.2 创建 RTC 应用

1. 左侧导航 → **直播+** → **实时音视频** → **应用管理**
2. 点击 **创建应用**
3. 填写应用名称：`parking-ai-rtc`
4. 同意服务协议
5. 点击 **立即购买**（免费创建）

#### 5.3 获取 AppId 和 AppKey

1. 刷新页面，在应用列表中找到新建的应用
2. 点击应用名称进入详情
3. 复制 **AppId** 和 **AppKey**

---

## 环境变量配置

### 后端配置文件

在 `server/.env` 文件中配置：

```env
# =====================================================
# 阿里云基础配置 (必需)
# =====================================================

# RAM 子用户的 AccessKey
ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5t****
ALIBABA_CLOUD_ACCESS_KEY_SECRET=****

# 区域配置 - 必须与智能体所在区域一致！
# 可选值: cn-shanghai, cn-hangzhou, cn-beijing, cn-shenzhen
ALIBABA_CLOUD_REGION=cn-shanghai

# =====================================================
# AI 智能体配置 (必需)
# =====================================================

# 从 IMS 控制台获取的智能体 ID
AGENT_ID=2abd65e5d91a43979708ca300994bb8b

# =====================================================
# RTC 配置 (真人接管功能需要，可选)
# =====================================================

# 从视频直播控制台获取
ALIBABA_CLOUD_RTC_APP_ID=
ALIBABA_CLOUD_RTC_APP_KEY=

# =====================================================
# 服务配置
# =====================================================

PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

### 配置检查清单

运行前请确认：

- [ ] `ALIBABA_CLOUD_ACCESS_KEY_ID` 已填写
- [ ] `ALIBABA_CLOUD_ACCESS_KEY_SECRET` 已填写
- [ ] `AGENT_ID` 已填写且有效
- [ ] `ALIBABA_CLOUD_REGION` 与智能体区域一致
- [ ] RAM 用户已授予必要权限

---

## 验证与测试

### 1. 验证 AccessKey

```bash
# 使用阿里云 CLI 验证（可选）
aliyun configure
aliyun sts GetCallerIdentity
```

### 2. 启动后端服务

```bash
cd server
npm install
npm run dev
```

预期输出：
```
╔═══════════════════════════════════════════════════════════╗
║    停车场智能客服 API 服务已启动                          ║
║    Port:         3000                                     ║
║    Region:       cn-shanghai                              ║
║    Agent ID:     2abd65e5d91a43979708ca300994bb8b         ║
╚═══════════════════════════════════════════════════════════╝
```

### 3. 测试健康检查

```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2025-01-15T..."
}
```

### 4. 启动前端并测试通话

```bash
# 在项目根目录
npm run dev
```

打开浏览器访问 http://localhost:5173，点击"开始通话"测试。

---

## 常见问题排查

### 错误：AgentNotFound

**原因**：Agent ID 无效或区域不匹配

**解决方案**：
1. 确认 `AGENT_ID` 复制正确
2. 确认 `ALIBABA_CLOUD_REGION` 与智能体所在区域一致
3. 在控制台确认智能体状态正常

### 错误：InvalidAccessKeyId.NotFound

**原因**：AccessKey ID 错误或已被删除

**解决方案**：
1. 检查 AccessKey ID 是否正确复制（无多余空格）
2. 在 RAM 控制台确认 AccessKey 状态为"启用"
3. 如有必要，重新创建 AccessKey

### 错误：Forbidden / NoPermission

**原因**：RAM 用户权限不足

**解决方案**：
1. 在 RAM 控制台为用户添加权限策略
2. 确保添加了 `AliyunICEFullAccess` 权限
3. 等待几分钟让权限生效

### 错误：SignatureDoesNotMatch

**原因**：AccessKey Secret 错误

**解决方案**：
1. 检查 Secret 是否正确复制（无多余空格或换行）
2. 如不确定，重新创建 AccessKey

### 错误：SDK 连接失败

**原因**：网络或 SDK 版本问题

**解决方案**：
1. 检查网络是否能访问阿里云服务
2. 确认 `aliyun-auikit-aicall` SDK 版本是最新
3. 检查浏览器控制台是否有其他错误信息

### 通话无声音

**原因**：浏览器权限或音频设备问题

**解决方案**：
1. 确认浏览器已授权麦克风权限
2. 检查系统音频设备是否正常
3. 尝试使用 Chrome 浏览器测试

---

## 官方文档参考

| 文档 | 链接 |
|------|------|
| IMS 智能媒体服务 | https://help.aliyun.com/zh/ims/ |
| AI 实时对话智能体配置 | https://help.aliyun.com/document_detail/2979978.html |
| AICallKit Web SDK | https://help.aliyun.com/zh/ims/user-guide/aicallkit-web-sdk-integration |
| GenerateAIAgentCall API | https://help.aliyun.com/zh/ims/developer-reference/api-ice-2020-11-09-generateaiagentcall |
| RAM 用户管理 | https://help.aliyun.com/zh/ram/user-guide/overview-of-ram-users |
| 百炼 API Key | https://developer.aliyun.com/article/1572402 |

---

## 快速检查表

```
开始之前，请确认以下事项：

□ 1. 阿里云账号
   □ 已创建 RAM 子用户
   □ 已获取 AccessKey ID 和 Secret
   □ 已授予 AliyunICEFullAccess 权限

□ 2. AI 实时互动服务
   □ 已开通服务
   □ 已创建 AI 智能体
   □ 已获取 Agent ID
   □ 已确认智能体区域

□ 3. 百炼/DashScope
   □ 已开通服务
   □ 已在智能体中配置 API Key

□ 4. 环境变量
   □ 已配置 server/.env 文件
   □ 区域配置与智能体一致

□ 5. 测试
   □ 后端服务正常启动
   □ 健康检查接口返回成功
   □ 前端可以发起通话
```

---

*文档版本: 1.0*
*最后更新: 2025-01-15*
