/** 설계서 §18 밸런싱 체크리스트 자동 검증 */

import { CONSUMPTION_FIT, TURN } from '../data/balance';
import { MAJOR_IDS } from '../data/majors';
import {
  accrue,
  applyAction,
  bestMajor,
  endTurn,
  fill,
  grantAdSlot,
  isFinished,
  judge,
  overtime,
  rejectRequest,
  acceptRequest,
  rollRequest,
  spendSlot,
  stageOf,
  travel,
} from '../engine';
import { createInitialState } from '../state';
import type {
  ActionId,
  ConsumptionTier,
  Ending,
  GameState,
  MajorId,
  SubjectStat,
} from '../types';

const HOUR_MS = 3600_000;

/**
 * 한 회차를 끝까지 굴린다.
 *
 * 난수는 시드로만 들어간다. 같은 정책 + 같은 시드는 항상 같은 엔딩을 낸다 —
 * 체크리스트가 통과했다 실패했다 흔들리면 밸런싱 판단을 못 한다.
 */
export interface Policy {
  /** 이번 턴에 쓸 행동. null이면 슬롯을 남긴다 */
  pick(state: GameState, slot: number): { id: ActionId; subject?: SubjectStat } | null;
  /**
   * 요구를 어떻게 처리할지.
   *
   * `balanced`는 번갈아 처리한다. 전부 수용도 전부 거절도 배드로 가게 설계돼 있으므로
   * (설계서 §18) "잘 하는 플레이"를 흉내내려면 중간을 잡아야 한다.
   */
  onRequest?: 'accept' | 'reject' | 'ignore' | 'balanced';
  /** 매 턴 야근 여부 */
  overtimeEveryTurn?: boolean;
  /**
   * 의식주 티어. `'fit'`이면 나이에 맞는 적정 티어를 따라간다.
   *
   * 고정 티어는 "한 번 맞춰놓고 잊는" 플레이라 설계상 손해가 나야 정상이다 (설계서 §6-4).
   * 잘 하는 플레이를 흉내내려면 적정선을 따라 움직여야 한다.
   */
  tier?: ConsumptionTier | 'fit' | 'fit-high';
  /** 매 턴 여행 여부 */
  travelEveryTurn?: boolean;
  /** 매 턴 리워드 광고를 봐서 슬롯 +1. 밀어붙이는 플레이는 이걸 쓴다 (설계서 §2) */
  adSlotEveryTurn?: boolean;
}

export function play(policy: Policy, seed: number): { state: GameState; ending: Ending } {
  let state = createInitialState(seed, 0);

  while (!isFinished(state)) {
    if (policy.tier !== undefined) {
      const tier = tierFor(policy.tier, state);
      state = {
        ...state,
        consumption: { ...state.consumption, food: tier, clothing: tier, housing: tier },
      };
    }

    // 자금은 시간이 지나면 쌓인다. 턴당 상한치를 넣어 자금 부족이 결과를 흐리지 않게 한다.
    state = accrue({ ...state, lastSeenAt: 0 }, HOUR_MS * 12);

    if (policy.adSlotEveryTurn === true) state = grantAdSlot(state);

    if (state.pendingRequest !== null) {
      const mode = policy.onRequest ?? 'ignore';
      const accepting = mode === 'accept' || (mode === 'balanced' && state.age % 2 === 0);

      if (mode !== 'ignore') {
        state = accepting
          ? spendSlot(acceptRequest(state, state.pendingRequest))
          : rejectRequest(state, state.pendingRequest);
      }
    }

    if (policy.overtimeEveryTurn === true && state.slots > 0) {
      state = spendSlot(overtime(state));
    }

    if (policy.travelEveryTurn === true && state.slots > 0) {
      state = spendSlot(travel(state, tierFor(policy.tier ?? 1, state), stageOf(state.age)));
    }

    // 니즈는 슬롯을 쓰지 않는 경로가 없다. 시뮬레이션에서는 채우지 않고,
    // 대신 성장 보너스가 0에 가까워지지 않도록 턴 시작 시 한 번만 채워준다.
    state = fill(fill(state, 'hunger'), 'hygiene');

    let slot = 0;
    while (state.slots > 0) {
      const choice = policy.pick(state, slot);
      if (choice === null) break;

      const result = applyAction(state, choice.id, choice.subject);
      state = spendSlot(result.state);
      slot += 1;
    }

    state = rollRequest(endTurn(state)).state;
  }

  return { state, ending: judge(state) };
}

