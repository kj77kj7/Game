import assert from 'node:assert/strict';
import { test } from 'node:test';

import { INITIAL, STAT_RANGE, TALENT } from './data/balance';
import { applyDelta, createInitialState, deserialize, mergeDelta, serialize } from './state';

test('재능은 서로 다른 두 분야로 부여된다', () => {
  for (let seed = 0; seed < 200; seed += 1) {
    const state = createInitialState(seed, 0);

    assert.equal(state.talents.length, TALENT.count);
    assert.notEqual(state.talents[0], state.talents[1], `seed ${seed}에서 재능이 겹쳤다`);
  }
});

test('여러 회차에 걸쳐 다양한 재능이 나온다', () => {
  const seen = new Set<string>();
  for (let seed = 0; seed < 200; seed += 1) {
    for (const talent of createInitialState(seed, 0).talents) seen.add(talent);
  }

  assert.equal(seen.size, 11, '11종이 모두 나올 수 있어야 한다');
});

test('같은 시드는 같은 아이를 만든다', () => {
  assert.deepEqual(createInitialState(7, 0), createInitialState(7, 0));
});

test('시작 스탯', () => {
  const state = createInitialState(1, 0);

  assert.equal(state.stats.korean, INITIAL.ability);
  assert.equal(state.stats.esteem, INITIAL.temperament);
  assert.equal(state.stats.stress, INITIAL.stress);
  assert.equal(state.needs.hunger, INITIAL.needs);
});

test('증감은 0~100을 벗어나지 않는다', () => {
  const state = createInitialState(1, 0);

  assert.equal(applyDelta(state, { stress: -999 }).stats.stress, STAT_RANGE.min);
  assert.equal(applyDelta(state, { esteem: 999 }).stats.esteem, STAT_RANGE.max);
  assert.equal(applyDelta(state, { bond: -999 }).bond, STAT_RANGE.min);
});

test('증감은 원래 상태를 건드리지 않는다', () => {
  const state = createInitialState(1, 0);
  const before = state.stats.esteem;

  applyDelta(state, { esteem: 10 });
  assert.equal(state.stats.esteem, before, '순수 함수여야 한다');
});

test('여러 출처의 증감은 더해진다', () => {
  const merged = mergeDelta({ stress: 5, esteem: -2 }, { stress: 3 }, { bond: 4 });

  assert.equal(merged.stress, 8);
  assert.equal(merged.esteem, -2);
  assert.equal(merged.bond, 4);
});

test('직렬화는 왕복한다', () => {
  const state = createInitialState(42, 1700000000000);
  const restored = deserialize(serialize(state));

  assert.deepEqual(restored, state);
});

test('깨진 저장 데이터는 null이지 예외가 아니다', () => {
  assert.equal(deserialize('{'), null);
  assert.equal(deserialize('null'), null);
  assert.equal(deserialize('{"age":1}'), null);
});
