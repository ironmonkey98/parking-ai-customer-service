/**
 * AgentStatusManager - 客服状态管理器
 *
 * 功能：
 * - 管理客服在线状态
 * - 跟踪客服当前会话
 * - 分配空闲客服
 * - 统计客服工作情况
 */

class AgentStatusManager {
  constructor() {
    // 使用 Map 存储客服状态，key 为 agentId
    this.agents = new Map();
  }

  /**
   * 添加客服（客服上线）
   * @param {Object} agent - 客服对象
   * @returns {boolean} 是否添加成功
   */
  addAgent(agent) {
    if (!agent.agentId) {
      throw new Error('Agent must have an agentId');
    }

    const agentData = {
      agentId: agent.agentId,
      name: agent.name || `客服${agent.agentId}`,
      status: 'online', // 默认上线为空闲状态
      socketId: agent.socketId,
      rtcUserId: agent.rtcUserId || `agent_${agent.agentId}`,
      currentSessionId: null,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      stats: {
        totalCalls: 0,
        todayCalls: 0,
        avgCallDuration: 0
      }
    };

    this.agents.set(agent.agentId, agentData);
    console.log(`[AgentStatusManager] Agent added: ${agent.agentId} (${agent.name})`);

    return true;
  }

  /**
   * 移除客服（客服下线）
   * @param {string} socketId - Socket ID
   * @returns {boolean} 是否移除成功
   */
  removeAgentBySocketId(socketId) {
    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.socketId === socketId) {
        this.agents.delete(agentId);
        console.log(`[AgentStatusManager] Agent removed: ${agentId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 根据 agentId 移除客服
   * @param {string} agentId - 客服 ID
   * @returns {boolean} 是否移除成功
   */
  removeAgent(agentId) {
    const deleted = this.agents.delete(agentId);

    if (deleted) {
      console.log(`[AgentStatusManager] Agent removed: ${agentId}`);
    }

    return deleted;
  }

  /**
   * 更新客服状态
   * @param {string} agentId - 客服 ID
   * @param {string} status - 新状态 ('online' | 'busy' | 'offline')
   * @param {string} sessionId - 当前会话 ID（可选）
   * @returns {boolean} 是否更新成功
   */
  updateStatus(agentId, status, sessionId = null) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      console.error(`[AgentStatusManager] Agent not found: ${agentId}`);
      return false;
    }

    agent.status = status;
    agent.lastActiveAt = new Date();

    if (status === 'busy' && sessionId) {
      agent.currentSessionId = sessionId;
    } else if (status === 'online') {
      agent.currentSessionId = null;
    }

    console.log(`[AgentStatusManager] Agent status updated: ${agentId} -> ${status}`);

    return true;
  }

  /**
   * 根据 socketId 更新状态
   * @param {string} socketId - Socket ID
   * @param {string} status - 新状态
   * @returns {boolean} 是否更新成功
   */
  updateStatusBySocketId(socketId, status) {
    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.socketId === socketId) {
        return this.updateStatus(agentId, status);
      }
    }
    return false;
  }

  /**
   * 获取客服信息
   * @param {string} agentId - 客服 ID
   * @returns {Object|null} 客服对象或 null
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }

  /**
   * 根据 socketId 获取客服
   * @param {string} socketId - Socket ID
   * @returns {Object|null} 客服对象或 null
   */
  getAgentBySocketId(socketId) {
    for (const agent of this.agents.values()) {
      if (agent.socketId === socketId) {
        return agent;
      }
    }
    return null;
  }

  /**
   * 获取客服名称
   * @param {string} agentId - 客服 ID
   * @returns {string} 客服名称
   */
  getAgentName(agentId) {
    const agent = this.agents.get(agentId);
    return agent ? agent.name : '未知客服';
  }

  /**
   * 获取所有客服
   * @returns {Array} 客服数组
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * 根据状态获取客服列表
   * @param {string} status - 状态
   * @returns {Array} 客服数组
   */
  getAgentsByStatus(status) {
    return this.getAllAgents().filter(agent => agent.status === status);
  }

  /**
   * 获取空闲客服（简单轮询策略）
   * @returns {Object|null} 客服对象或 null
   */
  getAvailableAgent() {
    const onlineAgents = this.getAgentsByStatus('online');

    if (onlineAgents.length === 0) {
      console.log('[AgentStatusManager] No available agents');
      return null;
    }

    // 简单策略：返回第一个空闲的客服
    // 可以扩展为更复杂的负载均衡策略
    const agent = onlineAgents[0];
    console.log(`[AgentStatusManager] Available agent found: ${agent.agentId}`);

    return agent;
  }

  /**
   * 获取在线客服数量
   * @returns {number} 数量
   */
  getOnlineAgentsCount() {
    return this.getAgentsByStatus('online').length;
  }

  /**
   * 获取忙碌客服数量
   * @returns {number} 数量
   */
  getBusyAgentsCount() {
    return this.getAgentsByStatus('busy').length;
  }

  /**
   * 增加客服通话统计
   * @param {string} agentId - 客服 ID
   * @param {number} duration - 通话时长（秒）
   * @returns {boolean} 是否更新成功
   */
  incrementCallStats(agentId, duration = 0) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      return false;
    }

    agent.stats.totalCalls += 1;
    agent.stats.todayCalls += 1;

    // 更新平均通话时长
    const totalDuration = agent.stats.avgCallDuration * (agent.stats.totalCalls - 1) + duration;
    agent.stats.avgCallDuration = Math.round(totalDuration / agent.stats.totalCalls);

    console.log(`[AgentStatusManager] Call stats updated for agent: ${agentId}`);

    return true;
  }

  /**
   * 重置每日统计（可在每日凌晨调用）
   * @returns {number} 重置的客服数量
   */
  resetDailyStats() {
    let count = 0;

    for (const agent of this.agents.values()) {
      agent.stats.todayCalls = 0;
      count++;
    }

    console.log(`[AgentStatusManager] Daily stats reset for ${count} agents`);

    return count;
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计对象
   */
  getStats() {
    const all = this.getAllAgents();

    return {
      total: all.length,
      online: this.getOnlineAgentsCount(),
      busy: this.getBusyAgentsCount(),
      offline: all.length - this.getOnlineAgentsCount() - this.getBusyAgentsCount()
    };
  }

  /**
   * 获取客服详细列表（用于管理界面）
   * @returns {Array} 客服详细信息数组
   */
  getAgentDetails() {
    return this.getAllAgents().map(agent => ({
      agentId: agent.agentId,
      name: agent.name,
      status: agent.status,
      currentSessionId: agent.currentSessionId,
      loginAt: agent.loginAt,
      lastActiveAt: agent.lastActiveAt,
      stats: agent.stats
    }));
  }
}

// 导出单例
module.exports = new AgentStatusManager();
