/** 재능 분야 11종 정의 */

import type { TalentField } from '../types';

/**
 * 재능은 계열이 아니라 세부 분야 단위로 걸린다 (설계서 §9).
 * 계열 단위로 주면 자연공학+의약처럼 과목이 겹치는 조합이 나와 사실상 재능 1개가 된다.
 */
export const TALENT_FIELDS = [
  { field: 'korean', label: '국어', line: 'subject' },
  { field: 'english', label: '영어', line: 'subject' },
  { field: 'math', label: '수학', line: 'subject' },
  { field: 'science', label: '과학', line: 'subject' },
  { field: 'socialStudies', label: '사회', line: 'subject' },
  { field: 'ballGames', label: '구기', line: 'sport' },
  { field: 'trackSwim', label: '육상·수영', line: 'sport' },
  { field: 'martialArts', label: '무술', line: 'sport' },
  { field: 'fineArts', label: '미술', line: 'art' },
  { field: 'music', label: '음악', line: 'art' },
  { field: 'performing', label: '연기·무용', line: 'art' },
] as const satisfies readonly { field: TalentField; label: string; line: string }[];

export type TalentLine = (typeof TALENT_FIELDS)[number]['line'];
