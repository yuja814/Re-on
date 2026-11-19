/** Web login uses the official Google button component and never fabricates ID tokens. */
export async function signInWithGoogle(): Promise<string | null> {
  throw new Error('Google 로그인 버튼을 사용해주세요.');
}
export async function signOutFromGoogle() {
  const google = (window as unknown as {google?: {accounts?: {id?: {disableAutoSelect:()=>void}}}}).google;
  google?.accounts?.id?.disableAutoSelect();
}
