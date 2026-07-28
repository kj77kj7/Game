/** 턴 단위 상태 구독 */

import { useContext } from 'react';

import { GameContext } from '../GameProvider';
import type { GameContextValue } from '../GameProvider';

/**
 * 턴이 바뀔 때만 갱신된다. 허기·청결·자금은 여기 없다 — `useCareTick`을 쓴다.
 */
export function useGame(): GameContextValue {
  const value = useContext(GameContext);
  if (value === null) {
    throw new Error('useGame은 GameProvider 안에서만 쓸 수 있다');
  }
  return value;
}