// ---------------------------------------------------------------------------
// 정책 몇 가지
// ---------------------------------------------------------------------------

function tierFor(setting: NonNullable<Policy['tier']>, state: GameState): ConsumptionTier {
  const range = CONSUMPTION_FIT[stageOf(state.age)];

  // 적정 구간 안에서도 위아래가 있다. 아래쪽은 싸고, 위쪽은 집의 학습 효율 보너스를 받는다.
  if (setting === 'fit') return range[0];
  if (setting === 'fit-high') return range[1];
  return setting;
}

/** 스트레스가 한계로 가면 육성 행동이 전부 실패한다. 잘 하는 플레이는 이걸 관리한다 */
const NEEDS_REST = 55;

const idle: Policy['pick'] = () => null;

/** 재능을 무시하고 교과만 민다 */
const subjectGrind: Policy['pick'] = (state) => {
  if (state.age >= 16) return { id: 'examAcademy' };
  if (state.age >= 8) return { id: 'cramSchool', subject: 'math' };
  if (state.age >= 6) return { id: 'workbook', subject: 'math' };
  if (state.age >= 5) return { id: 'reading' };
  return { id: 'playTogether' };
};

/** 관계만 쌓는다. 학원은 하나도 안 보낸다 */
const relationOnly: Policy['pick'] = (state) => {
  if (state.age >= 12) return { id: 'seriousTalk' };
  if (state.age >= 6) return { id: 'friendPlay' };
  return { id: 'playTogether' };
};

/** 계열별로 밀어붙이는 정책 */
/**
 * 평균형 계열은 여러 과목을 돌려야 하고 최고값형은 하나만 밀면 된다.
 * 정책이 이걸 반영하지 않으면 "계열 도달 불가"가 아니라 "정책이 틀린 것"이 된다.
 */
function majorPush(major: MajorId): Policy['pick'] {
  const rotate = <T,>(options: readonly T[], turn: number): T =>
    options[turn % options.length] ?? options[0]!;

  return (state, slot) => {
    if (state.age < 5) return { id: 'playTogether' };
    if (state.stats.stress > NEEDS_REST) return { id: 'sleep' };

    const turn = state.age + slot;

    switch (major) {
      case 'humanities':
        // 국어·영어·사회 평균이라 셋을 돌려야 한다
        return rotate(
          [
            { id: 'reading' } as const,
            { id: 'langAcademy' } as const,
            { id: 'workbook', subject: 'socialStudies' } as const,
          ],
          turn,
        );

      case 'engineering':
        // 수학·과학 평균. 한쪽만 올리면 의약에 밀린다
        return state.age >= 9 && turn % 2 === 0
          ? { id: 'scienceLab' }
          : { id: 'workbook', subject: 'math' };

      case 'commerce':
        return rotate(
          [
            { id: 'workbook', subject: 'math' } as const,
            { id: 'workbook', subject: 'socialStudies' } as const,
            { id: 'friendPlay' } as const,
          ],
          turn,
        );

      case 'medicine':
        // 과학 가중치가 1.5라 과학을 확실히 앞세워야 한다.
        // 수학까지 100으로 올리면 자연공학과 동점이 되고, 동점이면 자연공학이 이긴다.
        return state.age >= 9 ? { id: 'scienceLab' } : { id: 'workbook', subject: 'science' };

      case 'arts':
        return state.age >= 6 ? { id: 'artAcademy' } : { id: 'musicLesson' };

      case 'sports':
        return state.age >= 7 ? { id: 'ballClass' } : { id: 'playTogether' };
    }
  };
}

