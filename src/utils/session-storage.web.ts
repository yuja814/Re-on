import type { Session } from '@/types/user';

// expo-secure-store는 웹을 지원하지 않아 웹에서는 localStorage에 저장한다
const SESSION_KEY = 'reon.session';

export async function readSession(): Promise<Session | null> {
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as Session) : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // 저장소를 쓸 수 없으면 이번 실행 동안만 로그인 상태를 유지한다
  }
}

export async function deleteSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // 지울 저장소가 없으면 그대로 둔다
  }
}
