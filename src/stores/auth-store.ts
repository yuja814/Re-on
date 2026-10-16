import { useSyncExternalStore } from 'react';

import type { Session } from '@/types/user';
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

export async function saveSession(session: Session) {
  await writeSession(session);
  setState({ status: 'signedIn', session });
}

export async function clearSession() {
  await deleteSession();
  setState({ status: 'signedOut' });
}
