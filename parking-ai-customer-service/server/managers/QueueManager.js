/**
 * QueueManager - 队列管理器（简化版）
 *
 * 功能：
 * - 管理等待转人工的会话队列
 * - FIFO（先进先出）策略
 * - 查询队列状态
 */

class QueueManager {
  constructor() {
    // 使用数组实现简单的 FIFO 队列
    this.queue = [];
  }

  /**
   * 将会话加入队列
   * @param {Object} session - 会话对象
   * @returns {number} 队列中的位置（从 1 开始）
   */
  enqueue(session) {
    if (!session.sessionId) {
      throw new Error('Session must have a sessionId');
    }

    // 检查是否已在队列中
    const existingIndex = this.queue.findIndex(s => s.sessionId === session.sessionId);

    if (existingIndex !== -1) {
      console.warn(`[QueueManager] Session ${session.sessionId} already in queue`);
      return existingIndex + 1;
    }

    this.queue.push({
      ...session,
      enqueuedAt: new Date()
    });

    const position = this.queue.length;
    console.log(`[QueueManager] Session enqueued: ${session.sessionId}, position: ${position}`);

    return position;
  }

  /**
   * 从队列中取出下一个会话
   * @returns {Object|null} 会话对象或 null
   */
  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }

    const session = this.queue.shift();
    console.log(`[QueueManager] Session dequeued: ${session.sessionId}`);

    return session;
  }

  /**
   * 从队列中移除特定会话（用户取消等待）
   * @param {string} sessionId - 会话 ID
   * @returns {boolean} 是否移除成功
   */
  remove(sessionId) {
    const index = this.queue.findIndex(s => s.sessionId === sessionId);

    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    console.log(`[QueueManager] Session removed from queue: ${sessionId}`);

    return true;
  }

  /**
   * 查看队列中的下一个会话（不移除）
   * @returns {Object|null} 会话对象或 null
   */
  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * 获取队列长度
   * @returns {number} 队列中的会话数量
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * 获取会话在队列中的位置
   * @param {string} sessionId - 会话 ID
   * @returns {number} 位置（从 1 开始），如果不在队列中返回 -1
   */
  getPosition(sessionId) {
    const index = this.queue.findIndex(s => s.sessionId === sessionId);
    return index === -1 ? -1 : index + 1;
  }

  /**
   * 获取所有等待中的会话
   * @returns {Array} 会话数组
   */
  getAllSessions() {
    return [...this.queue];
  }

  /**
   * 清空队列
   * @returns {number} 被清空的会话数量
   */
  clear() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`[QueueManager] Queue cleared, ${count} sessions removed`);

    return count;
  }

  /**
   * 估算等待时间（简单估算）
   * @param {number} position - 队列位置
   * @param {number} avgServiceTime - 平均服务时长（秒），默认 60 秒
   * @returns {number} 预计等待时间（秒）
   */
  estimateWaitTime(position, avgServiceTime = 60) {
    if (position <= 0) {
      return 0;
    }

    // 简单估算：前面每个会话预计需要 avgServiceTime 秒
    return (position - 1) * avgServiceTime;
  }

  /**
   * 获取队列统计信息
   * @returns {Object} 统计对象
   */
  getStats() {
    const now = new Date();
    const sessions = this.getAllSessions();

    // 计算平均等待时长
    const totalWaitTime = sessions.reduce((sum, session) => {
      const waitTime = (now - new Date(session.enqueuedAt)) / 1000; // 转换为秒
      return sum + waitTime;
    }, 0);

    const avgWaitTime = sessions.length > 0 ? Math.round(totalWaitTime / sessions.length) : 0;

    // 计算最长等待时长
    const maxWaitTime = sessions.length > 0
      ? Math.max(...sessions.map(s => (now - new Date(s.enqueuedAt)) / 1000))
      : 0;

    return {
      queueLength: this.queue.length,
      avgWaitTime: avgWaitTime, // 秒
      maxWaitTime: Math.round(maxWaitTime), // 秒
      oldestSession: sessions.length > 0 ? sessions[0].sessionId : null
    };
  }

  /**
   * 清理超时会话（超过一定时间未处理的会话）
   * @param {number} timeout - 超时时间（毫秒），默认 10 分钟
   * @returns {Array} 被清理的会话 ID 列表
   */
  cleanupTimedOutSessions(timeout = 600000) { // 默认 10 分钟
    const now = Date.now();
    const timedOutSessions = [];

    this.queue = this.queue.filter(session => {
      const waitTime = now - new Date(session.enqueuedAt).getTime();

      if (waitTime > timeout) {
        timedOutSessions.push(session.sessionId);
        return false;
      }

      return true;
    });

    if (timedOutSessions.length > 0) {
      console.log(`[QueueManager] Cleaned up ${timedOutSessions.length} timed-out sessions`);
    }

    return timedOutSessions;
  }
}

// 导出单例
module.exports = new QueueManager();
