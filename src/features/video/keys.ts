/**
 * video 렌더 관련 react-query key 팩토리.
 * 진행률 폴링은 job_id 단위로 캐시되므로 status(jobId) 로 세분화한다.
 */
export const videoKeys = {
  all: ["video"] as const,
  status: (jobId: string) => [...videoKeys.all, "status", jobId] as const,
};
