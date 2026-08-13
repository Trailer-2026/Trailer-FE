import { isAxiosError } from "axios";

import { api } from "@/src/api/client";
import type { CommonResponse } from "@/src/api/types";

import type {
  HomeTravelCard,
  PastTravelListResponse,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
  TravelCreateRequest,
  TravelDetail,
  TravelLikeResponse,
  TravelManualCreateRequest,
  TravelResponse,
  TravelCoverFile,
  TravelCoverResponse,
  TravelScheduleItem,
  TravelTicket,
  TravelTicketListResponse,
  TravelUpdateRequest,
} from "./types";

/**
 * POST /api/travels
 * 결과 화면에서 선택한 Itinerary.plan_id 를 그대로 보낸다.
 * - 400 "추천이 만료되었습니다..." 로 응답할 수 있음. 호출부에서 문구 매칭 없이
 *   axios status 로 분기(호출부의 error 처리 참조).
 */
export async function createTravel(planId: string): Promise<TravelResponse> {
  const body: TravelCreateRequest = { plan_id: planId };
  const res = await api.post<CommonResponse<TravelResponse>>(
    "/api/travels",
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * POST /api/travels/manual — 추천 없이 빈 여행 1건 생성(제목·기간·지역).
 * 400: 예정 여행이 이미 있음 / 종료일이 시작일보다 빠름 → message 를 그대로 노출.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function createManualTravel(
  body: TravelManualCreateRequest,
): Promise<TravelResponse> {
  const res = await api.post<CommonResponse<TravelResponse>>(
    "/api/travels/manual",
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * GET /api/travels/current
 * 진행중·예정 여행이 없으면 서버가 data=null 로 응답 → 여기서는 null 을 그대로 반환.
 * (recommend/stations 처럼 null 을 오류로 취급하지 않는다.)
 */
export async function getCurrentTravel(): Promise<HomeTravelCard | null> {
  const res = await api.get<CommonResponse<HomeTravelCard | null>>(
    "/api/travels/current",
  );
  return res.data.data;
}

/**
 * GET /api/travels/past
 * 종료된 여행을 종료일 내림차순으로 반환. 지난 여행이 없으면 travels=[] , total=0.
 * 401: client.ts 인터셉터가 refresh/로그아웃 처리.
 */
export async function getPastTravels(): Promise<PastTravelListResponse> {
  const res = await api.get<CommonResponse<PastTravelListResponse>>(
    "/api/travels/past",
  );
  // 없어도 data 는 빈 배열로 오지만, 방어적으로 null 이면 빈 목록으로 취급.
  return res.data.data ?? { travels: [], total: 0 };
}

/**
 * GET /api/travels/{travel_idx} — 여행 1건 일정표 상세(일자별 타임라인).
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요(client.ts 인터셉터 처리).
 */
export async function getTravelDetail(
  travelIdx: number,
): Promise<TravelDetail> {
  const res = await api.get<CommonResponse<TravelDetail>>(
    `/api/travels/${travelIdx}`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * GET /api/travels/{travel_idx}/tickets — 승차권 목록(승차권 1매 = 기차 일정 1건).
 *
 * 이 엔드포인트는 **AI 추천 일정을 승인해 저장한 여행에서만** 열려 있고, '직접 일정
 * 만들기'로 만든 여행은 404 로 응답한다. 그 경우 이미 있는 일정표 상세의 kind=train
 * 항목으로 같은 모양을 만들어 돌려준다 → 어떤 여행이든 승차권 화면이 동일하게 보인다.
 */
export async function getTravelTickets(
  travelIdx: number,
): Promise<TravelTicket[]> {
  try {
    const res = await api.get<CommonResponse<TravelTicketListResponse>>(
      `/api/travels/${travelIdx}/tickets`,
    );
    return res.data.data?.tickets ?? [];
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) {
      return ticketsFromDetail(await getTravelDetail(travelIdx));
    }
    throw e;
  }
}

/** 일정표 상세의 기차 항목 → 승차권 목록(폴백). 역·시각이 없는 항목은 제외. */
function ticketsFromDetail(detail: TravelDetail): TravelTicket[] {
  const out: TravelTicket[] = [];
  detail.days.forEach((day) => {
    day.items.forEach((item) => {
      if (item.kind !== "train") return;
      if (!item.dep_station || !item.arr_station) return;
      if (!item.start_time || !item.end_time) return;
      out.push({
        schedule_idx: item.schedule_idx,
        day_no: day.day_no,
        date: day.date,
        train_grade: item.train_grade ?? "",
        train_no: item.train_no ?? "",
        dep_station: item.dep_station,
        arr_station: item.arr_station,
        dep_time: item.start_time,
        arr_time: item.end_time,
        car_no: item.car_no,
        seat_no: item.seat_no,
      });
    });
  });
  return out;
}

/**
 * POST /api/travels/{travel_idx}/schedules — 일정 항목 추가.
 * 400: kind별 필수값 누락 / 여행 기간 벗어난 일자·출발일 / 도착일<출발일 /
 *      출발역 좌표 없음 → message 를 그대로 노출. 404/401.
 */
export async function createSchedule(
  travelIdx: number,
  body: ScheduleCreateRequest,
): Promise<TravelScheduleItem> {
  const res = await api.post<CommonResponse<TravelScheduleItem>>(
    `/api/travels/${travelIdx}/schedules`,
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * PATCH /api/travels/{travel_idx}/schedules/{schedule_idx} — 일정 부분 수정.
 * 보낸 필드만 반영. 변경하지 않는 필드는 body 에서 빼고 보낸다(호출부에서 diff).
 */
export async function updateSchedule(
  travelIdx: number,
  scheduleIdx: number,
  body: ScheduleUpdateRequest,
): Promise<TravelScheduleItem> {
  const res = await api.patch<CommonResponse<TravelScheduleItem>>(
    `/api/travels/${travelIdx}/schedules/${scheduleIdx}`,
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * DELETE /api/travels/{travel_idx}/schedules/{schedule_idx} — 소프트 삭제.
 * 응답 data 는 null. 404/401.
 */
export async function deleteSchedule(
  travelIdx: number,
  scheduleIdx: number,
): Promise<void> {
  await api.delete<CommonResponse<null>>(
    `/api/travels/${travelIdx}/schedules/${scheduleIdx}`,
  );
}

/**
 * PATCH /api/travels/{travel_idx} — 여행 제목 변경.
 * title 이 빈 문자열·공백이면 서버가 지역·기간으로 자동 생성한다.
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요(client.ts 처리).
 */
export async function updateTravelTitle(
  travelIdx: number,
  title: string,
): Promise<TravelResponse> {
  const body: TravelUpdateRequest = { title };
  const res = await api.patch<CommonResponse<TravelResponse>>(
    `/api/travels/${travelIdx}`,
    body,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * DELETE /api/travels/{travel_idx} — 여행 소프트 삭제.
 * 해당 여행의 일정 항목도 함께 삭제된다. 예정 여행을 삭제하면
 * '예정 여행은 1개만' 제약이 풀린다. 응답 data 는 null.
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요.
 */
export async function deleteTravel(travelIdx: number): Promise<void> {
  await api.delete<CommonResponse<null>>(`/api/travels/${travelIdx}`);
}

/**
 * POST /api/travels/{travel_idx}/likes — 여행 좋아요.
 * 토글 아님(멱등). 이미 좋아요여도 에러 없이 liked=true 반환.
 * 404: 존재하지 않거나 본인 여행 아님 / 401: 인증 필요.
 */
export async function likeTravel(travelIdx: number): Promise<TravelLikeResponse> {
  const res = await api.post<CommonResponse<TravelLikeResponse>>(
    `/api/travels/${travelIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * DELETE /api/travels/{travel_idx}/likes — 여행 좋아요 취소.
 * 멱등. 좋아요 안 한 여행이어도 에러 없이 liked=false 반환.
 */
export async function unlikeTravel(
  travelIdx: number,
): Promise<TravelLikeResponse> {
  const res = await api.delete<CommonResponse<TravelLikeResponse>>(
    `/api/travels/${travelIdx}/likes`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * PATCH /api/travels/{travel_idx}/cover-image — 대표 사진 지정·변경(multipart).
 * 이미 있으면 교체하고 옛 사진은 저장소에서 지운다.
 * 400: 이미지가 아니거나 빈 파일·10MB 초과 / 404 / 502(저장소 업로드 실패)
 *
 * timeout 은 전역 10s 로는 업로드에 부족할 수 있어 30s 로 override 한다.
 */
export async function updateTravelCoverImage(
  travelIdx: number,
  file: TravelCoverFile,
): Promise<TravelCoverResponse> {
  const form = new FormData();
  // RN 의 FormData 는 { uri, name, type } 객체를 파일 파트로 인식한다. 필드명은 스펙상 "image".
  form.append("image", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  // Content-Type 을 직접 지정하지 않는다 — RN 의 XHR 이 FormData 를 감지해
  // multipart/form-data 와 boundary 를 자동으로 붙인다. 여기서 손대면 boundary 가 빠져 깨진다.
  const res = await api.patch<CommonResponse<TravelCoverResponse>>(
    `/api/travels/${travelIdx}/cover-image`,
    form,
    { timeout: 30000 },
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * DELETE /api/travels/{travel_idx}/cover-image — 대표 사진 해제.
 * 지정된 사진이 없어도 성공(멱등). 응답엔 원래 규칙으로 복귀한 URL 이 담긴다.
 */
export async function deleteTravelCoverImage(
  travelIdx: number,
): Promise<TravelCoverResponse> {
  const res = await api.delete<CommonResponse<TravelCoverResponse>>(
    `/api/travels/${travelIdx}/cover-image`,
  );
  if (!res.data.data) throw new Error(res.data.message);
  return res.data.data;
}

/**
 * POST /api/travels/{travel_idx}/images — 여행 중 찍은 사진 붙이기 (multipart, 한 번에 최대 20장).
 *
 * 붙인 사진은 여행 영상(POST /api/videos/render/travel)의 재료가 된다 —
 * 한 장도 없으면 지도 이동만 있는 영상이 된다.
 *
 * scheduleIdx 는 선택이고 보통 보내지 않는다:
 * - 안 주면: 서버가 사진 EXIF 의 GPS 로 가장 가까운 일정에 자동 매핑한다.
 * - 주면: 자동 매핑 없이 그 일정에 그대로 붙는다(사용자가 일정을 직접 고른 화면).
 * - 좌표를 못 구하면 일정 없이(schedule_idx: null) 저장되고 영상에서는 마지막 지점 뒤에 몰려 나온다.
 *
 * 400: 이미지가 아니거나 빈 파일·10MB 초과·21장 이상 / 404: 없거나 남의 여행,
 * schedule_idx 가 그 여행의 일정이 아님 / 401 / 502: 저장소 업로드 실패.
 * 사진 여러 장 업로드는 전역 10s 로는 부족해 timeout 을 늘려 잡는다.
 */
export async function addTravelImages(
  travelIdx: number,
  files: { uri: string; name: string; type: string }[],
  scheduleIdx?: number | null,
): Promise<void> {
  const form = new FormData();
  files.forEach((file) => {
    form.append("images", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  });
  if (scheduleIdx != null) form.append("schedule_idx", String(scheduleIdx));

  // Content-Type 은 지정하지 않는다 — RN 의 XHR 이 FormData 를 보고 boundary 를 붙인다.
  await api.post<CommonResponse<unknown>>(
    `/api/travels/${travelIdx}/images`,
    form,
    { timeout: 120000 },
  );
}
