/** 자동 수급, 업그레이드, 소비 적정선 판정 */

import {
  CONSUMPTION_BALANCE,
  CONSUMPTION_FIT,
  CONSUMPTION_PENALTY,
  INCOME,
  OVERTIME,
  TRAVEL_RULES,
  UPGRADE_BALANCE,
} from '../data/balance';
import { applyDelta, mergeDelta } from '../state';
import type {
  AgeStage,
  ConsumptionCategory,
  ConsumptionTier,
  GameState,
  StatDelta,
  UpgradeId,
} from '../types';
import { rejectRequest } from './request';

const HOUR_MS = 3600_000;

/** 지속 설정 3종. 여행은 단발 행동이라 유지비가 없다 */
const UPKEEP_CATEGORIES: readonly ConsumptionCategory[] = ['food', 'clothing', 'housing'];

// ---------------------------------------------------------------------------
// 자동 수급
// ---------------------------------------------------------------------------

export function incomePerSecond(upgrades: Record<UpgradeId, number>): number {
  const flat = INCOME.basePerTick + UPGRADE_BALANCE.sideJob.flatPerLevel * upgrades.sideJob;

  const multiplier =
    UPGRADE_BALANCE.promotion.multiplierPerLevel ** upgrades.promotion *
    UPGRADE_BALANCE.investment.multiplierPerLevel ** upgrades.investment *
    UPGRADE_BALANCE.realEstate.multiplierPerLevel ** upgrades.realEstate;

  return flat * multiplier;
}

export function offlineCapMs(upgrades: Record<UpgradeId, number>): number {
  const hours =
    INCOME.baseCapHours + UPGRADE_BALANCE.capacity.capHoursPerLevel * upgrades.capacity;
  return hours * HOUR_MS;
}

/**
 * 상한에 닿으면 누적이 멈춘다. 넘긴 시간에 벌을 주지 않는다 —
 * 재방문 동기는 손해 회피가 아니라 자원 회수다 (설계서 §6-1).
 */
export function accrue(state: GameState, now: number): GameState {
  const elapsed = Math.max(0, now - state.lastSeenAt);
  const capped = Math.min(elapsed, offlineCapMs(state.upgrades));
  const gained = (incomePerSecond(state.upgrades) * capped) / INCOME.tickMs;

  return { ...state, funds: state.funds + gained, lastSeenAt: now };
}

// ---------------------------------------------------------------------------
// 업그레이드
// ---------------------------------------------------------------------------

export function upgradeCost(id: UpgradeId, level: number): number {
  const b = UPGRADE_BALANCE[id];
  return Math.round(b.baseCost * b.growth ** level);
}

export function isUnlocked(state: GameState, id: UpgradeId): boolean {
  const b = UPGRADE_BALANCE[id];
  if (!('requires' in b)) return true;

  const required = b.requires;
  return isUpgradeId(required.id) && state.upgrades[required.id] >= required.level;
}

function isUpgradeId(id: string): id is UpgradeId {
  return id in UPGRADE_BALANCE;
}

/** 살 수 없으면 상태를 그대로 돌려준다 */
export function buyUpgrade(state: GameState, id: UpgradeId): GameState {
  const level = state.upgrades[id];
  const cost = upgradeCost(id, level);

  if (level >= UPGRADE_BALANCE[id].maxLevel) return state;
  if (!isUnlocked(state, id)) return state;
  if (state.funds < cost) return state;

  return {
    ...state,
    funds: state.funds - cost,
    upgrades: { ...state.upgrades, [id]: level + 1 },
  };
}

// ---------------------------------------------------------------------------
// 소비 — 역U자 곡선
// ---------------------------------------------------------------------------

export type ConsumptionFit = 'lack' | 'fit' | 'excess';

/** 적정선은 카테고리가 아니라 나이에 따라서만 이동한다 (설계서 §6-4) */
export function fitOf(tier: ConsumptionTier, stage: AgeStage): ConsumptionFit {
  const [min, max] = CONSUMPTION_FIT[stage];
  if (tier < min) return 'lack';
  if (tier > max) return 'excess';
  return 'fit';
}

