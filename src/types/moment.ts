export type Track = {
  title: string;
  artist: string;
  albumCoverUrl: string;
};

export type Moment = {
  id: string;
  track: Track;
  /** ISO 8601 */
  createdAt: string;
  memo?: string;
  location?: string;
};
