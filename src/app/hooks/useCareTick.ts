/** 돌봄 니즈 1초 틱. useGame과 분리해 전체 리렌더를 막는다 */

import { useContext } from 'react';

import { LiveContext } from '../GameProvider';
import type { LiveState } from '../GameProvider';

/**
 * 이 훅을 부르는 컴포넌트는 초당 한 번 리렌더된다.
 * 니즈 게이지와 자금 표시처럼 실제로 매초 달라지는 것만 구독시킬 것.
 *
 * 아직 시작하지 않았으면 null이다.
 */
export function useCareTick(): LiveState | null {
  return useContext(LiveContext);
}
