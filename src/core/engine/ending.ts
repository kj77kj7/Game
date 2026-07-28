/** 3축 엔딩 판정 */

import { LIFE_QUALITY, UNIVERSITY_TIERS } from '../data/balance';
import type { Ending, GameState, LifeQuality, StatKey, UniversityTier } from '../types';
import { bestMajor } from './major';

type Stats = Record<StatKey, number>;

const SUBJECTS: readonly StatKey[] = [
  'korean',
  'english',
  'math',
  'science',
  'socialStudies',
];

export function subjectAverage(stats: Stats): number {
  const total = SUBJECTS.reduce((sum, key) => sum + stats[key], 0);
  return total / SUBJECTS.length;
}

export function universityTier(fit: number, subjectAvg: number): UniversityTier {
  const matched = UNIVERSITY_TIERS.find(
    (t) => fit >= t.minFit && subjectAvg >= t.minSubjectAverage,
  );
  return matched?.tier ?? 'none';
}

/**
 * 대학 티어와 완전히 독립이다 (설계서 §11).
 * 최상위권 + 배드, 비진학 + 굿이 둘 다 나와야 한다.
 * 이 함수에 대학 티어를 인자로 넘기고 싶어지면, 그건 설계가 무너지는 신호다.
 */
export function lifeQuality(state: GameState): LifeQuality {
  const { esteem, independence } = state.stats;
  const bond = state.bond;

  if (independence < LIFE_QUALITY.badDependent.independence) return 'badDependent';

  const lowEsteem = esteem < LIFE_QUALITY.badRelational.esteem;
  const isolated =
    esteem < LIFE_QUALITY.badRelational.esteemWithLowBond &&
    bond < LIFE_QUALITY.badRelational.bond;
  if (lowEsteem || isolated) return 'badRelational';

  const good =
    esteem >= LIFE_QUALITY.good.esteem &&
    bond >= LIFE_QUALITY.good.bond &&
    independence >= LIFE_QUALITY.good.independence;

  return good ? 'good' : 'normal';
}

export function judge(state: GameState): Ending {
  const best = bestMajor(state.stats);

  return {
    tier: universityTier(best.fit, subjectAverage(state.stats)),
    major: best.major,
    undecided: best.undecided,
    quality: lifeQuality(state),
  };
}
