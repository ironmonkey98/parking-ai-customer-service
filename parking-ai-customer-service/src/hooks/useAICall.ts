import { useEffect, useState, useCallback } from 'react';
import AICallEngine, { 
  AICallAgentType, 
  AICallAgentState 
} from 'aliyun-auikit-aicall';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  isPartial?: boolean;
}

export const useAICall = () => {
  const [engine, setEngine] = useState<AICallEngine | null>(null);
  const [agentState, setAgentState] = useState<AICallAgentState>(AICallAgentState.Listening);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [subtitle, setSubtitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
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
          }
        });

        aiEngine.on('agentSubtitleNotify', (data: any) => {
          if (data.text) {
             setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'agent' && last.isPartial) {
                   return [...prev.slice(0, -1), { ...last, content: last.content + data.text }];
                }
                return [...prev, { id: uuidv4(), role: 'agent', content: data.text, isPartial: true }];
             });
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

      const response = await axios.post('http://localhost:4000/api/start-call', {
        userId
      });

      const { rtcChannelId, rtcJoinToken, agentId, instanceId } = response.data;

      await engine.init(AICallAgentType.VoiceAgent);
      
      const config = {
        userId,
        agentInfo: {
          agentId,
          instanceId,
          type: AICallAgentType.VoiceAgent,
          channelConfig: {
            channelId: rtcChannelId,
            joinToken: rtcJoinToken,
            token: rtcJoinToken
          }
        }
      };

      await engine.call(config.userId, config.agentInfo, config);

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to start call');
      setCallState('idle');
    }
  }, [engine]);

  const endCall = useCallback(async () => {
    if (engine) {
      await engine.handup();
      setCallState('ended');
    }
  }, [engine]);

  return {
    engine,
    startCall,
    endCall,
    callState,
    agentState,
    messages,
    subtitle,
    error
  };
};
