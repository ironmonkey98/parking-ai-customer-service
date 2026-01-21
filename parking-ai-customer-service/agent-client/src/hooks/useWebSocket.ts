import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { AgentInfo, AgentStatus, SessionSummary } from '../types';

// 自动检测主机地址和协议，支持局域网远程访问
// 后端使用 HTTPS，强制使用 https 协议连接
const socketUrl = import.meta.env.VITE_WS_URL || `https://${window.location.hostname}:3000`;

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('offline');
  const [pendingSessions, setPendingSessions] = useState<SessionSummary[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [lastEndedSessionId, setLastEndedSessionId] = useState<string | null>(null);

  const pushEvent = useCallback((message: string) => {
    setEvents(prev => [message, ...prev].slice(0, 20));
  }, []);

  const handlePendingSessions = useCallback((sessions: SessionSummary[]) => {
    setPendingSessions(sessions || []);
  }, []);

  const handleNewSession = useCallback((session: SessionSummary) => {
    setPendingSessions(prev => {
      const exists = prev.some(item => item.sessionId === session.sessionId);
      if (exists) {
        return prev;
      }
      return [session, ...prev];
    });
    pushEvent(`新会话进入队列: ${session.sessionId}`);
  }, [pushEvent]);

  const removeSession = useCallback((sessionId: string) => {
    setPendingSessions(prev => prev.filter(item => item.sessionId !== sessionId));
  }, []);

  const connectAgent = useCallback((nextAgentInfo: AgentInfo) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      pushEvent('Socket 已连接');
      socket.emit('agent-login', nextAgentInfo);
      setAgentInfo(nextAgentInfo);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setAgentStatus('offline');
      setLastEndedSessionId(null);
      pushEvent('Socket 已断开');
    });

    socket.on('pending-sessions', handlePendingSessions);
    socket.on('new-session', handleNewSession);

    socket.on('login-success', (payload: { agentId: string; name: string }) => {
      setAgentStatus('online');
      setAgentInfo(payload);
      pushEvent(`客服 ${payload.name} 已上线`);
    });

    socket.on('login-error', (payload: { message: string }) => {
      pushEvent(`登录失败: ${payload.message}`);
    });

    socket.on('session-ended', (payload: { sessionId: string }) => {
      removeSession(payload.sessionId);
      setLastEndedSessionId(payload.sessionId);
      pushEvent(`会话结束: ${payload.sessionId}`);
    });

    socket.on('agent-disconnected', (payload: { sessionId: string; message: string }) => {
      removeSession(payload.sessionId);
      setLastEndedSessionId(payload.sessionId);
      pushEvent(payload.message || `客服断线: ${payload.sessionId}`);
    });

    socket.on('session-timeout', (payload: { sessionId: string; message: string }) => {
      removeSession(payload.sessionId);
      setLastEndedSessionId(payload.sessionId);
      pushEvent(payload.message || `会话超时: ${payload.sessionId}`);
    });
  }, [handleNewSession, handlePendingSessions, pushEvent, removeSession]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setAgentStatus('offline');
    setLastEndedSessionId(null);
  }, []);

  const updateStatus = useCallback((status: AgentStatus) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('agent-status-change', { status });
    setAgentStatus(status);
    pushEvent(`状态更新: ${status}`);
  }, [pushEvent]);

  const acceptSession = useCallback((sessionId: string) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('agent-accept-session', { sessionId });
    removeSession(sessionId);
    pushEvent(`尝试接入会话: ${sessionId}`);
  }, [pushEvent, removeSession]);

  const rejectSession = useCallback((sessionId: string, reason?: string) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('agent-reject-session', { sessionId, reason });
    pushEvent(`拒绝会话: ${sessionId}`);
  }, [pushEvent]);

  const hangupSession = useCallback((sessionId: string) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit('agent-hangup', { sessionId });
    removeSession(sessionId);
    pushEvent(`挂断会话: ${sessionId}`);
  }, [pushEvent, removeSession]);

  useEffect(() => () => {
    socketRef.current?.disconnect();
  }, []);

  const statusLabel = useMemo(() => {
    switch (agentStatus) {
      case 'online':
        return '在线';
      case 'busy':
        return '忙碌';
      case 'offline':
      default:
        return '离线';
    }
  }, [agentStatus]);

  return {
    connected,
    agentInfo,
    agentStatus,
    statusLabel,
    pendingSessions,
    events,
    lastEndedSessionId,
    connectAgent,
    disconnect,
    updateStatus,
    acceptSession,
    rejectSession,
    hangupSession,
    setPendingSessions,
  };
};
