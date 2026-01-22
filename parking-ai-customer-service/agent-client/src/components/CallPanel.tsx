import { useState, useEffect } from 'react';
import type { ConversationMessage, TakeoverAcceptResponse } from '../types';
import {
  MicrophoneIcon,
  MicOffIcon,
  SatelliteIcon,
  MessageSquareIcon,
  UserIcon,
  BotIcon,
  CheckCircleIcon,
  LoaderIcon,
  CircleIcon
} from './Icons';

interface CallPanelProps {
  activeCall: TakeoverAcceptResponse | null;
  history: ConversationMessage[];
  isMuted: boolean;
  rtcStatus: string;
  onHangup: () => void;
  onToggleMute: () => void;
}

export const CallPanel = ({
  activeCall,
  history,
  isMuted,
  rtcStatus,
  onHangup,
  onToggleMute
}: CallPanelProps) => {
  const [callDuration, setCallDuration] = useState(0);

  // 通话计时器
  useEffect(() => {
    if (!activeCall || rtcStatus !== 'joined') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall, rtcStatus]);

  // 格式化时长（秒 -> mm:ss）
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取 RTC 状态样式
  const getRtcStatusClass = () => {
    if (rtcStatus === 'joined') return 'connected';
    if (rtcStatus === 'joining' || rtcStatus === 'connecting') return 'connecting';
    return 'disconnected';
  };

  const getRtcStatusIcon = () => {
    switch (rtcStatus) {
      case 'joined': return <CheckCircleIcon size="sm" className="status-icon" />;
      case 'joining':
      case 'connecting': return <LoaderIcon size="sm" className="status-icon" />;
      default: return <CircleIcon size="sm" className="status-icon" />;
    }
  };

  const getRtcStatusLabel = () => {
    switch (rtcStatus) {
      case 'joined': return '已连接';
      case 'joining':
      case 'connecting': return '连接中...';
      case 'idle': return '待机';
      default: return rtcStatus;
    }
  };

  // 空状态
  if (!activeCall) {
    return (
      <div className="call-panel">
        <div className="call-header">
          <div className="call-title">
            <span className="call-title-icon"><MicrophoneIcon size="md" /></span>
            <span>当前通话</span>
          </div>
        </div>
        <div className="call-empty">
          <div className="call-empty-icon"><SatelliteIcon size="xl" /></div>
          <h3 className="call-empty-title">等待接入会话</h3>
          <p className="call-empty-text">从左侧列表中选择一个会话进行接入</p>
        </div>
      </div>
    );
  }

  return (
    <div className="call-panel">
      {/* 通话头部 */}
      <div className="call-header">
        <div className="call-title">
          <span className="call-title-icon"><MicrophoneIcon size="md" /></span>
          <span>通话中</span>
        </div>
        <div className={`rtc-status ${getRtcStatusClass()}`}>
          {getRtcStatusIcon()}
          <span>{getRtcStatusLabel()}</span>
        </div>
      </div>

      {/* 会话信息 */}
      <div className="call-info">
        <div className="call-info-grid">
          <div className="info-item">
            <span className="info-label">会话 ID</span>
            <span className="info-value">{activeCall.sessionId.substring(0, 12)}...</span>
          </div>
          <div className="info-item">
            <span className="info-label">用户 ID</span>
            <span className="info-value">{activeCall.userId.substring(0, 12)}...</span>
          </div>
          <div className="info-item">
            <span className="info-label">频道 ID</span>
            <span className="info-value">{activeCall.channelId?.substring(0, 12) || '--'}...</span>
          </div>
        </div>
      </div>

      {/* LED 风格计时器 */}
      <div className="call-timer">
        <div className="timer-label">通话时长</div>
        <div className="timer-display">{formatDuration(callDuration)}</div>
      </div>

      {/* 对话历史 */}
      <div className="call-history">
        <div className="history-header">
          <div className="history-title">
            <MessageSquareIcon size="sm" />
            <span>对话记录 ({history.length}条)</span>
          </div>
        </div>
        <div className="history-scroll">
          {history.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">暂无对话记录</p>
            </div>
          ) : (
            history.map(message => (
              <div
                key={message.id}
                className={`message-bubble ${message.role}`}
              >
                <div className="message-role">
                  {message.role === 'user' ? (
                    <><UserIcon size="xs" /> 用户</>
                  ) : (
                    <><BotIcon size="xs" /> AI</>
                  )}
                </div>
                {message.content}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 通话控制按钮 */}
      <div className="call-controls">
        <button
          type="button"
          className={`btn btn-mute ${isMuted ? 'muted' : ''}`}
          onClick={onToggleMute}
          disabled={rtcStatus !== 'joined'}
        >
          {isMuted ? (
            <>
              <MicOffIcon size="md" />
              取消静音
            </>
          ) : (
            <>
              <MicrophoneIcon size="md" />
              静音
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-hangup"
          onClick={onHangup}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 010-1.41C2.92 9.07 7.24 7.5 12 7.5s9.08 1.57 11.71 4.16c.39.39.39 1.03 0 1.42l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.274 11.274 0 00-2.66-1.85.999.999 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
          </svg>
          挂断
        </button>
      </div>
    </div>
  );
};
