import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createInitialState } from '../state';
import type { GameState, StatKey } from '../types';
import { judge, lifeQuality, subjectAverage, universityTier } from './ending';

const build = (stats: Partial<Record<StatKey, number>>, over: Partial<GameState> = {}): GameState => {
  const state = createInitialState(1, 0);
  return { ...state, stats: { ...state.stats, ...stats }, ...over };
};

test('교과 평균은 5과목만 본다', () => {
  const state = build({ korean: 100, english: 100, math: 100, science: 100, socialStudies: 100, fineArts: 0 });
  assert.equal(subjectAverage(state.stats), 100);
});

test('대학 티어 경계', () => {
  assert.equal(universityTier(90, 90), 'top');
  assert.equal(universityTier(90, 79), 'upper', '적합도만 높고 교과가 낮으면 최상위권이 아니다');
  assert.equal(universityTier(70, 0), 'upper');
  assert.equal(universityTier(55, 0), 'middle');
  assert.equal(universityTier(40, 0), 'vocational');
  assert.equal(universityTier(39, 0), 'none');
});

test('자립성이 낮으면 의존형 배드다', () => {
  const state = build({ esteem: 90, independence: 20 }, { bond: 90 });
  assert.equal(lifeQuality(state), 'badDependent');
});

test('자존감이 낮으면 관계형 배드다', () => {
  const state = build({ esteem: 30, independence: 80 }, { bond: 90 });
  assert.equal(lifeQuality(state), 'badRelational');
});

test('자존감이 어중간해도 애착이 없으면 관계형 배드다', () => {
  const state = build({ esteem: 45, independence: 80 }, { bond: 20 });
  assert.equal(lifeQuality(state), 'badRelational');
});

test('세 축이 모두 서야 굿이다', () => {
  const good = build({ esteem: 75, independence: 60 }, { bond: 70 });
  assert.equal(lifeQuality(good), 'good');

  const oneShort = build({ esteem: 75, independence: 50 }, { bond: 70 });
  assert.equal(lifeQuality(oneShort), 'normal');
});

// 설계서 §11 — 이 두 개가 성립하지 않으면 "좋은 대학 = 좋은 인생"을 말하는 게임이 된다.

test('최상위권 대학 + 배드엔딩이 실제로 나온다', () => {
  const state = build(
    {
      korean: 95,
      english: 95,
      math: 95,
      science: 95,
      socialStudies: 95,
      esteem: 20,
      independence: 80,
    },
    { bond: 10 },
  );

  const ending = judge(state);
  assert.equal(ending.tier, 'top');
  assert.equal(ending.quality, 'badRelational');
});

test('비진학 + 굿엔딩이 실제로 나온다', () => {
  const state = build(
    {
      korean: 0,
      english: 0,
      math: 0,
      science: 0,
      socialStudies: 0,
      ballGames: 0,
      trackSwim: 0,
      martialArts: 0,
      fineArts: 0,
      music: 0,
      performing: 0,
      health: 40,
      sociability: 20,
      esteem: 85,
      independence: 70,
    },
    { bond: 80 },
  );

  const ending = judge(state);
  assert.equal(ending.tier, 'none');
  assert.equal(ending.quality, 'good');
});

test('삶의 질 판정에 대학 티어가 끼어들지 않는다', () => {
  const smart = build({ korean: 95, english: 95, math: 95, science: 95, socialStudies: 95, esteem: 75, independence: 60 }, { bond: 70 });
  const plain = build({ esteem: 75, independence: 60 }, { bond: 70 });

  assert.equal(lifeQuality(smart), lifeQuality(plain));
});
