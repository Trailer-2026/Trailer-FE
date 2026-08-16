/**
 * http:// URL 을 https:// 로 올린다.
 *
 * 추천 API 가 내려주는 관광지·숙소 image_url 이 http 스킴으로 오는 경우가 많다.
 * 안드로이드는 평문 HTTP 를 기본 차단하고, 예외로 열어두면 이미지가 중간에서
 * 바꿔치기될 수 있다. 대부분의 이미지 호스트가 같은 경로를 https 로도 서비스하므로
 * 스킴만 바꿔 요청한다.
 *
 * https 를 지원하지 않는 호스트면 로드가 실패하고 각 컴포넌트의 placeholder 로
 * 떨어진다(평문으로 받는 것보다 낫다).
 */
export function toHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//i, "https://");
}
