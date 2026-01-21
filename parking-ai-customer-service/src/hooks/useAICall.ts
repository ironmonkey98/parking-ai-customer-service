import { useEffect, useState, useCallback, useRef } from 'react';
import AICallEngine, {
  AICallAgentType,
  AICallAgentState
} from 'aliyun-auikit-aicall';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { io, Socket } from 'socket.io-client';

// 配置 API 基础地址 - 后端使用 HTTPS
const API_BASE_URL = `https://${window.location.hostname}:3000`;
axios.defaults.baseURL = API_BASE_URL;

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'ai';
  content: string;
  isPartial?: boolean;
}

export type TransferReason = 'user_requested' | 'ai_suggested' | 'keyword_detected';

export interface HumanTakeoverState {
  isTransferring: boolean;
  isWaitingHuman: boolean;
  sessionId: string | null;
  queuePosition: number;
  estimatedWaitTime: number;
}

export const useAICall = () => {
  const [engine, setEngine] = useState<AICallEngine | null>(null);
  const [agentState, setAgentState] = useState<AICallAgentState>(AICallAgentState.Listening);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [subtitle, setSubtitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 真人接管相关状态
  const [humanTakeover, setHumanTakeover] = useState<HumanTakeoverState>({
    isTransferring: false,
    isWaitingHuman: false,
    sessionId: null,
    queuePosition: 0,
    estimatedWaitTime: 0,
  });

  // 保存当前会话信息
  const currentInstanceIdRef = useRef<string | null>(null);
  const currentChannelIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // WebSocket 连接（方案 B：监听客服接入通知）
  const socketRef = useRef<Socket | null>(null);

  // 独立 RTC 客户端（用于与真人客服通话）
  const humanRtcClientRef = useRef<any | null>(null);
  const isHumanCallActiveRef = useRef<boolean>(false);

  // ✅ 新增：使用 ref 保存最新的 messages，避免闭包问题
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 关键词列表（触发转人工）
  const TRANSFER_KEYWORDS = ['人工客服', '转人工', '真人', '投诉', '人工'];
  
  useEffect(() => {
    const initEngine = async () => {
      try {
        const aiEngine = new AICallEngine();
        
        aiEngine.on('previewStarted', () => {
          console.log('Preview started');
        });

        aiEngine.on('callBegin', () => {
          setCallState('connected');
        });

        aiEngine.on('callEnd', () => {
          setCallState('ended');
          setAgentState(AICallAgentState.Listening);
        });

        aiEngine.on('agentStateChanged', (state: AICallAgentState) => {
          setAgentState(state);
        });

        aiEngine.on('userSubtitleNotify', (data: any) => {
          const text = data.text;
          setSubtitle(text);
          if (data.isSentenceEnd) {
             setMessages(prev => [...prev, {
               id: uuidv4(),
               role: 'user',
               content: text
             }]);
             setSubtitle('');

             // 关键词检测
             const matchedKeyword = TRANSFER_KEYWORDS.find(kw => text.includes(kw));
             if (matchedKeyword) {
               console.log(`[Keyword Detected]: ${matchedKeyword}`);
               // 自动触发转人工
               requestHumanTakeover('keyword_detected', matchedKeyword);
             }
          }
        });

        aiEngine.on('agentSubtitleNotify', (data: any) => {
          // ✅ 调试：打印事件数据，了解结构
          console.log('[AgentSubtitle]', {
            text: data.text,
            isSentenceEnd: data.isSentenceEnd,
            end: data.end,
            sentenceId: data.sentenceId,
          });

          if (data.text) {
            // 判断句子是否结束（兼容不同的属性名）
            const isSentenceEnd = data.isSentenceEnd || data.end || false;

            setMessages(prev => {
              const last = prev[prev.length - 1];

              // 如果上一条是 AI 的未完成消息，追加文字
              if (last && last.role === 'agent' && last.isPartial) {
                const updatedMessage = {
                  ...last,
                  content: last.content + data.text,
                  isPartial: !isSentenceEnd,
                };

                return [...prev.slice(0, -1), updatedMessage];
              }

              // 创建新的 AI 消息
              return [...prev, {
                id: uuidv4(),
                role: 'agent',
                content: data.text,
                isPartial: !isSentenceEnd
              }];
            });
          }
        });

        // 监听 AI 自定义消息（用于 AI 主动建议转人工）
        aiEngine.on('receivedAgentCustomMessage', (data: any) => {
          console.log('[AI Custom Message]:', data);

          if (data.type === 'transfer_to_human') {
            const shouldTransfer = window.confirm(
              'AI 建议转接人工客服，是否同意？\n' +
              (data.reason ? `原因：${data.reason}` : '')
            );

            if (shouldTransfer) {
              requestHumanTakeover('ai_suggested', undefined);
            }
          }
        });

        aiEngine.on('errorOccurred', (err: any) => {
          console.error('AICall Error:', err);
          setError(err.message || 'Unknown error');
          setCallState('ended');
        });

        setEngine(aiEngine);
      } catch (e: any) {
        setError(e.message);
      }
    };

    initEngine();
  }, []);

  const startCall = useCallback(async (userId: string) => {
    if (!engine) return;

    try {
      setCallState('connecting');
      setError(null);

      // 使用相对路径，通过 vite proxy 代理到后端
      const response = await axios.post('/api/start-call', {
        userId
      });

      console.log('[AICall] API Response:', response.data);

      const { rtcChannelId, rtcJoinToken, instanceId } = response.data;

      // 验证必要字段
      if (!instanceId || !rtcChannelId || !rtcJoinToken) {
        throw new Error('API 返回数据不完整: ' + JSON.stringify(response.data));
      }

      // 保存会话信息（用于转人工）
      currentInstanceIdRef.current = instanceId;
      currentChannelIdRef.current = rtcChannelId;
      currentUserIdRef.current = userId;

      // 先初始化引擎
      await engine.init(AICallAgentType.VoiceAgent);

      // 构造 agentInfo 对象 - 严格按照 SDK AICallAgentInfo 类型定义
      // 注意：agentType 是必需的！
      const agentInfo = {
        agentType: AICallAgentType.VoiceAgent,  // 必须指定智能体类型
        instanceId,
        channelId: rtcChannelId,
        rtcToken: rtcJoinToken,
        userId,
      };

      console.log('[AICall] Calling with agentInfo:', agentInfo);

      // 调用 call 方法
      await engine.call(userId, agentInfo);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to start call');
      setCallState('idle');
    }
  }, [engine]);

  /**
   * 请求转人工
   * @param reason 转人工原因
   * @param keyword 触发的关键词（可选）
   */
  const requestHumanTakeover = useCallback(async (
    reason: TransferReason,
    keyword?: string
  ) => {
    if (humanTakeover.isTransferring) {
      console.warn('[HumanTakeover] Already transferring, ignoring request');
      return;
    }

    if (!currentInstanceIdRef.current || !currentChannelIdRef.current || !currentUserIdRef.current) {
      setError('无法转人工：会话信息不完整');
      return;
    }

    try {
      setHumanTakeover(prev => ({ ...prev, isTransferring: true }));

      // 打印当前对话历史，用于调试
      // ✅ 使用 messagesRef.current 获取最新的消息列表
      const currentMessages = messagesRef.current;
      console.log(`[HumanTakeover] Requesting human takeover:`, {
        reason,
        keyword,
        instanceId: currentInstanceIdRef.current,
        messagesCount: currentMessages.length,
        messages: currentMessages, // ✅ 调试：打印完整消息内容
      });

      // 使用相对路径，通过 vite proxy 代理到后端
      const response = await axios.post('/api/request-human-takeover', {
        instanceId: currentInstanceIdRef.current,
        userId: currentUserIdRef.current,
        channelId: currentChannelIdRef.current,
        reason,
        keyword,
        conversationHistory: currentMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          // 排除 isPartial 等临时字段
        })),
      });

      const { data } = response.data;

      console.log('[HumanTakeover] Response:', data);

      setHumanTakeover({
        isTransferring: false,
        isWaitingHuman: true,
        sessionId: data.sessionId,
        queuePosition: data.queuePosition,
        estimatedWaitTime: data.estimatedWaitTime || 0,
      });

      // 添加系统消息
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'ai',
        content: data.queuePosition > 0
          ? `您前面还有 ${data.queuePosition} 位用户在等待，预计需要等待 ${Math.ceil(data.estimatedWaitTime / 60)} 分钟`
          : '正在为您转接人工客服，请稍候...',
      }]);

    } catch (e: any) {
      console.error('[HumanTakeover] Failed:', e);
      setError(e.response?.data?.message || '转人工失败，请稍后重试');
      setHumanTakeover(prev => ({ ...prev, isTransferring: false }));
    }
  }, [humanTakeover.isTransferring, messages]);

  /**
   * 切换到独立 RTC 频道（与真人客服通话）
   * 方案 B：用户断开 AI 频道，加入新的独立频道
   */
  const switchToHumanChannel = useCallback(async (
    channelId: string,
    rtcToken: string,
    userId: string,
    rtcNonce: string,
    rtcTimestamp: number,
    rtcAppId: string
  ) => {
    try {
      console.log('[SwitchChannel] Switching to human agent channel:', {
        channelId,
        userId,
        rtcAppId,
      });

      // 1. 断开 AI 通话引擎
      if (engine) {
        console.log('[SwitchChannel] Hanging up AI call...');
        await engine.handup().catch(err => {
          console.warn('[SwitchChannel] Failed to hangup AI call:', err);
        });
      }

      // 2. 动态导入阿里云 RTC SDK
      const AliRtcEngine = await import('aliyun-rtc-sdk').then(m => m.default);

      // 创建 RTC 客户端
      const rtcClient = AliRtcEngine.getInstance();

      humanRtcClientRef.current = rtcClient;

      // 配置 RTC 客户端事件
      rtcClient.on('onJoinChannelResult', (result: any) => {
        console.log('[RTC] Joined human channel:', result);
        isHumanCallActiveRef.current = true;

        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'ai',
          content: '已成功接通人工客服，正在通话中...',
        }]);
      });

      rtcClient.on('onLeaveChannelResult', () => {
        console.log('[RTC] Left human channel');
        isHumanCallActiveRef.current = false;
      });

      rtcClient.on('onRemoteUserOnLineNotify', (remoteUserId: string) => {
        console.log('[RTC] Remote user online:', remoteUserId);

        // 订阅远程音频流（客服的声音）
        rtcClient.subscribe(remoteUserId).catch((err: any) => {
          console.error('[RTC] Failed to subscribe:', err);
        });
      });

      rtcClient.on('onError', (error: any) => {
        console.error('[RTC] Error:', error);
        setError('与客服通话出现错误: ' + (error.message || '未知错误'));
      });

      // 加入频道 - 使用完整的认证信息对象
      console.log('[SwitchChannel] Joining channel with auth info...');
      await rtcClient.joinChannel({
        appId: rtcAppId,
        channelId: channelId,
        userId: userId,
        token: rtcToken,
        timestamp: rtcTimestamp,
        nonce: rtcNonce,
      });

      // 开始本地预览（发布麦克风）
      try {
        await rtcClient.startPreview();
        console.log('[RTC] Local preview started');
      } catch (previewErr) {
        console.warn('[RTC] Start preview failed (may be normal):', previewErr);
      }

      console.log('[SwitchChannel] Successfully switched to human channel');

    } catch (error: any) {
      console.error('[SwitchChannel] Failed to switch channel:', error);
      setError('切换到人工客服失败: ' + (error.message || '未知错误'));

      // 恢复状态
      setHumanTakeover(prev => ({
        ...prev,
        isWaitingHuman: false,
        isTransferring: false,
      }));
    }
  }, [engine]);

  // ====================================================
  // 方案 B：WebSocket 监听客服接入通知
  // 使用 ref 保存回调函数，避免 useEffect 频繁重建连接
  // ====================================================
  const switchToHumanChannelRef = useRef(switchToHumanChannel);
  const engineRef = useRef(engine);
  const isSwitchingChannelRef = useRef(false); // ✅ 新增：防止重复切换频道

  // 保持 ref 同步
  useEffect(() => {
    switchToHumanChannelRef.current = switchToHumanChannel;
  }, [switchToHumanChannel]);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    // 后端使用 HTTPS，强制使用 https 协议连接
    const wsUrl = `https://${window.location.hostname}:3000`;

    console.log('[WebSocket] Connecting to:', wsUrl);

    // 初始化 WebSocket 连接（不自动重连以避免 StrictMode 问题）
    const socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected, socket id:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected, reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    // 监听客服接入成功事件（方案 B）
    socket.on('takeover-success', async (data: any) => {
      console.log('[Takeover Success] Received:', data);

      // ✅ 防止重复处理
      if (isSwitchingChannelRef.current) {
        console.log('[Takeover Success] Already switching channel, ignoring duplicate event');
        return;
      }

      // 检查是否是当前用户的转人工请求
      if (data.userId && currentUserIdRef.current && data.userId !== currentUserIdRef.current) {
        console.log('[Takeover Success] Not for current user, ignoring');
        return;
      }

      // 检查是否是方案 B（独立频道）
      if (data.rtcInfo?.channelId && data.rtcInfo?.userToken) {
        console.log('[Plan B] Received independent RTC channel info:', {
          channelId: data.rtcInfo.channelId,
          agentName: data.agentInfo?.name,
          hasNonce: !!data.rtcInfo.userNonce,
          hasTimestamp: !!data.rtcInfo.timestamp,
          hasAppId: !!data.rtcInfo.appId,
        });

        // ✅ 标记正在切换频道
        isSwitchingChannelRef.current = true;

        // 更新状态
        setHumanTakeover(prev => ({
          ...prev,
          isWaitingHuman: false,
          isTransferring: true, // 正在切换频道
        }));

        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'ai',
          content: `已为您接通人工客服 ${data.agentInfo?.name || ''}，正在建立连接...`,
        }]);

        // 切换到独立 RTC 频道
        if (currentUserIdRef.current && data.rtcInfo.userNonce && data.rtcInfo.timestamp && data.rtcInfo.appId) {
          try {
            await switchToHumanChannelRef.current(
              data.rtcInfo.channelId,
              data.rtcInfo.userToken,
              currentUserIdRef.current,
              data.rtcInfo.userNonce,
              data.rtcInfo.timestamp,
              data.rtcInfo.appId
            );

            // 切换完成
            setHumanTakeover(prev => ({
              ...prev,
              isTransferring: false,
            }));

            setCallState('connected'); // 保持连接状态
            console.log('[Takeover Success] Channel switch completed');
          } catch (error) {
            console.error('[Takeover Success] Failed to switch channel:', error);
            setError('切换到人工客服频道失败');
            setHumanTakeover(prev => ({
              ...prev,
              isTransferring: false,
            }));
          } finally {
            // ✅ 无论成功失败，都重置标记
            isSwitchingChannelRef.current = false;
          }
        } else {
          console.error('[Takeover Success] Missing required RTC info:', {
            userId: currentUserIdRef.current,
            userNonce: data.rtcInfo.userNonce,
            timestamp: data.rtcInfo.timestamp,
            appId: data.rtcInfo.appId,
          });
          isSwitchingChannelRef.current = false;
        }
      }
    });

    // 不在 cleanup 中立即断开，让连接保持稳定
    return () => {
      // 延迟断开，避免 StrictMode 双重挂载导致的问题
      setTimeout(() => {
        if (socketRef.current === socket) {
          console.log('[WebSocket] Cleanup: disconnecting');
          socket.disconnect();
        }
      }, 100);
    };
  }, []); // ✅ 空依赖数组，只在组件挂载时创建一次连接

  const endCall = useCallback(async () => {
    // 1. 断开 AI 通话引擎
    if (engine) {
      await engine.handup();
      setCallState('ended');
    }

    // 2. 断开独立 RTC 频道（如果正在与真人客服通话）
    if (humanRtcClientRef.current && isHumanCallActiveRef.current) {
      try {
        console.log('[EndCall] Leaving human RTC channel...');
        await humanRtcClientRef.current.leaveChannel();
        humanRtcClientRef.current = null;
        isHumanCallActiveRef.current = false;
      } catch (err) {
        console.warn('[EndCall] Failed to leave human channel:', err);
      }
    }

    // 3. 断开 WebSocket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // 4. 重置状态
    setHumanTakeover({
      isTransferring: false,
      isWaitingHuman: false,
      sessionId: null,
      queuePosition: 0,
      estimatedWaitTime: 0,
    });
  }, [engine]);

  return {
    engine,
    startCall,
    endCall,
    callState,
    agentState,
    messages,
    subtitle,
    error,
    // 真人接管相关
    requestHumanTakeover,
    humanTakeover,
  };
};
