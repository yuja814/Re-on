import type { Track } from '@/types/moment';

// 음악 정보 API(/api/v1/music/resolve) 연동 전까지 어떤 링크든 같은 곡으로 응답한다
const MOCK_TRACK: Track = {
  title: 'Fact Check',
  artist: 'NCT 127',
  albumCoverUrl: 'https://picsum.photos/seed/reon-fact-check/200',
};

/** music.youtube.com/watch?v=ID, youtu.be/ID 형식의 공유 링크에서 곡 ID를 꺼낸다 */
export function parseVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const id =
      parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

/** 공유된 링크로 곡 정보를 불러온다. 지원하지 않는 링크면 에러를 던진다. */
export async function resolveTrack(url: string): Promise<Track> {
  // 실제 API 호출을 흉내 내기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 500));

  const videoId = parseVideoId(url);
  if (!videoId) {
    throw new Error('지원하지 않는 공유 링크');
  }
  return MOCK_TRACK;
}
