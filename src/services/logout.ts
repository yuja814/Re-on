import { signOutFromGoogle } from '@/services/google-sign-in';
import { clearSession } from '@/stores/auth-store';

// 백엔드 연동(POST /api/v1/auth/logout) 전까지 사용하는 임시 구현
async function requestLogout() {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * 현재 기기의 Re:on 세션을 끝낸다.
 * 서버 요청이 실패해도 기기에 저장된 로그인 정보는 지워 로그아웃 상태로 만든다.
 */
export async function logout() {
  try {
    await requestLogout();
  } finally {
    await signOutFromGoogle();
    await clearSession();
  }
}
