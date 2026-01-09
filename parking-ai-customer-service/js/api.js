/**
 * API接口封装
 * 负责与后端服务器通信,获取RTC Token和管理AI智能体实例
 */

class API {
    constructor(config) {
        this.config = config;
        this.baseURL = config.api.baseURL;
        this.timeout = config.api.timeout;
        this.logger = config.logger;
    }

    /**
     * HTTP请求封装
     * @param {string} url - 请求URL
     * @param {object} options - 请求选项
     * @returns {Promise<any>} 响应数据
     */
    async request(url, options = {}) {
        const {
            method = 'GET',
            headers = {},
            body = null,
            timeout = this.timeout,
        } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const fetchOptions = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                signal: controller.signal,
            };

            if (body && method !== 'GET') {
                fetchOptions.body = JSON.stringify(body);
            }

            this.logger.debug('API Request:', { url, method, body });

            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.logger.debug('API Response:', data);

            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('请求超时,请检查网络连接');
            }

            this.logger.error('API Request Failed:', error);
            throw error;
        }
    }

    /**
     * 启动AI智能体通话
     * @param {string} userId - 用户ID
     * @param {string} instanceId - 会话实例ID(可选)
     * @returns {Promise<object>} 通话配置信息
     */
    async startCall(userId, instanceId = null) {
        try {
            const endpoint = this.baseURL + this.config.api.endpoints.startCall;

            const requestBody = {
                userId: userId,
                instanceId: instanceId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                agentId: this.config.aliyun.agentId,
                region: this.config.aliyun.region,
                type: this.config.agent.type,
                greeting: this.config.agent.greeting,
                enableIntelligentSegment: this.config.agent.enableIntelligentSegment,
                config: {
                    volume: this.config.agent.volume,
                    userOnlineTimeout: this.config.agent.userOnlineTimeout,
                    agentMaxIdleTime: this.config.agent.agentMaxIdleTime,
                },
            };

            this.logger.info('Starting AI Call:', requestBody);

            const response = await this.request(endpoint, {
                method: 'POST',
                body: requestBody,
            });

            if (!response.success) {
                throw new Error(response.message || '启动通话失败');
            }

            return {
                instanceId: response.data.instanceId,
                rtcChannelId: response.data.rtcChannelId,
                rtcJoinToken: response.data.rtcJoinToken,
                userId: userId,
                agentId: this.config.aliyun.agentId,
            };

        } catch (error) {
            this.logger.error('Start Call Failed:', error);
            throw error;
        }
    }

    /**
     * 停止AI智能体通话
     * @param {string} instanceId - 会话实例ID
     * @returns {Promise<object>} 停止结果
     */
    async stopCall(instanceId) {
        try {
            const endpoint = this.baseURL + this.config.api.endpoints.stopCall;

            this.logger.info('Stopping AI Call:', instanceId);

            const response = await this.request(endpoint, {
                method: 'POST',
                body: { instanceId },
            });

            if (!response.success) {
                throw new Error(response.message || '停止通话失败');
            }

            return response.data;

        } catch (error) {
            this.logger.error('Stop Call Failed:', error);
            throw error;
        }
    }

    /**
     * 获取RTC Token
     * @param {string} userId - 用户ID
     * @param {string} channelId - 频道ID
     * @returns {Promise<string>} RTC Token
     */
    async getRTCToken(userId, channelId) {
        try {
            const endpoint = this.baseURL + this.config.api.endpoints.getToken;

            this.logger.info('Getting RTC Token:', { userId, channelId });

            const response = await this.request(endpoint, {
                method: 'POST',
                body: { userId, channelId },
            });

            if (!response.success) {
                throw new Error(response.message || '获取Token失败');
            }

            return response.data.token;

        } catch (error) {
            this.logger.error('Get RTC Token Failed:', error);
            throw error;
        }
    }

    /**
     * 健康检查
     * @returns {Promise<boolean>} 服务器是否正常
     */
    async healthCheck() {
        try {
            const endpoint = this.baseURL + '/health';

            const response = await this.request(endpoint, {
                method: 'GET',
                timeout: 5000,
            });

            return response.success === true;

        } catch (error) {
            this.logger.warn('Health Check Failed:', error);
            return false;
        }
    }
}

/**
 * Mock API (用于开发调试)
 * 当后端服务未就绪时,使用模拟数据进行前端开发
 */
class MockAPI extends API {
    async startCall(userId, instanceId = null) {
        this.logger.warn('Using Mock API for startCall');

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            instanceId: instanceId || `mock_session_${Date.now()}`,
            rtcChannelId: `mock_channel_${Math.random().toString(36).substring(7)}`,
            rtcJoinToken: `mock_token_${Math.random().toString(36).substring(7)}`,
            userId: userId,
            agentId: this.config.aliyun.agentId,
        };
    }

    async stopCall(instanceId) {
        this.logger.warn('Using Mock API for stopCall');

        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            message: '通话已结束',
        };
    }

    async getRTCToken(userId, channelId) {
        this.logger.warn('Using Mock API for getRTCToken');

        await new Promise(resolve => setTimeout(resolve, 500));

        return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    async healthCheck() {
        return true;
    }
}

// 导出API类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, MockAPI };
} else {
    window.API = API;
    window.MockAPI = MockAPI;
}
