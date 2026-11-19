import { apiRequest } from '@/services/api-client';
import type { Session, User } from '@/types/user';

/** Google ID 토큰으로 Re:on에 로그인하고 액세스 토큰과 사용자 정보를 받는다 */
export function requestGoogleLogin(idToken: string) {
  return apiRequest<Session>('/auth/google', { method: 'POST', body: { idToken } });
}

/** 서버의 현재 세션을 끝낸다 */
export function requestLogout() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' });
}

/** 로그인한 사용자의 최신 정보를 불러온다 */
export function fetchMe() {
  return apiRequest<User>('/users/me');
}
