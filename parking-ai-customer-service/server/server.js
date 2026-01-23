/**
 * 停车场智能客服 - Node.js后端API服务
 * 基于Express框架,对接阿里云IMS API
 */

require('dotenv').config();
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const OpenApi = require('@alicloud/openapi-client');
const OpenApiUtil = require('@alicloud/openapi-util').default;
const TeaUtil = require('@alicloud/tea-util');

// 导入新增的管理器和服务
const sessionManager = require('./managers/SessionManager');
const agentStatusManager = require('./managers/AgentStatusManager');
const queueManager = require('./managers/QueueManager');
const { initWebSocket, pushSessionToAgent, notifyUserTakeoverSuccess } = require('./socket');
const { takeoverAIAgentCall } = require('./utils/takeover');

// ==================== 配置 ====================
const CONFIG = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',

    aliyun: {
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
        region: process.env.ALIBABA_CLOUD_REGION || 'cn-shanghai',
    },

    rtc: {
        appId: process.env.ALIBABA_CLOUD_RTC_APP_ID,
        appKey: process.env.ALIBABA_CLOUD_RTC_APP_KEY,
    },

    agentId: process.env.AGENT_ID,
};

const OPEN_API_VERSION = '2020-11-09';

// ==================== 日志工具 ====================
const logger = {
    debug(...args) {
        if (CONFIG.logLevel === 'debug') {
            console.log('[DEBUG]', new Date().toISOString(), ...args);
        }
    },
    info(...args) {
        if (['debug', 'info'].includes(CONFIG.logLevel)) {
            console.info('[INFO]', new Date().toISOString(), ...args);
        }
    },
    warn(...args) {
        if (['debug', 'info', 'warn'].includes(CONFIG.logLevel)) {
            console.warn('[WARN]', new Date().toISOString(), ...args);
        }
    },
    error(...args) {
        console.error('[ERROR]', new Date().toISOString(), ...args);
    },
};

// ==================== 初始化阿里云客户端 ====================

// ==================== OpenAPI 辅助方法 ====================
const OpenApiClient = OpenApi.default;
const openApiClients = new Map();

function getOpenApiClient(region) {
    const resolvedRegion = region || CONFIG.aliyun.region;
    if (openApiClients.has(resolvedRegion)) {
        return openApiClients.get(resolvedRegion);
    }
    const config = new OpenApi.Config({
        accessKeyId: CONFIG.aliyun.accessKeyId,
        accessKeySecret: CONFIG.aliyun.accessKeySecret,
    });
    config.endpoint = `ice.${resolvedRegion}.aliyuncs.com`;
    config.regionId = resolvedRegion;
    const client = new OpenApiClient(config);
    openApiClients.set(resolvedRegion, client);
    return client;
}

function pickDefined(values) {
    return Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
}

function toJsonString(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
}

async function callIceOpenApi(action, region, query) {
    const client = getOpenApiClient(region);
    const params = new OpenApi.Params({
        action: action,
        version: OPEN_API_VERSION,
        protocol: 'HTTPS',
        method: 'POST',
        authType: 'AK',
        style: 'RPC',
        pathname: '/',
        reqBodyType: 'json',
        bodyType: 'json',
    });
    const request = new OpenApi.OpenApiRequest({
        query: OpenApiUtil.query(query),
    });
    const runtime = new TeaUtil.RuntimeOptions({});
    return client.callApi(params, request, runtime);
}

function buildOpenApiError(error, fallbackMessage) {
    const data = error?.data || {};
    const code = Number(data?.Code || data?.code) || 500;
    return {
        code: code,
        message: data?.Message || data?.message || error?.message || fallbackMessage,
        error_code: data?.Code || data?.code || error?.code,
        request_id: data?.RequestId || data?.requestId,
    };
}

function createChannelId() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID().replace(/-/g, '');
    }
    return crypto.randomBytes(16).toString('hex');
}

/**
 * 生成阿里云 RTC Auth Token
 *
 * 算法文档: https://help.aliyun.com/document_detail/146833.html
 * 官方示例: https://github.com/aliyunvideo/AliRtcAppServer/blob/master/nodejs/index.js
 * 拼接顺序: AppID + AppKey + ChannelID + UserID + Nonce + Timestamp
 *
 * ⚠️ 重要: Nonce 必须以 'AK-' 前缀开头，否则加入频道验证会失败！
 *
 * @param {string} channelId - 频道 ID
 * @param {string} userId - 用户 ID
 * @param {number} timestamp - 时间戳（秒）
 * @returns {Object} 包含 token 和 nonce 的对象
 */
function createRtcAuthToken(channelId, userId, timestamp) {
    // ✅ 关键修复: Nonce 必须以 'AK-' 前缀开头
    // 官方说明: "the Nonce should be prefix with 'AK-' otherwise the joining verification will failed"
    const nonce = 'AK-' + crypto.randomUUID().replace(/-/g, '');

    // 拼接顺序: AppID + AppKey + ChannelID + UserID + Nonce + Timestamp
    const raw = `${CONFIG.rtc.appId}${CONFIG.rtc.appKey}${channelId}${userId}${nonce}${timestamp}`;
    const token = crypto.createHash('sha256').update(raw).digest('hex');

    const payload = {
        appid: CONFIG.rtc.appId,
        channelid: channelId,
        userid: userId,
        nonce: nonce,
        timestamp: timestamp,
        token: token,
    };

    return {
        base64Token: Buffer.from(JSON.stringify(payload)).toString('base64'),
        nonce: nonce,
        token: token,
    };
}

