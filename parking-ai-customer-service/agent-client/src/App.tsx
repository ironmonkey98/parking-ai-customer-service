import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Dashboard } from './components/Dashboard';
import { SessionList } from './components/SessionList';
import { CallPanel } from './components/CallPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useRTCCall } from './hooks/useRTCCall';
import type { ConversationMessage } from './types';
import {
  AlertIcon,
  ClipboardListIcon,
  ChartBarIcon,
  HourglassIcon,
  TimerIcon,
  BroadcastIcon
} from './components/Icons';

function App() {
  const [agentId, setAgentId] = useState('agent-001');
  const [agentName, setAgentName] = useState('客服1');
  const [history, setHistory] = useState<ConversationMessage[]>([]);

  const {
    connected,
    agentInfo,
    statusLabel,
    agentStatus,
    pendingSessions,
    events,
    lastEndedSessionId,
    connectAgent,
    disconnect,
    updateStatus,
    acceptSession,
    rejectSession,
    hangupSession,
  } = useWebSocket();

  const {
    activeCall,
    loading,
    error,
    rtcStatus,
    rtcError,
    isMuted,
    toggleMute,
    acceptCall,
    loadSessionHistory,
    endCall,
  } = useRTCCall();

  const displayAgentId = useMemo(() => agentInfo?.agentId || agentId, [agentInfo, agentId]);

  const handleConnect = () => {
    if (!agentId.trim()) {
      return;
    }
    connectAgent({ agentId, name: agentName || '客服' });
  };

  const handleAccept = async (sessionId: string) => {
    if (!displayAgentId) {
      return;
    }
    acceptSession(sessionId);
    try {
      const result = await acceptCall(sessionId, displayAgentId);

      console.log('[Agent] Accept call result:', {
        sessionId,
        hasConversationHistory: !!result.conversationHistory,
        conversationHistoryCount: result.conversationHistory?.length || 0,
        conversationHistory: result.conversationHistory,
      });

      if (result.conversationHistory && result.conversationHistory.length > 0) {
        console.log('[Agent] Setting history from accept result');
        setHistory(result.conversationHistory);
      } else {
        console.log('[Agent] No history in result, fetching from API...');
        const sessionHistory = await loadSessionHistory(sessionId);
        console.log('[Agent] Session history from API:', sessionHistory);
        setHistory(sessionHistory.conversationHistory || []);
      }
      updateStatus('busy');
    } catch (acceptError) {
      console.error('[Agent] Accept error:', acceptError);
      return;
    }
  };

  const handleReject = (sessionId: string) => {
    rejectSession(sessionId, '客服端拒绝');
    updateStatus('online');
  };

  const handleHangup = () => {
    if (activeCall?.sessionId) {
      hangupSession(activeCall.sessionId);
    }
    endCall();
    setHistory([]);
    updateStatus('online');
  };

  const handleRemoteEnd = useCallback(() => {
    endCall();
    setHistory([]);
    updateStatus('online');
  }, [endCall, updateStatus]);

  useEffect(() => {
    if (!activeCall?.sessionId || !lastEndedSessionId) {
      return;
    }
    if (activeCall.sessionId === lastEndedSessionId) {
      handleRemoteEnd();
    }
  }, [activeCall?.sessionId, handleRemoteEnd, lastEndedSessionId]);

  return (
    <div className="agent-app">
      {/* 顶部导航栏 */}
      <Dashboard
        connected={connected}
        agentInfo={agentInfo}
        statusLabel={statusLabel}
        agentStatus={agentStatus}
        agentId={agentId}
        agentName={agentName}
        onAgentIdChange={setAgentId}
        onAgentNameChange={setAgentName}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        onStatusChange={updateStatus}
      />

      {/* 主内容区 - 双栏布局 */}
      <main className="main-content">
        {/* 左侧面板 - 队列区 */}
        <div className="left-panel">
          {/* 错误提示 */}
          {error && (
            <div className="error-banner">
              <AlertIcon size="sm" />
              <span>{error}</span>
            </div>
          )}
          {rtcError && (
            <div className="error-banner">
              <AlertIcon size="sm" />
              <span>RTC: {rtcError}</span>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>正在接入会话...</span>
            </div>
          )}

          {/* 待接入会话列表 */}
          <SessionList
            sessions={pendingSessions}
            onAccept={handleAccept}
            onReject={handleReject}
          />

          {/* 系统事件日志 */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-icon"><ClipboardListIcon size="sm" /></span>
                <span>系统事件</span>
              </div>
            </div>
            <div className="panel-body event-log">
              {events.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-text">暂无事件记录</p>
                </div>
              ) : (
                <ul className="event-list">
                  {events.slice().reverse().map((item, index) => (
                    <li key={`${item}-${index}`} className="event-item">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 右侧面板 - 通话区 */}
        <div className="right-panel">
          <CallPanel
            activeCall={activeCall}
            history={history}
            isMuted={isMuted}
            rtcStatus={rtcStatus}
            onHangup={handleHangup}
            onToggleMute={toggleMute}
          />
        </div>
      </main>

      {/* 底部状态栏 */}
      <footer className="footer-bar">
        <div className="footer-stats">
          <div className="stat-item">
            <span className="stat-label"><ChartBarIcon size="xs" /> 今日接听</span>
            <span className="stat-value">--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label"><HourglassIcon size="xs" /> 当前排队</span>
            <span className="stat-value">{pendingSessions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label"><TimerIcon size="xs" /> 平均时长</span>
            <span className="stat-value">--:--</span>
          </div>
          <div className="stat-item">
            <span className="stat-label"><BroadcastIcon size="xs" /> RTC</span>
            <span className="stat-value">{rtcStatus}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
