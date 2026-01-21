# 阿里云 AI RTC 智能客服实现指南

> 基于阿里云智能媒体服务（IMS）AI 实时互动功能构建智能客服系统

---

## 一、产品概述

### 核心定位

**AI实时互动**是阿里云智能媒体服务（IMS）提供的解决方案，帮助企业快速构建 AI 智能体与用户之间的实时音视频通话应用。通过可视化配置界面，**10分钟内**即可构建专属 AI 智能体。

### 适用场景

| 应用能力 | 说明 | 适用场景 |
|---------|------|---------|
| **语音通话** | 纯语音交互 | 智能客服、语音助手 |
| **数字人通话** | 视频与数字人互动 | 虚拟教师、AI伴侣 |
| **视觉理解通话** | AI结合语音+画面反馈 | 医疗咨询、购物指导 |
| **视频通话** | 数字人+视觉理解双向视频 | 面对面客服、在线面试 |
| **消息对话** | 文本/语音聊天框形式 | IM客服、智能问答 |
| **AI电话呼出/呼入** | 通过运营商线路 | 电话营销、通知提醒 |

---

## 二、技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户终端                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   iOS App   │  │  Android App │  │   Web App    │       │
│  │  AICallKit  │  │  AICallKit   │  │  AICallKit   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              阿里云实时音视频网络                            │
│              全球3200+节点，基于WebRTC                       │
│                  低延迟、高可用                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI智能体（云端）                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              实时工作流编排                          │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐        │   │
│  │  │ STT  │→│ LLM  │→│ TTS  │→│ 数字人    │        │   │
│  │  └──────┘  └──────┘  └──────┘  └──────────┘        │   │
│  │                                                      │   │
│  │  • 语音转文字（ASR）  • 大语言模型（LLM）            │   │
│  │  • 文字转语音（TTS）  • 数字人渲染                   │   │
│  │  • 多模态理解        • 向量数据库                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 工作原理

1. 用户通过终端 SDK 发起与云端 AI 智能体的实时音视频通话
2. AI 智能体接收用户的音视频输入，运转工作流，输出 AI 响应结果
3. AI 智能体将响应结果的音视频流推送到 ARTC 网络，用户订阅播放

### 核心技术特性

| 特性 | 技术说明 | 优势 |
|------|---------|------|
| **零损语音断句** | AI 根据对话情境智能判断用户发言是否结束，准确率高达 95% | 避免因停顿被抢话，实现低延迟自然交互 |
| **AI声学 V2.5** | 大幅降低远场人声干扰 | 支持办公、食堂、商场、街道等多场景流畅双工对话 |

---

## 三、工作流编排

### 实时工作流节点配置

#### 1. STT（语音转文字）节点

```json
{
  "nodeType": "STT",
  "config": {
    "source": "system",
    "language": "zh-CN",
    "silenceTime": 800,
    "hotWords": ["售后", "退款", "订单查询"]
  }
}
```

**支持的 STT 源**:
- **系统预置**: 阿里云通义产品能力
- **第三方插件**: 讯飞语音转文字
- **自研模型**: 按 OpenAI 规范接入

#### 2. LLM（大语言模型）节点

```json
{
  "nodeType": "LLM",
  "config": {
    "source": "bailian",
    "modelId": "qwen-plus",
    "apiKey": "sk-xxx",
    "prompt": "你是一个专业的客服助手...",
    "temperature": 0.7
  }
}
```

**支持的 LLM 源**:
- **系统预置**: 阿里云通义千问
- **阿里云百炼**: 模型中心或应用中心模型
- **自研模型**: 按 OpenAI 规范接入
- **第三方**: DeepSeek、MiniMax 等

#### 3. TTS（文字转语音）节点

```json
{
  "nodeType": "TTS",
  "config": {
    "source": "system",
    "voiceModel": "cosyvoice-v1",
    "voiceId": "zhixiaobai",
    "speed": 1.0,
    "pitch": 1.0
  }
}
```

**支持的 TTS 源**:
- **系统预置**: 阿里云通义 TTS
- **第三方插件**: MiniMax 语音模型
- **自研模型**: 按 TTS 标准接口接入

#### 4. 数字人节点（可选）

```json
{
  "nodeType": "Avatar",
  "config": {
    "provider": "xiangxin",
    "avatarId": "avatar_001"
  }
}
```

### 语音通话工作流示例

只需配置 3 个节点即可完成语音通话工作流：

```
[用户语音输入] → [STT节点] → [LLM节点] → [TTS节点] → [语音输出]
```

