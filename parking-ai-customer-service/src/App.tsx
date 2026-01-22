import { useState } from 'react';
import { useAICall } from './hooks/useAICall';
import { AICallAgentState } from 'aliyun-auikit-aicall';
import './App.css';
import { v4 as uuidv4 } from 'uuid';
import logoImg from './assets/logo.png';

// SVG 图标组件
const CoinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12M9 9h6M9 15h6"/>
  </svg>
);

const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);

const CarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 17h14v-5l-2-4H7L5 12v5z"/>
    <circle cx="7.5" cy="17.5" r="1.5"/>
    <circle cx="16.5" cy="17.5" r="1.5"/>
  </svg>
);

const ReceiptIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// i车位 Logo 组件 - 使用真实 logo 图片
const IparkingLogo = () => (
  <img src={logoImg} alt="i车位" width="28" height="28" style={{ borderRadius: '6px' }} />
);

// AI 助手头像组件 - 使用真实 logo 图片
const AIAvatarIcon = () => (
  <img src={logoImg} alt="小i" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
);
);

function App() {
  const {
    startCall,
    endCall,
    callState,
    agentState,
    subtitle,
    error,
    // 真人接管相关
    requestHumanTakeover,
    humanTakeover,
  } = useAICall();

  const [userId] = useState(uuidv4());

  const handleTransferToHuman = () => {
    requestHumanTakeover('user_requested');
  };

  const handleStartCall = () => {
    startCall(userId);
  };

  const getStatusLabel = (state: AICallAgentState) => {
    switch (state) {
      case AICallAgentState.Listening: return '正在聆听...';
      case AICallAgentState.Thinking: return '思考中...';
      case AICallAgentState.Speaking: return '正在回复';
      default: return '待机中';
    }
  };

  const getStatusClass = (state: AICallAgentState) => {
    switch (state) {
      case AICallAgentState.Listening: return 'status-listening';
      case AICallAgentState.Thinking: return 'status-thinking';
      case AICallAgentState.Speaking: return 'status-speaking';
      default: return 'status-idle';
    }
  };

  const isInCall = callState !== 'idle' && callState !== 'ended';

  return (
    <div className="app-container">
      {/* 动态背景装饰 */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* 顶部品牌标识 */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon"><IparkingLogo /></div>
          <div className="brand-text">
            <span className="brand-name">i车位</span>
            <span className="brand-sub">AI 客服助手</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="main-content">
        {!isInCall ? (
          /* 待机界面 */
          <div className="idle-panel">
            <div className="ai-avatar idle">
              <div className="avatar-core">
                <AIAvatarIcon />
              </div>
              <div className="avatar-ring ring-1"></div>
              <div className="avatar-ring ring-2"></div>
              <div className="avatar-ring ring-3"></div>
            </div>

            <h1 className="title">您好，我是小i</h1>
            <p className="subtitle-text">您的i车位智能助手，随时为您服务</p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon"><CoinIcon /></span>
                <span>查询停车费用</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><CardIcon /></span>
                <span>办理月卡优惠</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><CarIcon /></span>
                <span>出入场问题</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon"><ReceiptIcon /></span>
                <span>开具发票</span>
              </div>
            </div>

            <button className="btn-start" onClick={handleStartCall}>
              <div className="btn-start-content">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.22-.22.3-.53.24-1.01a18.23 18.23 0 01-.56-3.53.978.978 0 00-.97-.98H4.99a.978.978 0 00-.98.98C4.16 14.39 12.02 22 20.97 22a.978.978 0 00.98-.98v-4.66a.978.978 0 00-.94-.98z"/>
                </svg>
                <span>开始通话</span>
              </div>
              <div className="btn-glow"></div>
            </button>

            {error && (
              <div className="error-toast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          /* 通话中界面 */
          <div className="call-panel">
            {/* AI 头像动画区域 */}
            <div className={`ai-avatar ${getStatusClass(agentState)}`}>
              <div className="avatar-core">
                {agentState === AICallAgentState.Speaking ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                ) : agentState === AICallAgentState.Thinking ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    <circle cx="8" cy="12" r="1.5"/>
                    <circle cx="12" cy="12" r="1.5"/>
                    <circle cx="16" cy="12" r="1.5"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2.66 0 1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2-.66 0-1.2-.54-1.2-1.2V4.9zm6.5 6.1c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                  </svg>
                )}
              </div>
              <div className="avatar-ring ring-1"></div>
              <div className="avatar-ring ring-2"></div>
              <div className="avatar-ring ring-3"></div>
              <div className="avatar-pulse"></div>
            </div>

            {/* 状态徽章 */}
            <div className={`status-badge ${getStatusClass(agentState)}`}>
              <div className="status-dot"></div>
              <span>{getStatusLabel(agentState)}</span>
            </div>

            {/* 波形可视化 */}
            <div className={`visualizer ${agentState === AICallAgentState.Speaking ? 'speaking' : ''}`}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>

            {/* 字幕区域 */}
            <div className="subtitle-card">
              <div className="subtitle-content">
                {subtitle || (agentState === AICallAgentState.Listening ? "请说话，我在听..." : "...")}
              </div>
            </div>

            {/* 转人工排队状态 */}
            {humanTakeover.isWaitingHuman && (
              <div className="takeover-card">
                <div className="takeover-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div className="takeover-info">
                  {humanTakeover.queuePosition > 0 ? (
                    <>
                      <span className="takeover-title">正在排队中</span>
                      <span className="takeover-detail">
                        前面还有 <strong>{humanTakeover.queuePosition}</strong> 位用户
                        {humanTakeover.estimatedWaitTime > 0 && (
                          <> · 预计 {Math.ceil(humanTakeover.estimatedWaitTime / 60)} 分钟</>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="takeover-title">正在接通</span>
                      <span className="takeover-detail">人工客服即将为您服务</span>
                    </>
                  )}
                </div>
                <div className="takeover-progress">
                  <div className="progress-bar"></div>
                </div>
              </div>
            )}

            {/* 转接中状态 */}
            {humanTakeover.isTransferring && (
              <div className="takeover-card transferring">
                <div className="transfer-spinner"></div>
                <div className="takeover-info">
                  <span className="takeover-title">正在转接</span>
                  <span className="takeover-detail">请稍候...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部控制栏 - 通话中显示 */}
      {isInCall && (
        <footer className="control-bar">
          <div className="control-bar-inner">
            {/* 转人工按钮 */}
            {!humanTakeover.isWaitingHuman && !humanTakeover.isTransferring && (
              <button className="btn-control btn-transfer" onClick={handleTransferToHuman}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>转人工</span>
              </button>
            )}

            {/* 挂断按钮 */}
            <button className="btn-control btn-hangup" onClick={endCall}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C2.92 9.07 7.24 7.5 12 7.5s9.08 1.57 11.71 4.16c.39.39.39 1.03 0 1.42l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.274 11.274 0 00-2.66-1.85.999.999 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              <span>挂断</span>
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
