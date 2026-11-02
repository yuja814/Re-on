import { clearSession, getAccessToken } from '@/stores/auth-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/** 응답이 너무 늦으면 실패로 보고 화면에서 다시 시도할 수 있게 한다 */
const TIMEOUT_MS = 10_000;

/** 백엔드 ErrorResponse({ code, message })를 담는 에러 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

/**
 * Re:on 백엔드(/api/v1)에 요청을 보낸다.
 * 로그인 상태면 Authorization 헤더를 붙이고, 401이 오면 세션을 지워 로그인 화면으로 보낸다.
 */
export async function apiRequest<T>(path: string, { method = 'GET', body, query }: RequestOptions = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const queryString = params.toString();
  const url = `${BASE_URL}/api/v1${path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const accessToken = getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결하지 못했어요.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    if (response.status === 401 && accessToken) {
      // 만료되었거나 로그아웃된 토큰이면 다시 로그인하게 한다
      await clearSession();
    }
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? '요청을 처리하지 못했어요.',
    );
  }

  // 204 No Content (예: Moment 삭제)
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
