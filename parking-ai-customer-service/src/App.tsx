import React, { useEffect, useState } from 'react';
import { useAICall } from './hooks/useAICall';
import { AICallAgentState } from 'aliyun-auikit-aicall';
import './App.css';
import { v4 as uuidv4 } from 'uuid';

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
      case AICallAgentState.Listening: return 'Listening...';
      case AICallAgentState.Thinking: return 'Thinking...';
      case AICallAgentState.Speaking: return 'Speaking';
      default: return 'Idle';
    }
  };

  const getStatusClass = (state: AICallAgentState) => {
    switch (state) {
      case AICallAgentState.Listening: return 'status-listening';
      case AICallAgentState.Thinking: return 'status-thinking';
      case AICallAgentState.Speaking: return 'status-speaking';
      default: return '';
    }
  };

  return (
    <div className="container">
      {callState === 'idle' || callState === 'ended' ? (
        <div className="call-panel">
          <h1>AI 智能客服</h1>
          <p>点击下方按钮开始通话</p>
          <button className="btn-call" onClick={handleStartCall}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.22-.22.3-.53.24-1.01a18.23 18.23 0 01-.56-3.53.978.978 0 00-.97-.98H4.99a.978.978 0 00-.98.98C4.16 14.39 12.02 22 20.97 22a.978.978 0 00.98-.98v-4.66a.978.978 0 00-.94-.98z"/>
            </svg>
          </button>
          {error && <p style={{color: 'red'}}>{error}</p>}
        </div>
      ) : (
        <div className="call-panel">
          <div className={`status-badge ${getStatusClass(agentState)}`}>
            {getStatusLabel(agentState)}
          </div>

          <div className={`visualizer ${agentState === AICallAgentState.Speaking ? 'speaking' : ''}`}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>

          <div className="subtitle-area">
            {subtitle || (agentState === AICallAgentState.Listening ? "请说话..." : "...")}
          </div>

          {/* 真人接管状态展示 */}
          {humanTakeover.isWaitingHuman && (
            <div className="takeover-status">
              <div className="takeover-notice">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {humanTakeover.queuePosition > 0 ? (
                  <span>
                    正在排队转接人工客服... 前面还有 {humanTakeover.queuePosition} 位用户
                    {humanTakeover.estimatedWaitTime > 0 &&
                      ` (预计等待 ${Math.ceil(humanTakeover.estimatedWaitTime / 60)} 分钟)`
                    }
                  </span>
                ) : (
                  <span>正在为您接通人工客服，请稍候...</span>
                )}
              </div>
            </div>
          )}

          {humanTakeover.isTransferring && (
            <div className="takeover-status">
              <div className="takeover-notice">
                <div className="spinner"></div>
                <span>正在转接...</span>
              </div>
            </div>
          )}

          <div className="control-bar">
            {/* 转人工按钮 */}
            {!humanTakeover.isWaitingHuman && !humanTakeover.isTransferring && (
              <button
                className="btn-transfer"
                onClick={handleTransferToHuman}
                title="转人工客服"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span>转人工</span>
              </button>
            )}

            {/* 挂断按钮 */}
            <button className="btn-hangup" onClick={endCall}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C2.92 9.07 7.24 7.5 12 7.5s9.08 1.57 11.71 4.16c.39.39.39 1.03 0 1.42l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.274 11.274 0 00-2.66-1.85.999.999 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
