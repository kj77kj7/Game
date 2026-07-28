/** 턴 진행, 슬롯 소비 */

import { AGE_STAGES, STRESS, STRESS_BANDS, STAT_RANGE, TRAVEL_RULES, TURN } from '../data/balance';
import { applyDelta, mergeDelta } from '../state';
import type { AgeStage, GameState, StatKey } from '../types';
import { consumptionOutcome } from './economy';

export function stageOf(age: number): AgeStage {
  const matched = AGE_STAGES.find((s) => age >= s.min && age <= s.max);
  return matched?.stage ?? 'judgement';
}

export function stressBandOf(stress: number): (typeof STRESS_BANDS)[number] {
  const [first] = STRESS_BANDS;
  let band: (typeof STRESS_BANDS)[number] = first;

  for (const candidate of STRESS_BANDS) {
    band = candidate;
    if (stress <= candidate.max) break;
  }

  return band;
}

/** 자존감·건강이 낮을수록 스트레스가 빨리 쌓인다. 악순환을 만드는 게 의도다 (설계서 §8) */
export function stressGrowthMultiplier(stats: Record<StatKey, number>): number {
  const esteemShortfall = (STAT_RANGE.max - stats.esteem) / STAT_RANGE.max;
  const healthShortfall = (STAT_RANGE.max - stats.health) / STAT_RANGE.max;

  return 1 + esteemShortfall * STRESS.lowEsteemWeight + healthShortfall * STRESS.lowHealthWeight;
}

export function spendSlot(state: GameState): GameState {
  return { ...state, slots: Math.max(0, state.slots - 1) };
}

/** 리워드 광고 시청 보상. 해당 턴에만 유효하다 */
export function grantAdSlot(state: GameState): GameState {
  return { ...state, slots: state.slots + TURN.adBonusSlot };
}

export function isFinished(state: GameState): boolean {
  return state.age >= TURN.finalAge;
}

/**
 * 대기 중이던 요구는 페널티 없이 사라진다.
 *
 * 거절은 화면에서 요구를 보고 명시적으로 거절 버튼을 눌렀거나 야근을 택한 경우뿐이다 (설계서 §5, §6-3).
 * 턴을 넘겼다는 이유로 애착을 깎으면, 앱을 오래 켜두지 않은 플레이어가 벌을 받는 구조가 된다.
 */
export function endTurn(state: GameState): GameState {
  const stage = stageOf(state.age);
  const { upkeep, delta } = consumptionOutcome(state, stage);

  const turnStress = STRESS.perTurn * stressGrowthMultiplier(state.stats);
  const droughtStress =
    state.turnsSinceTravel >= TRAVEL_RULES.droughtTurns ? TRAVEL_RULES.droughtStressPerTurn : 0;

  const paid: GameState = { ...state, funds: Math.max(0, state.funds - upkeep) };
  const settled = applyDelta(paid, mergeDelta(delta, { stress: turnStress + droughtStress }));

  return {
    ...settled,
    age: state.age + 1,
    slots: TURN.slotsPerTurn,
    turnsSinceTravel: state.turnsSinceTravel + 1,
    pendingRequest: null,
    overtimeStreak: state.overtimeUsedThisTurn ? state.overtimeStreak : 0,
    overtimeUsedThisTurn: false,
  };
}
