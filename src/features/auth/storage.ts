import * as SecureStore from "expo-secure-store";

const KEY_ACCESS = "auth_access_token";
const KEY_REFRESH = "auth_refresh_token";

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_ACCESS);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_REFRESH);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
  ]);
}
