/** 요구 이벤트 테이블 */

import type { RequestId } from '../types';

/**
 * 수치는 balance.ts의 `REQUEST_BALANCE`에 있다. 여기에는 아이가 하는 말만 둔다.
 *
 * 티어 설정만으로는 스프레드시트에 그친다. 아이가 직접 조르면 같은 수치가 감정적 선택이 된다 (설계서 §10).
 * 그래서 이 문장들은 플레이버가 아니라 시스템의 일부다.
 */
export const REQUEST_TEXT = {
  toy: {
    label: '장난감',
    line: '저거 사주면 안 돼요? 저거 갖고 싶어요.',
  },
  gameConsole: {
    label: '게임기',
    line: '친구들은 다 있는데… 저만 없어요.',
  },
  sneakers: {
    label: '신발',
    line: '애들이 다 이거 신어요. 저도 사주면 안 돼요?',
  },
  quitAcademy: {
    label: '학원 그만두기',
    line: '학원… 그만두면 안 돼요? 진짜 힘들어요.',
  },
  overseasTrip: {
    label: '친구들과 해외여행',
    line: '친구들이랑 같이 가기로 했는데… 저만 못 간다고 하면 좀 그래서요.',
  },
} as const satisfies Record<RequestId, { label: string; line: string }>;

/**
 * 자립성이 높으면 아이가 스스로 요구를 접는다. 참은 걸 보여줘야 자립성이 보상으로 읽힌다.
 * 요구를 아예 띄우지 않으면 플레이어는 아무 일도 없었다고 느낀다.
 */
export const SELF_RESTRAINT_LINES: readonly string[] = [
  '갖고 싶긴 한데… 지금은 됐어요.',
  '그거 안 사도 돼요. 어차피 금방 질릴 것 같아요.',
  '말할까 하다가 말았어요. 별로 필요 없더라고요.',
];