---

## 四、API 参考

### 核心 API

#### 1. StartAIAgentInstance - 启动智能体实例

```bash
POST https://ice.cn-shanghai.aliyuncs.com/?Action=StartAIAgentInstance
```

**请求参数**:
```json
{
  "AgentId": "agent_xxx",
  "UserId": "user_123",
  "InstanceId": "session_xxx",
  "Type": "AUDIO_CALL",
  "Greeting": "您好，我是智能客服助手",
  "WakeUpQuery": "",
  "EnableIntelligentSegment": true,
  "Config": {
    "Volume": 100,
    "UserOnlineTimeout": 60,
    "AgentMaxIdleTime": 600
  }
}
```

**Type 参数值**:
- `AUDIO_CALL` - 语音通话
- `AVATAR_CALL` - 数字人通话
- `VISION_CALL` - 视觉理解通话
- `VIDEO_CALL` - 视频通话
- `MESSAGING` - 消息对话

**响应**:
```json
{
  "InstanceId": "inst_xxx",
  "RTCChannelId": "rtc_xxx",
  "RTCJoinToken": "token_xxx"
}
```

#### 2. StopAIAgentInstance - 停止智能体实例

```bash
POST https://ice.cn-shanghai.aliyuncs.com/?Action=StopAIAgentInstance
```

**请求参数**:
```json
{
  "InstanceId": "inst_xxx"
}
```

---

## 五、SDK 集成指南

### 支持的平台

| 平台 | SDK | 版本 | 支持功能 |
|------|-----|------|---------|
| **Android** | `ARTCAICallKit` | v2.9.1 | 语音/数字人/视觉理解通话、实时字幕、打断 |
| **iOS** | `ARTCAICallKit` | v2.9.1 | 语音/数字人/视觉理解通话、实时字幕、打断 |
| **Web** | `aliyun-auikit-aicall` | 最新 | 语音/数字人/视觉理解通话、实时字幕、打断 |

### Web 端集成

#### 安装

```bash
npm install aliyun-auikit-aicall
```

#### 完整示例

```javascript
// 1. 引入 SDK
import AICallEngine, { 
  AICallErrorCode, 
  AICallAgentState, 
  AICallAgentType 
} from 'aliyun-auikit-aicall';

// 2. 创建 engine 实例
const engine = new AICallEngine();

// 3. 设置事件监听
engine.on('errorOccurred', (code) => {
  console.error('Error:', code);
  engine.handup();
});

engine.on('callBegin', () => {
  console.log('Call started');
});

engine.on('agentStateChanged', (state) => {
  console.log('Agent state:', state);
  // state: LISTENING | THINKING | SPEAKING
});

engine.on('userSubtitleNotify', (subtitle) => {
  console.log('User said:', subtitle.text);
  // 显示用户侧实时字幕
});

engine.on('agentSubtitleNotify', (subtitle) => {
  console.log('Agent said:', subtitle.text);
  // 显示智能体侧实时字幕
});

engine.on('voiceIdChanged', (voiceId) => {
  console.log('Voice changed:', voiceId);
});

engine.on('voiceInterruptChanged', (enable) => {
  console.log('Interrupt enabled:', enable);
});

// 4. 初始化引擎
await engine.init(AICallAgentType.AUDIO_CALL);

// 5. 配置并发起通话
const config = {
  userId: 'user_123',
  agentInfo: {
    agentId: 'agent_xxx',
    type: 'AUDIO_CALL',
    instanceId: 'inst_xxx',
    channelConfig: {
      channelId: 'rtc_xxx',
      joinToken: 'token_xxx'
    }
  },
  muteMicrophone: false,
  enablePushToTalk: false
};

await engine.call(config.userId, config.agentInfo, config);

// 6. 打断智能体
await engine.interruptAgentResponse();

// 7. 结束通话
await engine.handup();
```

### Android 端集成

#### 添加依赖（build.gradle）

```groovy
dependencies {
    implementation 'com.aliyun.sdk:AliVCSDK_ARTC:7.9.1'
    implementation 'com.aliyun.sdk:ARTCAICallKit:2.9.1'
    implementation 'com.aliyun.sdk:PluginAEC:1.0.0'
}
```

#### 完整示例