/**
 * 生成独立 RTC Token（用于真人客服通话）
 * @param {Object} params
 * @param {string} params.channelId - RTC 频道 ID
 * @param {string} params.userId - 用户 ID（可以是用户端或客服端）
 * @param {string} params.region - 区域（可选）
 * @returns {Promise<Object>} 包含 success 和 rtcAuthToken 的结果对象
 */
async function getRTCToken({ channelId, userId, region }) {
    try {
        if (!channelId) {
            return {
                success: false,
                message: 'channelId is required',
                errorCode: 'MISSING_CHANNEL_ID',
            };
        }

        if (!userId) {
            return {
                success: false,
                message: 'userId is required',
                errorCode: 'MISSING_USER_ID',
            };
        }

        if (!CONFIG.rtc.appId || !CONFIG.rtc.appKey) {
            return {
                success: false,
                message: 'RTC AppId/AppKey is not configured',
                errorCode: 'RTC_NOT_CONFIGURED',
            };
        }

        // 生成 Token，有效期 24 小时
        const timestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        const rtcAuthToken = createRtcAuthToken(channelId, userId, timestamp);

        logger.debug('[getRTCToken] Token generated:', {
            channelId,
            userId,
            timestamp,
        });

        return {
            success: true,
            rtcAuthToken,
            channelId,
            userId,
            timestamp,
        };

    } catch (error) {
        logger.error('[getRTCToken] Failed to generate RTC token:', error);
        return {
            success: false,
            message: error.message || 'Failed to generate RTC token',
            errorCode: 'TOKEN_GENERATION_FAILED',
        };
    }
}

// ==================== Express应用 + WebSocket ====================
const app = express();

// 检查是否存在 HTTPS 证书（与前端共用）
const certPath = path.resolve(__dirname, '../certs');
const hasHttpsCerts = fs.existsSync(path.join(certPath, 'key.pem')) && fs.existsSync(path.join(certPath, 'cert.pem'));

// 创建服务器（优先 HTTPS，否则回退 HTTP）
let httpServer;
if (hasHttpsCerts) {
    const httpsOptions = {
        key: fs.readFileSync(path.join(certPath, 'key.pem')),
        cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
    };
    httpServer = https.createServer(httpsOptions, app);
    console.log('[Server] HTTPS 模式启用（支持局域网安全连接）');
} else {
    httpServer = http.createServer(app);
    console.log('[Server] HTTP 模式（仅限 localhost）');
}

// 初始化 WebSocket 服务
const io = initWebSocket(httpServer);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// ==================== API路由 ====================

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: CONFIG.env,
    });
});

async function startAIAgentInstance({
    userId,
    agentId,
    instanceId,
    type,
    greeting,
    wakeUpQuery,
    enableIntelligentSegment,
    config,
    region,
}) {
    if (!userId) {
        return { code: 400, message: 'userId is required' };
    }

    if (!agentId) {
        return { code: 400, message: 'agentId is required' };
    }

    const resolvedRegion = region || CONFIG.aliyun.region;
    const requestConfig = config
        ? pickDefined({
            Volume: config.volume,
            UserOnlineTimeout: config.userOnlineTimeout,
            AgentMaxIdleTime: config.agentMaxIdleTime,
        })
        : undefined;
    const runtimeConfig = {
        Type: type,
        Greeting: greeting,
        WakeUpQuery: wakeUpQuery,
        EnableIntelligentSegment: enableIntelligentSegment,
        Config: requestConfig,
    };

    try {
        const apiParams = pickDefined({
            AIAgentId: agentId,
            UserId: userId,
            InstanceId: instanceId,
            Type: type,
            Greeting: greeting,
            WakeUpQuery: wakeUpQuery,
            EnableIntelligentSegment: enableIntelligentSegment,
            Config: requestConfig,
            RuntimeConfig: toJsonString(runtimeConfig),
        });

        logger.debug('StartAIAgentInstance params:', apiParams);

        const response = await callIceOpenApi(
            'StartAIAgentInstance',
            resolvedRegion,
            apiParams
        );
        const body = response?.body || {};
        const code = Number(body.Code || body.code) || 200;

        if (code !== 200) {
            return {
                code: code,
                message: body.Message || body.message || 'request error',
                errorCode: body.ErrorCode || body.error_code,
                requestId: body.RequestId || body.request_id,
            };
        }

        return {
            code: 200,
            message: 'success',
            requestId: body.RequestId || body.request_id,
            instanceId: body.InstanceId || body.instance_id,
            rtcChannelId: body.RTCChannelId || body.rtc_channel_id,
            rtcJoinToken: body.RTCJoinToken || body.rtc_join_token,
        };
    } catch (error) {
        logger.error('startAIAgentInstance error:', error);
        const openApiError = buildOpenApiError(error, 'startAIAgentInstance failed');
        logger.error('OpenAPI error details:', openApiError);
        return {
            code: openApiError.code,
            message: openApiError.message,
            errorCode: openApiError.error_code,
            requestId: openApiError.request_id,
        };
    }
}

