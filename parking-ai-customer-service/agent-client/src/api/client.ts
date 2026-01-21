import axios from 'axios';
import type { SessionHistoryResponse, TakeoverAcceptResponse } from '../types';

// 自动检测主机地址和协议，支持局域网远程访问
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const protocol = window.location.protocol; // http: 或 https:
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3000`;
};

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

export async function acceptAgentCall(sessionId: string, agentId: string, region?: string) {
  const response = await api.post('/api/agent-accept-call', {
    sessionId,
    agentId,
    region,
  });

  return response.data as {
    success: boolean;
    message?: string;
    data?: TakeoverAcceptResponse;
  };
}

export async function fetchSessionHistory(sessionId: string) {
  const response = await api.get(`/api/session-history/${sessionId}`);
  return response.data as {
    success: boolean;
    data?: SessionHistoryResponse;
    message?: string;
  };
}
