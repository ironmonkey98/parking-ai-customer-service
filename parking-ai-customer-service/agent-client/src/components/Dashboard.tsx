import type { AgentInfo, AgentStatus } from '../types';

interface DashboardProps {
  connected: boolean;
  agentInfo: AgentInfo | null;
  statusLabel: string;
  agentStatus: AgentStatus;
  agentId: string;
  agentName: string;
  onAgentIdChange: (id: string) => void;
  onAgentNameChange: (name: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onStatusChange: (status: AgentStatus) => void;
}

export const Dashboard = ({
  connected,
  agentInfo,
  statusLabel,
  agentStatus,
  agentId,
  agentName,
  onAgentIdChange,
  onAgentNameChange,
  onConnect,
  onDisconnect,
  onStatusChange,
}: DashboardProps) => {
  return (
    <header className="topbar">
      {/* 品牌标识 */}
      <div className="topbar-brand">
        <div className="brand-icon">🅿️</div>
        <div className="brand-text">
          <span className="brand-title">客服工作台</span>
          <span className="brand-subtitle">Command Center</span>
        </div>
      </div>

      {/* 未登录时显示登录表单 */}
      {!connected ? (
        <div className="login-form">
          <input
            type="text"
            className="login-input"
            placeholder="客服ID"
            value={agentId}
            onChange={(e) => onAgentIdChange(e.target.value)}
          />
          <input
            type="text"
            className="login-input"
            placeholder="昵称"
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConnect}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            登录
          </button>
        </div>
      ) : (
        /* 已登录时显示用户信息和状态控制 */
        <div className="topbar-user">
          {/* 用户状态指示器 */}
          <div className="user-status">
            <div className="status-indicator">
              <div className={`status-dot ${agentStatus}`}></div>
              <span className="user-name">
                {agentInfo?.name || agentName}
              </span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {statusLabel}
            </span>
          </div>

          {/* 状态切换按钮组 */}
          <div className="status-toggle">
            <button
              type="button"
              className={`status-btn ${agentStatus === 'online' ? 'active online' : ''}`}
              onClick={() => onStatusChange('online')}
              disabled={agentStatus === 'online'}
            >
              在线
            </button>
            <button
              type="button"
              className={`status-btn ${agentStatus === 'busy' ? 'active busy' : ''}`}
              onClick={() => onStatusChange('busy')}
              disabled={agentStatus === 'busy'}
            >
              忙碌
            </button>
            <button
              type="button"
              className={`status-btn ${agentStatus === 'offline' ? 'active offline' : ''}`}
              onClick={() => onStatusChange('offline')}
              disabled={agentStatus === 'offline'}
            >
              离线
            </button>
          </div>

          {/* 退出按钮 */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDisconnect}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            退出
          </button>
        </div>
      )}
    </header>
  );
};
