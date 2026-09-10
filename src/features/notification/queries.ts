import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { CACHE_POLICY } from "@/src/api/cache-policy";

import { notificationKeys } from "./keys";
import {
  getNotifications,
  readAllNotifications,
  readNotification,
} from "./log-api";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "./settings-api";
import type {
  NotificationLogListResponse,
  NotificationSettings,
  NotificationUpdateRequest,
} from "./types";

const PAGE_SIZE = 20;

/** 알림 설정 조회. 설정 화면 진입 시 자동 실행. */
export function useNotificationSettingsQuery() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: getNotificationSettings,
    ...CACHE_POLICY.OWNED,
  });
}

/**
 * 알림 설정 토글 — 낙관적 업데이트.
 * - 눌린 순간 캐시를 뒤집어 스위치가 즉시 반응, 실패 시 원복.
 * - 성공 시 서버가 준 확정값으로 캐시를 덮어써 정합.
 * - **토글한 항목만** body 에 담아 보낸다(호출부에서 { event_alarm: true } 처럼).
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationUpdateRequest) =>
      updateNotificationSettings(body),

    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.settings() });
      const prev = queryClient.getQueryData<NotificationSettings>(
        notificationKeys.settings(),
      );
      if (prev) {
        queryClient.setQueryData<NotificationSettings>(
          notificationKeys.settings(),
          { ...prev, ...body },
        );
      }
      return { prev };
    },

    onError: (_err, _body, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(notificationKeys.settings(), ctx.prev);
      }
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationSettings>(
        notificationKeys.settings(),
        updated,
      );
    },
  });
}

/**
 * 알림함 무한스크롤.
 * - pageParam = 서버가 준 next_cursor. 첫 페이지는 undefined 로 시작.
 * - getNextPageParam 이 null 을 반환하면 종료 → undefined 로 매핑해야 hasNextPage=false.
 * - unread_count 는 pages[0] 을 신뢰(전체 기준·페이지 무관). 낙관 업데이트도 첫 페이지 값에 반영.
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) =>
      getNotifications({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    ...CACHE_POLICY.LIVE,
  });
}

/**
 * 탭 배지용 미읽음 개수.
 * - 목록 캐시(useNotifications) 와 같은 queryKey 를 쓰는 useInfiniteQuery 를 select 로 좁힌다.
 *   같은 캐시를 공유하므로, 알림함에서 읽음 처리를 하면 배지도 자동 갱신된다.
 * - 배지 목적이라 첫 페이지만 필요 → 여기서만 마운트되어 있어도 최소 1페이지는 자동 fetch 된다.
 */
export function useUnreadNotificationCount(): number {
  const { data } = useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) =>
      getNotifications({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    ...CACHE_POLICY.LIVE,
    select: (d) => d.pages[0]?.unread_count ?? 0,
  });
  return data ?? 0;
}

/**
 * 캐시된 무한 목록에서 특정 알림을 읽음 처리한다.
 * - 해당 아이템을 찾아 is_read=true 로.
 * - 원래 미읽음이던 알림이면 첫 페이지의 unread_count 를 1 감소.
 */
function markReadInPages(
  data: { pages: NotificationLogListResponse[]; pageParams: unknown[] } | undefined,
  notificationLogIdx: number,
): { pages: NotificationLogListResponse[]; pageParams: unknown[] } | undefined {
  if (!data) return data;
  let wasUnread = false;
  const nextPages = data.pages.map((page) => ({
    ...page,
    items: page.items.map((item) => {
      if (item.notification_log_idx !== notificationLogIdx) return item;
      if (!item.is_read) wasUnread = true;
      return { ...item, is_read: true };
    }),
  }));
  if (wasUnread && nextPages[0]) {
    nextPages[0] = {
      ...nextPages[0],
      unread_count: Math.max(0, nextPages[0].unread_count - 1),
    };
  }
  return { ...data, pages: nextPages };
}

/**
 * 1건 읽음. 성공/실패 어느 쪽이든 목록 캐시 정합을 위해 낙관 반영 + 실패 롤백.
 * 404(내 알림 아님)여도 서버 상태가 이미 그러하면 되돌리는 편이 안전.
 */
export function useReadNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationLogIdx: number) =>
      readNotification(notificationLogIdx),

    onMutate: async (notificationLogIdx) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const prev = queryClient.getQueryData(notificationKeys.list());
      queryClient.setQueryData(notificationKeys.list(), (cur: Parameters<typeof markReadInPages>[0]) =>
        markReadInPages(cur, notificationLogIdx),
      );
      return { prev };
    },

    onError: (_err, _idx, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.list(), ctx.prev);
    },
  });
}

/**
 * 전체 읽음. 성공 시 모든 페이지의 is_read=true + unread_count=0.
 * 서버가 멱등이라 실패 시 롤백만 하면 된다.
 */
export function useReadAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => readAllNotifications(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const prev = queryClient.getQueryData(notificationKeys.list()) as
        | { pages: NotificationLogListResponse[]; pageParams: unknown[] }
        | undefined;
      if (prev) {
        queryClient.setQueryData(notificationKeys.list(), {
          ...prev,
          pages: prev.pages.map((page, i) => ({
            ...page,
            unread_count: i === 0 ? 0 : page.unread_count,
            items: page.items.map((item) => ({ ...item, is_read: true })),
          })),
        });
      }
      return { prev };
    },

    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.list(), ctx.prev);
    },
  });
}

