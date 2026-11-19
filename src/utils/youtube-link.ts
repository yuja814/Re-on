const WATCH_HOSTS = new Set(['music.youtube.com', 'youtube.com', 'www.youtube.com', 'm.youtube.com']);
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Keep only the video ID; playlist, tracking and radio parameters are not a Moment. */
export function normalizeYouTubeLink(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    let id: string;
    if (url.hostname === 'youtu.be') {
      id = url.pathname.slice(1);
    } else {
      if (!WATCH_HOSTS.has(url.hostname) || url.pathname !== '/watch') return null;
      const ids = url.searchParams.getAll('v');
      if (ids.length !== 1) return null;
      id = ids[0];
    }
    return VIDEO_ID.test(id) ? `https://music.youtube.com/watch?v=${id}` : null;
  } catch {
    return null;
  }
}

/** Some apps share a title and a URL together. Never silently choose between different videos. */
export function extractSharedYouTubeLink(values: string[]): string | null {
  const links = new Set<string>();
  for (const value of values) {
    const candidates = value.match(/https:\/\/[^\s<>"']+/gi) ?? [];
    for (const candidate of candidates) {
      const link = normalizeYouTubeLink(candidate.replace(/[).,!?\]]+$/, ''));
      if (link) links.add(link);
    }
  }
  return links.size === 1 ? [...links][0] : null;
}
