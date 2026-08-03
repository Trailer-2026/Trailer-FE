import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type { MyProfile, ProfileImageFile } from "./types";

/**
 * 내 프로필 조회. 내 정보 탭 진입 시 호출.
 * auth/me 와 겹치는 필드(email·provider)까지 전부 포함하므로, 이 화면은 이거 하나면 된다.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getMyProfile(): Promise<MyProfile> {
  const res = await api.get<CommonResponse<MyProfile>>("/api/users/me/profile");
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 닉네임 변경(1~20자). 갱신된 프로필을 반환한다.
 * 422: 길이 등 검증 실패 → 호출부에서 안내.
 */
export async function updateNickname(nickname: string): Promise<MyProfile> {
  const res = await api.patch<CommonResponse<MyProfile>>(
    "/api/users/me/nickname",
    { nickname },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 프로필 사진 변경. 이미지 파일을 multipart/form-data 로 업로드한다.
 * 이미지가 아니거나 10MB 초과면 서버가 400 을 반환 → 호출부에서 안내.
 *
 * timeout 은 전역 10s 로는 업로드에 부족할 수 있어 30s 로 override 한다.
 */
export async function updateProfileImage(
  file: ProfileImageFile,
): Promise<MyProfile> {
  const form = new FormData();
  // RN 의 FormData 는 { uri, name, type } 객체를 파일 파트로 인식한다. 필드명은 스펙상 "image".
  form.append("image", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  // Content-Type 을 직접 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해
  // multipart/form-data 와 boundary 를 자동으로 붙인다. 여기서 손대면 boundary 가 빠져 깨진다.
  const res = await api.patch<CommonResponse<MyProfile>>(
    "/api/users/me/profile-image",
    form,
    { timeout: 30000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
