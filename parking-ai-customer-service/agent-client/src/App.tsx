import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Dashboard } from './components/Dashboard';
import { SessionList } from './components/SessionList';
import { CallPanel } from './components/CallPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useRTCCall } from './hooks/useRTCCall';
import type { ConversationMessage } from './types';

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

      // ✅ 调试：打印接收到的对话历史
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
    updateStatus('online');
  };

  const handleRemoteEnd = useCallback(() => {
    endCall();
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
    <div>
      <h1>客服端工作台</h1>

      <section>
        <label>
          客服ID
          <input
            value={agentId}
            onChange={event => setAgentId(event.target.value)}
            disabled={connected}
          />
        </label>
        <label>
          客服昵称
          <input
            value={agentName}
            onChange={event => setAgentName(event.target.value)}
            disabled={connected}
          />
        </label>
      </section>

      <Dashboard
        connected={connected}
        agentInfo={agentInfo}
        statusLabel={statusLabel}
        agentStatus={agentStatus}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        onStatusChange={updateStatus}
      />

      {error && <p>错误: {error}</p>}
      {rtcError && <p>RTC错误: {rtcError}</p>}
      <p>RTC 状态: {rtcStatus}</p>
      {loading && <p>正在接入会话...</p>}

      <SessionList sessions={pendingSessions} onAccept={handleAccept} onReject={handleReject} />

      <CallPanel
        activeCall={activeCall}
        history={history}
        isMuted={isMuted}
        rtcStatus={rtcStatus}
        onHangup={handleHangup}
        onToggleMute={toggleMute}
      />

      <section>
        <h3>系统事件</h3>
        <ul>
          {events.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default App;
