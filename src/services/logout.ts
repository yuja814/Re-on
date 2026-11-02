import { requestLogout } from '@/services/auth-api';
import { signOutFromGoogle } from '@/services/google-sign-in';
import { clearSession } from '@/stores/auth-store';
import { resetMoments } from '@/stores/moment-store';

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
    // 다른 계정으로 로그인했을 때 이전 기록이 보이지 않게 한다
    resetMoments();
  }
}
