/** 색·간격·타이포·표기 토큰 */

// 현대 한국 배경이라 90년대 판타지 셀화풍 톤은 쓰지 않는다.
// 플랫한 캐주얼 쪽으로 잡았다 — 토스 앱 톤과 어긋나지 않아 검수·UI 일관성에 유리하다 (설계서 §14).

export const color = {
  bg: '#F4F5F7',
  surface: '#FFFFFF',
  line: '#E5E8EB',

  text: '#191F28',
  textWeak: '#6B7684',
  textInverse: '#FFFFFF',

  accent: '#3182F6',
  up: '#F04452',
  down: '#3182F6',

  hunger: '#FF9F43',
  hygiene: '#4DC9E6',
  mood: '#7C5CFC',

  /** 캐릭터 플레이스홀더. 아트가 나오면 통째로 교체된다 */
  skin: '#FFD8B1',
  clothTop: '#5B8DEF',
  clothBottom: '#3D4C63',
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