/** 적정선에서 몇 티어 떨어져 있는가. 적정이면 0 */
function distance(tier: ConsumptionTier, stage: AgeStage): number {
  const [min, max] = CONSUMPTION_FIT[stage];
  if (tier < min) return min - tier;
  if (tier > max) return tier - max;
  return 0;
}

export function tierEffect(
  category: ConsumptionCategory,
  tier: ConsumptionTier,
  stage: AgeStage,
): StatDelta {
  const fit = fitOf(tier, stage);
  if (fit === 'fit') return CONSUMPTION_BALANCE[category].fitEffects;

  const steps = distance(tier, stage);
  const scale =
    fit === 'lack'
      ? CONSUMPTION_PENALTY.lackScale[stage]
      : CONSUMPTION_PENALTY.excessScale[stage];
  const base = fit === 'lack' ? CONSUMPTION_PENALTY.lack : CONSUMPTION_PENALTY.excess;

  const scaled: StatDelta = {};
  for (const [key, amount] of Object.entries(base)) {
    if (typeof amount === 'number') {
      Object.assign(scaled, { [key]: amount * steps * scale });
    }
  }
  return scaled;
}

export interface ConsumptionOutcome {
  /** 매 턴 빠져나가는 유지비 */
  upkeep: number;
  delta: StatDelta;
}

export function consumptionOutcome(state: GameState, stage: AgeStage): ConsumptionOutcome {
  let upkeep = 0;
  const deltas: StatDelta[] = [];

  for (const category of UPKEEP_CATEGORIES) {
    const tier = state.consumption[category];
    upkeep += CONSUMPTION_BALANCE[category].cost[tier - 1] ?? 0;
    deltas.push(tierEffect(category, tier, stage));
  }

  return { upkeep, delta: mergeDelta(...deltas) };
}

/** 집이 적정 티어면 교과 성장에 보너스가 붙는다 */
export function housingIsFit(state: GameState, stage: AgeStage): boolean {
  return fitOf(state.consumption.housing, stage) === 'fit';
}

// ---------------------------------------------------------------------------
// 여행
// ---------------------------------------------------------------------------

/** 매 턴 여행하면 애착 획득이 급감하고 자립성이 떨어진다 (설계서 §6-4 여행 특칙) */
export function travel(state: GameState, tier: ConsumptionTier, stage: AgeStage): GameState {
  const cost = CONSUMPTION_BALANCE.travel.cost[tier - 1] ?? 0;
  if (state.funds < cost) return state;

  const consecutive = state.turnsSinceTravel === 0;
  const base = tierEffect('travel', tier, stage);

  const bond = (base.bond ?? 0) * (consecutive ? TRAVEL_RULES.consecutiveBondScale : 1);
  const extra: StatDelta = consecutive
    ? { independence: -TRAVEL_RULES.consecutiveIndependencePenalty }
    : {};

  const paid: GameState = {
    ...state,
    funds: state.funds - cost,
    consumption: { ...state.consumption, travel: tier },
    turnsSinceTravel: 0,
  };

  return applyDelta(paid, mergeDelta({ ...base, bond }, extra));
}

// ---------------------------------------------------------------------------
// 야근
// ---------------------------------------------------------------------------

export function overtimeBondPenalty(streak: number): number {
  const index = Math.min(streak, OVERTIME.streakMultipliers.length - 1);
  const multiplier = OVERTIME.streakMultipliers[index] ?? 1;
  return OVERTIME.bondPenalty * multiplier;
}

/**
 * 야근은 자금을 크게 벌지만 그 턴 아이에게 아무것도 못 한다.
 * 요구가 떠 있으면 거절로 처리한다 (설계서 §6-3).
 */
export function overtime(state: GameState): GameState {
  const gained =
    (incomePerSecond(state.upgrades) * OVERTIME.incomeHours * HOUR_MS) / INCOME.tickMs;

  const rejected =
    state.pendingRequest === null ? state : rejectRequest(state, state.pendingRequest);

  const worked: GameState = {
    ...rejected,
    funds: rejected.funds + gained,
    overtimeStreak: state.overtimeStreak + 1,
    overtimeUsedThisTurn: true,
  };

  return applyDelta(worked, { bond: -overtimeBondPenalty(state.overtimeStreak) });
}
