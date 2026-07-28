import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CONSUMPTION_PENALTY, INCOME, OVERTIME, UPGRADE_BALANCE } from '../data/balance';
import { createInitialState } from '../state';
import type { GameState } from '../types';
import {
  accrue,
  buyUpgrade,
  consumptionOutcome,
  fitOf,
  incomePerSecond,
  isUnlocked,
  offlineCapMs,
  overtime,
  overtimeBondPenalty,
  tierEffect,
  upgradeCost,
} from './economy';

const HOUR_MS = 3600_000;

const base = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1, 0),
  ...over,
});

test('부업은 초당 수급을 더하고 승진은 곱한다', () => {
  const none = base().upgrades;
  const withSideJob = { ...none, sideJob: 3 };
  const withPromotion = { ...none, promotion: 1 };

  assert.equal(
    incomePerSecond(withSideJob),
    INCOME.basePerTick + UPGRADE_BALANCE.sideJob.flatPerLevel * 3,
  );
  assert.equal(
    incomePerSecond(withPromotion),
    INCOME.basePerTick * UPGRADE_BALANCE.promotion.multiplierPerLevel,
  );
});

test('오프라인 누적은 상한에서 멈춘다', () => {
  const state = base({ lastSeenAt: 0 });

  const twelve = accrue(state, 12 * HOUR_MS).funds;
  const hundred = accrue(state, 100 * HOUR_MS).funds;

  assert.equal(twelve, hundred, '상한을 넘긴 시간은 그냥 버려진다');
});

test('상한 확장은 누적 시간을 늘린다', () => {
  const plain = base();
  const expanded = base({ upgrades: { ...plain.upgrades, capacity: 2 } });

  assert.ok(offlineCapMs(expanded.upgrades) > offlineCapMs(plain.upgrades));
});

test('오래 자리를 비워도 벌점은 없다', () => {
  const state = base({ lastSeenAt: 0 });
  const after = accrue(state, 100 * HOUR_MS);

  assert.deepEqual(after.stats, state.stats);
  assert.equal(after.bond, state.bond);
  assert.ok(after.funds > state.funds);
});

test('업그레이드 비용은 레벨에 따라 가팔라진다', () => {
  assert.equal(upgradeCost('sideJob', 0), UPGRADE_BALANCE.sideJob.baseCost);
  assert.ok(upgradeCost('sideJob', 5) > upgradeCost('sideJob', 4));
  assert.ok(upgradeCost('realEstate', 1) > upgradeCost('investment', 1));
});

test('상위 업그레이드는 하위 레벨로 해금된다', () => {
  const locked = base({ funds: 1e9 });
  assert.equal(isUnlocked(locked, 'promotion'), false);
  assert.deepEqual(buyUpgrade(locked, 'promotion'), locked, '잠겨 있으면 사지지 않는다');

  const unlocked = base({ funds: 1e9, upgrades: { ...locked.upgrades, sideJob: 5 } });
  assert.equal(isUnlocked(unlocked, 'promotion'), true);
  assert.equal(buyUpgrade(unlocked, 'promotion').upgrades.promotion, 1);
});

test('자금이 모자라면 사지지 않는다', () => {
  const broke = base({ funds: 0 });
  assert.deepEqual(buyUpgrade(broke, 'sideJob'), broke);
});

test('소비 적정선은 나이에 따라 이동한다', () => {
  assert.equal(fitOf(1, 'infant'), 'fit');
  assert.equal(fitOf(2, 'infant'), 'excess');

  assert.equal(fitOf(1, 'high'), 'lack');
  assert.equal(fitOf(3, 'high'), 'fit');
  assert.equal(fitOf(4, 'high'), 'excess');
});

test('유아기 과잉은 자립성을 깎는다', () => {
  const delta = tierEffect('food', 4, 'infant');
  const expected = CONSUMPTION_PENALTY.excess.independence * 3 * CONSUMPTION_PENALTY.excessScale.infant;

  assert.equal(delta.independence, expected);
});

test('고등기 결핍은 자존감·사회성을 깎는다', () => {
  const delta = tierEffect('clothing', 1, 'high');

  assert.ok((delta.esteem ?? 0) < 0);
  assert.ok((delta.sociability ?? 0) < 0);
});

test('결핍 페널티는 중등부터 커지고 과잉 페널티는 유아기에 가장 크다', () => {
  const lackInfant = tierEffect('clothing', 1, 'elementary').esteem ?? 0;
  const lackHigh = tierEffect('clothing', 1, 'high').esteem ?? 0;
  assert.ok(lackHigh < lackInfant);

  const excessInfant = tierEffect('food', 2, 'infant').independence ?? 0;
  const excessHigh = tierEffect('food', 4, 'high').independence ?? 0;
  assert.ok(excessInfant < excessHigh, '유아기 T2 과잉이 고등기 T4 과잉보다 아프다');
});

test('적정선을 맞추면 유지비만 나가고 효과는 긍정이다', () => {
  const state = base({ consumption: { food: 1, clothing: 1, housing: 1, travel: 1 } });
  const { upkeep, delta } = consumptionOutcome(state, 'infant');

  assert.ok(upkeep > 0);
  assert.ok((delta.health ?? 0) > 0);
  assert.ok((delta.stress ?? 0) < 0);
});

test('연속 야근은 애착을 더 크게 깎는다', () => {
  const first = overtimeBondPenalty(0);
  const second = overtimeBondPenalty(1);
  const third = overtimeBondPenalty(2);
  const fourth = overtimeBondPenalty(9);

  assert.equal(first, OVERTIME.bondPenalty);
  assert.ok(second > first);
  assert.ok(third > second);
  assert.equal(fourth, third, '배수는 마지막 값에서 멈춘다');
});

test('요구가 떠 있을 때 야근하면 거절로 처리된다', () => {
  const plain = base();
  const pending = base({ pendingRequest: 'toy' });

  const afterPlain = overtime(plain);
  const afterPending = overtime(pending);

  assert.ok(afterPending.bond < afterPlain.bond, '야근 페널티에 거절 페널티가 더해져야 한다');
  assert.equal(afterPending.pendingRequest, null);
  assert.ok(afterPending.stats.independence > pending.stats.independence, '거절은 자립성을 올린다');
});

test('야근은 자금을 벌고 그 턴 표시를 남긴다', () => {
  const state = base();
  const after = overtime(state);

  assert.ok(after.funds > state.funds);
  assert.equal(after.overtimeUsedThisTurn, true);
  assert.equal(after.overtimeStreak, 1);
});
