import { useSyncExternalStore } from 'react';

import type { Session, User } from '@/types/user';
import { deleteSession, readSession, writeSession } from '@/utils/session-storage';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session };

let state: SessionState = { status: 'loading' };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

// 앱을 다시 열어도 로그인이 유지되도록 저장된 세션을 불러온다
readSession().then((session) => {
  if (state.status === 'loading') {
    setState(session ? { status: 'signedIn', session } : { status: 'signedOut' });
  }
});

export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** API 요청에 붙일 토큰. 로그인하지 않았으면 undefined */
export function getAccessToken() {
  return state.status === 'signedIn' ? state.session.accessToken : undefined;
}

export async function saveSession(session: Session) {
  await writeSession(session);
  setState({ status: 'signedIn', session });
}

/** 로그인은 유지한 채 사용자 정보만 최신 값으로 바꾼다 */
export async function updateUser(user: User) {
  if (state.status !== 'signedIn') return;
  await saveSession({ ...state.session, user });
}

export async function clearSession() {
  await deleteSession();
  setState({ status: 'signedOut' });
}
