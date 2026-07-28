/** 행동 적용, 반복 등급, 재능 보너스 */

import {
  ACTION_BALANCE,
  HOUSING_LEARNING_BONUS,
  REPEAT_GRADES,
  TALENT,
} from '../data/balance';
import { ACTION_META, TRAINING_CATEGORIES } from '../data/actions';
import { TALENT_FIELDS } from '../data/talents';
import { applyDelta, mergeDelta } from '../state';
import type {
  ActionBalance,
  ActionId,
  GameState,
  StatDelta,
  SubjectStat,
  TalentField,
} from '../types';
import { careGrowthBonus } from './care';
import { housingIsFit } from './economy';
import { stageOf, stressBandOf } from './turn';

const SUBJECTS: readonly SubjectStat[] = [
  'korean',
  'english',
  'math',
  'science',
  'socialStudies',
];

const TALENT_FIELD_SET: readonly TalentField[] = TALENT_FIELDS.map((t) => t.field);

const isTalentField = (key: string): key is TalentField =>
  TALENT_FIELD_SET.some((f) => f === key);

export function repeatGradeOf(count: number): (typeof REPEAT_GRADES)[number] {
  const reached = REPEAT_GRADES.filter((g) => count >= g.minCount);
  return reached[reached.length - 1] ?? REPEAT_GRADES[0];
}

export function actionCost(state: GameState, id: ActionId): number {
  const grade = repeatGradeOf(state.actionCounts[id] ?? 0);
  return Math.round(ACTION_BALANCE[id].cost * grade.cost);
}

/** 이 행동이 키우는 세부 분야. 재능 일치 판정의 대상이다 */
export function targetFieldOf(
  state: GameState,
  id: ActionId,
  chosenSubject?: SubjectStat,
): TalentField | null {
  const balance: ActionBalance = ACTION_BALANCE[id];

  if (balance.dynamic) {
    if (balance.dynamic.pick === 'chosen') return chosenSubject ?? null;
    return topSubject(state);
  }

  for (const [key, amount] of Object.entries(balance.effects)) {
    if (isTalentField(key) && typeof amount === 'number' && amount > 0) return key;
  }
  return null;
}

function topSubject(state: GameState): SubjectStat {
  return SUBJECTS.reduce((best, key) =>
    state.stats[key] > state.stats[best] ? key : best,
  );
}

/** 왜 막혔는지. `none`이면 정상 적용됐다는 뜻이다 */
export type ActionBlock = 'none' | 'locked' | 'funds' | 'stress';

export interface ActionResult {
  state: GameState;
  blocked: ActionBlock;
}

/**
 * 슬롯은 여기서 소비하지 않는다. 호출부가 `turn.spendSlot`으로 처리한다 —
 * 요구 수용·야근·돌봄도 같은 슬롯을 쓰기 때문에 한 곳에 모아야 계산이 어긋나지 않는다.
 */
export function applyAction(
  state: GameState,
  id: ActionId,
  chosenSubject?: SubjectStat,
): ActionResult {
  const balance: ActionBalance = ACTION_BALANCE[id];
  const meta = ACTION_META[id];

  if (state.age < balance.unlockAge) return { state, blocked: 'locked' };

  const grade = repeatGradeOf(state.actionCounts[id] ?? 0);
  const cost = Math.round(balance.cost * grade.cost);
  if (state.funds < cost) return { state, blocked: 'funds' };

  const paid: GameState = { ...state, funds: state.funds - cost };
  const isTraining = TRAINING_CATEGORIES.some((c) => c === meta.category);
  const band = stressBandOf(state.stats.stress);

  // 한계 구간에서는 교과·예체능이 실패한다. 비용만 나가고 스탯은 오르지 않는다 (설계서 §8).
  // 반복 횟수도 올리지 않는다 — 실패한 수업이 숙련으로 쌓이면 등급 표기가 거짓말이 된다.
  if (isTraining && band.blocksTraining) {
    return { state: paid, blocked: 'stress' };
  }

  const target = targetFieldOf(state, id, chosenSubject);
  const matched = target !== null && state.talents.some((t) => t === target);
  const mismatchCount = isTraining && !matched ? state.mismatchCount + 1 : state.mismatchCount;
  const penalized = isTraining && !matched && mismatchCount >= TALENT.mismatchThreshold;

  // 반복 등급은 비용과 효과를 함께 올린다 (설계서 §9).
  // 비용만 올리고 효과를 빼먹으면 반복이 순수한 손해가 되고, 숙련·심화 표기가 거짓말이 된다.
  const growth = growthMultiplier(state, meta.category === 'subject') * grade.effect;
  const talentScale = matched ? TALENT.bonus : 1;

  const dynamicDelta: StatDelta =
    balance.dynamic && target ? { [target]: balance.dynamic.delta } : {};

  const scaled = scaleDelta(
    mergeDelta(balance.effects, dynamicDelta),
    growth,
    talentScale,
    penalized,
  );

  const mismatchDelta: StatDelta = penalized
    ? { esteem: -TALENT.mismatchEsteemPenalty }
    : {};

  const applied = applyDelta(paid, mergeDelta(scaled, mismatchDelta));

  return {
    state: {
      ...applied,
      actionCounts: { ...state.actionCounts, [id]: (state.actionCounts[id] ?? 0) + 1 },
      mismatchCount,
    },
    blocked: 'none',
  };
}

function growthMultiplier(state: GameState, isSubject: boolean): number {
  const band = stressBandOf(state.stats.stress);
  const housing =
    isSubject && housingIsFit(state, stageOf(state.age)) ? 1 + HOUSING_LEARNING_BONUS : 1;

  return band.growth * (1 + careGrowthBonus(state)) * housing;
}

/**
 * 성장 배율은 오르는 능력치에만 붙는다.
 * 스트레스까지 배율로 깎으면 "과부하일 때 스트레스가 덜 쌓인다"는 반대 결과가 나온다.
 */
function scaleDelta(
  delta: StatDelta,
  growth: number,
  talentScale: number,
  penalized: boolean,
): StatDelta {
  const out: StatDelta = {};

  for (const [key, amount] of Object.entries(delta)) {
    if (typeof amount !== 'number') continue;

    if (key === 'stress' && amount > 0) {
      const multiplier = penalized ? TALENT.mismatchStressMultiplier : 1;
      Object.assign(out, { stress: amount * multiplier });
      continue;
    }

    if (isTalentField(key) && amount > 0) {
      Object.assign(out, { [key]: amount * growth * talentScale });
      continue;
    }

    Object.assign(out, { [key]: amount });
  }

  return out;
}