async function stopAIAgentInstance({ instanceId, region }) {
    if (!instanceId) {
        return { code: 400, message: 'instanceId is required' };
    }

    const resolvedRegion = region || CONFIG.aliyun.region;
    try {
        const response = await callIceOpenApi(
            'StopAIAgentInstance',
            resolvedRegion,
            pickDefined({
                InstanceId: instanceId,
            })
        );
        const body = response?.body || {};
        const code = Number(body.Code || body.code) || 200;

        if (code !== 200) {
            return {
                code: code,
                message: body.Message || body.message || 'request error',
                errorCode: body.ErrorCode || body.error_code,
                requestId: body.RequestId || body.request_id,
            };
        }

        return {
            code: 200,
            message: 'success',
            requestId: body.RequestId || body.request_id,
        };
    } catch (error) {
        const openApiError = buildOpenApiError(error, 'stopAIAgentInstance failed');
        return {
            code: openApiError.code,
            message: openApiError.message,
            errorCode: openApiError.error_code,
            requestId: openApiError.request_id,
        };
    }
}

async function generateAIAgentCall({
    userId,
    agentId,
    workflowType,
    templateConfig,
    agentConfig,
    expire,
    userData,
    region,
    sessionId,
    chatSyncConfig,
}) {
    if (!userId) {
        return { code: 400, message: 'user_id is required' };
    }

    if (!agentId && !workflowType) {
        return { code: 400, message: 'ai_agent_id or workflow_type is required' };
    }

    const resolvedRegion = region || CONFIG.aliyun.region;
    try {
        const response = await callIceOpenApi(
            'GenerateAIAgentCall',
            resolvedRegion,
            pickDefined({
                AIAgentId: agentId,
                WorkflowType: workflowType,
                UserId: userId,
                Expire: expire || 24 * 60 * 60,
                TemplateConfig: toJsonString(templateConfig) || '{}',
                AgentConfig: toJsonString(agentConfig),
                UserData: toJsonString(userData),
                Region: resolvedRegion,
                SessionId: sessionId,
                ChatSyncConfig: toJsonString(chatSyncConfig),
            })
        );
        const body = response?.body || {};
        const code = Number(body.Code || body.code) || 200;

        if (code !== 200) {
            return {
                code: code,
                message: body.Message || body.message || 'request error',
                errorCode: body.ErrorCode || body.error_code,
                requestId: body.RequestId || body.request_id,
            };
        }

        const instance = body.Instance || body.instance || {};
        const instanceId =
            body.AIAgentInstanceId ||
            body.InstanceId ||
            body.ai_agent_instance_id ||
            body.instance_id ||
            instance.InstanceId ||
            instance.instance_id;
        const channelId =
            body.ChannelId || body.channel_id || instance.ChannelId || instance.channel_id;
        const rtcAuthToken =
            body.RtcAuthToken || body.rtc_auth_token || body.Token || instance.RtcAuthToken;
        const agentUserId =
            body.AIAgentUserId || body.UserId || body.ai_agent_user_id || userId;

        if (!instanceId || !channelId || !rtcAuthToken) {
            return {
                code: 500,
                message: 'GenerateAIAgentCall response missing required fields',
                requestId: body.RequestId || body.request_id,
            };
        }

        return {
            code: 200,
            message: 'success',
            requestId: body.RequestId,
            instanceId,
            channelId,
            rtcAuthToken,
            agentUserId,
        };
    } catch (error) {
        const openApiError = buildOpenApiError(error, 'generateAIAgentCall failed');
        return {
            code: openApiError.code,
            message: openApiError.message,
            errorCode: openApiError.error_code,
            requestId: openApiError.request_id,
        };
    }
}

async function handleGenerateMessageChatToken(req, res) {
    const { ai_agent_id: agentId, user_id: userId, role, expire, region } = req.body || {};
    if (!agentId || !userId) {
        return res.status(200).json({
            code: 400,
            message: 'ai_agent_id and user_id are required',
        });
    }

    const resolvedRegion = region || CONFIG.aliyun.region;
    try {
        const response = await callIceOpenApi(
            'GenerateMessageChatToken',
            resolvedRegion,
            pickDefined({
                AIAgentId: agentId,
                Role: role,
                UserId: userId,
                Expire: expire,
                Region: resolvedRegion,
            })
        );
        const body = response?.body || {};
        const code = Number(body.Code || body.code) || 200;

        if (code !== 200) {
            return res.status(200).json({
                code: code,
                message: body.Message || body.message || 'request error',
                error_code: body.ErrorCode || body.error_code,
                request_id: body.RequestId || body.request_id,
            });
        }

        return res.json({
            code: 200,
            message: 'success',
            request_id: body.RequestId,
            app_id: body.AppId,
            token: body.Token,
            user_id: body.UserId,
            nonce: body.Nonce,
            role: body.Role,
            timestamp: body.TimeStamp,
            app_sign: body.AppSign,
        });
    } catch (error) {
        logger.error('generateMessageChatToken failed:', error);
        return res.status(200).json(buildOpenApiError(error, 'generateMessageChatToken failed'));
    }
}

