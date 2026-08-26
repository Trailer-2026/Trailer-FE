export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type UserProfile = {
  user_idx: number;
  provider: "google" | "kakao" | "demo";
  email?: string | null;
};
