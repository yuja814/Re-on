/** 백엔드 UserResponse와 같은 형태 */
export type User = {
  id: number;
  name: string;
  email: string;
  profileImageUrl: string | null;
};

export type Session = {
  accessToken: string;
  user: User;
};