```java
// 1. 创建引擎实例
ARTCAICallEngine engine = new ARTCAICallEngine();

// 2. 设置回调
engine.setEngineCallback(new IARTCAICallEngineCallback() {
    @Override
    public void onErrorOccurs(int errorCode) {
        // 错误处理
    }
    
    @Override
    public void onCallBegin() {
        // 通话开始
    }
    
    @Override
    public void onCallEnd() {
        // 通话结束
    }
    
    @Override
    public void onUserSubtitleNotify(AICallSubtitle subtitle) {
        // 用户侧实时字幕
        String text = subtitle.text;
        boolean isSentenceEnd = subtitle.isSentenceEnd;
    }
    
    @Override
    public void onVoiceAgentSubtitleNotify(AICallSubtitle subtitle) {
        // 智能体侧实时字幕
    }
    
    @Override
    public void onAgentStateChanged(AICallAgentState state) {
        // 智能体状态变化: LISTENING / THINKING / SPEAKING
    }
});

// 3. 初始化配置
ARTCAICallConfig config = new ARTCAICallConfig();
config.agentId = "agent_xxx";
config.userId = "user_123";
config.agentType = ARTCAICallAgentType.VOICE_AGENT;
config.channelId = "rtc_xxx";
config.joinToken = "token_xxx";
config.region = "cn-shanghai";

// 4. 发起呼叫
engine.call(config);

// 5. 打断智能体
engine.interruptAgentResponse();

// 6. 结束通话
engine.hangup();
```

### iOS 端集成

#### 添加依赖（Podfile）

```ruby
pod 'AliVCSDK_ARTC'
pod 'ARTCAICallKit'
```

#### 完整示例

```swift
// 1. 创建引擎实例
let engine = ARTCAICallEngine()

// 2. 设置回调
engine.setEngineCallback { callback in
    callback.onErrorOccurs { errorCode in
        print("Error: \(errorCode)")
    }
    
    callback.onCallBegin {
        print("Call started")
    }
    
    callback.onUserSubtitleNotify { subtitle in
        let text = subtitle.text
        let isSentenceEnd = subtitle.isSentenceEnd
        print("User: \(text)")
    }
    
    callback.onVoiceAgentSubtitleNotify { subtitle in
        print("Agent: \(subtitle.text)")
    }
    
    callback.onAgentStateChanged { state in
        print("Agent state: \(state)")
    }
}

// 3. 创建配置
let config = ARTCAICallConfig()
config.agentId = "agent_xxx"
config.userId = "user_123"
config.agentType = .voiceAgent
config.channelId = "rtc_xxx"
config.joinToken = "token_xxx"
config.region = "cn-shanghai"

// 4. 发起呼叫
engine.call(config)

// 5. 打断智能体
engine.interruptAgentResponse()

// 6. 结束通话
engine.hangup()
```

---

## 六、消息对话集成

### AIChatEngine 使用示例

```javascript
import { AIChatEngine } from 'aliyun-auikit-aicall';

const chatEngine = new AIChatEngine();

// 开始聊天会话
await chatEngine.startChat(
  {
    userId: 'user_123',
    nickname: '张三',
    avatar: 'https://xxx/avatar.jpg'
  },
  {
    agentId: 'agent_xxx',
    agentName: '智能客服'
  },
  'session_123' // sessionId（可选）
);

// 发送消息
await chatEngine.sendMessage('你好，我想咨询售后问题');

// 打断当前回复
await chatEngine.interruptAgentResponse();

// 查询历史消息
const messages = await chatEngine.queryMessageList(20, 'last_message_id');

// 发送语音消息（按住说话）
await chatEngine.startPushVoiceMessage();
// ... 用户说话中 ...
await chatEngine.finishPushVoiceMessage();

// 结束聊天
await chatEngine.endChat();
```

---

## 七、服务端集成

### 业务服务器架构

```
┌─────────────┐
│  Client App │
└──────┬──────┘
       │ 1. 请求启动通话
       ▼
┌─────────────────────┐
│   App Server        │
│  (业务服务器)       │
│                     │
│  • 生成 RTC Token   │
│  • 调用 StartAIAgentInstance │
│  • 管理会话状态     │
└──────┬──────────────┘
       │ 2. 启动智能体
       ▼
┌─────────────────────┐
│  Alibaba Cloud IMS  │
│  (智能体实例)       │
└─────────────────────┘
```

### Python 服务端示例

