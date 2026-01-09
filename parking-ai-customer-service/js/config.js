/**
 * 停车场智能客服配置文件
 * 注意: 生产环境请使用环境变量管理敏感信息
 */

const CONFIG = {
    // 阿里云IMS配置
    aliyun: {
        // 区域配置
        region: 'cn-shanghai', // 可选: cn-beijing, cn-shanghai, cn-hangzhou

        // 智能体配置(需要在阿里云控制台创建后填写)
        agentId: '2abd65e5d91a43979708ca300994bb8b', // 停车智能客服

        // 用户ID前缀
        userIdPrefix: 'parking_user_',
    },

    // API服务器配置
    api: {
        // 后端服务器地址
        baseURL: 'http://localhost:3000/api',

        // 接口端点
        endpoints: {
            startCall: '/start-call',      // 启动通话
            stopCall: '/stop-call',        // 停止通话
            getToken: '/get-token',        // 获取RTC Token
        },

        // 请求超时时间(毫秒)
        timeout: 10000,
    },

    // AI智能体配置
    agent: {
        // 通话类型
        type: 'AUDIO_CALL', // AUDIO_CALL | AVATAR_CALL | VISION_CALL | VIDEO_CALL

        // 欢迎语
        greeting: '您好,我是智能停车助手,我可以帮您查询停车位、缴纳停车费、办理月卡等业务。请问有什么可以帮您的吗?',

        // 智能断句
        enableIntelligentSegment: true,

        // 打断配置
        interruptConfig: {
            enableVoiceInterrupt: true,      // 启用语音打断
            interruptWords: ['停止', '等一下', '慢点'], // 打断关键词
        },

        // 音量配置(0-100)
        volume: 80,

        // 用户在线超时时间(秒)
        userOnlineTimeout: 60,

        // 智能体最大空闲时间(秒)
        agentMaxIdleTime: 600,
    },

    // RTC配置
    rtc: {
        // 是否静音麦克风
        muteMicrophone: false,

        // 是否启用按下说话模式
        enablePushToTalk: false,

        // 音频设置
        audioConfig: {
            echoCancellation: true,      // 回声消除
            noiseSuppression: true,      // 噪音抑制
            autoGainControl: true,       // 自动增益控制
        },
    },

    // UI配置
    ui: {
        // 显示实时字幕
        showSubtitles: true,

        // 显示通话时长
        showDuration: true,

        // Toast提示持续时间(毫秒)
        toastDuration: 3000,

        // AI状态标签
        agentStateLabels: {
            LISTENING: { icon: '👂', text: '倾听中...' },
            THINKING: { icon: '🤔', text: '思考中...' },
            SPEAKING: { icon: '💬', text: '回复中...' },
        },
    },

    // 停车场业务配置
    business: {
        // 常见问题
        faq: [
            {
                id: 1,
                question: '停车费用怎么算',
                query: '请问停车费用是如何计算的?有什么优惠吗?',
            },
            {
                id: 2,
                question: '如何办理月卡',
                query: '我想办理停车月卡,请问需要什么资料和手续?',
            },
            {
                id: 3,
                question: '停车位查询',
                query: '现在还有空余的停车位吗?哪个区域比较多?',
            },
            {
                id: 4,
                question: '发票申请',
                query: '我需要开具停车费发票,怎么操作?',
            },
        ],

        // 热词配置(提高识别准确率)
        hotWords: [
            '停车费', '月卡', '包月', '充值',
            '车位', '车牌', '发票', '缴费',
            '办理', '查询', '退款', '投诉',
        ],
    },

    // 日志配置
    logging: {
        // 是否启用日志
        enabled: true,

        // 日志级别: debug | info | warn | error
        level: 'info',

        // 是否输出到控制台
        console: true,
    },

    // 调试模式
    debug: {
        // 是否启用调试模式
        enabled: false,

        // 模拟通话(不实际连接AI,用于UI测试)
        mockCall: false,

        // 显示详细错误信息
        verboseError: true,
    },
};

// 生成唯一用户ID
CONFIG.generateUserId = function() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${this.aliyun.userIdPrefix}${timestamp}_${random}`;
};

// 验证配置
CONFIG.validate = function() {
    const errors = [];

    if (this.aliyun.agentId === 'YOUR_AGENT_ID') {
        errors.push('请在config.js中配置您的AgentId');
    }

    if (!this.api.baseURL) {
        errors.push('请配置API服务器地址');
    }

    return {
        valid: errors.length === 0,
        errors: errors,
    };
};

// 获取配置值
CONFIG.get = function(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return defaultValue;
        }
    }

    return value;
};

// 日志工具
CONFIG.logger = {
    debug(...args) {
        if (CONFIG.logging.enabled && CONFIG.logging.level === 'debug' && CONFIG.logging.console) {
            console.log('[DEBUG]', ...args);
        }
    },

    info(...args) {
        if (CONFIG.logging.enabled && ['debug', 'info'].includes(CONFIG.logging.level) && CONFIG.logging.console) {
            console.info('[INFO]', ...args);
        }
    },

    warn(...args) {
        if (CONFIG.logging.enabled && ['debug', 'info', 'warn'].includes(CONFIG.logging.level) && CONFIG.logging.console) {
            console.warn('[WARN]', ...args);
        }
    },

    error(...args) {
        if (CONFIG.logging.enabled && CONFIG.logging.console) {
            console.error('[ERROR]', ...args);
        }
    },
};

// 导出配置(兼容不同模块系统)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
