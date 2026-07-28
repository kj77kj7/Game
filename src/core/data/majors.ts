/** 계열별 계산식 */

import type { MajorId, StatKey } from '../types';
import { MAJOR_WEIGHTS as W } from './balance';

type Stats = Record<StatKey, number>;

const mean = (values: readonly number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

const peak = (values: readonly number[]): number => Math.max(...values);

export const MAJOR_LABEL = {
  humanities: '인문',
  engineering: '자연공학',
  commerce: '상경',
  medicine: '의약',
  arts: '예술',
  sports: '체육',
} as const satisfies Record<MajorId, string>;

/**
 * 계열마다 판정 방식이 다른 것이 핵심이다 (설계서 §4).
 *
 * 평균형은 여러 스탯을 고르게 올려야 하고, 최고값형은 하나만 몰아도 된다.
 * 같은 편중 전략이라도 계열마다 플레이 패턴이 달라지는 게 리플레이 동기다.
 * 여기서 형태를 통일해버리면 6계열이 이름만 다른 하나가 된다.
 */
export const MAJOR_FIT = {
  humanities: (s: Stats) => mean([s.korean, s.english, s.socialStudies]),
  engineering: (s: Stats) => mean([s.math, s.science]),
  commerce: (s: Stats) => mean([s.math, s.socialStudies, s.sociability]),

  /** 두 과목을 다 끌어올려야 하는 고비용 루트 */
  medicine: (s: Stats) =>
    (s.science * W.medicineScience + s.math * W.medicineMath) / W.medicineDivisor,

  /** 하나만 몰아도 되는 저비용 루트 */
  arts: (s: Stats) => {
    const three = [s.fineArts, s.music, s.performing];
    return peak(three) * W.peak + mean(three) * W.support;
  },
  sports: (s: Stats) => {
    const three = [s.ballGames, s.trackSwim, s.martialArts];
    return peak(three) * W.peak + s.health * W.support;
  },
} as const satisfies Record<MajorId, (s: Stats) => number>;