```python
from alibabacloud_ice20201109.client import Client as IceClient
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_ice20201109 import models as ice_models

# 1. 初始化客户端
config = open_api_models.Config(
    access_key_id='YOUR_ACCESS_KEY_ID',
    access_key_secret='YOUR_ACCESS_KEY_SECRET',
    region_id='cn-shanghai'
)
client = IceClient(config)

# 2. 启动智能体实例
def start_ai_agent(user_id, agent_id, instance_id):
    request = ice_models.StartAIAgentInstanceRequest(
        agent_id=agent_id,
        user_id=user_id,
        instance_id=instance_id,
        type='AUDIO_CALL',
        greeting='您好，我是智能客服助手',
        enable_intelligent_segment=True
    )
    
    response = client.start_ai_agent_instance(request)
    return {
        'instance_id': response.body.instance_id,
        'rtc_channel_id': response.body.rtc_channel_id,
        'rtc_join_token': response.body.rtc_join_token
    }

# 3. 停止智能体实例
def stop_ai_agent(instance_id):
    request = ice_models.StopAIAgentInstanceRequest(
        instance_id=instance_id
    )
    client.stop_ai_agent_instance(request)
```

### Node.js 服务端示例

```javascript
const express = require('express');
const app = express();
const { ICE20201109Client, StartAIAgentInstanceRequest } = require('@alicloud/ice20201109');

const client = new ICE20201109Client({
  accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  regionId: 'cn-shanghai'
});

app.post('/api/start-call', async (req, res) => {
  const { userId } = req.body;
  
  try {
    const request = new StartAIAgentInstanceRequest({
      agentId: 'agent_xxx',
      userId: userId,
      type: 'AUDIO_CALL',
      greeting: '您好，我是智能客服助手'
    });
    
    const response = await client.startAIAgentInstance(request);
    
    res.json({
      rtcChannelId: response.body.rtcChannelId,
      rtcJoinToken: response.body.rtcJoinToken
    });
  } catch (error) {
    console.error('启动智能体失败:', error);
    res.status(500).json({ error: '启动失败' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 智能体回调配置

```python
# 在 API 中配置回调
request = ice_models.StartAIAgentInstanceRequest(
    agent_id='agent_xxx',
    user_id='user_123',
    callback_config={
        'callback_url': 'https://your-server.com/callback',
        'callback_events': [
            'AgentStart',
            'AgentEnd',
            'UserSubtitle',
            'AgentSubtitle',
            'ConversationTranscript'
        ]
    }
)

# 处理回调（Flask 示例）
@app.route('/callback', methods=['POST'])
def handle_callback():
    data = request.json
    
    if data['event'] == 'ConversationTranscript':
        # 保存完整对话记录
        save_conversation(data['conversation'])
    
    elif data['event'] == 'AgentEnd':
        # 通话结束，进行后处理
        process_call_end(data['instance_id'])
    
    return {'status': 'success'}
```

---

## 八、高级功能

### 1. 实时字幕实现

```javascript
// Web 端实时字幕实现
engine.on('userSubtitleNotify', (subtitle) => {
  // subtitle: { text: string, isSentenceEnd: boolean, sentenceId: string }
  displayUserSubtitle(subtitle.text);
  
  if (subtitle.isSentenceEnd) {
    saveUserSentence(subtitle.text);
  }
});

engine.on('agentSubtitleNotify', (subtitle) => {
  const fullText = mergeAgentSubtitle(subtitle.text);
  displayAgentSubtitle(fullText);
});
```

### 2. 打断功能配置

```javascript
// 在 StartAIAgentInstance API 中配置
const config = {
  agentId: 'agent_xxx',
  userId: 'user_123',
  interruptConfig: {
    enableVoiceInterrupt: true,
    interruptWords: ['停止', '等一下', '慢点']
  }
};

// 客户端动态切换
engine.setVoiceInterruptEnabled(true);
```

### 3. 声纹降噪

```javascript
const config = {
  voiceprintConfig: {
    enableVoiceprintNoiseReduction: true
  }
};
```

**优势**:
- 自动过滤嘈杂音
- 多人说话时优先采集音量最大的人声
- 通过声纹特征精确捕捉主讲人语音

### 4. 语义断句优化

```javascript
const config = {
  enableIntelligentSegment: true
};
```

### 5. 真人接管

```javascript
// 客服侧接管
client.takeoverAIAGentCall({
  instanceId: 'inst_xxx',
  agentId: 'agent_xxx'
});

// 用户侧监听接管状态
engine.on('humanTakeoverWillStart', () => {
  console.log('真人客服即将接管');
});

engine.on('humanTakeoverConnected', () => {
  console.log('真人客服已接入');
});
```

### 6. 情绪识别

```javascript
const config = {
  enableEmotionRecognition: true
};

