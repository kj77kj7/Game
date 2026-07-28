/**
 * 모든 수치 상수의 단일 출처
 *
 * 다른 파일에는 매직 넘버를 두지 않는다. 밸런싱할 때 이 파일 하나만 열면 되게 유지한다.
 * 등급 경계값과 엔딩 판정 문턱이 같은 파일에 있어야 "잘함이라고 떴는데 못 갔다"가 안 생긴다 (설계서 §12).
 *
 * `[임시]` 표시가 붙은 값은 설계서에 명시가 없어 이번에 정한 값이다.
 * Phase 7 시뮬레이션(§18 체크리스트)으로 검증하기 전까지는 확정된 수치가 아니다.
 */

import type {
  ActionBalance,
  AgeStage,
  ConsumptionBalance,
  ConsumptionTier,
  RequestBalance,
  StatKey,
  UpgradeBalance,
} from '../types';

// ---------------------------------------------------------------------------
// 진행
// ---------------------------------------------------------------------------

export const TURN = {
  startAge: 0,
  /** 19세는 엔딩 판정 턴이다. 0~19 = 20턴이지만 육성 턴은 19개 */
  finalAge: 19,
  slotsPerTurn: 2,
  /** 리워드 광고 시청 시 해당 턴에만 추가되는 슬롯 */
  adBonusSlot: 1,
} as const;

export const AGE_STAGES = [
  { stage: 'infant', min: 0, max: 5 },
  { stage: 'elementary', min: 6, max: 12 },
  { stage: 'middle', min: 13, max: 15 },
  { stage: 'high', min: 16, max: 18 },
  { stage: 'judgement', min: 19, max: 19 },
] as const;

export const STAT_RANGE = { min: 0, max: 100 } as const;

/** [임시] 시작값. 설계서에 명시가 없다 */
export const INITIAL = {
  /** 교과·운동·예술 세부 11종 */
  ability: 0,
  /** 건강·사회성·자존감·자립성. 스트레스만 0에서 시작한다 */
  temperament: 50,
  stress: 0,
  needs: 100,
  funds: 100,
  bond: 50,
} as const;

// ---------------------------------------------------------------------------
// 스트레스 (설계서 §8)
//
// `기분`은 독립 스탯이 아니라 이 구간의 표시용 이름이다.
// 화면 표기와 성장 배율을 같은 줄에 두어야 겉과 속이 어긋나지 않는다.
// ---------------------------------------------------------------------------

export const STRESS_BANDS = [
  { band: 'stable', max: 30, moodLabel: '좋음', growth: 1.0, blocksTraining: false },
  { band: 'tired', max: 60, moodLabel: '그저 그럼', growth: 0.8, blocksTraining: false },
  { band: 'overload', max: 85, moodLabel: '지침', growth: 0.5, blocksTraining: false },
  { band: 'limit', max: 100, moodLabel: '한계', growth: 0, blocksTraining: true },
] as const;

export const STRESS = {
  perTurn: 3,
  /** [임시] 자존감·건강이 낮을수록 증가율이 올라간다. 0이면 가중 없음, 1이면 최대 2배 */
  lowEsteemWeight: 0.5,
  lowHealthWeight: 0.5,
} as const;

// ---------------------------------------------------------------------------
// 화면 등급 표기 (설계서 §12)
//
// 숫자를 노출하지 않는다. 이 경계값이 엔딩 판정 문턱과 같은 파일에 있어야
// "우수라고 떴는데 원하는 대학을 못 갔다"가 안 생긴다.
// ---------------------------------------------------------------------------

/** 선택지 미리보기에서 ▲▲로 표시할 변화량 문턱 (설계서 §12) */
export const PREVIEW_STRONG = 15;

export const STAT_GRADES = [
  { max: 19, label: '미흡' },
  { max: 39, label: '보통' },
  { max: 59, label: '양호' },
  { max: 79, label: '우수' },
  { max: 100, label: '뛰어남' },
] as const;

// ---------------------------------------------------------------------------
// 반복 등급 · 재능 (설계서 §9)
// ---------------------------------------------------------------------------

export const REPEAT_GRADES = [
  { grade: 'novice', minCount: 1, label: '입문', effect: 1.0, cost: 1.0 },
  { grade: 'skilled', minCount: 3, label: '숙련', effect: 1.4, cost: 1.6 },
  { grade: 'advanced', minCount: 6, label: '심화', effect: 1.8, cost: 2.4 },
  { grade: 'expert', minCount: 9, label: '최상위', effect: 2.2, cost: 3.5 },
] as const;

