import { File, Paths } from "expo-file-system";

import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";
import { getAccessToken } from "@/src/features/auth/storage";

import type { ReelsMediaAsset } from "@/src/features/reels/types";
import { preparePhotoForUpload } from "./photo-upload";
import type {
  BgmTrackResponse,
  ReelsUploadResponse,
  ReelsVideoUrlResponse,
  RenderOptions,
  VideoEditResponse,
  VideoRenderStatusResponse,
} from "./types";

/**
 * 영상에 입힐 수 있는 BGM 트랙 목록. GET /api/videos/bgm.
 * (경로는 추정 — 실제와 다르면 여기만 수정) file 값을 렌더 요청 bgm 으로 그대로 쓴다.
 */
export async function getBgmTracks(): Promise<BgmTrackResponse[]> {
  const res = await api.get<CommonResponse<BgmTrackResponse[]>>(
    "/api/videos/bgm",
  );
  return res.data.data ?? [];
}

/**
 * 사진→영상 렌더 시작. POST /api/videos/render/photos-ordered (multipart/form-data).
 *
 * photos-only 와 달리 **촬영 시각을 무시하고 보낸 순서 그대로** 지점을 이동한다 —
 * 화면 하단 타임라인의 드래그 순서가 곧 영상 순서다. GPS 좌표는 여전히 필요하고,
 * GPS 없는 사진은 서버가 알아서 뺀다.
 *
 * - photos: 업로드 전 각 사진을 리사이즈·압축한다(preparePhotoForUpload) — 원본을 그대로
 *   올리면 본문이 커져 413 이 난다. 리사이즈로 사라진 EXIF GPS·촬영시각은 앱이 가진
 *   좌표로 재주입한다. 백엔드가 EXIF 로 GPS 를 읽어 이동 경로를 만든다.
 * - 텍스트 옵션: theme, bgm(빈 값이면 무음 → 미전송), 출발지(선택, 위·경도 함께).
 *   엔진은 항상 modal, 인트로/아웃트로는 항상 붙어 전송 필드가 없다.
 * - Content-Type 은 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해 boundary 자동 부착.
 * - 리사이즈 + 여러 사진 업로드가 전역 10s 를 넘길 수 있어 timeout 을 60s 로 override.
 *
 * 응답: reels_idx 즉시 반환(status=running). 이후 getRenderStatus 로 폴링.
 * 400: 사진 2장 미만 / GPS 있는 사진 2장 미만 / 모두 같은 장소 / 알 수 없는 테마 /
 *      출발지 좌표 오류 → 서버 message 를 그대로 사용자에게 노출. 401 / 404(BGM 없음).
 */
