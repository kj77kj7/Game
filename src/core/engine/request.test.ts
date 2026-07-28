import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REQUEST_BALANCE, REQUEST_RATE } from '../data/balance';
import { createInitialState } from '../state';
import type { GameState } from '../types';
import {
  acceptRequest,
  canAfford,
  rejectRequest,
  requestChance,
  rollRequest,
  stallsSubjects,
} from './request';

const base = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1, 0),
  funds: 100000,
  ...over,
});

test('자립성이 낮을수록 요구가 잦아진다', () => {
  assert.equal(requestChance(REQUEST_RATE.lowIndependence), REQUEST_RATE.base);
  assert.equal(requestChance(100), REQUEST_RATE.base);
  assert.ok(requestChance(0) > requestChance(15));
  assert.ok(requestChance(15) > requestChance(29));
  assert.equal(requestChance(0), REQUEST_RATE.base + REQUEST_RATE.lowIndependenceBonus);
});

test('나이에 맞는 요구만 나온다', () => {
  const toddler = base({ age: 3 });
  toddler.stats.independence = 0;

  for (let seed = 0; seed < 40; seed += 1) {
    const rolled = rollRequest({ ...toddler, seed });
    if (rolled.request === null) continue;
    assert.equal(rolled.request, 'toy', '유아기에 해외여행 요구가 나오면 안 된다');
  }
});

test('자립성이 높으면 아이가 스스로 접는다', () => {
  const grown = base({ age: 3 });
  grown.stats.independence = 100;

  let restrained = 0;
  for (let seed = 0; seed < 60; seed += 1) {
    const rolled = rollRequest({ ...grown, seed });
    assert.equal(rolled.request, null);
    if (rolled.selfRestrained) restrained += 1;
  }

  assert.ok(restrained > 0, '참은 걸 보여줘야 자립성이 보상으로 읽힌다');
});

test('수용은 애착을 올리고 자립성과 자금을 깎는다', () => {
  const state = base({ age: 3, pendingRequest: 'toy' });
  const after = acceptRequest(state, 'toy');

  assert.ok(after.bond > state.bond);
  assert.ok(after.stats.independence < state.stats.independence);
  assert.equal(after.funds, state.funds - REQUEST_BALANCE.toy.cost);
  assert.equal(after.pendingRequest, null);
});

test('거절은 애착을 깎고 자립성을 올린다', () => {
  const state = base({ age: 3, pendingRequest: 'toy' });
  const after = rejectRequest(state, 'toy');

  assert.ok(after.bond < state.bond);
  assert.ok(after.stats.independence > state.stats.independence);
  assert.equal(after.pendingRequest, null);
});

test('자금이 모자라면 수용되지 않는다', () => {
  const broke = base({ funds: 0, age: 3, pendingRequest: 'toy' });

  assert.equal(canAfford(broke, 'toy'), false);
  assert.deepEqual(acceptRequest(broke, 'toy'), broke);
});

test('요구를 그냥 두면 아무 일도 일어나지 않는다', () => {
  const state = base({ age: 3, pendingRequest: 'toy' });
  const rolled = rollRequest(state);

  assert.equal(rolled.state.bond, state.bond, '부재는 벌하지 않는다');
  assert.equal(rolled.state.stats.esteem, state.stats.esteem);
});

test('학원 그만두기만 교과를 멈춘다', () => {
  assert.equal(stallsSubjects('quitAcademy'), true);
  assert.equal(stallsSubjects('toy'), false);
  assert.equal(stallsSubjects('overseasTrip'), false);
});

test('같은 시드는 같은 결과를 낸다', () => {
  const state = base({ age: 3 });
  const a = rollRequest({ ...state, seed: 12345 });
  const b = rollRequest({ ...state, seed: 12345 });

  assert.equal(a.request, b.request);
  assert.equal(a.state.seed, b.state.seed);
});
