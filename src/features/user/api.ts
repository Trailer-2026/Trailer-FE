import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type {
  BlockedUser,
  MyProfile,
  MyReelsListResponse,
  ProfileImageFile,
} from "./types";

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
 * 내가 올린 릴스 목록(최신순). GET /api/users/me/reels
 *
 * 커서 페이징 — 응답의 next_cursor 를 그대로 다음 요청 cursor 로 넘긴다(null 이면 끝).
 * 렌더가 안 끝난 릴스는 서버가 빼고 준다. 401: 인증 필요.
 */
export async function getMyReels(
  cursor?: number | null,
): Promise<MyReelsListResponse> {
  const res = await api.get<CommonResponse<MyReelsListResponse>>(
    "/api/users/me/reels",
    { params: cursor != null ? { cursor } : undefined },
  );
  return res.data.data ?? { items: [], next_cursor: null };
}

/**
 * 내가 좋아요한 릴스 목록(누른 순). GET /api/users/me/reels/liked
 *
 * 별도 북마크 기능이 없어 릴스 좋아요가 곧 저장이다 — 하트를 해제하면 목록에서 빠진다.
 * 응답 형태·페이징 방식은 내 릴스 목록과 같다. 401: 인증 필요.
 */
export async function getLikedReels(
  cursor?: number | null,
  limit?: number,
): Promise<MyReelsListResponse> {
  const res = await api.get<CommonResponse<MyReelsListResponse>>(
    "/api/users/me/reels/liked",
    {
      params: {
        ...(cursor != null ? { cursor } : {}),
        ...(limit != null ? { limit } : {}),
      },
    },
  );
  return res.data.data ?? { items: [], next_cursor: null };
}

/**
 * 사용자 차단. POST /api/blocks/{user_idx}
 *
 * 단방향 — 차단하면 그 사용자의 릴스·댓글이 나에게만 안 보인다.
 * 이미 차단한 상대에게 다시 호출해도 성공(멱등)이라 중복 호출 방어가 필요 없다.
 * 400: 자기 자신 차단 / 404: 사용자 없음 / 401: 인증 필요.
 */
export async function blockUser(userIdx: number): Promise<void> {
  await api.post(`/api/blocks/${userIdx}`);
}

/**
 * 사용자 신고. POST /api/reports/{user_idx}
 *
 * 차단과 마찬가지로 단방향 — 신고하면 그 사용자의 릴스·댓글이 나에게만 안 보인다.
 * 멱등이라 이미 신고한 상대에게 다시 호출해도 성공한다.
 * 400: 자기 자신 신고 / 404: 사용자 없음 / 401: 인증 필요.
 */
export async function reportUser(userIdx: number): Promise<void> {
  await api.post<CommonResponse<null>>(`/api/reports/${userIdx}`);
}

/**
 * 내가 차단한 사용자 목록(최근 차단순). GET /api/blocks
 * data 가 null 이면 빈 목록으로 취급한다(차단 이력이 없는 계정).
 */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const res = await api.get<CommonResponse<BlockedUser[]>>("/api/blocks");
  return res.data.data ?? [];
}

/**
 * 차단 해제. DELETE /api/blocks/{user_idx}
 * 차단하지 않은 상대에게 호출해도 성공(멱등)이라 중복 탭 방어가 필요 없다.
 */
export async function unblockUser(userIdx: number): Promise<void> {
  await api.delete(`/api/blocks/${userIdx}`);
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
