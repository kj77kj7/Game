import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARE, STAT_RANGE } from '../data/balance';
import { createInitialState } from '../state';
import type { GameState } from '../types';
import { careGrowthBonus, drain, fill } from './care';

const HOUR_MS = 3600_000;

const base = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1, 0),
  ...over,
});

test('니즈는 시간에 따라 줄어든다', () => {
  const before = base();
  const after = drain(before, HOUR_MS);

  assert.ok(after.needs.hunger < before.needs.hunger);
  assert.ok(after.needs.hygiene < before.needs.hygiene);
});

test('허기가 청결보다 빨리 준다', () => {
  const after = drain(base(), HOUR_MS);
  assert.ok(after.needs.hunger < after.needs.hygiene);
});

test('니즈는 0 아래로 내려가지 않는다', () => {
  const after = drain(base(), HOUR_MS * 1000);

  assert.equal(after.needs.hunger, STAT_RANGE.min);
  assert.equal(after.needs.hygiene, STAT_RANGE.min);
});

test('니즈가 바닥이어도 스탯은 깎이지 않는다', () => {
  const before = base();
  const after = drain(before, HOUR_MS * 1000);

  assert.deepEqual(after.stats, before.stats, '방치 페널티는 없다');
  assert.equal(after.bond, before.bond);
});

test('채우면 가득 차고 스트레스가 조금 내려간다', () => {
  const hungry = drain(base(), HOUR_MS * 3);
  hungry.stats.stress = 50;

  const after = fill(hungry, 'hunger');

  assert.equal(after.needs.hunger, STAT_RANGE.max);
  assert.equal(after.stats.stress, 50 - CARE.fillStressRelief);
  assert.equal(after.needs.hygiene, hungry.needs.hygiene, '다른 니즈는 건드리지 않는다');
});

test('성장 보너스는 음수가 되지 않는다', () => {
  const empty = drain(base(), HOUR_MS * 1000);

  assert.equal(careGrowthBonus(empty), 0);
  assert.ok(careGrowthBonus(base()) > 0);
});