export const TALENT = {
  /** 시작 시 부여되는 재능 개수. 서로 다른 분야 */
  count: 2,
  /** 재능 분야 행동의 해당 스탯 성장 배율 */
  bonus: 1.3,
  /** 재능 밖 행동이 이 횟수를 넘기면 페널티가 붙는다 */
  mismatchThreshold: 6,
  mismatchStressMultiplier: 2,
  /** [임시] 불일치 페널티 구간에서 육성 행동마다 깎이는 자존감 */
  mismatchEsteemPenalty: 3,
} as const;

// ---------------------------------------------------------------------------
// 돌봄 니즈 (설계서 §1)
//
// 안 채웠다고 스탯을 깎지 않는다. 채웠을 때만 보너스가 붙는다.
// 이 파일에 감점 상수를 추가하지 말 것.
// ---------------------------------------------------------------------------

export const CARE = {
  tickMs: 1000,
  /** [임시] 100 → 0까지 걸리는 시간. 세션 간격(4~5분)보다 충분히 길어야 재방문이 벌처럼 느껴지지 않는다 */
  hungerDrainHours: 4,
  hygieneDrainHours: 6,
  /** 채웠을 때: 스트레스 감소 + 그 턴 성장 보너스 */
  fillStressRelief: 3,
  fillGrowthBonus: 0.05,
} as const;

// ---------------------------------------------------------------------------
// 경제 (설계서 §6)
// ---------------------------------------------------------------------------

export const INCOME = {
  tickMs: 1000,
  /** [임시] 업그레이드 0레벨 기준 초당 수급 */
  basePerTick: 1,
  /** 오프라인 누적 상한. 상한에 닿으면 멈춘다 — 손해 회피가 아니라 자원 회수가 재방문 동기다 */
  baseCapHours: 12,
} as const;

/** [임시] 행동 비용 등급. 설계서 §7은 없음/낮음/중간/높음/매우높음으로만 적혀 있다 */
export const COST = {
  none: 0,
  low: 40,
  mid: 100,
  high: 200,
  veryHigh: 400,
} as const;

export const UPGRADE_BALANCE = {
  sideJob: {
    baseCost: 50,
    growth: 1.15,
    maxLevel: 50,
    flatPerLevel: 1,
  },
  promotion: {
    baseCost: 500,
    growth: 1.35,
    maxLevel: 20,
    multiplierPerLevel: 1.15,
    requires: { id: 'sideJob', level: 5 },
  },
  investment: {
    baseCost: 5000,
    growth: 1.6,
    maxLevel: 15,
    multiplierPerLevel: 1.25,
    requires: { id: 'promotion', level: 5 },
  },
  realEstate: {
    baseCost: 50000,
    growth: 2.0,
    maxLevel: 10,
    multiplierPerLevel: 1.4,
    requires: { id: 'investment', level: 5 },
  },
  /** 12h → 24h → 48h. 계단식이라 maxLevel 2 */
  capacity: {
    baseCost: 2000,
    growth: 4,
    maxLevel: 2,
    capHoursPerLevel: 12,
  },
} as const satisfies Record<string, UpgradeBalance>;

export const OVERTIME = {
  slotCost: 1,
  /** [임시] 자동 수급 N시간치를 한 번에 준다 */
  incomeHours: 6,
  bondPenalty: 8,
  /** 연속 야근 배수. 인덱스 = 연속 횟수 − 1, 넘어가면 마지막 값 유지 */
  streakMultipliers: [1, 1.5, 2],
  /** 3회 이상이면 아이 대사를 부정으로 고정한다 */
  negativeDialogueStreak: 3,
} as const;

// ---------------------------------------------------------------------------
// 소비 — 역U자 곡선 (설계서 §6-4)
//
// 돈이 무한해도 적정선을 넘기면 손해다. 이게 방치형 무한 수급과 선택을 양립시킨다.
// ---------------------------------------------------------------------------

