# FastGPT 停车场智能客服工作流配置指南

## 概述

本文档提供符合 FastGPT 官方规范的工作流 JSON 配置，用于停车场智能客服场景。

## 工作流架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────────┐
│  流程开始   │────▶│  问题分类   │────▶│  分支处理                        │
│ workflowStart│     │classifyQuestion│   │                                 │
└─────────────┘     └─────────────┘     │  ├─ human  → 转人工回复 → HTTP   │
                                         │  ├─ urgent → 投诉处理 → HTTP    │
                                         │  ├─ normal → 知识库 → AI回答    │
                                         │  └─ chat   → 闲聊回复           │
                                         └─────────────────────────────────┘
```

## 节点类型说明

| 节点类型 | flowNodeType | 用途 |
|----------|--------------|------|
| 系统配置 | `userGuide` | 欢迎语、变量、TTS等 |
| 流程开始 | `workflowStart` | 工作流入口 |
| 问题分类 | `classifyQuestion` | 意图识别分流 |
| AI对话 | `chatNode` | LLM对话回复 |
| 知识库搜索 | `datasetSearchNode` | RAG检索 |
| HTTP请求 | `httpRequest468` | 外部API调用 |
| 判断器 | `ifElseNode` | 条件分支 |

---

## 完整 JSON 配置

> **导入方式**: FastGPT控制台 → 应用 → 高级编排 → 导入

```json
{
  "nodes": [
    {
      "nodeId": "userGuide",
      "name": "系统配置",
      "intro": "可以配置应用的系统参数",
      "avatar": "/imgs/workflow/userGuide.png",
      "flowNodeType": "userGuide",
      "position": {
        "x": 100,
        "y": -400
      },
      "inputs": [
        {
          "key": "welcomeText",
          "renderTypeList": ["hidden"],
          "valueType": "string",
          "label": "core.app.Welcome Text",
          "value": "您好！我是智慧停车场AI客服助手🚗\n\n我可以帮您：\n• 查询停车费用\n• 办理月卡/优惠\n• 处理出入场问题\n• 开具发票\n\n如需人工服务，请说\"转人工\"。"
        },
        {
          "key": "variables",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "label": "core.app.Chat Variable",
          "value": []
        },
        {
          "key": "questionGuide",
          "valueType": "boolean",
          "renderTypeList": ["hidden"],
          "label": "core.app.Question Guide",
          "value": true
        },
        {
          "key": "tts",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "label": "",
          "value": {
            "type": "web"
          }
        },
        {
          "key": "whisper",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "label": "",
          "value": {
            "open": true,
            "autoSend": true,
            "autoTTSResponse": true
          }
        },
        {
          "key": "scheduleTrigger",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "label": "",
          "value": null
        }
      ],
      "outputs": []
    },
    {
      "nodeId": "448745",
      "name": "流程开始",
      "intro": "",
      "avatar": "/imgs/workflow/userChatInput.svg",
      "flowNodeType": "workflowStart",
      "position": {
        "x": 500,
        "y": -200
      },
      "inputs": [
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "toolDescription": "用户问题"
        }
      ],
      "outputs": [
        {
          "id": "userChatInput",
          "key": "userChatInput",
          "label": "core.module.input.label.user question",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "classifyNode",
      "name": "问题分类",
      "intro": "根据用户的历史记录和当前问题判断该次提问的类型。",
      "avatar": "/imgs/workflow/cq.png",
      "flowNodeType": "classifyQuestion",
      "showStatus": true,
      "position": {
        "x": 900,
        "y": -300
      },
      "inputs": [
        {
          "key": "model",
          "renderTypeList": ["selectLLMModel", "reference"],
          "label": "core.module.input.label.aiModel",
          "required": true,
          "valueType": "string",
          "llmModelType": "classify",
          "value": "qwen-turbo"
        },
        {
          "key": "systemPrompt",
          "renderTypeList": ["textarea", "reference"],
          "max": 3000,
          "valueType": "string",
          "label": "core.module.input.label.Background",
          "description": "core.module.input.description.Background",
          "placeholder": "core.module.input.placeholder.Classify background",
          "value": "你是一个智慧停车场的客服助手，请判断用户的意图。\n\n注意：\n- 用户明确要求人工时，归类为\"转人工\"\n- 用户表达不满、投诉时，归类为\"投诉紧急\"\n- 用户询问操作问题时，归类为\"常规咨询\"\n- 用户打招呼闲聊时，归类为\"闲聊\""
        },
        {
          "key": "history",
          "renderTypeList": ["numberInput", "reference"],
          "valueType": "chatHistory",
          "label": "core.module.input.label.chat history",
          "description": "最多携带多少轮对话记录",
          "required": true,
          "min": 0,
          "max": 50,
          "value": 6
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "toolDescription": "用户输入的问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        },
        {
          "key": "agents",
          "renderTypeList": ["custom"],
          "valueType": "any",
          "label": "",
          "value": [
            {
              "value": "转人工：用户明确要求人工客服\n关键词：人工、转接、客服、真人\n示例：我要人工客服、帮我转人工",
              "key": "human"
            },
            {
              "value": "投诉紧急：用户情绪激动或投诉\n关键词：投诉、举报、太慢了、急死了\n示例：我要投诉、你们什么服务",
              "key": "urgent"
            },
            {
              "value": "常规咨询：停车相关问题\n关键词：多少钱、怎么收费、月卡、发票\n示例：停车费怎么算、月卡多少钱",
              "key": "normal"
            },
            {
              "value": "闲聊：打招呼或闲聊\n关键词：你好、在吗、谢谢、再见\n示例：你好啊、谢谢你",
              "key": "chat"
            }
          ]
        }
      ],
      "outputs": [
        {
          "id": "cqResult",
          "key": "cqResult",
          "required": true,
          "label": "分类结果",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "humanReply",
      "name": "转人工回复",
      "intro": "AI对话",
      "avatar": "/imgs/workflow/AI.png",
      "flowNodeType": "chatNode",
      "showStatus": true,
      "position": {
        "x": 1400,
        "y": -600
      },
      "inputs": [
        {
          "key": "model",
          "renderTypeList": ["settingLLMModel", "reference"],
          "label": "core.module.input.label.aiModel",
          "valueType": "string",
          "value": "qwen-turbo"
        },
        {
          "key": "isResponseAnswerText",
          "renderTypeList": ["hidden"],
          "label": "",
          "value": true,
          "valueType": "boolean"
        },
        {
          "key": "systemPrompt",
          "renderTypeList": ["textarea", "reference"],
          "max": 3000,
          "valueType": "string",
          "label": "core.ai.Prompt",
          "value": "你是停车场客服助手。用户请求转人工，请回复：\n\"好的，正在为您转接人工客服，请稍候~\"\n\n回复要求：简洁友好，不超过30字"
        },
        {
          "key": "history",
          "renderTypeList": ["numberInput", "reference"],
          "valueType": "chatHistory",
          "label": "core.module.input.label.chat history",
          "required": true,
          "min": 0,
          "max": 50,
          "value": 3
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        }
      ],
      "outputs": [
        {
          "id": "answerText",
          "key": "answerText",
          "required": true,
          "label": "core.module.output.label.Ai response content",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "urgentReply",
      "name": "投诉处理",
      "intro": "AI对话",
      "avatar": "/imgs/workflow/AI.png",
      "flowNodeType": "chatNode",
      "showStatus": true,
      "position": {
        "x": 1400,
        "y": -300
      },
      "inputs": [
        {
          "key": "model",
          "renderTypeList": ["settingLLMModel", "reference"],
          "label": "core.module.input.label.aiModel",
          "valueType": "string",
          "value": "qwen-turbo"
        },
        {
          "key": "isResponseAnswerText",
          "renderTypeList": ["hidden"],
          "label": "",
          "value": true,
          "valueType": "boolean"
        },
        {
          "key": "systemPrompt",
          "renderTypeList": ["textarea", "reference"],
          "max": 3000,
          "valueType": "string",
          "label": "core.ai.Prompt",
          "value": "你是停车场客服助手。用户情绪激动或有投诉，请：\n1. 先道歉安抚\n2. 表示重视\n3. 告知转人工\n\n示例：\"非常抱歉给您带来不便！我们非常重视您的反馈，正在为您转接人工客服优先处理，请稍候~\""
        },
        {
          "key": "history",
          "renderTypeList": ["numberInput", "reference"],
          "valueType": "chatHistory",
          "label": "core.module.input.label.chat history",
          "required": true,
          "min": 0,
          "max": 50,
          "value": 6
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        }
      ],
      "outputs": [
        {
          "id": "answerText",
          "key": "answerText",
          "required": true,
          "label": "core.module.output.label.Ai response content",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "datasetSearch",
      "name": "知识库搜索",
      "intro": "调用知识库搜索",
      "avatar": "/imgs/workflow/db.png",
      "flowNodeType": "datasetSearchNode",
      "showStatus": true,
      "position": {
        "x": 1400,
        "y": 0
      },
      "inputs": [
        {
          "key": "datasets",
          "renderTypeList": ["selectDataset", "reference"],
          "label": "core.module.input.label.Select dataset",
          "value": [],
          "valueType": "selectDataset",
          "required": true
        },
        {
          "key": "similarity",
          "renderTypeList": ["selectDatasetParamsModal"],
          "label": "",
          "value": 0.5,
          "valueType": "number"
        },
        {
          "key": "limit",
          "renderTypeList": ["hidden"],
          "label": "",
          "value": 3000,
          "valueType": "number"
        },
        {
          "key": "searchMode",
          "renderTypeList": ["hidden"],
          "label": "",
          "valueType": "string",
          "value": "mixedRecall"
        },
        {
          "key": "usingReRank",
          "renderTypeList": ["hidden"],
          "label": "",
          "valueType": "boolean",
          "value": false
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        }
      ],
      "outputs": [
        {
          "id": "quoteQA",
          "key": "quoteQA",
          "label": "core.module.Dataset quote.label",
          "type": "static",
          "valueType": "datasetQuote"
        }
      ]
    },
    {
      "nodeId": "normalReply",
      "name": "知识库回答",
      "intro": "AI对话",
      "avatar": "/imgs/workflow/AI.png",
      "flowNodeType": "chatNode",
      "showStatus": true,
      "position": {
        "x": 1900,
        "y": 0
      },
      "inputs": [
        {
          "key": "model",
          "renderTypeList": ["settingLLMModel", "reference"],
          "label": "core.module.input.label.aiModel",
          "valueType": "string",
          "value": "qwen-turbo"
        },
        {
          "key": "isResponseAnswerText",
          "renderTypeList": ["hidden"],
          "label": "",
          "value": true,
          "valueType": "boolean"
        },
        {
          "key": "systemPrompt",
          "renderTypeList": ["textarea", "reference"],
          "max": 3000,
          "valueType": "string",
          "label": "core.ai.Prompt",
          "value": "你是停车场客服助手。请根据知识库内容回答用户问题。\n\n回答原则：\n1. 简洁明了，不超过50字\n2. 直接说重点，不要说\"根据查询...\"\n3. 告诉用户怎么做\n4. 友好收尾\n\n示例：\n问：停车费怎么算？\n答：您好！前15分钟免费，之后每小时3元，24小时封顶30元。还有问题可以继续问我~"
        },
        {
          "key": "history",
          "renderTypeList": ["numberInput", "reference"],
          "valueType": "chatHistory",
          "label": "core.module.input.label.chat history",
          "required": true,
          "min": 0,
          "max": 50,
          "value": 6
        },
        {
          "key": "quoteQA",
          "renderTypeList": ["settingDatasetQuotePrompt"],
          "label": "",
          "valueType": "datasetQuote",
          "value": ["datasetSearch", "quoteQA"]
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        }
      ],
      "outputs": [
        {
          "id": "answerText",
          "key": "answerText",
          "required": true,
          "label": "core.module.output.label.Ai response content",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "chatReply",
      "name": "闲聊回复",
      "intro": "AI对话",
      "avatar": "/imgs/workflow/AI.png",
      "flowNodeType": "chatNode",
      "showStatus": true,
      "position": {
        "x": 1400,
        "y": 300
      },
      "inputs": [
        {
          "key": "model",
          "renderTypeList": ["settingLLMModel", "reference"],
          "label": "core.module.input.label.aiModel",
          "valueType": "string",
          "value": "qwen-turbo"
        },
        {
          "key": "isResponseAnswerText",
          "renderTypeList": ["hidden"],
          "label": "",
          "value": true,
          "valueType": "boolean"
        },
        {
          "key": "systemPrompt",
          "renderTypeList": ["textarea", "reference"],
          "max": 3000,
          "valueType": "string",
          "label": "core.ai.Prompt",
          "value": "你是智慧停车场的AI客服助手，亲切友好。\n\n回复要求：\n1. 简短热情（不超过20字）\n2. 自然引导用户说出需求\n\n示例：\n- 用户说\"你好\" → \"您好！请问有什么可以帮您的吗？\"\n- 用户说\"谢谢\" → \"不客气，祝您停车愉快！\""
        },
        {
          "key": "history",
          "renderTypeList": ["numberInput", "reference"],
          "valueType": "chatHistory",
          "label": "core.module.input.label.chat history",
          "required": true,
          "min": 0,
          "max": 50,
          "value": 3
        },
        {
          "key": "userChatInput",
          "renderTypeList": ["reference", "textarea"],
          "valueType": "string",
          "label": "用户问题",
          "required": true,
          "value": ["448745", "userChatInput"]
        }
      ],
      "outputs": [
        {
          "id": "answerText",
          "key": "answerText",
          "required": true,
          "label": "core.module.output.label.Ai response content",
          "valueType": "string",
          "type": "static"
        }
      ]
    },
    {
      "nodeId": "httpHuman",
      "name": "触发转人工",
      "intro": "调用转人工接口",
      "avatar": "/imgs/workflow/http.png",
      "flowNodeType": "httpRequest468",
      "showStatus": true,
      "position": {
        "x": 1900,
        "y": -450
      },
      "inputs": [
        {
          "key": "system_addInputParam",
          "renderTypeList": ["addInputParam"],
          "valueType": "dynamic",
          "label": "",
          "required": false,
          "description": "core.module.input.description.HTTP Dynamic Input",
          "editField": {
            "key": true,
            "valueType": true
          }
        },
        {
          "key": "system_httpMethod",
          "renderTypeList": ["custom"],
          "valueType": "string",
          "label": "",
          "value": "POST",
          "required": true
        },
        {
          "key": "system_httpReqUrl",
          "renderTypeList": ["hidden"],
          "valueType": "string",
          "label": "",
          "description": "core.module.input.description.Http Request Url",
          "placeholder": "https://api.example.com",
          "required": false,
          "value": "https://47.237.118.74:3000/api/request-human-takeover"
        },
        {
          "key": "system_httpHeader",
          "renderTypeList": ["custom"],
          "valueType": "any",
          "value": [
            {
              "key": "Content-Type",
              "type": "string",
              "value": "application/json"
            }
          ],
          "label": "",
          "description": "core.module.input.description.Http Request Header",
          "required": false
        },
        {
          "key": "system_httpParams",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "value": [],
          "label": ""
        },
        {
          "key": "system_httpJsonBody",
          "renderTypeList": ["hidden"],
          "valueType": "any",
          "label": "",
          "value": "{\n  \"reason\": \"user_requested\",\n  \"source\": \"fastgpt\"\n}"
        }
      ],
      "outputs": [
        {
          "id": "system_httpResult",
          "key": "system_httpResult",
          "label": "HTTP响应",
          "valueType": "any",
          "type": "static"
        }
      ]
    }
  ],
  "edges": [
    {
      "source": "448745",
      "target": "classifyNode",
      "sourceHandle": "448745-source-right",
      "targetHandle": "classifyNode-target-left"
    },
    {
      "source": "classifyNode",
      "target": "humanReply",
      "sourceHandle": "classifyNode-source-human",
      "targetHandle": "humanReply-target-left"
    },
    {
      "source": "classifyNode",
      "target": "urgentReply",
      "sourceHandle": "classifyNode-source-urgent",
      "targetHandle": "urgentReply-target-left"
    },
    {
      "source": "classifyNode",
      "target": "datasetSearch",
      "sourceHandle": "classifyNode-source-normal",
      "targetHandle": "datasetSearch-target-left"
    },
    {
      "source": "classifyNode",
      "target": "chatReply",
      "sourceHandle": "classifyNode-source-chat",
      "targetHandle": "chatReply-target-left"
    },
    {
      "source": "datasetSearch",
      "target": "normalReply",
      "sourceHandle": "datasetSearch-source-right",
      "targetHandle": "normalReply-target-left"
    },
    {
      "source": "humanReply",
      "target": "httpHuman",
      "sourceHandle": "humanReply-source-right",
      "targetHandle": "httpHuman-target-left"
    },
    {
      "source": "urgentReply",
      "target": "httpHuman",
      "sourceHandle": "urgentReply-source-right",
      "targetHandle": "httpHuman-target-left"
    }
  ]
}
```

---

## 导入后必做配置

### 1. 选择知识库

导入后，`知识库搜索` 节点的 `datasets` 为空，需要手动选择：

1. 点击 `知识库搜索` 节点
2. 在右侧面板找到「选择知识库」
3. 选择你的停车场知识库

### 2. 确认模型配置

确保以下模型在你的 FastGPT 中可用：
- `qwen-turbo` (阿里通义千问)

如不可用，请替换为其他模型如 `gpt-3.5-turbo`。

### 3. 修改 HTTP 请求地址

如果你的后端服务器地址不同，修改 `httpHuman` 节点：

```json
"value": "https://你的服务器地址/api/request-human-takeover"
```

---

## 节点配置详解

### 问题分类节点 (classifyQuestion)

```json
{
  "key": "agents",
  "value": [
    {
      "value": "分类描述",
      "key": "分类标识"  // 用于 edges 的 sourceHandle
    }
  ]
}
```

**分类标识规则**：
- edges 中 `sourceHandle` 格式为 `{nodeId}-source-{key}`
- 例如：`classifyNode-source-human`

### HTTP 请求节点 (httpRequest468)

**必需字段**：

| 字段 | 说明 |
|------|------|
| `system_addInputParam` | 动态输入参数配置 |
| `system_httpMethod` | HTTP 方法 (GET/POST) |
| `system_httpReqUrl` | 请求地址 |
| `system_httpHeader` | 请求头 |
| `system_httpParams` | URL 参数 |
| `system_httpJsonBody` | JSON 请求体 |

### AI 对话节点 (chatNode)

**关键配置**：

| 字段 | 说明 |
|------|------|
| `model` | LLM 模型名称 |
| `systemPrompt` | 系统提示词 |
| `history` | 携带对话历史轮数 |
| `userChatInput` | 用户输入引用 |
| `quoteQA` | 知识库引用（可选） |

---

## Edges 连接规则

```json
{
  "source": "源节点ID",
  "target": "目标节点ID",
  "sourceHandle": "源节点ID-source-{输出标识}",
  "targetHandle": "目标节点ID-target-left"
}
```

### 常用 Handle 格式

| 节点类型 | sourceHandle 格式 |
|----------|-------------------|
| workflowStart | `{nodeId}-source-right` |
| classifyQuestion | `{nodeId}-source-{分类key}` |
| chatNode | `{nodeId}-source-right` |
| datasetSearchNode | `{nodeId}-source-right` |
| ifElseNode | `{nodeId}-source-IF` / `{nodeId}-source-ELSE` |

---

## 常见问题

### Q: 导入失败，提示 JSON 格式错误

**A**: 检查以下几点：
1. JSON 末尾不要有多余逗号
2. 所有字符串使用双引号
3. 确保 `edges` 中的 `source`/`target` 与 `nodes` 中的 `nodeId` 匹配

### Q: 节点之间没有连线

**A**: 检查 `edges` 配置：
1. `sourceHandle` 格式是否正确
2. 分类节点的 `key` 是否与 `sourceHandle` 中的一致

### Q: 知识库搜索不返回结果

**A**: 检查：
1. 是否已选择知识库
2. `similarity` 阈值是否过高（建议 0.4-0.6）
3. 知识库中是否有相关内容

---

## 参考资料

- [FastGPT 官方文档](https://doc.fastgpt.io/)
- [FastGPT GitHub](https://github.com/labring/fastgpt)
- [工作流编排教程](https://doc.fastgpt.io/docs/workflow/)

---

**文档版本**: v2.0
**更新时间**: 2026-01-22
**适用版本**: FastGPT 4.9+
