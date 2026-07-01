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
  user_idx: number;
  provider: "google" | "kakao";
  email?: string | null;
};