export const CONSUMPTION_BALANCE = {
  food: {
    cost: [10, 30, 80, 200],
    usesSlot: false,
    fitEffects: { health: 3, stress: -3 },
  },
  clothing: {
    cost: [8, 25, 70, 180],
    usesSlot: false,
    fitEffects: { sociability: 3, esteem: 3 },
  },
  housing: {
    cost: [20, 50, 130, 320],
    usesSlot: false,
    fitEffects: { stress: -4 },
  },
  /** 여행만 슬롯을 쓴다. 그래야 "학원 대신 여행"이 성립한다 */
  travel: {
    cost: [20, 60, 160, 400],
    usesSlot: true,
    fitEffects: { bond: 10, stress: -12 },
  },
} as const satisfies Record<string, ConsumptionBalance>;

/** [임시] 집이 적정 티어일 때 붙는 학습 효율 보너스. 다른 카테고리와 형태가 달라 따로 둔다 */
export const HOUSING_LEARNING_BONUS = 0.05;

/** 적정 티어는 나이에 따라 이동한다. 고정하면 한 번 맞춰놓고 잊는다 (설계서 §6-4) */
export const CONSUMPTION_FIT: Record<AgeStage, readonly [ConsumptionTier, ConsumptionTier]> = {
  infant: [1, 1],
  elementary: [1, 2],
  middle: [2, 3],
  high: [2, 3],
  judgement: [2, 3],
};

export const CONSUMPTION_PENALTY = {
  /** [임시] 적정선 미만 1티어당. 또래 사이 위축 */
  lack: { esteem: -3, sociability: -2 } satisfies Partial<Record<StatKey, number>>,
  /** [임시] 적정선 초과 1티어당. 부모 의존 */
  excess: { independence: -3 } satisfies Partial<Record<StatKey, number>>,
  /** 결핍 페널티는 또래 비교가 시작되는 중등부터 커진다 */
  lackScale: { infant: 0.5, elementary: 1, middle: 1.5, high: 2, judgement: 2 },
  /** 과잉 페널티는 유아기에 가장 크다. 명품·해외여행은 대부분 낭비다 */
  excessScale: { infant: 2, elementary: 1.5, middle: 1, high: 1, judgement: 1 },
} as const;

export const TRAVEL_RULES = {
  /** 이 턴 수 이상 여행이 없으면 스트레스 누적이 가속된다 */
  droughtTurns: 3,
  /** [임시] 가속량. 턴당 추가 스트레스 */
  droughtStressPerTurn: 4,
  /** 매 턴 여행하면 애착 획득이 급감한다 */
  consecutiveBondScale: 0.3,
  /** [임시] 매 턴 여행 시 자립성 하락 */
  consecutiveIndependencePenalty: 4,
  /** T4 장기여행은 그 턴 교과 성장을 멈춘다 */
  stallTier: 4,
} as const;

// ---------------------------------------------------------------------------
// 요구 이벤트 (설계서 §10)
//
// 요구에 실시간 타이머를 걸지 않는다. 부재는 벌하지 않고, 화면에서 보고 고른 거절만 벌한다.
// ---------------------------------------------------------------------------

export const REQUEST_BALANCE = {
  toy: {
    minAge: 0,
    maxAge: 5,
    cost: 30,
    accept: { bond: 6, independence: -4 },
    reject: { bond: -3, independence: 5 },
  },
  gameConsole: {
    minAge: 6,
    maxAge: 12,
    cost: 150,
    accept: { bond: 8, sociability: 4, independence: -6 },
    reject: { bond: -5, sociability: -3, independence: 8 },
  },
  sneakers: {
    minAge: 13,
    maxAge: 15,
    cost: 180,
    accept: { bond: 8, independence: -6 },
    reject: { bond: -5, esteem: -3, independence: 8 },
  },
  quitAcademy: {
    minAge: 13,
    maxAge: 15,
    cost: 0,
    accept: { stress: -15 },
    reject: { stress: 10, esteem: -5 },
    stallsSubjects: true,
  },
  overseasTrip: {
    minAge: 16,
    maxAge: 18,
    cost: 600,
    accept: { bond: 10, sociability: 8, independence: -8 },
    reject: { bond: -8, sociability: -5, independence: 10 },
  },
} as const satisfies Record<string, RequestBalance>;

export const REQUEST_RATE = {
  /** 전체 이벤트의 약 30%를 요구 이벤트로 (설계서 §10) */
  base: 0.3,
  /** 자립성이 이 값 아래면 빈도가 오른다. 악순환을 만든다 */
  lowIndependence: 30,
  /** [임시] 자립성이 0일 때 더해지는 최대 확률 */
  lowIndependenceBonus: 0.2,
  /** 자립성이 이 값 이상이면 아이가 스스로 포기하는 서술이 나온다 */
  highIndependence: 70,
} as const;

