import { clearSession, getAccessToken } from '@/stores/auth-store';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
export type ApiErrorDetails = { playlistUrl?: string | null; confirmedTrackCount?: number };
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details: ApiErrorDetails = {}) { super(message); }
}
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown;
  query?: Record<string, string | number | undefined>; timeoutMs?: number;
};
export async function apiRequest<T>(path: string, { method = 'GET', body, query, timeoutMs = 30_000 }: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(query ?? {})) if(value !== undefined) params.set(key,String(value));
  const suffix = params.toString();
  const headers: Record<string,string> = { Accept: 'application/json' };
  if(body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAccessToken(); if(token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${path}${suffix?'?'+suffix:''}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    if(!response.ok) {
      const error = await response.json().catch(() => null);
      if(response.status === 401 && token && getAccessToken() === token) await clearSession();
      throw new ApiError(response.status,error?.code ?? 'UNKNOWN_ERROR',error?.message ?? '요청을 처리하지 못했어요.', {
        playlistUrl: typeof error?.playlistUrl === 'string' ? error.playlistUrl : undefined,
        confirmedTrackCount: typeof error?.confirmedTrackCount === 'number' ? error.confirmedTrackCount : undefined,
      });
    }
    if(response.status === 204) return undefined as T;
    return await response.json() as T;
  } catch(error) {
    if(error instanceof ApiError) throw error;
    throw new ApiError(0,'NETWORK_ERROR','서버 응답을 확인하지 못했어요. 생성 요청이었다면 새로 만들기 전에 기존 결과를 확인해주세요.');
  } finally { clearTimeout(timer); }
}
