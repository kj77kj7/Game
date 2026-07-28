/** 계열 적합도 집계 */

import { UNDECIDED_MAJOR_GAP } from '../data/balance';
import { MAJOR_FIT, MAJOR_IDS } from '../data/majors';
import type { MajorId, StatKey } from '../types';

type Stats = Record<StatKey, number>;

export function majorFits(stats: Stats): Record<MajorId, number> {
  return {
    humanities: MAJOR_FIT.humanities(stats),
    engineering: MAJOR_FIT.engineering(stats),
    commerce: MAJOR_FIT.commerce(stats),
    medicine: MAJOR_FIT.medicine(stats),
    arts: MAJOR_FIT.arts(stats),
    sports: MAJOR_FIT.sports(stats),
  };
}

export interface BestMajor {
  major: MajorId;
  fit: number;
  /** 차순위와의 차이. 작으면 자유전공·복수전공으로 서술한다 */
  gap: number;
  undecided: boolean;
}

export function bestMajor(stats: Stats): BestMajor {
  const fits = majorFits(stats);
  const ranked = [...MAJOR_IDS].sort((a, b) => fits[b] - fits[a]);

  const top = ranked[0] ?? 'humanities';
  const second = ranked[1];
  const gap = second === undefined ? fits[top] : fits[top] - fits[second];

  return { major: top, fit: fits[top], gap, undecided: gap < UNDECIDED_MAJOR_GAP };
}
