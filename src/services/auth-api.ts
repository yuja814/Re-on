import type { Session } from '@/types/user';

// 백엔드 연동(POST /api/v1/auth/google) 전까지 사용하는 임시 구현
const MOCK_SESSION: Session = {
  accessToken: 'mock-access-token',
  user: {
    id: 1,
    name: 'mini',
    email: 'mini@gmail.com',
    profileImageUrl: null,
  },
};

/** Google ID 토큰으로 Re:on에 로그인하고 액세스 토큰과 사용자 정보를 받는다 */
export async function requestGoogleLogin(idToken: string): Promise<Session> {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!idToken) throw new Error('Google ID 토큰이 필요해요.');
  return MOCK_SESSION;
}