async function handleGenerateAIAgentCall(req, res) {
    const {
        user_id: userId,
        ai_agent_id: agentId,
        workflow_type: workflowType,
        template_config: templateConfig,
        agent_config: agentConfig,
        expire,
        user_data: userData,
        region,
        session_id: sessionId,
        chat_sync_config: chatSyncConfig,
    } = req.body || {};

    const result = await generateAIAgentCall({
        userId,
        agentId,
        workflowType,
        templateConfig,
        agentConfig,
        expire,
        userData,
        region,
        sessionId,
        chatSyncConfig,
    });

    if (result.code !== 200) {
        return res.status(200).json({
            code: result.code,
            message: result.message,
            error_code: result.errorCode,
            request_id: result.requestId,
        });
    }

    return res.json({
        code: 200,
        message: 'success',
        request_id: result.requestId,
        ai_agent_instance_id: result.instanceId,
        channel_id: result.channelId,
        ai_agent_user_id: result.agentUserId,
        rtc_auth_token: result.rtcAuthToken,
    });
}

/**
 * 官方 Demo 接口: 获取 RTC 鉴权 Token
 */
app.post('/api/v2/aiagent/getRtcAuthToken', (req, res) => {
    try {
        const { user_id: userId, channel_id: channelId } = req.body || {};

        if (!userId) {
            return res.status(200).json({
                code: 400,
                message: 'user_id is required',
            });
        }

        if (!CONFIG.rtc.appId || !CONFIG.rtc.appKey) {
            return res.status(200).json({
                code: 500,
                message: 'RTC AppId/AppKey is not configured',
            });
        }

        const resolvedChannelId = channelId || createChannelId();
        const timestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
        const rtcAuthToken = createRtcAuthToken(resolvedChannelId, userId, timestamp);

        return res.json({
            code: 200,
            rtc_auth_token: rtcAuthToken,
            timestamp: timestamp,
            channel_id: resolvedChannelId,
        });
    } catch (error) {
        logger.error('getRtcAuthToken failed:', error);
        return res.status(200).json({
            code: 500,
            message: error.message || 'getRtcAuthToken failed',
        });
    }
});

/**
 * 官方 Demo 接口: 生成消息通话 Token
 */
app.post('/api/v1/aiagent/generateMessageChatToken', handleGenerateMessageChatToken);
app.post('/api/v2/aiagent/generateMessageChatToken', handleGenerateMessageChatToken);

/**
 * 官方 Demo 接口: 获取智能体实例配置
 */
app.post('/api/v2/aiagent/describeAIAgentInstance', async (req, res) => {
    const { ai_agent_instance_id: instanceId, region } = req.body || {};
    if (!instanceId) {
        return res.status(200).json({
            code: 400,
            message: 'ai_agent_instance_id is required',
        });
    }

    const resolvedRegion = region || CONFIG.aliyun.region;
    try {
        const response = await callIceOpenApi(
            'DescribeAIAgentInstance',
            resolvedRegion,
            pickDefined({
                InstanceId: instanceId,
            })
        );
        const body = response?.body || {};
        const code = Number(body.Code || body.code) || 200;

        if (code !== 200) {
            return res.status(200).json({
                code: code,
                message: body.Message || body.message || 'request error',
                error_code: body.ErrorCode || body.error_code,
                request_id: body.RequestId || body.request_id,
            });
        }

        const instance = body.Instance || body.instance || {};
        const runtimeConfig = instance.RuntimeConfig || instance.runtime_config;
        const templateConfig = instance.TemplateConfig || instance.template_config;
        const agentConfig = instance.AgentConfig || instance.agent_config || runtimeConfig || templateConfig;

        return res.json({
            code: 200,
            message: 'success',
            request_id: body.RequestId,
            agent_config: toJsonString(agentConfig),
            runtime_config: toJsonString(runtimeConfig),
            template_config: toJsonString(templateConfig),
            user_data: instance.UserData || instance.user_data,
            status: instance.Status || instance.status,
            call_log_url: instance.CallLogUrl || instance.call_log_url,
        });
    } catch (error) {
        logger.error('describeAIAgentInstance failed:', error);
        return res.status(200).json(buildOpenApiError(error, 'describeAIAgentInstance failed'));
    }
});

/**
 * 官方 Demo 接口: 生成智能体通话实例
 */
app.post('/api/v1/aiagent/generateAIAgentCall', handleGenerateAIAgentCall);
app.post('/api/v2/aiagent/generateAIAgentCall', handleGenerateAIAgentCall);

/**
 * 启动AI智能体通话
 */
app.post('/api/start-call', async (req, res) => {
    try {
        const {
            userId,
            instanceId,
            agentId = CONFIG.agentId,
            region = CONFIG.aliyun.region,
            type = 'AUDIO_CALL',
            greeting,
            enableIntelligentSegment = true,
            config = {},
        } = req.body;

        // 参数验证
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'agentId is not configured',
            });
        }

        logger.info('Starting AI Call (GenerateAIAgentCall):', {
            userId,
            agentId,
            type,
        });

        // 第一次调用获取 instanceId 和 channelId
        const result = await generateAIAgentCall({
            userId,
            agentId,
            region,
            // 传递 userData 给 FastGPT，包含用户标识信息
            // 注意：instanceId 和 channelId 在首次调用时还不知道
            // 所以先传 userId，后续通过其他方式关联
            userData: {
                userId: userId,
                // instanceId 和 channelId 会在响应后才知道
                // FastGPT 可以通过 userId 来识别用户
            },
        });

        if (result.code !== 200) {
            return res.status(500).json({
                error: result.message || 'Failed to generate AI agent call',
                code: result.code,
                requestId: result.requestId,
                errorCode: result.errorCode,
            });
        }

        logger.info('AI Call generated successfully:', {
            instanceId: result.instanceId,
            rtcChannelId: result.channelId,
        });

        // ✅ 保存通话信息到 SessionManager，用于后续 FastGPT 转人工查询
        // 此时创建一个 "预会话"，状态为 ai_talking
        const preSessionId = `ai_${result.instanceId}`;
        sessionManager.saveSession({
            sessionId: preSessionId,
            instanceId: result.instanceId,
            channelId: result.channelId,
            userId: userId,
            status: 'ai_talking',  // AI 正在通话中
            conversationHistory: [],
            createdAt: new Date(),
        });
        logger.info('[StartCall] Pre-session saved for userId:', userId);

        res.json({
            rtcChannelId: result.channelId,
            rtcJoinToken: result.rtcAuthToken,
            agentId: agentId,
            instanceId: result.instanceId,
        });

    } catch (error) {
        logger.error('Start AI Call failed:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start AI call',
            error: CONFIG.env === 'development' ? error.toString() : undefined,
        });
    }
});