const ALL_SUBJECTS: readonly SubjectStat[] = [
  'korean',
  'english',
  'math',
  'science',
  'socialStudies',
];

/**
 * 과부하 구간(61~85)은 성장이 절반이다. 그 아래(피로, −20%)를 유지하는 편이 총량이 크다.
 * 한계 직전까지 버티는 쪽이 이득일 것 같지만, 슬롯을 다 쓰고도 성장이 반토막이라 손해다.
 */
const LIMIT_MARGIN = 58;

/**
 * 입시에 성공하는 플레이.
 *
 * 한 과목만 밀면 교과 평균이 안 오르므로 매번 가장 낮은 과목을 민다.
 * 쉬는 문턱도 55가 아니라 78이다 — 55에서 쉬면 슬롯 절반이 수면으로 나가서
 * 최상위권 조건(계열 85 + 교과 평균 80)에 물리적으로 못 닿는다.
 */
const topStudent: Policy['pick'] = (state) => {
  if (state.stats.stress > LIMIT_MARGIN) return { id: 'sleep' };

  const subject = ALL_SUBJECTS.reduce((weakest, key) =>
    state.stats[key] < state.stats[weakest] ? key : weakest,
  );

  if (state.age >= 8) return { id: 'cramSchool', subject };
  if (state.age >= 6) return { id: 'workbook', subject };
  if (state.age >= 5) return { id: 'reading' };
  return { id: 'playTogether' };
};

/**
 * 학업만 밀어붙이고 관계는 한 번도 쌓지 않는 플레이.
 *
 * 유아기에도 함께 놀아주지 않는다 — 이 시기 애착이 없어야 대학 티어와 삶의 질이
 * 실제로 갈라진다. 갈라지지 않으면 "좋은 대학 = 좋은 인생"을 말하는 게임이 된다 (설계서 §11).
 */
const pressureCooker: Policy['pick'] = (state) => {
  if (state.stats.stress > LIMIT_MARGIN) return { id: 'sleep' };

  const subject = ALL_SUBJECTS.reduce((weakest, key) =>
    state.stats[key] < state.stats[weakest] ? key : weakest,
  );

  if (state.age >= 16) return { id: 'examAcademy' };
  if (state.age >= 8) return { id: 'cramSchool', subject };
  if (state.age >= 6) return { id: 'workbook', subject };
  if (state.age >= 5) return { id: 'reading' };
  return { id: 'checkup' };
};

// ---------------------------------------------------------------------------
// 체크리스트
// ---------------------------------------------------------------------------

export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const SEEDS = [1, 7, 42, 99, 1234];

const anySeed = (run: (seed: number) => boolean): boolean => SEEDS.some(run);
const everySeed = (run: (seed: number) => boolean): boolean => SEEDS.every(run);

