export type AgentStatus = 'online' | 'busy' | 'offline';

export interface SessionSummary {
  sessionId: string;
  userId: string;
  instanceId: string;
  channelId: string;
  conversationHistory?: ConversationMessage[];
  transferReason?: string;
  keyword?: string;
  enqueuedAt?: string;
  status?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'agent' | 'ai';
  content: string;
  isPartial?: boolean;
}

export interface AgentInfo {
  agentId: string;
  name: string;
}

export interface TakeoverAcceptResponse {
  sessionId: string;
  channelId: string;
  rtcToken: string;
  rtcUserId: string;
  rtcAppId: string;      // ✅ RTC AppId，加入频道必需
  rtcTimestamp: number;  // ✅ Token 有效期时间戳（秒）
  rtcNonce: string;      // ✅ Token 签名使用的 nonce（必须以 AK- 开头）
  conversationHistory?: ConversationMessage[];
  userId: string;
}

export interface SessionHistoryResponse {
  sessionId: string;
  userId: string;
  status?: string;
  conversationHistory?: ConversationMessage[];
  transferReason?: string;
  agentId?: string;
}
