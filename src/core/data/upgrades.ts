/** 수급 업그레이드 테이블 */

import type { UpgradeId } from '../types';

/**
 * 비용 곡선과 효과는 balance.ts의 `UPGRADE_BALANCE`에 있다. 여기에는 이름표만 둔다.
 *
 * 초반엔 업그레이드와 소비가 실제로 경쟁하고 후반엔 여유가 생긴다.
 * 재화의 제약이 초반 총량에서 후반 적정선으로 옮겨가는 게 의도다 (설계서 §6-2).
 */
export const UPGRADE_META = {
  sideJob: { label: '부업', note: '초당 수급이 일정량 늘어난다' },
  promotion: { label: '승진', note: '초당 수급에 배율이 붙는다' },
  investment: { label: '투자', note: '배율이 더 크지만 비용 곡선이 가파르다' },
  realEstate: { label: '부동산', note: '가장 큰 배율, 가장 가파른 비용' },
  capacity: { label: '누적 상한 확장', note: '자리를 비운 동안 쌓이는 시간이 늘어난다' },
} as const satisfies Record<UpgradeId, { label: string; note: string }>;
