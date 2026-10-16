// Google 로그인 라이브러리는 웹을 지원하지 않는다(유료 후원 버전만 지원).
// 웹에서는 화면 흐름을 확인할 수 있도록 개발용 토큰을 돌려준다.

export async function signInWithGoogle(): Promise<string | null> {
  if (!__DEV__) {
    throw new Error('웹에서는 Google 로그인을 지원하지 않아요.');
  }
  return 'dev-web-id-token';
}

export async function signOutFromGoogle() {}
