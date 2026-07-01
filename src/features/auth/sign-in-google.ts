import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { loginGoogle } from "./api";
import { useAuthStore } from "./store";

export type GoogleSignInError =
  | { type: "cancelled" }
  | { type: "play_services_unavailable" }
  | { type: "invalid_token" }
  | { type: "unknown"; message: string };

export async function signInWithGoogle(): Promise<void> {
  let idToken: string;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw { type: "cancelled" } satisfies GoogleSignInError;
    }
    if (!response.data.idToken) {
      // webClientId 미설정 시 idToken이 null로 반환됨
      throw {
        type: "unknown",
        message: "idToken is null. webClientId 설정을 확인하세요.",
      } satisfies GoogleSignInError;
    }
    idToken = response.data.idToken;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "type" in err) throw err;
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        throw { type: "cancelled" } satisfies GoogleSignInError;
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw { type: "play_services_unavailable" } satisfies GoogleSignInError;
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    throw { type: "unknown", message } satisfies GoogleSignInError;
  }

  try {
    const tokens = await loginGoogle(idToken);
    await useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
  } catch (err: unknown) {
    // TEMP: 백엔드 응답 진단용 로깅 (원인 파악 후 제거)
    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    console.error("[loginGoogle FAIL]", {
      status: axiosErr?.response?.status,
      data: axiosErr?.response?.data,
      message: axiosErr?.message,
      idTokenHead: idToken.slice(0, 40) + "...",
    });
    const status = axiosErr?.response?.status;
    if (status === 400) {
      throw { type: "invalid_token" } satisfies GoogleSignInError;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw { type: "unknown", message } satisfies GoogleSignInError;
  }
}
