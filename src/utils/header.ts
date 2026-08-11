import { verticalScale } from "./responsive";

/**
 * 앱 공통 상단바 기하.
 *
 * 탭 화면의 제목 상단바(홈·피드·내 일정·알림)가 기준이다: 안전영역 아래 6 여백 +
 * 높이 44 + 세로 중앙 정렬 → 제목 중심이 안전영역에서 6+22=28 지점에 온다.
 * '< 제목' 헤더도 이 값을 쓰면 화면을 오가도 제목 높이가 튀지 않는다.
 */
export const HEADER_TOP_GAP = verticalScale(6);
export const HEADER_HEIGHT = verticalScale(44);

/**
 * 헤더 컨테이너에 펼쳐 넣을 스타일. 내용은 `items-center` 로 세로 중앙 정렬할 것.
 *
 * @param insetTop SafeAreaView 안이면 0(기본), 안전영역을 직접 처리하는 화면이면 insets.top.
 *
 * height 에 insetTop 과 여백을 다시 더하는 이유: RN 의 height 는 패딩을 포함하므로
 * (border-box) 내용이 놓일 높이를 44 로 남기려면 그만큼 더해야 한다.
 */
export function headerBarStyle(insetTop = 0) {
  return {
    paddingTop: insetTop + HEADER_TOP_GAP,
    height: insetTop + HEADER_TOP_GAP + HEADER_HEIGHT,
  };
}