/**
 * 停止AI智能体通话
 */
app.post('/api/stop-call', async (req, res) => {
    try {
        const { instanceId } = req.body;

        if (!instanceId) {
            return res.status(400).json({
                success: false,
                message: 'instanceId is required',
            });
        }

        logger.info('Stopping AI Call:', { instanceId });

        const result = await stopAIAgentInstance({ instanceId });

        if (result.code !== 200) {
            return res.status(500).json({
                success: false,
                message: result.message || 'Failed to stop AI call',
                errorCode: result.errorCode,
                requestId: result.requestId,
            });
        }

        logger.info('AI Call stopped successfully:', { instanceId });

        res.json({
            success: true,
            message: 'AI Call stopped successfully',
            data: {
                instanceId: instanceId,
            },
        });

    } catch (error) {
        logger.error('Stop AI Call failed:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to stop AI call',
            error: CONFIG.env === 'development' ? error.toString() : undefined,
        });
    }
});

/**
 * 获取RTC Token (如果需要自定义Token生成)
 * 注意: 阿里云IMS API会自动生成Token,此接口仅作示例
 */
app.post('/api/get-token', async (req, res) => {
    try {
        const { userId, channelId } = req.body;

        if (!userId || !channelId) {
            return res.status(400).json({
                success: false,
                message: 'userId and channelId are required',
            });
        }

        logger.info('Getting RTC Token:', { userId, channelId });

        // 这里可以实现自定义Token生成逻辑
        // 或者直接使用startAIAgentInstance返回的token

        res.json({
            success: true,
            message: 'Token generated successfully',
            data: {
                token: 'custom_token_if_needed',
            },
        });

    } catch (error) {
        logger.error('Get RTC Token failed:', error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get RTC token',
        });
    }
});

// ==================== 真人接管相关API ====================

/**
 * 用户请求转人工
 * 触发场景：
 * 1. 用户主动点击"转人工"按钮
 * 2. 关键词触发
 * 3. AI 智能判断建议转人工
 * 4. FastGPT 工作流触发（只传 userId）
 */
app.post('/api/request-human-takeover', async (req, res) => {
    try {
        let {
            instanceId,
            userId,
            channelId,
            reason = 'user_requested', // 'user_requested' | 'ai_suggested' | 'keyword_detected'
            keyword,
            conversationHistory = [],
            source, // 'fastgpt' | 'user_client' | undefined
        } = req.body;

        // ✅ 核心修改：userId 是唯一必需参数
        // 如果缺少 instanceId 或 channelId，尝试从会话中查找
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        // ✅ 如果 instanceId 或 channelId 缺失，通过 userId 查找
        if (!instanceId || !channelId) {
            logger.info('[HumanTakeover] Missing instanceId/channelId, looking up by userId:', userId);

            const existingSession = sessionManager.getSessionByUserId(userId);

            if (existingSession) {
                instanceId = instanceId || existingSession.instanceId;
                channelId = channelId || existingSession.channelId;

                // 如果会话中有对话历史，合并使用
                if (existingSession.conversationHistory && existingSession.conversationHistory.length > 0) {
                    conversationHistory = existingSession.conversationHistory;
                }

                logger.info('[HumanTakeover] Found session for userId:', {
                    userId,
                    instanceId,
                    channelId,
                    historyCount: conversationHistory.length,
                });
            } else {
                logger.warn('[HumanTakeover] No session found for userId:', userId);
                return res.status(400).json({
                    success: false,
                    message: `No active session found for userId: ${userId}. Please ensure the user has an active AI call.`,
                });
            }
        }

        logger.info('[HumanTakeover] User requested human takeover:', {
            instanceId,
            userId,
            reason,
            keyword,
            conversationHistoryCount: conversationHistory?.length || 0,
            source,
        });

        // 生成会话 ID
        const sessionId = uuidv4();

        // 创建会话记录
        const session = {
            sessionId,
            instanceId,
            channelId,
            userId,
            status: 'waiting_human',
            conversationHistory,
            transferReason: reason,
            keyword: keyword || null,
            createdAt: new Date(),
        };

        // 保存到会话管理器
        sessionManager.saveSession(session);

        // ✅ 如果请求来自 FastGPT，通过 WebSocket 通知用户端更新转人工状态
        if (source === 'fastgpt') {
            logger.info(`[HumanTakeover] Request from FastGPT, notifying user client: ${userId}`);

            // 通知用户端：AI 已触发转人工
            io.emit('ai-triggered-transfer', {
                userId,
                sessionId,
                reason: reason,
                message: 'AI 正在为您转接人工客服，请稍候...',
                status: 'waiting_human',
            });
        }

        // 尝试推送给可用客服
        const pushed = pushSessionToAgent(io, session);

        if (pushed) {
            logger.info(`[HumanTakeover] Session ${sessionId} pushed to available agent`);

            return res.json({
                success: true,
                message: '正在为您转接人工客服...',
                data: {
                    sessionId,
                    status: 'waiting_human',
                    queuePosition: 0, // 已分配给客服，不在队列中
                },
            });
        } else {
            // 没有可用客服，加入队列
            const position = queueManager.enqueue(session);
            const waitTime = queueManager.estimateWaitTime(position);

            logger.info(`[HumanTakeover] Session ${sessionId} added to queue, position: ${position}`);

            return res.json({
                success: true,
                message: '当前客服繁忙，请稍候...',
                data: {
                    sessionId,
                    status: 'waiting_human',
                    queuePosition: position,
                    estimatedWaitTime: waitTime, // 秒
                },
            });
        }

    } catch (error) {
        logger.error('[HumanTakeover] Request human takeover failed:', error);

        return res.status(500).json({
            success: false,
            message: error.message || '转人工失败',
            error: CONFIG.env === 'development' ? error.toString() : undefined,
        });
    }
});

