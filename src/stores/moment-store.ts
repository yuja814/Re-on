import { useSyncExternalStore } from 'react';

import {
  deleteMomentById,
  fetchMomentDetail,
  fetchMomentPage,
  patchMomentMemo,
  postMoment,
} from '@/services/moment-api';
import type { Moment, SharedTrack } from '@/types/moment';
import { toAddress } from '@/utils/location';

export type MomentListState = {
  moments: Moment[];
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  /** 다음 페이지 요청에 쓸 커서. 더 불러올 기록이 없으면 null */
  nextCursor: string | null;
  isLoadingMore: boolean;
};

const INITIAL_STATE: MomentListState = {
  moments: [],
  status: 'idle',
  nextCursor: null,
  isLoadingMore: false,
};

// 서버에서 불러온 Moment를 화면끼리 공유하기 위한 저장소
let state = INITIAL_STATE;
const listeners = new Set<() => void>();

function setState(next: Partial<MomentListState>) {
  state = { ...state, ...next };
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

export function useMomentList() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useMoment(id: string | undefined) {
  return useMomentList().moments.find((moment) => moment.id === id);
}

function replaceMoment(id: string, update: Partial<Moment>) {
  setState({
    moments: state.moments.map((moment) => (moment.id === id ? { ...moment, ...update } : moment)),
  });
}

/** 첫 페이지부터 다시 불러온다 (첫 진입, 당겨서 새로고침) */
export async function loadMoments() {
  setState({ status: state.status === 'loaded' ? 'loaded' : 'loading' });
  try {
    const page = await fetchMomentPage();
    setState({ moments: page.moments, nextCursor: page.nextCursor, status: 'loaded' });
  } catch {
    setState({ status: state.status === 'loaded' ? 'loaded' : 'failed' });
  }
}

/** 목록 끝에 닿으면 다음 페이지를 이어 붙인다 */
export async function loadMoreMoments() {
  if (!state.nextCursor || state.isLoadingMore) return;

  setState({ isLoadingMore: true });
  try {
    const page = await fetchMomentPage(state.nextCursor);
    const loadedIds = new Set(state.moments.map((moment) => moment.id));
    setState({
      moments: [...state.moments, ...page.moments.filter((moment) => !loadedIds.has(moment.id))],
      nextCursor: page.nextCursor,
    });
  } catch {
    // 실패하면 커서를 그대로 두어 다음 스크롤 때 다시 시도한다
  } finally {
    setState({ isLoadingMore: false });
  }
}

/** 상세 정보(위치 포함)를 불러와 저장소에 반영한다. 목록에 없던 기록이면 추가한다 */
export async function loadMoment(id: string) {
  const moment = await fetchMomentDetail(id);
  const location = moment.coordinates ? await toAddress(moment.coordinates) : undefined;
  const detailed = { ...moment, location };

  if (state.moments.some((item) => item.id === id)) {
    replaceMoment(id, detailed);
  } else {
    setState({ moments: [...state.moments, detailed] });
  }
  return detailed;
}

export type MomentInput = Pick<Moment, 'createdAt' | 'memo' | 'location' | 'coordinates'> & {
  track: SharedTrack;
};

export async function createMoment({ track, memo, createdAt, location, coordinates }: MomentInput) {
  const moment = await postMoment({
    videoId: track.videoId,
    memo,
    recordedAt: createdAt,
    location: coordinates,
  });

  // 서버는 주소를 저장하지 않으므로 기록할 때 변환한 주소를 그대로 보여준다
  const created = { ...moment, location };
  setState({ moments: [created, ...state.moments] });
  return created;
}

export async function updateMomentMemo(id: string, memo: string) {
  replaceMoment(id, { memo: await patchMomentMemo(id, memo) });
}

export async function deleteMoment(id: string) {
  await deleteMomentById(id);
  setState({ moments: state.moments.filter((moment) => moment.id !== id) });
}

/** 로그아웃하면 이전 계정의 기록을 비운다 */
export function resetMoments() {
  setState(INITIAL_STATE);
}
