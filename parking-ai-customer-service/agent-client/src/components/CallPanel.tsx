import { useState, useEffect } from 'react';
import type { ConversationMessage, TakeoverAcceptResponse } from '../types';

interface CallPanelProps {
  activeCall: TakeoverAcceptResponse | null;
  history: ConversationMessage[];
  isMuted: boolean;
  rtcStatus: string;
  onHangup: () => void;
  onToggleMute: () => void;
}

export const CallPanel = ({
  activeCall,
  history,
  isMuted,
  rtcStatus,
  onHangup,
  onToggleMute
}: CallPanelProps) => {
  const [callDuration, setCallDuration] = useState(0);

  // ✅ 调试：打印传入的 history
  console.log('[CallPanel] Rendering with history:', {
    historyLength: history?.length || 0,
    history: history,
  });

  // 通话计时器
  useEffect(() => {
    if (!activeCall || rtcStatus !== 'joined') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCall, rtcStatus]);

  // 格式化时长（秒 -> mm:ss）
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeCall) {
    return (
      <section style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p style={{ color: '#666', textAlign: 'center' }}>当前没有接入中的会话</p>
      </section>
    );
  }

  return (
    <section style={{
      padding: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      marginTop: '20px',
      backgroundColor: '#f9fff9'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>
        🎙️ 通话中
      </h3>

      {/* 会话信息 */}
      <div style={{
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '15px'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>会话ID:</strong> {activeCall.sessionId}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>用户ID:</strong> {activeCall.userId}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>RTC 状态:</strong>
          <span style={{
            color: rtcStatus === 'joined' ? '#4CAF50' : '#ff9800',
            marginLeft: '10px'
          }}>
            {rtcStatus === 'joined' ? '✅ 已连接' : `⏳ ${rtcStatus}`}
          </span>
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>通话时长:</strong>
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginLeft: '10px',
            color: '#2196F3'
          }}>
            {formatDuration(callDuration)}
          </span>
        </p>
      </div>

      {/* 控制按钮 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <button
          type="button"
          onClick={onToggleMute}
          disabled={rtcStatus !== 'joined'}
          style={{
            flex: 1,
            padding: '12px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '6px',
            cursor: rtcStatus === 'joined' ? 'pointer' : 'not-allowed',
            backgroundColor: isMuted ? '#ff9800' : '#2196F3',
            color: 'white',
            fontWeight: 'bold',
            opacity: rtcStatus === 'joined' ? 1 : 0.5
          }}
        >
          {isMuted ? '🔇 取消静音' : '🎤 静音'}
        </button>

        <button
          type="button"
          onClick={onHangup}
          style={{
            flex: 1,
            padding: '12px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: '#f44336',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          📞 挂断
        </button>
      </div>

      {/* 对话历史 */}
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '15px',
        borderRadius: '6px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff' }}>💬 对话历史</h4>
        {history.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px' }}>暂无对话记录</p>
        ) : (
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {history.map(message => (
              <li
                key={message.id}
                style={{
                  padding: '8px 12px',
                  margin: '5px 0',
                  borderRadius: '4px',
                  backgroundColor: message.role === 'user' ? '#2196F3' : '#4a4a6a',
                  fontSize: '14px',
                  color: '#fff'
                }}
              >
                <strong style={{
                  color: message.role === 'user' ? '#bbdefb' : '#b0b0c0'
                }}>
                  {message.role === 'user' ? '👤 用户' : '🤖 AI'}:
                </strong>{' '}
                {message.content}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
