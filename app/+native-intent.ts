import { clearSharedPayloads, getSharedPayloads } from 'expo-sharing';

import { extractSharedYouTubeLink } from '@/utils/youtube-link';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (new URL(path, 'reon://app').hostname !== 'expo-sharing') return path;
    const values = getSharedPayloads()
      .filter((payload) => !payload.shareType || payload.shareType === 'url' || payload.shareType === 'text')
      .map((payload) => payload.value ?? '');
    const url = extractSharedYouTubeLink(values);
    clearSharedPayloads();
    return url
      ? `/moment/new?url=${encodeURIComponent(url)}&shareId=${Date.now()}`
      : '/moment/new?shareError=unsupported';
  } catch {
    return '/moment/new?shareError=unsupported';
  }
}
