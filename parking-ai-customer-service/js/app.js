/**
 * 停车场智能客服主应用
 * 基于阿里云AI-RTC SDK实现实时语音通话功能
 */

class ParkingAIApp {
    constructor() {
        this.config = window.CONFIG;
        this.logger = this.config.logger;
        this.api = null;
        this.engine = null;
        this.callState = {
            isInCall: false,
            isMuted: false,
            startTime: null,
            instanceId: null,
            userId: null,
            durationTimer: null,
        };

        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            this.logger.info('Initializing Parking AI App...');

            // 验证配置
            const validation = this.config.validate();
            if (!validation.valid) {
                this.showToast(validation.errors.join('; '), 'error');
                this.logger.error('Configuration Validation Failed:', validation.errors);
                return;
            }

            // 初始化API客户端
            this.api = this.config.debug.mockCall
                ? new window.MockAPI(this.config)
                : new window.API(this.config);

            // 检查服务器健康状态
            if (!this.config.debug.mockCall) {
                const isHealthy = await this.api.healthCheck();
                if (!isHealthy) {
                    this.showToast('无法连接到服务器,请稍后重试', 'error');
                    this.updateStatusBadge('offline', '离线');
                    return;
                }
            }

            // 初始化SDK引擎
            this.initEngine();

            // 绑定UI事件
            this.bindEvents();

            // 更新状态
            this.updateStatusBadge('online', '就绪');

            this.logger.info('App initialized successfully');

        } catch (error) {
            this.logger.error('App initialization failed:', error);
            this.showToast('应用初始化失败', 'error');
        }
    }

    /**
     * 初始化AI-RTC引擎
     */
    initEngine() {
        try {
            // 检查SDK是否加载 - 支持多种SDK版本
            const SDKClass = window.ARTCAICallUI || window.AICallEngine || window.ARTCAICallEngine;

            if (typeof SDKClass === 'undefined') {
                if (this.config.debug.mockCall) {
                    this.logger.warn('AI-RTC SDK not loaded, but running in mock mode');
                    this.engine = {
                        init: async () => {},
                        call: async () => {},
                        handup: async () => {},
                        on: () => {},
                    };
                    return;
            }
                throw new Error('AI-RTC SDK未加载 (window.ARTCAICallUI/AICallEngine undefined). 请检查网络连接或确认CDN地址有效。');
            }

            // 创建引擎实例
            this.engine = SDKClass;
            this.SDKClass = SDKClass;

            this.logger.info('AI-RTC Engine initialized', { SDK: SDKClass.name });

        } catch (error) {
            this.logger.error('Failed to initialize engine:', error);
            throw error;
        }
    }

    /**
     * 注册引擎事件监听
     */
    registerEngineEvents() {
        // 错误事件
        this.engine.on('errorOccurred', (code) => {
            this.logger.error('Engine Error:', code);
            this.showToast(`发生错误: ${code}`, 'error');
            this.handleCallEnd();
        });

        // 通话开始
        this.engine.on('callBegin', () => {
            this.logger.info('Call Begin');
            this.callState.isInCall = true;
            this.callState.startTime = Date.now();
            this.startDurationTimer();
            this.updateStatusBadge('calling', '通话中');
        });

        // 通话结束
        this.engine.on('callEnd', () => {
            this.logger.info('Call End');
            this.handleCallEnd();
        });

        // AI状态变化
        this.engine.on('agentStateChanged', (state) => {
            this.logger.debug('Agent State Changed:', state);
            this.updateAgentStatus(state);
        });

        // 用户字幕
        this.engine.on('userSubtitleNotify', (subtitle) => {
            this.logger.debug('User Subtitle:', subtitle);
            this.updateUserSubtitle(subtitle.text, subtitle.isSentenceEnd);
        });

        // AI字幕
        this.engine.on('agentSubtitleNotify', (subtitle) => {
            this.logger.debug('Agent Subtitle:', subtitle);
            this.updateAgentSubtitle(subtitle.text, subtitle.isSentenceEnd);
        });

        // 音色变化
        this.engine.on('voiceIdChanged', (voiceId) => {
            this.logger.info('Voice ID Changed:', voiceId);
        });

        // 打断状态变化
        this.engine.on('voiceInterruptChanged', (enabled) => {
            this.logger.info('Voice Interrupt Changed:', enabled);
        });
    }

    /**
     * 绑定UI事件
     */
    bindEvents() {
        // 开始通话按钮
        const startCallBtn = document.getElementById('startCallBtn');
        startCallBtn?.addEventListener('click', () => this.handleStartCall());

        // 挂断按钮
        const hangupBtn = document.getElementById('hangupBtn');
        hangupBtn?.addEventListener('click', () => this.handleHangup());

        // 静音按钮
        const muteBtn = document.getElementById('muteBtn');
        muteBtn?.addEventListener('click', () => this.handleToggleMute());

        // 打断按钮
        const interruptBtn = document.getElementById('interruptBtn');
        interruptBtn?.addEventListener('click', () => this.handleInterrupt());

        // 快捷问题按钮
        const quickBtns = document.querySelectorAll('.quick-btn');
        quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                this.handleQuickQuery(query);
            });
        });

        this.logger.info('UI events bound');
    }

    /**
     * 处理开始通话
     */
    async handleStartCall() {
        try {
            this.showLoading('正在连接智能助手...');

            // 生成用户ID
            const userId = this.config.generateUserId();
            this.callState.userId = userId;

            // 调用后端API启动通话
            const callConfig = await this.api.startCall(userId);
            this.callState.instanceId = callConfig.instanceId;

            this.logger.info('Call Config:', callConfig);

            // 配置SDK引擎
            const engineConfig = {
                agentId: callConfig.agentId,
                agentType: this.config.agent.type,
                userId: callConfig.userId,
                region: this.config.aliyun.region,
                userJoinToken: callConfig.rtcJoinToken,
                channelId: callConfig.rtcChannelId,
                muteMicrophone: this.config.rtc.muteMicrophone,
                enablePushToTalk: this.config.rtc.enablePushToTalk,
            };

            // 初始化引擎(如果需要)
            await this.engine.init(this.config.agent.type);

            // 发起通话
            await this.engine.call(
                engineConfig.userId,
                {
                    agentId: engineConfig.agentId,
                    type: engineConfig.agentType,
                    instanceId: this.callState.instanceId,
                    channelConfig: {
                        channelId: engineConfig.channelId,
                        joinToken: engineConfig.userJoinToken,
                    },
                },
                {
                    muteMicrophone: engineConfig.muteMicrophone,
                    enablePushToTalk: engineConfig.enablePushToTalk,
                }
            );

            // 切换UI
            this.switchToCallInterface();
            this.hideLoading();

            this.logger.info('Call started successfully');

        } catch (error) {
            this.logger.error('Start call failed:', error);
            this.hideLoading();
            this.showToast('连接失败,请重试', 'error');
        }
    }

    /**
     * 处理挂断通话
     */
    async handleHangup() {
        try {
            this.showLoading('正在结束通话...');

            // 挂断SDK引擎
            await this.engine.handup();

            // 调用后端API停止通话
            if (this.callState.instanceId) {
                await this.api.stopCall(this.callState.instanceId);
            }

            this.handleCallEnd();
            this.hideLoading();

            this.logger.info('Call ended successfully');

        } catch (error) {
            this.logger.error('Hangup failed:', error);
            this.hideLoading();
            this.handleCallEnd();
        }
    }

    /**
     * 处理通话结束
     */
    handleCallEnd() {
        this.callState.isInCall = false;
        this.callState.startTime = null;
        this.callState.instanceId = null;
        this.stopDurationTimer();
        this.switchToWelcomeCard();
        this.updateStatusBadge('online', '就绪');
        this.resetSubtitles();
    }

    /**
     * 处理静音切换
     */
    async handleToggleMute() {
        try {
            const muteBtn = document.getElementById('muteBtn');
            this.callState.isMuted = !this.callState.isMuted;

            // SDK静音控制(假设SDK提供此方法)
            if (this.engine.setMicrophoneMuted) {
                await this.engine.setMicrophoneMuted(this.callState.isMuted);
            }

            // 更新UI
            if (this.callState.isMuted) {
                muteBtn?.classList.add('muted');
            } else {
                muteBtn?.classList.remove('muted');
            }

            this.logger.info('Microphone muted:', this.callState.isMuted);

        } catch (error) {
            this.logger.error('Toggle mute failed:', error);
        }
    }

    /**
     * 处理打断AI
     */
    async handleInterrupt() {
        try {
            await this.engine.interruptAgentResponse();
            this.showToast('已打断', 'success');
            this.logger.info('Agent interrupted');

        } catch (error) {
            this.logger.error('Interrupt failed:', error);
            this.showToast('打断失败', 'error');
        }
    }

    /**
     * 处理快捷问题
     */
    async handleQuickQuery(query) {
        if (!this.callState.isInCall) {
            // 如果未在通话中,先开始通话
            await this.handleStartCall();
            // 等待通话建立后再发送问题(这里简化处理)
            setTimeout(() => {
                this.showToast(`问题: ${query}`, 'info');
            }, 2000);
        } else {
            this.showToast(`问题: ${query}`, 'info');
        }

        this.logger.info('Quick query:', query);
    }

    /**
     * 更新AI状态
     */
    updateAgentStatus(state) {
        const agentStatus = document.getElementById('agentStatus');
        const avatarContainer = document.querySelector('.avatar-container');

        if (!agentStatus) return;

        const labels = this.config.ui.agentStateLabels[state] || {
            icon: '🤖',
            text: '工作中...',
        };

        agentStatus.querySelector('.status-icon').textContent = labels.icon;
        agentStatus.querySelector('.status-label').textContent = labels.text;

        // 说话时显示声波动画
        if (state === 'SPEAKING') {
            avatarContainer?.classList.add('speaking');
        } else {
            avatarContainer?.classList.remove('speaking');
        }
    }

    /**
     * 更新用户字幕
     */
    updateUserSubtitle(text, isSentenceEnd) {
        const userSubtitle = document.getElementById('userSubtitle');
        if (!userSubtitle) return;

        const placeholder = userSubtitle.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        if (isSentenceEnd) {
            // 句子结束,添加新段落
            const p = document.createElement('p');
            p.textContent = text;
            userSubtitle.appendChild(p);
        } else {
            // 更新最后一段
            let lastP = userSubtitle.querySelector('p:last-child');
            if (!lastP) {
                lastP = document.createElement('p');
                userSubtitle.appendChild(lastP);
            }
            lastP.textContent = text;
        }

        // 滚动到底部
        userSubtitle.scrollTop = userSubtitle.scrollHeight;
    }

    /**
     * 更新AI字幕
     */
    updateAgentSubtitle(text, isSentenceEnd) {
        const agentSubtitle = document.getElementById('agentSubtitle');
        if (!agentSubtitle) return;

        const placeholder = agentSubtitle.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        if (isSentenceEnd) {
            const p = document.createElement('p');
            p.textContent = text;
            agentSubtitle.appendChild(p);
        } else {
            let lastP = agentSubtitle.querySelector('p:last-child');
            if (!lastP) {
                lastP = document.createElement('p');
                agentSubtitle.appendChild(lastP);
            }
            lastP.textContent = text;
        }

        agentSubtitle.scrollTop = agentSubtitle.scrollHeight;
    }

    /**
     * 重置字幕
     */
    resetSubtitles() {
        const userSubtitle = document.getElementById('userSubtitle');
        const agentSubtitle = document.getElementById('agentSubtitle');

        if (userSubtitle) {
            userSubtitle.innerHTML = '<p class="placeholder">等待您的语音输入...</p>';
        }

        if (agentSubtitle) {
            agentSubtitle.innerHTML = '<p class="placeholder">等待AI回复...</p>';
        }
    }

    /**
     * 开始通话时长计时
     */
    startDurationTimer() {
        const durationEl = document.getElementById('callDuration');
        if (!durationEl) return;

        this.callState.durationTimer = setInterval(() => {
            if (!this.callState.startTime) return;

            const elapsed = Math.floor((Date.now() - this.callState.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');

            durationEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    /**
     * 停止计时
     */
    stopDurationTimer() {
        if (this.callState.durationTimer) {
            clearInterval(this.callState.durationTimer);
            this.callState.durationTimer = null;
        }

        const durationEl = document.getElementById('callDuration');
        if (durationEl) {
            durationEl.textContent = '00:00';
        }
    }

    /**
     * 切换到通话界面
     */
    switchToCallInterface() {
        const welcomeCard = document.getElementById('welcomeCard');
        const callInterface = document.getElementById('callInterface');

        welcomeCard?.classList.add('hidden');
        callInterface?.classList.remove('hidden');
    }

    /**
     * 切换到欢迎卡片
     */
    switchToWelcomeCard() {
        const welcomeCard = document.getElementById('welcomeCard');
        const callInterface = document.getElementById('callInterface');

        callInterface?.classList.add('hidden');
        welcomeCard?.classList.remove('hidden');
    }

    /**
     * 更新状态徽章
     */
    updateStatusBadge(status, text) {
        const statusBadge = document.getElementById('statusBadge');
        if (!statusBadge) return;

        const statusDot = statusBadge.querySelector('.status-dot');
        const statusText = statusBadge.querySelector('.status-text');

        if (statusText) {
            statusText.textContent = text;
        }

        if (statusDot) {
            statusDot.style.background = {
                'online': 'var(--success-color)',
                'calling': 'var(--warning-color)',
                'offline': 'var(--error-color)',
            }[status] || 'var(--text-secondary)';
        }
    }

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = 'toast show';

        setTimeout(() => {
            toast.classList.remove('show');
        }, this.config.ui.toastDuration);
    }

    /**
     * 显示加载遮罩
     */
    showLoading(message = '加载中...') {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        const text = overlay.querySelector('p');
        if (text) {
            text.textContent = message;
        }

        overlay.classList.remove('hidden');
    }

    /**
     * 隐藏加载遮罩
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;

        overlay.classList.add('hidden');
    }
}

// DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.parkingApp = new ParkingAIApp();
    });
} else {
    window.parkingApp = new ParkingAIApp();
}
