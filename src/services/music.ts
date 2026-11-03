import { apiRequest } from '@/services/api-client';
import type { SharedTrack } from '@/types/moment';

/** 백엔드 MusicResolveResponse */
type MusicResolveResponse = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
};

/** YouTube Music 자동 생성 채널은 "NCT 127 - Topic"처럼 오므로 아티스트명만 남긴다 */
export function toArtist(channelTitle: string) {
  return channelTitle.replace(/ - Topic$/, '');
}

/**
 * 공유된 YouTube Music 링크(https://music.youtube.com/watch?v=ID)로 곡 정보를 불러온다.
 * 지원하지 않는 링크면 에러를 던진다.
 */
export async function resolveTrack(url: string): Promise<SharedTrack> {
  const music = await apiRequest<MusicResolveResponse>('/music/resolve', {
    method: 'POST',
    body: { url },
  });

  return {
    videoId: music.videoId,
    title: music.title,
    artist: toArtist(music.channelTitle),
    albumCoverUrl: music.thumbnailUrl,
  };
}
