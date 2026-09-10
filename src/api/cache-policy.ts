/**
 * react-query 캐시 정책 — 도메인 성격별 staleTime / gcTime.
 *
 * 쿼리마다 숫자를 따로 적으면 "왜 1분인지"가 흩어지고 서로 어긋난다. 여기서 성격별로
 * 한 번만 정하고, 각 useQuery 는 `...CACHE_POLICY.X` 로 펼쳐 쓴다.
 *
 * - staleTime: 이 시간 안에는 새 관찰자가 붙어도(화면 진입) 다시 요청하지 않는다.
 * - gcTime:    관찰자가 하나도 없어진 뒤(화면을 나간 뒤) 캐시를 지우기까지의 시간.
 *              기본값 5분은 짧다 — 상세 화면을 닫고 6분 뒤 다시 열면 스피너부터 뜬다.
 *
 * 탭 화면은 한 번 방문하면 계속 마운트돼 있어 gcTime 이 사실상 안 걸린다. gcTime 이
 * 의미 있는 건 스택으로 쌓였다 닫히는 화면(여행 상세·장소 상세·댓글 시트)이다.
 */
const SEC = 1000;
const MIN = 60 * SEC;

export const CACHE_POLICY = {
  /** 기준 데이터 — 역 목록, BGM 트랙. 배포 없이는 안 바뀐다. */
  STATIC: { staleTime: 30 * MIN, gcTime: 24 * 60 * MIN },

  /**
   * 내 데이터 — 프로필, 여행/일정, 알림 설정, 스탬프.
   * 바꾸는 주체가 항상 이 앱의 mutation 이라 invalidate 로 갱신된다. 시간 기반 재요청은
   * 서버 쪽 상태 변화(여행 상태가 날짜로 넘어감 등)를 따라잡는 안전망 정도로만 둔다.
   */
  OWNED: { staleTime: 5 * MIN, gcTime: 30 * MIN },

  /**
   * 외부 조회 — 장소 검색/상세(TourAPI), AI 일정 추천.
   * 느리고 비싼데 결과는 잘 안 바뀐다. 같은 조건이면 재사용한다.
   */
  LOOKUP: { staleTime: 5 * MIN, gcTime: 30 * MIN },

  /**
   * 피드(무한 스크롤). 보는 도중에 목록이 뒤바뀌면 안 되고, 오래 비웠다 돌아오면
   * 새 걸 보여줘야 한다. 피드 탭은 언마운트되지 않으므로 staleTime 만으로는 재요청이
   * 일어나지 않는다 — 탭 포커스 때 이 값과 dataUpdatedAt 을 비교해 직접 되돌린다(feed.tsx).
   */
  FEED: { staleTime: 10 * MIN, gcTime: 30 * MIN },

  /**
   * 서버 쪽에서 바뀌는 데이터 — 알림함/배지, 댓글, 내 릴스·좋아요 목록, 차단 목록.
   * 다른 사용자의 행동으로 바뀌므로 짧게 잡고, 화면에 들어올 때 새로 받는다.
   */
  LIVE: { staleTime: 30 * SEC, gcTime: 10 * MIN },
} as const;

/** 정책을 안 적은 쿼리의 gcTime. react-query 기본값(5분)보다 넉넉히 둔다. */
export const DEFAULT_GC_TIME = 30 * MIN;
