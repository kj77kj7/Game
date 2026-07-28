/**
 * 아이키우기 — 상태 대사 세트
 *
 * 위치: src/core/data/dialogue.ts
 * 의존성 없음. 순수 데이터 + 순수 함수.
 *
 * 원칙
 * - 모든 상태 알림은 수치나 아이콘이 아니라 아이의 대사로 전달한다.
 * - 한 턴에 하나만 노출한다. 여러 개를 띄우면 해석 부담이 생긴다.
 * - 같은 상태라도 나이대에 따라 말투가 달라야 한다.
 */

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

/** 말투가 달라지는 구간. 스탯 구간과는 별개다. */
export type AgeBand = 'toddler' | 'child' | 'teen';

export const AGE_BANDS: { band: AgeBand; min: number; max: number }[] = [
  { band: 'toddler', min: 0, max: 5 },
  { band: 'child', min: 6, max: 12 },
  { band: 'teen', min: 13, max: 19 },
];

export function bandOf(age: number): AgeBand {
  return AGE_BANDS.find((b) => age >= b.min && age <= b.max)?.band ?? 'teen';
}

/** 대사 선택에 필요한 최소 상태. GameState에서 뽑아 넘긴다. */
export interface DialogueContext {
  age: number;

  // 돌봄 레이어 (실시간)
  hunger: number;      // 0~100, 낮을수록 배고픔
  hygiene: number;     // 0~100, 낮을수록 지저분함

  // 기질
  stress: number;      // 0~100, 높을수록 나쁨
  esteem: number;      // 0~100
  independence: number; // 0~100
  bond: number;        // 0~100

  // 소비 (적정선 대비 이탈도. -2 ~ +2, 0이 적정)
  consumptionGap: number;

  /** 적성 계열과 최근 행동이 일치했는지 */
  aptitudeMatch: 'match' | 'mismatch' | 'neutral';
}

export interface DialogueEntry {
  id: string;
  /** 클수록 먼저. 요구 이벤트는 이 시스템 밖에서 항상 최우선 처리된다. */
  priority: number;
  when: (c: DialogueContext) => boolean;
  lines: Record<AgeBand, string[]>;
}

// ---------------------------------------------------------------------------
// 우선순위 기준
//
//   90  한계 상태
//   70  돌봄 니즈 (허기 / 청결)
//   60  기질 경고 (자립성 / 자존감 / 애착)
//   50  소비 이탈
//   40  적성 반응
//   20  긍정 상태
//   10  일상 (조건 없음, 폴백)
// ---------------------------------------------------------------------------

