export type Track = {
  title: string;
  artist: string;
  albumCoverUrl: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Moment = {
  id: string;
  track: Track;
  /** ISO 8601 */
  createdAt: string;
  memo?: string;
  /** 화면에 보여줄 주소 (예: 서울특별시 서초구) */
  location?: string;
  /** 위치 권한에 동의한 경우에만 저장된다 */
  coordinates?: Coordinates;
};
