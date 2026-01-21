import type { SessionSummary } from '../types';

interface SessionListProps {
  sessions: SessionSummary[];
  onAccept: (sessionId: string) => void;
  onReject: (sessionId: string) => void;
}

export const SessionList = ({ sessions, onAccept, onReject }: SessionListProps) => {
  if (sessions.length === 0) {
    return <p>当前没有等待中的会话</p>;
  }

  return (
    <section>
      <h3>等待接入的会话</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sessions.map(session => (
          <li
            key={session.sessionId}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#fafafa'
            }}
          >
            {/* 基本信息 */}
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                <strong>会话ID:</strong> {session.sessionId.substring(0, 8)}...
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>用户ID:</strong> {session.userId.substring(0, 8)}...
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>转人工原因:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: session.transferReason === 'keyword_detected' ? '#fff3e0' : '#e3f2fd',
                  color: session.transferReason === 'keyword_detected' ? '#e65100' : '#1565c0',
                  fontSize: '12px'
                }}>
                  {session.transferReason === 'user_requested' && '用户主动请求'}
                  {session.transferReason === 'keyword_detected' && `关键词触发: ${session.keyword || ''}`}
                  {session.transferReason === 'ai_suggested' && 'AI建议转人工'}
                  {!session.transferReason && '未知'}
                </span>
              </p>
            </div>

            {/* ✅ 新增：AI 对话历史预览 */}
            {session.conversationHistory && session.conversationHistory.length > 0 && (
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '10px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  💬 AI 对话历史 ({session.conversationHistory.length} 条)
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {session.conversationHistory.map(msg => (
                    <li
                      key={msg.id}
                      style={{
                        padding: '6px 10px',
                        margin: '4px 0',
                        borderRadius: '4px',
                        backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                        fontSize: '13px'
                      }}
                    >
                      <strong style={{
                        color: msg.role === 'user' ? '#1976d2' : '#666'
                      }}>
                        {msg.role === 'user' ? '👤 用户' : '🤖 AI'}:
                      </strong>{' '}
                      <span style={{
                        wordBreak: 'break-word'
                      }}>
                        {msg.content.length > 100
                          ? msg.content.substring(0, 100) + '...'
                          : msg.content}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 没有对话历史时显示提示 */}
            {(!session.conversationHistory || session.conversationHistory.length === 0) && (
              <p style={{
                color: '#999',
                fontSize: '12px',
                fontStyle: 'italic',
                margin: '10px 0'
              }}>
                暂无 AI 对话记录
              </p>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => onAccept(session.sessionId)}
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✅ 接入
              </button>
              <button
                type="button"
                onClick={() => onReject(session.sessionId)}
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ❌ 拒绝
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
