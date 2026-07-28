/** GameState 및 공용 타입 */

import type {
  ACTION_BALANCE,
  AGE_STAGES,
  CONSUMPTION_BALANCE,
  REQUEST_BALANCE,
  STRESS_BANDS,
  UPGRADE_BALANCE,
} from './data/balance';

// balance.ts와는 타입만 주고받는다. 런타임 import가 아니라서 순환하지 않는다.
// 수치는 balance.ts에만 두고, 그 수치가 무슨 모양인지는 여기에만 둔다.

// ---------------------------------------------------------------------------
// 스탯
// ---------------------------------------------------------------------------

/** 교과 5종 */
export type SubjectStat = 'korean' | 'english' | 'math' | 'science' | 'socialStudies';

/** 운동 3종 */
export type SportStat = 'ballGames' | 'trackSwim' | 'martialArts';

/** 예술 3종 */
export type ArtStat = 'fineArts' | 'music' | 'performing';

/** 재능이 걸릴 수 있는 세부 분야 11종 (설계서 §9) */
export type TalentField = SubjectStat | SportStat | ArtStat;

/** 기질 5종 */
export type TemperamentStat =
  | 'health'
  | 'sociability'
  | 'esteem'
  | 'independence'
  | 'stress';

export type StatKey = TalentField | TemperamentStat;

/** 실시간으로 감소하는 돌봄 니즈. `기분`은 여기 없다 — 스트레스의 표시 등급이다 (설계서 §3-5) */
export type NeedKey = 'hunger' | 'hygiene';

/** 행동·요구·소비가 만드는 증감. 자금은 별도 필드로 다룬다 */
export type StatDelta = Partial<Record<StatKey | 'bond', number>>;

// ---------------------------------------------------------------------------
// 구간
// ---------------------------------------------------------------------------

export type AgeStage = (typeof AGE_STAGES)[number]['stage'];

/** 스트레스 구간. 화면에는 `기분`으로 뒤집어 표기한다 (설계서 §8) */
export type StressBand = (typeof STRESS_BANDS)[number]['band'];

// ---------------------------------------------------------------------------
// 테이블 키
// ---------------------------------------------------------------------------

export type ActionId = keyof typeof ACTION_BALANCE;
export type RequestId = keyof typeof REQUEST_BALANCE;
export type UpgradeId = keyof typeof UPGRADE_BALANCE;
export type ConsumptionCategory = keyof typeof CONSUMPTION_BALANCE;
export type ConsumptionTier = 1 | 2 | 3 | 4;

export type MajorId =
  | 'humanities'
  | 'engineering'
  | 'commerce'
  | 'medicine'
  | 'arts'
  | 'sports';

// ---------------------------------------------------------------------------
// 테이블 모양
// ---------------------------------------------------------------------------

/**
 * 대상 과목이 고정되지 않은 행동이 있다.
 * `chosen`은 플레이어가 고르고, `topSubject`는 그 시점 최고 교과가 자동 선택된다.
 */
export type DynamicTarget = 'chosen' | 'topSubject';

export interface ActionBalance {
  unlockAge: number;
  cost: number;
  effects: StatDelta;
  dynamic?: { pick: DynamicTarget; delta: number };
}

export interface RequestBalance {
  minAge: number;
  maxAge: number;
  /** 수용 시 드는 자금 */
  cost: number;
  accept: StatDelta;
  reject: StatDelta;
  /** 수용하면 그 턴 교과 성장이 멈추는가 (학원 그만두기) */
  stallsSubjects?: boolean;
}

export interface UpgradeBalance {
  baseCost: number;
  growth: number;
  maxLevel: number;
  /** 레벨당 초당 수급 가산 */
  flatPerLevel?: number;
  /** 레벨당 초당 수급 배율 */
  multiplierPerLevel?: number;
  /** 레벨당 오프라인 누적 상한 시간 */
  capHoursPerLevel?: number;
  /** 해금 조건 */
  requires?: { id: string; level: number };
}

export interface ConsumptionBalance {
  /** 티어별 비용. 지속 설정은 매 턴 유지비, 여행은 일시불 */
  cost: readonly [number, number, number, number];
  /** 슬롯을 소모하는가. 여행만 소모한다 (설계서 §6-4) */
  usesSlot: boolean;
  /** 적정 티어일 때의 효과 */
  fitEffects: StatDelta;
}

// ---------------------------------------------------------------------------
// 엔딩
// ---------------------------------------------------------------------------

export type UniversityTier = 'top' | 'upper' | 'middle' | 'vocational' | 'none';

export type LifeQuality = 'good' | 'normal' | 'badRelational' | 'badDependent';

export interface Ending {
  tier: UniversityTier;
  major: MajorId;
  /** 최고 계열과 차순위 차이가 작으면 자유전공·복수전공으로 서술한다 */
  undecided: boolean;
  quality: LifeQuality;
}

// ---------------------------------------------------------------------------
// 게임 상태
// ---------------------------------------------------------------------------

export interface GameState {
  /** 0~19. 1턴 = 1년, 19세는 판정 턴 */
  age: number;
  /** 이번 턴에 남은 슬롯 */
  slots: number;
  /** 시드 기반 난수의 현재 시드. 재현 가능한 밸런싱을 위해 상태에 포함한다 */
  seed: number;

  stats: Record<StatKey, number>;
  needs: Record<NeedKey, number>;

  funds: number;
  bond: number;

  /** 시작 시 부여된 재능 2종. 서로 다른 분야 */
  talents: readonly [TalentField, TalentField];

  /** 행동별 누적 횟수. 반복 등급 산출용 */
  actionCounts: Partial<Record<ActionId, number>>;
  /** 재능 밖 육성 행동의 누적 횟수. 불일치 페널티 판정용 */
  mismatchCount: number;

  consumption: Record<ConsumptionCategory, ConsumptionTier>;
  upgrades: Record<UpgradeId, number>;

  /** 대기 중인 요구. 실시간 타이머는 걸지 않는다 — 다음 턴 넘기기 전까지 유효 (설계서 §5) */
  pendingRequest: RequestId | null;

  /** 연속 야근 횟수. 야근을 안 한 턴에 0으로 돌아간다 */
  overtimeStreak: number;
  /** 마지막 여행 이후 지난 턴 수 */
  turnsSinceTravel: number;

  /** 오프라인 수급 계산용. epoch ms */
  lastSeenAt: number;
}
