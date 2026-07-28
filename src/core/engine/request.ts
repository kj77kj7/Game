/** 요구 이벤트 발생·수용·거절 */

import { REQUEST_BALANCE, REQUEST_RATE } from '../data/balance';
import { applyDelta } from '../state';
import type { GameState, RequestBalance, RequestId } from '../types';
import { roll, rollPick } from '../util/rng';

const REQUEST_IDS: readonly RequestId[] = [
  'toy',
  'gameConsole',
  'sneakers',
  'quitAcademy',
  'overseasTrip',
];

/** 자립성이 낮을수록 요구가 자주 나온다. 악순환을 만드는 게 의도다 (설계서 §10) */
export function requestChance(independence: number): number {
  if (independence >= REQUEST_RATE.lowIndependence) return REQUEST_RATE.base;

  const shortfall = (REQUEST_RATE.lowIndependence - independence) / REQUEST_RATE.lowIndependence;
  return REQUEST_RATE.base + shortfall * REQUEST_RATE.lowIndependenceBonus;
}

export interface RequestRoll {
  state: GameState;
  request: RequestId | null;
  /** 자립성이 높아 아이가 스스로 접은 경우. 참은 걸 보여줘야 자립성이 보상으로 읽힌다 */
  selfRestrained: boolean;
}

export function rollRequest(state: GameState): RequestRoll {
  const candidates = REQUEST_IDS.filter((id) => {
    const b = REQUEST_BALANCE[id];
    return state.age >= b.minAge && state.age <= b.maxAge;
  });

  if (candidates.length === 0) {
    return { state, request: null, selfRestrained: false };
  }

  const gate = roll(state.seed);
  if (gate.value >= requestChance(state.stats.independence)) {
    return { state: { ...state, seed: gate.seed }, request: null, selfRestrained: false };
  }

  const picked = rollPick(gate.seed, candidates);
  const next: GameState = { ...state, seed: picked.seed };

  if (state.stats.independence >= REQUEST_RATE.highIndependence) {
    return { state: next, request: null, selfRestrained: true };
  }

  return {
    state: { ...next, pendingRequest: picked.value },
    request: picked.value,
    selfRestrained: false,
  };
}

/** 자금이 모자라면 상태를 그대로 돌려준다. 호출부가 판단하도록 자금 검사를 먼저 노출한다 */
export function canAfford(state: GameState, id: RequestId): boolean {
  return state.funds >= REQUEST_BALANCE[id].cost;
}

export function acceptRequest(state: GameState, id: RequestId): GameState {
  if (!canAfford(state, id)) return state;

  const b = REQUEST_BALANCE[id];
  const paid: GameState = {
    ...state,
    funds: Math.max(0, state.funds - b.cost),
    pendingRequest: null,
  };

  return applyDelta(paid, b.accept);
}

/**
 * 거절은 화면에서 요구를 보고 다른 걸 고른 경우에만 일어난다.
 * 앱을 끄고 안 들어온 것(부재)은 거절이 아니다 — 요구는 그대로 대기한다 (설계서 §5).
 */
export function rejectRequest(state: GameState, id: RequestId): GameState {
  const cleared: GameState = { ...state, pendingRequest: null };
  return applyDelta(cleared, REQUEST_BALANCE[id].reject);
}

/** 요구를 수용하면 그 턴 교과 성장이 멈추는가 (학원 그만두기) */
export function stallsSubjects(id: RequestId): boolean {
  const balance: RequestBalance = REQUEST_BALANCE[id];
  return balance.stallsSubjects === true;
}
