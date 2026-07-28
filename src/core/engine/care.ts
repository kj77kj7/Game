/** 돌봄 니즈(허기·청결) 실시간 감소와 충족 */

import { CARE, STAT_RANGE } from '../data/balance';
import { applyDelta } from '../state';
import type { GameState, NeedKey } from '../types';

const HOUR_MS = 3600_000;

const drainPerMs: Record<NeedKey, number> = {
  hunger: STAT_RANGE.max / (CARE.hungerDrainHours * HOUR_MS),
  hygiene: STAT_RANGE.max / (CARE.hygieneDrainHours * HOUR_MS),
};

/**
 * 니즈는 0까지만 내려간다. 0이 되어도 스탯은 깎지 않는다.
 * 아이가 계속 배고프다고 말할 뿐이다 (설계서 §1).
 * 이 함수에 스탯 감점을 추가하지 말 것 — 방치형과 다마고치를 같이 굴리는 유일한 조건이다.
 */
export function drain(state: GameState, elapsedMs: number): GameState {
  if (elapsedMs <= 0) return state;

  return {
    ...state,
    needs: {
      hunger: Math.max(STAT_RANGE.min, state.needs.hunger - drainPerMs.hunger * elapsedMs),
      hygiene: Math.max(STAT_RANGE.min, state.needs.hygiene - drainPerMs.hygiene * elapsedMs),
    },
  };
}

/** 채우면 가득 차고 스트레스가 조금 내려간다 */
export function fill(state: GameState, need: NeedKey): GameState {
  const filled: GameState = {
    ...state,
    needs: { ...state.needs, [need]: STAT_RANGE.max },
  };

  return applyDelta(filled, { stress: -CARE.fillStressRelief });
}

/**
 * 니즈가 차 있을수록 그 턴 성장에 붙는 보너스. 0 이상이며 절대 음수가 되지 않는다.
 * 비워두면 보너스가 없을 뿐, 벌점이 아니다.
 */
export function careGrowthBonus(state: GameState): number {
  const ratio = (state.needs.hunger + state.needs.hygiene) / (STAT_RANGE.max * 2);
  return ratio * CARE.fillGrowthBonus * 2;
}
