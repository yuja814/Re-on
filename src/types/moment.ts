export type Track = {
  title: string;
  artist: string;
  albumCoverUrl: string;
};

/** 공유 링크로 불러온 곡. Moment를 저장할 때 YouTube 영상 ID가 필요하다 */
export type SharedTrack = Track & {
  videoId: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Moment = {
  id: string;
  track: Track;
  /** 음악을 들은 시각 (ISO 8601, 백엔드 recordedAt) */
  createdAt: string;
  memo?: string;
  /** 화면에 보여줄 주소 (예: 서울특별시 서초구). 서버는 좌표만 저장하므로 기기에서 변환한다 */
  location?: string;
  /** 위치 권한에 동의한 경우에만 저장된다. 목록 조회에는 오지 않고 상세 조회에서 채워진다 */
  coordinates?: Coordinates;
};
