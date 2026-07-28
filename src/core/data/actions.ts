/** 행동 테이블 */

import type { ActionId } from '../types';

/**
 * 수치는 balance.ts의 `ACTION_BALANCE`에 있다. 여기에는 이름과 분류만 둔다.
 *
 * `training` 계열(교과·운동·예술)만 재능 일치·불일치 판정 대상이다.
 * 함께 놀아주기나 수면까지 불일치로 세면 관계·생활 행동에 벌을 주는 게 되어
 * "부재는 벌하지 않는다"와 어긋난다.
 */
export const ACTION_META = {
  reading: { label: '독서', category: 'subject' },
  workbook: { label: '학습지', category: 'subject' },
  cramSchool: { label: '보습학원', category: 'subject' },
  langAcademy: { label: '어학원', category: 'subject' },
  scienceLab: { label: '과학실험교실', category: 'subject' },
  examAcademy: { label: '입시학원', category: 'subject' },

  ballClass: { label: '축구·농구교실', category: 'sport' },
  swimTrack: { label: '수영·육상', category: 'sport' },
  martialClass: { label: '태권도·복싱', category: 'sport' },

  artAcademy: { label: '미술학원', category: 'art' },
  musicLesson: { label: '피아노·악기', category: 'art' },
  performingAcademy: { label: '연기·무용학원', category: 'art' },

  playTogether: { label: '함께 놀아주기', category: 'relation' },
  friendPlay: { label: '친구와 놀기', category: 'relation' },
  seriousTalk: { label: '진지한 대화', category: 'relation' },

  sleep: { label: '충분한 수면', category: 'life' },
  checkup: { label: '병원 검진', category: 'life' },
} as const satisfies Record<ActionId, { label: string; category: string }>;

export type ActionCategory = (typeof ACTION_META)[ActionId]['category'];

/** 재능 일치·불일치를 따지는 계열 */
export const TRAINING_CATEGORIES: readonly ActionCategory[] = ['subject', 'sport', 'art'];