export const DIALOGUE: DialogueEntry[] = [
  // -------------------------------------------------------------------------
  // 한계 상태
  // -------------------------------------------------------------------------
  {
    id: 'stress_critical',
    priority: 90,
    when: (c) => c.stress >= 86,
    lines: {
      toddler: ['이제 그만할래요…', '집에 있고 싶어요.', '싫어요. 안 갈래요.'],
      child: [
        '아무것도 하기 싫어요.',
        '하루만 쉬면 안 돼요?',
        '요즘 계속 머리가 아파요.',
      ],
      teen: [
        '…그냥 좀 내버려두면 안 돼요?',
        '됐어요. 얘기하고 싶지 않아요.',
        '아무것도 하기 싫어요.',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // 돌봄 니즈
  // -------------------------------------------------------------------------
  {
    id: 'hunger_low',
    priority: 70,
    when: (c) => c.hunger < 30,
    lines: {
      toddler: ['배고파요…', '밥 언제 먹어요?', '배에서 소리 나요.'],
      child: ['오늘 저녁 뭐예요?', '배고파 죽겠어요.', '간식 같은 거 없어요?'],
      teen: ['…밥은요?', '먹을 거 없어요?', '배고픈데.'],
    },
  },
  {
    id: 'hygiene_low',
    priority: 68,
    when: (c) => c.hygiene < 30,
    lines: {
      toddler: ['찝찝해요.', '씻을래요!', '손이 끈적끈적해요.'],
      child: ['머리 감고 싶어요.', '옷에서 냄새나는 것 같아요.', '씻어도 돼요?'],
      teen: ['…씻고 올게요.', '샴푸 다 썼어요.', '옷 좀 빨아주세요.'],
    },
  },

  // -------------------------------------------------------------------------
  // 기질 경고
  // -------------------------------------------------------------------------
  {
    id: 'independence_low',
    priority: 62,
    when: (c) => c.independence < 30,
    lines: {
      toddler: ['이거 해주세요.', '혼자 못 해요.', '엄마가 해줘요.'],
      child: [
        '이거 어떻게 해요? 대신 해주면 안 돼요?',
        '저는 잘 모르겠어요. 정해주세요.',
        '알아서 해주시면 안 돼요?',
      ],
      teen: [
        '몰라요. 아무거나요.',
        '그냥 알아서 해주세요.',
        '제가 정하는 건 좀…',
      ],
    },
  },
  {
    id: 'esteem_low',
    priority: 61,
    when: (c) => c.esteem < 30,
    lines: {
      toddler: ['잘 못하겠어요…', '저는 못해요.'],
      child: [
        '친구들이 저보다 훨씬 잘해요.',
        '저는 잘하는 게 없는 것 같아요.',
        '어차피 해도 안 될 것 같은데요.',
      ],
      teen: [
        '저는 별로예요.',
        '기대 안 하셔도 돼요.',
        '어차피 안 될 텐데요.',
      ],
    },
  },
  {
    id: 'bond_low',
    priority: 60,
    when: (c) => c.bond < 30,
    lines: {
      toddler: ['같이 있고 싶어요.', '어디 가요? 가지 마요.'],
      child: [
        '엄마 아빠는 항상 바쁘잖아요.',
        '말해도 안 들어주시잖아요.',
        '오늘도 늦게 오세요?',
      ],
      teen: [
        '…별로 할 말 없어요.',
        '됐어요. 신경 안 쓰셔도 돼요.',
        '왜 갑자기 물어보세요?',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // 소비 이탈
  // -------------------------------------------------------------------------
  {
    id: 'consumption_lack',
    priority: 52,
    when: (c) => c.consumptionGap <= -1,
    lines: {
      toddler: ['저것도 갖고 싶어요.', '친구는 있는데…'],
      child: [
        '친구들은 다 있는데…',
        '저만 없어요.',
        '애들이 물어봤는데 말 못 했어요.',
      ],
      teen: [
        '…아니에요. 괜찮아요.',
        '그냥 됐어요. 안 사도 돼요.',
        '별로 필요 없어요, 진짜로.',
      ],
    },
  },
  {
    id: 'consumption_excess',
    priority: 50,
    when: (c) => c.consumptionGap >= 2,
    lines: {
      toddler: ['이거 말고 다른 거!', '새 거 사줘요.'],
      child: [
        '이거 말고 더 좋은 건 없어요?',
        '이건 좀 별로예요.',
        '지난번 거가 더 좋았는데.',
      ],
      teen: [
        '이 브랜드는 애들이 안 입어요.',
        '다른 걸로 바꿔주면 안 돼요?',
        '이건 좀 아닌 것 같은데요.',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // 적성 반응
  // -------------------------------------------------------------------------
  {
    id: 'aptitude_mismatch',
    priority: 42,
    when: (c) => c.aptitudeMatch === 'mismatch',
    lines: {
      toddler: ['이거 재미없어요.', '다른 거 하면 안 돼요?'],
      child: [
        '이거 왜 해야 하는지 모르겠어요.',
        '재미없어요. 계속 해야 돼요?',
        '저는 이거 잘 안 맞는 것 같아요.',
      ],
      teen: [
        '이거 계속 해야 돼요?',
        '솔직히 저랑 안 맞아요.',
        '그만두면 안 돼요?',
      ],
    },
  },
  {
    id: 'aptitude_match',
    priority: 40,
    when: (c) => c.aptitudeMatch === 'match',
    lines: {
      toddler: ['이거 재밌어요!', '또 하고 싶어요!'],
      child: [
        '이거 진짜 재밌어요!',
        '오늘도 이거 해도 돼요?',
        '선생님이 저 잘한대요!',
      ],
      teen: [
        '이건 좀 할 만해요.',
        '이거 계속 하고 싶어요.',
        '이쪽으로 가볼까 생각 중이에요.',
      ],
    },
  },

  // -------------------------------------------------------------------------
  // 긍정 상태
  // -------------------------------------------------------------------------
  {
    id: 'independence_high',
    priority: 24,
    when: (c) => c.independence >= 75,
    lines: {
      toddler: ['제가 할래요!', '혼자 할 수 있어요!'],
      child: ['괜찮아요, 제가 해볼게요.', '이번엔 제가 정할래요.'],
      teen: ['제가 알아서 할게요.', '생각해둔 거 있어요.'],
    },
  },
  {
    id: 'bond_high',
    priority: 22,
    when: (c) => c.bond >= 75,
    lines: {
      toddler: ['같이 있으니까 좋아요.', '오늘도 같이 놀아요!'],
      child: [
        '오늘 학교에서 있었던 일 얘기해도 돼요?',
        '주말에 같이 어디 가요.',
      ],
      teen: ['오늘 좀 힘들었어요. 얘기 좀 해도 돼요?', '…고마워요.'],
    },
  },
  {
    id: 'esteem_high',
    priority: 20,
    when: (c) => c.esteem >= 75,
    lines: {
      toddler: ['제가 제일 잘해요!', '봐요, 이거 제가 했어요!'],
      child: ['다음엔 더 잘할 수 있어요.', '이건 제가 제일 자신 있어요.'],
      teen: ['이번엔 자신 있어요.', '해볼 만한 것 같아요.'],
    },
  },

  // -------------------------------------------------------------------------
  // 일상 (폴백)
  // -------------------------------------------------------------------------
  {
    id: 'idle',
    priority: 10,
    when: () => true,
    lines: {
      toddler: ['오늘 뭐 해요?', '놀아주세요!', '심심해요.'],
      child: ['다녀왔습니다!', '오늘 급식 맛있었어요.', '숙제 다 했어요.'],
      teen: ['…다녀왔어요.', '오늘 별일 없었어요.', '숙제 있어요.'],
    },
  },
];

// ---------------------------------------------------------------------------
// 선택 로직
// ---------------------------------------------------------------------------

/**
 * 조건을 만족하는 대사 중 우선순위가 가장 높은 것을 하나 고른다.
 *
 * @param ctx  현재 아이 상태
 * @param rand 0 이상 1 미만의 난수. 시드 기반 난수를 주입해 재현성을 확보한다.
 */
export function selectDialogue(ctx: DialogueContext, rand: number): string {
  const band = bandOf(ctx.age);

  const matched = DIALOGUE.filter((d) => d.when(ctx));
  if (matched.length === 0) return '';

  const top = matched.reduce((a, b) => (b.priority > a.priority ? b : a));
  const pool = top.lines[band];
  if (!pool || pool.length === 0) return '';

  return pool[Math.floor(rand * pool.length) % pool.length];
}

/** 직전에 나온 대사를 피해 연속 반복을 막는다. */
export function selectDialogueAvoiding(
  ctx: DialogueContext,
  rand: number,
  previous: string | null,
): string {
  const first = selectDialogue(ctx, rand);
  if (first !== previous) return first;

  const band = bandOf(ctx.age);
  const matched = DIALOGUE.filter((d) => d.when(ctx));
  if (matched.length === 0) return first;

  const top = matched.reduce((a, b) => (b.priority > a.priority ? b : a));
  const pool = top.lines[band].filter((l) => l !== previous);

  return pool.length > 0 ? pool[Math.floor(rand * pool.length) % pool.length] : first;
}
