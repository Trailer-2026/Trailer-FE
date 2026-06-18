export type CommonResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type UserProfile = {
  id: number;
  email?: string;
  nickname?: string;
};
