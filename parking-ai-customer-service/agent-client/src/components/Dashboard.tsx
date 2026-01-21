import type { AgentInfo, AgentStatus } from '../types';

interface DashboardProps {
  connected: boolean;
  agentInfo: AgentInfo | null;
  statusLabel: string;
  agentStatus: AgentStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onStatusChange: (status: AgentStatus) => void;
}

export const Dashboard = ({
  connected,
  agentInfo,
  statusLabel,
  agentStatus,
  onConnect,
  onDisconnect,
  onStatusChange,
}: DashboardProps) => {
  return (
    <section>
      <h2>客服控制台</h2>
      <p>连接状态: {connected ? '已连接' : '未连接'}</p>
      <p>当前客服: {agentInfo ? `${agentInfo.name} (${agentInfo.agentId})` : '未登录'}</p>
      <p>状态: {statusLabel}</p>

      <div>
        <button
          type="button"
          onClick={onConnect}
          disabled={connected}
        >
          登录
        </button>
        <button type="button" onClick={onDisconnect} disabled={!connected}>
          退出
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => onStatusChange('online')}
          disabled={!connected || agentStatus === 'online'}
        >
          设为在线
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('busy')}
          disabled={!connected || agentStatus === 'busy'}
        >
          设为忙碌
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('offline')}
          disabled={!connected || agentStatus === 'offline'}
        >
          设为离线
        </button>
      </div>
    </section>
  );
};