engine.on('userEmotionDetected', (emotion) => {
  console.log('用户情绪:', emotion);
  // emotion: 'happy' | 'sad' | 'angry' | 'neutral'
});
```

### 7. ASR 热词配置

```json
{
  "nodeType": "STT",
  "config": {
    "hotWords": ["售后", "退款", "投诉", "订单查询", "物流"]
  }
}
```

---

## 九、完整实现流程

### 步骤 1: 创建实时工作流

1. 登录阿里云 IMS 控制台
2. 进入 "AI 实时互动" → "实时工作流"
3. 创建工作流，配置节点：
   ```
   [开始] → [STT节点] → [LLM节点] → [TTS节点] → [结束]
   ```
4. 保存工作流，获取 `WorkflowId`

### 步骤 2: 创建智能体

1. 进入 "AI 智能体管理"
2. 创建智能体，关联工作流
3. 配置智能体属性：
   - 智能体名称
   - 欢迎词
   - 音色
   - 打断设置
4. 保存智能体，获取 `AgentId`

### 步骤 3: 测试智能体

1. 在控制台生成测试二维码
2. 扫码体验智能体
3. 调整工作流和智能体参数

### 步骤 4: 集成 SDK

详见第五章 SDK 集成指南

### 步骤 5: 服务端 API 实现

详见第七章服务端集成

---

## 十、计费说明

### 定价模式

| 服务类型 | 规格 | 价格（中国内地） |
|---------|------|-----------------|
| **音频规格** | 纯音频通话 | 0.098 元/分钟 |
| **视频规格** | 数字人/视觉理解/视频通话 | 0.3512 元/分钟 |

### 费用构成

```
总费用 = AI智能体服务费用 + 实时音视频服务费用

AI智能体服务费用包括：
├── STT（语音转文字）
├── TTS（文字转语音）
└── 智能体运行时长

实时音视频服务费用：
├── 音视频通话时长
├── 录制费用（可选）
└── 数字人费用（可选）
```

### 免费额度

- 每天提供 **20 通免费通话**（用于体验测试）

---

## 十一、开源示例

**官方 GitHub 项目**: [MediaBox-AUIKits/AUIAICall](https://github.com/MediaBox-AUIKits/AUIAICall)

```bash
git clone https://github.com/MediaBox-AUIKits/AUIAICall.git
```

包含完整示例：
- **Android**: 完整的 AI 通话应用示例
- **iOS**: Swift 语言完整实现
- **Web**: React + TypeScript 版本
- **Server/Java**: 服务端 Java 实现

---

## 十二、常见问题

### Q1: 如何实现零损语音断句？

在 `StartAIAgentInstance` API 中设置 `EnableIntelligentSegment: true` 即可启用智能语义断句技术。

### Q2: 如何在嘈杂环境中实现流畅对话？

启用 AI 声学 V2.5 版本和声纹降噪功能：
```javascript
voiceprintConfig: {
  enableVoiceprintNoiseReduction: true
}
```

### Q3: 如何集成自研大模型？

在工作流 LLM 节点中选择 "自研"，按 OpenAI 规范接入您的模型，提供：
- `ModelId`
- `API-KEY`
- `HTTPS URL`

### Q4: 如何实现真人接管？

调用 `TakeoverAIAgentCall` API 开启真人接管模式，客服侧通过 RTC 入会并接收智能体发送的字幕。

### Q5: 如何提升特定词汇识别准确率？

在工作流 STT 节点中配置热词：
```json
{
  "hotWords": ["售后", "退款", "投诉"]
}
```

---

## 十三、技术支持

- **官方文档**: [智能媒体服务 IMS](https://help.aliyun.com/zh/ims/)
- **开发者社区**: [阿里云开发者社区](https://developer.aliyun.com/)
- **钉钉技术群**: 搜索群号 `106730016696`
- **开源项目**: [MediaBox-AUIKits/AUIAICall](https://github.com/MediaBox-AUIKits/AUIAICall)

---

## 总结

阿里云 IMS AI 实时互动提供了完整的端到端解决方案：

✅ **快速构建**: 10 分钟可视化配置  
✅ **灵活集成**: 支持 Android、iOS、Web 多平台  
✅ **完整功能**: 语音/视频/数字人/消息对话  
✅ **高度拟人**: 智能降噪、打断、断句  
✅ **易于扩展**: 支持自研 LLM、TTS、STT  

通过本指南，您可以快速搭建企业级的 AI 实时客服系统。
