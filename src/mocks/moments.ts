import type { Moment } from '@/types/moment';

// API 명세 확정 전까지 사용하는 임시 데이터
export const MOCK_MOMENTS: Moment[] = [
  {
    id: '1',
    track: {
      title: 'Blingy',
      artist: 'NCT 127',
      albumCoverUrl: 'https://picsum.photos/seed/reon-blingy/200',
    },
    createdAt: '2026-09-29T22:10:00+09:00',
    memo: '밸런스는 좋은데 여백이 많아',
    location: '서울특별시 서초구',
  },
  {
    id: '2',
    track: {
      title: 'Favorite',
      artist: 'NCT 127',
      albumCoverUrl: 'https://picsum.photos/seed/reon-favorite/200',
    },
    createdAt: '2026-09-29T08:15:00+09:00',
    memo: '등교하며 듣는 노래',
  },
  {
    id: '3',
    track: {
      title: 'Cherry Bomb',
      artist: 'NCT 127',
      albumCoverUrl: 'https://picsum.photos/seed/reon-cherry/200',
    },
    createdAt: '2026-09-23T18:42:00+09:00',
  },
  {
    id: '4',
    track: {
      title: 'Sticker',
      artist: 'NCT 127',
      albumCoverUrl: 'https://picsum.photos/seed/reon-sticker/200',
    },
    createdAt: '2026-09-18T23:30:00+09:00',
    memo: '공연 끝나고 집 가는 길에 계속 맴돌아서 다시 틀었다',
    location: '체조경기장',
  },
  {
    id: '5',
    track: {
      title: 'Ride or Die',
      artist: 'NCT 127',
      albumCoverUrl: 'https://picsum.photos/seed/reon-ride/200',
    },
    createdAt: '2026-08-30T21:05:00+09:00',
    memo: '여름 끝',
  },
];
