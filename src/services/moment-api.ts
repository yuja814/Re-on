import { apiRequest } from '@/services/api-client';
import { toArtist } from '@/services/music';
import type { Coordinates, Moment } from '@/types/moment';

/** 백엔드 MomentListResponse */
type MomentListResponse = {
  content: {
    id: number;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    memo: string | null;
    recordedAt: string;
  }[];
  nextCursor: string | null;
  hasNext: boolean;
};

/** 백엔드 MomentResponse (생성·상세) */
type MomentResponse = {
  id: number;
  music: {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    originalUrl: string;
  };
  memo: string | null;
  recordedAt: string;
  location: Coordinates | null;
};

/** 백엔드 MomentUpdateResponse */
type MomentUpdateResponse = {
  id: number;
  memo: string | null;
  updatedAt: string;
};

export type MomentPage = {
  moments: Moment[];
  nextCursor: string | null;
};

function toMoment(response: MomentResponse): Moment {
  return {
    id: String(response.id),
    track: {
      title: response.music.title,
      artist: toArtist(response.music.channelTitle),
      albumCoverUrl: response.music.thumbnailUrl,
    },
    createdAt: response.recordedAt,
    memo: response.memo || undefined,
    coordinates: response.location ?? undefined,
  };
}

/** 최신 기록부터 한 페이지씩 불러온다. 다음 페이지가 없으면 nextCursor가 null이다 */
export async function fetchMomentPage(cursor?: string): Promise<MomentPage> {
  const page = await apiRequest<MomentListResponse>('/moments', {
    query: { size: 30, cursor },
  });

  return {
    moments: page.content.map((item) => ({
      id: String(item.id),
      track: {
        title: item.title,
        artist: toArtist(item.channelTitle),
        albumCoverUrl: item.thumbnailUrl,
      },
      createdAt: item.recordedAt,
      memo: item.memo || undefined,
    })),
    nextCursor: page.hasNext ? page.nextCursor : null,
  };
}

export async function fetchMomentDetail(id: string) {
  return toMoment(await apiRequest<MomentResponse>(`/moments/${id}`));
}

export type MomentCreateRequest = {
  videoId: string;
  memo?: string;
  recordedAt: string;
  location?: Coordinates;
};

export async function postMoment(request: MomentCreateRequest) {
  return toMoment(await apiRequest<MomentResponse>('/moments', { method: 'POST', body: request }));
}

/** 서버는 메모만 수정할 수 있다. 빈 문자열을 보내면 메모가 지워진다 */
export async function patchMomentMemo(id: string, memo: string) {
  const response = await apiRequest<MomentUpdateResponse>(`/moments/${id}`, {
    method: 'PATCH',
    body: { memo },
  });
  return response.memo || undefined;
}

export function deleteMomentById(id: string) {
  return apiRequest<void>(`/moments/${id}`, { method: 'DELETE' });
}