/**
 * 客服接听会话
 * 流程：
 * 1. 客服点击"接听"按钮
 * 2. 调用 TakeoverAIAgentCall API
 * 3. 获取 RTC Token
 * 4. 返回给客服端，客服加入 RTC 频道
 * 5. AI 自动退出
 */
app.post('/api/agent-accept-call', async (req, res) => {
    try {
        const {
            sessionId,
            agentId,
            region = CONFIG.aliyun.region,
        } = req.body;

        // 参数验证
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required',
            });
        }

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: 'agentId is required',
            });
        }

        logger.info('[AgentAccept] Agent accepting call:', { sessionId, agentId });

        // 获取会话信息
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (session.status !== 'waiting_human') {
            return res.status(400).json({
                success: false,
                message: `Session status is ${session.status}, cannot accept`,
            });
        }

        // 获取客服信息
        const agent = agentStatusManager.getAgent(agentId);

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found',
            });
        }

        if (agent.status !== 'online') {
            return res.status(400).json({
                success: false,
                message: 'Agent is not available',
            });
        }

        // ====================================================
        // 方案 B：使用独立 RTC 频道替代 TakeoverAIAgentCall
        // 创建新的 RTC 频道供用户和客服直接通话
        // ====================================================

        const humanChannelId = `HUMAN_${sessionId.replace(/-/g, '').substring(0, 24)}`;

        logger.info('[AgentAccept] Creating independent RTC channel:', {
            channelId: humanChannelId,
            userId: session.userId,
            agentRtcUserId: agent.rtcUserId,
        });

        // 为客服生成 RTC Token
        const agentTokenResult = await getRTCToken({
            channelId: humanChannelId,
            userId: agent.rtcUserId,
            region,
        });

        if (!agentTokenResult.success) {
            logger.error('[AgentAccept] Failed to generate agent RTC token:', agentTokenResult);
            return res.status(500).json({
                success: false,
                message: '生成客服 RTC Token 失败',
                errorCode: agentTokenResult.errorCode,
            });
        }

        // 为用户生成 RTC Token
        const userTokenResult = await getRTCToken({
            channelId: humanChannelId,
            userId: session.userId,
            region,
        });

        if (!userTokenResult.success) {
            logger.error('[AgentAccept] Failed to generate user RTC token:', userTokenResult);
            return res.status(500).json({
                success: false,
                message: '生成用户 RTC Token 失败',
                errorCode: userTokenResult.errorCode,
            });
        }

        logger.info('[AgentAccept] Independent RTC channel created successfully:', {
            channelId: humanChannelId,
            agentToken: 'generated',
            userToken: 'generated',
        });

        const takeoverResult = {
            channelId: humanChannelId,
            token: agentTokenResult.rtcAuthToken.token,  // ✅ 使用原始 SHA256 hash，不是 base64Token
            humanAgentUserId: agent.rtcUserId,
            userToken: userTokenResult.rtcAuthToken.token, // ✅ 使用原始 SHA256 hash
            agentNonce: agentTokenResult.rtcAuthToken.nonce,
            userNonce: userTokenResult.rtcAuthToken.nonce,
        };

        // 更新会话状态
        sessionManager.updateSession(sessionId, {
            status: 'human_talking',
            agentId: agentId,
            agentName: agent.name,
            transferredAt: new Date(),
        });

        // 更新客服状态为忙碌
        agentStatusManager.updateStatus(agentId, 'busy', sessionId);

        // 从队列中移除（如果在队列中）
        queueManager.remove(sessionId);

        // 通知用户：客服已接入（方案 B：包含新的 RTC 频道信息）
        notifyUserTakeoverSuccess(io, session.userId, {
            agentId,
            name: agent.name,
        }, {
            channelId: takeoverResult.channelId,
            userToken: takeoverResult.userToken,
            userNonce: takeoverResult.userNonce,           // ✅ 新增：用户端需要的 nonce
            timestamp: userTokenResult.timestamp,          // ✅ 新增：时间戳
            appId: CONFIG.rtc.appId                        // ✅ 新增：RTC AppId
        });

        logger.info('[AgentAccept] Agent successfully accepted call:', {
            sessionId,
            agentId,
        });

        // 返回 RTC 信息给客服端
        return res.json({
            success: true,
            message: '接听成功',
            data: {
                sessionId,
                channelId: takeoverResult.channelId,
                rtcToken: takeoverResult.token,
                rtcUserId: takeoverResult.humanAgentUserId,
                rtcAppId: CONFIG.rtc.appId,       // ✅ RTC AppId，客服端加入频道必需
                rtcTimestamp: agentTokenResult.timestamp, // ✅ Token 有效期时间戳（秒）
                rtcNonce: takeoverResult.agentNonce,      // ✅ nonce，必须与 Token 签名时使用的一致
                conversationHistory: session.conversationHistory,
                userId: session.userId,
            },
        });

    } catch (error) {
        logger.error('[AgentAccept] Agent accept call failed:', error);

        return res.status(500).json({
            success: false,
            message: error.message || '接听失败',
            error: CONFIG.env === 'development' ? error.toString() : undefined,
        });
    }
});

