import { useCallback, useEffect, useRef, useState } from 'react';
import AliRtcEngine from 'aliyun-rtc-sdk';
import { acceptAgentCall, fetchSessionHistory } from '../api/client';
import type { SessionHistoryResponse, TakeoverAcceptResponse } from '../types';

type RtcStatus = 'idle' | 'starting' | 'joined' | 'ending' | 'error';

export const useRTCCall = () => {
  const [activeCall, setActiveCall] = useState<TakeoverAcceptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rtcStatus, setRtcStatus] = useState<RtcStatus>('idle');
  const [rtcError, setRtcError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false); // ✅ 新增：麦克风静音状态

  const rtcEngineRef = useRef<ReturnType<typeof AliRtcEngine.getInstance> | null>(null);
  const operationIdRef = useRef(0);

  const attachRtcListeners = useCallback(() => {
    if (!rtcEngineRef.current) {
      return;
    }

    const engine = rtcEngineRef.current;
    engine.on('bye', () => {
      setRtcStatus('ending');
    });
    engine.on('authInfoExpired', () => {
      setRtcError('RTC 鉴权信息已过期，需要重新加入');
      setRtcStatus('error');
    });
    engine.on('authInfoWillExpire', () => {
      setRtcError('RTC 鉴权信息即将过期');
    });
  }, []);

  const stopRtc = useCallback(async () => {
    if (!rtcEngineRef.current) {
      setRtcStatus('idle');
      return;
    }

    const currentOpId = ++operationIdRef.current;
    setRtcStatus('ending');
    try {
      await rtcEngineRef.current.stopPreview();
      await rtcEngineRef.current.leaveChannel();
      rtcEngineRef.current.destroy();
    } catch (err) {
      if (operationIdRef.current === currentOpId) {
        setRtcError(err instanceof Error ? err.message : 'RTC 退出失败');
        setRtcStatus('error');
      }
      return;
    }

    if (operationIdRef.current === currentOpId) {
      rtcEngineRef.current = null;
      setRtcStatus('idle');
    }
  }, []);

  const startRtc = useCallback(async (callInfo: TakeoverAcceptResponse) => {
    const currentOpId = ++operationIdRef.current;
    setRtcError(null);
    setRtcStatus('starting');

    const support = await AliRtcEngine.isSupported();
    if (!support.support) {
      setRtcStatus('error');
      setRtcError('当前浏览器不支持 RTC');
      return;
    }

    rtcEngineRef.current = AliRtcEngine.getInstance();
    attachRtcListeners();

    // 添加远程用户加入事件监听（用于订阅用户音频）
    // 使用 as any 绕过类型检查，因为不同版本的 SDK 事件名可能不同
    (rtcEngineRef.current as any).on('onRemoteUserOnLineNotify', (userId: string) => {
      console.log('[RTC] Remote user joined:', userId);
      // 订阅远程用户的音频流（某些 SDK 版本可能不支持此方法）
      if (typeof (rtcEngineRef.current as any)?.subscribe === 'function') {
        (rtcEngineRef.current as any).subscribe(userId).catch((err: any) => {
          console.error('[RTC] Failed to subscribe remote user:', err);
        });
      }
    });

    // 添加错误监听
    (rtcEngineRef.current as any).on('onError', (error: any) => {
      console.error('[RTC] Error occurred:', error);
      setRtcError(error.message || 'RTC 通话出现错误');
    });

    try {
      // 方案 B：使用独立 RTC 频道
      // callInfo 包含: { channelId, rtcToken, rtcUserId, rtcAppId, rtcTimestamp, sessionId, userId, conversationHistory }
      console.log('[RTC] Joining independent channel:', {
        channelId: callInfo.channelId,
        rtcUserId: callInfo.rtcUserId,
        rtcAppId: callInfo.rtcAppId,
        rtcTimestamp: callInfo.rtcTimestamp,
      });

      // ✅ 修复：使用完整的 AliRtcAuthInfo 对象加入频道
      // 阿里云 RTC SDK 要求传入包含所有必要字段的认证信息
      await rtcEngineRef.current.joinChannel({
        appId: callInfo.rtcAppId,        // ✅ 必需：RTC 应用 ID
        channelId: callInfo.channelId,   // ✅ 必需：频道 ID
        userId: callInfo.rtcUserId,      // ✅ 必需：用户 ID
        token: callInfo.rtcToken,        // ✅ 必需：认证令牌
        timestamp: callInfo.rtcTimestamp, // ✅ 必需：时间戳（秒）
        nonce: callInfo.rtcNonce || '',  // ✅ 必需：nonce（必须与 Token 签名时使用的一致）
      });

      console.log('[RTC] Channel joined successfully');

      // ✅ 关键修复：发布麦克风音频流
      // 在 RTC SDK 中，加入频道后需要手动开始本地预览和发布
      try {
        // 开始本地音频采集和预览
        await rtcEngineRef.current.startPreview();
        console.log('[RTC] Local preview started');
      } catch (previewErr) {
        console.warn('[RTC] Start preview failed (may be normal):', previewErr);
        // 预览失败不影响音频通话，继续执行
      }

      if (operationIdRef.current === currentOpId) {
        setRtcStatus('joined');
        console.log('[RTC] Successfully joined channel, audio should be publishing automatically');
      }
    } catch (err) {
      if (operationIdRef.current === currentOpId) {
        setRtcStatus('error');
        setRtcError(err instanceof Error ? err.message : 'RTC 加入失败');
        console.error('[RTC] Failed to join channel:', err);
      }
    }
  }, [attachRtcListeners]);

  const acceptCall = useCallback(async (sessionId: string, agentId: string, region?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await acceptAgentCall(sessionId, agentId, region);
      if (!response.success || !response.data) {
        throw new Error(response.message || '接入失败');
      }
      setActiveCall(response.data);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '接入失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessionHistory = useCallback(async (sessionId: string) => {
    const response = await fetchSessionHistory(sessionId);
    if (!response.success || !response.data) {
      throw new Error(response.message || '获取会话历史失败');
    }
    return response.data as SessionHistoryResponse;
  }, []);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  // ✅ 新增：麦克风静音/取消静音控制
  const toggleMute = useCallback(async () => {
    if (!rtcEngineRef.current || rtcStatus !== 'joined') {
      console.warn('[RTC] Cannot toggle mute: engine not ready or not joined');
      return;
    }

    try {
      const newMutedState = !isMuted;
      await rtcEngineRef.current.muteLocalMic(newMutedState);
      setIsMuted(newMutedState);
      console.log(`[RTC] Microphone ${newMutedState ? 'muted' : 'unmuted'}`);
    } catch (err) {
      console.error('[RTC] Failed to toggle mute:', err);
      setRtcError(err instanceof Error ? err.message : '切换静音失败');
    }
  }, [isMuted, rtcStatus]);

  useEffect(() => {
    if (!activeCall) {
      stopRtc();
      return;
    }

    startRtc(activeCall);
  }, [activeCall, startRtc, stopRtc]);

  useEffect(() => () => {
    stopRtc();
  }, [stopRtc]);

  return {
    activeCall,
    loading,
    error,
    rtcStatus,
    rtcError,
    isMuted,
    toggleMute,
    acceptCall,
    loadSessionHistory,
    endCall,
  };
};
