/**
 * SessionManager - 会话管理器
 *
 * 功能：
 * - 管理所有活跃会话
 * - 保存和检索会话信息
 * - 更新会话状态
 * - 存储 AI 对话历史
 */

class SessionManager {
  constructor() {
    // 使用 Map 存储会话，key 为 sessionId
    this.sessions = new Map();
  }

  /**
   * 保存新会话
   * @param {Object} session - 会话对象
   * @returns {boolean} 是否保存成功
   */
  saveSession(session) {
    if (!session.sessionId) {
      throw new Error('Session must have a sessionId');
    }

    this.sessions.set(session.sessionId, {
      ...session,
      createdAt: session.createdAt || new Date(),
      updatedAt: new Date()
    });

    console.log(`[SessionManager] Session saved: ${session.sessionId}`);
    return true;
  }

  /**
   * 获取会话
   * @param {string} sessionId - 会话 ID
   * @returns {Object|null} 会话对象或 null
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 根据 instanceId 获取会话
   * @param {string} instanceId - AI 实例 ID
   * @returns {Object|null} 会话对象或 null
   */
  getSessionByInstanceId(instanceId) {
    for (const session of this.sessions.values()) {
      if (session.instanceId === instanceId) {
        return session;
      }
    }
    return null;
  }

  /**
   * 根据 userSocketId 获取会话
   * 用于用户断开连接时清理会话
   * @param {string} socketId - 用户的 Socket ID
   * @returns {Object|null} 会话对象或 null
   */
  getSessionBySocketId(socketId) {
    for (const [sessionId, session] of this.sessions) {
      if (session.userSocketId === socketId) {
        return session;
      }
    }
    return null;
  }

  /**
   * 向会话添加消息记录
   * 用于智能体回调时保存对话历史
   * @param {string} sessionId - 会话 ID
   * @param {Object} message - 消息对象 { id, role, content, timestamp }
   * @returns {boolean} 是否添加成功
   */
  addMessageToSession(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.conversationHistory) {
        session.conversationHistory = [];
      }
      session.conversationHistory.push(message);
      console.log(`[SessionManager] Message added to session ${sessionId}, role: ${message.role}`);
      return true;
    }
    return false;
  }

  /**
   * 更新会话
   * @param {Object} updates - 更新的字段
   * @returns {boolean} 是否更新成功
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      console.error(`[SessionManager] Session not found: ${sessionId}`);
      return false;
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, updatedSession);
    console.log(`[SessionManager] Session updated: ${sessionId}`);

    return true;
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话 ID
   * @returns {boolean} 是否删除成功
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);

    if (deleted) {
      console.log(`[SessionManager] Session deleted: ${sessionId}`);
    }

    return deleted;
  }

  /**
   * 获取所有会话
   * @returns {Array} 会话数组
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * 根据状态获取会话列表
   * @param {string} status - 会话状态
   * @returns {Array} 会话数组
   */
  getSessionsByStatus(status) {
    return this.getAllSessions().filter(session => session.status === status);
  }

  /**
   * 根据客服 ID 获取会话
   * @param {string} agentId - 客服 ID
   * @returns {Object|null} 会话对象或 null
   */
  getSessionByAgentId(agentId) {
    for (const session of this.sessions.values()) {
      if (session.agentId === agentId && session.status === 'human_talking') {
        return session;
      }
    }
    return null;
  }

  /**
   * 获取等待中的会话数量
   * @returns {number} 数量
   */
  getWaitingSessionsCount() {
    return this.getSessionsByStatus('waiting_human').length;
  }

  /**
   * 清理已结束的会话（可选，用于定期清理）
   * @param {number} maxAge - 最大保留时间（毫秒）
   * @returns {number} 清理的会话数量
   */
  cleanupEndedSessions(maxAge = 3600000) { // 默认 1 小时
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === 'ended' && session.endedAt) {
        const age = now - new Date(session.endedAt).getTime();
        if (age > maxAge) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SessionManager] Cleaned up ${cleanedCount} ended sessions`);
    }

    return cleanedCount;
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计对象
   */
  getStats() {
    const all = this.getAllSessions();

    return {
      total: all.length,
      aiTalking: this.getSessionsByStatus('ai_talking').length,
      waitingHuman: this.getSessionsByStatus('waiting_human').length,
      humanTalking: this.getSessionsByStatus('human_talking').length,
      ended: this.getSessionsByStatus('ended').length
    };
  }
}

// 导出单例
module.exports = new SessionManager();