export function runChecklist(): CheckResult[] {
  const results: CheckResult[] = [];

  const check = (name: string, passed: boolean, detail: string): void => {
    results.push({ name, passed, detail });
  };

  // 1
  const acceptAll = SEEDS.map((s) => play({ pick: subjectGrind, onRequest: 'accept' }, s).ending);
  const rejectAll = SEEDS.map((s) => play({ pick: subjectGrind, onRequest: 'reject' }, s).ending);
  const isBad = (e: Ending): boolean => e.quality.startsWith('bad');
  check(
    '요구를 전부 들어준 플레이와 전부 거절한 플레이가 둘 다 배드엔딩인가',
    acceptAll.every(isBad) && rejectAll.every(isBad),
    `수용 ${acceptAll.filter(isBad).length}/${SEEDS.length}, 거절 ${rejectAll.filter(isBad).length}/${SEEDS.length}`,
  );

  // 2
  const overtimeOnly = SEEDS.map((s) => play({ pick: idle, overtimeEveryTurn: true }, s).ending);
  check(
    '매 턴 야근만 하는 플레이가 배드엔딩으로 가는가',
    overtimeOnly.every(isBad),
    `${overtimeOnly.filter(isBad).length}/${SEEDS.length}`,
  );

  // 3
  check(
    '야근을 한 번도 안 해도 게임이 완주되는가',
    everySeed((s) => play({ pick: subjectGrind }, s).state.age === TURN.finalAge),
    '19세 도달',
  );

  // 4
  const luxury = SEEDS.map((s) => play({ pick: subjectGrind, tier: 4 }, s).ending);
  check(
    '모든 티어를 T4로 유지하면 자립성 배드엔딩으로 가는가',
    luxury.every((e) => e.quality === 'badDependent'),
    `${luxury.filter((e) => e.quality === 'badDependent').length}/${SEEDS.length}`,
  );

  // 5 · 6
  const fixedT4 = play({ pick: topStudent, tier: 4 }, 1).state;
  const fixedT1 = play({ pick: topStudent, tier: 1 }, 1).state;
  const following = play({ pick: topStudent, tier: 'fit' }, 1).state;
  check(
    '유아기에 T4를 유지하면 확실히 손해인가',
    fixedT4.stats.independence < following.stats.independence,
    `자립성 T4고정 ${fixedT4.stats.independence.toFixed(1)} < 적정추종 ${following.stats.independence.toFixed(1)}`,
  );
  check(
    '고등기에 T1을 유지하면 확실히 손해인가',
    fixedT1.stats.esteem < following.stats.esteem,
    `자존감 T1고정 ${fixedT1.stats.esteem.toFixed(1)} < 적정추종 ${following.stats.esteem.toFixed(1)}`,
  );

  // 7
  check(
    '최상위권 대학 + 배드엔딩이 실제로 나오는가',
    anySeed((s) => {
      const e = play(
        { pick: pressureCooker, onRequest: 'reject', tier: 'fit-high', adSlotEveryTurn: true },
        s,
      ).ending;
      return e.tier === 'top' && isBad(e);
    }),
    '입시 성공 + 관계 없음 + 요구 전부 거절',
  );

  // 8
  check(
    '비진학 + 굿엔딩이 실제로 나오는가',
    anySeed((s) => {
      const e = play({ pick: relationOnly, onRequest: 'balanced', tier: 'fit' }, s).ending;
      return e.tier === 'none' && e.quality === 'good';
    }),
    '관계만 쌓는 플레이',
  );

  // 9
  const reached = new Set<MajorId>();
  for (const major of MAJOR_IDS) {
    for (const seed of SEEDS) {
      const e = play({ pick: majorPush(major), tier: 'fit' }, seed).ending;
      if (e.major === major && e.tier !== 'none') reached.add(major);
    }
  }
  check(
    '6계열 엔딩에 모두 도달 가능한가',
    reached.size === MAJOR_IDS.length,
    `도달 ${[...reached].join(', ') || '없음'}`,
  );

  // 10
  check(
    '화면 등급 표시와 엔딩 판정 결과가 어긋나지 않는가',
    everySeed((s) => {
      const { state, ending } = play({ pick: majorPush('arts'), tier: 'fit' }, s);
      const best = bestMajor(state.stats);
      return best.major === ending.major;
    }),
    '스탯 서랍의 최고 계열 = 엔딩 학과',
  );

  // 재능 관련 (§18 추가 항목)
  check(
    '재능과 무관한 계열로 밀어붙여도 완주는 되는가',
    everySeed((s) => play({ pick: subjectGrind }, s).state.age === TURN.finalAge),
    '불일치 페널티가 진행을 막지 않는다',
  );

  const tiers = new Set(
    SEEDS.map((s) => play({ pick: majorPush('arts'), tier: 'fit' }, s).ending.tier),
  );
  check(
    '어떤 재능 조합으로 시작해도 상위권 이상 엔딩이 나올 수 있는가',
    [...tiers].some((t) => t === 'top' || t === 'upper'),
    `나온 티어: ${[...tiers].join(', ')}`,
  );

  return results;
}
