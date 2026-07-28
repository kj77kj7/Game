import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ACTION_BALANCE, TALENT } from '../data/balance';
import { createInitialState } from '../state';
import type { GameState } from '../types';
import { actionCost, applyAction, repeatGradeOf, targetFieldOf } from './action';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1, 0),
  age: 10,
  funds: 100000,
  ...over,
});

test('해금 나이 전에는 막힌다', () => {
  const young = base({ age: 4 });
  const result = applyAction(young, 'reading');

  assert.equal(result.blocked, 'locked');
  assert.deepEqual(result.state, young, '막히면 상태가 그대로여야 한다');
});

test('자금이 모자라면 막힌다', () => {
  const broke = base({ funds: 0 });
  assert.equal(applyAction(broke, 'cramSchool', 'math').blocked, 'funds');
});

test('재능과 일치하면 해당 능력치가 더 오른다', () => {
  const talented = base({ talents: ['korean', 'music'] });
  const plain = base({ talents: ['math', 'fineArts'] });

  const withTalent = applyAction(talented, 'reading').state.stats.korean;
  const without = applyAction(plain, 'reading').state.stats.korean;

  assert.ok(withTalent > without);
  assert.ok(Math.abs(withTalent / without - TALENT.bonus) < 1e-9);
});

test('재능 보너스는 재능이 걸린 능력치에만 붙는다', () => {
  const talented = base({ talents: ['ballGames', 'music'] });
  const plain = base({ talents: ['math', 'fineArts'] });

  // 축구·농구교실은 구기와 사회성을 같이 올린다. 재능은 구기에만 걸려 있다.
  const a = applyAction(talented, 'ballClass').state.stats;
  const b = applyAction(plain, 'ballClass').state.stats;

  assert.ok(a.ballGames > b.ballGames);
  assert.equal(a.sociability, b.sociability, '사회성까지 배율을 받으면 안 된다');
});

test('한계 구간에서는 교과·예체능이 실패하고 비용만 나간다', () => {
  const limit = base({ age: 10 });
  limit.stats.stress = 90;

  const result = applyAction(limit, 'cramSchool', 'math');
  const cost = actionCost(limit, 'cramSchool');

  assert.equal(result.blocked, 'stress');
  assert.equal(result.state.stats.math, limit.stats.math, '스탯은 0이어야 한다');
  assert.equal(result.state.funds, limit.funds - cost, '비용은 나가야 한다');
  assert.equal(result.state.actionCounts.cramSchool, undefined, '실패는 숙련으로 쌓이지 않는다');
});

test('한계 구간에서도 관계·생활 행동은 된다', () => {
  const limit = base({ age: 10 });
  limit.stats.stress = 90;

  const result = applyAction(limit, 'sleep');
  assert.equal(result.blocked, 'none');
  assert.ok(result.state.stats.stress < limit.stats.stress);
});

test('반복 등급 경계', () => {
  assert.equal(repeatGradeOf(0).grade, 'novice');
  assert.equal(repeatGradeOf(2).grade, 'novice');
  assert.equal(repeatGradeOf(3).grade, 'skilled');
  assert.equal(repeatGradeOf(5).grade, 'skilled');
  assert.equal(repeatGradeOf(6).grade, 'advanced');
  assert.equal(repeatGradeOf(9).grade, 'expert');
  assert.equal(repeatGradeOf(50).grade, 'expert');
});

test('반복할수록 효과도 비용도 커진다', () => {
  const fresh = base({ actionCounts: {} });
  const veteran = base({ actionCounts: { cramSchool: 9 } });

  assert.ok(actionCost(veteran, 'cramSchool') > actionCost(fresh, 'cramSchool'));

  assert.equal(
    actionCost(veteran, 'cramSchool'),
    Math.round(ACTION_BALANCE.cramSchool.cost * repeatGradeOf(9).cost),
  );

  // 비용만 오르고 효과가 안 오르면 반복이 순수한 손해가 된다
  const freshGain = applyAction(fresh, 'cramSchool', 'math').state.stats.math;
  const veteranGain = applyAction(veteran, 'cramSchool', 'math').state.stats.math;

  assert.ok(veteranGain > freshGain);
  assert.ok(
    Math.abs(veteranGain / freshGain - repeatGradeOf(9).effect / repeatGradeOf(0).effect) < 1e-9,
  );
});

test('재능 밖 행동을 반복하면 문턱에서 페널티가 붙는다', () => {
  let state = base({ talents: ['music', 'fineArts'], age: 10 });
  const startEsteem = state.stats.esteem;

  for (let i = 0; i < TALENT.mismatchThreshold - 1; i += 1) {
    state = applyAction(state, 'reading').state;
  }
  assert.equal(state.stats.esteem, startEsteem, '문턱 전에는 자존감이 그대로다');

  const before = state.stats.esteem;
  state = applyAction(state, 'reading').state;

  assert.equal(state.mismatchCount, TALENT.mismatchThreshold);
  assert.equal(state.stats.esteem, before - TALENT.mismatchEsteemPenalty);
});

test('관계·생활 행동은 불일치로 세지 않는다', () => {
  let state = base({ talents: ['music', 'fineArts'] });

  for (let i = 0; i < 10; i += 1) {
    state = applyAction(state, 'playTogether').state;
  }

  assert.equal(state.mismatchCount, 0, '함께 놀아주기에 벌을 주면 안 된다');
});

test('학습지의 대상 과목은 플레이어가 고른다', () => {
  const state = base();
  assert.equal(targetFieldOf(state, 'workbook', 'science'), 'science');
});

test('입시학원은 그 시점 최고 교과를 잡는다', () => {
  const state = base({ age: 16 });
  state.stats.english = 70;
  state.stats.math = 20;

  assert.equal(targetFieldOf(state, 'examAcademy'), 'english');
});

test('교과 정체 턴에는 교과만 멈추고 다른 계열은 자란다', () => {
  const normal = base({ age: 10, subjectsStalled: false });
  const stalled = base({ age: 10, subjectsStalled: true });

  assert.ok(applyAction(normal, 'cramSchool', 'math').state.stats.math > normal.stats.math);
  assert.equal(applyAction(stalled, 'cramSchool', 'math').state.stats.math, stalled.stats.math);

  // 예체능은 그대로 자란다 — 학원을 그만둔 것이지 아이가 멈춘 게 아니다
  assert.ok(applyAction(stalled, 'artAcademy').state.stats.fineArts > stalled.stats.fineArts);
});

test('과목을 고르지 않으면 학습지는 아무 과목도 올리지 않는다', () => {
  const state = base({ age: 10 });
  const without = applyAction(state, 'workbook').state.stats;

  // 화면에서 과목 선택을 빼먹으면 스트레스만 오르는 행동이 된다.
  // ActionSheet가 과목을 고른 뒤에만 실행하는 이유가 이것이다.
  assert.equal(without.math, state.stats.math);
  assert.ok(without.stress > state.stats.stress);

  assert.ok(applyAction(state, 'workbook', 'math').state.stats.math > state.stats.math);
});
