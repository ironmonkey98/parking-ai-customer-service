/**
 * WebSocket 服务
 *
 * 功能：
 * - 处理客服连接和断开
 * - 推送新会话给客服
 * - 处理客服状态变更
 * - 实时通知
 */

const { Server } = require('socket.io');
const sessionManager = require('./managers/SessionManager');
const agentStatusManager = require('./managers/AgentStatusManager');
const queueManager = require('./managers/QueueManager');

/**
 * 初始化 WebSocket 服务
 * @param {Object} httpServer - HTTP 服务器实例
 * @returns {Object} Socket.IO 实例
 */
function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // 生产环境需要限制
      methods: ['GET', 'POST']
    }
  });

  console.log('[WebSocket] Service initialized');

  // 客服连接
  io.on('connection', (socket) => {
    console.log('[WebSocket] Client connected:', socket.id);

    // 客服登录
    socket.on('agent-login', ({ agentId, name }) => {
      console.log(`[WebSocket] Agent login: ${agentId} (${name})`);

      try {
        // 添加客服到状态管理器
        agentStatusManager.addAgent({
          agentId,
          name,
          socketId: socket.id,
          rtcUserId: `agent_${agentId}`
        });

        // 发送当前等待中的会话列表
        const pendingSessions = queueManager.getAllSessions();
        socket.emit('pending-sessions', pendingSessions);

        // 发送成功响应
        socket.emit('login-success', {
          agentId,
          name,
          pendingSessionsCount: pendingSessions.length
        });

        console.log(`[WebSocket] Agent ${agentId} logged in successfully`);
      } catch (error) {
        console.error('[WebSocket] Agent login failed:', error);
        socket.emit('login-error', {
          message: error.message || 'Login failed'
        });
      }
    });

    // 客服状态变更
    socket.on('agent-status-change', ({ status }) => {
      console.log(`[WebSocket] Agent status change: ${socket.id} -> ${status}`);

      const agent = agentStatusManager.getAgentBySocketId(socket.id);

      if (!agent) {
        console.error('[WebSocket] Agent not found for socket:', socket.id);
        return;
      }

      // 更新状态
      agentStatusManager.updateStatus(agent.agentId, status);

      // 如果客服变为空闲，尝试从队列分配会话
      if (status === 'online') {
        const nextSession = queueManager.dequeue();

        if (nextSession) {
          console.log(`[WebSocket] Assigning session ${nextSession.sessionId} to agent ${agent.agentId}`);

          // 推送新会话给客服
          socket.emit('new-session', {
            sessionId: nextSession.sessionId,
            userId: nextSession.userId,
            instanceId: nextSession.instanceId,
            channelId: nextSession.channelId,
            conversationHistory: nextSession.conversationHistory,
            transferReason: nextSession.transferReason,
            keyword: nextSession.keyword,
            enqueuedAt: nextSession.enqueuedAt
          });
        }
      }
    });

    // 客服接听会话（由客服端主动触发）
    socket.on('agent-accept-session', async ({ sessionId }) => {
      console.log(`[WebSocket] Agent accepting session: ${sessionId}`);

      const agent = agentStatusManager.getAgentBySocketId(socket.id);
      const session = sessionManager.getSession(sessionId);

      if (!agent) {
        socket.emit('accept-error', { message: 'Agent not found' });
        return;
      }

      if (!session) {
        socket.emit('accept-error', { message: 'Session not found' });
        return;
      }

      // 通知客服端：准备接听
      // 实际的接听操作由 HTTP API 完成（调用 TakeoverAIAgentCall）
      socket.emit('accept-acknowledged', {
        sessionId,
        message: 'Proceed with API call to /api/agent-accept-call'
      });
    });

    // 客服拒绝会话
    socket.on('agent-reject-session', ({ sessionId, reason }) => {
      console.log(`[WebSocket] Agent rejecting session: ${sessionId}, reason: ${reason}`);

      const agent = agentStatusManager.getAgentBySocketId(socket.id);

      if (!agent) {
        return;
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        console.warn(`[WebSocket] Session not found for rejection: ${sessionId}`);
        return;
      }

      // 从队列中移除会话（而不是重新加入队列）
      queueManager.removeSession(sessionId);

      // 更新会话状态为已拒绝
      sessionManager.updateSession(sessionId, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectReason: reason || '客服繁忙'
      });

      // 通知用户端：请求被拒绝
      io.emit('session-rejected', {
        sessionId,
        reason: reason || '客服繁忙',
        message: '当前客服繁忙，请稍后重试或继续与AI客服对话'
      });

      // 更新所有客服的待处理会话列表
      const pendingSessions = queueManager.getAllSessions();
      broadcastToAgents(io, 'pending-sessions', pendingSessions);

      console.log(`[WebSocket] Session ${sessionId} rejected and removed from queue`);
    });

    // 客服挂断通话
    socket.on('agent-hangup', ({ sessionId }) => {
      console.log(`[WebSocket] Agent hangup: ${sessionId}`);

      const agent = agentStatusManager.getAgentBySocketId(socket.id);
      const session = sessionManager.getSession(sessionId);

      if (agent) {
        // 更新客服状态为空闲
        agentStatusManager.updateStatus(agent.agentId, 'online');

        // 更新会话状态
        sessionManager.updateSession(sessionId, {
          status: 'ended',
          endedAt: new Date(),
          endedBy: 'agent'
        });

        // ✅ 通知用户端：客服已挂断
        if (session && session.userId) {
          io.emit('session-ended-by-agent', {
            sessionId,
            userId: session.userId,
            agentId: agent.agentId,
            agentName: agent.name,
            message: '客服已结束通话'
          });
          console.log(`[WebSocket] Notified user ${session.userId} that agent hung up`);
        }

        // 通知所有客服端会话已结束
        io.emit('session-ended', { sessionId });
      }
    });

    // ✅ 新增：用户挂断通话
    socket.on('user-hangup', ({ sessionId, userId }) => {
      console.log(`[WebSocket] User hangup: ${sessionId}, userId: ${userId}`);

      const session = sessionManager.getSession(sessionId);

      if (session) {
        // 更新会话状态
        sessionManager.updateSession(sessionId, {
          status: 'ended',
          endedAt: new Date(),
          endedBy: 'user'
        });

        // 通知客服端：用户已挂断
        io.emit('session-ended-by-user', {
          sessionId,
          userId,
          message: '用户已挂断通话'
        });
        console.log(`[WebSocket] Notified agents that user ${userId} hung up`);

        // 如果有分配的客服，恢复其在线状态
        if (session.agentId) {
          agentStatusManager.updateStatus(session.agentId, 'online');
          console.log(`[WebSocket] Agent ${session.agentId} status restored to online`);
        }
      }
    });

    // 客服断开连接
    socket.on('disconnect', () => {
      console.log('[WebSocket] Client disconnected:', socket.id);

      // ========================================
      // 1. 检查是否是用户断开连接（用户刷新页面等场景）
      // ========================================
      const userSession = sessionManager.getSessionBySocketId(socket.id);
      if (userSession && userSession.status === 'waiting_human') {
        console.log(`[WebSocket] Cleaning up user session: ${userSession.sessionId}`);

        // 从队列中移除
        queueManager.removeSession(userSession.sessionId);

        // 更新会话状态
        sessionManager.updateSession(userSession.sessionId, {
          status: 'user_disconnected',
          endedAt: new Date()
        });

        // 通知所有客服更新列表
        const pendingSessions = queueManager.getAllSessions();
        broadcastToAgents(io, 'pending-sessions', pendingSessions);

        console.log(`[WebSocket] User session ${userSession.sessionId} cleaned up`);
      }

      // ========================================
      // 2. 检查是否是客服断开连接
      // ========================================
      const agent = agentStatusManager.getAgentBySocketId(socket.id);

      if (agent) {
        console.log(`[WebSocket] Agent ${agent.agentId} disconnected`);

        // 如果客服正在通话中，需要处理当前会话
        if (agent.status === 'busy' && agent.currentSessionId) {
          const session = sessionManager.getSession(agent.currentSessionId);

          if (session) {
            console.warn(`[WebSocket] Agent ${agent.agentId} disconnected during call ${agent.currentSessionId}`);

            // 将会话重新加入队列
            queueManager.enqueue(session);

            // 通知用户：客服断线，正在重新分配
            io.emit('agent-disconnected', {
              sessionId: agent.currentSessionId,
              message: '客服连接断开，正在为您重新分配客服...'
            });
          }
        }

        // 移除客服
        agentStatusManager.removeAgentBySocketId(socket.id);
      }
    });

    // Ping-Pong 心跳（保持连接）
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // 定期清理超时会话（每 2 分钟执行一次）
  setInterval(() => {
    const timedOutSessions = queueManager.cleanupTimedOutSessions(600000); // 10 分钟超时

    if (timedOutSessions.length > 0) {
      console.log(`[WebSocket] Cleaned up ${timedOutSessions.length} timed-out sessions`);

      // 通知用户：会话已超时
      timedOutSessions.forEach(sessionId => {
        io.emit('session-timeout', {
          sessionId,
          message: '等待超时，请重新发起请求'
        });
      });
    }
  }, 120000); // 2 分钟

  return io;
}

