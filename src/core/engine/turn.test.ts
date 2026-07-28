import assert from 'node:assert/strict';
import { test } from 'node:test';

import { STRESS, TRAVEL_RULES, TURN } from '../data/balance';
import { createInitialState } from '../state';
import type { GameState } from '../types';
import { endTurn, isFinished, spendSlot, stageOf, stressBandOf, stressGrowthMultiplier } from './turn';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1, 0),
  ...over,
});

test('나이 구간 경계', () => {
  assert.equal(stageOf(0), 'infant');
  assert.equal(stageOf(5), 'infant');
  assert.equal(stageOf(6), 'elementary');
  assert.equal(stageOf(12), 'elementary');
  assert.equal(stageOf(13), 'middle');
  assert.equal(stageOf(15), 'middle');
  assert.equal(stageOf(16), 'high');
  assert.equal(stageOf(18), 'high');
  assert.equal(stageOf(19), 'judgement');
});

test('스트레스 구간 경계', () => {
  assert.equal(stressBandOf(0).band, 'stable');
  assert.equal(stressBandOf(30).band, 'stable');
  assert.equal(stressBandOf(31).band, 'tired');
  assert.equal(stressBandOf(60).band, 'tired');
  assert.equal(stressBandOf(61).band, 'overload');
  assert.equal(stressBandOf(85).band, 'overload');
  assert.equal(stressBandOf(86).band, 'limit');
  assert.equal(stressBandOf(100).band, 'limit');
});

test('한계 구간만 육성을 막는다', () => {
  assert.equal(stressBandOf(85).blocksTraining, false);
  assert.equal(stressBandOf(86).blocksTraining, true);
});

test('자존감·건강이 낮을수록 스트레스가 빨리 쌓인다', () => {
  const healthy = base();
  const worn = base();
  worn.stats.esteem = 0;
  worn.stats.health = 0;

  const a = stressGrowthMultiplier(healthy.stats);
  const b = stressGrowthMultiplier(worn.stats);

  assert.ok(b > a, '악순환이 성립해야 한다');
  assert.equal(b, 1 + STRESS.lowEsteemWeight + STRESS.lowHealthWeight);
});

test('턴을 넘기면 나이가 오르고 슬롯이 다시 찬다', () => {
  const before = spendSlot(spendSlot(base()));
  assert.equal(before.slots, 0);

  const after = endTurn(before);
  assert.equal(after.age, before.age + 1);
  assert.equal(after.slots, TURN.slotsPerTurn);
});

test('대기 중이던 요구는 페널티 없이 사라진다', () => {
  const pending = base({ pendingRequest: 'toy' });
  const after = endTurn(pending);

  assert.equal(after.pendingRequest, null);
  assert.equal(after.bond, pending.bond, '턴을 넘겼다고 애착을 깎으면 안 된다');
  assert.equal(after.stats.independence, pending.stats.independence);
});

test('야근을 쉰 턴에는 연속 횟수가 끊긴다', () => {
  const worked = base({ overtimeStreak: 2, overtimeUsedThisTurn: true });
  assert.equal(endTurn(worked).overtimeStreak, 2);

  const rested = base({ overtimeStreak: 2, overtimeUsedThisTurn: false });
  assert.equal(endTurn(rested).overtimeStreak, 0);
});

// 매 턴 기본 +3(설계서 §8)과 적정 소비의 스트레스 감소(§6-4)가 같은 턴에 겹친다.
// 유아기·적정 티어 기준으로는 감소 쪽이 커서, 아무것도 안 한 턴은 오히려 회복된다.
// 육성 행동 한 번(+5~+22)이면 바로 뒤집히므로 시스템이 무력해지지는 않는다.
test('적정 소비를 유지하면 아무것도 안 한 턴은 스트레스가 회복된다', () => {
  const before = base();
  before.stats.stress = 40;

  assert.ok(endTurn(before).stats.stress < before.stats.stress);
});

test('결핍 상태로 두면 턴을 넘길 때 스트레스가 쌓인다', () => {
  const lacking = base({ age: 16, consumption: { food: 1, clothing: 1, housing: 1, travel: 1 } });
  lacking.stats.stress = 40;

  assert.ok(endTurn(lacking).stats.stress > lacking.stats.stress);
});

test('여행이 오래 없으면 스트레스가 가속된다', () => {
  const rested = base({ turnsSinceTravel: 0 });
  const drought = base({ turnsSinceTravel: TRAVEL_RULES.droughtTurns });
  rested.stats.stress = 40;
  drought.stats.stress = 40;

  assert.ok(endTurn(drought).stats.stress > endTurn(rested).stats.stress);
});

test('19세에 도달하면 끝난다', () => {
  assert.equal(isFinished(base({ age: 18 })), false);
  assert.equal(isFinished(base({ age: 19 })), true);
});
