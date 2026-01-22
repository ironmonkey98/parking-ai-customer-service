import type { SessionSummary } from '../types';

interface SessionListProps {
  sessions: SessionSummary[];
  onAccept: (sessionId: string) => void;
  onReject: (sessionId: string) => void;
}

export const SessionList = ({ sessions, onAccept, onReject }: SessionListProps) => {
  const getReasonClass = (reason: string | undefined) => {
    switch (reason) {
      case 'keyword_detected': return 'keyword';
      case 'ai_suggested': return 'ai';
      case 'user_requested': return 'user';
      default: return 'user';
    }
  };

  const getReasonText = (reason: string | undefined, keyword?: string) => {
    switch (reason) {
      case 'keyword_detected': return `🔑 关键词: ${keyword || '未知'}`;
      case 'ai_suggested': return '🤖 AI 建议转人工';
      case 'user_requested': return '👤 用户主动请求';
      default: return '❓ 未知原因';
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">📞</span>
          <span>待接入会话</span>
        </div>
        {sessions.length > 0 && (
          <span className={`count-badge ${sessions.length >= 3 ? 'warning' : ''}`}>
            {sessions.length}
          </span>
        )}
      </div>
      <div className="panel-body">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">当前没有等待中的会话</p>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div key={session.sessionId} className="session-card">
                {/* 会话元信息 */}
                <div className="session-meta">
                  <div className="session-id">
                    ID: {session.sessionId.substring(0, 12)}...
                  </div>
                  <div className="session-user">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span>用户 {session.userId.substring(0, 8)}...</span>
                  </div>
                  <span className={`reason-tag ${getReasonClass(session.transferReason)}`}>
                    {getReasonText(session.transferReason, session.keyword)}
                  </span>
                </div>

                {/* 对话历史预览 */}
                {session.conversationHistory && session.conversationHistory.length > 0 ? (
                  <div className="conversation-preview">
                    <div className="preview-title">
                      <span>💬</span>
                      <span>对话记录 ({session.conversationHistory.length}条)</span>
                    </div>
                    <div className="preview-messages">
                      {session.conversationHistory.slice(-3).map((msg) => (
                        <div
                          key={msg.id}
                          className={`preview-msg ${msg.role}`}
                        >
                          <span className="role">
                            {msg.role === 'user' ? '👤' : '🤖'}
                          </span>
                          {msg.content.length > 60
                            ? msg.content.substring(0, 60) + '...'
                            : msg.content
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="no-history">暂无 AI 对话记录</p>
                )}

                {/* 操作按钮 */}
                <div className="session-actions">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => onAccept(session.sessionId)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    接入
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onReject(session.sessionId)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
