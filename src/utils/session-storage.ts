import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/types/user';

const SESSION_KEY = 'reon.session';

export async function readSession(): Promise<Session | null> {
  try {
    const value = await SecureStore.getItemAsync(SESSION_KEY);
    return value ? (JSON.parse(value) as Session) : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: Session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function deleteSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
