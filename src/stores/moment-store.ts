import { useSyncExternalStore } from 'react';

import { MOCK_MOMENTS } from '@/mocks/moments';
import type { Moment } from '@/types/moment';

// API 연동 전까지 사용하는 임시 메모리 저장소. 앱을 새로고침하면 초기화된다.
let moments: Moment[] = MOCK_MOMENTS;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return moments;
}

export function useMoments() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useMoment(id: string | undefined) {
  return useMoments().find((moment) => moment.id === id);
}

export type MomentInput = Omit<Moment, 'id'>;

export async function createMoment(input: MomentInput) {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 300));

  const moment: Moment = { id: String(Date.now()), ...input };
  moments = [moment, ...moments];
  listeners.forEach((listener) => listener());
  return moment;
}

export type MomentUpdate =Pick<Moment, 'createdAt' | 'location' | 'memo'>;

export async function updateMoment(id: string, update: MomentUpdate) {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 300));

  moments = moments.map((moment) => (moment.id === id ? { ...moment, ...update } : moment));
  listeners.forEach((listener) => listener());
}

export async function deleteMoment(id: string) {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 300));

  moments = moments.filter((moment) => moment.id !== id);
  listeners.forEach((listener) => listener());
}
