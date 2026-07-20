import type { Reels } from "./types";

/**
 * 릴스 더미 데이터.
 *
 * 백엔드에 릴스 조회 API 와 실제 릴스가 아직 없어 프론트에서 만든 임시 목록이다.
 * video_url 은 영상 제작 로직이 없어 전부 null — 화면은 thumbnail_url(정지 이미지)로 렌더한다.
 * reels_idx 는 임의값이며, 실제 API 가 붙으면 이 파일을 통째로 지우고
 * 서버 응답(GET /api/reels)으로 교체한다.
 */
export const MOCK_REELS: Reels[] = [
  {
    reels_idx: 1,
    author: { name: "여행하는 지민", avatar_url: "https://i.pravatar.cc/120?img=47" },
    video_url: null,
    thumbnail_url: "https://picsum.photos/seed/gyeongju-night/720/1280",
    caption: "마음비우는 데는 경주가 최고 경주로 향하는 길",
    location: "경주 도곡로 31단길",
    like_count: 128,
    liked: false,
    comment_count: 12,
  },
  {
    reels_idx: 2,
    author: { name: "기차덕후 준호", avatar_url: "https://i.pravatar.cc/120?img=12" },
    video_url: null,
    thumbnail_url: "https://picsum.photos/seed/train-window/720/1280",
    caption: "창밖만 봐도 힐링되는 무궁화호 완행 여행",
    location: "정동진역",
    like_count: 342,
    liked: true,
    comment_count: 47,
  },
  {
    reels_idx: 3,
    author: { name: "바다보러 가는 수아", avatar_url: "https://i.pravatar.cc/120?img=32" },
    video_url: null,
    thumbnail_url: "https://picsum.photos/seed/busan-sea/720/1280",
    caption: "퇴근하고 바로 부산 야경 보러 왔어요",
    location: "부산 광안리 해수욕장",
    like_count: 89,
    liked: false,
    comment_count: 5,
  },
  {
    reels_idx: 4,
    author: { name: "미식가 태윤", avatar_url: "https://i.pravatar.cc/120?img=68" },
    video_url: null,
    thumbnail_url: "https://picsum.photos/seed/jeonju-food/720/1280",
    caption: "전주 한옥마을 먹방 코스 정리해봤습니다",
    location: "전주 한옥마을",
    like_count: 501,
    liked: false,
    comment_count: 63,
  },
  {
    reels_idx: 5,
    author: { name: "산책러 하은", avatar_url: null },
    video_url: null,
    thumbnail_url: "https://picsum.photos/seed/seoul-hangang/720/1280",
    caption: "한강 노을은 몇 번을 봐도 안 질려",
    location: null,
    like_count: 24,
    liked: false,
    comment_count: 2,
  },
];