/**
 * 获取会话历史记录
 * 用于客服端查看 AI 与用户的对话历史
 */
app.get('/api/session-history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId is required',
            });
        }

        logger.info('[SessionHistory] Getting session history:', { sessionId });

        // 获取会话信息
        const session = sessionManager.getSession(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        return res.json({
            success: true,
            data: {
                sessionId,
                userId: session.userId,
                status: session.status,
                conversationHistory: session.conversationHistory || [],
                transferReason: session.transferReason,
                keyword: session.keyword,
                createdAt: session.createdAt,
                transferredAt: session.transferredAt,
                agentId: session.agentId,
                agentName: session.agentName,
            },
        });

    } catch (error) {
        logger.error('[SessionHistory] Get session history failed:', error);

        return res.status(500).json({
            success: false,
            message: error.message || '获取会话历史失败',
            error: CONFIG.env === 'development' ? error.toString() : undefined,
        });
    }
});

// ==================== 智能体回调接口 ====================

// 阿里云回调鉴权 Token（从环境变量读取，可在 .env 中配置）
const AGENT_CALLBACK_TOKEN = process.env.AGENT_CALLBACK_TOKEN || '';

/**
 * 阿里云智能体回调接口
 *
 * 官方文档: https://help.aliyun.com/zh/ims/user-guide/agent-callback
 *
 * 回调事件类型:
 * - agent_start: 智能体启动
 * - session_start: 会话开始
 * - agent_stop: 智能体停止
 * - error: 错误
 * - intent_detected: 意图检测
 * - intent_recognized: 意图识别
 * - llm_data_received: LLM数据接收
 * - tts_data_received: TTS数据接收
 * - chat_record: 聊天记录（用户和AI的对话）
 * - audio_record: 音频记录
 * - full_audio_record: 完整音频记录
 * - outbound_call: 外呼
 * - inbound_call: 来电
 * - client_defined_data: 客户端自定义数据
 * - instruction: 指令
 */