export async function renderPhotosOrdered(
  photos: ReelsMediaAsset[],
  options: RenderOptions,
): Promise<VideoRenderStatusResponse> {
  const form = new FormData();

  // 각 사진 리사이즈·압축 + EXIF 재주입(병렬). Promise.all 은 입력 순서를 보존하므로
  // 아래 append 순서 = 사용자가 정렬한 순서 = 영상 순서다.
  const files = await Promise.all(
    photos.map((photo, index) => preparePhotoForUpload(photo, index)),
  );
  files.forEach((file) => {
    form.append("photos", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  });

  form.append("theme", options.theme);
  // 빈 값(무음)은 아예 보내지 않는다(잘못된 곡명이면 404 이므로).
  if (options.bgm) form.append("bgm", options.bgm);
  if (options.title?.trim()) form.append("title", options.title.trim());
  // 출발지는 위·경도 둘 다 있을 때만.
  if (options.start_latitude != null && options.start_longitude != null) {
    form.append("start_name", options.start_name ?? "출발");
    form.append("start_latitude", String(options.start_latitude));
    form.append("start_longitude", String(options.start_longitude));
  }

  const res = await api.post<CommonResponse<VideoRenderStatusResponse>>(
    "/api/videos/render/photos-ordered",
    form,
    { timeout: 60000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 여행 일정으로 영상 렌더 시작. POST /api/videos/render/travel (urlencoded).
 *
 * 사진을 올리는 photos-ordered 와 달리 재료가 이미 서버에 있다 — 여행 일정(day_no,
 * sequence) 순서로 이동 경로를 그리고, 일정에 붙여 둔 사진을 그 지점에서 보여준다.
 * (직전 지점 기준 1km 미만인 연속 일정은 한 지점으로 묶이고, 기차 일정은 출발역 좌표가
 *  경유 지점이 된다. 다운로드에 실패한 이미지는 건너뛴다.)
 *
 * 응답은 즉시 오고 status=running — reels_idx 로 getRenderStatus 폴링한다.
 * title 을 비우면 여행 제목이 릴스 제목이 된다. 영상 앞뒤 인트로·아웃트로는 서버 고정.
 * 400: 일정이 없거나 지점이 2개 미만 / 404: 없거나 본인 여행이 아님·BGM 없음 / 401.
 */
export async function renderTravelVideo(
  travelIdx: number,
  options: RenderOptions,
): Promise<VideoRenderStatusResponse> {
  const body = new URLSearchParams({
    travel_idx: String(travelIdx),
    theme: options.theme,
  });
  // 빈 값(무음)도 그대로 보낸다 — 서버가 빈 문자열을 무음으로 해석한다.
  body.append("bgm", options.bgm ?? "");
  body.append("title", options.title?.trim() ?? "");

  const res = await api.post<CommonResponse<VideoRenderStatusResponse>>(
    "/api/videos/render/travel",
    body.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/** 서버 상한(100MB). 넘으면 413 이 오는데 그 응답은 공통 봉투가 아니라 안내가 어렵다. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

/** 업로드 전 파일 크기(바이트). 읽을 수 없으면 null — 그때는 서버 판정에 맡긴다. */
export function videoFileSize(uri: string): number | null {
  try {
    return new File(uri).size ?? null;
  } catch {
    return null;
  }
}

/**
 * 직접 만든 영상을 릴스로 업로드. POST /api/videos/reels/upload (multipart/form-data).
 *
 * 렌더를 거치지 않아 응답 시점에 이미 완성된 릴스다 — 진행률 폴링 없이 바로
 * 추천 피드·마이페이지에 뜬다. title 을 비우면 제목 없는 릴스가 된다.
 * 400: 영상 파일이 아니거나 손상·빈 파일·100MB 초과 / 401 / 502: 저장소 업로드 실패.
 * 100MB 는 보내기 전에 걸러 낸다(413 은 nginx 가 끊어 공통 봉투가 아니다).
 */
export async function uploadReelsVideo(
  video: { uri: string; name: string; type: string },
  title?: string,
  onProgress?: (percent: number) => void,
): Promise<ReelsUploadResponse> {
  const size = videoFileSize(video.uri);
  if (size != null && size > MAX_UPLOAD_BYTES) {
    throw new Error("100MB 이하 영상만 업로드할 수 있어요.");
  }

  const form = new FormData();
  form.append("video", {
    uri: video.uri,
    name: video.name,
    type: video.type,
  } as unknown as Blob);
  if (title?.trim()) form.append("title", title.trim());

  const res = await api.post<CommonResponse<ReelsUploadResponse>>(
    "/api/videos/reels/upload",
    form,
    {
      // 최대 100MB 업로드 — 모바일 회선에서 전역 10s 로는 못 끝낸다.
      timeout: 300000,
      // 폰 업링크로 수십 MB 는 수 분이 걸린다 — 진행률이 없으면 멈춘 것처럼 보인다.
      onUploadProgress: (e) => {
        if (!onProgress || !e.total) return;
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      },
    },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 릴스 제목 수정. PATCH /api/videos/reels/{reels_idx}/title
 *
 * 영상은 그대로 두고 제목만 교체하므로 릴스 PK·url·썸네일은 바뀌지 않는다 —
 * 목록 캐시만 갱신하면 새 제목이 바로 보인다. null/빈 문자열이면 제목 없는 릴스가 된다.
 * 404: 없거나 남의 릴스 / 400: 아직 렌더가 끝나지 않음 / 422: 100자 초과 / 401.
 */
export async function updateReelsTitle(
  reelsIdx: number,
  title: string | null,
): Promise<void> {
  await api.patch<CommonResponse<unknown>>(
    `/api/videos/reels/${reelsIdx}/title`,
    { title },
  );
}

/**
 * 릴스 삭제. DELETE /api/videos/reels/{reels_idx}
 *
 * 추천 피드·마이페이지 목록·공유 링크에서 즉시 사라지고 **복구할 수 없다**.
 * 영상·썸네일 파일 정리가 실패해도 삭제 자체는 성공으로 응답하므로(서버 로그에만 남는다),
 * 이미 알고 있던 파일 주소로는 계속 재생될 수 있다. 발급된 공유 링크(/r/{reels_idx})는 404.
 * 렌더가 끝나지 않은 릴스도 지울 수 있다(멈춘 렌더 정리용). 달린 댓글·좋아요는 함께 지워지지
 * 않지만 릴스가 노출되지 않아 어디에서도 보이지 않는다.
 * 404: 릴스 없음(남의 릴스도 존재를 숨기려 403 이 아니라 404) / 401: 인증 필요.
 */
export async function deleteReels(reelsIdx: number): Promise<void> {
  await api.delete<CommonResponse<null>>(`/api/videos/reels/${reelsIdx}`);
}

/**
 * 내 완성 영상 다운로드. GET /api/videos/reels/{reels_idx}/download
 *
 * mp4 첨부 파일로 내려오므로 axios(JSON) 대신 파일 다운로드 API 를 쓴다.
 * 인터셉터를 안 타므로 Authorization 헤더를 직접 붙인다.
 * 남의 릴스는 존재 여부를 숨기려 403 이 아니라 404 로 온다(→ 호출부에서 안내).
 * 400: 아직 렌더 중 / 502: 저장소 접근 실패 / 401: 인증 필요.
 *
 * 캐시에 받아둔 뒤 호출부가 갤러리에 저장한다. 같은 릴스를 다시 받으면 덮어쓴다(idempotent).
 */
export async function downloadMyReelsVideo(reelsIdx: number): Promise<string> {
  const token = await getAccessToken();
  const file = await File.downloadFileAsync(
    `${process.env.EXPO_PUBLIC_API_URL}/api/videos/reels/${reelsIdx}/download`,
    new File(Paths.cache, `reels_${reelsIdx}.mp4`),
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      idempotent: true,
    },
  );
  return file.uri;
}

/**
 * 완성된 릴스 영상에서 [start, end) 구간 삭제. POST /api/videos/edit/cut (urlencoded).
 *
 * 서버가 새 영상을 버킷에 올리고 릴스의 url 을 교체한 뒤 **편집 전 영상은 지운다** —
 * 되돌릴 수 없다. 400: 렌더 미완료·구간 오류·영상 전체 삭제 시도 / 404: 남의 릴스·없음 /
 * 502: ffmpeg 실패. ffmpeg 재인코딩이라 응답이 느려 timeout 을 늘려 잡는다.
 */
export async function cutVideoSection(
  reelsIdx: number,
  startSeconds: number,
  endSeconds: number,
): Promise<VideoEditResponse> {
  const body = new URLSearchParams({
    reels_idx: String(reelsIdx),
    start_seconds: String(startSeconds),
    end_seconds: String(endSeconds),
  });
  const res = await api.post<CommonResponse<VideoEditResponse>>(
    "/api/videos/edit/cut",
    body.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 120000,
    },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 완성된 릴스 영상 at_seconds 시점에 사진 끼워넣기. POST /api/videos/edit/insert (multipart).
 *
 * 사진이 머무는 시간은 서버 고정(렌더의 사진 1장 시간과 동일). cut 과 마찬가지로
 * 편집 전 영상은 지워진다 — 되돌릴 수 없다.
 */
export async function insertImageClip(
  reelsIdx: number,
  atSeconds: number,
  photo: ReelsMediaAsset,
): Promise<VideoEditResponse> {
  const form = new FormData();
  form.append("reels_idx", String(reelsIdx));
  form.append("at_seconds", String(atSeconds));
  // 렌더 업로드와 같은 리사이즈·압축 경로 — 원본을 그대로 올리면 413 이 난다.
  const file = await preparePhotoForUpload(photo, 0);
  form.append("image", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await api.post<CommonResponse<VideoEditResponse>>(
    "/api/videos/edit/insert",
    form,
    { timeout: 120000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 릴스 공유 링크. GET /api/videos/reels/{reels_idx}/share
 *
 * 영상이 재생되는 공유 페이지(/r/{reels_idx}) 주소 — 버킷 영상 주소와 달리 카톡·SNS 에서
 * 링크 미리보기가 뜬다. 남의 릴스도 조회 가능하고 로그인도 필요 없다.
 * 404: 없거나 삭제됐거나 아직 렌더 중.
 */
export async function getReelsShareUrl(reelsIdx: number): Promise<string> {
  const res = await api.get<CommonResponse<{ share_url: string }>>(
    `/api/videos/reels/${reelsIdx}/share`,
  );
  if (!res.data.data?.share_url) throw new Error(res.data.message);
  return res.data.data.share_url;
}

/**
 * 릴스 재생 주소 + 소유 여부. GET /api/videos/reels/{reels_idx}/url
 *
 * 편집 화면은 이 API 로만 영상을 받는다 — 화면 파라미터로 넘어온 주소를 그대로
 * 재생하면 딥링크로 임의의 영상을 밀어 넣을 수 있고, 그 상태로 편집하면 화면에
 * 보이던 영상이 아니라 reels_idx 가 가리키는 진짜 릴스가 잘려 나간다.
 * 404: 없음/삭제됨/렌더 미완료. 401: 인증 필요.
 */
export async function getReelsVideoUrl(
  reelsIdx: number,
): Promise<ReelsVideoUrlResponse> {
  const res = await api.get<CommonResponse<ReelsVideoUrlResponse>>(
    `/api/videos/reels/${reelsIdx}/url`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * 렌더 진행률 조회. GET /api/videos/render/{reels_idx}.
 * 404: 존재하지 않는 릴스 → 호출부(queries.ts)에서 재시도 없이 표면화.
 */
export async function getRenderStatus(
  reelsIdx: number,
): Promise<VideoRenderStatusResponse> {
  const res = await api.get<CommonResponse<VideoRenderStatusResponse>>(
    `/api/videos/render/${reelsIdx}`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}