// ---------------------------------------------------------------------------
// 행동 테이블 (설계서 §7)
// ---------------------------------------------------------------------------

export const ACTION_BALANCE = {
  // 교과
  reading: { unlockAge: 5, cost: COST.none, effects: { korean: 6 } },
  workbook: {
    unlockAge: 6,
    cost: COST.low,
    effects: { stress: 5 },
    dynamic: { pick: 'chosen', delta: 8 },
  },
  cramSchool: {
    unlockAge: 8,
    cost: COST.mid,
    effects: { stress: 12 },
    dynamic: { pick: 'chosen', delta: 15 },
  },
  langAcademy: {
    unlockAge: 5,
    cost: COST.high,
    effects: { english: 18, stress: 15, sociability: -3 },
  },
  scienceLab: { unlockAge: 9, cost: COST.mid, effects: { science: 14, stress: 8 } },
  examAcademy: {
    unlockAge: 16,
    cost: COST.veryHigh,
    effects: { stress: 22, esteem: -4 },
    dynamic: { pick: 'topSubject', delta: 25 },
  },

  // 운동
  ballClass: { unlockAge: 7, cost: COST.low, effects: { ballGames: 15, sociability: 6 } },
  swimTrack: { unlockAge: 6, cost: COST.mid, effects: { trackSwim: 16, health: 8 } },
  martialClass: { unlockAge: 7, cost: COST.low, effects: { martialArts: 15, esteem: 5 } },

  // 예술
  artAcademy: { unlockAge: 6, cost: COST.mid, effects: { fineArts: 16, stress: 6 } },
  musicLesson: { unlockAge: 5, cost: COST.mid, effects: { music: 16, stress: 8 } },
  performingAcademy: {
    unlockAge: 8,
    cost: COST.mid,
    effects: { performing: 16, sociability: 5 },
  },

  // 관계
  playTogether: { unlockAge: 0, cost: COST.none, effects: { bond: 12, stress: -10 } },
  friendPlay: { unlockAge: 6, cost: COST.low, effects: { sociability: 15, stress: -12 } },
  seriousTalk: { unlockAge: 12, cost: COST.none, effects: { esteem: 12, bond: 8 } },

  // 생활
  sleep: { unlockAge: 0, cost: COST.none, effects: { stress: -15 } },
  checkup: { unlockAge: 0, cost: COST.mid, effects: { health: 8 } },
} as const satisfies Record<string, ActionBalance>;

// ---------------------------------------------------------------------------
// 계열 적합도 (설계서 §4)
//
// 계열마다 판정 방식이 다른 것이 핵심이다. 평균형과 최고값형을 섞지 말 것.
// ---------------------------------------------------------------------------

export const MAJOR_WEIGHTS = {
  /** 의약: 과학을 더 크게 본다. 두 과목을 다 끌어올려야 하는 고비용 루트 */
  medicineScience: 1.5,
  medicineMath: 1,
  medicineDivisor: 2.5,
  /** 최고값형(예술·체육): 하나만 몰아도 되는 저비용 루트 */
  peak: 0.7,
  support: 0.3,
} as const;

// ---------------------------------------------------------------------------
// 엔딩 (설계서 §11)
//
// 대학 티어와 삶의 질은 완전히 독립이다.
// 최상위권 + 배드, 비진학 + 굿이 모두 나와야 한다. 두 축을 엮는 상수를 만들지 말 것.
// ---------------------------------------------------------------------------

export const UNIVERSITY_TIERS = [
  { tier: 'top', minFit: 85, minSubjectAverage: 80 },
  { tier: 'upper', minFit: 70, minSubjectAverage: 0 },
  { tier: 'middle', minFit: 55, minSubjectAverage: 0 },
  { tier: 'vocational', minFit: 40, minSubjectAverage: 0 },
  { tier: 'none', minFit: 0, minSubjectAverage: 0 },
] as const;

/** 최고 계열과 차순위 차이가 이 값 미만이면 자유전공·복수전공으로 서술한다 */
export const UNDECIDED_MAJOR_GAP = 10;

export const LIFE_QUALITY = {
  good: { esteem: 70, bond: 60, independence: 55 },
  badDependent: { independence: 30 },
  badRelational: { esteem: 35, esteemWithLowBond: 50, bond: 30 },
} as const;
