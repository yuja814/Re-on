import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// 백엔드 GOOGLE_CLIENT_ID와 같은 웹 클라이언트 ID를 써야 ID 토큰 검증을 통과한다
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

/**
 * Google 계정 선택 창을 띄우고 ID 토큰을 받는다.
 * 사용자가 취소하면 null을 반환한다.
 */
export async function signInWithGoogle(): Promise<string | null> {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;

    const { idToken } = response.data;
    if (!idToken) throw new Error('Google ID 토큰을 받지 못했어요.');
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}

export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google 로그아웃에 실패해도 Re:on 로그아웃은 계속 진행한다
  }
}
