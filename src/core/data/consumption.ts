/** 소비 카테고리·티어·연령별 적정선 */

import type { ConsumptionCategory } from '../types';

/**
 * 수치(비용·효과·적정 티어)는 balance.ts에 있다. 여기에는 이름표만 둔다.
 *
 * 의식주는 슬롯을 쓰지 않아 턴이 복잡해지지 않고, 여행만 슬롯을 써서
 * "학원 대신 여행"이 성립한다 (설계서 §6-4).
 */
export const CONSUMPTION_META = {
  food: {
    label: '음식',
    tiers: ['집밥·간편식', '배달·외식', '뷔페·좋은 식당', '오마카세'],
  },
  clothing: {
    label: '의상',
    tiers: ['보세·물려받기', 'SPA', '중가 브랜드', '명품'],
  },
  housing: {
    label: '집',
    tiers: ['원룸·빌라', '소형 아파트', '중형 아파트', '고급 주택'],
  },
  travel: {
    label: '여행',
    tiers: ['근교 당일', '국내 숙박', '해외 근거리', '해외 장거리'],
  },
} as const satisfies Record<
  ConsumptionCategory,
  { label: string; tiers: readonly [string, string, string, string] }
>;
