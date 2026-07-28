import assert from 'node:assert/strict';
import { test } from 'node:test';

import { UNDECIDED_MAJOR_GAP } from '../data/balance';
import { createInitialState } from '../state';
import type { StatKey } from '../types';
import { bestMajor, majorFits } from './major';

const stats = (over: Partial<Record<StatKey, number>> = {}): Record<StatKey, number> => ({
  ...createInitialState(1, 0).stats,
  ...over,
});

test('평균형 계열은 고르게 올려야 한다', () => {
  const lopsided = majorFits(stats({ math: 100, science: 0 })).engineering;
  const even = majorFits(stats({ math: 50, science: 50 })).engineering;

  assert.equal(lopsided, even, '자연공학은 합이 같으면 같은 점수다');
});

test('최고값형 계열은 하나만 몰아도 된다', () => {
  const spike = majorFits(stats({ fineArts: 90 })).arts;
  const spread = majorFits(stats({ fineArts: 30, music: 30, performing: 30 })).arts;

  assert.ok(spike > spread, '예술은 한 분야에 몰아주는 게 유리해야 한다');
});

test('의약은 과학을 더 크게 본다', () => {
  const scienceHeavy = majorFits(stats({ science: 80, math: 40 })).medicine;
  const mathHeavy = majorFits(stats({ science: 40, math: 80 })).medicine;

  assert.ok(scienceHeavy > mathHeavy);
});

test('의약은 자연공학보다 문턱이 높다', () => {
  // 같은 과학·수학 값이라면 의약이 자연공학보다 낮게 나오면 안 되지만,
  // 한쪽만 올린 경우에는 의약이 더 손해여야 "두 과목을 다 끌어올리는 고비용 루트"가 된다.
  const single = stats({ science: 100, math: 0 });
  assert.ok(majorFits(single).medicine > majorFits(single).engineering);

  const onlyMath = stats({ science: 0, math: 100 });
  assert.ok(majorFits(onlyMath).medicine < majorFits(onlyMath).engineering);
});

test('체육은 건강이 받쳐줘야 한다', () => {
  const fit = majorFits(stats({ ballGames: 80, health: 90 })).sports;
  const weak = majorFits(stats({ ballGames: 80, health: 10 })).sports;

  assert.ok(fit > weak);
});

test('상경은 사회성을 본다', () => {
  const social = majorFits(stats({ math: 60, socialStudies: 60, sociability: 90 })).commerce;
  const shy = majorFits(stats({ math: 60, socialStudies: 60, sociability: 10 })).commerce;

  assert.ok(social > shy);
});

test('최고 계열과 차순위가 붙으면 자유전공이다', () => {
  const tied = bestMajor(stats({ math: 60, science: 60, socialStudies: 60 }));
  assert.ok(tied.gap < UNDECIDED_MAJOR_GAP);
  assert.equal(tied.undecided, true);

  const clear = bestMajor(stats({ fineArts: 100, music: 100, performing: 100 }));
  assert.ok(clear.gap >= UNDECIDED_MAJOR_GAP);
  assert.equal(clear.undecided, false);
  assert.equal(clear.major, 'arts');
});
