/** 색·간격·타이포·표기 토큰 */

// 프린세스 메이커에서 가져오는 것은 '장르 문법'뿐이다 (조사 문서 §2-1).
// 초상화가 화면 중앙에서 감정 앵커 역할을 하고 그 주변에 정보가 붙는 배치는 관습이라 계승하고,
// 색 배합·아이콘 형태·캐릭터 조형은 전부 새로 짠다. 그게 오마주와 표절을 가르는 선이다.
//
// 팔레트는 3~5색으로 제한하고 채도를 낮춘 웜 뉴트럴로 잡았다 (조사 문서 §2-2).
// 90년대 셀화풍 원색은 현대 한국 배경과 톤이 맞지 않는다는 설계서 §14와도 이 방향이 맞는다.
// 색 수를 줄이면 아트가 없는 지금도 화면이 덜 조잡해 보이고, 나중에 일러스트가 들어와도
// UI가 그림을 이기지 않는다.

export const color = {
  bg: '#F5F1EA',
  surface: '#FFFDF9',
  line: '#E3DDD2',

  text: '#2E2A26',
  textWeak: '#8A8177',
  textInverse: '#FFFDF9',

  /** 액센트는 하나만 쓴다. 두 개 이상이면 무엇이 중요한지 화면이 말해주지 못한다 */
  accent: '#C6714B',
  accentSoft: '#EADFD3',

  hunger: '#D69A5C',
  hygiene: '#8FAFA6',
  mood: '#A98BA5',

  /** 캐릭터 플레이스홀더. 아트가 나오면 이 값들만 갈아끼운다 */
  skin: '#F0D5BC',
  hair: '#4A3B33',
  blush: '#E0A894',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const font = {
  caption: 12,
  body: 14,
  title: 18,
  display: 24,
} as const;

/**
 * 스탯 표기 이름. `stress`는 화면에서 `기분`으로 뒤집어 부른다 (설계서 §8).
 * 세부 분야 11종의 이름은 core/data/talents.ts에 있고, 여기에는 기질과 자원만 둔다.
 */
export const STAT_LABEL = {
  health: '건강',
  sociability: '사회성',
  esteem: '자존감',
  independence: '자립성',
  stress: '기분',
  bond: '사이',
} as const;

/**
 * 하단 메뉴 표기. 아이콘만 두지 않고 반드시 라벨을 병기한다.
 *
 * 프린세스 메이커 UI의 대표적 약점이 '라벨 없는 아이콘'이라 처음 접하면
 * 무슨 기능인지 알 수 없다는 지적이었다 (조사 문서 §1-3, §2-3).
 * 튜토리얼을 폐기한 설계(§19)에서는 라벨이 유일한 온보딩 수단이다.
 */
export const MENU_LABEL = {
  meal: { icon: '🍚', label: '밥' },
  wardrobe: { icon: '👕', label: '옷장' },
  talk: { icon: '💬', label: '대화' },
  schedule: { icon: '📅', label: '일정' },
  next: { icon: '→', label: '다음 해' },
} as const;
