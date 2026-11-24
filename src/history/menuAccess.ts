import { apiFetch } from '../api/http';

/**
 * 연 화면을 이력으로 남긴다 (POST /api/v1/common/menu-access-histories). 사번·IP 는 서버가 채운다.
 * 조회 조건(?…)은 개인정보가 섞일 수 있어 보내지 않는다. 이력 저장 실패가 화면 이동을 막지 않게 오류는 무시한다.
 * 라우터가 생기면 화면 경로가 바뀔 때마다 이 함수를 부른다.
 */
export function recordMenuAccess(path: string): Promise<void> {
  const pagePath = path.split(/[?#]/)[0];
  return apiFetch<void>('/api/v1/common/menu-access-histories', {
    method: 'POST',
    body: JSON.stringify({ pagePath }),
  }).catch(() => undefined);
}