/**
 * 推送新会话给可用客服
 * @param {Object} io - Socket.IO 实例
 * @param {Object} session - 会话对象
 * @returns {boolean} 是否成功推送
 */
function pushSessionToAgent(io, session) {
  const availableAgent = agentStatusManager.getAvailableAgent();

  if (!availableAgent) {
    console.log('[WebSocket] No available agent, session added to queue');
    return false;
  }

  console.log(`[WebSocket] Pushing session ${session.sessionId} to agent ${availableAgent.agentId}`);

  io.to(availableAgent.socketId).emit('new-session', {
    sessionId: session.sessionId,
    userId: session.userId,
    instanceId: session.instanceId,
    channelId: session.channelId,
    conversationHistory: session.conversationHistory,
    transferReason: session.transferReason,
    keyword: session.keyword,
    createdAt: session.createdAt
  });

  return true;
}

/**
 * 通知用户：客服已接入（方案 B：包含新的 RTC 频道信息）
 * @param {Object} io - Socket.IO 实例
 * @param {string} userId - 用户 ID
 * @param {Object} agentInfo - 客服信息 { agentId, name }
 * @param {Object} rtcInfo - RTC 频道信息（方案 B 新增）{ channelId, userToken }
 */
function notifyUserTakeoverSuccess(io, userId, agentInfo, rtcInfo = null) {
  const payload = {
    userId,
    agentInfo: {
      agentId: agentInfo.agentId,
      name: agentInfo.name
    },
    message: '已为您接通人工客服'
  };

  // 方案 B：如果提供了 RTC 信息，包含新的频道和 Token
  if (rtcInfo) {
    payload.rtcInfo = {
      channelId: rtcInfo.channelId,
      userToken: rtcInfo.userToken,
      userNonce: rtcInfo.userNonce,       // ✅ 新增：用户端需要的 nonce
      timestamp: rtcInfo.timestamp,        // ✅ 新增：时间戳
      appId: rtcInfo.appId                 // ✅ 新增：RTC AppId
    };
    payload.requireChannelSwitch = true; // 标记需要切换频道
  }

  io.emit('takeover-success', payload);

  console.log(`[WebSocket] Notified user ${userId}: takeover success`, {
    hasRtcInfo: !!rtcInfo,
    channelId: rtcInfo?.channelId
  });
}

/**
 * 广播通知所有客服
 * @param {Object} io - Socket.IO 实例
 * @param {string} event - 事件名称
 * @param {Object} data - 数据
 */
function broadcastToAgents(io, event, data) {
  const allAgents = agentStatusManager.getAllAgents();

  allAgents.forEach(agent => {
    io.to(agent.socketId).emit(event, data);
  });

  console.log(`[WebSocket] Broadcast to ${allAgents.length} agents: ${event}`);
}

module.exports = {
  initWebSocket,
  pushSessionToAgent,
  notifyUserTakeoverSuccess,
  broadcastToAgents
};