app.post('/api/agent-callback', express.json(), (req, res) => {
    try {
        // 验证鉴权 Token（Bearer fixed-token 格式）
        if (AGENT_CALLBACK_TOKEN) {
            const authHeader = req.headers['authorization'] || '';
            const expectedToken = `Bearer ${AGENT_CALLBACK_TOKEN}`;

            if (authHeader !== expectedToken) {
                logger.warn('[AgentCallback] Token verification failed:', {
                    received: authHeader.substring(0, 20) + '...',
                    expected: expectedToken.substring(0, 20) + '...'
                });
                // 暂时不拒绝请求，仅记录警告，便于调试
            }
        }

        // 阿里云回调请求体结构
        // 根据官方文档，instanceId 应该在顶层
        const {
            requestId,
            code,
            message,
            event,
            dialogues,
            data,
            instanceId: topLevelInstanceId,  // 顶层 instanceId
            aiAgentId,
            extenddData  // 注意：阿里云文档中是 extenddData（两个d）
        } = req.body;

        // 尝试从多个位置获取 instanceId
        const instanceId = topLevelInstanceId ||
                          req.body.aiAgentInstanceId ||
                          data?.instanceId ||
                          extenddData?.instanceId;

        logger.info('[AgentCallback] Received:', {
            event,
            requestId,
            code,
            instanceId: instanceId || 'NOT_FOUND',
            aiAgentId,
            dialoguesCount: dialogues?.length
        });

        // ✅ 始终打印完整回调数据用于调试
        logger.info('[AgentCallback] Full body:', JSON.stringify(req.body, null, 2));

        // 处理聊天记录回调（chat_record）
        if (event === 'chat_record' && dialogues && Array.isArray(dialogues)) {
            /**
             * dialogues 数组结构（根据阿里云文档）:
             * {
             *   roundId: string,        // 轮次ID
             *   producer: string,       // 'user' 或 'agent'
             *   text: string,           // 文本内容
             *   reasoningText: string,  // 推理文本（可选，AI思考过程）
             *   time: number,           // 时间戳（毫秒）
             *   source: string,         // 来源 'chat'
             *   dialogueId: string,     // 对话ID
             *   type: string            // 类型 'normal'
             * }
             */

            // 如果有 instanceId，通过 instanceId 匹配会话
            let session = null;
            if (instanceId) {
                session = sessionManager.getSessionByInstanceId(instanceId);
                if (session) {
                    logger.info('[AgentCallback] Found session by instanceId:', {
                        instanceId,
                        sessionId: session.sessionId
                    });
                }
            }

            // 如果没有 instanceId 或找不到会话，尝试用最近活跃的会话
            if (!session) {
                const allSessions = sessionManager.getAllSessions();
                // 找到状态为 'active' 或 'waiting' 的最近会话
                const activeSessions = allSessions.filter(s =>
                    s.status === 'active' || s.status === 'waiting' || s.status === 'ai_talking'
                );
                if (activeSessions.length === 1) {
                    // 如果只有一个活跃会话，直接使用
                    session = activeSessions[0];
                    logger.info('[AgentCallback] Using single active session:', {
                        sessionId: session.sessionId,
                        status: session.status
                    });
                } else if (activeSessions.length > 1) {
                    // 多个活跃会话，使用最新的
                    session = activeSessions.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    )[0];
                    logger.warn('[AgentCallback] Multiple active sessions, using latest:', {
                        sessionId: session.sessionId,
                        totalActive: activeSessions.length
                    });
                }
            }

            if (session) {
                dialogues.forEach(dialogue => {
                    const { producer, text, time, dialogueId, reasoningText } = dialogue;

                    if (!text) return;

                    const chatMessage = {
                        id: dialogueId || uuidv4(),
                        role: producer === 'user' ? 'user' : 'ai',
                        content: text,
                        reasoningText: reasoningText || null,  // 保存 AI 推理过程
                        timestamp: time ? new Date(time).toISOString() : new Date().toISOString()
                    };

                    sessionManager.addMessageToSession(session.sessionId, chatMessage);

                    // 实时推送给客服端
                    io.emit('session-message-update', {
                        sessionId: session.sessionId,
                        message: chatMessage
                    });

                    logger.info('[AgentCallback] Chat record saved:', {
                        sessionId: session.sessionId,
                        producer,
                        textPreview: text.substring(0, 50)
                    });
                });
            } else {
                logger.warn('[AgentCallback] No session found for chat_record:', {
                    instanceId: instanceId || 'NOT_PROVIDED',
                    dialoguesCount: dialogues.length
                });
            }
        }

        // 处理其他事件类型
        switch (event) {
            case 'agent_start':
                logger.info('[AgentCallback] Agent started:', { requestId });
                break;
            case 'session_start':
                logger.info('[AgentCallback] Session started:', { requestId });
                break;
            case 'agent_stop':
                logger.info('[AgentCallback] Agent stopped:', { requestId });
                break;
            case 'error':
                logger.error('[AgentCallback] Error event:', { requestId, code, message });
                break;
            case 'intent_detected':
            case 'intent_recognized':
                logger.info('[AgentCallback] Intent event:', { event, data });
                break;
            default:
                // chat_record 已在上面处理
                if (event !== 'chat_record') {
                    logger.debug('[AgentCallback] Other event:', { event });
                }
        }

        // 返回成功响应（阿里云要求返回 200 和文本）
        return res.status(200).send('Callback received successfully');

    } catch (error) {
        logger.error('[AgentCallback] Error processing callback:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Invalid callback data'
        });
    }
});

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path,
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: CONFIG.env === 'development' ? err.toString() : undefined,
    });
});

// ==================== 启动服务器 ====================

function startServer() {
    try {
        // 配置验证
        if (!CONFIG.aliyun.accessKeyId || !CONFIG.aliyun.accessKeySecret) {
            throw new Error(
                'Missing Aliyun credentials. Please set ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET in .env file'
            );
        }

        if (!CONFIG.agentId) {
            logger.warn('AGENT_ID is not configured. Please set it in .env file');
        }
        if (!CONFIG.rtc.appId || !CONFIG.rtc.appKey) {
            logger.warn('ALIBABA_CLOUD_RTC_APP_ID/ALIBABA_CLOUD_RTC_APP_KEY 未配置, getRtcAuthToken 将不可用');
        }

        // 启动 HTTP 服务器（包含 WebSocket）
        httpServer.listen(CONFIG.port, () => {
            logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    停车场智能客服 API 服务已启动                          ║
║                                                           ║
║    Environment:  ${CONFIG.env.padEnd(42)}║
║    Port:         ${CONFIG.port.toString().padEnd(42)}║
║    Region:       ${CONFIG.aliyun.region.padEnd(42)}║
║    Agent ID:     ${(CONFIG.agentId || 'Not configured').padEnd(42)}║
║                                                           ║
║    API Endpoints:                                         ║
║    - POST /api/start-call                                 ║
║    - POST /api/stop-call                                  ║
║    - POST /api/get-token                                  ║
║    - POST /api/request-human-takeover (新增)              ║
║    - POST /api/agent-accept-call (新增)                   ║
║    - GET  /api/session-history/:sessionId (新增)          ║
║    - GET  /api/health                                     ║
║                                                           ║
║    WebSocket: 已启用                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
            `);

            logger.info(`Server is running at http://localhost:${CONFIG.port}`);
            logger.info(`WebSocket is ready on ws://localhost:${CONFIG.port}`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// 启动
startServer();
